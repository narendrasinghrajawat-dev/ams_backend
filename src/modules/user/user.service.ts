import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ArangoProvider } from '../../database/arango.provider';
import * as bcrypt from 'bcrypt';
import { COLLECTIONS } from 'src/utills/constant/const_collections';

@Injectable()
export class UserService {
  private db: any;
  private users: any;

  constructor(@Inject('ARANGO_CONNECTION') private readonly arango: ArangoProvider) {
    this.db = this.arango.getDb();
    this.users = this.db.collection(COLLECTIONS.USERS);
  }

  /**
   * Change user's password (updates only `password` field).
   * @param userKey - _key of the user document
   * @param newPassword - plain text new password
   */
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
