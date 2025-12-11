import { BadRequestException } from "@nestjs/common";

// File: src/modules/leaves/leaves.validator.ts
export class LeavesValidator {
/**
* Validate start and end dates. Throws BadRequestException if invalid.
*/
static validateDates(startDate: string | Date, endDate: string | Date) {
const s = new Date(startDate);
const e = new Date(endDate);
if (isNaN(s.getTime()) || isNaN(e.getTime())) {
throw new BadRequestException('Invalid startDate or endDate');
}
if (s > e) {
throw new BadRequestException('startDate cannot be after endDate');
} 
}

 
/**
* Validate numberOfLeaves (positive number, allow 0.5 for half day)
*/
static validateNumberOfLeaves(numberOfLeaves: any) {
const n = Number(numberOfLeaves);
if (isNaN(n) || n <= 0) {
throw new BadRequestException('numberOfLeaves must be a positive number (use 0.5 for half day)');
}
}


/**
* Return monthly cap based on leave name. Extend here if you have more leave types.
*/
static getMonthlyCapForLeaveName(leaveName: string): number {
if (!leaveName) return Number.POSITIVE_INFINITY;
const lower = leaveName.toLowerCase();
if (lower.includes('casual') || lower.includes('sick')) return 2;
if (lower.includes('annual')) return 1;
return Number.POSITIVE_INFINITY;
}
}