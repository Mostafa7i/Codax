"use client";
import React from "react";

export default function TabNav({
  tabs = [],
  activeTab,
  onTabChange,
  hasActiveExam,
  hasNewQuestion,
  hasStartedQuiz,
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-6 justify-center">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const isExamTab = tab.id === "Exam";
        const isGlowing = isExamTab && hasActiveExam;

        return (
          <div key={tab.id} className="relative">
            <button
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                isGlowing
                  ? "bg-linear-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-600 hover:to-rose-600 text-white font-extrabold shadow-[0_0_25px_rgba(244,63,94,0.95)] border-2 border-amber-300 animate-pulse scale-105"
                  : isActive
                    ? "bg-linear-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 shadow-sm"
              }`}
            >
              {Icon && (
                <Icon
                  size={18}
                  className={isGlowing ? "animate-bounce text-amber-200" : ""}
                />
              )}
              <span>{tab.label}</span>
            </button>

            {/* Glowing badge for active published exam */}
            {isExamTab && hasActiveExam && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 z-20 pointer-events-none">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-90" />
                <span className="relative inline-flex rounded-full h-5 w-5 bg-rose-600 text-[10px] font-black text-white items-center justify-center shadow-lg border border-amber-300">
                  📝
                </span>
              </span>
            )}

            {/* Red ping dot for quiz */}
            {tab.id === "quiz" && hasNewQuestion && !hasStartedQuiz && (
              <span className="absolute top-1 left-1 block w-3 h-3 bg-red-500 rounded-full">
                <span className="animate-ping block rounded-full w-3 h-3 bg-red-700" />
              </span>
            )}

            {/* Special badge for Store */}
            {tab.id === "store" && (
              <span className="absolute -top-2 -left-1 flex items-center justify-center bg-linear-to-r from-amber-500 to-yellow-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-md animate-pulse pointer-events-none">
                جديد 🔥
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
