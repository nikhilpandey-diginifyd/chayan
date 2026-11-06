# Security

How Chayan protects accounts, money and personal data, and what to check before launch.
To report a vulnerability, email the address on the Contact page with steps to reproduce.

## What's in place

**Accounts**

- Better Auth: passwords hashed, email confirmation required, sessions in HTTP-only cookies
  (Secure on HTTPS), reset links single-use and valid for one hour.
- Sign-in, sign-up, password reset and verification emails are rate-limited in production.
- Sign-up never reveals whether an email is registered; the owner gets an email instead.
- Redirects after sign-in only go to paths on this site.

**Access control**

- Every private page and API checks the session on the server. `src/proxy.ts` is only a
  fast first redirect.
- Admin pages and APIs return "not found" to non-admins, so admin URLs aren't revealed.
- Bookings, calls, session files and mentor documents are visible only to the people involved
  (and admins). Covered by `apps/web/e2e/security.spec.ts`.
- An admin can't approve their own mentor application.

**Money**

- Prices and the fee split are copied onto each booking when it's made.
- Razorpay payments are confirmed only after verifying Razorpay's signature (checkout) or the
  webhook signature. Webhook events are stored once; repeats are ignored.
- A Postgres exclusion constraint makes overlapping bookings for one mentor impossible.
- Payouts: a booking can be paid out only once (unique constraint); every payout, hold,
  payment and export is in `audit_logs`.
- Live Razorpay keys are refused outside production; test keys are refused in production
  unless `RAZORPAY_ALLOW_TEST_KEYS=1` (staging only).

**Personal data**

- Bank account numbers, UPI IDs and PAN are encrypted with AES-256-GCM
  (`PAYOUT_ENCRYPTION_KEY`). Admin views of these details and exports are audit-logged.
- Mentor documents and session files are private: served only through permission-checked
  routes with `Cache-Control: no-store`, never public URLs.
- Uploaded files are checked by their content, not their name or browser-reported type, and
  size-limited. Profile photos are re-encoded, which strips location data.
- Things we never store are listed in the privacy policy; passwords and card details never
  touch our database.

**Browser protections**

- Content Security Policy limits scripts, frames and connections to this site, Razorpay,
  100ms, YouTube (privacy mode) and Sentry. `frame-ancestors 'none'` and `X-Frame-Options:
DENY` stop clickjacking.
- HSTS, `nosniff`, a strict referrer policy and a permissions policy that only allows camera,
  microphone and screen sharing for this site.
- CSV exports neutralise spreadsheet formulas.

**Abuse limits**

- Postgres-backed rate limits for uploads, bookings, joining calls and reviews
  (`src/lib/rate-limit.ts`); 30 paper downloads per person per day; at most 3 unpaid booking
  holds per aspirant.

**Operations**

- Environment variables are validated at startup; production refuses to start without the
  keys it needs.
- Optional Sentry error monitoring (`SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`) with personal data
  sending off.
- CI runs lint, type checks, unit tests, a migration drift check, a build, a dependency audit
  and the browser test suite on every push.

## Before launch

- [ ] New secrets for production: `BETTER_AUTH_SECRET`, `PAYOUT_ENCRYPTION_KEY`,
      `CRON_SECRET`, Razorpay webhook secret, 100ms webhook secret. Store them in a password
      manager. Never reuse development values.
- [ ] Back up `PAYOUT_ENCRYPTION_KEY` separately: without it, saved bank details can't be read.
- [ ] Razorpay live keys and webhook configured; one real ₹1 payment and refund tested.
- [ ] 100ms keys and webhook configured; one real two-person call tested with the CSP on.
- [ ] Resend domain verified (SPF, DKIM, DMARC) and `EMAIL_FROM` on that domain.
- [ ] Cloudflare R2 bucket private (no public access), API token limited to that bucket.
- [ ] Nightly database backups running, and one restore tested.
- [ ] Admin accounts: strong unique passwords, as few admins as possible.
- [ ] Legal pages reviewed by a lawyer; TDS/GST handling confirmed by a CA.
- [ ] Sentry project created and a test error seen in it.
- [ ] `pnpm audit --prod` clean of high and critical issues.
