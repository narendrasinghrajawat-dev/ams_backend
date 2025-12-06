import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { ArangoProvider } from 'src/database/arango.provider';
import { aql } from 'arangojs';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../user/attendance/dto/login.dto';
import { COLLECTIONS } from 'src/utills/constant/const_collections';

@Injectable()
export class AuthService {
  private db: any;
    private users;

    private loginUsers;
    private passwordsOfUsers;

    constructor(
        @Inject("ARANGO_CONNECTION") private readonly arango: ArangoProvider,
        private jwtService: JwtService,
    ) {
        this.db = this.arango.getDb();
        this.users = this.db.collection(COLLECTIONS.USERS); 
        this.loginUsers = this.db.collection(COLLECTIONS.LOGIN_USERS);
        this.passwordsOfUsers = this.db.collection(COLLECTIONS.PASSWORDS_OF_USERS);
    }


    async login(dto: LoginDto) {
        const { email, password, lat, long, deviceInformation } = dto;

        const cursor = await this.db.query(aql`
      FOR u IN users
        FILTER u.email == ${email}
        LIMIT 1
        RETURN u
    `);


        const user = await cursor.next();
        if (!user) throw new UnauthorizedException("Invalid email or password");
        const payload = {
            sub: user._key,
            role: user.role,
            email: user.email,
        };
        
        const match = user.password.startsWith("$2b$")
            ? await bcrypt.compare(password, user.password)
            : user.password === password;
        
        if (!match) throw new UnauthorizedException("Invalid email or password");

        const loginRecord = {
            userId: user._id,
            email: user.email,
            loginAt: new Date().toISOString(),
            lat,
            long,
            deviceInformation,
            status: "success",
        };
        
        const passwordRecord = {
            userId: user._id,
            email: user.email,
            password: user.password,
            changedAt: new Date().toISOString(),
        }
        await this.loginUsers.save(loginRecord);
        await this.passwordsOfUsers.save(passwordRecord);
           
        const fullUser = { ...user, lat : lat, long: long, deviceInformation : deviceInformation, token: this.jwtService.sign(payload),};
        delete fullUser.password;
       const data = {...fullUser , token: this.jwtService.sign(payload) , loginAt: loginRecord.loginAt};
       
        return {
            message: "Login successful",
            statusCode: 200,
            data: data,
            
        }
    };

}
