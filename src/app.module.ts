import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { AdminModule } from './modules/admin/admin.module';
import { LeavesModule } from './modules/user/leaves/leaves.module';
import { AttendanceModule } from './modules/user/attendance/attendance.module';
import { MasterDataModule } from './modules/common/master data/masterData.module';
import { ConfigModule } from '@nestjs/config';

@Module({ 
  imports: [UserModule, AdminModule, AuthModule ,DatabaseModule  ,AttendanceModule, LeavesModule , MasterDataModule,
      ConfigModule.forRoot({
      isGlobal: true,        // <-- important
      envFilePath: 'env/.env.dev',
      // envFilePath: 'env/.env.test',
      // envFilePath: 'env/.env.prod',  
    }), 
  ],
  controllers: [AppController,],  
  providers: [AppService], 
})   
export class AppModule {  
  
} 

  