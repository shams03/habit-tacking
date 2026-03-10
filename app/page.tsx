"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const floatingOrbs = [
  { cx: "15%", cy: "20%", size: 320, color: "from-indigo-600/20 to-transparent", delay: 0 },
  { cx: "80%", cy: "70%", size: 250, color: "from-cyan-500/15 to-transparent", delay: 1 },
  { cx: "60%", cy: "10%", size: 180, color: "from-violet-600/10 to-transparent", delay: 2 }
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Ambient blobs */}
      {floatingOrbs.map((orb, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full bg-gradient-radial ${orb.color} blur-3xl pointer-events-none`}
          style={{
            left: orb.cx,
            top: orb.cy,
            width: orb.size,
            height: orb.size,
            transform: "translate(-50%, -50%)"
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{
            duration: 6,
            repeat: Infinity,
            delay: orb.delay,
            ease: "easeInOut"
          }}
        />
      ))}

      <motion.main
        className="relative z-10 w-full max-w-sm mx-auto px-6"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="text-center mb-10">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-2xl shadow-indigo-500/30 mb-6"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
          >
            <span className="text-3xl">🎯</span>
          </motion.div>
          <motion.h1
            className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Goal Alignment
          </motion.h1>
          <motion.p
            className="mt-2 text-slate-400 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            Journal your day. See your path come alive.
          </motion.p>
        </div>

        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Link href="/login" className="block btn-primary text-center">
            Sign In
          </Link>
          <Link href="/signup" className="block btn-secondary text-center">
            Create Account
          </Link>
        </motion.div>

        <motion.p
          className="mt-8 text-center text-xs text-slate-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          Powered by Groq · llama-3.3-70b-versatile
        </motion.p>
      </motion.main>
    </div>
  );
}
