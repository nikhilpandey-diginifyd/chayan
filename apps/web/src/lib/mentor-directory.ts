import "server-only";
import {
  and,
  arrayContains,
  asc,
  desc,
  eq,
  exams,
  ilike,
  inArray,
  isNotNull,
  mentorAvailabilityRules,
  mentorBlockedDates,
  mentorProfiles,
  mentorServices,
  or,
  sql,
  users,
} from "@chayan/db";
import {
  EXAM_CODES,
  FOCUS_AREAS,
  generateSlots,
  MENTOR_BADGES,
  PREP_LANGUAGES,
  type ExamCode,
  type FocusArea,
  type MentorBadge,
  type PrepLanguage,
} from "@chayan/shared";
import { getBusyIntervals } from "@/lib/bookings";
import { getDb } from "@/lib/db";

export const PAGE_SIZE = 12;
export const SORTS = ["recommended", "price_low", "price_high", "newest"] as const;
export type Sort = (typeof SORTS)[number];

export type DirectoryFilters = {
  exam?: ExamCode;
  language?: PrepLanguage;
  badge?: MentorBadge;
  focus?: FocusArea;
  maxPrice?: number;
  q?: string;
  sort: Sort;
  page: number;
};

function pick<T extends string>(allowed: readonly T[], value: unknown): T | undefined {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : undefined;
}

export function parseFilters(
  params: Record<string, string | string[] | undefined>,
): DirectoryFilters {
  const maxPrice = Number(params.maxPrice);
  const page = Number(params.page);
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 60) : "";
  return {
    exam: pick(EXAM_CODES, params.exam),
    language: pick(PREP_LANGUAGES, params.language),
    badge: pick(MENTOR_BADGES, params.badge),
    focus: pick(FOCUS_AREAS, params.focus),
    maxPrice: Number.isInteger(maxPrice) && maxPrice > 0 ? maxPrice : undefined,
    q: q || undefined,
    sort: pick(SORTS, params.sort) ?? "recommended",
    page: Number.isInteger(page) && page > 1 ? Math.min(page, 100) : 1,
  };
}

/** Conditions every publicly visible mentor meets. */
function publicMentorConditions() {
  return [
    eq(mentorProfiles.status, "active"),
    eq(mentorProfiles.isPublished, true),
    isNotNull(mentorProfiles.slug),
    sql`exists (select 1 from ${mentorServices} s where s.mentor_user_id = ${mentorProfiles.userId} and s.is_active)`,
    sql`exists (select 1 from ${mentorAvailabilityRules} r where r.mentor_user_id = ${mentorProfiles.userId})`,
  ];
}

const minPriceSql = sql<number>`(select min(s.price_paise) from ${mentorServices} s where s.mentor_user_id = ${mentorProfiles.userId} and s.is_active)`;

export async function listMentors(filters: DirectoryFilters) {
  const db = getDb();
  const conditions = publicMentorConditions();

  if (filters.exam) conditions.push(eq(exams.code, filters.exam));
  if (filters.badge) conditions.push(eq(mentorProfiles.badge, filters.badge));
  if (filters.language)
    conditions.push(arrayContains(mentorProfiles.languages, [filters.language]));
  if (filters.focus) conditions.push(arrayContains(mentorProfiles.focusAreas, [filters.focus]));
  if (filters.maxPrice) conditions.push(sql`${minPriceSql} <= ${filters.maxPrice * 100}`);
  if (filters.q) {
    const term = `%${filters.q.replace(/[%_\\]/g, "\\$&")}%`;
    conditions.push(or(ilike(users.name, term), ilike(mentorProfiles.headline, term))!);
  }

  const orderBy =
    filters.sort === "price_low"
      ? [asc(minPriceSql), desc(mentorProfiles.approvedAt)]
      : filters.sort === "price_high"
        ? [desc(minPriceSql), desc(mentorProfiles.approvedAt)]
        : filters.sort === "newest"
          ? [desc(mentorProfiles.approvedAt)]
          : // Recommended: strongest verified result first, then most recent.
            [
              sql`case ${mentorProfiles.badge} when 'selected' then 0 when 'interview_appeared' then 1 when 'mains_qualified' then 2 when 'tier2_qualified' then 2 else 3 end`,
              desc(mentorProfiles.approvedAt),
            ];

  const where = and(...conditions);
  const base = db
    .select({
      userId: mentorProfiles.userId,
      slug: mentorProfiles.slug,
      name: users.name,
      headline: mentorProfiles.headline,
      photoKey: mentorProfiles.photoKey,
      badge: mentorProfiles.badge,
      examShortName: exams.shortName,
      examYear: mentorProfiles.examYear,
      rank: mentorProfiles.rank,
      languages: mentorProfiles.languages,
      focusAreas: mentorProfiles.focusAreas,
      minPricePaise: minPriceSql,
      bufferMinutes: mentorProfiles.bufferMinutes,
      minNoticeHours: mentorProfiles.minNoticeHours,
      bookingWindowDays: mentorProfiles.bookingWindowDays,
    })
    .from(mentorProfiles)
    .innerJoin(users, eq(users.id, mentorProfiles.userId))
    .innerJoin(exams, eq(exams.id, mentorProfiles.examId));

  const [rows, [{ total } = { total: 0 }]] = await Promise.all([
    base
      .where(where)
      .orderBy(...orderBy)
      .limit(PAGE_SIZE)
      .offset((filters.page - 1) * PAGE_SIZE),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(mentorProfiles)
      .innerJoin(users, eq(users.id, mentorProfiles.userId))
      .innerJoin(exams, eq(exams.id, mentorProfiles.examId))
      .where(where),
  ]);

  const nextSlots = await nextAvailableSlots(rows);
  return {
    total,
    mentors: rows.map((row) => ({
      ...row,
      minPricePaise: Number(row.minPricePaise),
      nextSlot: nextSlots.get(row.userId) ?? null,
    })),
  };
}

/** Earliest bookable slot per mentor, using their shortest active session. */
async function nextAvailableSlots(
  mentors: {
    userId: string;
    bufferMinutes: number;
    minNoticeHours: number;
    bookingWindowDays: number;
  }[],
) {
  const result = new Map<string, Date>();
  if (mentors.length === 0) return result;
  const db = getDb();
  const ids = mentors.map((mentor) => mentor.userId);

  const [rules, blocked, services, busy] = await Promise.all([
    db
      .select()
      .from(mentorAvailabilityRules)
      .where(inArray(mentorAvailabilityRules.mentorUserId, ids)),
    db.select().from(mentorBlockedDates).where(inArray(mentorBlockedDates.mentorUserId, ids)),
    db
      .select({
        mentorUserId: mentorServices.mentorUserId,
        duration: mentorServices.durationMinutes,
      })
      .from(mentorServices)
      .where(and(inArray(mentorServices.mentorUserId, ids), eq(mentorServices.isActive, true))),
    getBusyIntervals(ids),
  ]);

  const now = new Date();
  for (const mentor of mentors) {
    const durations = services
      .filter((s) => s.mentorUserId === mentor.userId)
      .map((s) => s.duration);
    if (durations.length === 0) continue;
    const [first] = generateSlots({
      rules: rules.filter((rule) => rule.mentorUserId === mentor.userId),
      blockedDates: blocked
        .filter((row) => row.mentorUserId === mentor.userId)
        .map((row) => row.date),
      busy: busy.get(mentor.userId) ?? [],
      durationMinutes: Math.min(...durations),
      bufferMinutes: mentor.bufferMinutes,
      minNoticeHours: mentor.minNoticeHours,
      bookingWindowDays: mentor.bookingWindowDays,
      now,
    });
    if (first) result.set(mentor.userId, first);
  }
  return result;
}

/** A mentor's public profile, or null if it isn't publicly visible. */
export async function getPublicMentor(
  slug: string,
  options: { includeUnpublished?: boolean } = {},
) {
  const db = getDb();
  const profile = await db.query.mentorProfiles.findFirst({
    where: eq(mentorProfiles.slug, slug),
    with: {
      user: { columns: { name: true } },
      exam: { columns: { shortName: true, id: true } },
      services: {
        where: eq(mentorServices.isActive, true),
        orderBy: asc(mentorServices.durationMinutes),
      },
      availabilityRules: true,
      blockedDates: true,
    },
  });
  if (!profile) return null;

  const isPublic =
    profile.status === "active" &&
    profile.isPublished &&
    profile.services.length > 0 &&
    profile.availabilityRules.length > 0;
  if (!isPublic && !options.includeUnpublished) return null;

  const busy = (await getBusyIntervals([profile.userId])).get(profile.userId) ?? [];
  return { ...profile, isPublic, busy };
}

export async function listPublishedSlugs() {
  return getDb()
    .select({ slug: mentorProfiles.slug, updatedAt: mentorProfiles.updatedAt })
    .from(mentorProfiles)
    .where(and(...publicMentorConditions()));
}
