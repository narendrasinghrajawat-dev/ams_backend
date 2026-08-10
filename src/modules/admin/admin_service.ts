import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserDoc } from 'src/database/schemas/user.schema';
import { AttendanceDoc } from 'src/database/schemas/attendance.schema';
import { ApplyLeavesDoc } from 'src/database/schemas/apply_leaves.schema';
import { LeaveBalanceDoc } from 'src/database/schemas/leave_balance.schema';
import { HolidaysDoc } from 'src/database/schemas/holidays.schema';
import { AddedLeavesByAdminDoc } from 'src/database/schemas/added_leaves_by_admin.schema';
import { AdminLeaveActionDto } from './dto/admin-leave-action.dto';
import { COMMON_STRING } from 'src/utills/constant/const_strings';
import { CreateHolidayDto } from './dto/create.holiday.dto';
import { AddLeavesByAdminDto } from './dto/add_leaves_by_admin';
import { AdminHelper } from './helper/admin_halper';
import { formatMongoDoc } from 'src/utills/db-helper';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(UserDoc.name) private readonly userModel: Model<UserDoc>,
    @InjectModel(AttendanceDoc.name) private readonly attendanceModel: Model<AttendanceDoc>,
    @InjectModel(ApplyLeavesDoc.name) private readonly applyLeavesModel: Model<ApplyLeavesDoc>,
    @InjectModel(LeaveBalanceDoc.name) private readonly leaveBalanceModel: Model<LeaveBalanceDoc>,
    @InjectModel(HolidaysDoc.name) private readonly holidaysModel: Model<HolidaysDoc>,
    @InjectModel(AddedLeavesByAdminDoc.name) private readonly addedLeavesByAdminModel: Model<AddedLeavesByAdminDoc>,
  ) {}

  // Create user (admin action)
  async createUser(data: any, managerId: any) {
    const creatorId = typeof managerId === 'object' 
      ? (managerId?.userId || managerId?.sub || managerId?._id || managerId?.email || 'admin')
      : String(managerId || 'admin');

    const cleanEmail = data.email?.trim().toLowerCase();
    
    // 1. Check if email already exists
    const existingEmail = await this.userModel.findOne({ email: cleanEmail });
    if (existingEmail) {
      throw new BadRequestException('A user with this email already exists');
    }

    // 2. Check if username already exists
    if (data.username) {
      const existingUsername = await this.userModel.findOne({ username: data.username?.trim() });
      if (existingUsername) {
        throw new BadRequestException('A user with this username already exists');
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const employeeId = await AdminHelper.generateEmployeeId(this.userModel);

    const userData = {
      ...data,
      email: cleanEmail,
      employeeId,
      password: hashedPassword,
      createdBy: creatorId,
      createdAt: new Date().toISOString(),
      joinedDate: new Date().toISOString(),
      isActive: true,
    }; 

    const savedUser = await new this.userModel(userData).save();
    const formattedUser = formatMongoDoc(savedUser);

    try {
      const roleId = String(data.roleId || '1');
      const genderId = String(data.genderId || '1');

      if (roleId === COMMON_STRING.USER_ID) {
        const annualLeaveBalance = genderId === COMMON_STRING.FEMALE_KEY ? 5 : 3; 

        const leaveBalanceDoc = {
          userKey: formattedUser._key,
          leavesBalance: [
            { id: "1", name: "Casual/Sick Leave", balance: 2 , total : 2},
            { id: "2", name: "Annual Leave", balance: annualLeaveBalance , total : annualLeaveBalance}
          ],
          isActive: true,
          createdDate: new Date().toISOString(),
        };

        await new this.leaveBalanceModel(leaveBalanceDoc).save();
      }
    } catch (err) {
      console.error("Error while creating leave balance doc:", err);
    }
    
    return {
      message: 'New user created successfully',
      statusCode: 201,
      data: {
        _key: formattedUser._key,
        _id: formattedUser._id,
        firstName: userData.firstName,
        middleName: userData.middleName,
        lastName: userData.lastName,
        dob: userData.dob,
        genderId: userData.genderId,
        isActive: userData.isActive,
        email: userData.email,
        countryCode: userData.countryCode,
        phoneNo: userData.phoneNo,
        username: userData.username,
        role: userData.role,
        roleId: userData.roleId,
        departmentId: userData.departmentId,
        address: userData.address,
        createdBy: userData.createdBy,
        createdAt: userData.createdAt,
        joinedDate : userData.joinedDate
      },
    }; 
  }

  // Find by email (admin helper)
  async findByEmail(email: string) {
    const user = await this.userModel.findOne({
      email: { $regex: new RegExp(`^${email.trim()}$`, 'i') },
    }).lean();
    return formatMongoDoc(user);
  }

  // Get all users with role "user" (admin list)
  async getAllUsers() { 
    const users = await this.userModel.find({
      roleId: COMMON_STRING.USER_ID,
      isActive: true,
    }).sort({ createdAt: -1 }).lean();

    const formattedUsers = users.map(u => formatMongoDoc(u));

    return {
      message: 'User list fetched successfully',
      statusCode: 200,
      count: formattedUsers.length,
      data: formattedUsers,
    };
  }

  // Delete user by _key
  async deleteUser(key: string) {
    const softDeletePayload = {
      isActive: false,
      deletedAt: new Date(),
    };
 
    try {
      await this.userModel.findByIdAndUpdate(key, softDeletePayload);
      await this.leaveBalanceModel.findOneAndUpdate({ userKey: key }, softDeletePayload);
      return {
        message: 'User soft-deleted successfully',
        statusCode: 200,
      };
    } catch (e) {
      throw new BadRequestException('Error soft deleting user: ' + e.message);
    }
  }

  // Update user by _key
  async updateUser(key: string, dto: any) {
    try {
      const updated = await this.userModel.findByIdAndUpdate(key, dto, { new: true }).lean();
      if (!updated) {
        throw new NotFoundException(`User with key ${key} not found`);
      }
      return {
        message: 'User updated successfully',
        statusCode: 200,
        data: formatMongoDoc(updated),
      };
    } catch (e) {
      throw new BadRequestException('Error updating user: ' + e.message);
    }
  }

  // Get total attendance stats
  async getTotalAttendance() {
    const today = new Date().toISOString().split('T')[0];
    const { startOfDay, endOfDay } = this.normalizeDate(today);

    // Total active users
    const totalUsers = await this.userModel.countDocuments({
      roleId: COMMON_STRING.USER_ID,
      isActive: true,
    });

    // Check-in count (punchType = '1')
    const presentCount = await this.attendanceModel.countDocuments({
      punchTime: { $gte: startOfDay, $lte: endOfDay },
      punchType: COMMON_STRING.PUNCH_IN_KEY,
      isActive: true,
    });

    // Check-out count (punchType = '2')
    const checkOutCount = await this.attendanceModel.countDocuments({
      punchTime: { $gte: startOfDay, $lte: endOfDay },
      punchType: COMMON_STRING.PUNCH_OUT_KEY,
      isActive: true,
    });

    const absentCount = totalUsers - presentCount;

    return {
      message: 'Total attendance fetched successfully',
      statusCode: 200,
      data: {
        totalUsers,
        presentCount,
        absentCount: absentCount < 0 ? 0 : absentCount,
        checkOutCount,
      },
    };
  }

  // Get all leaves requests
  async getAllLeavesRequests() {
    const requests = await this.applyLeavesModel.find({
      isActive: true,
    }).sort({ createdAt: -1 }).lean();

    const formattedRequests: any[] = [];
    for (const r of requests) {
      const formatted = formatMongoDoc(r);
      const userDoc = await this.userModel.findById(formatted.userKey).lean();
      const userName = userDoc
        ? [userDoc.firstName, userDoc.middleName, userDoc.lastName].filter(Boolean).join(" ")
        : "Unknown User";

      formattedRequests.push({
        ...formatted,
        userName,
      });
    }

    return {
      message: 'All leave requests fetched successfully',
      statusCode: 200,
      count: formattedRequests.length,
      data: formattedRequests,
    };
  }

  // Admin action on leave request
  async adminActionOnLeaveRequest(data: AdminLeaveActionDto) {
    const { leavesId, leavesStatus, approveByKey } = data;

    if (!leavesId) {
      throw new BadRequestException('leavesId is required');
    }

    const actionDate = new Date().toISOString();
    const approverByName = null; // optionally fetch user name

    // 1) Load leave doc
    const leave = await this.applyLeavesModel.findById(leavesId).lean();
    if (!leave) {
      return { message: `Leave request with key ${leavesId} not found.`, statusCode: 404 };
    }

    const formattedLeave = formatMongoDoc(leave);

    // 2) If APPROVE -> deduct balance then update leave
    if (leavesStatus === COMMON_STRING.APPROVED_STATUS_KEY) {
      // fetch latest leaveBalance doc for the user
      const leaveBalanceDoc = await this.leaveBalanceModel.findOne({ userKey: formattedLeave.userKey })
        .sort({ createdDate: -1 })
        .lean();

      if (!leaveBalanceDoc) {
        throw new BadRequestException('Leave balance not found for user');
      }

      const formattedBalanceDoc = formatMongoDoc(leaveBalanceDoc);

      // find balance entry
      const balanceIndex = (formattedBalanceDoc.leavesBalance || []).findIndex(
        (e: any) => String(e.id) === String(formattedLeave.leaveType) || e.name === formattedLeave.leaveType
      );
      if (balanceIndex === -1) {
        throw new BadRequestException(`User does not have a balance entry for leave type ${formattedLeave.leaveType}`);
      }

      const available = Number(formattedBalanceDoc.leavesBalance[balanceIndex].balance || 0);
      const requested = Number(formattedLeave.numberOfLeaves || 0); 

      if (available < requested) {
        throw new BadRequestException(
          `Insufficient ${formattedBalanceDoc.leavesBalance[balanceIndex].name} balance to approve. Available: ${available}, required: ${requested}`
        );
      }

      // deduct and update leaveBalance
      const updatedLeavesBalance = formattedBalanceDoc.leavesBalance.map((e: any, idx: number) => {
        if (idx === balanceIndex) {
          return { ...e, balance: Number(e.balance) - requested };
        }
        return e;
      }); 

      await this.leaveBalanceModel.findByIdAndUpdate(formattedBalanceDoc._key, { leavesBalance: updatedLeavesBalance });

      // update leave as approved
      const approvedPayload = {
        leaveStatus: leavesStatus,
        approverByKey: approveByKey,
        approverByName,
        actionDate,
        modifiedDate: actionDate,
      };
      const updated = await this.applyLeavesModel.findByIdAndUpdate(leavesId, approvedPayload, { new: true }).lean();

      return {
        message: 'Leave approved and balance deducted successfully.',
        statusCode: 200,
        data: formatMongoDoc(updated),
      };
    }

    // 3) Non-approve actions (reject/cancel/etc.) -> only update leave doc
    const updatedFields = {
      leaveStatus: leavesStatus,
      approverByKey: approveByKey,
      approverByName,
      actionDate,
      modifiedDate: actionDate,
    };
    const updated = await this.applyLeavesModel.findByIdAndUpdate(leavesId, updatedFields, { new: true }).lean();
    return {
      message: 'Leave request status updated successfully.',
      statusCode: 200,
      data: formatMongoDoc(updated),
    };
  }

  async fetchAttendanceByDate(date: string) {
    const { startOfDay, endOfDay } = this.normalizeDate(date);

    const attendances = await this.attendanceModel.find({
      punchTime: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ punchTime: -1 }).lean();

    const dataList: any[] = [];
    for (const att of attendances) {
      const formatted = formatMongoDoc(att);
      const userDoc = await this.userModel.findById(formatted.userKey).lean();
      const userName = userDoc
        ? [userDoc.firstName, userDoc.middleName, userDoc.lastName].filter(Boolean).join(" ")
        : "Unknown User";

      dataList.push({
        ...formatted,
        userName,
      });
    }

    return {
      message: 'Attendance fetched successfully by date',
      statusCode: 200,
      count: dataList.length,
      data: dataList,
    };
  }

  async fetchLeavesByDate(date: string) {
    const { startOfDay, endOfDay } = this.normalizeDate(date);

    const leaves = await this.applyLeavesModel.find({
      startDate: { $lte: endOfDay },
      endDate: { $gte: startOfDay },
    }).sort({ createdDate: -1 }).lean();

    const dataList: any[] = [];
    for (const leave of leaves) {
      const formatted = formatMongoDoc(leave);
      const userDoc = await this.userModel.findById(formatted.userKey).lean();
      const userName = userDoc
        ? [userDoc.firstName, userDoc.middleName, userDoc.lastName].filter(Boolean).join(" ")
        : "Unknown User";

      dataList.push({
        ...formatted,
        userName,
      });
    }

    return {
      message: 'Leaves fetched successfully by date',
      statusCode: 200,
      count: dataList.length,
      data: dataList,
    };
  }

  private normalizeDate(date: string): { startOfDay: string; endOfDay: string } {
    const parsedDate = new Date(date);
    const year = parsedDate.getUTCFullYear();
    const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getUTCDate()).padStart(2, '0');
    const dateOnly = `${year}-${month}-${day}`;

    return {
      startOfDay: `${dateOnly}T00:00:00.000Z`,
      endOfDay: `${dateOnly}T23:59:59.999Z`,
    };
  }

  async fetchActivitiesByDate(date: string) {
    const { startOfDay, endOfDay } = this.normalizeDate(date);

    const attendances = await this.attendanceModel.find({
      punchTime: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ punchTime: -1 }).lean();

    const dataList: any[] = [];
    for (const att of attendances) {
      const formatted = formatMongoDoc(att);
      const userDoc = await this.userModel.findById(formatted.userKey).lean();
      const userName = userDoc
        ? [userDoc.firstName, userDoc.middleName, userDoc.lastName].filter(Boolean).join(" ")
        : "Unknown User";

      dataList.push({
        ...formatted,
        userName,
      });
    }

    return {
      message: 'Admin activities fetched successfully',
      statusCode: 200,
      count: dataList.length,
      data: dataList,
    };
  }

  async changePassword(userKey: string, newPassword: string) {
    if (!userKey) {
      throw new BadRequestException('userKey is required');
    }
    if (!newPassword || String(newPassword).length < 6) {
      throw new BadRequestException('newPassword must be at least 6 characters');
    }
    
    const userDoc = await this.userModel.findById(userKey);
    if (!userDoc) {
      throw new NotFoundException(`User with key ${userKey} not found`);
    }

    const hashed = await bcrypt.hash(String(newPassword), 10);
    await this.userModel.findByIdAndUpdate(userKey, { password: hashed, modifiedDate: new Date().toISOString() });
    
    return {
      message: 'Password changed successfully',
      statusCode: 200,
      data: {
        userKey,
      },
    };
  }

  async addHoliday(dto: CreateHolidayDto) {
    const isoDate = new Date(dto.date).toISOString();
    const dateKey = isoDate.split('T')[0]; // yyyy-mm-dd

    const exists = await this.holidaysModel.findOne({ date: isoDate }).lean();
    if (exists) {
      throw new BadRequestException('Holiday already exists');
    }

    await new this.holidaysModel({
      date: isoDate,
      name: dto.name,
      type: dto.type, 
      createdById: dto.createdById,               
      createdAt: new Date().toISOString(), 
    }).save(); 

    return { message: 'Holiday added successfully' };
  }

  async addLeavesByAdmin(dto: AddLeavesByAdminDto) {
    const { adminKey, addLeaves, leaveTypeId, actionDate } = dto;
    const monthKey = AdminHelper.getMonthKeyFromISO(actionDate);

    // 1. Check if already executed for this month
    const existing = await this.addedLeavesByAdminModel.findOne({ monthKey, leaveTypeId }).lean();
    if (existing) {
      throw new BadRequestException(`Leaves already added for month ${monthKey}`);
    }

    // 2. Update leave balance for ALL active users
    const balances = await this.leaveBalanceModel.find({ isActive: true });
    for (const balanceDoc of balances) {
      const updatedBalance = (balanceDoc.leavesBalance || []).map((l) => {
        if (String(l.id) === String(leaveTypeId)) {
          return {
            ...l,
            total: (l.total || 0) + Number(addLeaves),
            balance: (l.balance || 0) + Number(addLeaves),
          };
        }
        return l;
      });

      await this.leaveBalanceModel.findByIdAndUpdate(balanceDoc._id, { leavesBalance: updatedBalance });
    }

    const result = await new this.addedLeavesByAdminModel({
      adminKey,
      monthKey,
      leaveTypeId,
      addedLeaves: Number(addLeaves),
      actionDate,
      isActive: true,
    }).save();

    return {
      success: true,
      statusCode: 200,
      message: `Added ${addLeaves} leaves for all users for ${monthKey}`,
      data: formatMongoDoc(result),
    };
  }

  async getAllLeavesByAdmin() {
    const records = await this.addedLeavesByAdminModel.find().sort({ createdAt: -1 }).lean();
    const formatted = records.map(r => formatMongoDoc(r));

    return {
      success: true,
      total: formatted.length,
      statusCode: 200,
      data: formatted,
    };
  }
}
