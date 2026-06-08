# Gahoi Sarthi — Architecture Rules

Use this skill whenever creating any new file, module, or package in the monorepo.

## Monorepo structure

- apps/backend → Express + TypeScript → Render
- apps/web → Next.js 14 → Netlify (gahoisarthi.in)
- apps/admin → Next.js 14 → Netlify (admin.gahoisarthi.in)
- apps/mobile → React Native + Expo SDK 51
- packages/shared → Zod schemas, types, masking utilities
- packages/email-templates → React Email components

## Import rules

- Always import shared types from @gahoisarthi/shared
- Always import masking functions from @gahoisarthi/shared/utils/masking
- Never duplicate a type or schema that exists in packages/shared
- Never import from another app (e.g. backend importing from web) — only from packages/

## Backend module structure

Every module in apps/backend/src/modules/<name>/ must have:

- <name>.routes.ts — Express router, auth guards, rate limiters applied here
- <name>.service.ts — Business logic only, no HTTP concerns
- <name>.schema.ts — Zod validation schemas for this module
  Never put business logic in routes. Never put HTTP responses in services.

## Database

- Never use prisma.$queryRawUnsafe() — always parameterised queries
- Import PrismaClient from src/db/prisma.ts singleton only — never instantiate directly
- Use DIRECT_URL for migrations, DATABASE_URL (with pgbouncer) for all runtime queries
