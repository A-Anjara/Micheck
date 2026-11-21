---
name: api-route-builder
description: Use when creating or modifying Next.js App Router API routes under app/api in this repo, including handlers, auth middleware, Prisma queries, Stripe payments or recaptcha verification. Enforces the project's route conventions.
---

# API Route Builder

Conventions for every route in `app/api`. Read an existing sibling route before writing a new one and mirror its style.

## Placement and exports

- Routes live at `app/api/<resource>/route.ts`, dynamic segments at `app/api/<resource>/[param]/route.ts`, catch-all auth at `app/api/(client)/auth/[...nextauth]/route.ts`.
- Route groups such as `(client)` only organize URLs: they do not add protection by themselves.
- Export one function per HTTP verb (`GET`, `POST`, ...). No default export. Use `export const GET = async (req: NextRequest) => {}` or `export async function POST(req: NextRequest) {}`.

## Imports and style

- Use the `@/` alias for project modules (`@/lib/prisma`, `@/types`) and relative imports inside `app/api` (e.g. `../middlewares/auth`, `../../middlewares/auth`).
- `NextRequest` / `NextResponse` come from `next/server`.
- Four spaces, double quotes, semicolons, trailing commas — match existing routes.

## Data access

- Always import the singleton from `@/lib/prisma`; never instantiate `PrismaClient` in a route.
- Wrap database work in `try/catch` and log with `console.error("Context:", error)`.
- Parse list query params from `new URL(req.url).searchParams`: `pagination_count`, `pagination_skip`, plus resource filters (`category_id`, `price_range`, `search_value`).
- Return paginated lists as `{ paginatedData, totalCount }` with a separate `count()` query.
- Before importing any `@/lib/...` helper, confirm the file exists. Several helpers are referenced by existing routes but are still missing from this checkout; report a missing helper instead of inventing its API or silently creating it.

## Authentication

- Protected handlers use `checkHasAccess` from `app/api/middlewares/auth.ts`.
- Default is `{ type: "db_session", adminRole: "ADMIN" }` with an `Authorization: Bearer <token>` header. Pass `{ type: "nextauth" }` for cookie sessions, `{ adminRole: "SUPERADMIN" }` for superadmin-only routes.
- Pattern: define `const handler = ...`, then `export const GET = checkHasAccess(handler, options);`. Public `(client)` routes can export the handler directly.

## Responses and errors

- Always respond with `NextResponse.json(payload, { status })`, or `unauthorizedResponse(...)` from `@/lib/api-utils` for auth failures.
- Status codes: 200 read, 201 created, 400 invalid input, 401 unauthorized, 404 missing resource, 500 unexpected error.
- Validate and type request bodies (`await req.json()`) before any database or external call.
- Error bodies use `{ message: "Internal Server Error", error }` where `error` is included only when `process.env.NODE_ENV === "development"`. Never return raw stack traces, secrets, tokens or connection strings.

## Verification

- After edits run `npm run lint` and `npx tsc --noEmit` (there is no `typecheck` script yet).
- Confirm every new import resolves and no existing route was broken.
