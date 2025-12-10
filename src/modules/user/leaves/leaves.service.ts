import { Inject, Injectable, BadRequestException, NotFoundException, ForbiddenException } from "@nestjs/common";
import { aql } from "arangojs";
import { ApplyLeavesDto } from "../leaves/dto/apply_leaves.dto";
import { ArangoProvider } from "src/database/arango.provider";
import {COLLECTIONS} from "../../../utills/constant/const_collections";
import { COMMON_STRING } from "src/utills/constant/const_strings";

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
        RETURN l
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
        RETURN l
    `);

    const leavesBalanceList = await cursor.all();

    return {
      message: 'Leaves Balance fetched successfully',
      statusCode: 200,
      count: leavesBalanceList.length,
      data: leavesBalanceList,
    }; 
  }


  // Apply leaves: saves a new leave record with status 'pending'
  async applyLeaves(userKey: string, dto: ApplyLeavesDto) {
    if (!userKey) {
      throw new BadRequestException('userKey is required');
    }

    // Basic validation: fromDate <= toDate
    const from = new Date(dto.startDate);
    const to = new Date(dto.endDate);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      throw new BadRequestException('Invalid fromDate or toDate');
    }
    if (from > to) {
      throw new BadRequestException('fromDate cannot be after toDate');
    }

   const leaveRecord: any = {
  userKey: dto.userKey,
  startDate: dto.startDate,
  endDate: dto.endDate,
  leaveType: dto.leaveType,
  reason: dto.reason || null,

  numberOfLeaves: dto.numberOfLeaves,
  leaveDurationsType: dto.leaveDurationsType, // "Full Day" | "Half Day"

  isActive: dto.isActive ?? true,

  createdDate: new Date().toISOString(),
  modifiedDate: null,

  leaveStatus: dto.leaveStatus,
  actionDate: null,
  approverByName: null,
  approverByKey: null,
};


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
  if (
    leave.leaveStatus === COMMON_STRING.APPROVED_STATUS_KEY ||
    leave.leaveStatus === COMMON_STRING.REJECTED_STATUS_KEY
  ) {
    throw new BadRequestException("Only pending leaves can be cancelled");
  }

  // 🔥 UPDATE ONLY THE REQUIRED FIELDS (do not modify whole JSON)
  const updatedFields = {
    isActive: false,                // <- deactivate leave
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
