import { IsString, IsNumber, IsOptional, IsISO8601 } from 'class-validator';

export class AddLeavesByAdminDto {
  @IsString()
  adminKey: string;

  @IsNumber()
  addLeaves: number; // usually 2
 
  @IsString() 
  leaveTypeId: string; // "1" → Casual/Sick Leave

  @IsString()
  actionDate: string; 

  
} 
