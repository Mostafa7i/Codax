"use client";

import React, { useMemo, useState, useCallback, memo } from "react";
import {
  Star,
  Github,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Clock,
  Trophy,
  Medal,
} from "lucide-react";
import CircularProgress from "./CircularProgress";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { db } from "@/app/services/firebaseConfig";
import {
  collection,
  doc,
  updateDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import StudentGithubLinksPopup from "../profile/components/StudentGithubLinksPopup";


const DEFAULT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236366f1'><circle cx='12' cy='8' r='4'/><path d='M4 20c0-4 3.6-7 8-7s8 3 8 7'/></svg>`;

/* ثيم موحّد لكل كارت Top 3 */
const RANK_THEME = {
  1: {
    label: "البطل",
    // كارت كامل
    shell:
      "bg-gradient-to-br from-yellow-500/[0.01] via-slate-900/40 to-amber-900/20",
    panel: "bg-yellow-500/[0.06] border-yellow-500/20",
    // أفاتار
    ring: "ring-yellow-400/90",
    glow: "shadow-[0_0_20px_-4px_rgba(250,204,21,0.45)]",
    // شارة
    badge: "from-yellow-300 to-amber-500 text-black",
    // زر
    btn: "from-yellow-400 to-amber-500 text-black shadow-yellow-500/30",
    // watermark
    mark: "text-yellow-400/[0.06]",
    accent: "bg-yellow-400",
  },
  2: {
    label: "الوصيف",
    shell:
      "bg-gradient-to-br from-slate-300/[0.03] via-slate-900/40 to-slate-700/15",
    panel: "bg-slate-400/[0.06] border-slate-400/20",
    ring: "ring-slate-300/80",
    glow: "shadow-[0_0_16px_-4px_rgba(203,213,225,0.35)]",
    badge: "from-slate-200 to-slate-400 text-black",
    btn: "from-slate-300 to-slate-400 text-black shadow-slate-400/25",
    mark: "text-slate-300/[0.06]",
    accent: "bg-slate-300",
  },
  3: {
    label: "الثالث",
    shell:
      "bg-gradient-to-br from-amber-700/[0.04] via-slate-900/40 to-orange-900/15",
    panel: "bg-amber-600/[0.07] border-amber-600/20",
    ring: "ring-amber-600/80",
    glow: "shadow-[0_0_16px_-4px_rgba(217,119,6,0.35)]",
    badge: "from-amber-600 to-orange-800 text-white",
    btn: "from-amber-600 to-orange-800 text-white shadow-orange-800/25",
    mark: "text-amber-600/[0.07]",
    accent: "bg-amber-600",
  },
};

const getScoreIcon = (s) => {
  if (s >= 99) return "🔱👑🔱";
  if (s >= 95) return "🌟🌟🌟🌟";
  if (s >= 85) return "⭐⭐⭐⭐";
  if (s >= 75) return "⭐⭐⭐";
  if (s >= 65) return "⭐⭐";
  if (s >= 50) return "🥬";
  return null;
};

const barColor = (v) => {
  if (v >= 85) return "bg-emerald-500";
  if (v >= 75) return "bg-yellow-400";
  if (v >= 60) return "bg-orange-400";
  return "bg-red-500";
};

const valueColor = (v) => {
  if (v >= 85) return "text-emerald-400";
  if (v >= 75) return "text-yellow-400";
  if (v >= 60) return "text-orange-400";
  return "text-red-400";
};

const SegmentedBar = memo(function SegmentedBar({ value = 0 }) {
  return (
    <div className="flex gap-0.5 h-1.5 w-full rounded-full overflow-hidden">
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm ${
            value > i * 10 ? barColor(value) : "bg-slate-700/60"
          }`}
        />
      ))}
    </div>
  );
});

const SolidBar = memo(function SolidBar({ value = 0 }) {
  const safe = Math.min(100, Math.max(0, value));
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-700/60 overflow-hidden">
      <div
        className={`h-full rounded-full ${barColor(safe)}`}
        style={{ width: `${safe}%` }}
      />
    </div>
  );
});

const PerfRow = memo(function PerfRow({ label, value, type }) {
  const isTask = type === "task";
  if (isTask && value === null) {
    return (
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>{label}</span>
        <span>لا توجد مهام</span>
      </div>
    );
  }
  const safe = Math.min(100, Math.max(0, value || 0));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-slate-400">{label}</span>
        <span className={`font-bold tabular-nums ${valueColor(safe)}`}>
          {Math.round(safe)}%
        </span>
      </div>
      {isTask ? <SegmentedBar value={safe} /> : <SolidBar value={safe} />}
    </div>
  );
});

const ActiveTime = memo(function ActiveTime({ student }) {
  if (!student.showTime) return null;
  const fmt = (ts) => {
    if (!ts) return "لم يسجل نشاط";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return formatDistanceToNow(d, { addSuffix: true, locale: ar });
  };
  return (
    <span className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
      <Clock className="w-3 h-3 shrink-0" />
      {fmt(student.lastActivity)}
    </span>
  );
});

const GitHubButton = memo(function GitHubButton({ student }) {
  const [open, setOpen] = useState(false);
  if (!student.showGithubButton) return null;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-400 hover:text-indigo-300 hover:border-indigo-500/30 transition-colors"
      >
        <Github className="w-4 h-4" />
      </button>
      {open && (
        <StudentGithubLinksPopup
          studentId={student.id}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
});

const RankBadge = memo(function RankBadge({ rank, theme }) {
  if (!theme) {
    return (
      <span className="text-[13px] font-bold text-indigo-400 font-mono tabular-nums">
        #{rank}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-linear-to-l ${theme.badge}`}
    >
      {rank === 1 ? (
        <Trophy className="w-3 h-3" />
      ) : (
        <Medal className="w-3 h-3" />
      )}
      {theme.label}
    </span>
  );
});

/* ════════════════════════════════════════════
   Main
════════════════════════════════════════════ */
const StudentCardContent = ({
  student,
  allStudents,
  openPasswordModal,
  openImageModal,
  totalLecturesForGroup,
  cardConfig,
}) => {
  const [loading, setLoading] = useState(false);
  const theme = RANK_THEME[student.rank] || null;
  const isTop3 = Boolean(theme);
  const isFirst = student.rank === 1;

  const pointsRank = useMemo(() => {
    const sorted = [...allStudents].sort(
      (a, b) => (b.extraPoints || 0) - (a.extraPoints || 0),
    );
    return sorted.findIndex((s) => s.id === student.id) + 1;
  }, [allStudents, student.id]);

  const totalSpent = useMemo(
    () =>
      (student.buyingHistory || []).reduce((t, p) => t + (p.totalCost || 0), 0),
    [student.buyingHistory],
  );

  const scoreIcon =
    student.showScoreIcons &&
    typeof totalLecturesForGroup === "number" &&
    student.attendedLectures > 5
      ? getScoreIcon(student.combinedScore || 0)
      : null;

  const extraPtsBonus = useMemo(() => {
    const pts = student.extraPoints || 0;
    if (pts >= 160) return "4%+";
    if (pts >= 120) return "3%+";
    if (pts >= 80) return "2%+";
    if (pts >= 40) return "1%+";
    return null;
  }, [student.extraPoints]);

  const handleImageClick = useCallback(() => {
    openImageModal(student.profilePic || DEFAULT_AVATAR);
  }, [openImageModal, student.profilePic]);

  const handleImageError = useCallback((e) => {
    e.target.src = DEFAULT_AVATAR;
  }, []);

  const handleDetailsClick = useCallback(async () => {
    if (!student) return;
    setLoading(true);
    try {
      let studentRef;
      if (student.docId) {
        studentRef = doc(db, "students", student.docId);
      } else if (student.id) {
        const q = query(
          collection(db, "students"),
          where("id", "==", Number(student.id)),
        );
        const snap = await getDocs(q);
        if (snap.empty) return;
        studentRef = doc(db, "students", snap.docs[0].id);
      } else return;

      await updateDoc(studentRef, { lastActivity: serverTimestamp() });
      openPasswordModal(student);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [openPasswordModal, student]);

  // ألوان البانلز الداخلية — تتلون مع التوب 3
  const panelClass = theme
    ? theme.panel
    : "bg-slate-800/50 border-slate-700/40";

  return (
    <div
      className={`relative flex flex-col gap-3 rounded-xl  ${
        theme ? theme.shell : ""
      }`}
      dir="rtl"
    >
      {/* Watermark — في الركن ومقصوص جوه الكارت */}
      {theme && (
        <span
          aria-hidden
          className={`pointer-events-none absolute top-1 left-2 text-[5.5rem] font-black leading-none select-none  ${theme.mark}  ${cardConfig.isPerfectStudent ? "animate-ping decoration-2" : isFirst ? "animate-pulse" : ""}`}
        >
          {student.rank}
        </span>
      )}

      {/* ── Header ── */}
      <div className="relative flex items-center gap-3 z-1">
        <button
          type="button"
          onClick={handleImageClick}
          className="relative shrink-0 group focus:outline-none"
        >
          {isFirst && (
            <>
              <div className="absolute -inset-2.5 rounded-full animate-spin [animation-duration:3s]">
                <div className="w-full h-full rounded-full border-4 border-transparent border-t-yellow-400 border-b-amber-500" />
              </div>

              <div className="absolute -inset-1 rounded-full bg-yellow-400/15 blur-md pointer-events-none" />
            </>
          )}
          {cardConfig.isPerfectStudent && (
            <>
              <div className="absolute -inset-2.5 rounded-full animate-spin [animation-duration:2s]">
                <div className="w-full h-full rounded-full border-4 border-transparent border-t-yellow-400 border-b-amber-500" />
              </div>
              <div className="absolute -inset-2 rounded-full animate-spin [animation-direction:reverse] [animation-duration:1.5s]">
                <div className="w-full h-full rounded-full border-4 border-transparent border-l-yellow-500 border-r-yellow-500/80" />
              </div>
              <div className="absolute -inset-1 rounded-full bg-yellow-400 blur-md pointer-events-none" />
            </>
          )}

          <div
            className={`relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-slate-900 group-hover:scale-105 transition-transform duration-200 ${
              theme ? `${theme.ring} ${theme.glow}` : "ring-slate-600/50"
            }`}
          >
            <img
              loading="lazy"
              src={student.profilePic || DEFAULT_AVATAR}
              alt={student.name}
              onError={handleImageError}
              className="w-full h-full object-cover"
            />
          </div>

          {isTop3 && (
            <span
              className={`absolute -bottom-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black bg-linear-to-br ${theme.badge} shadow-md`}
            >
              {student.rank}
            </span>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <RankBadge rank={student.rank} theme={theme} />
            {scoreIcon && (
              <span className="text-xs leading-none">{scoreIcon}</span>
            )}
          </div>
          <p
            className="font-bold text-white text-sm truncate leading-snug"
            title={student.name}
          >
            {student.name}
          </p>
          {student.showBio !== false && student.bio && (
            <p
              className="text-slate-500 text-[11px] truncate mt-0.5"
              title={student.bio}
            >
              {student.bio}
            </p>
          )}
          <ActiveTime student={student} />
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="relative grid grid-cols-2 gap-2 z-1">
        <div
          className={`flex  flex-col items-center justify-center p-2.5 rounded-2xl border ${panelClass}`}
        >
          <div className="relative">
            <CircularProgress studentCir={student} />
            {cardConfig.isPerfectStudent && (
              <>
                <div className="absolute -inset-2.5 rounded-full animate-spin [animation-duration:2s]">
                  <div className="w-full h-full rounded-full border-4 border-transparent border-t-lime-500 border-b-lime-500" />
                </div>
                <div className="absolute -inset-2 rounded-full animate-spin [animation-direction:reverse] [animation-duration:1.5s]">
                  <div className="w-full h-full rounded-full border-4 border-transparent border-l-green-500 border-r-green-500/80" />
                </div>
                <div className="absolute -inset-1 rounded-full animate-pulse bg-lime-400/20 blur-md pointer-events-none" />
              </>
            )}
            {student.combinedScore === 98 && (
              <>
                <div className="absolute -inset-1 animate-pulse rounded-full bg-lime-400/20 blur-md pointer-events-none" />
              </>
            )}
          </div>
        </div>

        <div
          className={`p-3 rounded-2xl flex flex-col justify-between border ${
            pointsRank <= 3 && !theme
              ? "bg-indigo-500/10 border-indigo-500/25"
              : panelClass
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">النقاط</span>
            <span className="text-xs">🏅</span>
          </div>

          <div
            className={`text-2xl font-black tabular-nums leading-none mt-1 ${
              totalLecturesForGroup > 5 && (student.extraPoints || 0) === 0
                ? "text-red-400"
                : "text-indigo-300"
            }`}
          >
            {student.extraPoints || 0}
            {extraPtsBonus && (
              <span className="text-[10px] text-emerald-400 font-bold mr-1">
                {extraPtsBonus}
              </span>
            )}
          </div>

          {totalSpent > 0 && (
            <span className="text-[10px] text-red-400/90 mt-0.5">
              −{totalSpent} مصروف
            </span>
          )}

          <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-white/10">
            <span className="text-[10px] text-slate-500">ترتيب النقاط</span>
            <span className="flex items-center gap-0.5 text-[11px] font-bold text-purple-300">
              <span className="font-mono tabular-nums">#{pointsRank}</span>
              <Star className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* ── Progress ── */}
      <div
        className={`relative space-y-2.5 p-3 rounded-2xl border z-1 ${panelClass}`}
      >
        <PerfRow
          label="متوسط الدرجات"
          value={student.taskPercentage}
          type="task"
        />
        <PerfRow
          label="نسبة الحضور"
          value={student.attendancePercentage}
          type="attendance"
        />
      </div>

      {/* ── Footer ── */}
      <div className="relative flex items-center gap-2 z-1">
        <div
          className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-xs ${panelClass}`}
        >
          <span
            className={`flex items-center gap-1 ${
              student.likesCount > 0 ? "text-blue-400" : "text-slate-500"
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span className="tabular-nums">{student.likesCount || 0}</span>
          </span>
          <span className="text-slate-600">|</span>
          <span
            className={`flex items-center gap-1 ${
              student.dislikesCount > 0 ? "text-red-400" : "text-slate-500"
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            <span className="tabular-nums">{student.dislikesCount || 0}</span>
          </span>
        </div>

        <GitHubButton student={student} />

        <button
          onClick={handleDetailsClick}
          disabled={loading}
          className={`flex-1 py-2 rounded-xl text-xs font-bold disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-all active:scale-[0.97] shadow-md hover:brightness-110 bg-linear-to-l ${
            theme
              ? theme.btn
              : "from-indigo-500 to-purple-600 text-white shadow-indigo-500/20"
          }`}
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
          ) : (
            <>
              <ExternalLink className="w-3.5 h-3.5" />
              دخول
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default memo(StudentCardContent);
