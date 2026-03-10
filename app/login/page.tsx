import { Suspense } from "react";
import { motion } from "framer-motion";
import LoginForm from "@/components/Auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-xl shadow-indigo-500/25 mb-4">
            <span className="text-xl">🎯</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-400">
            Sign in to track your goal alignment
          </p>
        </div>
        <div className="card p-6">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
