import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { ArangoProvider } from 'src/database/arango.provider';
import { aql } from 'arangojs';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../user/attendance/dto/login.dto';
import { COLLECTIONS } from 'src/utills/constant/const_collections';

@Injectable()
export class AuthService {
  private db: any;
    private users;

    private loginUsers;
    private passwordsOfUsers;

    constructor(
        @Inject("ARANGO_CONNECTION") private readonly arango: ArangoProvider,
        private jwtService: JwtService,
    ) {
        this.db = this.arango.getDb();
        this.users = this.db.collection(COLLECTIONS.USERS);  
        this.loginUsers = this.db.collection(COLLECTIONS.LOGIN_USERS);
        this.passwordsOfUsers = this.db.collection(COLLECTIONS.PASSWORDS_OF_USERS);
    }


 async login(dto: LoginDto) {
  const { email, password, lat, long, deviceInformation } = dto;

  if (!email || !password) {
    throw new UnauthorizedException('Email and password are required');
  }

  // Case-insensitive email lookup
  const cursor = await this.db.query(aql`
    FOR u IN ${this.users}
      FILTER LOWER(u.email) == LOWER(${email})
      LIMIT 1
      RETURN u
  `);

  const user = await cursor.next();
  if (!user) throw new UnauthorizedException('Invalid email or password');

  // Ensure stored password exists
  const storedPwd = user.password;
  if (!storedPwd) throw new UnauthorizedException('Invalid email or password');

  // Detect bcrypt-style hash: $2a$, $2b$, $2y$
  const isBcryptHash = typeof storedPwd === 'string' && /^\$2[aby]\$/.test(storedPwd);

  const passwordMatches = isBcryptHash
    ? await bcrypt.compare(password, storedPwd)
    : storedPwd === password;

  if (!passwordMatches) throw new UnauthorizedException('Invalid email or password');

  // Prepare payload and token once
  const payload = { sub: user._key, role: user.role, email: user.email };
  const token = this.jwtService.sign(payload);

  // Save login audit and password history (keep as you had)
  const loginRecord = {
    userKey: user._key,
    email: user.email,
    loginAt: new Date().toISOString(),
    lat,
    long,
    deviceInformation,
    status: 'success',
    isActive: true,
  };

  const passwordRecord = {
    userKey: user._key,
    email: user.email,
    password: storedPwd,
    changedAt: new Date().toISOString(),
    isActive: true,
  };

  await this.loginUsers.save(loginRecord);
  await this.passwordsOfUsers.save(passwordRecord);

  // Build response user object (without password)
  const fullUser = { ...user, lat, long, deviceInformation, token };
  if (fullUser.password) delete fullUser.password;

  return {
    message: 'Login successful',
    statusCode: 200,
    data: { ...fullUser, loginAt: loginRecord.loginAt },
  };
}


}
