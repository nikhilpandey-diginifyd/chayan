import { PLATFORM_FEE_PERCENT } from "./money";

/**
 * Payout rules. TDS figures follow section 194-O as commonly applied
 * (0.1% with PAN, 5% without, no deduction for individuals whose gross
 * through the platform stays within ₹5 lakh in a financial year).
 * Confirm the rates and threshold with your CA before the first payout.
 */
export const PAYOUT_POLICY = {
  tdsRateBps: 10, // 0.1%
  tdsNoPanRateBps: 500, // 5%
  tdsThresholdPaise: 5_00_000 * 100,
  /** Sessions must have ended this long ago before they're paid out (refund window). */
  holdHours: 48,
} as const;

/** What a finished booking earns, after any refund. Always adds up exactly. */
export function bookingEarnings(pricePaise: number, refundedPaise: number) {
  const grossPaise = Math.max(0, pricePaise - Math.max(0, refundedPaise));
  const mentorSharePaise = Math.round((grossPaise * (100 - PLATFORM_FEE_PERCENT)) / 100);
  return { grossPaise, mentorSharePaise, platformFeePaise: grossPaise - mentorSharePaise };
}

/**
 * TDS for one payout. `financialYearGrossBeforePaise` is the mentor's gross
 * already paid out earlier in the same financial year.
 */
export function payoutTds(input: {
  grossPaise: number;
  hasPan: boolean;
  financialYearGrossBeforePaise: number;
}) {
  if (input.grossPaise <= 0) return 0;
  if (!input.hasPan) return Math.round((input.grossPaise * PAYOUT_POLICY.tdsNoPanRateBps) / 10_000);
  const yearTotal = input.financialYearGrossBeforePaise + input.grossPaise;
  if (yearTotal <= PAYOUT_POLICY.tdsThresholdPaise) return 0;
  return Math.round((input.grossPaise * PAYOUT_POLICY.tdsRateBps) / 10_000);
}

/** Indian financial year (April to March) that a date falls in, e.g. "2026-27". */
export function financialYear(date: Date): { label: string; start: Date; end: Date } {
  const ist = new Date(date.getTime() + 330 * 60_000);
  const year = ist.getUTCMonth() >= 3 ? ist.getUTCFullYear() : ist.getUTCFullYear() - 1;
  const start = new Date(Date.UTC(year, 3, 1) - 330 * 60_000);
  const end = new Date(Date.UTC(year + 1, 3, 1) - 330 * 60_000);
  return { label: `${year}-${String((year + 1) % 100).padStart(2, "0")}`, start, end };
}

export const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const ACCOUNT_NUMBER_PATTERN = /^[0-9]{9,18}$/;
export const UPI_PATTERN = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;

export function maskTail(value: string, visible = 4) {
  return value.length <= visible
    ? value
    : `${"•".repeat(Math.min(6, value.length - visible))}${value.slice(-visible)}`;
}
