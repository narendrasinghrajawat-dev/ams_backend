import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ArangoProvider } from '../../database/arango.provider';
import * as bcrypt from 'bcrypt';
import { COLLECTIONS } from 'src/utills/constant/const_collections';
import { aql } from 'arangojs';

@Injectable()
export class UserService {
  private db: any;
  private users: any;

  constructor(@Inject('ARANGO_CONNECTION') private readonly arango: ArangoProvider) {
    this.db = this.arango.getDb();
    this.users = this.db.collection(COLLECTIONS.USERS);
  }

  /**
   * Change user's password (updates only `password` field).
   * @param userKey - _key of the user document
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
    const userDoc = await this.users.document(userKey).catch(() => null);
    if (!userDoc) {
      throw new NotFoundException(`User with key ${userKey} not found`);
    }

    // Hash the new password
    const hashed = await bcrypt.hash(String(newPassword), 10);

    // Update only the password field (partial update)
    await this.users.update(userKey, { password: hashed, modifiedDate: new Date().toISOString() });
    
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
  const holidaysCursor = await this.db.query(aql`
    FOR h IN holidays
      FILTER STARTS_WITH(h.date, ${yearPrefix})
      RETURN h
  `); 
 
  const holidays = await holidaysCursor.all();

  const holidayMap = new Map<
    string,
    { name: string; type: string }
  >();

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
  const attendanceCursor = await this.db.query(aql`
    FOR a IN attendance
      FILTER a.userKey == ${userKey}
      FILTER STARTS_WITH(a.date, ${yearPrefix})
      RETURN a
  `); 

  const attendance = await attendanceCursor.all();

  const attendanceMap = new Map<string, any>();
  for (const a of attendance) {
    const dateKey = a.date.split('T')[0];
    attendanceMap.set(dateKey, a);
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
              punchIn: attendanceData.punchIn,
              punchOut: attendanceData.punchOut,
              totalMinutes: attendanceData.totalMinutes,
              duration: `${Math.floor(attendanceData.totalMinutes / 60)}h ${attendanceData.totalMinutes % 60}m`,
            }
          : null,
      };
    }
  }

  /* --------------------------------------------------
   4️⃣ Final response
  -------------------------------------------------- */
  return {
      message: 'User Calendar Fetch Successfull',
      statusCode: 200,
      data: {
    year,
    data,
  }
    }
}





}
 