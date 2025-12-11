// File: src/modules/leaves/leaves.service.ts
import { Inject, Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { aql } from "arangojs";
import { ApplyLeavesDto } from "../leaves/dto/apply_leaves.dto";
import { ArangoProvider } from "src/database/arango.provider";
import { COLLECTIONS } from "../../../utills/constant/const_collections";
import { COMMON_STRING } from "src/utills/constant/const_strings";
import { LeavesValidator } from "./helper/leave.helper";

@Injectable()
export class LeavesService {
  private db: any;
  private leavesCollection: any;
  private leavesBalanceCollection: any;

  constructor(@Inject('ARANGO_CONNECTION') private readonly arangoProvider: ArangoProvider) {
    this.db = this.arangoProvider.getDb();
    this.leavesCollection = this.db.collection(COLLECTIONS.APPLY_LEAVES);
    this.leavesBalanceCollection = this.db.collection(COLLECTIONS.LEAVE_BALANCE);
  }

  // Get leaves for a user key
 async getLeavesStatusByUserKey(userKey: string) {
  if (!userKey) {
    throw new BadRequestException('userKey is required');
  }

  const db = this.db;

  const cursor = await db.query(aql`
    FOR l IN ${this.leavesCollection}
      FILTER l.userKey == ${userKey}
      SORT l.appliedAt DESC
      // Fetch approver user doc (if approverByKey exists)
      LET approverDoc = (
        // If approverByKey is missing/null, DOCUMENT will return null
        DOCUMENT(${this.db.collection(COLLECTIONS.USERS)}, l.approverByKey)
      )
      RETURN MERGE(l, {
        approverByName: (
          approverDoc ?
            CONCAT_SEPARATOR(" ",
              approverDoc.firstName,
              approverDoc.middleName,
              approverDoc.lastName
            )
          : null
        )
      })
  `);

  const leavesStatusList = await cursor.all();

  return {
    message: 'Leaves fetched successfully',
    statusCode: 200,
    count: leavesStatusList.length,
    data: leavesStatusList,
  };
}

  async getLeavesBalanceByUserKey(userKey: string) {
    if (!userKey) {
      throw new BadRequestException('userKey is required');
    }

    const db = this.db;

    const cursor = await db.query(aql`
      FOR l IN ${this.leavesBalanceCollection}
        FILTER l.userKey == ${userKey}
        SORT l.createdDate DESC
        LIMIT 1
        RETURN l
    `);

    const leaveBalance = await cursor.next(); // return single document

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
      data: leaveBalance,
    };
  }

  // Apply leaves: saves a new leave record with status 'pending'
  async applyLeaves(userKey: string, dto: ApplyLeavesDto) {
    // Basic required param
    if (!userKey) {
      throw new BadRequestException('userKey is required');
    }

    // Common validation (dates, numberOfLeaves) moved to helper
    LeavesValidator.validateDates(dto.startDate, dto.endDate);
    LeavesValidator.validateNumberOfLeaves(dto.numberOfLeaves);

    // Normalize requested values
    const requested = Number(dto.numberOfLeaves);
    const requestedLeaveType = dto.leaveType; // can be id or name depending on client

    // --- Fetch latest leave balance doc for the user ---
    const lbCursor = await this.db.query(aql`
      FOR lb IN ${this.leavesBalanceCollection}
        FILTER lb.userKey == ${userKey}
        SORT lb.createdDate DESC
        LIMIT 1
        RETURN lb
    `);
    const leaveBalanceDoc = await lbCursor.next();
    if (!leaveBalanceDoc) {
      throw new BadRequestException('Leave balance not found for user');
    }

    // Find relevant balance entry: match by id or name
    const balanceEntry = (leaveBalanceDoc.leavesBalance || []).find((e: any) => String(e.id) === String(requestedLeaveType) || e.name === requestedLeaveType);
    if (!balanceEntry) {
      throw new BadRequestException(`User does not have a balance entry for leave type ${requestedLeaveType}`);
    }

    // --- Monthly cap check ---
    // Use helper to get cap for leave type name
    const cap = LeavesValidator.getMonthlyCapForLeaveName(balanceEntry.name);

    // Determine month start/end based on startDate (NOTE: we consider startDate's month)
    const start = new Date(dto.startDate);
    const monthStartISO = new Date(start.getFullYear(), start.getMonth(), 1).toISOString();
    const monthEndISO = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

    // Sum already taken leaves (exclude Rejected). We sum numberOfLeaves so half-days count.
    const sumCursor = await this.db.query(aql`
      RETURN SUM(
        FOR l IN ${this.leavesCollection}
          FILTER l.userKey == ${userKey}
            AND l.leaveType == ${requestedLeaveType}
            AND l.startDate >= ${monthStartISO}
            AND l.startDate <= ${monthEndISO}
            AND ( !HAS(l, 'leaveStatus') || l.leaveStatus != ${COMMON_STRING.REJECTED_STATUS_KEY} )
          RETURN l.numberOfLeaves
      )
    `);
    const sumArray = await sumCursor.all();
    const alreadyTaken = (sumArray && sumArray.length > 0 && sumArray[0] !== null) ? Number(sumArray[0]) : 0;

    if ((alreadyTaken + requested) > cap) {
      throw new BadRequestException(`${balanceEntry.name} monthly limit exceeded. Already taken: ${alreadyTaken}, requested: ${requested}, cap: ${cap}`);
    }

    // --- Balance sufficiency check ---
    if (balanceEntry.balance < requested) {
      throw new BadRequestException(`Insufficient ${balanceEntry.name} balance. Available: ${balanceEntry.balance}, requested: ${requested}`);
    }

    // Build leave record
    const leaveRecord: any = {
      userKey: dto.userKey || userKey,
      startDate: dto.startDate,
      endDate: dto.endDate,
      leaveType: dto.leaveType,
      reason: dto.reason || null,
      numberOfLeaves: requested,
      leaveDurationsType: dto.leaveDurationsType, // "Full Day" | "Half Day"
      isActive: dto.isActive ?? true,
      createdDate: new Date().toISOString(),
      modifiedDate: null,
      leaveStatus: dto.leaveStatus ?? 'Pending',
      actionDate: null,
      approverByName: null,
      approverByKey: null,
    };

    // --- Save leave & update balance (simple sequential flow) ---
    // NOTE: This sequential approach has a small race condition if two requests happen simultaneously.
    // If you expect concurrency, consider using ArangoDB transactions or optimistic locking with _rev.
    const saved = await this.leavesCollection.save(leaveRecord);

    const response = {
      _key: saved._key,
      _id: saved._id,
      _rev: saved._rev,
      ...leaveRecord,
    };

    return {
      message: 'Leave applied successfully',
      statusCode: 201,
      data: response,
    };
  }

  async cancelLeave(leaveId: string) {
    if (!leaveId) throw new BadRequestException("leaveId is required");

    const db = this.db;

    // Find leave record
    const leave = await this.leavesCollection.document(leaveId).catch(() => null);

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

    await this.leavesCollection.update(leaveId, updatedFields);

    return {
      message: "Leave cancelled successfully",
      statusCode: 200,
      data: { ...leave, ...updatedFields },
    };
  }
}

