import { describe, expect, it } from "vitest";
import {
  bookingEarnings,
  financialYear,
  payoutTds,
  PAN_PATTERN,
  IFSC_PATTERN,
  UPI_PATTERN,
} from "./payouts";

describe("bookingEarnings", () => {
  it("splits a full session 80/20", () => {
    expect(bookingEarnings(29900, 0)).toEqual({
      grossPaise: 29900,
      mentorSharePaise: 23920,
      platformFeePaise: 5980,
    });
  });
  it("pays on what was kept after a 50% refund", () => {
    expect(bookingEarnings(29900, 14950)).toEqual({
      grossPaise: 14950,
      mentorSharePaise: 11960,
      platformFeePaise: 2990,
    });
  });
  it("pays nothing after a full refund", () => {
    expect(bookingEarnings(29900, 29900).mentorSharePaise).toBe(0);
  });
});

describe("payoutTds", () => {
  it("deducts nothing within ₹5 lakh a year with PAN", () => {
    expect(payoutTds({ grossPaise: 100000, hasPan: true, financialYearGrossBeforePaise: 0 })).toBe(
      0,
    );
  });
  it("deducts 0.1% once the year crosses ₹5 lakh", () => {
    expect(
      payoutTds({ grossPaise: 100000, hasPan: true, financialYearGrossBeforePaise: 4_99_50_000 }),
    ).toBe(100);
  });
  it("deducts 5% without PAN", () => {
    expect(payoutTds({ grossPaise: 100000, hasPan: false, financialYearGrossBeforePaise: 0 })).toBe(
      5000,
    );
  });
});

describe("financialYear", () => {
  it("April to March in IST", () => {
    expect(financialYear(new Date("2026-11-06T00:00:00Z")).label).toBe("2026-27");
    expect(financialYear(new Date("2027-03-31T18:00:00Z")).label).toBe("2026-27"); // 31 Mar 11:30 PM IST
    expect(financialYear(new Date("2027-03-31T18:31:00Z")).label).toBe("2027-28"); // 1 Apr 12:01 AM IST
  });
});

describe("formats", () => {
  it("validates PAN, IFSC and UPI", () => {
    expect(PAN_PATTERN.test("ABCDE1234F")).toBe(true);
    expect(PAN_PATTERN.test("ABCD1234F")).toBe(false);
    expect(IFSC_PATTERN.test("SBIN0001234")).toBe(true);
    expect(IFSC_PATTERN.test("SBIN1001234")).toBe(false);
    expect(UPI_PATTERN.test("ravi.k@okaxis")).toBe(true);
    expect(UPI_PATTERN.test("ravi@")).toBe(false);
  });
});
