"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  FaExclamationTriangle,
  FaCalendarAlt,
  FaLink,
  FaImage,
} from "react-icons/fa";
import { useTaskDetails } from "@/app/hooks/allHooks";
import { useGroupContext } from "@/app/context/GroupContextProvider";
import { ExternalLink, Clock, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

// --- Loader ---
const Loader = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <div className="relative w-14 h-14">
      <div className="absolute inset-0 rounded-full border-[3px] border-sky-500/20"></div>
      <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-sky-400 animate-spin"></div>
    </div>
    <p className="text-sky-400/80 text-sm font-medium">
      جاري تحميل تفاصيل المهمة...
    </p>
  </div>
);

// --- Status Badge ---
const StatusBadge = ({ status }) => {
  const styles = {
    expired: "bg-red-500/15 text-red-400 border-red-500/30",
    critical: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    urgent: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    normal: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    none: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  };

  const labels = {
    expired: "انتهى الموعد",
    critical: "حرج جدًا",
    urgent: "قريب جدًا",
    normal: "جاري",
    none: "غير محدد",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${styles[status]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full bg-current ${
          status === "critical" || status === "urgent" ? "animate-pulse" : ""
        }`}
      ></span>
      {labels[status]}
    </span>
  );
};

// دالة مساعدة لتحويل أي نوع تاريخ إلى timestamp رقمي بأمان
const toTimestamp = (value) => {
  if (!value) return null;

  // Firestore Timestamp
  if (typeof value.toDate === "function") {
    return value.toDate().getTime();
  }

  // Timestamp عادي (milliseconds)
  if (typeof value === "number") {
    return value;
  }

  // Date object
  if (value instanceof Date) {
    return value.getTime();
  }

  // string أو أي حاجة تانية
  const parsed = new Date(value).getTime();
  return isNaN(parsed) ? null : parsed;
};

const TasksDedline = () => {
  const { selectedGroup } = useGroupContext();
  const { taskDetails, isLoading, error } = useTaskDetails(selectedGroup);

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!taskDetails?.deadline) return;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [taskDetails?.deadline]);

  const {
    status,
    timeLeftText,
    formattedDeadline,
    progressPercent,
    progressColor,
  } = useMemo(() => {
    if (!taskDetails?.deadline) {
      return {
        status: "none",
        timeLeftText: "لم يحدد بعد",
        formattedDeadline: null,
        progressPercent: 0,
        progressColor: "from-slate-500 to-slate-600",
      };
    }

    const deadlineTime = toTimestamp(taskDetails.deadline);

    // لو التاريخ مش صالح
    if (!deadlineTime || isNaN(deadlineTime)) {
      return {
        status: "none",
        timeLeftText: "تاريخ غير صالح",
        formattedDeadline: null,
        progressPercent: 0,
        progressColor: "from-slate-500 to-slate-600",
      };
    }

    const diff = deadlineTime - now;

    // محاولة الحصول على تاريخ الإنشاء
    let createdAt = toTimestamp(taskDetails.createdAt);

    // لو مفيش createdAt أو مش صالح → نفترض 7 أيام قبل الموعد
    if (!createdAt || isNaN(createdAt) || createdAt >= deadlineTime) {
      createdAt = deadlineTime - 7 * 24 * 60 * 60 * 1000;
    }

    const totalDuration = Math.max(deadlineTime - createdAt, 1);
    const remaining = Math.max(diff, 0);

    let progressPercent = (remaining / totalDuration) * 100;
    progressPercent = Math.min(100, Math.max(0, progressPercent));

    // حماية نهائية من أي NaN
    if (isNaN(progressPercent)) progressPercent = 0;

    let status = "normal";
    let timeLeftText = "";
    let progressColor = "from-sky-400 to-blue-500";

    if (diff <= 0) {
      status = "expired";
      timeLeftText = "انتهى الوقت";
      progressColor = "from-red-500 to-rose-600";
      progressPercent = 0;
    } else {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      timeLeftText = `${days}ي : ${hours}س : ${minutes}د : ${seconds}ث`;

      if (diff < 1000 * 60 * 60) {
        // أقل من ساعة
        status = "critical";
        progressColor = "from-rose-500 to-red-600";
      } else if (diff < 1000 * 60 * 60 * 24) {
        // أقل من 24 ساعة
        status = "urgent";
        progressColor = "from-amber-400 to-orange-500";
      } else {
        progressColor = "from-sky-400 to-blue-500";
      }
    }

    const formattedDeadline = new Date(deadlineTime).toLocaleString("ar-EG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return {
      status,
      timeLeftText,
      formattedDeadline,
      progressPercent,
      progressColor,
    };
  }, [taskDetails?.deadline, taskDetails?.createdAt, now]);

  // ========== States ==========
  if (!selectedGroup) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] px-4">
        <div className="text-center bg-slate-800/70 border border-slate-700 rounded-2xl px-8 py-10 max-w-md backdrop-blur-sm">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-slate-300 text-lg">الرجاء اختيار مجموعة أولاً</p>
        </div>
      </div>
    );
  }

  if (isLoading) return <Loader />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] px-4">
        <div className="text-center bg-red-900/20 border border-red-500/30 rounded-2xl px-8 py-10 max-w-md">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!taskDetails) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] px-4">
        <div className="text-center bg-slate-800/70 border border-slate-700 rounded-2xl px-8 py-10 max-w-md">
          <div className="text-4xl mb-3 opacity-50">📭</div>
          <p className="text-slate-400">
            لا توجد مهمة محددة لهذه المجموعة ({selectedGroup})
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.45 }}
      className="w-full max-w-3xl mx-auto px-3 sm:px-4 py-6"
      dir="rtl"
    >
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-l from-amber-400 to-blue-300 bg-clip-text text-transparent">
          تفاصيل المهمة
        </h1>
        <p className="text-slate-400 text-sm mt-1">المجموعة: {selectedGroup}</p>
      </div>

      {/* Main Card */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/70 rounded-3xl overflow-hidden shadow-2xl">
        {/* Top accent */}
        <div
          className={`h-1.5 bg-linear-to-r ${
            status === "expired"
              ? "from-red-500 via-rose-500 to-red-600"
              : status === "critical"
                ? "from-rose-500 via-red-500 to-orange-500"
                : status === "urgent"
                  ? "from-amber-400 via-orange-500 to-amber-500"
                  : "from-sky-500 via-blue-500 to-indigo-500"
          }`}
        ></div>

        <div className="p-5 sm:p-7 space-y-6">
          {/* ===== Title + Status ===== */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                {taskDetails.title || "عنوان المهمة"}
              </h2>
              {taskDetails.description && (
                <p className="text-slate-400 mt-2 text-sm sm:text-base leading-relaxed">
                  {taskDetails.description}
                </p>
              )}
            </div>
            <StatusBadge status={status} />
          </div>
          {/* ===== Burning Fuse Progress ===== */}
          {taskDetails.deadline && (
            <div className="space-y-3 pt-1">
              {/* ================= FUSE ================= */}
              <div className="relative w-full h-8 overflow-visible">
                {/* ===== Burned / Ashen Track ===== */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[7px] rounded-full bg-[#171717] shadow-[inset_0_1px_2px_rgba(255,255,255,0.05)]">
                  <div className="absolute inset-0 rounded-full bg-linear-to-r from-[#080808] via-[#252525] to-[#111]" />

                  {/* رماد متطاير */}
                  <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-[5px] rounded-full"
                    initial={false}
                    animate={{ width: `${100 - progressPercent}%` }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                    style={{
                      background: `
              repeating-linear-gradient(
                90deg,
                rgba(95,95,95,.45) 0px,
                rgba(95,95,95,.25) 2px,
                rgba(120,120,120,.8) 5px,
                rgba(15,15,15,.95) 8px
              )
            `,
                      filter: "blur(.2px)",
                    }}
                  />
                </div>

                {/* ===== Live Fuse ===== */}
                <motion.div
                  className="absolute top-1/2 right-0 -translate-y-1/2 h-[5px] overflow-visible"
                  initial={false}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                >
                  {/* Glow تحت السلك */}
                  <div className="absolute -inset-1 rounded-full bg-orange-500/10 blur-[5px]" />

                  {/* ===== Fuse Rope ===== */}
                  <div
                    className="
            absolute inset-0
            rounded-full
            overflow-hidden
            shadow-[0_1px_2px_rgba(0,0,0,.8),0_0_6px_rgba(120,72,20,.22)]
          "
                    style={{
                      background: `
              repeating-linear-gradient(
                135deg,
                #3a2413 0px,
                #6f4820 2px,
                #9b682f 4px,
                #4a2d16 6px,
                #26170d 8px
              )
            `,
                    }}
                  >
                    {/* الألياف المتشابكة */}
                    <div
                      className="absolute inset-0 opacity-70"
                      style={{
                        background: `
                repeating-linear-gradient(
                  45deg,
                  transparent 0px,
                  transparent 3px,
                  rgba(255,190,90,.30) 3px,
                  rgba(255,190,90,.30) 4px,
                  transparent 4px,
                  transparent 7px
                )
              `,
                      }}
                    />

                    <div
                      className="absolute inset-0 opacity-50"
                      style={{
                        background: `
                repeating-linear-gradient(
                  -45deg,
                  transparent 0px,
                  transparent 4px,
                  rgba(20,10,4,.75) 4px,
                  rgba(20,10,4,.75) 6px,
                  transparent 6px,
                  transparent 9px
                )
              `,
                      }}
                    />

                    {/* highlight رفيع */}
                    <div className="absolute left-0 right-0 top-px h-0.5 bg-white/10 blur-[1px]" />

                    {/* ألياف منفردة */}
                    <div className="absolute inset-0 opacity-80">
                      <span className="absolute left-[8%] top-0 h-full w-px rotate-25 bg-amber-200/20" />
                      <span className="absolute left-[21%] top-0 h-full w-px rotate-25 bg-black/40" />
                      <span className="absolute left-[37%] top-0 h-full w-px rotate-25 bg-amber-100/15" />
                      <span className="absolute left-[54%] top-0 h-full w-px rotate-25 bg-black/45" />
                      <span className="absolute left-[71%] top-0 h-full w-px rotate-25 bg-amber-100/20" />
                      <span className="absolute left-[87%] top-0 h-full w-px rotate-25 bg-black/50" />
                    </div>
                  </div>
                </motion.div>

                {/* ================= FIRE HEAD ================= */}
                {progressPercent > 0 && progressPercent < 100 && (
                  <motion.div
                    className="absolute top-1/2 z-30"
                    initial={false}
                    animate={{
                      right: `calc(${progressPercent}% - 7px)`,
                    }}
                    transition={{
                      duration: 0.9,
                      ease: "easeOut",
                    }}
                  >
                    {/* ===== Outer Glow ===== */}
                    <motion.div
                      className="
              absolute
              -inset-4
              rounded-full
              bg-orange-500/25
              blur-[7px]
            "
                      animate={{
                        scale: [0.85, 1.15, 0.9],
                        opacity: [0.35, 0.75, 0.4],
                      }}
                      transition={{
                        duration: 0.55,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />

                    {/* ===== Flying sparks ===== */}
                    <motion.span
                      className="absolute -top-5 left-1/2 w-[3px] h-[3px] rounded-full bg-yellow-200 shadow-[0_0_6px_#ffb300]"
                      animate={{
                        x: [-2, 3, -1],
                        y: [0, -7, -12],
                        opacity: [0, 1, 0],
                        scale: [0.6, 1, 0.2],
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: 0.05,
                        ease: "easeOut",
                      }}
                    />

                    <motion.span
                      className="absolute -top-3 -left-2 w-0.5 h-0.5 rounded-full bg-orange-300 shadow-[0_0_5px_#ff7a00]"
                      animate={{
                        x: [-1, -5, -8],
                        y: [0, -4, -9],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 0.65,
                        repeat: Infinity,
                        delay: 0.18,
                        ease: "easeOut",
                      }}
                    />

                    <motion.span
                      className="absolute -top-4 right-0 w-0.5 h-0.5 rounded-full bg-yellow-100 shadow-[0_0_5px_#ffd000]"
                      animate={{
                        x: [0, 4, 7],
                        y: [0, -5, -8],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 0.72,
                        repeat: Infinity,
                        delay: 0.3,
                        ease: "easeOut",
                      }}
                    />

                    <motion.span
                      className="absolute -bottom-1 -left-1 w-[1.5px] h-[1.5px] rounded-full bg-orange-400"
                      animate={{
                        x: [-1, -3, -5],
                        y: [0, 3, 6],
                        opacity: [0, 0.9, 0],
                      }}
                      transition={{
                        duration: 0.7,
                        repeat: Infinity,
                        delay: 0.1,
                      }}
                    />

                    {/* ===== Flame ===== */}
                    <motion.div
                      animate={{
                        rotate: [-4, 5, -2, 4, -4],
                        scale: [0.92, 1.08, 0.96, 1.05, 0.92],
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="relative -translate-y-1"
                    >
                      {/* Outer flame */}
                      <div
                        className="
                absolute
                left-1/2
                top-0
                -translate-x-1/2
                w-[17px]
                h-[23px]
                bg-linear-to-t from-red-700 via-orange-500 to-yellow-300
                drop-shadow-[0_0_7px_rgba(255,100,0,.9)]
              "
                        style={{
                          clipPath:
                            "polygon(50% 100%, 8% 62%, 20% 30%, 40% 48%, 38% 4%, 65% 29%, 72% 0%, 100% 55%, 82% 76%)",
                        }}
                      />

                      {/* Inner flame */}
                      <div
                        className="
                absolute
                left-1/2
                top-1.5
                -translate-x-1/2
                w-[9px]
                h-[13px]
                bg-linear-to-t from-orange-500 via-yellow-200 to-white
              "
                        style={{
                          clipPath:
                            "polygon(50% 100%, 8% 58%, 30% 20%, 45% 44%, 58% 0%, 75% 38%, 100% 62%)",
                        }}
                      />
                    </motion.div>

                    {/* ===== Burning ember ===== */}
                    <motion.div
                      className="
              absolute
              top-1/2
              left-1/2
              -translate-x-1/2
              -translate-y-1/2
              w-2
              h-2
              rounded-full
              bg-white
              shadow-[0_0_4px_#fff,0_0_10px_#ffd000,0_0_18px_#ff6500]
            "
                      animate={{
                        scale: [0.8, 1.35, 0.9],
                      }}
                      transition={{
                        duration: 0.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />

                    {/* ===== Black burned tip ===== */}
                    <div
                      className="
              absolute
              top-1/2
              left-1/2
              -translate-x-1/2
              -translate-y-1/2
              w-[13px]
              h-2
              rounded-full
              bg-[#17110b]
              shadow-[inset_2px_0_4px_rgba(255,120,0,.45)]
            "
                    />
                  </motion.div>
                )}

                {/* ===== Burned ash particles near front ===== */}
                {progressPercent > 0 && progressPercent < 100 && (
                  <motion.div
                    className="absolute inset-y-0 z-20 pointer-events-none"
                    initial={false}
                    animate={{
                      right: `calc(${progressPercent}% + 3px)`,
                    }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                  >
                    <motion.span
                      className="absolute -top-1 left-1 w-1 h-1 rounded-full bg-slate-400/70"
                      animate={{
                        x: [-1, -5, -9],
                        y: [0, -3, -6],
                        opacity: [0.7, 0.4, 0],
                        scale: [1, 0.8, 0],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: 0.15,
                      }}
                    />

                    <motion.span
                      className="absolute -bottom-1 left-2 w-[3px] h-[3px] rounded-full bg-slate-500/50"
                      animate={{
                        x: [0, -4, -7],
                        y: [0, 3, 5],
                        opacity: [0.5, 0.25, 0],
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                      }}
                    />
                  </motion.div>
                )}

                {/* ===== Start / End caps ===== */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#20150c] border border-amber-900/50" />

                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#111] border border-slate-700/60" />
              </div>

              {/* ================= LABELS ================= */}
              <div className="flex justify-between text-[11px] px-0.5">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shadow-[0_0_4px_rgba(100,100,100,.3)]" />
                  محترق
                </span>

                <span className="flex items-center gap-1.5 text-amber-500/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,.8)]" />
                  متبقي
                </span>
              </div>
            </div>
          )}
          {/* ===== Links Section ===== */}
          {(taskDetails.webSiteTitle || taskDetails.imageUrl) && (
            <div className="flex flex-wrap gap-3">
              {taskDetails.webSiteTitle && taskDetails.webSite && (
                <a
                  href={taskDetails.webSite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 hover:text-sky-200 font-medium px-4 py-2.5 rounded-xl transition-all text-sm"
                >
                  <FaLink className="w-3.5 h-3.5" />
                  {taskDetails.webSiteTitle}
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>
              )}

              {taskDetails.imageUrl && (
                <a
                  href={taskDetails.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:text-indigo-200 font-medium px-4 py-2.5 rounded-xl transition-all text-sm"
                >
                  <FaImage className="w-3.5 h-3.5" />
                  صورة التاسك
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>
              )}
            </div>
          )}

          {/* ===== Warnings ===== */}
          {taskDetails.warnings && taskDetails.warnings.length > 0 && (
            <div className=" border border-r-4 border-r-amber-600 border-amber-500/25 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <FaExclamationTriangle className="text-red-400 w-4 h-4" />
                <h3 className="font-semibold text-red-300">تنبيهات هامة</h3>
              </div>
              <ul className="space-y-2">
                {taskDetails.warnings.map((warning, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm sm:text-base text-red-200/90"
                  >
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ===== Deadline Box + Progress Bar ===== */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 sm:p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Left: Date info */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center shrink-0">
                  <FaCalendarAlt className="text-sky-400 w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">
                    الموعد النهائي
                  </p>
                  <p className="text-sm sm:text-base font-medium text-white">
                    {formattedDeadline || "غير محدد"}
                  </p>
                </div>
              </div>

              {/* Right: Time left */}
              <div className="flex items-center gap-3 bg-slate-900/70 rounded-xl px-4 py-3 border border-slate-700/50">
                <Clock
                  className={`w-4 h-4 shrink-0 ${
                    status === "expired"
                      ? "text-red-400"
                      : status === "critical"
                        ? "text-rose-400"
                        : status === "urgent"
                          ? "text-amber-400"
                          : "text-sky-400"
                  }`}
                />
                <div className="text-left">
                  <p className="text-[11px] text-slate-400">الوقت المتبقي</p>
                  <p
                    className={`font-bold text-sm sm:text-base tabular-nums ${
                      status === "expired"
                        ? "text-red-400"
                        : status === "critical"
                          ? "text-rose-400"
                          : status === "urgent"
                            ? "text-amber-400"
                            : "text-sky-300"
                    }`}
                  >
                    {timeLeftText}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TasksDedline;
