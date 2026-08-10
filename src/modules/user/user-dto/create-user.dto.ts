import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsBoolean,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString() @IsNotEmpty() firstName: string;
  @IsOptional() @IsString() middleName?: string;
  @IsString() @IsNotEmpty() lastName: string;
  @IsEmail() email: string;

  // contact
  @IsString() @IsNotEmpty() countryCode: string;
  @IsString() @IsNotEmpty() phoneNo: string;
  @IsString() @IsNotEmpty() username: string;

  @IsOptional() @IsString() employeeId?: string;
  
  // password (required)
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsOptional() @IsString() dob?: string;
  @IsString() @IsNotEmpty() genderId: string;
  @IsString() @IsOptional() departmentId?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsString() @IsOptional() role?: string;
  @IsString() @IsNotEmpty() roleId: string;
  @IsString() @IsNotEmpty() address: string;
}
