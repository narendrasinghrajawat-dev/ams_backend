

export class AdminHelper {



    static getMonthKeyFromISO(dateStr: string): string {
  const date = new Date(dateStr);

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');

  return `${year}-${month}`; // "2025-12"
} 



}