import React from "react";

export default function ProgressBar({ value = 0, segments = false }) {
  const numericValue = Number(value) || 0;
  const clampedValue = Math.min(Math.max(numericValue, 0), 100);

  const getProgressGradient = (val) => {
    if (val >= 85) return "from-emerald-500 via-teal-400 to-emerald-400";
    if (val >= 75) return "from-sky-500 via-indigo-500 to-cyan-400";
    if (val >= 60) return "from-amber-500 via-orange-500 to-yellow-400";
    return "from-rose-500 via-red-500 to-pink-500";
  };

  const getTextColor = (val) => {
    if (val >= 85) return "text-emerald-400";
    if (val >= 75) return "text-sky-400";
    if (val >= 60) return "text-amber-400";
    return "text-rose-400";
  };

  return (
    <div className="w-full space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-400 font-medium">التقدم الإجمالي</span>
        <span className={`font-black text-sm ${getTextColor(clampedValue)}`}>
          {Math.round(clampedValue)}%
        </span>
      </div>

      <div className="relative w-full bg-slate-800/80 rounded-full h-3.5 p-0.5 overflow-hidden border border-slate-700/60 shadow-inner">
        <div
          className={`h-full rounded-full bg-linear-to-r ${getProgressGradient(
            clampedValue,
          )} transition-all duration-1000 ease-out relative shadow-sm`}
          style={{ width: `${clampedValue}%` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/25 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
