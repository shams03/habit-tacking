# Goal Alignment Tracker

A journal-based goal alignment tracker with AI-powered parsing, 3D path visualization, and real-time alignment scoring.

## Quick Start

### Prerequisites
- Node.js 22+
- Docker & Docker Compose
- Groq API key — get one free at [console.groq.com](https://console.groq.com)

### 1. Clone & install

```bash
git clone <repo-url>
cd goal-alignment-tracker
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in DATABASE_URL and GROQ_API_KEY
```

### 3. Run with Docker (recommended)

```bash
# Build and start Postgres + app
GROQ_API_KEY=gsk_... docker-compose up

# Seed demo user (separate terminal)
npm run seed

# App is now at http://localhost:3000
# Demo login: demo@example.com / DemoPass123!
```

### 4. Local dev (no Docker)

```bash
# Start Postgres separately, then:
npx prisma migrate dev
npm run seed
npm run dev
# Visit http://localhost:3000
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `GROQ_API_KEY` | ✅ | Groq API key for LLM parsing |
| `NEXTAUTH_URL` | No | Base URL (defaults to localhost:3000) |
| `LLM_MONTHLY_TOKEN_BUDGET` | No | Monthly token cap before blocking (default: 1M) |

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm test` | Run Jest unit tests |
| `npm run test:e2e` | Run Cypress e2e tests |
| `npm run seed` | Seed demo user + goal |
| `npm run prisma:migrate` | Run Prisma migrations |
| `npm run lint` | ESLint check |

## Architecture

```
app/
  (app)/           — Auth-gated layout with Navbar
  api/auth/        — Signup, login, logout API routes
  api/goals/       — Goal CRUD
  api/journal/     — Journal submission + LLM parsing
  dashboard/       — 3D path + charts + activity board
  journal/         — Journal entry page
  goals/create/    — 3-step goal wizard
components/
  Auth/            — LoginForm, SignupForm with animations
  Path/            — React Three Fiber 3D path visualization
  Board/           — TaskBoard activity log
  Dashboard/       — Recharts charts
  Nav/             — Sticky navbar
lib/
  auth.ts          — Argon2id hashing + session management
  groq.ts          — Groq API adapter with AJV validation
  scoring.ts       — Pure TypeScript alignment score logic
  rate-limiter.ts  — Token-bucket rate limiter
  llmSchema.ts     — JSON schema + system prompt
  prisma.ts        — Prisma singleton
```

## Security

See [SECURITY.md](./SECURITY.md) for the full security runbook.

Key points:
- Passwords hashed with Argon2id (memoryCost=65536, timeCost=4, parallelism=2)
- HttpOnly + Secure + SameSite=Strict session cookies
- Rate limiting on all auth and LLM routes
- JSON schema validation on all LLM outputs
- Input sanitization + 4000-char limit on journal text
