import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsOptional,
} from "class-validator";

export class ApplyLeavesDto {
  // Optional fields for backend-identification
  @IsString()
  @IsOptional()
  key?: string;

  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  rev?: string;

  // Required fields for creating a leave request
  @IsString()
  @IsNotEmpty()
  userKey: string;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsNotEmpty()
  leaveType: string;

  @IsNumber()
  @IsNotEmpty()
  numberOfLeaves: number;

  @IsString()
  @IsNotEmpty()
  leaveDurationsType: string; 

  @IsString()
  halfDayShiftType: string; 

  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;

  // Optional backend fields
  @IsString()
  @IsOptional()
  createdDate?: string;

  @IsString()
  @IsOptional()
  modifiedDate?: string;

  // Fields set by system/approver
  @IsString()
  @IsOptional()
  leaveStatus?: string; // Pending, Approved, Rejected

  @IsString()
  @IsOptional()
  actionDate?: string;

  @IsString()
  @IsOptional()
  approverByName?: string;

  @IsString()
  @IsOptional()
  approverByKey?: string;
}
