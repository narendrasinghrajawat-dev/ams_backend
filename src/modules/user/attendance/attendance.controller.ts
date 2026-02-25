import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { PunchDto } from '../../user/attendance/dto/punch.dto';
import { JwtAuthGuard } from 'src/modules/auth/jwt.guard';

@Controller('user/attendance')
export class AttendanceController {
  
  constructor(private attendanceService: AttendanceService) {}
  
  @UseGuards(JwtAuthGuard)  
  @Post('punch')
  punch(@Request() req: any, @Body() dto: PunchDto) {
    return this.attendanceService.punch(req.user, dto);
  } 

 
  
  @Get('getAllAttedanceActivity/:key') 
  getAllActivities(@Param('key') userKey: string) {
    return this.attendanceService.getAllAttendance(userKey);
  } 
 

   @Get('getActivitiesByDate/:userKey/:date') 
  getActivitiesByDate(@Param('userKey') userKey: string, @Param('date') date: string, ) {
    return this.attendanceService.getActivitiesByDate(userKey, date);
  } 

  
   @Get('getAllTakenCurrentMonthWFH/:userKey') 
  getAllTakenCurrentMonthWFH(@Param('userKey') userKey: string, ) {
    return this.attendanceService.getAllTakenCurrentMonthWFH(userKey);
  } 


} 