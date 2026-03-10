import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  // SECURITY: Rate-limit signup to prevent mass account creation.
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = checkRateLimit(`auth:signup:${ip}`, "auth");
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Retry after ${rl.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.email !== "string" ||
    typeof body.password !== "string"
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const email = body.email.toLowerCase().trim();
  const password = body.password;

  if (password.length < 10) {
    return NextResponse.json(
      { error: "Password must be at least 10 characters" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  // SECURITY: Hash with Argon2id; library generates unique salt automatically.
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { email, passwordHash }
  });

  await createSession(user.id);

  return NextResponse.json({ ok: true }, { status: 201 });
}
