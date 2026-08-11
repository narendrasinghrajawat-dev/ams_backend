import { BadRequestException } from '@nestjs/common';
import { Model } from 'mongoose';
import { PunchDto } from '../dto/punch.dto';
import { COMMON_STRING } from 'src/utills/constant/const_strings';
import { DeviceInfoDto } from 'src/modules/common/common dto/device_info.dto';
import { AttendanceDoc } from 'src/database/schemas/attendance.schema';
import { MasterDataDoc } from 'src/database/schemas/master_data.schema';

export class AttendanceHelper {
  // ---- Duplicate punch validation ----
  static async ensureNoDuplicatePunch(
    attendanceModel: Model<AttendanceDoc>,
    userKey: string,
    dto: PunchDto,
  ) {
    const existing = await attendanceModel.findOne({
      userKey,
      punchDate: dto.punchDate,
      punchType: dto.punchType,
      isActive: true,
    });

    if (existing) {
      const punchLabel =
        dto.punchType === COMMON_STRING.PUNCH_IN_KEY ? 'Punch In' : 'Punch Out';

      throw new BadRequestException(
        `${punchLabel} already done for today. You can punch ${punchLabel} only once per day.`,
      );
    }
  }

  // ---- Geofence helpers ----
  private static degToRad(deg: number): number {
    return deg * (Math.PI / 180.0);
  }

  private static calculateDistanceInMeters(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
  ): number {
    const earthRadius = 6371000.0; // meters

    const dLat = this.degToRad(endLat - startLat);
    const dLng = this.degToRad(endLng - startLng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degToRad(startLat)) *
        Math.cos(this.degToRad(endLat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  }

  static async ensureInsideOfficeRadius(
    masterDataModel: Model<MasterDataDoc>,
    userLatRaw: string | number | null | undefined,
    userLngRaw: string | number | null | undefined,
  ) {
    const userLat = Number(userLatRaw);
    const userLng = Number(userLngRaw);

    if (
      !Number.isFinite(userLat) ||
      !Number.isFinite(userLng) ||
      userLat < -90 ||
      userLat > 90 ||
      userLng < -180 ||
      userLng > 180
    ) {
      throw new BadRequestException('Invalid latitude/longitude for punch.');
    }

    const master = await masterDataModel.findOne({});

    if (!master) {
      throw new BadRequestException(
        'Office location configuration not found. Contact administrator.',
      );
    }

    const officeLat = Number(master.officeLat);
    const officeLng = Number(master.officeLong);
    const officeRadius =
      Number(master.officeRadius) && Number(master.officeRadius) > 0
        ? Number(master.officeRadius)
        : 100;

    if (
      !Number.isFinite(officeLat) ||
      !Number.isFinite(officeLng) ||
      officeLat < -90 ||
      officeLat > 90 ||
      officeLng < -180 ||
      officeLng > 180
    ) {
      throw new BadRequestException('Invalid office location configuration.');
    }

    const distance = this.calculateDistanceInMeters(
      userLat,
      userLng,
      officeLat,
      officeLng,
    );

    if (distance > officeRadius) {
      throw new BadRequestException(
        'You are outside the allowed office radius. Punch not allowed.',
      );
    }
  }

  // ---- Device validation ----
  static isSameDevice(loginDevice: DeviceInfoDto, punchDevice: DeviceInfoDto): boolean {
    if (!loginDevice || !punchDevice) return true;

    // Web platform
    if (loginDevice.os === 'Web' || punchDevice.os === 'Web') {
      return (loginDevice.os || '') === (punchDevice.os || '');
    }

    const coreMatch =
      (loginDevice.os || '') === (punchDevice.os || '') &&
      (loginDevice.model || '') === (punchDevice.model || '') &&
      (loginDevice.brand || '') === (punchDevice.brand || '');

    const idMatch =
      (!loginDevice.uniqueId || !punchDevice.uniqueId) ||
      loginDevice.uniqueId === punchDevice.uniqueId ||
      loginDevice.androidId === punchDevice.androidId;

    return coreMatch && idMatch;
  }
}
