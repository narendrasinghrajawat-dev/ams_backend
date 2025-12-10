import {
  IsString,
  IsNumber,
  IsBoolean, // Added to handle uniqueId and androidId consistency, and isPhysicalDevice
  IsOptional, 
} from 'class-validator';

export class DeviceInfoDto {
  // --- Core Device Info ---
  
  @IsString() 
  os: string;

  @IsString()
  version: string;

  @IsNumber()
  sdkInt: number;

  @IsString()
  model: string;

  @IsString()
  brand: string;

  @IsString()
  manufacturer: string; // Added: Field exists in JSON

  @IsString()
  device: string;

  // --- Unique Identifiers ---

  @IsString()
  uniqueId: string; // Added: Field exists in JSON

  @IsBoolean() // Assuming this is strictly a boolean value (true/false)
  isPhysicalDevice: boolean; // Added: Field exists in JSON

  @IsString()
  androidId: string; // Added: Field exists in JSON
  
  // --- Detailed/Optional Fields ---
  
  @IsString()
  @IsOptional() // Might be empty or not always present, especially for iOS/Android cross-platform
  fingerprint: string; // Added: Field exists in JSON

  @IsString()
  @IsOptional() // Common for iOS, but empty in the provided Android sample
  identifierForVendor: string; // Added: Field exists in JSON
}