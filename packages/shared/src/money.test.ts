import { describe, expect, it } from "vitest";
import {
  aspirantCancellationRefundPaise,
  canReschedule,
  formatRupees,
  mentorEarningsPaise,
  platformFeePaise,
} from "./money";

const start = new Date("2026-11-10T12:30:00Z");
const hoursBefore = (hours: number) => new Date(start.getTime() - hours * 3_600_000);

describe("fee split", () => {
  it("splits 80/20 and always adds up", () => {
    for (const price of [9900, 29900, 59900, 33333, 999900]) {
      expect(mentorEarningsPaise(price) + platformFeePaise(price)).toBe(price);
    }
    expect(mentorEarningsPaise(29900)).toBe(23920);
  });
  it("formats rupees", () => {
    expect(formatRupees(29900)).toBe("₹299");
  });
});

describe("cancellation refunds", () => {
  it("refunds in full 12 hours or more before", () => {
    expect(aspirantCancellationRefundPaise(29900, start, hoursBefore(12))).toBe(29900);
    expect(aspirantCancellationRefundPaise(29900, start, hoursBefore(48))).toBe(29900);
  });
  it("refunds half inside 12 hours", () => {
    expect(aspirantCancellationRefundPaise(29900, start, hoursBefore(11.9))).toBe(14950);
    expect(aspirantCancellationRefundPaise(29900, start, hoursBefore(0.1))).toBe(14950);
  });
  it("refunds nothing after the start", () => {
    expect(aspirantCancellationRefundPaise(29900, start, hoursBefore(-0.1))).toBe(0);
  });
});

describe("rescheduling", () => {
  it("allows one reschedule 12 hours or more before", () => {
    expect(canReschedule(start, 0, hoursBefore(13))).toBe(true);
    expect(canReschedule(start, 1, hoursBefore(13))).toBe(false);
    expect(canReschedule(start, 0, hoursBefore(11))).toBe(false);
  });
});
