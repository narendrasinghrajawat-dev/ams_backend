import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { UserLoginModule } from './user/user-login/login.module';
import { AttendanceModule } from './modules/attendance/attendance.module';

@Module({
  imports: [UserModule, AuthModule ,DatabaseModule ,UserLoginModule ,AttendanceModule],
  controllers: [AppController,],
  providers: [AppService],
})
export class AppModule {}
