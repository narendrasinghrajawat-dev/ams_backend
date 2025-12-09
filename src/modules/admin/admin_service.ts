import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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

  constructor(
    @Inject('ARANGO_CONNECTION') private readonly arango: ArangoProvider,
  ) {
    this.db = this.arango.getDb();
    this.users = this.db.collection(COLLECTIONS.USERS);
    this.attendance = this.db.collection(COLLECTIONS.ATTENDANCE);
    this.applyLeaves = this.db.collection(COLLECTIONS.APPLY_LEAVES);
  } 
   
  // Create user (admin action)
  async createUser(data: any, managerId: string) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const userData = {
      ...data,
      password: hashedPassword,
      createdBy: managerId,
      createdAt: new Date().toISOString(),
    };

    const savedUser = await this.users.save(userData);

    return {
      message: 'New user created successfully',
      statusCode: 201,
      data: {
        _key: savedUser._key,
        _id: savedUser._id,
        _rev: savedUser._rev,

        // PERSONAL DATA
        firstName: userData.firstName,
        middleName: userData.middleName,
        lastName: userData.lastName,
        dob: userData.dob,
        genderId: userData.genderId,
        isActive: true,
        
        // CONTACT
        email: userData.email,
        countryCode: userData.countryCode,
        phoneNo: userData.phoneNo,
        username: userData.username,

        // ROLE / DEPARTMENT
        role: userData.role,
        roleId: userData.roleId,
        departmentId: userData.departmentId,

        // ADDRESS (Nested)
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

    const formatted = users.map((u) => ({
      _key: u._key,
      id: u._id,
      _rev: u._rev,

      firstName: u.firstName,
      middleName: u.middleName,
      lastName: u.lastName,

      email: u.email,
      countryCode: u.countryCode,
      phoneNo: u.phoneNo,
      username: u.username,

      dob: u.dob,
      genderId: u.genderId,
      departmentId: u.departmentId,
      isActive: u.isActive,

      role: u.role,
      roleId: u.roleId,

      address: u.address, 

      createdBy: u.createdBy,
      createdAt: u.createdAt,
      
    }));

    return {
      message: 'User list fetched successfully',
      statusCode: 200,
      count: formatted.length,
      data: formatted,
    };
  }

  // Delete user by _key
  async deleteUser(key: string) {
    try {
      await this.users.remove(key);

      return {
        message: 'User deleted successfully',
        statusCode: 200,
        data: {
          key,
        },
      };
    } catch (err) {
      throw new NotFoundException(`User with key ${key} not found`);
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
      address: {
        ...existing.address,
        ...(dto.address || {}),
      },
      updatedAt: new Date().toISOString(),
    };

    // Prevent accidental password overwrite unless admin explicitly sends password (hash if present)
    if (dto.password) {
      const hashed = await bcrypt.hash(dto.password, 10);
      updatedUser.password = hashed;
    } else {
      delete updatedUser.password;
    }

    await this.users.update(key, updatedUser);

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
    LET userDoc = DOCUMENT(users, l.userKey)
    SORT l.createdDate DESC
    RETURN MERGE(l, {
      // 1. Check if userDoc exists (e.g., if userKey was valid)
      // 2. CONCAT_SEPARATOR joins the non-null/non-empty strings with a space
      userName: (
        userDoc ? 
        CONCAT_SEPARATOR(" ", 
          userDoc.firstName, 
          userDoc.middleName, 
          userDoc.lastName
        ) : 
        null // Fallback if the user document is missing
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

 async adminActionOnLeaveRequest(data: AdminLeaveActionDto) {
  const { leavesId, leavesStatus, approveByKey } = data;
  
  // Set the current date for tracking when the action was taken
  const actionDate = new Date().toISOString(); 
  
  // NOTE: approverByName is set to null here. 
  // For a complete solution, you would typically fetch the approver's name 
  // using 'approveByKey' from the 'users' collection and include it here.
  const approverByName = null; 

  try {
    const result = await this.db.query(aql`
      UPDATE ${leavesId} WITH { 
        leaveStatus: ${leavesStatus},
        approverByKey: ${approveByKey},
        actionDate: ${actionDate},
        approverByName: ${approverByName},
        modifiedDate: ${actionDate}
      } IN ${this.applyLeaves}
      RETURN NEW
    `);
    
    // Get the updated document from the cursor
    const updatedDocument = await result.next();
    
    if (!updatedDocument) {
      // If the document wasn't found (i.e., leavesId was invalid)
      return {
        message: `Leave request with key ${leavesId} not found.`,
        statusCode: 404,
      };
    }

    return {
      message: 'Leave request status updated successfully.',
      statusCode: 200,
      data: updatedDocument,
    };
  
  } catch (error) {
    console.error('Error processing admin action on leave request:', error);
    // Propagate a generic error for the controller to handle (e.g., return 500)
    throw new Error('Database error during leave action.');
  }

 }

}
