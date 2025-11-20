import { Inject, Injectable } from '@nestjs/common';
import { aql } from 'arangojs';
import { PunchDto } from './dto/punch.dto';

@Injectable()
export class AttendanceService {
  constructor(@Inject('ARANGO_CONNECTION') private arangoProvider: any ) {}

  private getDb() {
    return this.arangoProvider.getDb();
  }

  async punch(user: any, dto: any) {
    const db = this.getDb();
    const collection = db.collection('attendance');

    const punchRecord = {
      userId: user._key,
      punchType: dto.punchType,       
      lat: dto.lat,
      long: dto.long,
      deviceInformation: dto.deviceInformation,
      timestamp: new Date().toISOString()
    };

    const result = await collection.save(punchRecord);

    return {
      message: dto.punchType === "1" ? "Punch In Successful" : "Punch Out Successful",
      statusCode: 200,
      data: {
        punchId: result._key,
        
        ...punchRecord
      }
    };
  }
}
