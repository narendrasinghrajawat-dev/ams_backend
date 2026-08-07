import { Module, OnModuleInit } from '@nestjs/common';
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
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDoc } from './database/schemas/user.schema';
import { seedAdminUser } from './modules/user/user.seed';

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
export class AppModule implements OnModuleInit {
  constructor(
    @InjectModel(UserDoc.name) private readonly userModel: Model<UserDoc>,
  ) {}

  async onModuleInit() {
    await seedAdminUser(this.userModel);
  }
} 

  