#!/bin/sh
set -e

# Apply pending migrations and refresh reference data before the app starts.
# Both steps are safe to run on every deploy.
node /app/db/migrate.mjs
node /app/db/seed.mjs

exec node /app/apps/web/server.js
