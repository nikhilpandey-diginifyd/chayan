import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { eq } from "@chayan/db";
import { aspirantProfiles } from "@chayan/db";
import { userRoleSchema, type UserRole } from "@chayan/shared";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";

/** Current session, or null. Cached for the duration of one request. */
export const getSession = cache(async () => {
  // Read request headers first: this marks the page as dynamic before any
  // runtime-only configuration (secrets, database) is touched.
  const requestHeaders = await headers();
  return getAuth().api.getSession({ headers: requestHeaders });
});

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getSession>>>["user"] & {
  role: UserRole;
};

/** Redirects to sign-in when there is no session. */
export async function requireUser(returnTo: string): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);
  }
  const role = userRoleSchema.catch("aspirant").parse(session.user.role);
  return { ...session.user, role };
}

/** Shows a 404 to anyone without one of the allowed roles, so admin URLs aren't revealed. */
export async function requireRole(
  allowed: readonly UserRole[],
  returnTo: string,
): Promise<SessionUser> {
  const user = await requireUser(returnTo);
  if (!allowed.includes(user.role)) {
    notFound();
  }
  return user;
}

export const getAspirantProfile = cache(async (userId: string) => {
  return getDb().query.aspirantProfiles.findFirst({
    where: eq(aspirantProfiles.userId, userId),
    with: { exam: true, stage: true },
  });
});
