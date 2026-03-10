"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Link from "next/link";
import TaskBoard from "@/components/Board/TaskBoard";

// Three.js/R3F cannot run on server — dynamic import with ssr:false is required.
// webpackChunkName gives webpack a stable, resolvable chunk ID (prevents /_next/undefined errors).
const Path3D = dynamic(
  () => import(/* webpackChunkName: "path3d" */ "@/components/Path/Path3D"),
  {
    ssr: false,
    loading: () => <div className="h-full animate-pulse bg-slate-800/50 rounded-xl" />,
  }
);
const Charts = dynamic(
  () => import(/* webpackChunkName: "charts" */ "@/components/Dashboard/Charts"),
  {
    ssr: false,
    loading: () => <div className="h-full animate-pulse bg-slate-800/50 rounded-xl" />,
  }
);

type LinePoint = { date: string; score: number };
type PieSlice = { name: string; value: number };
type Activity = { name: string; category?: string; duration_minutes: number; confidence?: number };
type ActivityDay = { date: string; activities: Activity[] };
type PathEntry = { id: string; created_at: string; alignment_score: number };
type Stats = { totalEntries: number; bestScore: number; streak: number; avgScore: number };

type DashboardData = {
  lineData: LinePoint[];
  pieData: PieSlice[];
  activityDays: ActivityDay[];
  pathEntries: PathEntry[];
  stats: Stats;
};

function SkeletonCard() {
  return <div className="card p-4 h-24 animate-pulse bg-slate-800/50" />;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => {
        if (!r.ok) throw new Error("Failed to load dashboard data");
        return r.json() as Promise<DashboardData>;
      })
      .then(setData)
      .catch(e => setError(e instanceof Error ? e.message : "Unknown error"))
      .finally(() => setLoading(false));
  }, []);

  const stats = data?.stats;
  const avgScore = stats?.avgScore ?? 0;

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            {stats && stats.totalEntries > 0 ? (
              <p className="text-sm text-slate-400 mt-0.5">
                Avg alignment:{" "}
                <span
                  className={`font-semibold ${
                    avgScore >= 3
                      ? "text-emerald-400"
                      : avgScore <= -1
                      ? "text-rose-400"
                      : "text-amber-400"
                  }`}
                >
                  {avgScore > 0 ? "+" : ""}
                  {avgScore.toFixed(1)}
                </span>{" "}
                over last {stats.totalEntries} days
              </p>
            ) : !loading ? (
              <p className="text-sm text-slate-400 mt-0.5">
                No journal entries yet.{" "}
                <Link href="/journal" className="text-indigo-400 underline">
                  Write your first entry →
                </Link>
              </p>
            ) : null}
          </div>
          <Link
            href="/journal"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
          >
            + Journal
          </Link>
        </motion.div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
            {error}
          </div>
        )}

        {/* Stat cards */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            [
              { label: "Journal Days", value: String(stats?.totalEntries ?? 0), icon: "📝" },
              {
                label: "Best Score",
                value: stats && stats.totalEntries > 0 ? `${stats.bestScore > 0 ? "+" : ""}${stats.bestScore}` : "—",
                icon: "🏆"
              },
              {
                label: "Current Streak",
                value: stats && stats.streak > 0 ? `${stats.streak}d` : "—",
                icon: "🔥"
              },
              {
                label: "Avg Alignment",
                value:
                  stats && stats.totalEntries > 0
                    ? `${avgScore > 0 ? "+" : ""}${avgScore.toFixed(1)}`
                    : "—",
                icon: "📈"
              }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="card p-4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <div className="text-xl mb-1">{stat.icon}</div>
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* 3D Path Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Alignment Path
          </h2>
          <div className="card overflow-hidden h-[340px]">
            {loading ? (
              <div className="h-full animate-pulse bg-slate-800/50" />
            ) : (
              <Path3D entries={data?.pathEntries ?? []} />
            )}
          </div>
          <p className="text-xs text-slate-600 mt-2 text-center">
            Drag to rotate · Scroll to zoom · Nodes show daily alignment score
          </p>
        </motion.div>

        {/* Charts + Board */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
          >
            {loading ? (
              <div className="h-[420px] card animate-pulse bg-slate-800/50" />
            ) : (
              <Charts
                lineData={data?.lineData ?? []}
                pieData={data?.pieData ?? []}
              />
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {loading ? (
              <div className="h-[420px] card animate-pulse bg-slate-800/50" />
            ) : (
              <TaskBoard days={data?.activityDays ?? []} />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
