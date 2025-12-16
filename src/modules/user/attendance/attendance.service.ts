import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { aql } from 'arangojs';
import { PunchDto } from '../../user/attendance/dto/punch.dto';
import { COLLECTIONS } from 'src/utills/constant/const_collections';
import { Collection } from 'arangojs/collections';
import { COMMON_STRING } from 'src/utills/constant/const_strings';
import { DeviceInfoDto } from 'src/modules/common/common dto/device_info.dto';
import { AttendanceHelper } from './helper/attendance.helper';

@Injectable()
export class AttendanceService {

     private attendance;

  constructor(@Inject('ARANGO_CONNECTION') private arangoProvider: any ) {
    this.attendance = this.arangoProvider.getDb().collection(COLLECTIONS.ATTENDANCE);
  }

  private getDb() {
    return this.arangoProvider.getDb();
  } 
    
  private isSameDevice(loginDevice: DeviceInfoDto, punchDevice: DeviceInfoDto): boolean {
  if (!loginDevice || !punchDevice) return false;

  // Core fields (should always match)
  const coreMatch =
    loginDevice.os === punchDevice.os &&
    loginDevice.version === punchDevice.version &&
    Number(loginDevice.sdkInt) === Number(punchDevice.sdkInt) &&
    loginDevice.model === punchDevice.model &&
    loginDevice.brand === punchDevice.brand &&
    loginDevice.manufacturer === punchDevice.manufacturer &&
    (loginDevice.device || '') === (punchDevice.device || '');

  // Strong identifiers (must match)
  const idMatch =
    loginDevice.uniqueId === punchDevice.uniqueId &&
    loginDevice.androidId === punchDevice.androidId &&
    Boolean(loginDevice.isPhysicalDevice) === Boolean(punchDevice.isPhysicalDevice);

  // Optional fields: only enforce if present in login record
  const fingerprintMatch =
    !loginDevice.fingerprint || loginDevice.fingerprint === punchDevice.fingerprint;

  const vendorIdMatch =
    !loginDevice.identifierForVendor ||
    loginDevice.identifierForVendor === punchDevice.identifierForVendor;

  return coreMatch && idMatch && fingerprintMatch && vendorIdMatch;
}

async punch(user: any, dto: PunchDto) {
    const db = this.getDb();
    const attendanceCollection = db.collection(COLLECTIONS.ATTENDANCE);
    const loginUsersCollection = db.collection('loginUsers'); // or COLLECTIONS.LOGIN_USERS

    // Prefer user from JWT over body
    const userKey = user?.sub || user?.userId || dto.userKey;

    if (!userKey) {
      throw new BadRequestException('User key not found. Please login again.');
    }

    // 1) Duplicate punch validation
    await AttendanceHelper.ensureNoDuplicatePunch(db, userKey, dto);

    // 2) Geofence validation
    // await AttendanceHelper.ensureInsideOfficeRadius(db, dto.lat, dto.long);


    const loginCursor = await db.query(aql`
      FOR l IN ${loginUsersCollection} 
        FILTER l.userKey == ${userKey}
        SORT l.loginAt DESC
        LIMIT 1
        RETURN l
    `);

    const lastLogin = await loginCursor.next();

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

    // 4) Passed all validations → save punch
    const punchRecord = {
      userKey: userKey,
      punchType: dto.punchType,
      punchTime: dto.punchTime,
      punchDate: dto.punchDate,
      lat: dto.lat,
      long: dto.long,
      deviceInformation: dto.deviceInformation,
      createdDate: new Date().toISOString(),
      isActive: true,
    };

    const result = await attendanceCollection.save(punchRecord);

    return {
      message:
        dto.punchType === COMMON_STRING.PUNCH_IN_KEY
          ? 'Punch In Successful'
          : 'Punch Out Successful',
      statusCode: 200,
      data: {
        _key: result._key,
        ...punchRecord,
      },
    };
  }

       async getAllAttendance(userKey: string) {

    const cursor = await this.getDb().query(aql`
      FOR att IN ${this.attendance}
        FILTER att.userKey == ${userKey}
        SORT att.punchDate DESC, att.punchTime DESC
        RETURN att
    `);

    const activities = await cursor.all();  

    return {
      message: 'Get All Activities fetched successfully',
      statusCode: 200,
      count: activities.length,
      data: activities,
    };
  } 

async getActivitiesByDate(userKey: string, currentDate: string) {
  // 🔹 Normalize incoming date (ANY FORMAT → Date)
  const parsedDate = new Date(currentDate);

  // ❌ Invalid date safety check
  if (isNaN(parsedDate.getTime())) { 
    throw new Error('Invalid date format provided');
  }

  // 🔹 Convert to YYYY-MM-DD (UTC-safe)
  const dateOnly = parsedDate.toISOString().split('T')[0];

  // 🔹 Build day range
  const startOfDay = `${dateOnly}T00:00:00.000Z`;
  const endOfDay = `${dateOnly}T23:59:59.999Z`;

  const cursor = await this.getDb().query(aql`
    FOR att IN ${this.attendance}
      FILTER att.userKey == ${userKey}
      FILTER att.punchDate >= ${startOfDay}
      FILTER att.punchDate <= ${endOfDay}
      SORT att.punchDate DESC, att.punchTime DESC
      RETURN att
  `);

  const activities = await cursor.all();

  return {
    message: 'Activities fetched successfully',
    statusCode: 200, 
    count: activities.length,
    date: dateOnly,
    data: activities,
  };
}



} 
