"use client";
import React, { useState, Suspense, lazy } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarCheck,
  ShieldCheck,
  Coins,
  TrendingUp,
  Target,
  LayoutGrid,
  ArrowRightLeft,
  X,
  Eye,
  CheckCircle2,
  Sparkles,
  Award,
  Zap,
  Activity,
  CreditCard,
  ChevronLeft,
} from "lucide-react";
import ProgressBar from "../components/ProgressBar";
import WhoReactedModal from "@/app/components/features/WhoReactedModal";

const TextEffect = lazy(() =>
  import("@/app/components/TextEffect..jsx")
    .then((mod) => ({ default: mod.default || mod }))
    .catch(() => ({ default: () => null })),
);

const TransferPoints = lazy(() =>
  import("../components/TransferPoints")
    .then((mod) => ({ default: mod.default || mod }))
    .catch(() => ({ default: () => null })),
);

const Subscription = lazy(() =>
  import("../components/Subscription")
    .then((mod) => ({ default: mod.default || mod }))
    .catch(() => ({ default: () => null })),
);

import { ReserveAttendance } from "@/app/pages/(partsMainPage)/ReserveAttendance";
import Likes from "../components/Likes";
import {
  BOOST_POINTS_PER_PERCENT,
  BOOST_MAX_PERCENT,
  POINTS_TARGET_DISPLAY,
  BOOST_TIERS,
  calculateBoostPercentage,
} from "@/app/components/scoringConfig";

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-6">
    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function OverviewTab({
  studentData,
  studentId,
  studentDocId,
  isPerfectStudent = false,
  state,
  absences = 0,
  total = 0,
  rankTitle,
  rankColorClass,
  showIcons,
  toggleIcons,
  showTime,
  toggleActiveTime,
  status,
  reserveAttendanceCount = 0,
  isProcessingReserve = false,
  handleUseReserveAttendance,
  showModalAttendance,
  setShowModalAttendance,
  showModal,
  setShowModal,
  openNote,
  setOpenNote,
}) {
  const [showWhoReactedModal, setShowWhoReactedModal] = useState(false);

  const combinedScore = Number(state?.combinedScore) || 0;
  const attendancePercentage = Number(state?.attendancePercentage) || 0;
  const score = Number(studentData?.score) || 0;
  const attendedLectures = Math.max(0, (total || 0) - (absences || 0));
  const maxAbsences = 12;
  const remainingAbsences = Math.max(0, maxAbsences - absences);
  const absenceSafetyPercentage = Math.max(
    0,
    Math.min(100, Math.round(((maxAbsences - absences) / maxAbsences) * 100)),
  );

  return (
    <div className="space-y-5 dir-rtl">
      {/* ── 1. Admin Warning Banner (if exists) ── */}
      {studentData?.warning && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-linear-to-r from-rose-950/60 via-red-950/40 to-slate-900 border border-rose-700/50 p-4 sm:p-5 rounded-3xl shadow-xl flex items-start gap-3.5 backdrop-blur-md"
        >
          <div className="w-10 h-10 bg-rose-500/20 border border-rose-500/30 rounded-2xl flex items-center justify-center shrink-0 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-rose-300 text-sm">
                تنبيه إداري هـام
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold animate-pulse">
                عاجل
              </span>
            </div>
            <p className="text-rose-200/90 text-xs sm:text-sm mt-1 leading-relaxed">
              {studentData?.warning}
            </p>
          </div>
          <div className="hidden sm:block shrink-0">
            <Suspense fallback={null}>
              <TextEffect />
            </Suspense>
          </div>
        </motion.div>
      )}

      {/* ── 2. Top Summary KPI Hero Cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3.5"
      >
        {/* KPI 1: Academic Score */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-4 sm:p-5 border border-slate-800/90 shadow-xl hover:border-emerald-500/30 transition-all duration-300 group flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400 font-medium">
              المتوسط الإجمالي
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span
                className={`text-2xl sm:text-3xl font-black ${
                  combinedScore >= 85
                    ? "text-emerald-400"
                    : combinedScore >= 65
                      ? "text-amber-400"
                      : "text-rose-400"
                }`}
              >
                {combinedScore}%
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                (درجات + نقاط)
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Attendance Rate */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-4 sm:p-5 border border-slate-800/90 shadow-xl hover:border-sky-500/30 transition-all duration-300 group flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform shrink-0">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400 font-medium">نسبة الحضور</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span
                className={`text-2xl sm:text-3xl font-black ${
                  attendancePercentage >= 80 ? "text-sky-400" : "text-amber-400"
                }`}
              >
                {attendancePercentage}%
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                {attendedLectures} من {total} محاضرة
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Points & Boost */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-4 sm:p-5 border border-slate-800/90 shadow-xl hover:border-amber-500/30 transition-all duration-300 group flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400 font-medium">نقاط المكافآت</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl sm:text-3xl font-black text-amber-400">
                {score}
              </span>
              <span className="text-[11px] text-amber-400/80 font-bold">
                {calculateBoostPercentage(score) > 0
                  ? `(+${calculateBoostPercentage(score)}% على المعدل)`
                  : "نقطة"}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 3. The 3 Main Interactive Cards Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {/* ── CARD 1: Academic Performance (الأداء الأكاديمي) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800/80 shadow-xl flex flex-col justify-between overflow-hidden hover:border-violet-500/40 transition-all duration-300"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">
                  الأداء الأكاديمي
                </h3>
                <p className="text-[11px] text-slate-400">
                  متوسطك ودرجاتك الكلية
                </p>
              </div>
            </div>

            {/* Rank Badge & Icon Switch */}
            {studentData?.attendedLectures > 5 && (
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-black px-2.5 py-1 rounded-full bg-violet-950/60 border border-violet-700/40 ${
                    rankColorClass || "text-violet-300"
                  }`}
                >
                  {rankTitle || "طالب"}
                </span>
                <button
                  type="button"
                  onClick={toggleIcons}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                    showIcons ? "bg-emerald-500" : "bg-slate-700"
                  }`}
                  title="إظهار/إخفاء الأيقونات الإضافية"
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                      showIcons ? "translate-x-1" : "-translate-x-4"
                    }`}
                  />
                </button>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
            {/* Score Showcase */}
            <div className="flex items-center justify-between bg-slate-800/40 border border-slate-800 rounded-2xl p-4">
              <div className="space-y-1">
                <p className="text-xs text-slate-400 font-medium">
                  المعدل الأكاديمي التراكمي
                </p>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-4xl font-black ${
                      combinedScore >= 85
                        ? "text-emerald-400"
                        : combinedScore >= 75
                          ? "text-sky-400"
                          : combinedScore >= 60
                            ? "text-amber-400"
                            : "text-rose-400"
                    }`}
                  >
                    {combinedScore}%
                  </span>
                  <span className="text-xs text-slate-400">
                    {combinedScore >= 85
                      ? "أداء متميز 🌟"
                      : combinedScore >= 75
                        ? "أداء جيد جداً 👍"
                        : combinedScore >= 60
                          ? "أداء مقبول ⚡"
                          : "بحاجة لتحسين ⚠️"}
                  </span>
                </div>
              </div>

              {/* Glowing Rating Aura */}
              <div className="relative w-14 h-14 flex items-center justify-center">
                <div
                  className={`absolute inset-0 rounded-full blur-md opacity-40 animate-pulse ${
                    combinedScore >= 85
                      ? "bg-emerald-500"
                      : combinedScore >= 75
                        ? "bg-sky-500"
                        : combinedScore >= 60
                          ? "bg-amber-500"
                          : "bg-rose-500"
                  }`}
                />
                <div
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-lg font-black ${
                    combinedScore >= 85
                      ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
                      : combinedScore >= 75
                        ? "bg-sky-950/80 border-sky-500/50 text-sky-300"
                        : combinedScore >= 60
                          ? "bg-amber-950/80 border-amber-500/50 text-amber-300"
                          : "bg-rose-950/80 border-rose-500/50 text-rose-300"
                  }`}
                >
                  <Award className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <ProgressBar value={combinedScore} />

            {/* 5-Tier Classification Grid (All 5 in 1 row) */}
            <div>
              <p className="text-[11px] text-slate-400 font-medium mb-1.5">
                مستويات التقييم الأكاديمي:
              </p>
              <div className="grid grid-cols-5 gap-1">
                {[
                  {
                    label: "أسطوري",
                    range: "98%+",
                    active: combinedScore >= 98,
                    color:
                      "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20",
                  },
                  {
                    label: "ممتاز",
                    range: "85%+",
                    active: combinedScore >= 85 && combinedScore < 98,
                    color:
                      "bg-teal-500/20 text-teal-300 border-teal-500/50 shadow-sm shadow-teal-500/20",
                  },
                  {
                    label: "جيد جداً",
                    range: "75-84",
                    active: combinedScore >= 75 && combinedScore < 85,
                    color:
                      "bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-sm shadow-sky-500/20",
                  },
                  {
                    label: "جيد",
                    range: "60-74",
                    active: combinedScore >= 60 && combinedScore < 75,
                    color:
                      "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20",
                  },
                  {
                    label: "ضعيف",
                    range: "<60",
                    active: combinedScore < 60,
                    color:
                      "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm shadow-rose-500/20",
                  },
                ].map((tier) => (
                  <div
                    key={tier.label}
                    className={`py-2 px-1 rounded-xl text-center border transition-all ${
                      tier.active
                        ? `${tier.color} scale-102 font-black`
                        : "bg-slate-800/30 border-slate-800 text-slate-400 opacity-60"
                    }`}
                  >
                    <p className="text-[11px] font-bold leading-tight">
                      {tier.label}
                    </p>
                    <p className="text-[9px] mt-0.5 opacity-80">{tier.range}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Explanatory Footer Pill */}
            <div className="bg-violet-950/30 border border-violet-800/30 rounded-2xl p-3 flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <p className="text-xs text-violet-200/90 leading-relaxed">
                المتوسط الإجمالي = <strong>درجاتك في المهام والاختبارات</strong>{" "}
                + <strong>المكافآت التراكمية</strong>. كل ارتفاع يعزز ترتيبك!
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── CARD 2: Points & Gamification (نقاط المكافآت) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800/80 shadow-xl flex flex-col justify-between overflow-hidden hover:border-amber-500/40 transition-all duration-300"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">
                  نقاط المكافآت
                </h3>
                <p className="text-[11px] text-slate-400">
                  نقاطك التراكمية والتأثير الأكاديمي
                </p>
              </div>
            </div>

            {calculateBoostPercentage(score) > 0 && (
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> +{calculateBoostPercentage(score)}%
              </span>
            )}
          </div>

          {/* Body */}
          <div className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
            {/* Donut Chart + Main Points Counter */}
            {(() => {
              const maxScore = POINTS_TARGET_DISPLAY;
              const pct = Math.min((score / maxScore) * 100, 100);
              const r = 48;
              const circ = 2 * Math.PI * r;
              const offset = circ - (pct / 100) * circ;

              return (
                <div className="flex items-center gap-4 bg-slate-800/40 border border-slate-800 rounded-2xl p-3.5">
                  {/* Donut Chart SVG */}
                  <div className="relative shrink-0 w-24 h-24">
                    <svg
                      width="96"
                      height="96"
                      viewBox="0 0 120 120"
                      className="-rotate-90"
                    >
                      <circle
                        cx="60"
                        cy="60"
                        r={r}
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="12"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r={r}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={circ}
                        strokeDashoffset={offset}
                        style={{
                          transition:
                            "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)",
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-black text-slate-100 leading-none">
                        {score}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        / {maxScore}
                      </span>
                    </div>
                  </div>

                  {/* Points Context Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400">
                      إجمالي النقاط المكتسبة
                    </p>
                    <p className="text-xl sm:text-2xl font-black text-amber-400">
                      {score}{" "}
                      <span className="text-xs font-normal text-slate-400">
                        نقطة
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-300 mt-1">
                      {calculateBoostPercentage(score) > 0 ? (
                        <>
                          تمنحك زيادة{" "}
                          <strong className="text-amber-400 font-bold">
                            +{calculateBoostPercentage(score)}%
                          </strong>{" "}
                          على متوسطك!
                        </>
                      ) : (
                        <>
                          تحتاج{" "}
                          <strong className="text-amber-400 font-bold">
                            {Math.max(0, BOOST_POINTS_PER_PERCENT - score)} نقطة
                          </strong>{" "}
                          لفتح أول +1%
                        </>
                      )}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Milestones Roadmap (Dynamic from BOOST_TIERS) */}
            <div className="space-y-1.5">
              <p className="text-[11px] text-slate-400 font-medium">
                مسار ترقية المعدل بالنقاط:
              </p>
              <div
                className="grid gap-1.5"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(BOOST_TIERS.length, 5)}, minmax(0, 1fr))`,
                }}
              >
                {BOOST_TIERS.map(({ minPoints, label }) => {
                  const isAchieved = score >= minPoints;
                  return (
                    <div
                      key={minPoints}
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                        isAchieved
                          ? "bg-amber-950/40 border-amber-500/40 text-amber-300 shadow-xs shadow-amber-500/10 font-black"
                          : "bg-slate-800/30 border-slate-800 text-slate-400 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {isAchieved && (
                          <CheckCircle2 size={12} className="text-amber-400" />
                        )}
                        <span className="text-xs font-bold">{label}</span>
                      </div>
                      <span className="text-[10px] opacity-80">{minPoints} نقطة</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanatory Footer Pill */}
            <div className="bg-amber-950/30 border border-amber-800/30 rounded-2xl p-3 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200/90 leading-relaxed">
                النقاط بتتراكم من التفاعل وتسليم المهام. كل{" "}
                <strong>{BOOST_POINTS_PER_PERCENT} نقطة</strong> تضيف 1% لمعدلك التراكمي (بحد أقصى +{BOOST_MAX_PERCENT}%)!
              </p>
            </div>

            {/* Action Button: Transfer Points */}
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-linear-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-101 active:scale-98 cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>تحويل نقاط لزميل في المنصة</span>
            </button>
          </div>
        </motion.div>

        {/* ── CARD 3: Attendance Record (سجل الحضور) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800/80 shadow-xl flex flex-col justify-between overflow-hidden hover:border-sky-500/40 transition-all duration-300"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">سجل الحضور</h3>
                <p className="text-[11px] text-slate-400">تتبع حضورك وغيابك</p>
              </div>
            </div>

            <span
              className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                absences === 0
                  ? "bg-emerald-950/60 text-emerald-300 border-emerald-700/50"
                  : absences <= 3
                    ? "bg-amber-950/60 text-amber-300 border-amber-700/50"
                    : "bg-rose-950/60 text-rose-300 border-rose-700/50"
              }`}
            >
              {absences === 0 ? "ملتزم تماماً 🌟" : `${absences} غياب`}
            </span>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
            {/* Circular Progress + Mini Breakdown */}
            {(() => {
              const pct = Math.min(Math.max(attendancePercentage, 0), 100);
              const r = 48;
              const circ = 2 * Math.PI * r;
              const offset = circ - (pct / 100) * circ;

              const strokeColor =
                pct >= 90
                  ? "#10b981"
                  : pct >= 75
                    ? "#0ea5e9"
                    : pct >= 50
                      ? "#f59e0b"
                      : "#ef4444";

              return (
                <div className="flex items-center gap-4 bg-slate-800/40 border border-slate-800 rounded-2xl p-3.5">
                  {/* Circular Meter SVG */}
                  <div className="relative shrink-0 w-24 h-24">
                    <svg
                      width="96"
                      height="96"
                      viewBox="0 0 120 120"
                      className="-rotate-90"
                    >
                      <circle
                        cx="60"
                        cy="60"
                        r={r}
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="12"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r={r}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={circ}
                        strokeDashoffset={offset}
                        style={{
                          transition:
                            "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)",
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-black text-slate-100 leading-none">
                        {Math.round(pct)}%
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        حضور
                      </span>
                    </div>
                  </div>

                  {/* Attendance Stats */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <p className="text-xs text-slate-400">
                        المحاضرات المكتملة
                      </p>
                      <p className="text-xl sm:text-2xl font-black text-slate-100">
                        {attendedLectures}{" "}
                        <span className="text-xs font-normal text-slate-400">
                          من {total} محاضرة
                        </span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-1.5 text-center">
                        <p className="text-[10px] text-emerald-400">حضور</p>
                        <p className="text-sm font-black text-emerald-300">
                          {attendedLectures}
                        </p>
                      </div>
                      <div className="bg-rose-950/30 border border-rose-800/40 rounded-xl p-1.5 text-center">
                        <p className="text-[10px] text-rose-400">غياب</p>
                        <p className="text-sm font-black text-rose-300">
                          {absences}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Attendance Safety Radar */}
            <div className="bg-sky-950/30 border border-sky-800/30 rounded-2xl p-3 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">
                  مقياس أمان الحضور
                </span>
                <span
                  className={`font-black ${
                    remainingAbsences > 5
                      ? "text-sky-400"
                      : remainingAbsences > 2
                        ? "text-amber-400"
                        : "text-rose-400"
                  }`}
                >
                  {remainingAbsences} غياب متاح قبل الحجب
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/50">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    absenceSafetyPercentage > 50
                      ? "bg-linear-to-r from-sky-500 to-emerald-400"
                      : absenceSafetyPercentage > 20
                        ? "bg-linear-to-r from-amber-500 to-orange-400"
                        : "bg-linear-to-r from-rose-600 to-red-500 animate-pulse"
                  }`}
                  style={{ width: `${absenceSafetyPercentage}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                يتم حجب الخدمات تلقائياً في حال تجاوز أكثر من{" "}
                <strong className="text-slate-200 font-bold">12 غياب</strong> في
                الدورة.
              </p>
            </div>

            {/* Action Button: Reserve Attendance */}
            <button
              type="button"
              onClick={() => setShowModalAttendance(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-linear-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-slate-100 font-bold text-xs sm:text-sm shadow-lg shadow-sky-500/20 transition-all hover:scale-101 active:scale-98 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>استرداد حضور احتياطي</span>
              {reserveAttendanceCount > 0 && (
                <span className="text-[10px] bg-sky-400/20 text-sky-200 border border-sky-400/30 px-2 py-0.5 rounded-full font-black">
                  {reserveAttendanceCount} متاح
                </span>
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* ── 4. Bottom Row: Subscription & Interaction Details ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Left: Subscription & Activity State Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800/80 shadow-xl p-4 sm:p-5 flex flex-col justify-between space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/15 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-indigo-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">
                  تفاصيل الاشتراك
                </h3>
                <p className="text-[11px] text-slate-400">
                  بيانات دفعك وحالة سدادك
                </p>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-black ${
                (studentData?.remainingAmount || 0) <= 0
                  ? "bg-emerald-950/60 text-emerald-300 border border-emerald-700/50"
                  : "bg-rose-950/60 text-rose-300 border border-rose-700/50"
              }`}
            >
              {(studentData?.remainingAmount || 0) <= 0
                ? "سداد كامل ✓"
                : "مستحق دفع ⚠️"}
            </span>
          </div>

          {/* Subscription Financial Snapshot */}
          <Suspense fallback={<LoadingSpinner />}>
            <Subscription studentData={studentData} studentId={studentId} />
          </Suspense>

          {/* Activity Toggle Row */}
          <div className="flex items-center justify-between p-3.5 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs font-bold text-slate-200">حالة النشاط</p>
                <p className="text-[10px] text-slate-400">
                  إظهار وقت آخر نشاط وتواجد في المنصة
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold ${
                  showTime ? "text-emerald-400" : "text-slate-400"
                }`}
              >
                {showTime ? "نشط 🟢" : "غير نشط ⚪"}
              </span>
              <button
                type="button"
                onClick={toggleActiveTime}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer ${
                  showTime ? "bg-emerald-500" : "bg-slate-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    showTime ? "translate-x-1" : "-translate-x-5"
                  }`}
                />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Right: Who Reacted Banner + Likes Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.25 }}
          className="space-y-3.5 flex flex-col justify-between"
        >
          {/* Who Reacted Quick Button Banner */}
          <button
            type="button"
            onClick={() => setShowWhoReactedModal(true)}
            className="w-full flex items-center justify-between gap-3 p-4 bg-linear-to-r from-cyan-950/70 via-sky-950/50 to-indigo-950/60 hover:from-cyan-900/80 hover:to-indigo-900/80 text-cyan-200 border border-cyan-500/30 rounded-3xl font-bold text-xs sm:text-sm shadow-xl hover:shadow-cyan-500/10 transition-all active:scale-99 cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform">
                <Eye size={18} />
              </div>
              <div className="text-right">
                <p className="text-slate-100 font-black">
                  كشف من تفاعل مع بروفايلي 👁️
                </p>
                <p className="text-[11px] text-cyan-300/80 font-normal">
                  معرفة الطلاب الذين قاموا بضغط لايك أو ديسلايك
                </p>
              </div>
            </div>

            {isPerfectStudent ? (
              <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-2.5 py-1 rounded-full border border-yellow-500/40 font-black shrink-0">
                الكارت الذهبي (خصم 50%) ✨
              </span>
            ) : (
              <div className="flex items-center gap-1 text-[11px] text-cyan-400 shrink-0">
                <span>كشف الآن</span>
                <ChevronLeft size={14} />
              </div>
            )}
          </button>

          {/* Likes Feed Component */}
          <Likes studentIdV={studentData?.id} />
        </motion.div>
      </div>

      {/* ── Modals ── */}
      {/* 1. Who Reacted Modal */}
      <WhoReactedModal
        open={showWhoReactedModal}
        onClose={() => setShowWhoReactedModal(false)}
        studentData={studentData}
        studentDocId={studentDocId}
        isPerfectStudent={isPerfectStudent}
      />

      {/* 2. Reserve Attendance Modal */}
      {showModalAttendance && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setShowModalAttendance(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm relative shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowModalAttendance(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 rounded-full p-1.5 transition cursor-pointer"
            >
              <X size={18} />
            </button>
            <div className="mt-2">
              <ReserveAttendance
                reserveCount={reserveAttendanceCount}
                absences={absences}
                onUseReserve={handleUseReserveAttendance}
                isLoading={isProcessingReserve}
                reserveUsageCount={studentData?.reserveUsageCount || 0}
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Transfer Points Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md relative shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 rounded-full p-1.5 transition cursor-pointer"
            >
              <X size={18} />
            </button>
            <h2 className="text-lg font-bold text-slate-100 mb-4 text-center">
              تحويل النقاط لزميل
            </h2>
            {status ? (
              <Suspense fallback={<LoadingSpinner />}>
                <TransferPoints studentId={studentData?.id} />
              </Suspense>
            ) : (
              <div className="text-center p-8 bg-slate-800/60 rounded-2xl text-slate-400 text-xs">
                ميزة تحويل النقاط غير مفعلة حالياً لهذه المجموعة
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Admin Note Modal */}
      {openNote && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setOpenNote(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-7 relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpenNote(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 rounded-full p-1.5 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-center mb-4 text-amber-400">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-100 mb-3">
                ملاحظة إدارية
              </h3>
              <div className="w-full bg-amber-950/20 rounded-2xl p-4 border border-amber-800/40">
                <p className="text-amber-200 text-xs sm:text-sm font-medium leading-relaxed">
                  {studentData?.note}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenNote(false)}
                className="mt-6 w-full py-3 bg-linear-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
