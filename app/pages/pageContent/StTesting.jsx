'use client';
import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import {
  Trophy,
  Medal,
  Camera,
  Sparkles,
  History,
  Clock,
  X,
  RotateCcw,
  Calendar,
} from "lucide-react";
import { useTopTestStudents } from "@/app/services/fetch";
import { useGroupContext } from "@/app/context/GroupContextProvider";

const DEFAULT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2310b981'><circle cx='12' cy='8' r='4'/><path d='M4 20c0-4 3.6-7 8-7s8 3 8 7'/></svg>`;

const getSafeImageSrc = (src) => {
  if (!src || src === "null" || src === "undefined" || String(src).trim() === "") {
    return DEFAULT_AVATAR;
  }
  return src;
};

const Loader = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-[3px] border-emerald-500/15" />
      <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-emerald-400 animate-spin" />
      <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-teal-400/50 animate-spin [animation-direction:reverse] [animation-duration:0.9s]" />
    </div>
    <p className="text-emerald-400/80 text-sm font-medium">جاري تحميل أوائل الاختبار...</p>
  </div>
);

const RankBadge = ({ rank }) => {
  const styles = {
    1: "bg-linear-to-br from-yellow-300 via-amber-400 to-orange-500 text-black shadow-md shadow-amber-500/40",
    2: "bg-linear-to-br from-slate-200 via-slate-300 to-slate-400 text-black shadow-md shadow-slate-400/30",
    3: "bg-linear-to-br from-amber-600 via-orange-600 to-amber-800 text-white shadow-md shadow-orange-700/30",
  };
  return (
    <div
      className={`w-6 h-6 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black text-xs sm:text-sm shrink-0 ${
        styles[rank] || "bg-slate-700 text-slate-300"
      }`}
    >
      {rank}
    </div>
  );
};

const StTesting = () => {
  const { selectedGroup } = useGroupContext();
  const { topTestStudents, testTitle, history = [], isLoading, error } = useTopTestStudents(selectedGroup);
  const captureRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedExamIndex, setSelectedExamIndex] = useState("latest");
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // تحديد البيانات المعروضة حالياً (الأحدث أو اختبار سابق من الأرشيف)
  const isViewingHistory = selectedExamIndex !== "latest" && history && history[selectedExamIndex];
  const activeArchiveExam = isViewingHistory ? history[selectedExamIndex] : null;

  const currentStudents = isViewingHistory
    ? activeArchiveExam.students || []
    : topTestStudents || [];

  const currentTitle = isViewingHistory
    ? activeArchiveExam.testTitle || "اختبار سابق"
    : testTitle || `المجموعة: ${selectedGroup}`;

  const currentFormattedDate = isViewingHistory && activeArchiveExam.date
    ? new Date(activeArchiveExam.date).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const top3 = currentStudents.slice(0, 3);
  const rest = currentStudents.slice(3);

  const handleCapture = async () => {
    if (!captureRef.current || currentStudents.length === 0) return;
    setIsCapturing(true);

    try {
      const images = captureRef.current.querySelectorAll("img");
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) return resolve();
              img.onload = resolve;
              img.onerror = () => {
                img.src = DEFAULT_AVATAR;
                resolve();
              };
            })
        )
      );

      const dataUrl = await toPng(captureRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#0a0f1a",
        cacheBust: true,
        filter: (node) => !(node.tagName === "IMG" && !node.complete),
      });

      const link = document.createElement("a");
      link.download = `Top-Test-${selectedGroup}-${currentTitle || "Test"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Capture failed:", err);
      alert("حصل خطأ أثناء التقاط الصورة. جرب تاني.");
    } finally {
      setIsCapturing(false);
    }
  };

  if (!selectedGroup) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] px-4">
        <div className="text-center bg-slate-900/80 border border-slate-700/60 rounded-3xl px-8 py-12 max-w-md">
          <Trophy className="w-12 h-12 text-emerald-500/40 mx-auto mb-4" />
          <p className="text-slate-300 text-lg font-medium">الرجاء اختيار مجموعة أولاً</p>
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
      className="w-full max-w-2xl mx-auto px-1.5 sm:px-4 py-4 sm:py-6"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] uppercase text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full mb-2">
            <Sparkles className="w-3 h-3" />
            نتائج الاختبار
          </div>
          <h1 className="text-2xl sm:text-3xl font-black bg-linear-to-l from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
            أوائل الاختبار
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {currentTitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center justify-center gap-1.5 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 font-bold px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 text-xs sm:text-sm"
              title="عرض سجل الاختبارات السابقة"
            >
              <History className="w-4 h-4 text-amber-400" />
              <span>السجل ({history.length})</span>
            </button>
          )}

          {currentStudents.length > 0 && (
            <button
              onClick={handleCapture}
              disabled={isCapturing}
              className="flex items-center justify-center gap-2 bg-linear-to-l from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all active:scale-95 text-sm"
            >
              {isCapturing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  جاري التقاط الصورة...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  صورة للنشر
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* شريط التبديل السريع بين الاختبار الأخير وسجل الاختبارات */}
      {history.length > 0 && (
        <div className="mb-4 bg-slate-900/60 p-2 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5  py-1">
            <button
              onClick={() => setSelectedExamIndex("latest")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                selectedExamIndex === "latest"
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>الاختبار الأخير (الحالي)</span>
            </button>

            {history.slice(0, 2).map((item, idx) => (
              <button
                key={item.id || idx}
                onClick={() => setSelectedExamIndex(idx)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 shrink-0 max-w-[140px] truncate ${
                  selectedExamIndex === idx
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="truncate">{item.testTitle || `اختبار ${idx + 1}`}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowHistoryModal(true)}
            className="text-amber-400 hover:text-amber-300 font-bold px-2 py-1 flex items-center gap-1 shrink-0"
          >
            <span>كل السجل 📜</span>
          </button>
        </div>
      )}

      {/* شريط تنبيه الأرشيف في حال كان الطالب يستعرض اختباراً سابقاً */}
      {isViewingHistory && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <History className="w-4 h-4 shrink-0" />
            <span>
              أنت تتصفح أرشيف: <strong>{currentTitle}</strong>
              {currentFormattedDate && <span className="mr-1 text-slate-400 font-normal">({currentFormattedDate})</span>}
            </span>
          </div>
          <button
            onClick={() => setSelectedExamIndex("latest")}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>العودة للأحدث</span>
          </button>
        </motion.div>
      )}

      {/* Capture Area */}
      <div
        ref={captureRef}
        className="relative bg-[#0a0f1a] border border-slate-700/50 rounded-3xl overflow-hidden  shadow-2xl"
      >
        {/* Top glow line */}
        <div className="h-1.5 bg-linear-to-l from-emerald-500 via-teal-400 to-cyan-400" />

        {/* Ambient */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-emerald-500/10 blur-[80px] rounded-full" />

        <div className="relative p-2.5 sm:p-6 md:p-8">
          {/* Title */}
          <div className="text-center mb-10">
            <span className="text-[10px] sm:text-xs font-bold tracking-[0.25em] text-emerald-400/80 uppercase">
              TOP STUDENTS — TESTING {isViewingHistory && "• ARCHIVE"}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5">
              {currentTitle}
            </h2>
            {isViewingHistory && currentFormattedDate && (
              <p className="text-xs text-amber-400/80 mt-1 flex items-center justify-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>تاريخ الاختبار: {currentFormattedDate}</span>
              </p>
            )}
          </div>

          {isLoading ? (
            <Loader />
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          ) : currentStudents.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="w-14 h-14 text-slate-600 mx-auto mb-4 opacity-50" />
              <p className="text-slate-400">لا يوجد طلاب في قائمة أوائل الاختبار</p>
            </div>
          ) : (
            <>
              {/* ═══════ PODIUM ═══════ */}
              {top3.length > 0 && (
                <div className="flex items-end justify-center gap-1.5 sm:gap-4 mb-8 sm:mb-10 px-0.5 sm:px-1 w-full">
                  {/* 2nd */}
                  {top3[1] && (
                    <motion.div
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="flex flex-col items-center flex-1 min-w-0 max-w-[95px] xs:max-w-[110px] sm:max-w-[140px]"
                    >
                      <div className="relative mb-2 sm:mb-3">
                        <img
                          src={getSafeImageSrc(top3[1].profilePic)}
                          alt={top3[1].name}
                          className="w-13 h-13 xs:w-15 xs:h-15 sm:w-20 sm:h-20 rounded-full object-cover border-2 sm:border-[3px] border-slate-400 shadow-xl shadow-slate-500/20"
                          onError={(e) => (e.target.src = DEFAULT_AVATAR)}
                        />
                        <div className="absolute -bottom-1.5 sm:-bottom-2 left-1/2 -translate-x-1/2">
                          <RankBadge rank={2} />
                        </div>
                      </div>
                      <p className="text-white font-bold text-[11px] sm:text-sm text-center line-clamp-2 w-full px-0.5 mb-1 leading-tight h-7 sm:h-auto flex items-center justify-center">
                        {top3[1].name}
                      </p>
                      <span className="text-slate-300 font-black text-xs sm:text-base tabular-nums mb-1.5 sm:mb-2">
                        {top3[1].degree}
                      </span>
                      <div className="w-full h-14 sm:h-20 rounded-t-xl sm:rounded-t-2xl bg-linear-to-t from-slate-700 to-slate-500 flex items-center justify-center shadow-inner">
                        <Medal className="w-4 h-4 sm:w-6 sm:h-6 text-slate-300" />
                      </div>
                    </motion.div>
                  )}

                  {/* 1st */}
                  {top3[0] && (
                    <motion.div
                      initial={{ opacity: 0, y: 28 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                      className="flex flex-col items-center flex-1 min-w-0 max-w-[110px] xs:max-w-[125px] sm:max-w-[155px] z-10 -mt-2 sm:mt-0"
                    >
                      <div className="relative mb-2 sm:mb-3">
                        <div className="absolute -inset-1 sm:-inset-1.5 bg-linear-to-r from-yellow-400 to-amber-500 rounded-full blur-sm opacity-60 animate-pulse" />
                        <img
                          src={getSafeImageSrc(top3[0].profilePic)}
                          alt={top3[0].name}
                          className="relative w-16 h-16 xs:w-18 xs:h-18 sm:w-24 sm:h-24 rounded-full object-cover border-2 sm:border-[3px] border-yellow-400 shadow-2xl shadow-yellow-500/30"
                          onError={(e) => (e.target.src = DEFAULT_AVATAR)}
                        />
                        <div className="absolute -bottom-1.5 sm:-bottom-2.5 left-1/2 -translate-x-1/2">
                          <RankBadge rank={1} />
                        </div>
                      </div>
                      <p className="text-white font-extrabold text-xs sm:text-base text-center line-clamp-2 w-full px-0.5 mb-1 leading-tight h-7 sm:h-auto flex items-center justify-center">
                        {top3[0].name}
                      </p>
                      <span className="text-amber-400 font-black text-sm sm:text-xl tabular-nums mb-1.5 sm:mb-2">
                        {top3[0].degree}
                      </span>
                      <div className="w-full h-20 sm:h-28 rounded-t-xl sm:rounded-t-2xl bg-linear-to-t from-amber-600 via-yellow-500 to-amber-400 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                        <Trophy className="w-5 h-5 sm:w-7 sm:h-7 text-black/80" />
                      </div>
                    </motion.div>
                  )}

                  {/* 3rd */}
                  {top3[2] && (
                    <motion.div
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="flex flex-col items-center flex-1 min-w-0 max-w-[95px] xs:max-w-[110px] sm:max-w-[140px]"
                    >
                      <div className="relative mb-2 sm:mb-3">
                        <img
                          src={getSafeImageSrc(top3[2].profilePic)}
                          alt={top3[2].name}
                          className="w-13 h-13 xs:w-15 xs:h-15 sm:w-20 sm:h-20 rounded-full object-cover border-2 sm:border-[3px] border-amber-700 shadow-xl shadow-orange-700/20"
                          onError={(e) => (e.target.src = DEFAULT_AVATAR)}
                        />
                        <div className="absolute -bottom-1.5 sm:-bottom-2 left-1/2 -translate-x-1/2">
                          <RankBadge rank={3} />
                        </div>
                      </div>
                      <p className="text-white font-bold text-[11px] sm:text-sm text-center line-clamp-2 w-full px-0.5 mb-1 leading-tight h-7 sm:h-auto flex items-center justify-center">
                        {top3[2].name}
                      </p>
                      <span className="text-orange-400 font-black text-xs sm:text-base tabular-nums mb-1.5 sm:mb-2">
                        {top3[2].degree}
                      </span>
                      <div className="w-full h-10 sm:h-16 rounded-t-xl sm:rounded-t-2xl bg-linear-to-t from-orange-900 to-amber-700 flex items-center justify-center shadow-inner">
                        <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-white/70" />
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* ═══════ Rest of list ═══════ */}
              {rest.length > 0 && (
                <div className="space-y-2 sm:space-y-2.5">
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <div className="h-px flex-1 bg-linear-to-l from-transparent via-slate-700 to-transparent" />
                    <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                      باقي الأوائل
                    </span>
                    <div className="h-px flex-1 bg-linear-to-l from-transparent via-slate-700 to-transparent" />
                  </div>

                  <AnimatePresence>
                    {rest.map((student, idx) => {
                      const rank = idx + 4;
                      return (
                        <motion.div
                          key={student.id || idx}
                          initial={{ opacity: 0, x: 16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.04 * idx }}
                          className="flex items-center gap-2.5 sm:gap-3 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700/40 hover:border-slate-600/60 rounded-2xl p-2.5 sm:px-4 sm:py-3 transition-all"
                        >
                          <RankBadge rank={rank} />
                          <img
                            src={getSafeImageSrc(student.profilePic)}
                            alt={student.name}
                            className="w-9 h-9 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-slate-600 shrink-0"
                            onError={(e) => (e.target.src = DEFAULT_AVATAR)}
                          />
                          <span className="flex-1 min-w-0 font-semibold text-slate-100 truncate text-xs sm:text-base">
                            {student.name}
                          </span>
                          <div className="bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 font-black text-xs sm:text-base px-2.5 py-1 rounded-xl min-w-[42px] sm:min-w-[52px] text-center tabular-nums shrink-0">
                            {student.degree}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950/70 px-5 py-3.5 text-center border-t border-slate-800/80">
          <p className="text-[11px] text-slate-500 font-medium">
            أوائل الاختبار • {selectedGroup} {isViewingHistory && `• ${currentTitle}`}
          </p>
        </div>
      </div>

      {/* ═══════ Modal سجل الاختبارات السابقة ═══════ */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-700 overflow-hidden text-right">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    سجل أوائل الاختبارات السابقة
                  </h3>
                  <p className="text-xs text-slate-400">
                    مجموعة: {selectedGroup}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {/* الاختبار الحالي */}
              <div
                onClick={() => {
                  setSelectedExamIndex("latest");
                  setShowHistoryModal(false);
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedExamIndex === "latest"
                    ? "bg-emerald-500/10 border-emerald-500 text-white shadow-lg shadow-emerald-500/10"
                    : "bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    الاختبار الأخير (الحالي)
                  </span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                    {topTestStudents.length} طلاب
                  </span>
                </div>
                <p className="font-semibold text-white text-base">
                  {testTitle || "الاختبار الحالي"}
                </p>
              </div>

              <div className="flex items-center gap-3 py-2">
                <div className="h-px flex-1 bg-slate-800" />
                <span className="text-[11px] font-bold text-slate-500 tracking-wider">
                  الأرشيف السابق ({history.length})
                </span>
                <div className="h-px flex-1 bg-slate-800" />
              </div>

              {/* الاختبارات السابقة */}
              {history.map((pastExam, idx) => {
                const pastDate = pastExam.date
                  ? new Date(pastExam.date).toLocaleDateString("ar-EG", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : null;

                const isSelected = selectedExamIndex === idx;

                return (
                  <div
                    key={pastExam.id || idx}
                    onClick={() => {
                      setSelectedExamIndex(idx);
                      setShowHistoryModal(false);
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/10"
                        : "bg-slate-800/40 hover:bg-slate-800/80 border-slate-700/50 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-white">
                        {pastExam.testTitle || `اختبار سابق #${idx + 1}`}
                      </span>
                      <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-bold">
                        {pastExam.students?.length || 0} طلاب
                      </span>
                    </div>

                    {pastDate && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{pastDate}</span>
                      </p>
                    )}

                    {pastExam.students && pastExam.students.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-700/40 flex items-center gap-1.5 text-xs text-slate-400">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        <span>الأول: <strong className="text-white">{pastExam.students[0]?.name}</strong> ({pastExam.students[0]?.degree} درجة)</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default React.memo(StTesting);