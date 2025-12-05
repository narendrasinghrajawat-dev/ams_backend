import { Injectable } from '@nestjs/common';
import { Database } from 'arangojs';

@Injectable()
export class MasterDataService {
  private db: Database;

  constructor() {
    const connection = new Database({
      url: process.env.ARANGO_URL!, 
      auth: {
        username: process.env.ARANGO_USERNAME!,
        password: process.env.ARANGO_PASSWORD!,
      }
    });

    this.db = connection.database(process.env.ARANGO_DB!);
    console.log("DB URL:", process.env.ARANGO_URL);
console.log("DB:", process.env.ARANGO_DB);
console.log("USER:", process.env.ARANGO_USERNAME);
console.log("PASS:", process.env.ARANGO_PASSWORD);
  }

  async getMasterData() {
    const collection = this.db.collection('masterData');

    return await collection.document('master_data');
  }
}
