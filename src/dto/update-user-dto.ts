import {
  IsString,
  IsOptional,
  IsEmail,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

class AddressDto {
  @IsOptional() @IsString() street?: string;
  @IsOptional() @IsString() cityName?: string;
  @IsOptional() @IsString() cityId?: string;
  @IsOptional() @IsString() stateName?: string;
  @IsOptional() @IsString() stateId?: string;
  @IsOptional() @IsString() zipCode?: string;
  @IsOptional() @IsString() countryName?: string;
  @IsOptional() @IsString() countryId?: string;
}

export class UpdateUserDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() middleName?: string;
  @IsOptional() @IsString() lastName?: string;

  @IsOptional() @IsEmail() email?: string;

  @IsOptional() @IsString() countryCode?: string;
  @IsOptional() @IsString() phoneNo?: string;
  @IsOptional() @IsString() username?: string;

  @IsOptional() @IsString() dob?: string;
  @IsOptional() @IsString() genderId?: string;
  @IsOptional() @IsString() departmentId?: string;

  @IsOptional() @IsString() role?: string;
  @IsOptional() @IsString() roleId?: string;

  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  address?: AddressDto;
}
