# Cursor Agent Instructions — Goal Alignment Tracker

Step-by-step natural language prompts for Cursor to scaffold, implement, and iterate the codebase.

---

## Step 1 — Scaffold

```
Cursor: create a Next.js 14 TypeScript app with app router at the root of this workspace.
Add directories: components/, lib/, __tests__/, cypress/, prisma/.
Install dependencies from the existing package.json.
Run `npm install` and confirm no errors.
```

---

## Step 2 — Database Setup

```
Cursor: run `npx prisma generate` to generate the Prisma client from prisma/schema.prisma.
Then run `npx prisma migrate dev --name init` to create the initial migration.
Confirm that all 5 models (User, Goal, Journal, ParsedEntry, Session) are created.
```

---

## Step 3 — Auth

```
Cursor: verify that lib/auth.ts compiles cleanly with `npx tsc --noEmit`.
If there are TypeScript errors about the `argon2` or `next/headers` imports, fix them.
Then check that /api/auth/signup and /api/auth/login routes are complete and handle all error cases.
```

---

## Step 4 — LLM Adapter

```
Cursor: open lib/groq.ts and lib/llmSchema.ts.
Verify the tool_call response parsing handles both the tool_calls[0].function.arguments path 
and the legacy function_call.arguments path.
Run the Jest test: `npm test -- __tests__/lib/groq.test.ts` and fix any failures.
```

---

## Step 5 — Scoring Logic

```
Cursor: run `npm test -- __tests__/lib/scoring.test.ts`.
All 7 scoring unit tests should pass. If any fail, fix the computeAlignmentScore function 
in lib/scoring.ts to match the expected behavior described in the test names.
```

---

## Step 6 — API Routes

```
Cursor: test that all API routes compile cleanly:
- app/api/auth/signup/route.ts
- app/api/auth/login/route.ts
- app/api/auth/logout/route.ts
- app/api/goals/route.ts
- app/api/journal/route.ts

Run `npx tsc --noEmit` and fix any type errors.
```

---

## Step 7 — Frontend Components

```
Cursor: run `npm run build` and look for any compile errors in:
- components/Path/Path3D.tsx (React Three Fiber)
- components/Board/TaskBoard.tsx (Framer Motion)
- components/Dashboard/Charts.tsx (Recharts)

Fix any missing imports or type errors. 
Note: Path3D and Charts use `dynamic(..., { ssr: false })` in app/dashboard/page.tsx — verify this.
```

---

## Step 8 — UI Polish

```
Cursor: open app/globals.css and verify the Tailwind custom utilities (card, input-field, btn-primary, etc.) 
are defined as @layer components.
Then open app/page.tsx and run the dev server with `npm run dev` — verify http://localhost:3000 shows 
the animated home page with the 🎯 icon, gradient text, and floating orbs.
```

---

## Step 9 — Run All Tests

```
Cursor: run `npm test` to execute all Jest unit tests.
Confirm tests in __tests__/lib/scoring.test.ts, __tests__/lib/groq.test.ts, and __tests__/lib/rate-limiter.test.ts all pass.
Fix any failures by editing the corresponding lib/ files.
```

---

## Step 10 — Docker Smoke Test

```
Cursor: run `docker-compose up --build` and wait for both services to be healthy.
Then run `npm run seed` to create the demo user.
Visit http://localhost:3000 and confirm the login page loads.
Login as demo@example.com / DemoPass123! and confirm you land on /dashboard.
```

---

## Step 11 — E2E Tests

```
Cursor: with the app running locally (docker-compose up), run `npm run test:e2e`.
The Cypress tests in cypress/e2e/ cover: signup, login, goal creation, journal submission, dashboard.
Fix any failing tests by checking the API routes or component selectors.
```

---

## Step 12 — CI

```
Cursor: open .github/workflows/ci.yml.
Verify the pipeline has 4 jobs: lint, unit (Jest), docker, e2e (Cypress).
Commit all files and push to GitHub. Confirm the Actions pipeline goes green.
```
