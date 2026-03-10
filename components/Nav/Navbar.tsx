"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/journal", label: "Journal", icon: "📝" },
  { href: "/goals/create", label: "Goal", icon: "🎯" },
  { href: "/help", label: "Help", icon: "💬" }
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <span className="text-sm font-bold tracking-tight hidden sm:block">
            Goal Tracker
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {NAV_LINKS.map(link => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  active
                    ? "text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg bg-slate-800"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative flex items-center gap-1.5">
                  <span className="sm:hidden">{link.icon}</span>
                  <span className="hidden sm:inline">{link.label}</span>
                </span>
              </Link>
            );
          })}
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="text-xs text-slate-500 hover:text-slate-300 transition px-2 py-1 rounded-lg hover:bg-slate-800"
        >
          {loggingOut ? "…" : "Sign out"}
        </button>
      </div>
    </nav>
  );
}
