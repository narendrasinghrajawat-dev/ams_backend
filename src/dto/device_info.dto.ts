import { IsString, IsNumber, IsOptional } from 'class-validator';

export class DeviceInfoDto { 
  @IsString() os: string;
  @IsString() version: string;
  @IsNumber() sdkInt: number;
  @IsString() model: string;
  @IsString() brand: string;
  @IsString() device: string;
}
 