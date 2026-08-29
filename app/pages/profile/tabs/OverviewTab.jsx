import React, { Suspense, lazy } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarCheck,
  ShieldCheck,
  Coins,
  TrendingUp,
  Target,
  LayoutGrid,
  MessageSquare,
  ArrowRightLeft,
  X,
} from "lucide-react";
import ProgressBar from "../components/ProgressBar";

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

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
  </div>
);

export default function OverviewTab({
  studentData,
  studentId,
  state,
  absences,
  total,
  rankTitle,
  rankColorClass,
  showIcons,
  toggleIcons,
  showTime,
  toggleActiveTime,
  status,
  reserveAttendanceCount,
  isProcessingReserve,
  handleUseReserveAttendance,
  showModalAttendance,
  setShowModalAttendance,
  showModal,
  setShowModal,
  openNote,
  setOpenNote,
  cardConfig,
}) {
  return (
    <div className="space-y-5">
      {/* Warning Banner */}
      {studentData?.warning && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40 p-4 rounded-2xl flex items-start gap-3"
        >
          <div className="w-9 h-9 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="text-red-500 w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-red-600 dark:text-red-400">
              تنبيه إداري
            </h3>
            <p className="text-red-700 dark:text-red-300 text-sm mt-0.5">
              {studentData?.warning}
            </p>
          </div>
          <div className="mr-auto">
            <Suspense fallback={null}>
              <TextEffect />
            </Suspense>
          </div>
        </motion.div>
      )}

      {/* Hero Summary Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-3 divide-x divide-x-reverse divide-gray-100 dark:divide-gray-700 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
      >
        {[
          {
            label: "المتوسط الإجمالي",
            value: `${state.combinedScore}%`,
            color:
              state.combinedScore >= 85
                ? "text-emerald-500"
                : state.combinedScore >= 65
                  ? "text-amber-500"
                  : "text-red-500",
          },
          {
            label: "نسبة الحضور",
            value: `${state.attendancePercentage}%`,
            color:
              state.attendancePercentage >= 80
                ? "text-sky-500"
                : "text-orange-500",
          },
          {
            label: "النقاط المكتسبة",
            value: `${studentData?.score || 0}`,
            color: "text-violet-500",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center py-4 px-3 text-center"
          >
            <span className={`text-2xl font-black ${item.color}`}>
              {item.value}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-medium">
              {item.label}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Attendance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden flex flex-col "
        >
          {/* Header */}
          <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-gray-700/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-sky-50 dark:bg-sky-900/20 rounded-lg flex items-center justify-center">
                <CalendarCheck
                  style={{ width: 18, height: 18 }}
                  className="text-sky-500"
                />
              </div>
              <div>
                <p className="font-bold text-gray-700 dark:text-gray-200 text-sm leading-tight">
                  سجل الحضور
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  تتبع حضورك وغيابك
                </p>
              </div>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                absences === 0
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                  : absences <= 3
                    ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                    : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
              }`}
            >
              {absences === 0 ? "ملتزم" : `${absences} غياب`}
            </span>
          </div>

          <div className="p-4 flex align-content-center place-content-center items-center justify-center  flex-col gap-5 flex-1">
            {/* الرقم الكبير + الدائرة */}
            <div className="flex items-center gap-5">
              {/* Circular Progress - نسبة الحضور */}
              {(() => {
                const pct = Math.min(
                  Math.max(state.attendancePercentage || 0, 0),
                  100,
                );
                const r = 52;
                const circ = 2 * Math.PI * r;
                const offset = circ - (pct / 100) * circ;

                // لون حسب النسبة
                const strokeColor =
                  pct >= 90
                    ? "#10b981" // أخضر
                    : pct >= 75
                      ? "#0ea5e9" // سماوي
                      : pct >= 50
                        ? "#f59e0b" // أصفر
                        : "#ef4444"; // أحمر

                return (
                  <div
                    className="relative shrink-0"
                    style={{ width: 120, height: 120 }}
                  >
                    <svg
                      width="120"
                      height="120"
                      viewBox="0 0 120 120"
                      style={{ transform: "rotate(-90deg)" }}
                    >
                      {/* الخلفية */}
                      <circle
                        cx="60"
                        cy="60"
                        r={r}
                        fill="none"
                        stroke="currentColor"
                        className="text-gray-100 dark:text-gray-700"
                        strokeWidth="12"
                      />
                      {/* التقدم */}
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
                            "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1), stroke 0.4s ease",
                        }}
                      />
                    </svg>

                    {/* الرقم في المنتصف */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-gray-800 dark:text-white leading-none">
                        {Math.round(pct)}%
                      </span>
                      <span className="text-[11px] text-gray-400 mt-0.5">
                        حضور
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* المعلومات الجانبية */}
              <div className="flex flex-col gap-3 flex-1 min-w-0">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">المحاضرات</p>
                  <p className="text-2xl font-black text-gray-800 dark:text-white leading-none">
                    {total - absences}
                    <span className="text-base font-medium text-gray-400">
                      {" "}
                      / {total}
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-3 py-2 border border-emerald-100 dark:border-emerald-800/30">
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      حضور
                    </p>
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                      {total - absences}
                    </p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2 border border-red-100 dark:border-red-800/30">
                    <p className="text-[11px] text-red-500 dark:text-red-400 font-medium">
                      غياب
                    </p>
                    <p className="text-lg font-bold text-red-600 dark:text-red-300">
                      {absences}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* تنبيه الحجب */}
            <div className="mt-auto bg-sky-50 dark:bg-sky-900/10 rounded-xl p-3 border border-sky-100 dark:border-sky-800/20">
              <p className="text-xs text-sky-700 dark:text-sky-300 leading-relaxed">
                بتعرفك بكام محاضرة حضرتها من الإجمالي. الحجب بيحصل لو غبت أكتر
                من <strong>12 مرة</strong> في الكورس.
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-sky-100 dark:border-sky-800/20">
                <span className="text-xs text-gray-500">المتاح قبل الحجب</span>
                <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                  {Math.max(0, 12 - absences)} غياب متاح
                </span>
              </div>
            </div>

            {/* زر الاسترداد */}
            <button
              onClick={() => setShowModalAttendance(true)}
              className="w-full flex justify-center items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm py-2.5 rounded-xl transition-all shadow-sm shadow-sky-500/20"
            >
              <ShieldCheck className="w-4 h-4" /> استرداد حضور احتياطي
            </button>
          </div>
        </motion.div>
        {/* --------------------------------------------------------------------------------------------------------------------- */}
        {/* Card 2: Points + SVG Donut */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col"
        >
          <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-700/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
                <Coins
                  style={{ width: 18, height: 18 }}
                  className="text-amber-500"
                />
              </div>
              <div>
                <p className="font-bold text-gray-700 dark:text-gray-200 text-sm leading-tight">
                  نقاط المكافآت
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  نقاطك التراكمية في الكورس
                </p>
              </div>
            </div>
            {(studentData?.score || 0) >= 40 && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 flex items-center gap-1">
                <TrendingUp style={{ width: 11, height: 11 }} /> +
                {Math.floor((studentData.score || 0) / 40)}%
              </span>
            )}
          </div>
          <div className="p-5 flex flex-col gap-4 flex-1">
            {(() => {
              const score = studentData?.score || 0;
              const maxScore = 400;
              const pct = Math.min((score / maxScore) * 100, 100);
              const r = 52;
              const circ = 2 * Math.PI * r;
              const offset = circ - (pct / 100) * circ;
              const strokeColor =
                score >= 200 ? "#f59e0b" : score >= 80 ? "#fb923c" : "#fcd34d";
              return (
                <div className="flex items-center gap-5">
                  <div
                    className="relative shrink-0"
                    style={{ width: 120, height: 120 }}
                  >
                    <svg
                      width="120"
                      height="120"
                      viewBox="0 0 120 120"
                      style={{ transform: "rotate(-90deg)" }}
                    >
                      <circle
                        cx="60"
                        cy="60"
                        r={r}
                        fill="none"
                        stroke="#e5e7eb"
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
                      <span className="text-xl font-black text-gray-800 dark:text-white leading-none">
                        {score}
                      </span>
                      <span className="text-xs text-gray-400">
                        / {maxScore}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <div>
                      <p className="text-xs text-gray-400">إجمالي النقاط</p>
                      <p className="text-2xl font-black text-gray-800 dark:text-white">
                        {score}{" "}
                        <span className="text-sm font-normal text-gray-400">
                          نقطة
                        </span>
                      </p>
                    </div>
                    <div className="h-px bg-gray-100 dark:bg-gray-700" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {Math.floor(score / 40) > 0 ? (
                        <>
                          <strong className="text-amber-500">
                            +{Math.floor(score / 40)}%
                          </strong>{" "}
                          زيادة على متوسطك
                        </>
                      ) : (
                        <>
                          اجمع{" "}
                          <strong className="text-amber-500">40 نقطة</strong>{" "}
                          للحصول على +1%
                        </>
                      )}
                    </p>
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      {[
                        [40, "+1%"],
                        [80, "+2%"],
                        [160, "+4%"],
                        [200, "+5%"],
                      ].map(([pts, lbl]) => (
                        <div
                          key={pts}
                          className={`px-2 py-1 rounded-lg text-center text-xs font-bold transition-all border ${
                            score >= pts
                              ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/30 text-amber-600"
                              : "bg-gray-50 dark:bg-gray-700/30 border-gray-100 dark:border-gray-700/20 text-gray-300 dark:text-gray-600"
                          }`}
                        >
                          {lbl}{" "}
                          <span className="font-normal opacity-70">
                            ({pts}pt)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
            <div className="mt-auto bg-amber-50 dark:bg-amber-900/10 rounded-xl p-3 border border-amber-100 dark:border-amber-800/20">
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                النقاط بتتراكم من مشاركتك في الكورس. كل <strong>40 نقطة</strong>{" "}
                بتضيف 1% على نسبتك الإجمالية!
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="w-full flex justify-center items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm py-2.5 rounded-xl transition-all shadow-sm shadow-amber-500/20"
            >
              <ArrowRightLeft className="w-4 h-4" /> تحويل نقاط لزميل
            </button>
          </div>
        </motion.div>

        {/* Card 3: Academic Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col"
        >
          <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-700/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-violet-50 dark:bg-violet-900/20 rounded-lg flex items-center justify-center">
                <Target
                  style={{ width: 18, height: 18 }}
                  className="text-violet-500"
                />
              </div>
              <div>
                <p className="font-bold text-gray-700 dark:text-gray-200 text-sm leading-tight">
                  الأداء الأكاديمي
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  متوسطك ودرجاتك الكلية
                </p>
              </div>
            </div>
            {studentData.attendedLectures > 5 && (
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/20 ${rankColorClass}`}
                >
                  {rankTitle}
                </span>
                <button
                  onClick={toggleIcons}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    showIcons
                      ? "bg-emerald-400"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                      showIcons ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            )}
          </div>
          <div className="p-5 flex flex-col gap-4 flex-1">
            <div className="flex items-end gap-1.5">
              <span className="text-4xl relative flex items-center gap-2 w-15 h-15 font-black text-gray-800 dark:text-white">
                {state.combinedScore}
                <span className="text-lg font-medium text-gray-400 mb-0.5">
                  %
                </span>

                {state.combinedScore >= 95 ? (
                  <>
                    <div className="absolute -inset-3.5 rounded-full animate-spin [animation-duration:2s]">
                      <div className="w-full h-full rounded-full border-4 border-transparent border-t-lime-500 border-b-lime-500" />
                    </div>
                    <div className="absolute -inset-2 rounded-full animate-spin [animation-direction:reverse] [animation-duration:1.5s]">
                      <div className="w-full h-full rounded-full border-4 border-transparent border-l-green-500 border-r-green-500/80" />
                    </div>
                    <div className="absolute -inset-1 rounded-full animate-pulse bg-lime-400/20 blur-md pointer-events-none" />
                  </>
                ) : state.combinedScore >= 85 ? (
                  <>
                    <div className="absolute -inset-2 rounded-full animate-spin [animation-direction:reverse] [animation-duration:1.5s]">
                      <div className="w-full h-full rounded-full border-4 border-transparent border-l-green-500 border-r-green-500/80" />
                    </div>
                    <div className="absolute -inset-1 rounded-full animate-pulse bg-green-400/20 blur-md pointer-events-none" />
                  </>
                ) : state.combinedScore >= 75 ? (
                  <>
                    <div className="absolute -inset-2 rounded-full animate-spin [animation-direction:reverse] [animation-duration:1.5s]">
                      <div className="w-full h-full rounded-full border-4 border-transparent border-l-yellow-500 border-r-yellow-500/80" />
                    </div>
                    <div className="absolute -inset-1 rounded-full animate-pulse bg-yellow-400/20 blur-md pointer-events-none" />
                  </>
                ) : state.combinedScore > 60 ? (
                  <>
                    <div className="absolute -inset-2 rounded-full animate-spin [animation-direction:reverse] [animation-duration:1.5s]">
                      <div className="w-full h-full rounded-full border-4 border-transparent border-l-orange-500 border-r-orange-500/80" />
                    </div>
                    <div className="absolute -inset-1 rounded-full animate-pulse bg-orange-400/20 blur-md pointer-events-none" />
                  </>
                ) : (
                  <>
                    <div className="absolute -inset-2 rounded-full animate-spin [animation-direction:reverse] [animation-duration:1.5s]">
                      <div className="w-full h-full rounded-full border-4 border-transparent border-l-red-500 border-r-red-500/80" />
                    </div>
                    <div className="absolute -inset-1 rounded-full animate-pulse bg-red-400/20 blur-md pointer-events-none" />
                  </>
                )}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>المتوسط الإجمالي</span>
                  <span className="text-gray-300">(درجات + نقاط)</span>
                </div>
                <ProgressBar value={state.combinedScore} segments={true} />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[
                {
                  label: "اسطوري",
                  color:
                    "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/30",
                  active: state.combinedScore >= 98,
                  range: "98+",
                },
                {
                  label: "ممتاز",
                  color:
                    "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/30",
                  active: state.combinedScore >= 85,
                  range: "85+",
                },
                {
                  label: "جيد جداً",
                  color:
                    "text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/30",
                  active: state.combinedScore >= 75 && state.combinedScore < 85,
                  range: "75-84",
                },
                {
                  label: "جيد",
                  color:
                    "text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700/30",
                  active: state.combinedScore >= 60 && state.combinedScore < 75,
                  range: "60-74",
                },
                {
                  label: "ضعيف",
                  color:
                    "text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/30",
                  active: state.combinedScore < 60,
                  range: "<60",
                },
              ].map((g) => (
                <div
                  key={g.label}
                  className={`p-1.5 rounded-lg border text-center transition-all ${
                    g.active
                      ? g.color
                      : "bg-gray-50 dark:bg-gray-700/30 border-gray-100 dark:border-gray-700/20 opacity-40"
                  }`}
                >
                  <p className="text-xs font-bold leading-tight">{g.label}</p>
                  <p className="text-xs opacity-70">{g.range}%</p>
                </div>
              ))}
            </div>
            <div className="mt-auto bg-violet-50 dark:bg-violet-900/10 rounded-xl p-3 border border-violet-100 dark:border-violet-800/20">
              <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed">
                المتوسط الإجمالي = <strong>درجاتك في الاختبارات</strong> +{" "}
                <strong>نقاطك المكتسبة</strong>. كل ما ارتفع كل ما ترتيبك أحسن!
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row: Subscription + Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Subscription */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
        >
          <div className="px-5 pt-5 pb-4 flex items-center gap-2.5 border-b border-gray-50 dark:border-gray-700/50">
            <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
              <LayoutGrid
                style={{ width: 18, height: 18 }}
                className="text-indigo-500"
              />
            </div>
            <div>
              <p className="font-bold text-gray-700 dark:text-gray-200 text-sm">
                تفاصيل الاشتراك
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                بيانات دفعك وحالة سدادك
              </p>
            </div>
          </div>
          <div className="p-5 flex flex-col gap-3">
            <Suspense fallback={<LoadingSpinner />}>
              <Subscription studentData={studentData} studentId={studentId} />
            </Suspense>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                حالة النشاط
              </span>
              <button
                onClick={toggleActiveTime}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                  showTime ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                    showTime ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span
                className={`text-xs font-semibold ${
                  showTime ? "text-emerald-500" : "text-gray-400"
                }`}
              >
                {showTime ? "نشط" : "غير نشط"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.25 }}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
        >
          <div className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-700/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <MessageSquare
                  style={{ width: 18, height: 18 }}
                  className="text-orange-500"
                />
              </div>
              <div>
                <p className="font-bold text-gray-700 dark:text-gray-200 text-sm">
                  ملاحظات الإدارة
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  رسائل ومتابعة CodaX
                </p>
              </div>
            </div>
            {studentData.note && (
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            )}
          </div>
          <div className="p-5">
            {studentData.note ? (
              <div className="flex flex-col gap-3">
                <div className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-4 border border-orange-100 dark:border-orange-800/30">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {studentData.note}
                  </p>
                </div>
                <button
                  onClick={() => setOpenNote(true)}
                  className="w-full flex justify-center items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm py-2.5 rounded-xl transition-all shadow-sm shadow-orange-500/20"
                >
                  <MessageSquare className="w-4 h-4" /> عرض الملاحظة كاملة
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mb-3">
                  <MessageSquare
                    style={{ width: 26, height: 26 }}
                    className="text-gray-300 dark:text-gray-500"
                  />
                </div>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  لا توجد ملاحظات حالياً
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  ستظهر هنا أي رسائل من الإدارة
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Modal: Reserve Attendance */}
      {showModalAttendance && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowModalAttendance(false)}
              className="absolute top-4 left-4 text-gray-400 hover:text-red-500 bg-gray-100 dark:bg-gray-700 rounded-full p-1 transition"
            >
              <X size={20} />
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

      {/* Modal: Transfer Points */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-md relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 left-4 text-gray-400 hover:text-red-500 bg-gray-100 dark:bg-gray-700 rounded-full p-1 transition"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 text-center">
              تحويل النقاط
            </h2>
            {status ? (
              <Suspense fallback={<LoadingSpinner />}>
                <TransferPoints studentId={studentData?.id} />
              </Suspense>
            ) : (
              <div className="text-center p-8 bg-gray-50 dark:bg-gray-900 rounded-2xl text-gray-500">
                تم إغلاقه
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Admin Note Full View */}
      {openNote && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setOpenNote(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpenNote(false)}
              className="absolute top-4 left-4 text-gray-400 hover:text-red-500 bg-gray-100 dark:bg-gray-700 rounded-full p-1.5 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-4">
                ملاحظة إدارية
              </h3>
              <div className="w-full bg-orange-50 dark:bg-orange-900/10 rounded-2xl p-5 border border-orange-100 dark:border-orange-800/50">
                <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                  {studentData.note}
                </p>
              </div>
              <button
                onClick={() => setOpenNote(false)}
                className="mt-8 w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition shadow-lg shadow-orange-500/20"
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
