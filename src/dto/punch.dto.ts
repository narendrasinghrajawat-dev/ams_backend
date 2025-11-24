import { Type } from 'class-transformer';
import { ValidateNested, IsNotEmpty, IsString } from 'class-validator';
import { DeviceInfoDto } from './device_info.dto';

export class PunchDto {
  @IsString() @IsNotEmpty() userKey: string;
  @IsString() @IsNotEmpty() punchType: string;
  @IsString() @IsNotEmpty() punchTime: string;
  @IsString() @IsNotEmpty() punchDate: string;
  @IsString() lat: string;
  @IsString() long: string;

  @ValidateNested()
  @Type(() => DeviceInfoDto)
  deviceInformation: DeviceInfoDto;
} 
 