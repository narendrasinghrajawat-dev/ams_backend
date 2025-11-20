import { Module } from '@nestjs/common';
import { UserLoginService } from './login.service';
import { AuthController } from 'src/modules/auth/auth.controller';
import { DatabaseModule } from 'src/database/database.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from 'src/modules/auth/jwt.strategy';


@Module({
    imports: [DatabaseModule,JwtModule.register({
          secret: process.env.JWT_SECRET || 'mySecretKey',
          signOptions: { expiresIn: '10h' },
        
        }), ],
  controllers: [],
  providers: [UserLoginService ,JwtStrategy],
   exports: [UserLoginService]
})
export class UserLoginModule {}
