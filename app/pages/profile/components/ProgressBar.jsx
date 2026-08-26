import React from "react";

export default function ProgressBar({ value, segments = false }) {
  const getProgressColor = (val) => {
    if (val >= 85) return "from-emerald-400 via-green-500 to-emerald-600";
    if (val >= 75) return "from-yellow-400 via-amber-500 to-yellow-600";
    if (val >= 60) return "from-orange-400 via-orange-500 to-red-500";
    return "from-red-400 via-red-500 to-red-600";
  };

  const getTextColor = (val) => {
    if (val >= 85) return "text-emerald-600 dark:text-emerald-400";
    if (val >= 75) return "text-yellow-600 dark:text-yellow-400";
    if (val >= 60) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center">
        <span className={`flex text-lg font-bold ${getTextColor(value)}`}>
          <span>{value}%</span>
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(
            value
          )} relative transition-all duration-1000 ease-out shadow-lg`}
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent animate-shimmer" />
          <div className="absolute right-1 top-0 bottom-0 w-1 bg-white/50 rounded-full" />
        </div>
      </div>
    </div>
  );
}
