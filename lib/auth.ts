import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

// bcryptjs is pure JavaScript — no native binaries, works on every Node version.
// Cost factor 12 = ~200-400ms hash time on modern hardware; adjust up over time.
const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  hash: string,
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

const SESSION_COOKIE_NAME = "gat_session";

export async function createSession(userId: string): Promise<void> {
  const token = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt
    }
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true, // SECURITY: Prevent JS access to session token.
    secure: true, // SECURITY: Only send over HTTPS in production.
    sameSite: "strict", // SECURITY: Mitigate CSRF by strict same-site.
    maxAge: 60 * 60,
    path: "/"
  });
}

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token }
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { token } });
    return null;
  }

  return session.userId;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 0,
    path: "/"
  });
}

// Migration strategy for upgrading from a hypothetical plaintext column:
// 1. Require users to log in again and rehash password on successful login.
// 2. Do not silently hash existing plaintext values in-place.
// 3. Drop plaintext column only after all users have migrated.

