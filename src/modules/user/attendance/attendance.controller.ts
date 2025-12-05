import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { PunchDto } from 'src/dto/punch.dto';
import { JwtAuthGuard } from 'src/modules/auth/jwt.guard';

@Controller('attendance')
export class AttendanceController {
  
  constructor(private attendanceService: AttendanceService) {}
  
  @UseGuards(JwtAuthGuard) 
  @Post('punch')
  punch(@Request() req: any, @Body() dto: PunchDto) {
    return this.attendanceService.punch(req.user, dto);
  } 


 
@Get('getAllAttedanceActivity/:key')
getAllActivities(@Param('key') userKey: string) {
    console.log('getAllActivities api is called');
    console.log(userKey);
    
    return this.attendanceService.getAllActivities(userKey);
}



    
} 
     