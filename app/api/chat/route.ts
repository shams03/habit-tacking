import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { callChat, callSummarize, type ChatMsg } from "@/lib/groq";
import { checkRateLimit } from "@/lib/rate-limiter";
import type { ParsedActivity } from "@/lib/llmSchema";

const MAX_RECENT_MESSAGES = 20;
const SUMMARIZE_THRESHOLD = 30; // total messages before compressing older ones

function buildUserContext(
  goal: { title: string; description?: string | null } | null,
  recentEntries: { activities: unknown; alignmentScore: number; createdAt: Date }[]
): string {
  const lines: string[] = [];

  if (goal) {
    lines.push(`Goal: ${goal.title}`);
    if (goal.description) lines.push(`Goal description: ${goal.description}`);
  } else {
    lines.push("Goal: not set yet");
  }

  if (recentEntries.length === 0) {
    lines.push("No journal entries yet.");
  } else {
    lines.push("\nRecent journal entries (newest first):");
    for (const entry of recentEntries) {
      const acts = (Array.isArray(entry.activities) ? entry.activities : []) as ParsedActivity[];
      const summary = acts
        .map(a => `${a.name} (${a.category ?? "?"}, ${a.duration_minutes}m)`)
        .join(", ");
      lines.push(
        `  • ${entry.createdAt.toISOString().slice(0, 10)} | score: ${entry.alignmentScore} | ${summary || "no activities logged"}`
      );
    }
  }

  return lines.join("\n");
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [messages, summary] = await Promise.all([
    prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      take: 50
    }),
    prisma.conversationSummary.findUnique({ where: { userId } })
  ]);

  return NextResponse.json({ messages, summary: summary?.summary ?? null });
}

export async function POST(req: NextRequest) {
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
  if (!body || typeof body.content !== "string" || !body.content.trim()) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const userContent = body.content.trim().slice(0, 2000);

  // Load context data in parallel.
  const [goal, recentEntries, existingSummary, totalMsgCount] = await Promise.all([
    prisma.goal.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.parsedEntry.findMany({
      where: { journal: { userId } },
      orderBy: { createdAt: "desc" },
      take: 7,
      select: { activities: true, alignmentScore: true, createdAt: true }
    }),
    prisma.conversationSummary.findUnique({ where: { userId } }),
    prisma.chatMessage.count({ where: { userId } })
  ]);

  // Load recent messages for the LLM context window.
  const recentDbMessages = await prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: MAX_RECENT_MESSAGES
  });
  const recentMessages: ChatMsg[] = recentDbMessages
    .reverse()
    .map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

  // Append the new user message.
  const messagesForLLM: ChatMsg[] = [
    ...recentMessages,
    { role: "user", content: userContent }
  ];

  const userContext = buildUserContext(goal, recentEntries);
  const reply = await callChat(
    messagesForLLM,
    existingSummary?.summary ?? null,
    userContext
  );

  // Persist both messages.
  await prisma.chatMessage.createMany({
    data: [
      { userId, role: "user", content: userContent },
      { userId, role: "assistant", content: reply }
    ]
  });

  // Rolling summarisation: when total messages exceed threshold, compress oldest batch.
  const newTotal = totalMsgCount + 2;
  if (newTotal > SUMMARIZE_THRESHOLD) {
    const oldestBatch = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      take: newTotal - MAX_RECENT_MESSAGES
    });

    if (oldestBatch.length > 0) {
      const batchMsgs: ChatMsg[] = oldestBatch.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content
      }));

      try {
        const newSummary = await callSummarize(batchMsgs, existingSummary?.summary ?? null);
        const summarizedUpTo = oldestBatch[oldestBatch.length - 1].createdAt;

        await prisma.conversationSummary.upsert({
          where: { userId },
          create: { userId, summary: newSummary, summarizedUpTo },
          update: { summary: newSummary, summarizedUpTo }
        });

        // Delete the now-summarised messages.
        await prisma.chatMessage.deleteMany({
          where: { id: { in: oldestBatch.map(m => m.id) } }
        });
      } catch {
        // Summarisation failure is non-critical — continue serving the response.
      }
    }
  }

  return NextResponse.json({ role: "assistant", content: reply });
}
