import { Database } from 'arangojs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ArangoProvider {
  private db: Database;

  constructor() {
    this.db = new Database({
      url: "http://localhost:8529",
      databaseName: "AMS",   
      auth: {
        username: "root",
        password: "root",
      }
    });
  }

  getDb() {
    return this.db;
  }
}
