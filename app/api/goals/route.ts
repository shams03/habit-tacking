import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limiter";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ goals });
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = checkRateLimit(`goals:${ip}`, "general");
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Retry after ${rl.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const goal = await prisma.goal.create({
    data: {
      userId,
      title: body.title.trim(),
      description: typeof body.description === "string" ? body.description.trim() : null,
      targetDate: body.targetDate ? new Date(body.targetDate) : null
    }
  });

  return NextResponse.json({ goal }, { status: 201 });
}
