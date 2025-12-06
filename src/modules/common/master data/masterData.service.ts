import { Inject, Injectable } from '@nestjs/common';
import { Database } from 'arangojs';
import { ArangoProvider } from 'src/database/arango.provider';

@Injectable()
export class MasterDataService {
private db;
  private masterData;

  constructor(
    @Inject('ARANGO_CONNECTION') private readonly arango: ArangoProvider,
  ) {
    this.db = this.arango.getDb();
    this.masterData = this.db.collection('masterData');
  }  
  
  async getMasterData() {
    const collection = this.db.collection('masterData');

    const masterData= await collection.document('master_data');
    return{
      message: 'Master data fetched successfully',
      statusCode: 200,
      data: masterData,
    }
  }
} 
