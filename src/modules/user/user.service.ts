import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserDoc } from 'src/database/schemas/user.schema';
import { HolidaysDoc } from 'src/database/schemas/holidays.schema';
import { AttendanceDoc } from 'src/database/schemas/attendance.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserDoc.name) private readonly userModel: Model<UserDoc>,
    @InjectModel(HolidaysDoc.name) private readonly holidayModel: Model<HolidaysDoc>,
    @InjectModel(AttendanceDoc.name) private readonly attendanceModel: Model<AttendanceDoc>,
  ) {}

  /**
   * Change user's password (updates only `password` field).
   * @param userKey - _id of the user document
   * @param newPassword - plain text new password
   */
  async changePassword(userKey: string, newPassword: string) {
    if (!userKey) {
      throw new BadRequestException('userKey is required');
    }
    if (!newPassword || String(newPassword).length < 6) {
      throw new BadRequestException('newPassword must be at least 6 characters');
    }
    
    // Check user exists
    const userDoc = await this.userModel.findById(userKey);
    if (!userDoc) {
      throw new NotFoundException(`User with key ${userKey} not found`);
    }

    // Hash the new password
    const hashed = await bcrypt.hash(String(newPassword), 10);

    // Update only the password field
    await this.userModel.findByIdAndUpdate(userKey, {
      password: hashed,
      modifiedDate: new Date().toISOString(),
    });
    
    return {
      message: 'Password changed successfully',
      statusCode: 200,
      data: {
        userKey,
      },
    };
  }

  async getUserCalendar(userKey: string, year: number) {
    if (!year || year < 2000) {
      throw new Error('Invalid year');
    }

    const yearPrefix = `${year}-`;

    /* --------------------------------------------------
     1️⃣ Fetch holidays
    -------------------------------------------------- */
    const holidays = await this.holidayModel.find({
      date: { $regex: new RegExp(`^${yearPrefix}`) },
    }).lean();

    const holidayMap = new Map<string, { name: string; type: string }>();

    for (const h of holidays) {
      const dateKey = h.date.split('T')[0];
      holidayMap.set(dateKey, {
        name: h.name,
        type: h.type ?? 'NATIONAL',
      });
    }

    /* --------------------------------------------------
     2️⃣ Fetch attendance
    -------------------------------------------------- */
    const punches = await this.attendanceModel.find({
      userKey,
      punchDate: { $regex: new RegExp(`^${yearPrefix}`) },
      isActive: true,
    }).lean();

    // Group punches by date (YYYY-MM-DD)
    const attendanceMap = new Map<string, { punchIn?: string; punchOut?: string; totalMinutes?: number }>();
    for (const p of punches) {
      const dateKey = p.punchDate.split('T')[0];
      if (!attendanceMap.has(dateKey)) {
        attendanceMap.set(dateKey, {});
      }
      const dayData = attendanceMap.get(dateKey)!;
      if (p.punchType === '1') {
        dayData.punchIn = p.punchTime;
      } else if (p.punchType === '2') {
        dayData.punchOut = p.punchTime;
      }
    }

    // Compute total minutes for days that have both check-in and check-out
    for (const [dateKey, dayData] of attendanceMap.entries()) {
      if (dayData.punchIn && dayData.punchOut) {
        try {
          const inTime = new Date(dayData.punchIn).getTime();
          const outTime = new Date(dayData.punchOut).getTime();
          if (outTime > inTime) {
            dayData.totalMinutes = Math.floor((outTime - inTime) / (1000 * 60));
          } else {
            dayData.totalMinutes = 0;
          }
        } catch {
          dayData.totalMinutes = 0;
        }
      } else {
        dayData.totalMinutes = 0;
      }
    }

    /* --------------------------------------------------
     3️⃣ Build calendar MAP
    -------------------------------------------------- */
    const data: Record<string, any> = {};

    for (let month = 1; month <= 12; month++) {
      const daysInMonth = new Date(year, month, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(Date.UTC(year, month - 1, day));
        const date = dateObj.toISOString().split('T')[0];

        const weekDay = dateObj
          .toLocaleDateString('en-US', { weekday: 'long' })
          .toUpperCase();

        const isWeekend = weekDay === 'SUNDAY';

        const holiday = holidayMap.get(date);
        const attendanceData = attendanceMap.get(date);

        data[date] = {
          date,
          day: weekDay,
          isHoliday: !!holiday || isWeekend,
          holidayName: holiday
            ? holiday.name
            : isWeekend
            ? 'Weekend'
            : null,
          holidayType: holiday
            ? holiday.type
            : isWeekend
            ? 'WEEKOFF'
            : null,
          isWeekend,
          punch: attendanceData
            ? {
                punchIn: attendanceData.punchIn || null,
                punchOut: attendanceData.punchOut || null,
                totalMinutes: attendanceData.totalMinutes || 0,
                duration: `${Math.floor((attendanceData.totalMinutes || 0) / 60)}h ${(attendanceData.totalMinutes || 0) % 60}m`,
              }
            : null,
        };
      }
    }

    /* --------------------------------------------------
     4️⃣ Final response
    -------------------------------------------------- */
    return {
      message: 'User Calendar Fetch Successful',
      statusCode: 200,
      data: {
        year,
        data,
      },
    };
  }
}