import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { callParseJournal } from "@/lib/groq";
import { checkRateLimit } from "@/lib/rate-limiter";
import { DEFAULT_CATEGORY_WEIGHTS } from "@/lib/scoring";
import type { ParsedActivity } from "@/lib/llmSchema";

function buildRecentContext(
  entries: { activities: unknown; alignmentScore: number; createdAt: Date }[]
): string {
  return entries
    .map((e, i) => {
      const acts = (Array.isArray(e.activities) ? e.activities : []) as ParsedActivity[];
      const summary = acts
        .map(a => `${a.name} (${a.category ?? "?"}, ${a.duration_minutes}m)`)
        .join(", ");
      return `Entry ${i + 1} [${e.createdAt.toISOString().slice(0, 10)}, score ${e.alignmentScore}]: ${summary || "no activities"}`;
    })
    .join("\n");
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // SECURITY: Strict LLM rate limit per user to prevent cost spikes.
  const rl = checkRateLimit(`llm:${userId}`, "llm");
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `LLM rate limit exceeded. Retry after ${rl.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.text !== "string" || !body.text.trim()) {
    return NextResponse.json({ error: "Journal text is required" }, { status: 400 });
  }

  // Find the user's most recent active goal for context.
  const goal = await prisma.goal.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  // Fetch recent entries to give LLM history context for follow-up questions.
  const recentEntries = await prisma.parsedEntry.findMany({
    where: { journal: { userId } },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { activities: true, alignmentScore: true, createdAt: true }
  });

  const categories = Object.keys(DEFAULT_CATEGORY_WEIGHTS);
  const recentContext = recentEntries.length > 0
    ? buildRecentContext(recentEntries)
    : undefined;

  // Persist the raw journal entry.
  const journal = await prisma.journal.create({
    data: {
      userId,
      goalId: goal?.id ?? null,
      rawText: body.text.trim()
    }
  });

  let parsed;
  try {
    parsed = await callParseJournal(body.text, { categories, recentContext });
  } catch (err: unknown) {
    // Clean up journal row if LLM call failed to avoid orphaned entries.
    await prisma.journal.delete({ where: { id: journal.id } });
    const msg = err instanceof Error ? err.message : "LLM call failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Persist the parsed result.
  const parsedEntry = await prisma.parsedEntry.create({
    data: {
      journalId: journal.id,
      parsedJson: parsed as object,
      alignmentScore: parsed.alignment_score,
      activities: parsed.activities as object
    }
  });

  return NextResponse.json({
    journalId: journal.id,
    parsedEntryId: parsedEntry.id,
    parsed
  });
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await prisma.parsedEntry.findMany({
    where: {
      journal: { userId }
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      journal: { select: { createdAt: true, rawText: false, goalId: true } }
    }
  });

  return NextResponse.json({ entries });
}
