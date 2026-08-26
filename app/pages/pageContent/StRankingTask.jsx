'use client';
import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import { useTopTaskStudents } from "@/app/services/fetch";
import { useGroupContext } from "@/app/context/GroupContextProvider";
const defaultAvatar = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236366f1'><circle cx='12' cy='8' r='4'/><path d='M4 20c0-4 3.6-7 8-7s8 3 8 7'/></svg>`;

// --- Loader Component ---
const Loader = () => (
  <div className="flex flex-col items-center justify-center py-16 gap-4">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-4 border-orange-500/30"></div>
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 animate-spin"></div>
    </div>
    <p className="text-orange-400/80 text-sm font-medium">جاري تحميل الأوائل...</p>
  </div>
);

// --- Rank Badge ---
const RankBadge = ({ rank }) => {
  const styles = {
    1: "bg-linear-to-br from-yellow-400 to-amber-600 text-black shadow-md shadow-yellow-500/40",
    2: "bg-linear-to-br from-gray-300 to-gray-500 text-black shadow-md shadow-gray-400/40",
    3: "bg-linear-to-br from-amber-600 to-orange-800 text-white shadow-md shadow-orange-700/40",
  };

  return (
    <div
      className={`w-6 h-6 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shadow-md shrink-0 ${
        styles[rank] || "bg-gray-700 text-gray-300"
      }`}
    >
      {rank}
    </div>
  );
};

const StRankingTask = () => {
  const { selectedGroup } = useGroupContext();
  const { topStudents, taskTitle, isLoading, error } = useTopTaskStudents(selectedGroup);
  const captureRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);

const handleCapture = async () => {
  if (!captureRef.current || topStudents.length === 0) return;

  setIsCapturing(true);

  try {
    const element = captureRef.current;

    // نعمل فلتر بسيط عشان نتجنب أي مشاكل ألوان
    const dataUrl = await toPng(element, {
      quality: 1,
      pixelRatio: 2,          // جودة عالية
      backgroundColor: "#0f172a",
      cacheBust: true,
      // مهم: نحول أي ألوان حديثة لـ rgb
      filter: (node) => {
        // نسمح بكل العناصر
        return true;
      },
      style: {
        // نضمن إن الخلفية ثابتة
        transform: "scale(1)",
      },
    });

    const link = document.createElement("a");
    link.download = `Top-Students-${selectedGroup}-${taskTitle || "Task"}.png`;
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
        <div className="text-center bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-2xl px-8 py-10 max-w-md">
          <div className="text-4xl mb-4">📚</div>
          <p className="text-slate-300 text-lg">الرجاء اختيار مجموعة أولاً</p>
        </div>
      </div>
    );
  }

  const top3 = topStudents.slice(0, 3);
  const rest = topStudents.slice(3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-2xl mx-auto px-1.5 sm:px-4 py-4 sm:py-6"
      dir="rtl"
    >
      {/* Header + Capture Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-l from-orange-400 to-amber-300 bg-clip-text text-transparent">
            أوائل التاسك
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {taskTitle ? taskTitle : `المجموعة: ${selectedGroup}`}
          </p>
        </div>

        {topStudents.length > 0 && (
          <button
            onClick={handleCapture}
            disabled={isCapturing}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-orange-500/25 transition-all active:scale-95 text-sm sm:text-base"
          >
            {isCapturing ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                جاري التقاط الصورة...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                صورة للنشر
              </>
            )}
          </button>
        )}
      </div>

      {/* Main Card - هذا الجزء اللي هيتصور */}
      <div
        ref={captureRef}
        className="bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Decorative top bar */}
        <div className="h-1.5 bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400"></div>

        <div className="p-2.5 sm:p-7">
          {/* Title inside capture area */}
          <div className="text-center mb-8">
            <div className="inline-flex flex-col items-center">
              <span className="text-xs sm:text-sm font-semibold tracking-widest text-orange-400/90 uppercase mb-1">
                TOP STUDENTS
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {taskTitle || selectedGroup}
              </h2>
            </div>
          </div>

          {isLoading ? (
            <Loader />
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          ) : topStudents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4 opacity-40">🏆</div>
              <p className="text-slate-400">
                لا يوجد طلاب في قائمة أوائل التاسك لهذه المجموعة
              </p>
            </div>
          ) : (
            <>
              {/* Podium - Top 3 */}
              {top3.length > 0 && (
                <div className="flex items-end justify-center gap-1.5 sm:gap-4 mb-8 sm:mb-10 px-0.5 sm:px-1 w-full">
                  {/* 2nd Place */}
                  {top3[1] && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="flex flex-col items-center flex-1 min-w-0 max-w-[95px] xs:max-w-[110px] sm:max-w-[130px]"
                    >
                      <div className="relative mb-2 sm:mb-3">
                        <img
                          src={top3[1].profilePic || defaultAvatar}
                          alt={top3[1].name}
                          className="w-13 h-13 xs:w-15 xs:h-15 sm:w-20 sm:h-20 rounded-full object-cover border-2 sm:border-4 border-gray-400 shadow-lg"
                          onError={(e) => (e.target.src = defaultAvatar)}
                        />
                        <div className="absolute -bottom-1.5 sm:-bottom-2 left-1/2 -translate-x-1/2">
                          <RankBadge rank={2} />
                        </div>
                      </div>
                      <p className="text-white font-semibold text-[11px] sm:text-base text-center line-clamp-2 w-full px-0.5 mb-1 leading-tight h-7 sm:h-auto flex items-center justify-center">
                        {top3[1].name}
                      </p>
                      <div className="mt-2 sm:mt-3 w-full h-14 sm:h-20 bg-linear-to-t from-gray-600 to-gray-500 rounded-t-xl flex items-end justify-center pb-1.5 sm:pb-2">
                        <span className="text-white/90 font-bold text-sm sm:text-lg">2</span>
                      </div>
                    </motion.div>
                  )}

                  {/* 1st Place */}
                  {top3[0] && (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                      className="flex flex-col items-center flex-1 min-w-0 max-w-[110px] xs:max-w-[125px] sm:max-w-[150px] -mt-2 sm:-mt-4 z-10"
                    >
                      <div className="relative mb-2 sm:mb-3">
                        <div className="absolute -top-5 sm:-top-7 left-1/2 -translate-x-1/2 text-xl sm:text-3xl animate-bounce">
                          👑
                        </div>
                        <img
                          src={top3[0].profilePic || defaultAvatar}
                          alt={top3[0].name}
                          className="w-16 h-16 xs:w-18 xs:h-18 sm:w-24 sm:h-24 rounded-full object-cover border-2 sm:border-4 border-yellow-400 shadow-xl shadow-yellow-500/30"
                          onError={(e) => (e.target.src = defaultAvatar)}
                        />
                        <div className="absolute -bottom-1.5 sm:-bottom-2 left-1/2 -translate-x-1/2">
                          <RankBadge rank={1} />
                        </div>
                      </div>
                      <p className="text-white font-bold text-xs sm:text-lg text-center line-clamp-2 w-full px-0.5 mb-1 leading-tight h-7 sm:h-auto flex items-center justify-center">
                        {top3[0].name}
                      </p>
                      <div className="mt-2 sm:mt-3 w-full h-20 sm:h-28 bg-linear-to-t from-amber-600 to-yellow-400 rounded-t-xl flex items-end justify-center pb-1.5 sm:pb-2 shadow-lg shadow-yellow-500/20">
                        <span className="text-black/90 font-bold text-base sm:text-xl">1</span>
                      </div>
                    </motion.div>
                  )}

                  {/* 3rd Place */}
                  {top3[2] && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="flex flex-col items-center flex-1 min-w-0 max-w-[95px] xs:max-w-[110px] sm:max-w-[130px]"
                    >
                      <div className="relative mb-2 sm:mb-3">
                        <img
                          src={top3[2].profilePic || defaultAvatar}
                          alt={top3[2].name}
                          className="w-13 h-13 xs:w-15 xs:h-15 sm:w-20 sm:h-20 rounded-full object-cover border-2 sm:border-4 border-amber-700 shadow-lg"
                          onError={(e) => (e.target.src = defaultAvatar)}
                        />
                        <div className="absolute -bottom-1.5 sm:-bottom-2 left-1/2 -translate-x-1/2">
                          <RankBadge rank={3} />
                        </div>
                      </div>
                      <p className="text-white font-semibold text-[11px] sm:text-base text-center line-clamp-2 w-full px-0.5 mb-1 leading-tight h-7 sm:h-auto flex items-center justify-center">
                        {top3[2].name}
                      </p>
                      <div className="mt-2 sm:mt-3 w-full h-10 sm:h-16 bg-gradient-to-t from-orange-900 to-amber-700 rounded-t-xl flex items-end justify-center pb-1.5 sm:pb-2">
                        <span className="text-white/90 font-bold text-sm sm:text-lg">3</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Rest of the list (4-10) */}
              {rest.length > 0 && (
                <div className="space-y-2 sm:space-y-2.5">
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <div className="h-px flex-1 bg-slate-700"></div>
                    <span className="text-xs text-slate-500 font-medium">باقي الأوائل</span>
                    <div className="h-px flex-1 bg-slate-700"></div>
                  </div>

                  <AnimatePresence>
                    {rest.map((student, idx) => {
                      const rank = idx + 4;
                      return (
                        <motion.div
                          key={student.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 * idx }}
                          className="flex items-center gap-2.5 sm:gap-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-2xl p-2.5 sm:px-4 sm:py-3 transition-colors"
                        >
                          <RankBadge rank={rank} />
                          <img
                            src={student.profilePic || defaultAvatar}
                            alt={student.name}
                            className="w-9 h-9 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-slate-600 shrink-0"
                            onError={(e) => (e.target.src = defaultAvatar)}
                          />
                          <span className="flex-1 min-w-0 font-medium text-slate-100 truncate text-xs sm:text-base">
                            {student.name}
                          </span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer for the image */}
        <div className="bg-slate-950/50 px-5 py-3 text-center border-t border-slate-800">
          <p className="text-xs text-slate-500">أوائل التاسك • {selectedGroup}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(StRankingTask);