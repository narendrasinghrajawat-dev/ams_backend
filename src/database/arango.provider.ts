import { Database } from 'arangojs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ArangoProvider {
  private db: Database;

  constructor() {
    this.db = new Database({
      url: "https://testdb-drcongo.egov.africa:8529/",
      databaseName: "AMS-Dev",   
      auth: {
        username: "root",
        password: "Dr5YDR6ijnfnODP5QDle34M",
      }
    });
  }

  getDb() {
    return this.db;
  }
}
