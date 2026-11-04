import { describe, expect, it } from "vitest";
import {
  generateSlots,
  groupSlotsByIstDate,
  istDateKey,
  istToInstant,
  validateRules,
  formatMinuteOfDay,
} from "./slots";

// Monday 2 Nov 2026, 09:00 IST
const MONDAY_9AM_IST = istToInstant("2026-11-02", 9 * 60);

const base = {
  rules: [{ weekday: 1, startMinute: 18 * 60, endMinute: 20 * 60 }], // Mon 6–8 PM
  durationMinutes: 30,
  bufferMinutes: 0,
  minNoticeHours: 2,
  bookingWindowDays: 7,
  now: MONDAY_9AM_IST,
};

const ist = (date: Date) => {
  const key = istDateKey(date);
  const minutes = Math.round((date.getTime() - istToInstant(key, 0).getTime()) / 60000);
  return `${key} ${formatMinuteOfDay(minutes)}`;
};

describe("IST helpers", () => {
  it("converts IST wall time to UTC", () => {
    expect(istToInstant("2026-11-02", 9 * 60).toISOString()).toBe("2026-11-02T03:30:00.000Z");
  });
  it("uses the IST date near midnight", () => {
    expect(istDateKey(new Date("2026-11-02T19:00:00Z"))).toBe("2026-11-03");
  });
});

describe("generateSlots", () => {
  it("offers every 15 minutes inside the window, ending inside it", () => {
    const slots = generateSlots(base).map(ist);
    expect(slots).toEqual([
      "2026-11-02 6:00 PM",
      "2026-11-02 6:15 PM",
      "2026-11-02 6:30 PM",
      "2026-11-02 6:45 PM",
      "2026-11-02 7:00 PM",
      "2026-11-02 7:15 PM",
      "2026-11-02 7:30 PM",
    ]);
  });

  it("respects the minimum notice", () => {
    const now = istToInstant("2026-11-02", 17 * 60); // 5 PM, 2h notice → from 7 PM
    const slots = generateSlots({ ...base, now }).map(ist);
    expect(slots[0]).toBe("2026-11-02 7:00 PM");
  });

  it("skips blocked dates", () => {
    const slots = generateSlots({ ...base, bookingWindowDays: 14, blockedDates: ["2026-11-02"] });
    expect(slots.every((slot) => istDateKey(slot) === "2026-11-09")).toBe(true);
  });

  it("keeps the buffer clear around busy intervals", () => {
    const busy = [
      { start: istToInstant("2026-11-02", 18 * 60 + 30), end: istToInstant("2026-11-02", 19 * 60) },
    ];
    const slots = generateSlots({ ...base, bufferMinutes: 15, busy }).map(ist);
    // 30-min sessions + 15-min buffer: nothing between 5:45 PM and 7:15 PM may overlap
    expect(slots).toEqual(["2026-11-02 7:15 PM", "2026-11-02 7:30 PM"]);
  });

  it("does not offer a 60-minute slot that would spill past the window", () => {
    const slots = generateSlots({ ...base, durationMinutes: 60 }).map(ist);
    expect(slots.at(-1)).toBe("2026-11-02 7:00 PM");
  });

  it("handles windows that end at midnight", () => {
    const rules = [{ weekday: 1, startMinute: 23 * 60, endMinute: 24 * 60 }];
    const slots = generateSlots({ ...base, rules, durationMinutes: 60 }).map(ist);
    expect(slots).toEqual(["2026-11-02 11:00 PM"]);
  });

  it("returns nothing without rules", () => {
    expect(generateSlots({ ...base, rules: [] })).toEqual([]);
  });

  it("groups slots by IST date", () => {
    const groups = groupSlotsByIstDate(generateSlots({ ...base, bookingWindowDays: 8 }));
    expect(groups.map((group) => group.dateKey)).toEqual(["2026-11-02", "2026-11-09"]);
  });
});

describe("validateRules", () => {
  it("accepts separate ranges", () => {
    expect(
      validateRules([
        { weekday: 1, startMinute: 600, endMinute: 720 },
        { weekday: 1, startMinute: 1080, endMinute: 1200 },
      ]),
    ).toEqual([]);
  });
  it("rejects overlaps, reversed and off-grid times", () => {
    expect(
      validateRules([
        { weekday: 2, startMinute: 600, endMinute: 720 },
        { weekday: 2, startMinute: 705, endMinute: 810 },
      ]),
    ).toEqual(["Tuesday: two time ranges overlap."]);
    expect(validateRules([{ weekday: 3, startMinute: 705, endMinute: 600 }])[0]).toMatch(/after/);
    expect(validateRules([{ weekday: 3, startMinute: 601, endMinute: 700 }])[0]).toMatch(/quarter/);
  });
});
