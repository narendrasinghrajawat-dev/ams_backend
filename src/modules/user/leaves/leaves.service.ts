import { Inject, Injectable, BadRequestException, NotFoundException, ForbiddenException } from "@nestjs/common";
import { aql } from "arangojs";
import { ApplyLeavesDto } from "../leaves/dto/apply_leaves.dto";
import { ArangoProvider } from "src/database/arango.provider";
import {COLLECTIONS} from "../../../utills/constant/const_collections";

@Injectable()
export class LeavesService {
  private db: any;
  private leavesCollection: any;

  constructor(@Inject('ARANGO_CONNECTION') private readonly arangoProvider: ArangoProvider) {
    this.db = this.arangoProvider.getDb();
    this.leavesCollection = this.db.collection(COLLECTIONS.LEAVES);
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

  leaveStatus: "Pending",
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

    // get leave record
    const leave = await this.leavesCollection.document(leaveId).catch(() => null);

    if (!leave) {
      throw new NotFoundException(`Leave with ID ${leaveId} not found`);
    }

    // only pending leaves can be cancelled
    if (leave.status !== 'pending') {
      throw new BadRequestException("Only pending leaves can be cancelled");
    }

    const updatedRecord = {
      ...leave,
      status: "cancelled",
      cancelledAt: new Date().toISOString(),
    };

    await this.leavesCollection.update(leaveId, updatedRecord);

    return {
      message: "Leave cancelled successfully", 
      statusCode: 200,
      data: updatedRecord,
    };
  }
  
  async getAllLeavesRequests() {
  const cursor = await this.db.query(aql`
    FOR l IN ${this.leavesCollection}
      SORT l.appliedAt DESC
      RETURN l
  `);

  const allLeaves = await cursor.all();

  return {
    message: "All leave requests fetched successfully",
    statusCode: 200,
    count: allLeaves.length,
    data: allLeaves,
  };
}

}
