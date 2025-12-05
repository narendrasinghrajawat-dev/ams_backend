import { Type } from "class-transformer";
import { IsString, IsNotEmpty, IsObject, IsNumber, ValidateNested } from "class-validator";
import { DeviceInfoDto } from "../../../common/common dto/device_info.dto";

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
  
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  deviceInformation: DeviceInfoDto;
} 
  