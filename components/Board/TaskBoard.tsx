"use client";

import { motion } from "framer-motion";

type Activity = {
  name: string;
  duration_minutes: number;
  category?: string;
  confidence?: number;
};

type DayEntry = {
  date: string;
  activities: Activity[];
};

type Props = {
  days: DayEntry[];
};

const categoryColor: Record<string, string> = {
  study_ml: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  study: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  coding: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  exercise: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  reading: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  gaming: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  youtube: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  passive_consumption: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  default: "bg-slate-700/40 text-slate-300 border-slate-600/30"
};

function getColor(category?: string) {
  return categoryColor[(category ?? "").toLowerCase()] ?? categoryColor.default;
}

export default function TaskBoard({ days }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-slate-400 uppercase tracking-wider">
        Activity Log
      </h3>
      {days.length === 0 && (
        <p className="text-sm text-slate-500 italic">
          No activities yet. Submit your first journal entry.
        </p>
      )}
      {days.map((day, dayIdx) => (
        <motion.div
          key={day.date}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: dayIdx * 0.05, duration: 0.35 }}
          className="rounded-xl border border-slate-700/60 bg-slate-900/50 p-3"
        >
          <p className="text-xs font-medium text-slate-500 mb-2">
            {new Date(day.date).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric"
            })}
          </p>
          <div className="flex flex-wrap gap-2">
            {day.activities.map((a, aIdx) => (
              <motion.span
                key={aIdx}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: dayIdx * 0.05 + aIdx * 0.04 }}
                title={`${a.duration_minutes} min${a.confidence != null ? ` · ${(a.confidence * 100).toFixed(0)}% confidence` : ""}`}
                className={`text-xs px-2 py-1 rounded-lg border font-medium ${getColor(a.category)}`}
              >
                {a.name}
                <span className="ml-1 opacity-60">{a.duration_minutes}m</span>
              </motion.span>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
