# Repository instructions

## Stack

Next.js App Router (TypeScript, React) with API routes under `app/api`. Data access goes through the `prisma` singleton from `@/lib/prisma`; external helpers live in `@/lib`.

## Commands

- Install: `npm i` (run at the repository root, where `package.json` lives).
- Dev server: `npm run dev`
- Lint: `npm run lint`
- Typecheck: `npx tsc --noEmit`

## API conventions

Use the `api-route-builder` skill (`.agents/skills/api-route-builder/SKILL.md`) for any work on `app/api`. Protected routes go through `checkHasAccess` from `app/api/middlewares/auth.ts`; responses use `NextResponse.json` with explicit status codes.

## Current state

Some modules imported by the API (`@/lib/prisma`, `@/lib/nextauth`, `@/lib/stripe`, `@/lib/sessions/dbSession`, `@/lib/api-utils`, `@/lib/sqlQuery`, `@/types`, `@/data/prompt-data`) are not present in this checkout. Check that a helper exists before importing it, and flag missing helpers rather than guessing their API. Keep `.env` values local — never commit secrets.
