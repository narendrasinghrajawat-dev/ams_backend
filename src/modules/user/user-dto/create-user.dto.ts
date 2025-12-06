import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  ValidateNested,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

class AddressDto {
  @IsString() @IsNotEmpty() street: string;
  @IsString() @IsNotEmpty() cityName: string;
  @IsString() @IsNotEmpty() cityId: string;
  @IsString() @IsNotEmpty() stateName: string;
  @IsString() @IsNotEmpty() stateId: string;
  @IsString() @IsNotEmpty() zipCode: string;
  @IsString() @IsNotEmpty() countryName: string;
  @IsString() @IsNotEmpty() countryId: string;
}

export class CreateUserDto {
  @IsString() @IsNotEmpty() firstName: string;
  @IsOptional() @IsString() middleName?: string;
  @IsString() @IsNotEmpty() lastName: string;
  @IsEmail() email: string;

  // contact
  @IsString() @IsNotEmpty() countryCode: string;
  @IsString() @IsNotEmpty() phoneNo: string;
  @IsString() @IsNotEmpty() username: string;

  // NEW: password (required)
  @IsString()
  @IsNotEmpty()
  @MinLength(6)               // optional: enforce min length
  password: string;

  @IsOptional() dob?: string;
  @IsString() @IsNotEmpty() genderId: string;
  @IsString() @IsNotEmpty() departmentId: string;
  @IsString() @IsNotEmpty() isActive: boolean;
  @IsString() @IsNotEmpty() role: string;
  @IsString() @IsNotEmpty() roleId: string;

  @ValidateNested()
  @Type(() => AddressDto)
  @IsNotEmpty()
  address: AddressDto;
}
