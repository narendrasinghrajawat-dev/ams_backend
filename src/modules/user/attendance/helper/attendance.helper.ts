import { BadRequestException } from '@nestjs/common';
import { aql } from 'arangojs';
import { COLLECTIONS } from 'src/utills/constant/const_collections';
import { PunchDto } from '../dto/punch.dto';
import { COMMON_STRING } from 'src/utills/constant/const_strings';
import { DeviceInfoDto } from 'src/modules/common/common dto/device_info.dto';


export class AttendanceHelper {
  // ---- Duplicate punch validation ----
  static async ensureNoDuplicatePunch(db: any, userKey: string, dto: PunchDto) {
    const attendanceCollection = db.collection(COLLECTIONS.ATTENDANCE);

    const cursor = await db.query(aql`
      FOR att IN ${attendanceCollection}
        FILTER att.userKey == ${userKey}
          AND att.punchDate == ${dto.punchDate}
          AND att.punchType == ${dto.punchType}
          AND att.isActive == true
        LIMIT 1
        RETURN att
    `);

    const existing = await cursor.next();

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
    db: any,
    userLatRaw: string | number | null | undefined,
    userLngRaw: string | number | null | undefined,
  ) {
    const masterCollection = db.collection(COLLECTIONS.MASTER_DATA);

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

    const cursor = await db.query(aql`
      FOR m IN ${masterCollection}
        FILTER m.isActive == true
        LIMIT 1
        RETURN m
    `);

    const master = await cursor.next();

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
    if (!loginDevice || !punchDevice) return false;

    const coreMatch =
      loginDevice.os === punchDevice.os &&
      loginDevice.version === punchDevice.version &&
      Number(loginDevice.sdkInt) === Number(punchDevice.sdkInt) &&
      loginDevice.model === punchDevice.model &&
      loginDevice.brand === punchDevice.brand &&
      loginDevice.manufacturer === punchDevice.manufacturer &&
      (loginDevice.device || '') === (punchDevice.device || '');

    const idMatch =
      loginDevice.uniqueId === punchDevice.uniqueId &&
      loginDevice.androidId === punchDevice.androidId &&
      Boolean(loginDevice.isPhysicalDevice) === Boolean(punchDevice.isPhysicalDevice);

    const fingerprintMatch =
      !loginDevice.fingerprint || loginDevice.fingerprint === punchDevice.fingerprint;

    const vendorIdMatch =
      !loginDevice.identifierForVendor ||
      loginDevice.identifierForVendor === punchDevice.identifierForVendor;

    return coreMatch && idMatch && fingerprintMatch && vendorIdMatch;
  }
}
