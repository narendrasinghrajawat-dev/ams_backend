import { Controller, Post, Body, Request, BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';
import { ChangePasswordDto } from './user-dto/change-password.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('changePasswordByUser')
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Request() req: any,
  ) {
    // prefer authenticated user id, fallback to body.userKey (if present)
    const userKey = dto.userKey || req?.user?.sub || req?.user?.userId;
    if (!userKey) {
      throw new BadRequestException('User key not provided. Please login or include userKey in request body.');
    }

    // delegate to service
    return this.userService.changePassword(userKey, dto.newPassword);
  }
}
