/**
 * Availability and slot generation.
 *
 * All mentor schedules are in India Standard Time. IST is a fixed UTC+05:30
 * with no daylight saving, so conversions are plain arithmetic and this module
 * has no timezone dependency. It runs the same on the server, in the browser
 * and in the mobile app.
 */

export const IST_OFFSET_MINUTES = 330;
export const SLOT_STEP_MINUTES = 15;
export const SESSION_DURATIONS = [15, 30, 60] as const;
export type SessionDuration = (typeof SESSION_DURATIONS)[number];

export const BUFFER_OPTIONS = [0, 5, 10, 15, 30] as const;
export const MIN_NOTICE_OPTIONS = [1, 2, 4, 6, 12, 24, 48] as const;
export const BOOKING_WINDOW_OPTIONS = [7, 14, 21, 30] as const;

export const WEEKDAYS = [
  { value: 1, short: "Mon", long: "Monday" },
  { value: 2, short: "Tue", long: "Tuesday" },
  { value: 3, short: "Wed", long: "Wednesday" },
  { value: 4, short: "Thu", long: "Thursday" },
  { value: 5, short: "Fri", long: "Friday" },
  { value: 6, short: "Sat", long: "Saturday" },
  { value: 0, short: "Sun", long: "Sunday" },
] as const;

/** A weekly window, in minutes from IST midnight. */
export type AvailabilityRule = { weekday: number; startMinute: number; endMinute: number };
export type BusyInterval = { start: Date; end: Date };

export type SlotOptions = {
  rules: AvailabilityRule[];
  /** IST calendar dates (YYYY-MM-DD) the mentor is off. */
  blockedDates?: string[];
  /** Existing bookings or holds. */
  busy?: BusyInterval[];
  durationMinutes: number;
  bufferMinutes: number;
  minNoticeHours: number;
  bookingWindowDays: number;
  now?: Date;
  stepMinutes?: number;
};

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** IST calendar parts for an instant. */
export function istParts(instant: Date) {
  const shifted = new Date(instant.getTime() + IST_OFFSET_MINUTES * MINUTE);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
    minuteOfDay: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}

/** "YYYY-MM-DD" for the IST date of an instant. */
export function istDateKey(instant: Date): string {
  const { year, month, day } = istParts(instant);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** The UTC instant for a given IST date and minute of that day. */
export function istToInstant(dateKey: string, minuteOfDay: number): Date {
  const [year, month, day] = dateKey.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(year, month - 1, day) + (minuteOfDay - IST_OFFSET_MINUTES) * MINUTE);
}

export function formatMinuteOfDay(minute: number): string {
  const hours24 = Math.floor(minute / 60) % 24;
  const minutes = minute % 60;
  const suffix = hours24 < 12 ? "AM" : "PM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

/** Returns a list of problems with a set of weekly rules, or an empty list. */
export function validateRules(rules: AvailabilityRule[]): string[] {
  const problems: string[] = [];
  for (const rule of rules) {
    const label = WEEKDAYS.find((day) => day.value === rule.weekday)?.long ?? "A day";
    if (!Number.isInteger(rule.weekday) || rule.weekday < 0 || rule.weekday > 6) {
      problems.push("A time range has an invalid day.");
    } else if (
      rule.startMinute % SLOT_STEP_MINUTES !== 0 ||
      rule.endMinute % SLOT_STEP_MINUTES !== 0 ||
      rule.startMinute < 0 ||
      rule.endMinute > 24 * 60
    ) {
      problems.push(`${label}: times must be on the quarter hour.`);
    } else if (rule.endMinute <= rule.startMinute) {
      problems.push(`${label}: the end time must be after the start time.`);
    }
  }
  for (const day of WEEKDAYS) {
    const ranges = rules
      .filter((rule) => rule.weekday === day.value)
      .sort((a, b) => a.startMinute - b.startMinute);
    for (let index = 1; index < ranges.length; index++) {
      if (ranges[index]!.startMinute < ranges[index - 1]!.endMinute) {
        problems.push(`${day.long}: two time ranges overlap.`);
        break;
      }
    }
  }
  return problems;
}

/**
 * Bookable start times (UTC instants), earliest first.
 * A slot is offered only if the whole session fits inside one weekly window,
 * respects the notice period, and keeps the buffer clear of busy intervals.
 */
export function generateSlots(options: SlotOptions): Date[] {
  const {
    rules,
    blockedDates = [],
    busy = [],
    durationMinutes,
    bufferMinutes,
    minNoticeHours,
    bookingWindowDays,
    now = new Date(),
    stepMinutes = SLOT_STEP_MINUTES,
  } = options;

  const blocked = new Set(blockedDates);
  const earliest = now.getTime() + minNoticeHours * 60 * MINUTE;
  const bufferMs = bufferMinutes * MINUTE;
  const durationMs = durationMinutes * MINUTE;
  const todayKey = istDateKey(now);
  const slots: Date[] = [];

  for (let offset = 0; offset < bookingWindowDays; offset++) {
    const dayStart = istToInstant(todayKey, 0).getTime() + offset * DAY;
    const dateKey = istDateKey(new Date(dayStart));
    if (blocked.has(dateKey)) continue;
    const weekday = istParts(new Date(dayStart)).weekday;

    const dayRules = rules
      .filter((rule) => rule.weekday === weekday)
      .sort((a, b) => a.startMinute - b.startMinute);

    for (const rule of dayRules) {
      const firstStart = Math.ceil(rule.startMinute / stepMinutes) * stepMinutes;
      for (
        let minute = firstStart;
        minute + durationMinutes <= rule.endMinute;
        minute += stepMinutes
      ) {
        const start = dayStart + minute * MINUTE;
        if (start < earliest) continue;
        const end = start + durationMs;
        const clashes = busy.some(
          (interval) =>
            interval.start.getTime() - bufferMs < end && interval.end.getTime() + bufferMs > start,
        );
        if (!clashes) slots.push(new Date(start));
      }
    }
  }

  return slots;
}

/** Groups slot instants by IST date, keeping order. */
export function groupSlotsByIstDate(slots: Date[]): { dateKey: string; slots: Date[] }[] {
  const groups = new Map<string, Date[]>();
  for (const slot of slots) {
    const key = istDateKey(slot);
    const list = groups.get(key);
    if (list) list.push(slot);
    else groups.set(key, [slot]);
  }
  return [...groups.entries()].map(([dateKey, list]) => ({ dateKey, slots: list }));
}
