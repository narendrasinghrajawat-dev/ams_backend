

export class AdminHelper {


 static async generateEmployeeId(db: any): Promise<string> {
  const query = `
    FOR u IN users
    SORT u.createdAt DESC
    LIMIT 1
    RETURN u.employeeId
  `;

  const cursor = await db.query(query);
  const result = await cursor.all();

  let nextNumber = 1;

  if (result.length > 0 && result[0]) {
    const lastId = result[0]; // EMP0005
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