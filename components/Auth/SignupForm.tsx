"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type PasswordStrength = { label: string; color: string; width: string };

function getPasswordStrength(pw: string): PasswordStrength {
  if (pw.length === 0) return { label: "", color: "bg-slate-700", width: "0%" };
  if (pw.length < 8) return { label: "Too short", color: "bg-rose-500", width: "20%" };
  const score =
    (pw.length >= 12 ? 1 : 0) +
    (/[A-Z]/.test(pw) ? 1 : 0) +
    (/[0-9]/.test(pw) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(pw) ? 1 : 0);
  if (score <= 1) return { label: "Weak", color: "bg-orange-500", width: "35%" };
  if (score === 2) return { label: "Fair", color: "bg-yellow-500", width: "60%" };
  if (score === 3) return { label: "Good", color: "bg-emerald-400", width: "80%" };
  return { label: "Strong", color: "bg-emerald-500", width: "100%" };
}

export default function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = getPasswordStrength(password);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create account");
      }
      router.push("/goals/create");
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
          placeholder="Min. 10 characters"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={10}
          autoComplete="new-password"
        />
        {password.length > 0 && (
          <div className="mt-1.5">
            <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${strength.color}`}
                animate={{ width: strength.width }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">{strength.label}</p>
          </div>
        )}
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

      <button type="submit" className="btn-success mt-2" disabled={loading}>
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner />
            Creating account…
          </span>
        ) : (
          "Create Account"
        )}
      </button>

      <p className="text-center text-xs text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition">
          Sign in
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
        d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
      />
    </svg>
  );
}
