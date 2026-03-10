"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to sign in");
      }
      const from = params.get("from") ?? "/dashboard";
      router.push(from);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-400">
          Email address
        </label>
        <input
          type="email"
          className="input-field"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-400">
          Password
        </label>
        <input
          type="password"
          className="input-field"
          placeholder="••••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2"
          >
            <span className="text-rose-400 text-xs">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <button type="submit" className="btn-primary mt-2" disabled={loading}>
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner />
            Signing in…
          </span>
        ) : (
          "Sign In"
        )}
      </button>

      <p className="text-center text-xs text-slate-500">
        No account?{" "}
        <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 transition">
          Create one free
        </Link>
      </p>
    </motion.form>
  );
}

function Spinner() {
  return (
    <svg
      className="w-4 h-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
      />
    </svg>
  );
}
