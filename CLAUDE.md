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

- `pnpm dev` — start all apps
- `pnpm build` — build all
- `pnpm test` — run all tests
- `pnpm prisma migrate dev` — run migrations (from apps/backend)

## Critical rules — never break these

- ALL business logic in Render backend. No Supabase Edge Functions ever.
- Never use prisma.$queryRawUnsafe() — parameterised queries only.
- Contact PII (mobile, email, address) never returned in list/search API responses.
- Use masking functions from packages/shared/src/utils/masking.ts for all sensitive fields.
- Three-tier profile visibility: free → no PII | paid+no match → masked | paid+matched → full.
- R2 bucket is PRIVATE. All images served via signed URLs with 2-hour expiry.
- JWT algorithm must be RS256 explicitly — never 'none' or HS256.
- Cursor-based pagination only — never expose offset or skip parameters.

## Work in order

Follow the 20-task checklist in TechSpec Section 13 exactly. Do not skip ahead.
Current task: start at Task 1.

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
