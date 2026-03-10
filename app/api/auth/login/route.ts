import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function POST(req: NextRequest) {
  // SECURITY: Strict rate limiting on login to prevent brute-force attacks.
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = checkRateLimit(`auth:login:${ip}`, "auth");
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

  const user = await prisma.user.findUnique({ where: { email } });

  // SECURITY: Return the same error for non-existent user and wrong password
  // to prevent user enumeration attacks.
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() }
  });

  await createSession(user.id);

  return NextResponse.json({ ok: true });
}
