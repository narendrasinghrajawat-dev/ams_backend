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
      id: savedUser._id,
      rev: savedUser._rev,

      // PERSONAL DATA
      firstName: userData.firstName,
      middleName: userData.middleName,
      lastName: userData.lastName,
      dob: userData.dob,
      genderId: userData.genderId,

      // CONTACT
      email: userData.email,
      countryCode: userData.countryCode,
      phoneNo: userData.phoneNo,
      username: userData.username,

      // ROLE / DEPARTMENT
      role: userData.role,
      roleId: userData.roleId,
      departmentId: userData.departmentId,

      // ADDRESS (Nested)
      address: {
        street: userData.address.street,
        cityName: userData.address.cityName,
        cityId: userData.address.cityId,
        stateName: userData.address.stateName,
        stateId: userData.address.stateId,
        zipCode: userData.address.zipCode,
        countryName: userData.address.countryName,
        countryId: userData.address.countryId,
      },

      createdBy: userData.createdBy,
      createdAt: userData.createdAt,
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
