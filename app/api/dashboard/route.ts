import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import type { ParsedActivity } from "@/lib/llmSchema";

type RawEntry = {
  id: string;
  alignmentScore: number;
  activities: unknown;
  createdAt: Date;
  journal: { createdAt: Date };
};

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function formatChartDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function toActivities(raw: unknown): ParsedActivity[] {
  if (!Array.isArray(raw)) return [];
  return raw as ParsedActivity[];
}

function streakCount(dates: Set<string>): number {
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (dates.has(dateKey(d))) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw: RawEntry[] = await prisma.parsedEntry.findMany({
    where: { journal: { userId } },
    orderBy: { createdAt: "asc" },
    take: 90,
    include: {
      journal: { select: { createdAt: true } }
    }
  });

  if (raw.length === 0) {
    return NextResponse.json({
      lineData: [],
      pieData: [],
      activityDays: [],
      pathEntries: [],
      stats: { totalEntries: 0, bestScore: 0, streak: 0, avgScore: 0 }
    });
  }

  // ── Group by calendar date ─────────────────────────────────────────────────
  // Key: "YYYY-MM-DD", value: { latestScore, allActivities[] }
  const byDate = new Map<
    string,
    { latestScore: number; latestEntry: RawEntry; allActivities: ParsedActivity[] }
  >();

  for (const entry of raw) {
    const key = dateKey(entry.journal.createdAt);
    const acts = toActivities(entry.activities);
    const existing = byDate.get(key);
    if (!existing) {
      byDate.set(key, {
        latestScore: entry.alignmentScore,
        latestEntry: entry,
        allActivities: acts
      });
    } else {
      // Later entries in the array have higher createdAt (sorted asc) → keep updating
      existing.latestScore = entry.alignmentScore;
      existing.latestEntry = entry;
      existing.allActivities = [...existing.allActivities, ...acts];
    }
  }

  const sortedDates = Array.from(byDate.keys()).sort();

  // ── Alignment trend (line chart) ───────────────────────────────────────────
  const lineData = sortedDates.map(key => ({
    date: formatChartDate(new Date(key + "T12:00:00")),
    score: byDate.get(key)!.latestScore
  }));

  // ── Time allocation (pie chart) ────────────────────────────────────────────
  const categoryTotals = new Map<string, number>();
  for (const { allActivities } of byDate.values()) {
    for (const act of allActivities) {
      const cat = act.category ?? "other";
      categoryTotals.set(cat, (categoryTotals.get(cat) ?? 0) + act.duration_minutes);
    }
  }
  const pieData = Array.from(categoryTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({
      name: name.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      value
    }));

  // ── Activity log (task board) ──────────────────────────────────────────────
  const activityDays = sortedDates
    .slice()
    .reverse()
    .map(key => ({
      date: key,
      activities: byDate.get(key)!.allActivities
    }));

  // ── 3-D path entries ───────────────────────────────────────────────────────
  const pathEntries = sortedDates.map(key => ({
    id: byDate.get(key)!.latestEntry.id,
    created_at: key,
    alignment_score: byDate.get(key)!.latestScore
  }));

  // ── Stats ──────────────────────────────────────────────────────────────────
  const allScores = sortedDates.map(k => byDate.get(k)!.latestScore);
  const bestScore = Math.max(...allScores);
  const avgScore =
    allScores.reduce((s, v) => s + v, 0) / allScores.length;
  const dateSet = new Set(sortedDates);
  const streak = streakCount(dateSet);

  return NextResponse.json({
    lineData,
    pieData,
    activityDays,
    pathEntries,
    stats: {
      totalEntries: sortedDates.length,
      bestScore,
      streak,
      avgScore: parseFloat(avgScore.toFixed(1))
    }
  });
}
