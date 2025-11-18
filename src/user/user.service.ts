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

  async createUser(data: any, managerId: string) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const userData = {
      ...data,
      password: hashedPassword,
      createdBy: managerId,
      createdAt: new Date().toISOString(),
    };

    const savedUser = await this.users.save(userData);

    return {
      message: "New user created successfully",
      statusCode: 201,
      data: {
        key: savedUser._key,
        _rev: savedUser._rev,
        id: savedUser._id,
        firstName: userData.firstName,
        middleName: userData.middleName,
        lastName: userData.lastName,
        email: userData.email,
        phoneNo: userData.phoneNo,
        username: userData.username,
        dob: userData.dob,
        address: userData.address,
        role: userData.role,
        createdBy: userData.createdBy,
      }
    };
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

  async validateUser(email: string, password: string) {
    const user = await this.findByEmail(email);
    if (!user) return null;

    // Case 1: hashed password
    if (user.password.startsWith("$2b$")) {
      const match = await bcrypt.compare(password, user.password);
      return match ? user : null;
    }

    // Case 2: plain text (old manager)
    if (user.password === password) {
      return user;
    }

    return null;
  }
}
