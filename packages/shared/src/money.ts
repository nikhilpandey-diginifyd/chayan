/** All amounts are stored as integer paise. */
export const PLATFORM_FEE_PERCENT = 20;
export const SESSION_PRICE_LIMITS = { minRupees: 99, maxRupees: 9999 } as const;

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatRupees(paise: number): string {
  return inr.format(Math.round(paise / 100));
}

/** The mentor's share of a session price, before tax deductions. */
export function mentorEarningsPaise(pricePaise: number): number {
  return Math.round((pricePaise * (100 - PLATFORM_FEE_PERCENT)) / 100);
}
