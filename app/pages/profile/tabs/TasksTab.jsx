"use client";
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  ClipboardList,
  Target,
  GraduationCap,
  Layers,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { TotalScoreCircle } from "@/app/pages/(partsMainPage)/CircularProgress";
import TaskItem from "../components/TaskItem";

export default function TasksTab({
  studentData,
  studentId,
  studentDocId,
  showGithubButton,
  showStatusText,
  toggleGithubButton,
  expandedTask,
  setExpandedTask,
  onTabChange,
  hasActiveExam,
}) {
  const [filterType, setFilterType] = useState("tasks"); // "tasks" | "exams" | "all"

  const allTasks = useMemo(
    () => (Array.isArray(studentData?.tasks) ? studentData.tasks : []),
    [studentData?.tasks],
  );

  const isExamTask = (task) => {
    const title = (task?.name || task?.title || task?.taskName || "").trim();
    return Boolean(
      task?.isExam ||
        task?.type === "exam" ||
        /^(اختبار|كويز|امتحان|exam|quiz)/i.test(title),
    );
  };

  const regularTasks = useMemo(
    () => allTasks.filter((t) => !isExamTask(t)),
    [allTasks],
  );

  const examTasks = useMemo(
    () => allTasks.filter((t) => isExamTask(t)),
    [allTasks],
  );

  const displayTasks = useMemo(() => {
    if (filterType === "tasks") return regularTasks;
    if (filterType === "exams") return examTasks;
    return allTasks;
  }, [filterType, regularTasks, examTasks, allTasks]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      dir="rtl"
    >
      <div className="space-y-6 sm:w-5/6 lg:w-4/6 mx-auto">
        {/* رأس الصفحة */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            إدارة المهام والاختبارات
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            يمكنك تسليم كل مهمة عن طريق رفع ملف مضغوط (.zip, .rar) أو إرفاق رابط
            المشروع، ومتابعة التقييمات واستعراض نتائج الاختبارات.
          </p>
        </div>

        {/* زر إظهار GitHub للعامة */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-4 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <BookOpen size={18} className="text-indigo-500" />
              إظهار رابط GitHub الخاص بي للجميع
            </h3>
            <div className="flex items-center gap-3">
              {showStatusText && (
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {showGithubButton ? "مرئي للجميع" : "مخفي"}
                </span>
              )}
              <button
                type="button"
                onClick={toggleGithubButton}
                className={`relative inline-flex justify-center h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                  showGithubButton
                    ? "bg-emerald-500 shadow-md shadow-emerald-500/20"
                    : "bg-gray-300 dark:bg-gray-700"
                }`}
              >
                <span
                  className={`absolute right-1 top-1 h-4 w-4 rounded-full bg-white transition-transform duration-300 ${
                    showGithubButton ? "-translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* أزرار التبديل بين المهام والاختبارات */}
        <div className="flex items-center justify-center p-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-2xl border border-gray-200/80 dark:border-gray-700/60 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setFilterType("tasks")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              filterType === "tasks"
                ? "bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm shadow-indigo-500/10 border border-gray-100 dark:border-gray-700"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <ClipboardList size={16} />
            <span>المهام التدريبية</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                filterType === "tasks"
                  ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              }`}
            >
              {regularTasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType("exams")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              filterType === "exams"
                ? "bg-white dark:bg-gray-900 text-purple-600 dark:text-purple-400 shadow-sm shadow-purple-500/10 border border-gray-100 dark:border-gray-700"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <GraduationCap size={17} />
            <span>الاختبارات</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                filterType === "exams"
                  ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              }`}
            >
              {examTasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              filterType === "all"
                ? "bg-white dark:bg-gray-900 text-slate-800 dark:text-white shadow-sm border border-gray-100 dark:border-gray-700"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <Layers size={15} />
            <span>الكل</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                filterType === "all"
                  ? "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              }`}
            >
              {allTasks.length}
            </span>
          </button>
        </div>

        {/* بانر عند وجود اختبار نشط */}
        {hasActiveExam && onTabChange && (
          <div className="bg-linear-to-r from-amber-500/15 via-rose-500/10 to-purple-500/15 border border-amber-300 dark:border-amber-700/60 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-sm animate-pulse">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
                <Sparkles size={18} />
              </span>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                  يوجد اختبار متاح ومفتوح لك الآن!
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                  يمكنك الدخول وأداء الاختبار مباشرة قبل انتهاء الوقت المخصص.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onTabChange("Exam")}
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-linear-to-r from-amber-500 to-rose-500 text-white rounded-xl text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition"
            >
              <span>دخول الاختبار</span>
              <ArrowLeft size={14} />
            </button>
          </div>
        )}

        {/* حاوية القائمة الرئيسية */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-4 md:p-5 border border-gray-100 dark:border-gray-800">
          <div className="pb-4 mb-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center font-semibold">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              {filterType === "exams" ? (
                <GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              ) : (
                <ClipboardList className="w-5 h-5" />
              )}
              <span className="text-sm font-bold">
                {filterType === "tasks"
                  ? `${regularTasks.length} مهمة تدريبية مسجلة`
                  : filterType === "exams"
                    ? `${examTasks.length} اختبار مسجل`
                    : `${allTasks.length} عنصر مسجل (مهام واختبارات)`}
              </span>
            </div>

            <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
              <span className="text-xs text-gray-700 dark:text-gray-300 font-bold">
                {filterType === "exams"
                  ? "إجمالي تقييم الاختبارات:"
                  : filterType === "tasks"
                    ? "إجمالي تقييم المهام:"
                    : "إجمالي التقييم:"}
              </span>
              <TotalScoreCircle
                tasks={
                  filterType === "exams"
                    ? examTasks
                    : filterType === "tasks"
                      ? regularTasks
                      : allTasks
                }
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {displayTasks.length > 0 ? (
              <ul className="space-y-3.5 max-h-[550px] overflow-y-auto pl-1 pr-1 custom-scrollbar">
                {displayTasks
                  .map((task, index) => ({ task, originalIndex: index }))
                  .reverse()
                  .map(({ task, originalIndex: index }) => {
                    const taskUniqueKey =
                      task.id !== undefined && task.id !== null
                        ? `id-${task.id}-${index}`
                        : `idx-${index}`;
                    return (
                      <li key={`task-${taskUniqueKey}`}>
                        <TaskItem
                          studentId={studentId}
                          studentDocId={studentDocId}
                          task={task}
                          isExpanded={expandedTask === taskUniqueKey}
                          onToggle={() =>
                            setExpandedTask(
                              expandedTask === taskUniqueKey
                                ? null
                                : taskUniqueKey,
                            )
                          }
                        />
                      </li>
                    );
                  })}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
                {filterType === "exams" ? (
                  <>
                    <GraduationCap className="w-14 h-14 mb-3 opacity-40 text-purple-500" />
                    <p className="font-bold text-sm">
                      لا توجد اختبارات مسجلة حالياً
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      ستظهر هنا أي اختبارات بعد تعيينها أو إنهائها
                    </p>
                    {onTabChange && (
                      <button
                        type="button"
                        onClick={() => onTabChange("Exam")}
                        className="mt-4 px-4 py-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl text-xs font-bold border border-purple-200 dark:border-purple-800/50 hover:bg-purple-100 transition"
                      >
                        الانتقال إلى تبويب الاختبارات
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <ClipboardList className="w-14 h-14 mb-3 opacity-40" />
                    <p className="font-bold text-sm">
                      لا توجد مهام مسجلة حالياً لهذا الطالب
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      سيتم إدراج المهام تلقائياً فور إضافتها من لوحة الإدارة
                    </p>
                  </>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* سجل الروابط السابقة */}
        {studentData?.linksHistory && studentData.linksHistory.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/50 flex justify-between items-center">
              <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Target size={16} className="text-blue-500" />
                سجل الروابط والتسليمات السابقة
              </h3>
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {studentData.linksHistory.length}
              </span>
            </div>
            <div className="p-4">
              <ul className="space-y-2.5 max-h-60 overflow-y-auto pl-1 pr-1 custom-scrollbar">
                {[...studentData.linksHistory]
                  .sort(
                    (a, b) =>
                      (b.uploadedAt?.seconds ||
                        (b.uploadedAt
                          ? new Date(b.uploadedAt).getTime() / 1000
                          : 0)) -
                      (a.uploadedAt?.seconds ||
                        (a.uploadedAt
                          ? new Date(a.uploadedAt).getTime() / 1000
                          : 0)),
                  )
                  .map((link, idx) => (
                    <li
                      key={idx}
                      className="bg-gray-50 dark:bg-gray-800/80 rounded-xl p-3 border border-gray-100 dark:border-gray-700 flex flex-col gap-1.5"
                    >
                      <h4 className="font-bold text-xs text-gray-800 dark:text-gray-200">
                        {link.title || "تسليم رابط"}
                      </h4>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 text-xs font-mono break-all hover:underline"
                        dir="ltr"
                      >
                        {link.url}
                      </a>
                      {link.uploadedAt && (
                        <span className="text-[10px] text-gray-400">
                          {new Date(
                            link.uploadedAt.seconds
                              ? link.uploadedAt.seconds * 1000
                              : link.uploadedAt,
                          ).toLocaleString("ar-EG")}
                        </span>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}