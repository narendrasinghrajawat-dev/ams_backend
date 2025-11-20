import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PunchDto } from './dto/punch.dto';

@Controller('attendance')
export class AttendanceController {

  constructor(private attendanceService: AttendanceService) {}

  @UseGuards(JwtAuthGuard)
  @Post('punch')
  punch(@Request() req: any, @Body() dto: PunchDto) {
    return this.attendanceService.punch(req.user, dto);
  }
}
