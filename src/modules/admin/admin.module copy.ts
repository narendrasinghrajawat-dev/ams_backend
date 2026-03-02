import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin_service";
import { JwtStrategy } from "src/modules/auth/jwt.strategy";
import { JwtModule } from "@nestjs/jwt";
import { DatabaseModule } from "src/database/database.module";


@Module({
    imports : [
        DatabaseModule,
        JwtModule.register({
      secret: process.env.JWT_SECRET || 'mySecretKey', 
      signOptions: { expiresIn: '10d' },  
       
    }), 
    ],  
    providers : [AdminService, JwtStrategy],
    controllers : [AdminController],
    exports: [AdminService], // if other modules need admin service
})
 
export class AdminModule{} 
 
