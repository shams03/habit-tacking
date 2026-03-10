"use client";

import { FormEvent, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type SubTopic = { name: string; duration_minutes: number };

type Activity = {
  name: string;
  category?: string;
  duration_minutes: number;
  confidence?: number;
  estimated?: boolean;
  sub_topics?: SubTopic[];
};

type ParsedResult = {
  activities: Activity[];
  alignment_score: number;
  summary: string;
  follow_up_question?: string;
  strengths?: string[];
  improvements?: string[];
};

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 3
      ? "score-badge score-badge-positive"
      : score <= -3
      ? "score-badge score-badge-negative"
      : "score-badge score-badge-neutral";
  return (
    <span className={cls}>
      {score > 0 ? `+${score}` : score} / 10
    </span>
  );
}

const PLACEHOLDER_EXAMPLES = [
  "Today I studied ML for 3 hours, went for a 30-minute run, and then watched Netflix for 2 hours.",
  "Spent the morning debugging a React hook issue (2h), had lunch, then got distracted by YouTube for 1.5h.",
  "Productive day! Studied costing, finance, and FM for 2 hours each, then did a 30-min walk."
];

export default function JournalPage() {
  const [journalText, setJournalText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedResult | null>(null);
  const [parsedEntryId, setParsedEntryId] = useState<string | null>(null);

  // Follow-up state
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpError, setFollowUpError] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<string | null>(null);

  const [placeholder] = useState(
    () => PLACEHOLDER_EXAMPLES[Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.length)]
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setParsed(null);
    setParsedEntryId(null);
    setAssessment(null);
    setFollowUpAnswer("");
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: journalText })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to parse journal");
      }
      const data = (await res.json()) as {
        parsed: ParsedResult;
        parsedEntryId: string;
      };
      setParsed(data.parsed);
      setParsedEntryId(data.parsedEntryId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  async function handleFollowUp(e: FormEvent) {
    e.preventDefault();
    if (!parsedEntryId || !followUpAnswer.trim()) return;
    setFollowUpLoading(true);
    setFollowUpError(null);
    try {
      const res = await fetch(`/api/journal/${parsedEntryId}/followup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAnswer: followUpAnswer })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to get assessment");
      }
      const data = (await res.json()) as { assessment: string };
      setAssessment(data.assessment);
    } catch (err: unknown) {
      setFollowUpError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setFollowUpLoading(false);
    }
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Daily Journal</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Write freely about your day. The AI extracts insights automatically.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-xs text-indigo-400 hover:text-indigo-300 transition px-3 py-1.5 rounded-lg border border-indigo-500/20 hover:border-indigo-500/40"
          >
            Dashboard →
          </Link>
        </motion.div>

        {/* Input card */}
        <motion.div
          className="card p-6 space-y-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <textarea
                className="input-field min-h-[160px] resize-none leading-relaxed"
                placeholder={placeholder}
                value={journalText}
                onChange={e => setJournalText(e.target.value)}
                required
              />
              <span className="absolute bottom-3 right-3 text-xs text-slate-600">
                {journalText.length}/4000
              </span>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-400"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !journalText.trim()}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Analyzing with AI…
                </span>
              ) : (
                "Analyze Journal ✨"
              )}
            </button>
          </form>
        </motion.div>

        {/* Parsed result */}
        <AnimatePresence>
          {parsed && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-4"
            >
              {/* Summary card */}
              <div className="card p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h2 className="font-semibold text-sm text-slate-300">AI Summary</h2>
                  <ScoreBadge score={parsed.alignment_score} />
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{parsed.summary}</p>
                <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      parsed.alignment_score >= 3
                        ? "bg-emerald-500"
                        : parsed.alignment_score <= -3
                        ? "bg-rose-500"
                        : "bg-amber-500"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${((parsed.alignment_score + 10) / 20) * 100}%` }}
                    transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>−10</span>
                  <span>0</span>
                  <span>+10</span>
                </div>
              </div>

              {/* Activities */}
              <div className="card p-5">
                <h3 className="font-semibold text-sm text-slate-300 mb-3">
                  Extracted Activities
                </h3>
                <ul className="space-y-2">
                  {parsed.activities.map((a, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      className="rounded-xl border border-slate-700/60 bg-slate-800/40 overflow-hidden"
                    >
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">{a.name}</p>
                          {a.category && (
                            <p className="text-xs text-slate-500">{a.category.replace(/_/g, " ")}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {a.estimated && (
                            <span className="text-xs text-amber-400 border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 rounded">
                              est.
                            </span>
                          )}
                          <span className="text-xs text-slate-400">{a.duration_minutes}m</span>
                          {a.confidence != null && (
                            <span className="text-xs text-slate-600">
                              {(a.confidence * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Sub-topics */}
                      {a.sub_topics && a.sub_topics.length > 0 && (
                        <div className="border-t border-slate-700/60 px-3 py-2 bg-slate-900/40">
                          <p className="text-xs text-slate-500 mb-1.5">Subjects covered:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {a.sub_topics.map((st, si) => (
                              <span
                                key={si}
                                className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/25 text-indigo-300"
                              >
                                {st.name}
                                <span className="ml-1 opacity-60">{st.duration_minutes}m</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Strengths & Improvements */}
              {((parsed.strengths && parsed.strengths.length > 0) ||
                (parsed.improvements && parsed.improvements.length > 0)) && (
                <div className="card p-5 space-y-4">
                  {parsed.strengths && parsed.strengths.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                        Strongholds
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {parsed.strengths.map((s, i) => (
                          <span
                            key={i}
                            className="text-xs px-2.5 py-1 rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {parsed.improvements && parsed.improvements.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                        Needs Work
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {parsed.improvements.map((s, i) => (
                          <span
                            key={i}
                            className="text-xs px-2.5 py-1 rounded-lg border border-amber-500/25 bg-amber-500/10 text-amber-300"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Interactive follow-up */}
              {parsed.follow_up_question && !assessment && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-5 border-indigo-500/30 bg-indigo-950/30 space-y-3"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg shrink-0">🤔</span>
                    <p className="text-sm text-indigo-200 leading-relaxed">
                      {parsed.follow_up_question}
                    </p>
                  </div>
                  <form onSubmit={handleFollowUp} className="space-y-2">
                    <textarea
                      className="input-field min-h-[80px] resize-none text-sm leading-relaxed"
                      placeholder="Be specific — mention which topics you're confident in vs struggling with…"
                      value={followUpAnswer}
                      onChange={e => setFollowUpAnswer(e.target.value)}
                      disabled={followUpLoading}
                    />
                    <AnimatePresence>
                      {followUpError && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-xs text-rose-400"
                        >
                          {followUpError}
                        </motion.p>
                      )}
                    </AnimatePresence>
                    <button
                      type="submit"
                      className="btn-secondary text-sm"
                      disabled={followUpLoading || !followUpAnswer.trim()}
                    >
                      {followUpLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                          </svg>
                          Getting assessment…
                        </span>
                      ) : (
                        "Get honest assessment →"
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* Assessment result */}
              <AnimatePresence>
                {assessment && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="card p-5 border-slate-600/50 bg-slate-900/60 space-y-2"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">📋</span>
                      <h4 className="text-sm font-semibold text-slate-300">
                        Honest Assessment
                      </h4>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                      {assessment}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setParsed(null);
                    setJournalText("");
                    setAssessment(null);
                    setFollowUpAnswer("");
                    setParsedEntryId(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  New Entry
                </button>
                <Link href="/dashboard" className="flex-1 btn-primary text-center">
                  View Path →
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
