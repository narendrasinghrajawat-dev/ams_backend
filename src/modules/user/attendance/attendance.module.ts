import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { DatabaseModule } from '../../database/database.module';
import { PunchDto } from 'src/dto/punch.dto';

@Module({
  imports: [DatabaseModule , PunchDto],
  controllers: [AttendanceController],
  providers: [AttendanceService],
}) 
export class AttendanceModule {}
  