import { Body, Controller, Delete, Get, Param, Post, Request } from "@nestjs/common";
import { LeavesService } from "./leaves.service";
import { ApplyLeavesDto } from ",,/../../AMS-NestJS/src/modules/user/leaves/dto/apply_leaves.dto";

@Controller('leaves')
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  // GET /leaves/getLeavesStatus/:key
  @Get('getLeavesStatus/:key')
  async getLeavesStatusByUserKey(@Param("key") userKey: string) {
    return this.leavesService.getLeavesStatusByUserKey(userKey);
  }
  
  // POST /leaves/applyLeaves
  // The API will prefer req.user.sub (JWT) but will accept body.userKey if present.
  @Post('applyLeaves')
  async applyLeaves(@Body() dto: ApplyLeavesDto & { userKey?: string }, @Request() req: any) {
    // prefer authenticated user id, fallback to body.userKey (if present)
    const userKey = dto.userKey || req?.user?.sub || req?.user?.userId;
    if (!userKey) { 
      return {
        message: 'User key not provided. Please login or include userKey in request body.',
        statusCode: 400,
      };
    }

    return this.leavesService.applyLeaves(userKey, dto);
  }

 
    @Delete('cancel/:leaveId')
    cancelLeave(@Param('leaveId') leaveId: string, @Request() req: any) {
        const userKey = req?.user?.sub || req?.user?.userId; // JWT user
        return this.leavesService.cancelLeave(leaveId);
    }
 
    
}
