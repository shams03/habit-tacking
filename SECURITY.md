# Security Runbook — Goal Alignment Tracker

## 1. Passwords — Argon2id

**Config** (`lib/auth.ts`):
```typescript
{
  type: argon2.argon2id,
  memoryCost: 1 << 16, // 64 MB — OWASP minimum for 2025+
  timeCost: 4,          // iterations — tune for ~300ms on your CPU
  parallelism: 2        // threads
}
```

**OWASP Reference**: [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) recommends Argon2id with m≥64MB.

**Production tuning**: Run `node -e "const a=require('argon2');console.time('hash');a.hash('test',{type:a.argon2id,memoryCost:1<<16,timeCost:4,parallelism:2}).then(()=>console.timeEnd('hash'))"` and adjust `timeCost` until you achieve 200–500ms.

**Upgrade migration strategy**:
1. When you increase parameters, add a `needs_rehash` boolean column.
2. On each successful login, call `argon2.needsRehash(hash, newOptions)`.
3. If true, rehash with new params and save.
4. Do NOT bulk-rehash silently — require fresh login.

## 2. Sessions

- Token: `randomUUID()` — 122 bits of entropy
- Storage: server-side `sessions` table (not JWT — no client-side secret exposure)
- Cookie flags: `HttpOnly; Secure; SameSite=Strict; Max-Age=3600`
- Rotation: session token changes on sensitive operations (TODO: implement sliding window)
- Expiry: 1 hour TTL; extend by re-issuing on activity

## 3. Secrets Management

**Development**: Use `.env` (never commit).

**Production**: Use one of:
- **GitHub Actions Secrets**: `GROQ_API_KEY`, `DATABASE_URL` stored as encrypted secrets
- **HashiCorp Vault**: Mount secrets as environment variables via Vault Agent Injector
- **AWS Secrets Manager / GCP Secret Manager**: Inject at container startup

Never log API keys. The Groq adapter reads `process.env.GROQ_API_KEY` only.

## 4. Rate Limiting

| Route | Preset | Capacity | Refill |
|---|---|---|---|
| `/api/auth/login` | auth | 10 req | 1/30s |
| `/api/auth/signup` | auth | 10 req | 1/30s |
| `/api/journal` | llm | 5 req | 1/60s |
| `/api/goals` | general | 60 req | 1/s |

In production, replace the in-memory store in `lib/rate-limiter.ts` with Redis (`ioredis`) to share limits across instances.

## 5. Prompt Injection Defense

- Journal text is limited to 4000 characters server-side before sending to Groq.
- `temperature: 0.0` reduces output variability.
- `tool_choice: { type: "function" }` forces structured output.
- AJV schema validation on all LLM responses — malformed output is rejected before DB write.

## 6. Input Validation

- All API routes validate request bodies before DB operations.
- Email normalized to lowercase.
- Password minimum 10 characters enforced server-side.

## 7. GDPR / Data Deletion

**TODO (implement before production)**:
- `GET /api/account/export` — return all user data as JSON
- `DELETE /api/account` — cascade delete user + all related data

## 8. Cost Control (LLM Budget Guard)

Set `LLM_MONTHLY_TOKEN_BUDGET` env var. Track cumulative token usage in a `llm_usage` table (add migration) and reject requests that would exceed the monthly cap, notifying the admin via email/Slack.

## 9. Env Vars Security Checklist

- [ ] `GROQ_API_KEY` stored in secrets manager, not in code
- [ ] `DATABASE_URL` includes strong password
- [ ] `.env` is in `.gitignore` (verified)
- [ ] Production uses `HTTPS` only — set `Secure` cookie flag
- [ ] `NEXTAUTH_URL` set to production domain
