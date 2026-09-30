# Manzil — Continuation Brief for AI Agent

## What this project is

Manzil is a Kabul accommodation platform with three surfaces: a Provider PMS (property management, offline-capable), a public Marketplace (booking), and a standalone Admin console (not started). The Provider app now includes a limited admin property-review queue. Built from a JSON product spec that mandates: feature-by-feature builds (never generate the whole app in one shot), schema before business logic, and server-side-only authorization (frontend role checks are cosmetic, never the real gate).

Brand color: `#0D5A48`. Localization: English / Dari / Pashto, with RTL support for Dari and Pashto.

## Repo layout (as it exists now)

```
Manzil/
├── frontend/
│   ├── provider/        # PMS app — property owners/staff
│   └── marketplace/     # public booking app
└── backend/             # NestJS API (see below)
```

Inside each frontend app, feature code lives under `src/pages/<area>/`, e.g. `src/pages/provider/...` and `src/pages/marketplace/...`, plus `src/pages/auth/` and `src/pages/account/` in the marketplace app. **Keep this convention** — do not flatten it or move features to `src/features/` or similar.

## Frontend stack (both apps, shared conventions)

- Vite + React 19 + TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite`)
- Redux Toolkit + RTK Query for state/data fetching
- Framer Motion for animation
- Radix UI primitives for accessible components
- react-hook-form + zod for forms/validation
- i18next / react-i18next — `en`, `fa-AF` (Dari), `ps-AF` (Pashto), RTL auto-applied for the latter two
- Self-hosted fonts via `@fontsource/*` (low-bandwidth-first, no external font CDN calls)
- `dayjs` + `jalaliday` for Solar Hijri calendar support where dates are shown to users

## Provider app specifics

- Offline-first: Dexie (IndexedDB) persists PMS data locally; a sync layer reconciles with the backend.
- Reusable components live in a shared components directory used across provider pages (forms, tables, modals, calendar widgets) — reuse these rather than rebuilding per-page one-offs.
- The `providerApi.ts` RTK Query layer still uses IndexedDB mocks for many operational pages. Property profile/onboarding, admin property listing/review, rooms, beds, and amenity assignment call the real backend; do not assume all provider pages are synced or server-backed.
- Status as of 2026-09-30: provider admin/super-admin roles have a property-review queue with approve/reject/request-changes actions. Beds now use server room IDs and backend bed CRUD; property and room amenities can be selected from the seeded catalog. Staff, settings, rates, and notifications pages exist, but their backend integration and workflow completeness vary. Dashboard, reservations, guests, reports, and most other operations remain mock/IndexedDB-backed. There is also a flagged gap in `ReservationForm.tsx` around guest-linking — resolve it with the reservation API.

## Marketplace app specifics

- Customer-facing booking flow, same stack as above.
- Folder structure mirrors provider (`src/pages/marketplace/`, `src/pages/auth/`, `src/pages/account/`) — this was an explicit, non-negotiable structural requirement, keep following it for any new marketplace features.

## Backend

- NestJS (ESM: `"type": "module"`, `moduleResolution: "nodenext"` — **all relative imports need explicit `.js` extensions**, even though source files are `.ts`).
- Prisma ORM v7.9.1 — this is a major version with breaking changes from earlier Prisma docs/training data you may know:
  - No `url` in `schema.prisma`'s `datasource` block. URL lives in `prisma.config.ts` via `defineConfig({ datasource: { url: env('DATABASE_URL') } })`.
  - No built-in Rust query engine. `PrismaClient` must be constructed with an explicit driver adapter: `@prisma/adapter-pg`'s `PrismaPg`.
- PostgreSQL.
- Auth: JWT access + refresh tokens, rotation on refresh, refresh tokens stored hashed (SHA-256) in `RefreshToken` table. bcrypt for password hashing.
- RBAC: real server-side enforcement via `@Roles()` decorator + `RolesGuard` reading `request.user.role`. This is the actual security boundary — the frontend's `permissions.ts` is UI-only and must never be treated as enforcement.
- class-validator/class-transformer for DTOs, `@nestjs/throttler` for rate limiting, `helmet` for headers.
- Dev runner: `tsx watch src/main.ts` instead of `@nestjs/cli`'s `nest start --watch` — there's a confirmed upstream `@nestjs/cli` bug on Windows/Node 22/ESM (`ERR_REQUIRE_CYCLE_MODULE`) that this sidesteps.

### Critical gotcha for whoever writes backend code next

Under `tsx` (esbuild-based transpilation), NestJS's implicit constructor-based dependency injection is broken — confirmed by direct testing, not assumption. `esbuild` does not emit `design:paramtypes` reflection metadata for **any** class, decorated or not, extending or not. Practical rule: **every constructor parameter in every `@Injectable()`/`@Controller()` class must have an explicit `@Inject(Token)` decorator**, imported from `@nestjs/common`. Skipping this causes silent `undefined` injection and runtime crashes like `Cannot read properties of undefined (reading 'getOrThrow')` — not caught by `tsc --noEmit`, only at runtime. Already fixed this way: `PrismaService`, `JwtStrategy`. Apply the same pattern to every new provider/controller/guard from here on.

### Database schema (already defined, per spec's `database_entities`)

Models: `User`, `RefreshToken`, `Property`, `PropertyStaff`, `PropertyDocument`, `Room`, `Bed`, `Amenity`, `PropertyAmenity`, `RoomAmenity`, `Guest`, `Reservation`, `ReservationGuest`, `Payment`, `Payout`, `Review`, `Notification`, `SupportTicket`, `AuditLog`, `SyncOperation`, plus ~24 enums. Key rule already implemented: `Reservation → Property` is **not** cascade-deleted (protects financial/audit history); `Room`/`Bed`/`PropertyStaff` → `Property` **are** cascade-deleted (plain inventory). Preserve this asymmetry in any new financial-adjacent relations (`Payment`, `Payout`, `AuditLog` should behave the same way — never cascade-delete financial records).

### Backend status

Done: schema, migrations, seed script, auth module (register/login/refresh/logout), JWT strategy, RolesGuard, users module (me/admin-list), properties CRUD/listing, property documents/staff, property submission and admin review transitions, public approved-property listing, rooms CRUD/rate update, bed CRUD, amenity catalog, and property/room amenity assignments. Review is admin-only and state-checked; room/bed/amenity writes are owner-scoped on the server. Unit tests cover property-review transitions and bed/amenity authorization. Build/lint verified locally; the schema already contains the needed models and relations.

Next Core API module: Guests. Not started: Guests, Reservations (create/check-in/check-out), Payments/Payouts, Reviews, Notifications, Support Tickets, Sync, and audit-log service integration. Continue one module at a time in the order below, then wire each frontend slice as its endpoints ship.

## Instructions for the next agent

1. Build feature by feature, one module at a time — do not attempt the whole Core API in one pass.
2. Before writing business logic for a new module, confirm its Prisma model already matches what's needed; don't alter the financial-record cascade behavior described above.
3. Every new NestJS class needs explicit `@Inject()` on constructor params (see gotcha above) — this is not optional, it will crash silently otherwise under `tsx`.
4. RBAC must be enforced in guards on the backend for every endpoint that isn't public. Never rely on the frontend to hide a button as the actual protection.
5. Match existing folder/naming conventions in both frontend apps (`src/pages/<area>/...`) and the backend (`src/<module>/<module>.service.ts|.controller.ts|.module.ts|dto/`).
6. Once a Core API module ships, wire the corresponding frontend mock layer (`providerApi.ts` in Provider, equivalent in Marketplace) to real RTK Query endpoints instead of mocks — don't leave both in parallel longer than needed.
7. Preserve i18n coverage (en/fa-AF/ps-AF) and RTL correctness for any new UI.
8. Keep offline-first behavior in the Provider app intact when adding new PMS features — new data types need a sync story, not just a live-API-only path.

## Remaining work checklist (literal, per module)

### Backend Core API — build in this order

**1. Properties module — implemented**

- `POST/GET/PATCH/DELETE /properties` and `/properties/:id` — implemented with owner scoping and admin access; delete is a soft suspend and blocks when active reservations exist
- Property documents and staff endpoints — implemented
- `POST /properties/:id/submit` — implemented
- `PATCH /properties/:id/review` — implemented for admin/super_admin; accepts approved, rejected, or changes_requested only while the property is submitted/under_review; only approved listings become published
- Owner resubmission after `changes_requested` is implemented in the Property profile page and backend; approved/rejected listings cannot be resubmitted
- Remaining follow-up: persist reviewer notes and notify owners when a decision is made; add audit events if/when the project defines moderation audit requirements

**2. Rooms & Beds module — implemented**

- `POST/GET/PATCH/DELETE /properties/:id/rooms` — implemented
- `GET/POST /rooms/:id/beds`, `PATCH/DELETE /beds/:id` — implemented with ownership checks and duplicate-bed validation
- `GET /amenities`, `GET/POST/DELETE /properties/:id/amenities`, `GET/POST/DELETE /rooms/:id/amenities` — implemented with ownership checks
- Provider Beds, property-amenity, and room-amenity UI is wired to the backend. The bed form selects a real room. Run `npm run prisma:seed` to populate the amenity catalog in a local database.
- Cascade delete on Room/Bed → Property is already correct in schema; just don't override it in service logic

**3. Guests module — next**

- `POST /guests` (can be created inline during reservation creation, or standalone)
- `GET /guests/:id`, `PATCH /guests/:id`
- `GET /properties/:id/guests` — guest history for a property

**4. Reservations module** (core of the PMS)

- `POST /reservations` — validate room/bed availability against existing reservations before creating
- `GET /reservations` — filterable by property, date range, status
- `GET /reservations/:id`
- `PATCH /reservations/:id` — modify dates/room, re-validate availability
- `POST /reservations/:id/check-in`
- `POST /reservations/:id/check-out`
- `POST /reservations/:id/cancel`
- `ReservationGuest` linking: `POST/DELETE /reservations/:id/guests` — this is the gap already flagged in the frontend's `ReservationForm.tsx`, resolve both sides together
- Never allow delete on a reservation with a linked Payment — schema already blocks cascade, enforce the same intent at the service layer (reject or require explicit admin override)

**5. Payments & Payouts module**

- `POST /reservations/:id/payments` — record payment, never overwrite/edit an existing payment row (append correction records instead, per spec's "never overwrite financial transactions" rule)
- `GET /reservations/:id/payments`
- `POST /payouts` — admin-triggered payout to property owner
- `GET /payouts` — filterable by property/owner
- All payment/payout writes should also write an `AuditLog` entry

**6. Reviews module**

- `POST /reservations/:id/reviews` — only after check-out
- `GET /properties/:id/reviews`
- `PATCH/DELETE` — owner response, admin moderation

**7. Notifications module**

- `GET /notifications` (per user)
- `PATCH /notifications/:id/read`
- Internal service method other modules call to create notifications (reservation confirmed, payment received, etc.) — build this as a shared injectable service, not duplicated per module

**8. Support Tickets module**

- `POST /support-tickets`, `GET`, `PATCH status`, `GET /support-tickets/:id`

**9. Sync module** (for Provider app's offline-first Dexie layer)

- `POST /sync/push` — accept queued `SyncOperation` records from client, apply with conflict resolution, return per-operation success/failure
- `GET /sync/pull` — return server-side changes since a given timestamp/cursor per property
- This is the highest-complexity module — do it last, once Properties/Rooms/Reservations are stable, since it depends on their shapes being final

**10. Audit Log**

- Not a separate CRUD API — a shared service other modules call on every write to financial/reservation records. Add it as you build modules 4–5, don't bolt it on after.

### Frontend — Provider app remaining

- Add persisted reviewer notes and owner-facing decision notifications when the Notifications module is ready (decision actions and owner resubmission are already wired)
- Finish backend wiring for existing staff, settings, rates/availability, notifications, and operational pages
- Preserve offline-first behavior while replacing `providerApi.ts` mocks with real RTK Query endpoints module-by-module; do not do a single big swap at the end
- Fix the `ReservationForm.tsx` guest-linking gap alongside backend Reservations module 4

### Frontend — Marketplace app remaining

Confirm against your actual current state before assigning to the next agent — the last confirmed-built items were the core structure and initial pages. At minimum verify these exist or are still needed:

- Property search/listing page with filters
- Property detail page (photos, amenities, rooms, reviews)
- Booking flow (date select → guest info → payment)
- Account area: booking history, profile, saved properties
- Auth pages: register/login/forgot-password, wired to the backend auth module already built

### Admin console — standalone surface not started

Per spec, needs at minimum:

- User management (list/suspend/change role) — backend `GET/PATCH /users` as admin already partially exists via Users module, extend it
- Dedicated property approval/moderation console (basic queue and decisions currently live in the Provider app)
- Payout approval workflow
- Support ticket queue
- Platform-wide audit log viewer
- This entire surface, frontend and any admin-only backend endpoints, hasn't been started — treat it as Phase 4, after Core API and both existing frontends are wired together
