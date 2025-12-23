import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/modules/auth/jwt.guard";
import { Roles } from "src/modules/auth/roles.decorator";
import { Role } from "src/modules/auth/roles.enum";
import { RolesGuard } from "src/modules/auth/roles.guard";
import { AdminService } from "./admin_service";
import { CreateUserDto } from "src/modules/user/user-dto/create-user.dto";
import { UpdateUserDto } from "src/modules/user/user-dto/update-user-dto";
import { LoginDto } from "../user/attendance/dto/login.dto";
import { ChangePasswordDto } from "../user/user-dto/change-password.dto";
import { CreateHolidayDto } from "./dto/create.holiday.dto";
import { AddLeavesByAdminDto } from "./dto/add_leaves_by_admin";


@Controller('admin')
export class AdminController {
  
  constructor(private adminService: AdminService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Post('create-user')
  createUser(@Body() dto: CreateUserDto, @Request() req: any) {
    return this.adminService.createUser(dto, req.user); 
  } 

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get('user-list')
  getUserList() {
    return this.adminService.getAllUsers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Delete('delete-user/:key') 
  deleteUser(@Param('key') key: string) {
    return this.adminService.deleteUser(key); 
  }

  @UseGuards(JwtAuthGuard, RolesGuard) 
  @Roles(Role.Admin)     // Only manager can update 
  @Patch('update-user/:key')
  updateUser(
    @Param('key') key: string,
    @Body() dto: UpdateUserDto
  ) {
    return this.adminService.updateUser(key, dto);

  }




 @UseGuards(JwtAuthGuard, RolesGuard) 
  @Roles(Role.Admin)  
  @Get('getTotalAttendance')
  getTotalAttendance() {  
    return this.adminService.getTotalAttendance();
  } 
 
 
    @UseGuards(JwtAuthGuard, RolesGuard) 
     @Roles(Role.Admin)  
    @Get('getAllLeavesRequests')
    getAllLeavesRequests() {
        return this.adminService.getAllLeavesRequests();
    } 

 @UseGuards(JwtAuthGuard, RolesGuard) 
  @Roles(Role.Admin)  
     @Post('adminActionOnLeaveRequest')
    adminActionOnLeaveRequest(@Body() data: any, @Request() req: any) {
        return this.adminService.adminActionOnLeaveRequest(data);
    } 
    

     @UseGuards(JwtAuthGuard, RolesGuard) 
    @Roles(Role.Admin)  
     @Get('fetchLeavesByDate/:date')
    fetchLeavesByDate(@Param('date') date: string,) {
        return this.adminService.fetchLeavesByDate(date);
    } 
    


      @UseGuards(JwtAuthGuard, RolesGuard)  
    @Roles(Role.Admin)  
     @Get('fetchAttendanceByDate/:date')
    fetchAttendanceByDate(@Param('date') date: string,) {
        return this.adminService.fetchAttendanceByDate(date);
    } 


    
      @UseGuards(JwtAuthGuard, RolesGuard)  
    @Roles(Role.Admin)  

    @Get('fetchActivitiesByDate/:date')
fetchActivities(@Param('date') date: string) {
  return this.adminService.fetchActivitiesByDate(date);
}


   @UseGuards(JwtAuthGuard, RolesGuard)  
    @Roles(Role.Admin)  
@Post('changeUserPasswordByAdmin') 
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Request() req: any,
  ) {
    // prefer authenticated user id, fallback to body.userKey (if present) 
    const userKey = dto.userKey || req?.user?.sub || req?.user?.userId;
    if (!userKey) {
      throw new BadRequestException('User key not provided. Please login or include userKey in request body.');
    }

    // delegate to service
    return this.adminService.changePassword(userKey, dto.newPassword);
  }


     @UseGuards(JwtAuthGuard, RolesGuard)  
    @Roles(Role.Admin)  
@Post('addHoliday')  
  async addHoliday(
    @Body() dto: CreateHolidayDto,
    @Request() req: any,
  ) {
    // delegate to service
    return this.adminService.addHoliday(dto);
  }


       @UseGuards(JwtAuthGuard, RolesGuard)  
    @Roles(Role.Admin)  
@Post('addLeavesByAdmin')
async addLeavesByAdmin(
  @Body() dto: AddLeavesByAdminDto,
  @Request() req: any,
) {
  return this.adminService.addLeavesByAdmin(dto); 
} 



   @UseGuards(JwtAuthGuard, RolesGuard)  
    @Roles(Role.Admin)  

@Get('getAllLeavesByAdmin')
async getAllLeavesByAdmin() {
  return this.adminService.getAllLeavesByAdmin();
}
 
 

} 


