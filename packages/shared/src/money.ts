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

/** Booking rules shared by the server, the web app and the mobile app. */
export const BOOKING_POLICY = {
  holdMinutes: 10,
  fullRefundHoursBefore: 12,
  lateCancelRefundPercent: 50,
  rescheduleHoursBefore: 12,
  maxReschedules: 1,
  maxPendingHoldsPerAspirant: 3,
  noteMaxLength: 500,
} as const;

export function platformFeePaise(pricePaise: number): number {
  return pricePaise - mentorEarningsPaise(pricePaise);
}

/** How much an aspirant gets back if they cancel now. */
export function aspirantCancellationRefundPaise(
  pricePaise: number,
  startsAt: Date,
  now: Date = new Date(),
): number {
  const hoursBefore = (startsAt.getTime() - now.getTime()) / 3_600_000;
  if (hoursBefore >= BOOKING_POLICY.fullRefundHoursBefore) return pricePaise;
  if (hoursBefore > 0)
    return Math.round((pricePaise * BOOKING_POLICY.lateCancelRefundPercent) / 100);
  return 0;
}

export function canReschedule(startsAt: Date, rescheduleCount: number, now: Date = new Date()) {
  const hoursBefore = (startsAt.getTime() - now.getTime()) / 3_600_000;
  return (
    rescheduleCount < BOOKING_POLICY.maxReschedules &&
    hoursBefore >= BOOKING_POLICY.rescheduleHoursBefore
  );
}

/** Video session timing rules. */
export const SESSION_POLICY = {
  /** The call opens this many minutes before the start. */
  joinOpensMinutesBefore: 10,
  /** Joining later than this after the start counts as a no-show. */
  noShowGraceMinutes: 10,
  /** The room closes this many minutes after the scheduled end. */
  closeAfterEndMinutes: 5,
  /** Mentor no-shows within 30 days that pause the mentor automatically. */
  mentorNoShowLimit: 3,
} as const;
