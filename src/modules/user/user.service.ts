import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ArangoProvider } from '../database/arango.provider';
import { aql } from 'arangojs';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {

  private db;
  private users;

  constructor(
    @Inject('ARANGO_CONNECTION') private readonly arango: ArangoProvider,
  ) {
    this.db = this.arango.getDb();
    this.users = this.db.collection('users');
  }


  async getAllActivities(userId: string) {

    console.log('get all service called')

    const cursor = await this.db.query(aql`
        
        FOR att in attendance
        filter att.userKey == ${userId}
        return att
        `)

    console.log(cursor.length);

    const users = await cursor.all();

    return {
      message: 'Get All Activities Fetch successfully',
      statusCode: 200,
      count: users.length,
      data: users,
    };

  }


}
