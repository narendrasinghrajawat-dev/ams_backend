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
  @IsEmail() @IsNotEmpty() email: string;

  // contact
  @IsOptional() @IsString() countryCode?: string;
  @IsOptional() @IsString() phoneNo?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() username?: string;

  @IsOptional() @IsString() employeeId?: string;
  
  // password (required)
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  password: string;

  @IsOptional() @IsString() dob?: string;
  @IsOptional() @IsString() genderId?: string;
  @IsOptional() @IsString() departmentId?: string;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @IsString() designation?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() role?: string;
  @IsOptional() @IsString() roleId?: string;
  @IsOptional() @IsString() address?: string;
}
