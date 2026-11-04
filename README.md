# Chayan

Verified UPSC and SSC mentorship marketplace.

## Requirements

- Node.js 22.12 or newer (`nvm use` reads `.nvmrc`)
- pnpm 9 (`corepack enable`)
- Docker Desktop (for local PostgreSQL)

## First-time setup

```bash
corepack enable
pnpm install

# Local database
docker compose up -d

# Environment files
cp .env.example apps/web/.env.local
cp .env.example packages/db/.env
# Then set BETTER_AUTH_SECRET in apps/web/.env.local to the output of:
#   openssl rand -base64 32

# Create tables and reference data
pnpm db:migrate
pnpm db:seed

# Start the app at http://localhost:3000
pnpm dev
```

Check the database connection at http://localhost:3000/api/health.

## Everyday commands

| Command                        | What it does                                               |
| ------------------------------ | ---------------------------------------------------------- |
| `pnpm dev`                     | Start the web app in development                           |
| `pnpm build`                   | Production build of every package                          |
| `pnpm lint` / `pnpm typecheck` | Static checks                                              |
| `pnpm format`                  | Format all files with Prettier                             |
| `pnpm db:generate`             | Create a migration after changing `packages/db/src/schema` |
| `pnpm db:migrate`              | Apply pending migrations                                   |
| `pnpm db:seed`                 | Upsert reference data (exams and stages)                   |
| `pnpm db:studio`               | Browse the database in Drizzle Studio                      |

## Accounts and sign-in

- Email and password sign-up needs a confirmed email address before the first sign-in.
- Without `RESEND_API_KEY`, emails are printed in the terminal running `pnpm dev`. Copy the link
  from there to confirm an account or reset a password.
- Google sign-in appears only when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are both set.
  In Google Cloud, the OAuth client needs the redirect URI
  `<NEXT_PUBLIC_SITE_URL>/api/auth/callback/google`.
- After signing up, run `pnpm db:make-admin your@email.com`, then sign out and in again to open
  `/admin`.

## Mentor applications

- Anyone signed in can apply at `/mentor/apply`: details, documents, then submit.
- Admins review at `/admin/mentors`. Approving creates the mentor profile and changes the user's
  role to `mentor`. Every decision is written to the `audit_logs` table.
- An admin can't review their own application. Test with a second account.
- Documents are private. Without R2 settings they're saved in `apps/web/.uploads` (ignored by
  git); with R2 they go to your bucket. Either way they're only served through
  `/api/documents/<id>` to the applicant and admins.

## Changing the database

1. Edit or add files in `packages/db/src/schema/`.
2. Run `pnpm db:generate` and review the SQL file it creates.
3. Run `pnpm db:migrate`.
4. Commit the schema change and the migration together. CI fails if they are out of sync.

## Project structure

```
apps/web           Next.js app: pages, API routes and (later) admin
packages/db        Drizzle schema, migrations, migrate and seed scripts
packages/shared    Types and constants shared by web and the future mobile app
Dockerfile         Production image (runs migrations, then starts the app)
```

## Deploying with Coolify

1. In Coolify, create a PostgreSQL 16 database and copy its internal connection URL.
2. Create an application from this GitHub repository with build pack **Dockerfile**
   (path `/Dockerfile`, port `3000`).
3. Build variable: `NEXT_PUBLIC_SITE_URL=https://your-domain`.
4. Runtime variables: `DATABASE_URL=<internal Postgres URL>`, `BETTER_AUTH_SECRET` (new value
   from `openssl rand -base64 32`), `RESEND_API_KEY`, `EMAIL_FROM` (an address on a domain
   verified in Resend), `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, the four `R2_*` values
   and optionally `ADMIN_NOTIFY_EMAIL`.
5. Health check path: `/api/health`.
6. Deploy. Each container start applies migrations and refreshes reference data.

Set up a staging app the same way with its own database before production.
