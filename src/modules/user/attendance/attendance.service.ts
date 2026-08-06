import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PunchDto } from '../../user/attendance/dto/punch.dto';
import { COMMON_STRING } from 'src/utills/constant/const_strings';
import { DeviceInfoDto } from 'src/modules/common/common dto/device_info.dto';
import { AttendanceHelper } from './helper/attendance.helper';
import { AttendanceDoc } from 'src/database/schemas/attendance.schema';
import { LoginUserDoc } from 'src/database/schemas/login_user.schema';
import { MasterDataDoc } from 'src/database/schemas/master_data.schema';
import { formatMongoDoc } from 'src/utills/db-helper';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(AttendanceDoc.name) private readonly attendanceModel: Model<AttendanceDoc>,
    @InjectModel(LoginUserDoc.name) private readonly loginUserModel: Model<LoginUserDoc>,
    @InjectModel(MasterDataDoc.name) private readonly masterDataModel: Model<MasterDataDoc>,
  ) {}

  async punch(user: any, dto: PunchDto) {
    // Prefer user from JWT over body
    const userKey = user?.sub || user?.userId || dto.userKey;

    if (!userKey) {
      throw new BadRequestException('User key not found. Please login again.');
    }

    // 1) Duplicate punch validation
    await AttendanceHelper.ensureNoDuplicatePunch(this.attendanceModel, userKey, dto);

    // 2) Geofence validation (if needed, currently commented in original)
    // await AttendanceHelper.ensureInsideOfficeRadius(this.masterDataModel, dto.lat, dto.long);

    // 3) Get last login
    const lastLogin = await this.loginUserModel.findOne({ userKey }).sort({ loginAt: -1 });

    if (!lastLogin) {
      throw new BadRequestException(
        'No login record found for this user. Please login again before punching attendance.',
      );
    }

    const loginDevice: DeviceInfoDto = lastLogin.deviceInformation || ({} as any);
    const punchDevice: DeviceInfoDto = (dto.deviceInformation as any) || ({} as any);

    if (!AttendanceHelper.isSameDevice(loginDevice, punchDevice)) {
      throw new BadRequestException(
        'Punch not allowed from this device. Please use the same device used during login.',
      );
    }

    // 4) Passed all validations -> save punch
    const punchRecord = {
      userKey: userKey,
      punchType: dto.punchType,
      punchTime: dto.punchTime,
      punchDate: dto.punchDate,
      lat: dto.lat, 
      long: dto.long,
      isWFH: dto.isWFH,
      deviceInformation: dto.deviceInformation,
      createdDate: new Date().toISOString(),
      isActive: true,
    };

    const result = await new this.attendanceModel(punchRecord).save();
    const formattedResult = formatMongoDoc(result);

    return {
      message:
        dto.punchType === COMMON_STRING.PUNCH_IN_KEY
          ? 'Punch In Successful'
          : 'Punch Out Successful',
      statusCode: 200,
      data: formattedResult,
    };
  }

  async getAllAttendance(userKey: string) {
    const activities = await this.attendanceModel.find({ userKey })
      .sort({ punchDate: -1, punchTime: -1 })
      .lean();

    const formatted = activities.map(a => formatMongoDoc(a));

    return {
      message: 'Get All Activities fetched successfully',
      statusCode: 200,
      count: formatted.length,
      data: formatted,
    };
  } 

  async getActivitiesByDate(userKey: string, currentDate: string) {
    const parsedDate = new Date(currentDate);

    if (isNaN(parsedDate.getTime())) { 
      throw new Error('Invalid date format provided');
    }

    const dateOnly = parsedDate.toISOString().split('T')[0];

    const startOfDay = `${dateOnly}T00:00:00.000Z`;
    const endOfDay = `${dateOnly}T23:59:59.999Z`;

    const activities = await this.attendanceModel.find({
      userKey,
      punchDate: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ punchDate: -1, punchTime: -1 }).lean();

    const formatted = activities.map(a => formatMongoDoc(a));

    return {
      message: 'Activities fetched successfully For Date ',
      statusCode: 200,
      count: formatted.length,
      date: dateOnly,
      data: formatted,
    };
  }

  async getAllTakenCurrentMonthWFH(userKey: string) {
    const now = new Date();

    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));

    const total = await this.attendanceModel.countDocuments({
      userKey,
      punchType: '1',
      isWFH: true,
      punchDate: { $gte: startOfMonth.toISOString(), $lte: endOfMonth.toISOString() },
    });

    return {
      message: 'Current month WFH count fetched successfully',
      statusCode: 200,
      month: now.getUTCMonth() + 1,
      year: now.getUTCFullYear(),
      data: total,
    };
  }
}
