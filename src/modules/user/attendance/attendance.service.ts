import { Inject, Injectable } from '@nestjs/common';
import { aql } from 'arangojs';
import { PunchDto } from '../../user/attendance/dto/punch.dto';
import { COLLECTIONS } from 'src/utills/constant/const_collections';

@Injectable()
export class AttendanceService {

  constructor(@Inject('ARANGO_CONNECTION') private arangoProvider: any ) {}

  private getDb() {
    return this.arangoProvider.getDb();
  } 
   
  async punch(user: any, dto: PunchDto) {
    const db = this.getDb();
    const collection = db.collection(COLLECTIONS.ATTENDANCE);      
 
    const punchRecord = {
      userKey: dto.userKey,
      punchType: dto.punchType, 
      punchTime : dto.punchTime,
      punchDate : dto.punchDate,      
      lat: dto.lat,
      long: dto.long,
      deviceInformation: dto.deviceInformation,
      createdDate: new Date().toISOString()
    };  
  
    const result = await collection.save(punchRecord); 
    
    return {
      message: dto.punchType === "1" ? "Punch In Successful" : "Punch Out Successful",
      statusCode: 200, 
      data: {
        _key: result._key,
        
        ...punchRecord
      } 
    };
  } 
 

       async getAllAttendance(userKey: string) {

    const cursor = await this.getDb().query(aql`
      FOR att IN attendance
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




} 
