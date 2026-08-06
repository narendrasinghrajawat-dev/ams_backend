import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ApplyLeavesDto } from "../leaves/dto/apply_leaves.dto";
import { COMMON_STRING } from "src/utills/constant/const_strings";
import { LeavesValidator } from "./helper/leave.helper";
import { UserDoc } from "src/database/schemas/user.schema";
import { ApplyLeavesDoc } from "src/database/schemas/apply_leaves.schema";
import { LeaveBalanceDoc } from "src/database/schemas/leave_balance.schema";
import { formatMongoDoc } from "src/utills/db-helper";

@Injectable()
export class LeavesService {
  constructor(
    @InjectModel(UserDoc.name) private readonly userModel: Model<UserDoc>,
    @InjectModel(ApplyLeavesDoc.name) private readonly applyLeavesModel: Model<ApplyLeavesDoc>,
    @InjectModel(LeaveBalanceDoc.name) private readonly leaveBalanceModel: Model<LeaveBalanceDoc>,
  ) {}

  // Get leaves for a user key
  async getLeavesStatusByUserKey(userKey: string) {
    if (!userKey) {
      throw new BadRequestException('userKey is required');
    }

    const leaves = await this.applyLeavesModel.find({ userKey })
      .sort({ createdAt: -1 })
      .lean();

    const formattedLeaves: any[] = [];
    for (const l of leaves) {
      const formatted = formatMongoDoc(l);
      let approverByName: string | null = null;
      if (formatted.approverByKey) {
        const approverDoc = await this.userModel.findById(formatted.approverByKey).lean();
        if (approverDoc) {
          approverByName = [
            approverDoc.firstName,
            approverDoc.middleName,
            approverDoc.lastName
          ].filter(Boolean).join(" ");
        }
      }
      formattedLeaves.push({
        ...formatted,
        approverByName,
      });
    }

    return {
      message: 'Leaves fetched successfully',
      statusCode: 200,
      count: formattedLeaves.length,
      data: formattedLeaves,
    };
  }

  async getLeavesBalanceByUserKey(userKey: string) {
    if (!userKey) {
      throw new BadRequestException('userKey is required');
    }

    const leaveBalance = await this.leaveBalanceModel.findOne({ userKey })
      .sort({ createdDate: -1 })
      .lean();

    if (!leaveBalance) {
      return {
        message: 'No leave balance found for this user',
        statusCode: 404,
        data: null,
      };
    }

    return {
      message: 'Leave balance fetched successfully',
      statusCode: 200,
      data: formatMongoDoc(leaveBalance),
    };
  }

  // Apply leaves: saves a new leave record with status 'pending'
  async applyLeaves(userKey: string, dto: ApplyLeavesDto) {
    if (!userKey) {
      throw new BadRequestException('userKey is required');
    }

    // Common validation
    LeavesValidator.validateDates(dto.startDate, dto.endDate);
    LeavesValidator.validateNumberOfLeaves(dto.numberOfLeaves); 

    const requested = Number(dto.numberOfLeaves);
    const requestedLeaveType = dto.leaveType;

    // Fetch latest leave balance
    const leaveBalanceDoc = await this.leaveBalanceModel.findOne({ userKey })
      .sort({ createdDate: -1 })
      .lean();

    if (!leaveBalanceDoc) {
      throw new BadRequestException('Leave balance not found for user');
    }

    const balanceEntry = (leaveBalanceDoc.leavesBalance || []).find(
      (e: any) =>
        String(e.id) === String(requestedLeaveType) ||
        e.name === requestedLeaveType
    );

    if (!balanceEntry) {
      throw new BadRequestException(
        `User does not have a balance entry for leave type ${requestedLeaveType}`,
      );
    }

    // Monthly cap check
    const cap = LeavesValidator.getMonthlyCapForLeaveName(balanceEntry.name);

    // Month range based on startDate
    const start = new Date(dto.startDate);
    const monthStartISO = new Date(
      start.getFullYear(),
      start.getMonth(),
      1,
    ).toISOString();

    const monthEndISO = new Date(
      start.getFullYear(),
      start.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    ).toISOString();

    // Count ONLY APPROVED leaves in the month
    const approvedLeaves = await this.applyLeavesModel.find({
      userKey,
      leaveType: requestedLeaveType,
      startDate: { $gte: monthStartISO },
      endDate: { $lte: monthEndISO },
      leaveStatus: COMMON_STRING.APPROVED_STATUS_KEY,
    }).lean();

    const approvedTaken = approvedLeaves.reduce((sum, item) => sum + Number(item.numberOfLeaves || 0), 0);

    // BLOCK only if APPROVED leaves already hit cap
    if (approvedTaken >= cap) {
      throw new BadRequestException(
        `${balanceEntry.name} monthly limit reached. ` +
        `Approved leaves: ${approvedTaken}, Limit: ${cap}`,
      );
    }

    // Balance sufficiency check
    if (balanceEntry.balance < requested) {
      throw new BadRequestException(
        `Insufficient ${balanceEntry.name} balance. ` +
        `Available: ${balanceEntry.balance}, Requested: ${requested}`,
      );
    }

    // Build leave record
    const leaveRecord: any = {
      userKey: dto.userKey || userKey,
      startDate: dto.startDate,
      endDate: dto.endDate,
      leaveType: dto.leaveType,
      reason: dto.reason || null,
      numberOfLeaves: requested,
      leaveDurationsType: dto.leaveDurationsType,
      isActive: dto.isActive ?? true,
      createdDate: new Date().toISOString(),
      modifiedDate: null,
      leaveStatus: dto.leaveStatus ?? COMMON_STRING.PENDING_STATUS_KEY,
      halfDayShiftType : dto.halfDayShiftType,
      actionDate: null,
      approverByName: null,
      approverByKey: null,
    };

    // Save leave
    const saved = await new this.applyLeavesModel(leaveRecord).save();
    const formattedSaved = formatMongoDoc(saved);

    return {
      message: 'Leave applied successfully',
      statusCode: 201,
      data: formattedSaved,
    };
  }

  async cancelLeave(leaveId: string) {
    if (!leaveId) throw new BadRequestException("leaveId is required");

    // Find leave record
    const leave = await this.applyLeavesModel.findById(leaveId);

    if (!leave) {
      throw new NotFoundException(`Leave with ID ${leaveId} not found`);
    }

    // Only pending leaves can be cancelled
    if (leave.leaveStatus === COMMON_STRING.APPROVED_STATUS_KEY || leave.leaveStatus === COMMON_STRING.REJECTED_STATUS_KEY) {
      throw new BadRequestException("Only pending leaves can be cancelled");
    }

    const updatedFields = {
      leaveStatus : COMMON_STRING.CANCELLED_STATUS_KEY,
      cancelledAt: new Date().toISOString(), 
    };

    const updated = await this.applyLeavesModel.findByIdAndUpdate(leaveId, updatedFields, { new: true });
    const formatted = formatMongoDoc(updated);

    return {
      message: "Leave cancelled successfully",
      statusCode: 200,
      data: formatted,
    };
  }
}
