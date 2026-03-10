"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = ["Title", "Description", "Target Date"] as const;

export default function CreateGoalPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (step < 2) { setStep(s => s + 1); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, targetDate })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create goal");
      }
      router.push("/journal");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-xl shadow-violet-500/25 mb-4">
            <span className="text-xl">🚀</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Set your main goal</h1>
          <p className="mt-1 text-sm text-slate-400">
            Your journal entries will be scored against this goal
          </p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((label, idx) => (
            <div key={label} className="flex items-center gap-2">
              <motion.div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${
                  idx < step
                    ? "bg-indigo-500 text-white"
                    : idx === step
                    ? "bg-indigo-500/30 text-indigo-300 ring-2 ring-indigo-500"
                    : "bg-slate-800 text-slate-500"
                }`}
                animate={{ scale: idx === step ? 1.1 : 1 }}
              >
                {idx < step ? "✓" : idx + 1}
              </motion.div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`h-px w-8 transition-colors duration-500 ${
                    idx < step ? "bg-indigo-500" : "bg-slate-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="step-0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-2"
                >
                  <label className="block text-sm font-medium text-slate-300">
                    What is your main goal?
                  </label>
                  <input
                    className="input-field text-base"
                    placeholder="e.g. Become a machine learning engineer"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                    autoFocus
                  />
                  <p className="text-xs text-slate-500">
                    Be specific. Good goals are measurable and time-bound.
                  </p>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-2"
                >
                  <label className="block text-sm font-medium text-slate-300">
                    Describe why this matters to you
                  </label>
                  <textarea
                    className="input-field min-h-[100px] resize-none"
                    placeholder="What will achieving this goal change in your life?"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    autoFocus
                  />
                  <p className="text-xs text-slate-500">
                    Optional — this helps the AI understand your context better.
                  </p>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-2"
                >
                  <label className="block text-sm font-medium text-slate-300">
                    Target completion date
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={targetDate}
                    onChange={e => setTargetDate(e.target.value)}
                    autoFocus
                  />
                  <p className="text-xs text-slate-500">
                    Optional — creates urgency and helps track your timeline.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs text-rose-400 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="flex gap-3">
              {step > 0 && (
                <button
                  type="button"
                  className="btn-secondary flex-1"
                  onClick={() => setStep(s => s - 1)}
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                className={step === 2 ? "btn-success flex-1" : "btn-primary flex-1"}
                disabled={loading || (step === 0 && !title.trim())}
              >
                {loading ? "Saving…" : step < 2 ? "Continue →" : "Create Goal 🚀"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
