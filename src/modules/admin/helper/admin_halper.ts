import { Model } from 'mongoose';
import { UserDoc } from 'src/database/schemas/user.schema';

export class AdminHelper {
  static async generateEmployeeId(userModel: Model<UserDoc>): Promise<string> {
    const lastUser = await userModel.findOne({})
      .sort({ createdAt: -1 })
      .select('employeeId')
      .lean();

    let nextNumber = 1;

    if (lastUser && lastUser.employeeId) {
      const lastId = lastUser.employeeId; // e.g. EMP0005
      const numberPart = parseInt(lastId.replace('EMP', ''), 10);
      nextNumber = numberPart + 1;
    }

    return `EMP${nextNumber.toString().padStart(4, '0')}`;
  }

  static getMonthKeyFromISO(dateStr: string): string {
    const date = new Date(dateStr);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`; // "2025-12"
  }
}