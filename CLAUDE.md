# PrepAnyExam

Verified UPSC/SSC mentorship marketplace: paid 1:1 video sessions with selected candidates,
prep videos, and previous-year papers (PYQs). Read `PROGRESS.md` for the current phase and
`README.md` for setup and how each feature behaves locally.

Brand: PrepAnyExam (prepanyexam.io), set in `apps/web/src/config/site.ts`. The project was
first called "Chayan": keep the internal `@chayan/*` package names, the `chayan` auth cookie
prefix and the `chayan` database name as they are (renaming them logs everyone out and breaks
migrations).

## Current focus

- Phases 1–10 and the UI redesign are done. Next is **Phase 11: production launch**, then a
  1-month market test.
- **Do not build any parent-company or SSO features.** Auth must stay easy to swap later
  (see "Auth" below), but nothing for it gets built now.
- Keep changes small and launch-focused. Ask before adding a new dependency or service.

## Layout

- `apps/web`: Next.js 16 App Router. Pages, API routes (`src/app/api`), admin (`src/app/admin`).
  - `src/lib`: server logic (bookings, payments, payouts, sessions, storage, email, rate limits)
  - `src/components`: UI by area; shared primitives in `src/components/ui`
  - `src/env.ts`: zod-validated env vars. Add every new variable here and to `.env.example`
  - `src/proxy.ts`: route protection by session cookie (Next 16's renamed middleware)
  - `src/instrumentation.ts`: in-process scheduler (`DISABLE_SCHEDULER=1` turns it off)
  - `e2e/`: Playwright tests
- `packages/db`: Drizzle schema (`src/schema`), SQL migrations (`migrations`), seed, make-admin
- `packages/shared`: zod schemas and constants shared by web and db

## Commands (run from repo root)

```bash
docker compose up -d            # local Postgres 16 on :5432
pnpm dev                        # http://localhost:3000
pnpm lint && pnpm typecheck     # static checks
pnpm test                       # vitest unit tests
pnpm format                     # prettier (CI runs format:check)
pnpm build                      # production build
pnpm db:generate                # after editing packages/db/src/schema
pnpm db:migrate && pnpm db:seed
pnpm db:make-admin you@email.com
pnpm --filter @chayan/web e2e                   # all Playwright tests (~10 min)
pnpm --filter @chayan/web e2e booking.spec.ts   # one file
```

The e2e tests start their own dev server on port 3000, so stop `pnpm dev` first.

Before saying a change is done, run `pnpm format`, `pnpm lint`, `pnpm typecheck` and `pnpm test`.
Also run the e2e spec for any flow you touched.

## Rules

### Database

- Edit `packages/db/src/schema`, then `pnpm db:generate`, review the SQL, and commit schema and
  migration together. CI fails if they're out of sync. Never hand-edit an applied migration.
- UUID primary keys (`uuid().defaultRandom()`), snake_case columns, timestamps with timezone.
- Money is stored as integer paise.

### Auth (Better Auth 1.7)

- Server code gets the user from `src/lib/session.ts` (`getSession`, `requireUser`,
  `requireRole`). Don't add new direct `getAuth()` calls or `better-auth` imports outside
  `src/lib/auth.ts`, `src/lib/session*.ts` and `src/lib/auth-client.ts`.
- Domain tables reference `users.id` and never copy email or password.
- Keep the password hash format unchanged (Better Auth scrypt, `salt:key` hex in
  `accounts.password`). Existing users depend on it.

### Security

- Never read, print or commit `.env`, `.env.local` or any real key. Use `.env.example`
  for variable names.
- Validate every API input with zod, check ownership/role on every route, and use the
  Postgres rate limiter (`src/lib/rate-limit.ts`) on public mutations.
- Payout details are encrypted with `src/lib/crypto.ts` (AES-256-GCM). Never log them.
- Private files (mentor documents, booking files) are only served through their API routes
  with an access check. Never make them public.
- Keep CSP and security headers in `next.config.ts` working when adding third-party scripts.

### UI

- Theme tokens live in `src/app/globals.css` (Swiggy-style orange: `saffron`, `pen`, `ink`,
  `paper`…). Use the tokens, not raw hex values.
- Fonts: Baloo 2 for display, Mukta for body.
- Animations use `motion/react` with `m.*` components, inside `MotionProvider` (LazyMotion
  `domMax`, strict). Respect reduced motion. Never use `motion.*` because strict mode throws.
- Copy is plain English. Hinglish is fine for aspirant-facing hooks ("Prelims clear nahi ho
  raha?"). Short, friendly, no jargon.
- Mobile first. Check at 375px width.
- Forms disable submit until hydrated (`useHydrated`).

### Payments, video, email

- Locally, without keys: Razorpay runs in a simulated test mode, 100ms gives a self-only test
  call, and emails print in the terminal (written to the e2e outbox during tests).
- Never use live Razorpay keys outside production. Webhooks are the source of truth in
  production (`/api/webhooks/razorpay`, `/api/webhooks/100ms`).

### Tests

- Specs import `{ test, expect }` from `./fixtures` (it filters dev-server reload messages),
  not from `@playwright/test`.
- Tests create uniquely named users. Don't depend on seed users or test order.
- Prefer role/label locators. Use `.first()` only when duplicates are expected.

## Working with the owner

- The owner tests on a Mac and commits/pushes himself. Explain what changed and how to test
  it in simple steps.
- Don't push, force-push or rewrite git history unless asked.
