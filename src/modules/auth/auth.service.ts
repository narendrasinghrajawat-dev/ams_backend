import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../user/attendance/dto/login.dto';
import { UserDoc } from 'src/database/schemas/user.schema';
import { LoginUserDoc } from 'src/database/schemas/login_user.schema';
import { AuthHelper } from './helper/auth.helper';
import { formatMongoDoc } from 'src/utills/db-helper';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(UserDoc.name) private readonly userModel: Model<UserDoc>,
    @InjectModel(LoginUserDoc.name) private readonly loginUserModel: Model<LoginUserDoc>,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const { email, password, lat, long, deviceInformation } = dto;

    if (!email || !password) {
      throw new UnauthorizedException('Email and password are required');
    }

    // Case-insensitive email lookup
    const user = await this.userModel.findOne({
      email: { $regex: new RegExp(`^${email.trim()}$`, 'i') },
    });

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

    const formattedUser = formatMongoDoc(user);

    // Prepare payload and token
    const payload = {  
      sub: formattedUser._key, 
      role: AuthHelper.mapRoleIdToName(formattedUser.roleId),  // returns 'admin' for roleId '2'
      email: formattedUser.email 
    };
    const token = this.jwtService.sign(payload);

    // Save login audit
    const loginRecord = {
      userKey: formattedUser._key, 
      email: formattedUser.email,
      loginAt: new Date().toISOString(),
      lat,
      long,
      deviceInformation,
      status: 'success',
      isActive: true,
    };

    await new this.loginUserModel(loginRecord).save();

    // Build response user object (without password)
    const fullUser = { ...formattedUser, lat, long, deviceInformation, token };
    if (fullUser.password) delete fullUser.password;

    return {
      message: 'Login successful',
      statusCode: 200,
      data: { ...fullUser, loginAt: loginRecord.loginAt },
    };
  }
}