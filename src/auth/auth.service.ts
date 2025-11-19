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
  ) { }

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
      statusCode: 200,
      data: {
        _key: user._key,
        _rev: user._rev,
        id: user._id,
        token: this.jwtService.sign(payload),
        userId: user._key,
        email: user.email,
        role: user.role,
      }
    };
  }

  async getUserList() {
    return this.userService.getAllUsers();
  }

  async deleteUser(key: string) {
    return this.userService.deleteUser(key);
  }

  async createUser(dto: any, currentUser: any) {
    if (currentUser.role !== Role.Admin)
      throw new ForbiddenException('Only admin can create users');

    return this.userService.createUser(dto, currentUser.sub);

  }
  async updateUser(key: string, dto: any) {
    return this.userService.updateUser(key, dto);
  }

}
