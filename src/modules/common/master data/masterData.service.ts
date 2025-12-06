import { Inject, Injectable } from '@nestjs/common';
import { Database } from 'arangojs';
import { ArangoProvider } from 'src/database/arango.provider';
import { COLLECTIONS } from 'src/utills/constant/const_collections';

@Injectable()
export class MasterDataService {
private db;
  private masterData;

  constructor(
    @Inject('ARANGO_CONNECTION') private readonly arango: ArangoProvider,
  ) {
    this.db = this.arango.getDb();
    this.masterData = this.db.collection(COLLECTIONS.MASTER_DATA);
  }  
  
  async getMasterData() {
    const collection = this.db.collection(COLLECTIONS.MASTER_DATA);
    const masterData= await collection.document('master_data');
    return{
      message: 'Master data fetched successfully',
      statusCode: 200,
      data: masterData,
    }
  }
} 
