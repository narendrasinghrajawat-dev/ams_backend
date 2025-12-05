import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { LoginDto } from '../user/attendance/dto/login.dto';
import { AuthService } from 'src/modules/auth/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const { email, password } = loginDto;
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }
  
    // pass full DTO so service can use lat/long/deviceInformation if needed
    return this.authService.login(loginDto);
  }
} 
