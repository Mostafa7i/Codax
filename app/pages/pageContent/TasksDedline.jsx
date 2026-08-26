'use client';
import React, { useState, useEffect, useMemo } from "react";
import { FaExclamationTriangle, FaCalendarAlt, FaLink, FaImage } from "react-icons/fa";
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
    <p className="text-sky-400/80 text-sm font-medium">جاري تحميل تفاصيل المهمة...</p>
  </div>
);

// --- Status Badge ---
const StatusBadge = ({ status }) => {
  const styles = {
    expired: "bg-red-500/15 text-red-400 border-red-500/30",
    urgent: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    normal: "bg-sky-500/15 text-sky-400 border-sky-500/30",
    none: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  };

  const labels = {
    expired: "انتهى الموعد",
    urgent: "قريب جدًا",
    normal: "جاري",
    none: "غير محدد",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${styles[status]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {labels[status]}
    </span>
  );
};

const TasksDedline = () => {
  const { selectedGroup } = useGroupContext();
  const { taskDetails, isLoading, error } = useTaskDetails(selectedGroup);

  // الوقت المتبقي يتحدث كل ثانية
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!taskDetails?.deadline) return;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [taskDetails?.deadline]);

  // حساب الحالة + الوقت المتبقي
  const { status, timeLeftText, formattedDeadline } = useMemo(() => {
    if (!taskDetails?.deadline) {
      return {
        status: "none",
        timeLeftText: "لم يحدد بعد",
        formattedDeadline: null,
      };
    }

    const deadlineDate = new Date(taskDetails.deadline);
    const diff = deadlineDate.getTime() - now;

    let status = "normal";
    let timeLeftText = "";

    if (diff <= 0) {
      status = "expired";
      timeLeftText = "انتهى الوقت";
    } else {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      timeLeftText = `${days}ي : ${hours}س : ${minutes}د : ${seconds}ث`;

      // أقل من 24 ساعة = عاجل
      if (diff < 1000 * 60 * 60 * 24) {
        status = "urgent";
      }
    }

    const formattedDeadline = deadlineDate.toLocaleString("ar-EG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return { status, timeLeftText, formattedDeadline };
  }, [taskDetails?.deadline, now]);

  // ========== States ==========
  if (!selectedGroup) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] px-4">
        <div className="text-center bg-slate-800/70 border border-slate-700 rounded-2xl px-8 py-10 max-w-md">
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
        <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-l from-sky-400 to-blue-300 bg-clip-text text-transparent">
          تفاصيل المهمة
        </h1>
        <p className="text-slate-400 text-sm mt-1">المجموعة: {selectedGroup}</p>
      </div>

      {/* Main Card */}
      <div className="bg-slate-900 border border-slate-700/70 rounded-3xl overflow-hidden shadow-2xl">
        {/* Top accent */}
        <div className="h-1.5 bg-linear-to-r from-sky-500 via-blue-500 to-indigo-500"></div>

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
            <div className="bg-red-950/40 border border-red-500/25 rounded-2xl p-4 sm:p-5">
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

          {/* ===== Deadline Box ===== */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Left: Date info */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center shrink-0">
                  <FaCalendarAlt className="text-sky-400 w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">الموعد النهائي</p>
                  <p className="text-sm sm:text-base font-medium text-white">
                    {formattedDeadline || "غير محدد"}
                  </p>
                </div>
              </div>

              {/* Right: Time left */}
              <div className="flex items-center gap-3 bg-slate-900/70 rounded-xl px-4 py-3 border border-slate-700/50">
                <Clock className="w-4 h-4 text-sky-400 shrink-0" />
                <div className="text-left">
                  <p className="text-[11px] text-slate-400">الوقت المتبقي</p>
                  <p
                    className={`font-bold text-sm sm:text-base tabular-nums ${
                      status === "expired"
                        ? "text-red-400"
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