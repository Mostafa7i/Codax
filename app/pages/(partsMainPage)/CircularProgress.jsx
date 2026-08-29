"use client";

import React, { useId, useMemo } from "react";

/* ─── Helpers ─────────────────────────────────────────────── */
function getScoreGradient(score) {
  if (score >= 90) return ["#16a34a", "#4ade80"]; // أخضر
  if (score >= 75) return ["#2563eb", "#60a5fa"]; // أزرق
  if (score >= 60) return ["#f59e0b", "#fbbf24"]; // أصفر
  return ["#dc2626", "#f87171"]; // أحمر
}

function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

/* ═══════════════════════════════════════════════════════════
   CircularProgress — النسبة العامة للطالب
═══════════════════════════════════════════════════════════ */
const CircularProgress = React.memo(function CircularProgress({ studentCir }) {
  const uid = useId();
  const score = clampScore(studentCir?.combinedScore);
  const display = Math.round(score * 10) / 10; // خانة عشرية لو موجودة
  const [colorStart, colorEnd] = getScoreGradient(score);
  const gradId = `cp-grad-${uid.replace(/:/g, "")}`;
  const hasLowScore = score < 60;

  return (
    <div className="relative w-16 h-16">
      <svg
        className={`w-full h-full ${
          hasLowScore ? "rounded-full ring-2 ring-red-500/70 animate-pulse" : ""
        }`}
        viewBox="0 0 36 36"
        role="img"
        aria-label={`نتيجة الطالب ${display}%`}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colorStart} />
            <stop offset="100%" stopColor={colorEnd} />
          </linearGradient>
        </defs>

        {/* Track */}
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          className="stroke-slate-200 dark:stroke-slate-700"
          strokeWidth="3"
        />

        {/* Progress */}
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="3"
          strokeDasharray={`${score}, 100`}
          strokeLinecap="round"
          className="transition-[stroke-dasharray] duration-700 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-sm font-bold tabular-nums"
          style={{ color: colorStart }}
        >
          {Number.isInteger(display) ? display : display.toFixed(1)}%
        </span>
      </div>
    </div>
  );
});

export default CircularProgress;

/* ═══════════════════════════════════════════════════════════
   CircularProgressTask — درجة تاسك واحد
═══════════════════════════════════════════════════════════ */
export const CircularProgressTask = React.memo(function CircularProgressTask({
  task,
  color,
  maxScore = 100,
  showPercent = false,
}) {
  const uid = useId();
  const raw = Number(task?.score) || 0;
  const safeMax = maxScore > 0 ? maxScore : 100;
  const score = Math.min(safeMax, Math.max(0, raw));
  const percentage = (score / safeMax) * 100;

  const [startColor, endColor] = useMemo(() => {
    if (color) return [color, color];
    return getScoreGradient(percentage);
  }, [color, percentage]);

  const gradId = `cpt-grad-${uid.replace(/:/g, "")}`;

  return (
    <div className="relative w-10 h-10">
      <svg viewBox="0 0 36 36" className="w-full h-full" aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={startColor} />
            <stop offset="100%" stopColor={endColor} />
          </linearGradient>
        </defs>

        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          className="stroke-slate-200 dark:stroke-slate-700"
          strokeWidth="3"
        />
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="3"
          strokeDasharray={`${percentage}, 100`}
          strokeLinecap="round"
          className="transition-[stroke-dasharray] duration-500 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-[11px] font-bold tabular-nums"
          style={{ color: startColor }}
        >
          {score}
          {showPercent ? "%" : ""}
        </span>
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════
   TotalScoreCircle — شريط مجموع درجات التاسكات
═══════════════════════════════════════════════════════════ */
function getTotalScoreMeta(score) {
  if (score >= 85)
    return { gradient: ["#16a34a", "#4ade80"], text: "text-emerald-500" };
  if (score >= 75)
    return { gradient: ["#2563eb", "#60a5fa"], text: "text-blue-500" };
  if (score >= 60)
    return { gradient: ["#ca8a04", "#facc15"], text: "text-yellow-500" };
  return { gradient: ["#dc2626", "#f87171"], text: "text-red-500" };
}

export const TotalScoreCircle = React.memo(function TotalScoreCircle({
  tasks = [],
}) {
  const activeTasks = tasks.filter((t) => t && t.enabled !== false);
  const totalTasks = activeTasks.length;
  const totalScore = activeTasks.reduce(
    (sum, task) => sum + (Number(task.score) || 0),
    0,
  );
  const maxScore = totalTasks * 100;

  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  const percentageFixed = Math.round(clampScore(percentage));

  const { gradient, text: textColor } = getTotalScoreMeta(percentageFixed);
  const [startColor, endColor] = gradient;

  return (
    <div className="w-full max-w-sm">
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${percentageFixed}%`,
            background: `linear-gradient(to left, ${startColor}, ${endColor})`,
          }}
        />
      </div>

      <div
        className={`mt-1.5 text-xs font-semibold text-center tabular-nums ${textColor}`}
      >
        {totalScore} / <span className="text-slate-500">{maxScore}</span>
        <span className="text-slate-400 font-medium">
          {" "}
          ({percentageFixed}%)
        </span>
      </div>
    </div>
  );
});
