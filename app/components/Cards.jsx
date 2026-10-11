"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

// ─── Animated counter ───────────────────────────────────────────────────
function Counter({ to, suffix = "" }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(to / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= to) {
        setCount(to);
        clearInterval(timer);
      } else setCount(start);
    }, 20);
    return () => clearInterval(timer);
  }, [to]);
  return (
    <span>
      {count}
      {suffix}
    </span>
  );
}

// ─── Feature pill ────────────────────────────────────────────────────────
export function FeaturePill({ text, icon: Icon, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.06 }}
      className={`flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm`}
    >
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-slate-300 text-sm font-semibold">{text}</span>
    </motion.div>
  );
}
export function StatCard({ icon: Icon, label, value, suffix, color }) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.04 }}
      className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-slate-950/20 border border-white/15 backdrop-blur-lg shadow-xl"
    >
      <div className={`p-3 rounded-xl bg-linear-to-br ${color} shadow-md`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-3xl font-black text-white drop-shadow-md">
        <Counter to={value} suffix={suffix} />
      </p>
      <p className="text-slate-200 text-sm font-semibold text-center drop-shadow-xs">{label}</p>
    </motion.div>
  );
}


