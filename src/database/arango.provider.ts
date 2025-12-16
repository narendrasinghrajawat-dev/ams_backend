import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Database } from 'arangojs';

@Injectable()
export class ArangoProvider {
  private db: Database;

  constructor(private readonly config: ConfigService) {
 
    this.db = new Database({
      url: this.config.getOrThrow<string>('ARANGO_URL'),
      databaseName: this.config.getOrThrow<string>('ARANGO_DB'),
      auth: { 
        username: this.config.getOrThrow<string>('ARANGO_USER'),
        password: this.config.getOrThrow<string>('ARANGO_PASSWORD'),
      },
    });
  }   

  getDb(): Database {
    return this.db;
  }
}
 