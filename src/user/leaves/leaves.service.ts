import { Inject, Injectable } from "@nestjs/common";
import { aql } from "arangojs";


@Injectable()
export class LeavesService{
  
  constructor(@Inject('ARANGO_CONNECTION') private arangoProvider: any ) {}

  private getDb() {
    return this.arangoProvider.getDb();
  } 
 

  async getLeavesStatusByUserKey(userKey : string){
     
       const db = this.getDb();
        
        const cursor = await db.query(aql` 
          FOR att IN leavesStatus
            FILTER att.userKey == ${userKey} 
            RETURN att 
        `);
         
        const leavesStatusList = await cursor.all();
        
        return {
          message: 'Get All Activities fetched successfully',
          statusCode: 200,
          count: leavesStatusList.length,
          data: leavesStatusList,
        };

  }


}