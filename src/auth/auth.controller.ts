import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { Role } from './roles.enum';
import { CreateUserDto } from 'src/dto/create-user.dto';
import { UpdateUserDto } from 'src/dto/update-user-dto';

@Controller('auth')
export class AuthController {

  constructor(private authService: AuthService) { }

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    const { email, password } = body;

    if (!email || !password) {
      throw new BadRequestException("Email and password are required");
    }

    return this.authService.login(email, password);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get('user-list')
  getUserList() {
    return this.authService.getUserList();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Delete('delete-user/:key')
  deleteUser(@Param('key') key: string) {
    return this.authService.deleteUser(key);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)     // Only manager can update
  @Patch('update-user/:key')
  updateUser(
    @Param('key') key: string,
    @Body() dto: UpdateUserDto
  ) {
    return this.authService.updateUser(key, dto);
  }


  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Post('create-user')
  createUser(@Body() dto: CreateUserDto, @Request() req: any) {
    return this.authService.createUser(dto, req.user);
  }

}
