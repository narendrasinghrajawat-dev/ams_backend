import { Model } from 'mongoose';
import { UserDoc } from 'src/database/schemas/user.schema';

export class AdminHelper {
  static async generateEmployeeId(userModel: Model<UserDoc>): Promise<string> {
    const users = await userModel.find({
      employeeId: { $exists: true, $ne: null }
    }).select('employeeId').lean();

    let maxNumber = 0;
    for (const u of users) {
      if (u.employeeId && typeof u.employeeId === 'string') {
        const match = u.employeeId.match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    }

    let nextNumber = maxNumber + 1;
    let candidate = `EMP${nextNumber.toString().padStart(4, '0')}`;
    while (await userModel.exists({ employeeId: candidate })) {
      nextNumber++;
      candidate = `EMP${nextNumber.toString().padStart(4, '0')}`;
    }

    return candidate;
  }

  static getMonthKeyFromISO(dateStr: string): string {
    const date = new Date(dateStr);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`; // "2025-12"
  }
}