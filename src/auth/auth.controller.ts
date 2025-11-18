import { BadRequestException, Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { Role } from './roles.enum';
import { CreateUserDto } from 'src/dto/create-user.dto';

@Controller('auth')
export class AuthController {

  constructor(private authService: AuthService) {}

 @Post('login')
login(@Body() body: { email: string; password: string }) {
  const { email, password } = body;

  if (!email || !password) {
    throw new BadRequestException("Email and password are required");
  }

  return this.authService.login(email, password);
}


  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Manager)
  @Post('create-user')
  createUser(@Body() dto: CreateUserDto, @Request() req: any) {
    return this.authService.createUser(dto, req.user);
  }

}
