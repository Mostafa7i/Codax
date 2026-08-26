'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowRight, Search, Sparkles, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div
      dir="rtl"
      className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-[#060912] text-slate-200 px-4"
    >
      {/* ── Ambient Background ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.12]"
          style={{
            background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full opacity-[0.10]"
          style={{
            background: "radial-gradient(circle, #6366f1 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full opacity-[0.06]"
          style={{
            background: "radial-gradient(ellipse, #ec4899 0%, transparent 70%)",
          }}
        />
        {/* subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #818cf8 1px, transparent 0)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-lg text-center">
        {/* ── Glitch / Floating 404 ── */}
        <div className="relative mb-8 select-none">
          {/* ghost layers for depth */}
          <motion.span
            aria-hidden
            className="absolute inset-0 flex items-center justify-center text-[7rem] sm:text-[9rem] font-black text-purple-500/20 blur-[2px]"
            animate={{ x: [-3, 3, -3], y: [2, -2, 2] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            404
          </motion.span>
          <motion.span
            aria-hidden
            className="absolute inset-0 flex items-center justify-center text-[7rem] sm:text-[9rem] font-black text-pink-500/15 blur-[1px]"
            animate={{ x: [3, -3, 3], y: [-2, 2, -2] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          >
            404
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative text-[7rem] sm:text-[9rem] font-black leading-none tracking-tighter bg-gradient-to-l from-violet-400 via-purple-400 to-pink-500 bg-clip-text text-transparent"
          >
            404
          </motion.h1>

          {/* floating badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2"
          >
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] uppercase text-purple-300/90 bg-purple-500/15 border border-purple-500/25 px-3 py-1 rounded-full backdrop-blur-sm">
              <Compass className="w-3 h-3" />
              ضللت الطريق
            </span>
          </motion.div>
        </div>

        {/* ── Copy ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="space-y-3 mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            الصفحة مش موجودة
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-sm mx-auto">
            الرابط اللي دخلت عليه إما اتحذف، أو اتغير مكانه، أو اتكتب بالغلط.
            <br />
            <span className="text-slate-500">مفيش مشكلة — نرجعك على الطريق الصح.</span>
          </p>
        </motion.div>

        {/* ── Actions ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            href="/"
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-l from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            الصفحة الرئيسية
            <ArrowRight className="w-4 h-4 opacity-0 -mr-2 group-hover:opacity-100 group-hover:mr-0 transition-all" />
          </Link>

  
        </motion.div>

        {/* ── Smart hint ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 flex items-center justify-center gap-2 text-slate-500 text-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400/60" />
          <span>
            لو بتدور على حاجة معينة، ابدأ من{" "}
            <Link href="/" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">
              الرئيسية
            </Link>
          </span>
        </motion.div>
      </div>
    </div>
  );
}