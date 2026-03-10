# Manual Verification Checklist

Run through these steps after `docker-compose up && npm run seed`.

## 1. Auth

- [ ] Visit http://localhost:3000 — home page loads with animations
- [ ] Click "Sign In" → `/login` page with login form
- [ ] Login as `demo@example.com` / `DemoPass123!` → redirected to `/dashboard`
- [ ] Click "Sign out" → redirected to `/login`
- [ ] Visit http://localhost:3000/dashboard without login → redirected to `/login`
- [ ] Visit `/signup`, create a new account → redirected to `/goals/create`
- [ ] Attempt signup with short password → see inline error
- [ ] Attempt signup with duplicate email → see "Email already in use"

## 2. Goal Creation

- [ ] After login, visit `/goals/create`
- [ ] Step 1: enter goal title → click "Continue"
- [ ] Step 2: enter description → click "Continue"
- [ ] Step 3: pick target date → click "Create Goal 🚀"
- [ ] Redirected to `/journal`

## 3. Journal Submission

- [ ] On `/journal`, type a free-form journal entry (> 50 chars)
- [ ] Click "Analyze Journal ✨" — loading spinner appears
- [ ] Parsed result appears: AI Summary card with score bar, extracted activities list
- [ ] Verify alignment_score badge renders correctly
- [ ] Click "View Path →" → navigated to `/dashboard`

## 4. Dashboard

- [ ] Stat cards render (Journal Entries, Best Score, Streak, Avg Alignment)
- [ ] 3D Path visualization canvas renders without console errors
- [ ] Can orbit/zoom the 3D path with mouse
- [ ] Recharts line chart and pie chart render
- [ ] Activity log (TaskBoard) shows color-coded pills

## 5. Navigation

- [ ] Navbar active indicator slides between pages (Framer Motion spring)
- [ ] All navbar links work: Dashboard, Journal, Goal

## 6. Security

- [ ] Check browser DevTools → session cookie is `HttpOnly`, `Secure`, `SameSite=Strict`
- [ ] Confirm no password appears in any network response
- [ ] Confirm no `GROQ_API_KEY` appears in any client-side bundle (check DevTools Network)

## 7. Tests

```bash
npm test           # all Jest unit tests should pass
npm run test:e2e   # Cypress e2e (requires app + Postgres running)
```

- [ ] `npm test` exits 0
- [ ] `npm run test:e2e` exits 0 (with app running)

## 8. Docker

```bash
GROQ_API_KEY=gsk_... docker-compose up --build
```

- [ ] Both containers start healthy
- [ ] http://localhost:3000 shows login page
- [ ] Postgres port 5432 is accessible
