import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserDoc, UserSchema } from './schemas/user.schema';
import { AttendanceDoc, AttendanceSchema } from './schemas/attendance.schema';
import { ApplyLeavesDoc, ApplyLeavesSchema } from './schemas/apply_leaves.schema';
import { LeaveBalanceDoc, LeaveBalanceSchema } from './schemas/leave_balance.schema';
import { HolidaysDoc, HolidaysSchema } from './schemas/holidays.schema';
import { MasterDataDoc, MasterDataSchema } from './schemas/master_data.schema';
import { LoginUserDoc, LoginUserSchema } from './schemas/login_user.schema';
import { AddedLeavesByAdminDoc, AddedLeavesByAdminSchema } from './schemas/added_leaves_by_admin.schema';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGO_URI'),
      }),
    }),
    MongooseModule.forFeature([
      { name: UserDoc.name, schema: UserSchema },
      { name: AttendanceDoc.name, schema: AttendanceSchema },
      { name: ApplyLeavesDoc.name, schema: ApplyLeavesSchema },
      { name: LeaveBalanceDoc.name, schema: LeaveBalanceSchema },
      { name: HolidaysDoc.name, schema: HolidaysSchema },
      { name: MasterDataDoc.name, schema: MasterDataSchema },
      { name: LoginUserDoc.name, schema: LoginUserSchema },
      { name: AddedLeavesByAdminDoc.name, schema: AddedLeavesByAdminSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}