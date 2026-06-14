# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Gahoi Sarthi — गहोई सारथी

Niche matrimony app for the Gahoi Bania Hindu community. Phase 1 MVP.

## Before doing anything, read these docs in order:

- `docs/GahoiSarthi_PRD_v4_Final.docx` — what to build, all decisions locked
- `docs/GahoiSarthi_DesignSpec_v1.docx` — all 9 screens, design system, colour palette
- `docs/GahoiSarthi_TechSpec_v1.docx` — monorepo structure, DB schema, API contracts, deployment
- `docs/GahoiSarthi_SecuritySpec_v1.docx` — anti-scraping, data masking, auth hardening

## Stack (locked — do not change)

- Monorepo: Turborepo + pnpm
- Backend: Node.js + Express + TypeScript → Render
- Database: Supabase (PostgreSQL only — REST/GraphQL/Realtime ALL DISABLED)
- ORM: Prisma v5
- Web: Next.js → Netlify
- Mobile: React Native + Expo SDK 51
- Images: Cloudflare R2 (private bucket, signed URLs only)
- Email/OTP: Resend
- Payments: Razorpay
- i18n web: next-intl | i18n mobile: i18next

## Structure

apps/backend · apps/web · apps/admin · apps/mobile
packages/shared · packages/email-templates

## Commands

```bash
pnpm dev              # start all apps
pnpm build            # build all
pnpm test             # run all tests
pnpm typecheck        # typecheck all packages
pnpm lint             # lint all packages
pnpm format           # prettier write

# Per-app (use --filter to scope)
pnpm --filter backend dev
pnpm --filter backend test
pnpm --filter backend test -- --testPathPattern=auth   # single test file
pnpm --filter mobile dev      # opens Expo Go / Metro

# Prisma (always run from repo root or with --filter backend)
pnpm prisma migrate dev       # run pending migrations (uses DIRECT_URL)
pnpm prisma migrate deploy    # apply in production
pnpm --filter backend prisma db seed
```

## Environment setup

Each app has its own env file — never share across apps:

| App | File |
|-----|------|
| `apps/backend` | `.env` |
| `apps/web` | `.env.local` |
| `apps/admin` | `.env.local` |
| `apps/mobile` | `.env` (prefix vars with `EXPO_PUBLIC_`) |

See `.env.example` at repo root for all required variables.

Database has two URLs — both required:
- `DATABASE_URL` — transaction pooler (port 6543, pgBouncer) — used at runtime
- `DIRECT_URL` — session pooler (port 5432) — used only for `prisma migrate`

JWT keys must be RS256 PEM files, base64-encoded (`base64 private.pem > JWT_PRIVATE_KEY`).

## Architecture

### Backend module pattern

Every feature under `apps/backend/src/modules/<name>/` follows a strict three-file layout:

- `<name>.routes.ts` — Express router only: mounts guards, rate limiters, delegates to service
- `<name>.service.ts` — All business logic; no HTTP objects (`req`/`res`) allowed here
- `<name>.schema.ts` — Zod schemas for request validation

Auth middleware lives in `src/middleware/auth-guard.ts`. Use `authGuard` for user routes, `adminAuthGuard` + `requireAdminRole()` for admin routes.

### API response envelope

Every endpoint returns this exact shape — no exceptions:

```json
{ "success": true, "data": <payload>, "error": null, "meta": { "next_cursor": "..." } }
```

Errors: `success: false`, `data: null`, `error: "<message>"`.

### Three-tier profile visibility

Enforced in every serialiser — never skip:

| Tier | Function | PII |
|------|----------|-----|
| Free user / any list | `serializeProfileCard()` | None |
| Paid, no mutual interest | `serializeMaskedProfile()` | Masked |
| Paid + mutual accepted interest | `serializeFullProfile()` | Full |

Masking functions are in `packages/shared/src/utils/masking.ts` — always import from there.

### Authentication flow

1. User sends email → OTP sent via Resend (hashed, 10-min expiry, max 5 attempts with escalating lockout)
2. User submits OTP → access token (15 min, RS256) + refresh token (30 days)
3. Google OAuth alternative: exchange `id_token` at `POST /v1/auth/google`
4. Admin login: separate token with `type: 'admin'` claim, 8-hour expiry

### Mobile (Expo Router)

File-based routing under `apps/mobile/app/`:
- `(auth)/login.tsx` — unauthenticated entry
- `(tabs)/` — main tab navigator (home, interests, shortlist, settings)
- `profile/wizard.tsx` — profile creation wizard
- `profile/[id].tsx` — view another user's profile
- `payment/checkout.tsx` — Razorpay checkout

Tokens stored in `expo-secure-store`. Language preference in `AsyncStorage` and DB.

### Shared package

`packages/shared/src/`:
- `schemas/` — Zod schemas shared across backend and frontend
- `types/` — TypeScript interfaces
- `utils/masking.ts` — PII masking (import from `@gahoisarthi/shared`)
- `constants/` — app-wide constants

`packages/email-templates/` — React Email components consumed by `apps/backend`.

## Critical rules — never break these

- ALL business logic in Render backend. No Supabase Edge Functions ever.
- Never use `prisma.$queryRawUnsafe()` — parameterised queries only.
- Contact PII (mobile, email, address) never returned in list/search API responses.
- Use masking functions from `packages/shared/src/utils/masking.ts` for all sensitive fields.
- Three-tier profile visibility: free → no PII | paid+no match → masked | paid+matched → full.
- R2 bucket is PRIVATE. All images served via signed URLs with 2-hour expiry.
- JWT algorithm must be RS256 explicitly — never `'none'` or HS256.
- Cursor-based pagination only — never expose offset or skip parameters.
- OTP comparison must use `crypto.timingSafeEqual()` — never `===`.
- Razorpay webhook: verify HMAC-SHA256 signature + timestamp freshness (< 5 min) before processing.
- Subscription tier upgrade + payment record must be a single Prisma transaction.

## Work in order

Follow the 20-task checklist in TechSpec Section 13 exactly. Do not skip ahead.
Task 1 complete. Current task: Task 2.

## Never do without asking

- Change the tech stack
- Skip a task in the checklist
- Add a third-party service not in the docs
- Commit to main directly

## Skills — read before relevant tasks

- Architecture & imports: `.claude/skills/gahoi-architecture.md`
- API patterns & serialisation: `.claude/skills/gahoi-api-patterns.md`
- Security rules: `.claude/skills/gahoi-security-rules.md`
- Bilingual UI: `.claude/skills/gahoi-i18n-patterns.md`
