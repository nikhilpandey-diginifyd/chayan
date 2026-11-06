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
- [x] Phase 4: Mentor profile editor (photo, headline, topics), session prices, weekly availability, publish flow, public mentor list with filters, public profile with slot picker, admin pause/restore, email delivery log
- [x] Phase 5: Booking with 10-min slot hold, Razorpay Checkout (test mode without keys), webhook, cancellations and refunds per policy, one reschedule, booking pages for aspirant/mentor/admin
- [x] Phase 6: 100ms video calls (test-call fallback), join window, presence, session file sharing, scheduler for no-shows/completion/room closing, mentor no-show strikes, existing-account sign-up email, Razorpay live/test key guards
- [x] Phase 7: Reviews (stars, tags, camera question, 7-day edit window, admin hide), mentor session notes, 24h/1h/10-min reminders, review/notes request emails, ratings on profiles and list, dashboard stats
- [x] Phase 8: Previous year papers (admin upload with answer key, public SEO pages, sign-in to download, daily limit, download counts) and short prep videos (YouTube, privacy-friendly player); reviews/notes collapse after saving
- [x] Phase 9: Mentor payout details (encrypted), weekly payouts with 48h hold and TDS (194-O), hold/release, mark paid with UTR + email, bank transfer and TDS CSV exports, mentor earnings page, admin finance totals
- [x] Phase 10: Playwright suite (16 tests) in CI, Postgres rate limits, Content Security Policy and headers, optional Sentry, error pages, pre-hydration submit fix, dependency audit, SECURITY.md
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

## Phase 4 details

- Slot engine in `packages/shared/src/slots.ts` (IST, 15-min grid, buffer, notice, window,
  days off), unit-tested with Vitest. Phase 5 passes existing bookings as `busy`
- Tables: `mentor_services` (15/30/60, ₹99–₹9,999 in paise), `mentor_availability_rules`,
  `mentor_blocked_dates`, `email_deliveries`; new columns on `mentor_profiles` (slug,
  headline, photo_key, focus_areas, stage_codes, is_published, buffer/notice/window)
- A mentor is public only if active + published + has a slug, an active service and hours
- Photos: re-encoded to 400×400 WebP with sharp, served at `/api/mentor-photos/...` with
  long cache; old photo deleted on change
- Pages: `/mentor` (overview, profile, sessions, availability), `/mentors`, `/mentors/[slug]`

## Phase 5 details

- Tables: `bookings` (price/fee/earnings snapshot, hold expiry, reschedule count),
  `payments`, `refunds`, `webhook_events`. Migration 0005 adds a Postgres exclusion
  constraint (btree_gist) so active bookings for one mentor can never overlap
- `src/lib/bookings.ts`: create (mentor row lock + slot re-check), confirmPayment
  (idempotent; auto-refund if paid after the slot was taken), cancel, reschedule, refunds
- Payments: `src/lib/payments/provider.ts` uses Razorpay when keys are set, otherwise
  test mode (blocked in production). Checkout callback verified at
  `/api/payments/razorpay/verify`; webhook at `/api/webhooks/razorpay`
- Policy (`packages/shared/src/money.ts`): full refund 12h+ before, 50% inside 12h,
  mentor/admin cancel = full refund, one reschedule 12h+ before

## Phase 6 details

- 100ms server API in `src/lib/video/hms.ts` (jose JWTs); one room per booking, saved on
  `bookings.video_room_id`; token valid until the room closes
- Attendance on `bookings` (mentor/aspirant first joined, last seen). Client heartbeats every
  30s; with `HMS_WEBHOOK_SECRET` set only 100ms webhooks count
- `src/lib/sessions.ts` settles no-shows 10 min after start and completes sessions 5 min
  after end; `src/lib/jobs.ts` runs it every minute with a lease row in `job_locks`
  (started from `src/instrumentation.ts`)
- `booking_attachments`: photos/PDFs shared in a session, served via `/api/booking-files/[id]`
- Sign-up with an existing email emails the account owner instead of revealing it on screen

## Phase 7 details

- `reviews` (one per completed booking); mentor rating stored as `rating_sum`/`rating_count`
  on `mentor_profiles`, recalculated from visible reviews on every change (`src/lib/reviews.ts`)
- Session notes on `bookings` (`session_summary`, `next_steps`), written by the mentor
- Reminder stamps on `bookings` (`reminder24h/1h/10m_sent_at`, `review_request_sent_at`);
  bookings are stamped before emails go out so nothing is sent twice
- 100ms needs a card on file to create an account: real-video testing is deferred to the
  launch phase; the test-call fallback covers everything else

## Phase 8 details

- Tables: `pyq_papers` (PDF + optional answer key in storage, slug, language, source link,
  download count), `paper_downloads` (who downloaded what, 30/day limit), `prep_videos`
  (YouTube ID, exam, topic, order)
- Public: `/papers`, `/papers/[slug]`, `/videos`, `/videos/[slug]`; all in the sitemap
- Admin: `/admin/papers` (upload via `/api/admin/papers`), `/admin/videos`
- Downloads use plain links, not Next `<Link>`, so prefetching never triggers a download

## Phase 9 details

- Earnings per finished booking = 80% of (price − refunds): completed, aspirant no-show
  (50% kept) and late aspirant cancellation (50% kept). Mentor no-shows earn nothing
- `mentor_payout_accounts` (account number, UPI ID and PAN encrypted with AES-256-GCM via
  `src/lib/crypto.ts`), `payouts` (one per mentor per week), `payout_items` (a booking can be
  paid only once)
- TDS rules in `packages/shared/src/payouts.ts`: 0.1% with PAN once the mentor's financial
  year gross passes ₹5 lakh, 5% without PAN. **Confirm with a CA before the first payout**
- Admin `/admin/payouts`: create the week's payouts, export the bank sheet, mark paid with the
  UTR; `/api/admin/payouts/export?type=tds&fy=2026-27` for TDS returns. Viewing bank details
  and exports are written to the audit log

## Phase 10 details

- `apps/web/e2e`: helpers create users through the real sign-up flow and read emails from
  `e2e/.outbox.jsonl` (`EMAIL_LOG_FILE`, never in production); `global-setup.ts` compiles every
  page and API route before tests so dev-server compiles don't cause timeouts
- `src/lib/rate-limit.ts`: fixed-window limits in `app_rate_limits`, pruned by the scheduler
- CSP and security headers in `next.config.ts`; `CSP_REPORT_ONLY=1` to soften temporarily
- Forms that submit with JavaScript stay disabled until hydrated and use `method="post"`, so
  passwords and bank details can never end up in a URL
- Sentry is optional (`SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`); source-map upload not set up
- Real Razorpay Checkout and 100ms calls are not yet tested with the CSP on (see SECURITY.md)

## Notes

- Legal pages are drafts. Get them reviewed by a lawyer before taking payments.
