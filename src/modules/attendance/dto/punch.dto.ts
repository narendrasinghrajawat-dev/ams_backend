import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class PunchDto {
  @IsString() @IsNotEmpty()
  punchType: string;   // "1" = IN, "2" = OUT

  @IsNumber()
  lat: number;

  @IsNumber()
  long: number;

  deviceInformation: {
    os: string;
    version: string;
    sdkInt: number;
    model: string;
    brand: string;
    device: string;
  };
}
