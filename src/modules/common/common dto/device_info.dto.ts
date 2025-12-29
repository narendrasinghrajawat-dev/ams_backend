import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class DeviceInfoDto {
  // ---------- Common (ALL PLATFORMS) ----------

  @IsString()
  os: string;

  @IsString()
  uniqueId: string;

  @IsBoolean()
  isPhysicalDevice: boolean;

  // ---------- Android ----------

  @IsString()
  @IsOptional()
  version?: string;

  @IsNumber()
  @IsOptional()
  sdkInt?: number;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  manufacturer?: string;

  @IsString()
  @IsOptional()
  device?: string;

  @IsString()
  @IsOptional()
  androidId?: string;

  @IsString()
  @IsOptional()
  fingerprint?: string;

  // ---------- iOS ----------

  @IsString()
  @IsOptional()
  identifierForVendor?: string;

  // ---------- Web ----------

  @IsString()
  @IsOptional()
  browserName?: string;

  @IsString()
  @IsOptional()
  appVersion?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;

  @IsString()
  @IsOptional()
  platform?: string;

  @IsString()
  @IsOptional()
  vendor?: string;

  @IsString()
  @IsOptional()
  language?: string;
}
