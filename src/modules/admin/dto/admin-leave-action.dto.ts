import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Data Transfer Object for Admin actions (Approve/Reject) on a Leave Request.
 */
export class AdminLeaveActionDto {
  /**
   * The _key of the leave request document to be updated.
   * This corresponds to the leavesId sent from the frontend.
   */
  @IsString()
  @IsNotEmpty()
  leavesId: string;
 
  /**
   * The new status code for the leave request (e.g., "1" for Approved, "2" for Rejected).
   */
  @IsString()
  @IsNotEmpty()  
  leavesStatus: string;
   
  /**
   * The _key of the user performing the action (the Admin).
   */
  @IsString()
  @IsNotEmpty()
  approveByKey: string;
}