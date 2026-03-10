import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { callFollowUp } from "@/lib/groq";
import { checkRateLimit } from "@/lib/rate-limiter";
import type { ParsedActivity, ParsedJournal } from "@/lib/llmSchema";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = checkRateLimit(`llm:${userId}`, "llm");
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Retry after ${rl.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.userAnswer !== "string" || !body.userAnswer.trim()) {
    return NextResponse.json({ error: "userAnswer is required" }, { status: 400 });
  }

  // Load the ParsedEntry and verify ownership.
  const parsedEntry = await prisma.parsedEntry.findUnique({
    where: { id: params.id },
    include: {
      journal: {
        select: {
          userId: true,
          goalId: true
        }
      }
    }
  });

  if (!parsedEntry || parsedEntry.journal.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsedJson = parsedEntry.parsedJson as Partial<ParsedJournal>;
  const followUpQuestion = parsedJson.follow_up_question ?? "What are your strengths and areas for improvement?";

  // Load goal for context.
  const goal = parsedEntry.journal.goalId
    ? await prisma.goal.findUnique({ where: { id: parsedEntry.journal.goalId } })
    : null;

  // Build recent activity context.
  const recentEntries = await prisma.parsedEntry.findMany({
    where: { journal: { userId } },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { activities: true, alignmentScore: true, createdAt: true }
  });

  const recentSummaries = recentEntries
    .map((e, i) => {
      const acts = (Array.isArray(e.activities) ? e.activities : []) as ParsedActivity[];
      const summary = acts
        .map(a => `${a.name} ${a.duration_minutes}m`)
        .join(", ");
      return `Day ${i + 1} [score ${e.alignmentScore}]: ${summary || "no activities"}`;
    })
    .join("\n");

  const { assessment } = await callFollowUp(
    followUpQuestion,
    body.userAnswer.trim(),
    goal?.title ?? "General goal",
    recentSummaries
  );

  // Persist the follow-up exchange.
  await prisma.parsedEntry.update({
    where: { id: parsedEntry.id },
    data: {
      followUpData: {
        question: followUpQuestion,
        userAnswer: body.userAnswer.trim(),
        assessment
      }
    }
  });

  return NextResponse.json({ assessment });
}
