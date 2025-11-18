import { Injectable } from '@nestjs/common';
import { ArangoProvider } from '../database/arango.provider';
import { aql } from 'arangojs';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  private db;
  private users;

  constructor(private arango: ArangoProvider) {
    this.db = this.arango.getDb();
    this.users = this.db.collection("users");
  }

  async createUser(data: any) {
    data.password = await bcrypt.hash(data.password, 10);
    console.log('Creating user with data:', data);
    return this.users.save(data);
  }

  async findByEmail(email: string) {
    const cursor = await this.db.query(aql`
      FOR u IN users
        FILTER u.email == ${email}
        LIMIT 1
        RETURN u
    `);

    return cursor.next(); 
  }

  async validateUser(email: string, password: string ) {
    const user = await this.findByEmail(email);
    if (!user) return null;

   if (user.password === password) return user;
return null;


    

  }
}
