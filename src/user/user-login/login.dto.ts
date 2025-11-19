import { IsString, IsNotEmpty, IsObject, IsNumber } from "class-validator";

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  long: number;

  @IsObject()
  deviceInformation: any;
}
