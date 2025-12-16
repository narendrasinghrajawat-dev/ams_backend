import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { DatabaseModule } from 'src/database/database.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [DatabaseModule,
    UserModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'mySecretKey',
      signOptions: { expiresIn: '10d' },
    }), 
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController]
}) 
export class AuthModule {}  
