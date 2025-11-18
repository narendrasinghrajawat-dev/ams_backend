import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { Role } from './roles.enum';
import { STATUS_CODES } from 'http';

@Injectable()
export class AuthService {

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userService.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      sub: user._key,
      role: user.role,
      email: user.email,
    };

    return {
    message: "Login successful",
    STATUS_CODES: 200,
    data: {
      token: this.jwtService.sign(payload),
      userId: user._key,
      email: user.email,
      role: user.role,
    }
  };
  }

  async createUser(dto: any, currentUser: any) {
    if (currentUser.role !== Role.Manager)
      throw new ForbiddenException('Only manager can create users');

    return this.userService.createUser(dto);
  }

}
