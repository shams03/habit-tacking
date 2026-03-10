"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

function MessageBubble({ msg, isNew }: { msg: Message; isNew?: boolean }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold mr-2 mt-0.5 shrink-0">
          AI
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-indigo-600 text-white rounded-br-sm"
            : "bg-slate-800 border border-slate-700/60 text-slate-200 rounded-bl-sm"
        }`}
      >
        {msg.content}
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold ml-2 mt-0.5 shrink-0">
          You
        </div>
      )}
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold mr-2 mt-0.5 shrink-0">
        AI
      </div>
      <div className="bg-slate-800 border border-slate-700/60 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0, 0.2, 0.4].map((delay, i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-slate-500"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HelpPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load message history on mount.
  useEffect(() => {
    fetch("/api/chat")
      .then(r => r.json())
      .then((data: { messages: Message[]; summary: string | null }) => {
        setMessages(data.messages ?? []);
      })
      .catch(() => {})
      .finally(() => setFetchingHistory(false));
  }, []);

  // Auto-scroll to bottom when messages change.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || loading) return;

    setInput("");
    setError(null);

    const userMsg: Message = { role: "user", content };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to get response");
      }

      const data = (await res.json()) as { role: "assistant"; content: string };
      setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error");
      // Remove the optimistically added user message on error.
      setMessages(prev => prev.filter(m => m !== userMsg));
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as FormEvent);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Header */}
      <div className="border-b border-slate-800/60 px-4 py-4 bg-slate-950/80 backdrop-blur-xl shrink-0">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-lg font-bold tracking-tight">Help &amp; Coach</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ask me anything about your progress. I have your goal and activity data. Expect honest, direct answers.
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {fetchingHistory ? (
            <div className="flex justify-center py-12">
              <svg className="w-5 h-5 animate-spin text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
          ) : messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 space-y-3"
            >
              <div className="text-4xl">🎯</div>
              <h2 className="text-base font-semibold text-slate-300">Your personal coach</h2>
              <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                Ask about your progress, what to prioritise, how to fix a bad week, or get a reality check on where you&apos;re falling short.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto mt-4">
                {[
                  "Am I on track to hit my goal?",
                  "What subject should I focus on tomorrow?",
                  "Where am I wasting the most time?",
                  "Give me an honest weekly review."
                ].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="text-xs text-left px-3 py-2.5 rounded-xl border border-slate-700/60 bg-slate-800/40 text-slate-400 hover:text-slate-200 hover:border-indigo-500/40 transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            messages.map((msg, i) => (
              <MessageBubble
                key={msg.id ?? i}
                msg={msg}
                isNew={i === messages.length - 1 && msg.role === "assistant"}
              />
            ))
          )}

          <AnimatePresence>
            {loading && <TypingIndicator />}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-400 text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-slate-800/60 px-4 py-4 bg-slate-950/80 backdrop-blur-xl shrink-0">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              rows={1}
              className="input-field resize-none pr-4 max-h-32 overflow-y-auto leading-relaxed"
              placeholder="Ask your coach… (Enter to send, Shift+Enter for newline)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              style={{ minHeight: "44px" }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            ) : (
              "Send"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
