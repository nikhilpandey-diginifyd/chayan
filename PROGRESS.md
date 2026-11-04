# Progress

Paste this file at the start of every new chat so the assistant knows the current state.

## Product

Marketplace for UPSC and SSC aspirants: one-to-one paid video sessions with verified
selected candidates (Topmate-style), short prep videos, downloadable previous year papers.
Working brand name: Chayan (change in `apps/web/src/config/site.ts`).

## Decisions

- Web first, Android app (Expo) after a 1-month market test, iOS later
- Monorepo: pnpm + Turborepo (`apps/web`, `packages/db`, `packages/shared`)
- Next.js 16 App Router, one app for web + API routes + admin
- PostgreSQL + Drizzle ORM (snake_case columns), migrations in `packages/db/migrations`
- Auth: Better Auth (Google + email/password)
- Payments: Razorpay; fixed-slot sessions (15/30/60 min) in MVP, no wallet
- Video: 100ms, video calls, camera optional for both, screen share on desktop
- Jobs: pg-boss (no Redis in MVP)
- Hosting: VPS + Coolify + Cloudflare; files on Cloudflare R2
- Email: Resend; monitoring: Sentry + PostHog

## Phases

- [x] Phase 1: Foundation (monorepo, DB + exam taxonomy, landing page, legal pages, health check, Docker, CI)
- [x] Phase 2: Auth (email/password + Google), email verification, password reset, roles, onboarding, dashboard, basic admin
- [x] Phase 3: Mentor application (details, private document upload, declaration) + admin review queue (approve with badge, request changes, reject), emails, audit log, mentor dashboard
- [ ] Phase 4: Mentor profiles, services, availability, discovery
- [ ] Phase 5: Booking + Razorpay payments + refunds
- [ ] Phase 6: 100ms video calls + no-show logic
- [ ] Phase 7: Dashboards, reviews, notes, reminders
- [ ] Phase 8: PYQ library + short videos
- [ ] Phase 9: Manual payouts + finance reports
- [ ] Phase 10: Testing + hardening
- [ ] Phase 11: Launch prep + soft launch

## Phase 2 details

- Better Auth with Drizzle adapter; tables `users`, `sessions`, `accounts`, `verifications`,
  `rate_limits` (uuid ids, cookie prefix `chayan`)
- Roles on `users.role`: aspirant (default), mentor, admin. Admins via `pnpm db:make-admin`
- `aspirant_profiles` (exam, stage, target year, language, attempt) and append-only `consents`
- `src/proxy.ts` redirects to sign-in when there is no session cookie; pages check the real
  session with `requireUser` / `requireRole` in `src/lib/session.ts`
- Emails print to the terminal when `RESEND_API_KEY` is empty

## Phase 3 details

- Tables: `mentor_applications` (one per user; statuses draft, submitted, changes_requested,
  approved, rejected), `mentor_documents`, `mentor_profiles` (created on approval),
  `audit_logs`
- Badges: selected, interview_appeared, mains_qualified (UPSC), tier2_qualified (SSC),
  subject_expert. Admin can grant a lower badge than claimed
- Files: `src/lib/storage.ts` (R2 via aws4fetch, or local `.uploads`); type checked from file
  bytes, 5 MB max, 10 per application; served only via `/api/documents/[id]`
- Mentor area `/mentor` is gated by the `mentor_profiles` row, not the cached session role

## Notes

- Legal pages are drafts. Get them reviewed by a lawyer before taking payments.
