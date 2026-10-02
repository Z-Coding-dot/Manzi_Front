# Manzil readiness review — 2026-10-01

**Status: staging candidate; not approved for public production launch.** The requested full-completion bar is not yet met. This file records verified work and known unfinished requirements rather than claiming every element is complete.

## Implemented and checked

- Separate Admin Vite app with restricted login, live platform statistics, user suspension/reactivation and super-admin role changes, property review, reservation oversight, payout decisions, review moderation, support responses, CMS editing/publishing, and audit-log viewing.
- Backend RBAC, property/customer scoping, explicit Nest injection, explicit DTO validation under tsx, atomic refresh rotation, production secrets/origin validation, structured request logging, readiness checks, and graceful shutdown.
- Reservations use server pricing, capacity validation, room-level locking, date-overlap checks including whole-room versus bed bookings, guest linking, check-in/out, cancellation, and extension.
- Cash payment ledger is append-only and rejects overpayment and inconsistent idempotency retries. Cashier totals use actual paid AFN transactions for the Kabul business day. Payout approval does not represent completed bank settlement.
- Notifications, support tickets, post-stay reviews, owner responses, CMS pages/banners/posts/settings, profile updates, and auditable property review decisions have server endpoints.
- Provider reservations, guests, dashboard, notifications, staff, housekeeping, maintenance, and cash collection use actual APIs. Checkout creates a housekeeping task; inspection protects room availability. Existing local demo data is no longer seeded or used for these workflows.
- Marketplace booking, customer booking history/cancellation, property catalog views, and selected CMS pages use actual APIs. Booking currently supports cash on arrival.
- Database migrations were applied with migrate deploy to the local development database, including guest scoping, CMS, property operations, and restrictive guest deletion behavior.
- Backend and all three frontend production builds passed. Backend unit suite: 25 tests passed. Production-mode compiled server smoke checks passed for readiness, admin reads, owner denial, public CMS validation, and rejection of elevated-role registration. Backend/frontend lint commands passed; provider retains non-failing React warnings. Frontend bundles still emit size warnings.
- Admin dashboard checked in English, Dari RTL, and Pashto RTL; users checked in English and Dari. Session refresh was observed restoring an expired admin session. This is not exhaustive browser coverage of all screens.

## Unfinished requirements and launch gates

| Requirement | Current gap |
| --- | --- |
| Authoritative specification | The attached brief references an original product JSON that was not supplied/found. Full spec compliance cannot be certified. |
| Offline-first PMS | Selected reads have IndexedDB snapshots. Offline write queue, sync push/pull, conflict resolution, replay, and account-safe cache cleanup are not implemented. Saving requires a connection. |
| Payments | Live HesabPay/AfPay merchant integration, signed webhooks, settlement, reconciliation, commission accounting, and append-only refunds remain unfinished. No merchant credentials were provided. |
| Account completion | Password recovery, server-backed saved properties and preference storage, and complete frontend session/logout coverage require further work. |
| Inventory/calendar | Per-date rate and availability editor, blackout inventory, property selection UX for multiple properties, media upload storage, and complete onboarding validation/error handling require further work. |
| Marketplace content/search | CMS-featured property ordering, public blog pages, full availability/amenity search, sitemap, and complete metadata coverage require further work. Publish reviewed CMS content in all three locales before launch. |
| Admin operations | Dispute flags, support assignment UI, payout creation/settlement UI, record detail screens and full pagination/filter coverage are incomplete. Platform settings are stored, but arbitrary setting changes do not yet drive every business rule. |
| Localization/UX | Complete empty/error/success states and translation coverage across legacy screens; test every new screen at mobile sizes and in both RTL languages. |
| Production infrastructure | Final domains/TLS, secrets, backup restore test, observability, and payment/email services remain to be configured. Docker engine is unavailable locally; images and adapter-pg inside containers have not been verified. |
| Acceptance evidence | Complete end-to-end test with an isolated customer, owner, staff, admin, published property, cash booking, checkout, review, support request, and second-device scenarios. Current tests do not certify every workflow. |

Do not treat compiling successfully as completion of the requirements above. Do not advertise online payments or offline writes as available.

## Deployment procedure after launch gates are resolved

1. Choose the public marketplace/provider/admin domains and a staging host. Keep production secrets outside source control. Root `.env.example` is for Compose; each frontend uses its own `.env.example`, and the backend has its own example.
2. Generate two distinct random JWT secrets of at least 32 characters. Configure an exact comma-separated CORS allowlist and a strong database password. Compose embeds the password in a connection URL: use URL-safe random characters, or explicitly provide a correctly encoded connection URL.
3. Start Docker Desktop's Linux engine. Run `docker compose config --quiet`, then `docker compose build`, then `docker compose up -d`. The one-shot migration service must succeed before the backend starts. Never run migrate dev against production.
4. Access marketplace at `http://localhost:8080`, provider at `http://localhost:8081`, and admin at `http://localhost:8082`. These ports bind to loopback. A public reverse proxy must intentionally expose the selected domains.
5. Bootstrap the initial administrator with an explicitly supplied `SEED_ADMIN_PASSWORD` (minimum 12 characters) using the backend seed command. Inspect the seed script before running against an existing database; it also seeds a small catalog. Do not reuse development credentials.
6. Terminate HTTPS at the load balancer/reverse proxy. Proxy each frontend to its loopback port and preserve the host and protocol headers. Ensure `/api/v1` goes to the backend. `TRUST_PROXY_HOPS` defaults to 0 for direct local access and 1 for Compose's Nginx. Set it to the exact number of trusted hops in the deployed topology and prevent direct backend access; never blindly trust caller-supplied forwarding headers.
7. Verify `/api/v1/health` for liveness and `/api/v1/health/ready` for database readiness. Check migration logs, anonymous denial of protected endpoints, role isolation, locale behavior, refresh rotation, real write errors, and all acceptance scenarios.
8. Establish monitoring/alerts for availability, errors, database disk space, backup age, and payment reconciliation. Request logs omit tokens and bodies; protect any retained logs.

Local checks without Docker: run `npm ci`, `npm run prisma:generate`, `npm run prisma:deploy`, `npm run build`, `npm test`, and `npm run smoke:production` inside backend. The smoke script needs an isolated database with existing active admin and owner accounts. Run `npm ci` and `npm run build` in each frontend. Admin currently shares provider source components, so provider dependencies must also be installed.

## Backup and recovery

- Take an encrypted off-host PostgreSQL custom-format dump daily and immediately before migrations. Execute pg_dump inside the database container or with a compatible PostgreSQL 17 client. Avoid binary redirection through Windows PowerShell; create the file inside the container, then copy it out with docker cp.
- Retain daily backups for at least 30 days and monthly backups for at least 12 months, subject to the project's data-retention policy. Store access-restricted checksums and backup timestamps. Back up media/object storage separately once uploads are implemented.
- If recovery must lose less than a day of financial records, enable continuous WAL archiving and point-in-time recovery with a managed PostgreSQL service or a configured backup system. Daily dumps alone do not satisfy that recovery objective.
- Restore at least monthly into a separate, non-public database. Validate row counts, financial totals, foreign keys, migration history, and representative bookings before accepting the restore. Record duration and evidence.
- Preserve payment, payout, reservation, and audit history. Never repair a financial discrepancy by modifying existing payment rows. Restore only after recording the outage window and reconciling subsequent transactions.
- Rollback requires a previous application image compatible with the current schema. Do not automatically reverse data migrations or replace the production volume with an untested backup.

## Working-tree note

The provider directory is a nested Git checkout with pre-existing user edits. All changes remain local and uncommitted. Publishing only a parent-repository submodule pointer will not deliver uncommitted provider files; package or commit each relevant repository deliberately before release.
