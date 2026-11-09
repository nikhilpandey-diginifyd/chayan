import type { Metadata } from "next";
import Link from "next/link";
import {
  and,
  aspirantProfiles,
  count,
  desc,
  emailDeliveries,
  eq,
  gte,
  mentorApplications,
  users,
} from "@chayan/db";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

export default async function AdminPage() {
  await requireRole(["admin"], "/admin");
  const db = getDb();

  const since = hoursAgo(24);
  const [roleCounts, [onboarded], [pending], [failedEmails], recentUsers] = await Promise.all([
    db.select({ role: users.role, total: count() }).from(users).groupBy(users.role),
    db.select({ total: count() }).from(aspirantProfiles),
    db
      .select({ total: count() })
      .from(mentorApplications)
      .where(eq(mentorApplications.status, "submitted")),
    db
      .select({ total: count() })
      .from(emailDeliveries)
      .where(and(eq(emailDeliveries.status, "failed"), gte(emailDeliveries.createdAt, since))),
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(20),
  ]);

  const totalFor = (role: string) => roleCounts.find((row) => row.role === role)?.total ?? 0;
  const stats = [
    { label: "Aspirants", value: totalFor("aspirant") },
    { label: "Finished onboarding", value: onboarded?.total ?? 0 },
    { label: "Mentors", value: totalFor("mentor") },
    { label: "Admins", value: totalFor("admin") },
  ];

  return (
    <div className="py-10">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Admin</h1>

      {(pending?.total ?? 0) > 0 ? (
        <p className="border-pen/30 bg-surface mt-6 rounded-[var(--radius-control)] border px-4 py-3">
          <strong>{pending?.total}</strong> mentor{" "}
          {pending?.total === 1 ? "application is" : "applications are"} waiting for review.{" "}
          <Link href="/admin/mentors" className="text-pen font-semibold">
            Review now
          </Link>
        </p>
      ) : null}

      {(failedEmails?.total ?? 0) > 0 ? (
        <p className="border-omr/40 bg-omr-soft mt-4 rounded-[var(--radius-control)] border px-4 py-3">
          <strong>{failedEmails?.total}</strong> email{failedEmails?.total === 1 ? "" : "s"} failed
          to send in the last 24 hours. Check the <code>email_deliveries</code> table and your
          Resend settings.
        </p>
      ) : null}

      <dl className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="panel border-line bg-surface rounded-[var(--radius-card)] border p-4 sm:p-5"
          >
            <dt className="text-ink-muted text-sm">{stat.label}</dt>
            <dd className="mt-1 text-2xl font-bold">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-12 text-xl font-bold">Latest sign-ups</h2>
      <div className="border-line bg-surface mt-4 overflow-x-auto rounded-[var(--radius-control)] border">
        <table className="data-table w-full min-w-[640px] text-left text-sm">
          <thead className="border-line text-ink-muted border-b">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">
                Name
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Email
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Role
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Email confirmed
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {recentUsers.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3">{user.name}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3 capitalize">{user.role}</td>
                <td className="px-4 py-3">{user.emailVerified ? "Yes" : "No"}</td>
                <td className="px-4 py-3">{dateFormat.format(user.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
