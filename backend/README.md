# Manzil API

NestJS + Prisma + PostgreSQL backend serving the provider, marketplace, and (future) admin frontends.

## Status

**Foundation phase only** — authentication, RBAC, and the full database schema. No business-logic
endpoints (properties, rooms, reservations, payments, etc.) yet. See the root conversation history
for the full plan; this is intentionally step 1 of `recommended_build_order`.

## First-time setup

This project was built in a sandboxed environment that could not reach Prisma's binary CDN
(`binaries.prisma.sh`), so `prisma generate` and `prisma migrate dev` were never actually run here —
only verified by hand-testing the equivalent SQL directly against Postgres (see `prisma/verify.sql`
for exactly what was tested). Two real bugs were caught and fixed after a first real run on Windows:
Prisma 7 moved the datasource URL out of `schema.prisma` into `prisma.config.ts` (a genuine breaking
change in Prisma 7, not a mistake specific to your setup), and `@nestjs/cli`'s `--watch` currently
crashes on Windows/Node 22 with an unrelated `ERR_REQUIRE_CYCLE_MODULE` bug — worked around by running
the app directly with `tsx` instead of the Nest CLI wrapper.

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template and fill in real values
cp .env.example .env
# Edit .env: set DATABASE_URL to your local Postgres, and generate two
# random secrets for JWT_ACCESS_SECRET / JWT_REFRESH_SECRET, e.g.:
#   openssl rand -base64 48

# 3. Create the database (if it doesn't exist yet)
createdb manzil_dev   # or: psql -c "CREATE DATABASE manzil_dev;"

# 4. Generate the Prisma client and run the first migration
npx prisma generate
npx prisma migrate dev --name init

# 5. (Optional) seed an admin + property owner account for local login
npm run prisma:seed

# 6. Start the API
npm run start:dev
```

The API listens on `http://localhost:3000/api/v1` by default. Health check: `GET /api/v1/health`.

Note: `npm run build` / `npm run start` now use `tsc` + plain `node` directly (not `nest build`/
`nest start`), to avoid the `@nestjs/cli` bug mentioned above. If a future `@nestjs/cli` release fixes
it, switching back is a one-line change in `package.json`, not required.

## What's actually implemented

- **Database schema** (`prisma/schema.prisma`) — every entity from the spec's `database_entities`,
  with real foreign keys, enums, and constraints (e.g. a reservation's `check_out` must be after
  `check_in` at the database level, not just in application code).
- **Auth** (`/api/v1/auth/register`, `/login`, `/refresh`, `/logout`) — bcrypt password hashing, JWT
  access + refresh tokens, refresh token rotation (old token is revoked when a new one is issued),
  rate limiting on login/register.
- **RBAC** — `@Roles(...)` decorator + `RolesGuard`, enforced server-side. This is the real
  authorization boundary; the frontend's role-based UI hiding is cosmetic and must never be trusted
  as the actual security control.
- **Global error format, validation, CORS, security headers (helmet)** — see `src/main.ts`.

## What's NOT implemented yet

- Any property/room/reservation/payment/etc. CRUD endpoints — this is "Core API" (spec's next
  build-order phase), not done in this pass.
- Email/phone verification, password reset, 2FA.
- Property-level authorization (e.g. checking a `property_manager` actually belongs to the property
  they're trying to modify) — this needs the properties module to exist first.
- Payment provider integration (HesabPay/AfPay), file uploads, notifications delivery, the sync
  engine for the offline-first provider app, and everything else further down the build order.

## Known limitation from how this was built

`prisma/verify.sql` is a hand-written SQL file used only to test the schema's relational design
directly against Postgres in a sandbox that couldn't run Prisma's own CLI. It is not used by the
app and does not need to be run — `prisma migrate dev` generates the real migration automatically
from `schema.prisma`. It's kept only as a record of what was verified.
