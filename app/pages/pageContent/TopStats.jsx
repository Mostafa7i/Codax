"use client";
import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTopStats } from "@/app/hooks/allHooks";
import AvatarFrame from "@/app/utils/AvatarFrame";
import {
  getEffectiveActiveBorder,
  getAvatarBadge,
} from "@/app/utils/avatarDecorations";

import {
  X,
  ThumbsUp,
  ThumbsDown,
  Star,
  ClipboardList,
  Flag,
  TrendingDown,
  ChevronDown,
  BarChart3,
  UserRoundIcon,
  Sparkles,
  Trophy,
  ShieldCheck,
  Target,
  GraduationCap,
  Heart,
  Users,
  Coins,
  Award,
  Flame,
  AlertCircle,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Definition of All Superlatives Categories (تعريف الفئات والأوسمة)
|--------------------------------------------------------------------------
*/

const CARD_DEFS = [
  // 🍀 الأكثر حظاً من عجلة الحظ
  {
    key: "luckiestWheel",
    category: "luck",
    icon: Sparkles,
    label: "الأكثر حظاً (عجلة الحظ)",
    subtitle: "أكثر طالب حصد نقاطاً من دوران عجلة الحظ",
    badgeText: "🍀 حظ أسطوري",
    gradient: "from-amber-400 via-yellow-500 to-amber-600",
    glow: "shadow-amber-500/20",
    borderClass: "border-amber-500/30",
    getValue: (student) => student.luckyWheelPoints || 0,
    unit: "نقطة من العجلة",
  },

  // 🏆 المتصدر الأكاديمي (المركز الأول في الترتيب العام)
  {
    key: "academicLeader",
    category: "academic",
    icon: Trophy,
    label: "المتصدر الأكاديمي (Rank #1)",
    subtitle: "صاحب أعلى معدل تراكمي إجمالي في المجموعة",
    badgeText: "👑 الأول على الدفعة",
    gradient: "from-yellow-400 via-amber-500 to-orange-500",
    glow: "shadow-yellow-500/20",
    borderClass: "border-yellow-500/30",
    getValue: (student) => student.combinedScore || 0,
    unit: "% معدل عام",
  },

  // 👑 ملك الالتزام (حضور مثالي 100%)
  {
    key: "perfectAttendance",
    category: "academic",
    icon: ShieldCheck,
    label: "ملك الالتزام (حضور كامل)",
    subtitle: "التزام بنسبة 100% بدون أي غياب مسجل",
    badgeText: "🛡️ صفر غيابات",
    gradient: "from-emerald-500 to-teal-600",
    glow: "shadow-emerald-500/20",
    borderClass: "border-emerald-500/30",
    getValue: (student) => student.attendedLectures || 0,
    unit: "محاضرة كاملة",
  },

  // 💻 نجم المهام والتاسكات
  {
    key: "highestTaskGrades",
    category: "academic",
    icon: ClipboardList,
    label: "نجم المهام (أعلى مجموع درجات)",
    subtitle: "حقق أعلى مجموع تراكمي في درجات المهام والتاسكات",
    badgeText: "🚀 إتقان متواصل",
    gradient: "from-indigo-500 to-purple-600",
    glow: "shadow-indigo-500/20",
    borderClass: "border-indigo-500/30",
    getValue: (student) => student.totalTaskScore || 0,
    unit: "درجة مهام",
  },

  // 🎯 العلامة الكاملة (100% تاسكات)
  {
    key: "perfectTasksMaster",
    category: "academic",
    icon: Target,
    label: "العلامة الكاملة (100/100)",
    subtitle: "أكبر عدد من المهام المنجزة بالدرجة النهائية",
    badgeText: "💯 بيرفكت",
    gradient: "from-violet-500 to-fuchsia-600",
    glow: "shadow-violet-500/20",
    borderClass: "border-violet-500/30",
    getValue: (student) => student.perfectTasksCount || 0,
    unit: "تاسك بدرجة 100",
  },

  // 📝 نجم الاختبارات والكويزات
  {
    key: "highestExamGrades",
    category: "academic",
    icon: GraduationCap,
    label: "نجم الاختبارات والكويزات",
    subtitle: "حقق أعلى الدرجات في الامتحانات والكويزات",
    badgeText: "⚡ بطل الامتحانات",
    gradient: "from-sky-500 to-blue-600",
    glow: "shadow-sky-500/20",
    borderClass: "border-sky-500/30",
    getValue: (student) => student.examScore || 0,
    unit: "درجة اختبارات",
  },

  // ⭐ أعلى نقاط إضافية
  {
    key: "highestScore",
    category: "social",
    icon: Star,
    label: "أعلى نقاط إضافية (Score)",
    subtitle: "أعلى رصيد نقاط مكافآت وبوست إضافي",
    badgeText: "🪙 ثري النقاط",
    gradient: "from-amber-500 to-orange-500",
    glow: "shadow-amber-500/20",
    borderClass: "border-amber-500/30",
    getValue: (student) => student.score || 0,
    unit: "نقطة إضافية",
  },

  // 👍 الأكثر إعجاباً (Most Liked)
  {
    key: "mostLiked",
    category: "social",
    icon: ThumbsUp,
    label: "الأكثر إعجاباً (Most Liked)",
    subtitle: "حصد أكبر عدد من إعجابات زملائه في المنصة",
    badgeText: "❤️ محبوب الدفعة",
    gradient: "from-emerald-500 to-teal-600",
    glow: "shadow-emerald-500/20",
    borderClass: "border-emerald-500/30",
    getValue: (student) => student.likedBy?.length || 0,
    unit: "إعجاب مسجل",
  },

  // ❤️ الأكثر دعماً لزملائه (Spirit Award)
  {
    key: "mostGenerousLiker",
    category: "social",
    icon: Heart,
    label: "الأكثر دعماً لزملائه (Spirit Award)",
    subtitle: "أكثر طالب أهدى تفاعلات وإعجابات لزملائه",
    badgeText: "✨ الروح الإيجابية",
    gradient: "from-rose-500 to-pink-600",
    glow: "shadow-rose-500/20",
    borderClass: "border-rose-500/30",
    getValue: (student) => student.likesGiven || 0,
    unit: "لايك أهداه لزملائه",
  },

  // 🛡️ الأكثر استخداماً للاحتياطي
  {
    key: "highestReserveUsage",
    category: "luck",
    icon: Flag,
    label: "الأكثر استخداماً للاحتياطي",
    subtitle: "استخدم رصيد الحضور الاحتياطي لحماية حضوره",
    badgeText: "🔄 منقذ الحضور",
    gradient: "from-orange-500 to-amber-600",
    glow: "shadow-orange-500/20",
    borderClass: "border-orange-500/30",
    getValue: (student) => student.reserveUsageCount || 0,
    unit: "مرة استخدام",
  },

  // 📉 الأكثر غياباً
  {
    key: "higheAbsencest",
    category: "alerts",
    icon: TrendingDown,
    label: "الأكثر غياباً",
    subtitle: "سجل أعلى عدد غيابات عن المحاضرات",
    badgeText: "⚠️ في دائرة الخطر",
    gradient: "from-slate-500 to-slate-700",
    glow: "shadow-slate-500/20",
    borderClass: "border-slate-500/30",
    getValue: (student) => student.absences || 0,
    unit: "محاضرة غياب",
  },

  // 👎 الأكثر Dislike
  {
    key: "mostDisliked",
    category: "alerts",
    icon: ThumbsDown,
    label: "الأكثر Dislike",
    subtitle: "تلقى أكبر عدد من تفاعلات عدم الإعجاب",
    badgeText: "⚡ تفاعل سلبي",
    gradient: "from-red-500 to-rose-700",
    glow: "shadow-red-500/20",
    borderClass: "border-red-500/30",
    getValue: (student) => student.dislikedBy?.length || 0,
    unit: "dislike",
  },
];

/*
|--------------------------------------------------------------------------
| Superlative Stat Card with AvatarFrame and Top 3 Podium
|--------------------------------------------------------------------------
*/

const StatCard = ({ def, categoryData, index }) => {
  const Icon = def.icon;
  const winner = categoryData?.winner;
  const top3 = categoryData?.top3 || [];

  if (!winner) return null;

  const displayValue = def.getValue(winner);
  if (!displayValue || displayValue <= 0) return null;

  const winnerBorder = getEffectiveActiveBorder(winner);
  const winnerBadge = getAvatarBadge(winner);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.04,
        type: "spring",
        stiffness: 260,
        damping: 24,
      }}
      className={`
        relative rounded-3xl p-4 sm:p-5
        bg-slate-900/80 backdrop-blur-xl
        border ${def.borderClass || "border-slate-800"}
        shadow-xl ${def.glow}
        hover:border-indigo-500/40 hover:scale-[1.01]
        transition-all duration-300 flex flex-col justify-between overflow-hidden group
      `}
    >
      {/* Decorative Gradient Background Aura */}
      <div
        className={`absolute -top-12 -left-12 w-36 h-36 rounded-full bg-linear-to-br ${def.gradient} opacity-10 blur-2xl pointer-events-none group-hover:opacity-20 transition-opacity`}
      />

      {/* Card Header: Category Badge + Icon */}
      <div className="flex items-center justify-between gap-3 mb-3 relative z-10">
        <span
          className={`
            text-[11px] font-black px-2.5 py-1 rounded-full
            bg-slate-800/80 border border-slate-700/80
            text-slate-200 flex items-center gap-1.5 shadow-xs
          `}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {def.badgeText}
        </span>

        <div
          className={`
            w-9 h-9 rounded-2xl flex items-center justify-center
            bg-linear-to-br ${def.gradient} text-white shadow-md shrink-0
          `}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {/* Main Winner Info: AvatarFrame + Details */}
      <div className="flex items-center gap-3.5 relative z-10">
        {/* Avatar with Animated AvatarFrame */}
        <div className="relative shrink-0">
          <AvatarFrame
            frameStyle={winnerBorder}
            size={58}
            className="shadow-lg"
          >
            {winner.profilePic ? (
              <img
                src={winner.profilePic}
                alt={winner.name || "Student"}
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-400">
                <UserRoundIcon className="w-6 h-6" />
              </div>
            )}
          </AvatarFrame>

          {/* Badge Icon if unlocked */}
          {winnerBadge && (
            <span
              className="absolute -bottom-1 -right-1 text-sm bg-slate-900 rounded-full p-0.5 border border-slate-700 shadow-sm"
              title={winnerBadge.name}
            >
              {winnerBadge.icon}
            </span>
          )}
        </div>

        {/* Student Text Info */}
        <div className="flex-1 min-w-0 text-right">
          <p className="text-xs font-semibold text-slate-400 truncate">
            {def.label}
          </p>
          <h4 className="font-black text-slate-100 text-sm sm:text-base truncate group-hover:text-indigo-300 transition-colors">
            {winner.name}
          </h4>
          <span className="inline-block text-[10px] font-semibold text-indigo-400/90 bg-indigo-950/40 px-2 py-0.5 rounded-md mt-0.5 border border-indigo-800/30">
            {winner.group || "بدون مجموعة"}
          </span>
        </div>

        {/* Value Display */}
        <div className="shrink-0 text-left">
          <p
            className={`
              text-xl sm:text-2xl font-black tabular-nums leading-none
              bg-linear-to-br ${def.gradient} bg-clip-text text-transparent
            `}
          >
            {displayValue}
          </p>
          <p className="text-[10px] text-slate-400 font-medium mt-1">
            {def.unit}
          </p>
        </div>
      </div>

      {/* Top 3 Podium (المركز 2 و 3) */}
      {top3.length > 1 && (
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 relative z-10">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
            <span className="font-bold flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-400" /> المراكز التالية:
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {top3.slice(1, 3).map((runnerUp, rIdx) => {
              const rVal = def.getValue(runnerUp);
              const medal = rIdx === 0 ? "🥈" : "🥉";
              const rBorder = getEffectiveActiveBorder(runnerUp);

              return (
                <div
                  key={runnerUp.id || rIdx}
                  className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-800/40 border border-slate-800/60"
                >
                  <span className="text-xs leading-none">{medal}</span>
                  <AvatarFrame
                    frameStyle={rBorder}
                    size={26}
                    className="shrink-0"
                  >
                    {runnerUp.profilePic ? (
                      <img
                        src={runnerUp.profilePic}
                        alt={runnerUp.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-700 flex items-center justify-center text-[9px] text-slate-300">
                        {runnerUp.name?.[0] || "?"}
                      </div>
                    )}
                  </AvatarFrame>
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-[10px] font-bold text-slate-200 truncate">
                      {runnerUp.name}
                    </p>
                    <p className="text-[9px] text-slate-400 tabular-nums">
                      {rVal} {def.unit.split(" ")[0]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

/*
|--------------------------------------------------------------------------
| Main Component (مودل الإحصائيات الشامل)
|--------------------------------------------------------------------------
*/

const TopStats = ({ onClose }) => {
  const [selectedGroup, setSelectedGroup] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const {
    stats,
    groupOverview,
    latestLectures,
    loading,
    error,
  } = useTopStats(selectedGroup);

  // تصنيف الفئات حسب التبويب
  const filteredDefs = useMemo(() => {
    if (activeTab === "all") return CARD_DEFS;
    return CARD_DEFS.filter((d) => d.category === activeTab);
  }, [activeTab]);

  return createPortal(
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-md z-200"
      />

      {/* Main Panel */}
      <motion.div
        key="panel"
        dir="rtl"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="
          fixed inset-3 sm:inset-6 md:inset-8 lg:inset-12 z-201
          bg-slate-950/95 border border-slate-800/90
          rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100
        "
      >
        {/* ── 1. Header ── */}
        <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Title & Icon */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-100 flex items-center gap-2">
                  <span>إحصائيات وأوسمة الأوائل</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    CodaX Superlatives
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  لوحة الشرف وتتويج المتميزين في التفاعل والمهام والحضور
                </p>
              </div>
            </div>

            {/* Controls: Group Selector + Close */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="
                    appearance-none pl-8 pr-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold
                    bg-slate-900 border border-slate-700/80 text-slate-200
                    focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer
                    hover:border-indigo-400/50 transition-all
                  "
                >
                  <option value="">كل المجموعات (الكل)</option>
                  {Object.keys(latestLectures || {}).map((group) => (
                    <option key={group} value={group}>
                      مجموعة {group}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-900 border border-slate-700/80 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/40 transition-all cursor-pointer"
                title="إغلاق النافذة"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── 2. Group Overview KPIs Banner ── */}
          {groupOverview && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 pt-4 border-t border-slate-800/60 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5"
            >
              <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 truncate">الطلاب</p>
                  <p className="text-sm font-black text-slate-100 tabular-nums">
                    {groupOverview.totalStudents} طالب
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                  <Trophy className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 truncate">متوسط الدفعة</p>
                  <p className="text-sm font-black text-amber-400 tabular-nums">
                    {groupOverview.averageCombinedScore}%
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 truncate">نسبة الحضور</p>
                  <p className="text-sm font-black text-emerald-400 tabular-nums">
                    {groupOverview.averageAttendanceRate}%
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center shrink-0">
                  <Coins className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 truncate">نقاط المجموعة</p>
                  <p className="text-sm font-black text-violet-400 tabular-nums">
                    {groupOverview.totalGroupPoints} ن
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-yellow-500/15 text-yellow-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 truncate">جوائز العجلة</p>
                  <p className="text-sm font-black text-yellow-400 tabular-nums">
                    {groupOverview.totalWheelPointsWon} ن
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 truncate">حضور كامل</p>
                  <p className="text-sm font-black text-teal-400 tabular-nums">
                    {groupOverview.totalPerfectAttendanceStudents} طلاب
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── 3. Filter Tabs ── */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-3.5 pb-0.5" style={{ scrollbarWidth: "none" }}>
            {[
              { id: "all", label: "🌟 جميع الأوسمة", icon: Sparkles },
              { id: "academic", label: "🏆 التفوق الأكاديمي", icon: Trophy },
              { id: "social", label: "❤️ التفاعل والشعبية", icon: ThumbsUp },
              { id: "luck", label: "🍀 الجوائز والعجلة", icon: Coins },
              { id: "alerts", label: "⚠️ تنبيهات المتابعة", icon: AlertCircle },
            ].map((tab) => {
              const active = activeTab === tab.id;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap
                    flex items-center gap-1.5 transition-all cursor-pointer
                    ${
                      active
                        ? "bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 scale-102"
                        : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800"
                    }
                  `}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 4. Cards Body ── */}
        <div
          className="flex-1 overflow-y-auto p-4 sm:p-6"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#334155 transparent" }}
        >
          {error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-rose-400">
              <AlertCircle className="w-10 h-10" />
              <p className="text-sm font-bold">{error}</p>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-28 gap-4">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
              </div>
              <p className="text-xs font-bold text-slate-400 animate-pulse">
                جاري حساب الإحصائيات والأوسمة لطلاب {selectedGroup ? `المجموعة ${selectedGroup}` : "المنصة"}...
              </p>
            </div>
          ) : !stats ? (
            <div className="flex flex-col items-center justify-center py-28 gap-3 text-slate-400">
              <BarChart3 className="w-12 h-12 text-slate-600" />
              <p className="text-sm font-bold">لا توجد بيانات متاحة لهذه المجموعة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDefs.map((def, idx) => {
                const categoryData = stats[def.key];
                return (
                  <StatCard
                    key={def.key}
                    def={def}
                    categoryData={categoryData}
                    index={idx}
                  />
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default React.memo(TopStats);