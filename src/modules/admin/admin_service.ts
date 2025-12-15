import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ArangoProvider } from '../../database/arango.provider';
import * as bcrypt from 'bcrypt';
import { aql } from 'arangojs';
import { COLLECTIONS } from 'src/utills/constant/const_collections';
import { AdminLeaveActionDto } from './dto/admin-leave-action.dto';
import { COMMON_STRING } from 'src/utills/constant/const_strings';

@Injectable()
export class AdminService {
  private db;
  private users;
  private attendance;
  private applyLeaves;
  private leaveBalance;
  constructor(
    @Inject('ARANGO_CONNECTION') private readonly arango: ArangoProvider,
  ) {
    this.db = this.arango.getDb();
    this.users = this.db.collection(COLLECTIONS.USERS);
    this.attendance = this.db.collection(COLLECTIONS.ATTENDANCE);
    this.applyLeaves = this.db.collection(COLLECTIONS.APPLY_LEAVES);
    this.leaveBalance = this.db.collection(COLLECTIONS.LEAVE_BALANCE);
  } 
   
  // Create user (admin action)
  async createUser(data: any, managerId: string) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const userData = {
      ...data,
      password: hashedPassword,
      createdBy: managerId,
      createdAt: new Date().toISOString(),
      joinedDate: new Date().toISOString(),
      isActive: true,
    }; 

    const savedUser = await this.users.save(userData);
    
    try {
      const roleId = String(data.roleId);
      const genderId = String(data.genderId);

      if (roleId === COMMON_STRING.USER_ID) {
        const annualLeaveBalance = genderId === COMMON_STRING.FEMALE_KEY ? 5 : 3; 

        const leaveBalanceDoc = {
          userKey: savedUser._key,
          leavesBalance: [
            { id: "1", name: "Casual/Sick Leave", balance: 24 , total : 24},
            { id: "2", name: "Annual Leave", balance: annualLeaveBalance , total : annualLeaveBalance}
          ],
          isActive: true,
          createdDate: new Date().toISOString(),
        };

        await this.leaveBalance.save(leaveBalanceDoc);
      }
    } catch (err) {
      console.error("Error while creating leave balance doc:", err);
    }

    return {
      message: 'New user created successfully',
      statusCode: 201,
      data: {
        _key: savedUser._key,
        _id: savedUser._id,
        _rev: savedUser._rev,
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
        address: {
          street: userData.address?.street,
          cityName: userData.address?.cityName,
          cityId: userData.address?.cityId,
          stateName: userData.address?.stateName,
          stateId: userData.address?.stateId,
          zipCode: userData.address?.zipCode,
          countryName: userData.address?.countryName,
          countryId: userData.address?.countryId,
        },
        createdBy: userData.createdBy,
        createdAt: userData.createdAt,
        joinedDate : userData.joinedDate
      },
    };
  }

  // Find by email (admin helper)
  async findByEmail(email: string) {
    const cursor = await this.db.query(aql`
      FOR u IN ${this.users}
        FILTER u.email == ${email}
        LIMIT 1
        RETURN u
    `);
    return cursor.next();
  }

  // Get all users with role "user" (admin list)
  async getAllUsers() {
    const cursor = await this.db.query(aql`
      FOR u IN ${this.users}
      FILTER u.roleId == ${COMMON_STRING.USER_ID} && u.isActive == true
      SORT u.createdAt DESC
      RETURN u 
    `);

    const users = await cursor.all();

    // const formatted = users.map((u) => ({
    //   _key: u._key,
    //   id: u._id,
    //   _rev: u._rev,
    //   firstName: u.firstName,
    //   middleName: u.middleName,
    //   lastName: u.lastName,
    //   email: u.email,
    //   countryCode: u.countryCode,
    //   phoneNo: u.phoneNo,
    //   username: u.username,
    //   dob: u.dob,
    //   genderId: u.genderId,
    //   departmentId: u.departmentId,
    //   isActive: u.isActive,
    //   role: u.role,
    //   roleId: u.roleId,
    //   address: u.address, 
    //   createdBy: u.createdBy,
    //   createdAt: u.createdAt,
    //   joinedDate
    // }));

    return {
      message: 'User list fetched successfully',
      statusCode: 200,
      count: users.length,
      data: users,
    };
  }

  // Delete user by _key
  async deleteUser(key: string) {
    const softDeletePayload = {
      isActive: false,
      deletedAt: new Date(),
    };

    try {
      const result = await this.users.update(key, softDeletePayload);
      return {
        message: 'User soft-deleted successfully',
        statusCode: 200,
        data: {
          key,
          ...softDeletePayload,
        },
      };
    } catch (err) {
      throw new NotFoundException(`User with key ${key} not found or update failed.`);
    }
  }
  
  // Update user by _key (admin)
  async updateUser(key: string, dto: any) { 
    const existing = await this.users.document(key).catch(() => null);
    if (!existing) {
      throw new NotFoundException(`User with key ${key} not found`);
    }

    const updatedUser = {
      ...existing,
      ...dto,
      address: { ...existing.address, ...(dto.address || {}) },
      updatedAt: new Date().toISOString(),
    };

    if (dto.password) {
      const hashed = await bcrypt.hash(dto.password, 10);
      updatedUser.password = hashed;
    } else {
      delete updatedUser.password;
    }

    await this.users.update(key, updatedUser);
    updatedUser.password = dto.password;

    return { 
      message: 'User updated successfully',
      statusCode: 200,
      data: updatedUser,
    }; 
  }

  async getTotalAttendance() {  
    const cursor = await this.db.query(aql`
      FOR att IN ${this.attendance}
        LET userDoc = DOCUMENT(users, att.userKey)
        SORT att.timestamp DESC
        RETURN MERGE(att, {
          userName: CONCAT_SEPARATOR(" ", userDoc.firstName, userDoc.middleName, userDoc.lastName)
        })
    `);

    const totalAttendance = await cursor.all();

    return { 
      message: 'GetTotalAttendance successfully with usernames',
      statusCode: 200,
      count: totalAttendance.length,
      data: totalAttendance,
    };
  }

  async getAllLeavesRequests() {
    const cursor = await this.db.query(aql`
      FOR l IN ${this.applyLeaves} 
        FILTER l.leaveStatus != ${COMMON_STRING.CANCELLED_STATUS_KEY}
        LET userDoc = DOCUMENT(users, l.userKey)
        SORT l.createdDate DESC
        RETURN MERGE(l, {
          userName: (
            userDoc ? 
            CONCAT_SEPARATOR(" ", userDoc.firstName, userDoc.middleName, userDoc.lastName) : 
            null
          )
        }) 
    `);
    const allLeaves = await cursor.all();

    return {
      message: "All leave requests fetched successfully",
      statusCode: 200,
      count: allLeaves.length,
      data: allLeaves,
    };
  }

  // -----------------------------
  // Simple admin action handler
  // -----------------------------
  async adminActionOnLeaveRequest(data: AdminLeaveActionDto) {
    const { leavesId, leavesStatus, approveByKey } = data;

    if (!leavesId) {
      throw new BadRequestException('leavesId is required');
    }

    const actionDate = new Date().toISOString();
    const approverByName = null; // optionally fetch user name from users collection

    // 1) Load leave doc
    const leave = await this.applyLeaves.document(leavesId).catch(() => null);
    if (!leave) {
      return { message: `Leave request with key ${leavesId} not found.`, statusCode: 404 };
    }

    // 2) If APPROVE -> deduct balance then update leave
    if (leavesStatus === COMMON_STRING.APPROVED_STATUS_KEY) {
      // fetch latest leaveBalance doc for the user
      const lbCursor = await this.db.query(aql`
        FOR lb IN ${this.leaveBalance}
          FILTER lb.userKey == ${leave.userKey}
          SORT lb.createdDate DESC
          LIMIT 1
          RETURN lb
      `);
      const leaveBalanceDoc = await lbCursor.next();
      if (!leaveBalanceDoc) {
        throw new BadRequestException('Leave balance not found for user');
      }

      // find balance entry
      const balanceIndex = (leaveBalanceDoc.leavesBalance || []).findIndex(
        (e: any) => String(e.id) === String(leave.leaveType) || e.name === leave.leaveType
      );
      if (balanceIndex === -1) {
        throw new BadRequestException(`User does not have a balance entry for leave type ${leave.leaveType}`);
      }

      const available = Number(leaveBalanceDoc.leavesBalance[balanceIndex].balance || 0);
      const requested = Number(leave.numberOfLeaves || 0); 

      if (available < requested) {
        throw new BadRequestException(
          `Insufficient ${leaveBalanceDoc.leavesBalance[balanceIndex].name} balance to approve. Available: ${available}, required: ${requested}`
        );
      }

      // deduct and update leaveBalance
      const updatedLeavesBalance = leaveBalanceDoc.leavesBalance.map((e: any, idx: number) => {
        if (idx === balanceIndex) {
          return { ...e, balance: Number(e.balance) - requested };
        }
        return e;
      }); 

      await this.leaveBalance.update(leaveBalanceDoc._key, { leavesBalance: updatedLeavesBalance });

      // update leave as approved
      const approvedPayload = {
        leaveStatus: leavesStatus,
        approverByKey: approveByKey,
        approverByName,
        actionDate,
        modifiedDate: actionDate,
      };
      await this.applyLeaves.update(leavesId, approvedPayload);

      const updatedLeave = await this.applyLeaves.document(leavesId);
      return {
        message: 'Leave approved and balance deducted successfully.',
        statusCode: 200,
        data: updatedLeave,
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
    await this.applyLeaves.update(leavesId, updatedFields);
    const updatedLeave = await this.applyLeaves.document(leavesId);
    return {
      message: 'Leave request status updated successfully.',
      statusCode: 200,
      data: updatedLeave,
    };
  }


  

async fetchAttendanceByDate(date: string) {
  const { startOfDay, endOfDay } = this.normalizeDate(date);

  const cursor = await this.db.query(aql`
    FOR att IN ${this.attendance}
      FILTER att.punchTime >= ${startOfDay}
      FILTER att.punchTime <= ${endOfDay}

      LET userDoc = DOCUMENT(users, att.userKey)

      SORT att.punchTime DESC

      RETURN MERGE(att, {
        userName: CONCAT_SEPARATOR(
          " ",
          userDoc.firstName,
          userDoc.middleName,
          userDoc.lastName
        )
      })
  `);

  const data = await cursor.all();

  return {
    message: 'Attendance fetched successfully by date',
    statusCode: 200,
    count: data.length,
    data,
  };
}
 

async fetchLeavesByDate(date: string) {
  const { startOfDay, endOfDay } = this.normalizeDate(date);

  const cursor = await this.db.query(aql`
    FOR leave IN ${this.applyLeaves}
      FILTER leave.startDate <= ${endOfDay}
      FILTER leave.endDate >= ${startOfDay}

      LET userDoc = DOCUMENT(users, leave.userKey)

      SORT leave.createdDate DESC

      RETURN MERGE(leave, {
        userName: CONCAT_SEPARATOR(
          " ",
          userDoc.firstName,
          userDoc.middleName,
          userDoc.lastName
        )
      })
  `);

  const data = await cursor.all();

  return {
    message: 'Leaves fetched successfully by date',
    statusCode: 200,
    count: data.length,
    data,
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
  const parsed = new Date(date);

  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const day = String(parsed.getUTCDate()).padStart(2, '0');

  const dateOnly = `${year}-${month}-${day}`;

  const startOfDay = `${dateOnly}T00:00:00.000Z`;
  const endOfDay = `${dateOnly}T23:59:59.999Z`;

  const cursor = await this.db.query(aql`
    FOR att IN ${this.attendance}
      FILTER att.punchTime >= ${startOfDay}
      FILTER att.punchTime <= ${endOfDay}

      LET userDoc = DOCUMENT(users, att.userKey)

      SORT att.punchTime DESC

      RETURN MERGE(att, {
        userName: CONCAT_SEPARATOR(
          " ",
          userDoc.firstName,
          userDoc.middleName,
          userDoc.lastName
        )
      })
  `);

  const data = await cursor.all();

  return {
    message: 'Admin activities fetched successfully',
    statusCode: 200,
    count: data.length,
    data,
  };
}


  async changePassword(userKey: string, newPassword: string) {
    if (!userKey) {
      throw new BadRequestException('userKey is required');
    }
    if (!newPassword || String(newPassword).length < 6) {
      throw new BadRequestException('newPassword must be at least 6 characters');
    }
    
    // Check user exists
    const userDoc = await this.users.document(userKey).catch(() => null);
    if (!userDoc) {
      throw new NotFoundException(`User with key ${userKey} not found`);
    }

    // Hash the new password
    const hashed = await bcrypt.hash(String(newPassword), 10);

    // Update only the password field (partial update)
    await this.users.update(userKey, { password: hashed, modifiedDate: new Date().toISOString() });
    
    return {
      message: 'Password changed successfully',
      statusCode: 200,
      data: {
        userKey,
      },
    };
  }


}


