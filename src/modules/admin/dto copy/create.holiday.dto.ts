import { IsNotEmpty, IsString, IsIn, IsISO8601 } from 'class-validator';

export class CreateHolidayDto {

  @IsISO8601()
  @IsNotEmpty()
  date: string; // ISO string

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

    @IsString() 
  @IsNotEmpty()
  createdById: string;



}
