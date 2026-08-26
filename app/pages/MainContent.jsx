'use client';

import React, { useState, useCallback, useEffect, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  MessageSquareWarning,
  Search,
  ChevronDown,
  AlertCircle,
  Users,
  BookOpen,
  X,
} from "lucide-react";
import { useGroupContext } from "@/app/context/GroupContextProvider";
import { useStudentAuth } from "@/app/context/StudentAuthContext";
import {
  useMainContentData,
  fetchStudentPassword,
} from "@/app/hooks/allHooks";

import StudentCard from "./(partsMainPage)/StudentCard";
import PasswordModal from "./(partsMainPage)/PasswordModal";
import ImageModal from "./(partsMainPage)/ImageModal";
import TopStats from "./pageContent/TopStats";

// ═══════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════
const SORT_OPTIONS = {
  combined: "الترتيب العام",
  task: "متوسط الدرجات",
  attendance: "نسبة الحضور",
  extraPoints: "النقاط الإضافية",
};

const getBorderColor = (student) => {
  const colors = {
    1: "border-2 border-yellow-400 shadow-lg shadow-yellow-500/25",
    2: "border-2 border-slate-300 shadow-lg shadow-slate-400/20",
    3: "border-2 border-amber-700 shadow-lg shadow-amber-700/25",
  };
  return colors[student?.rank] || "border border-slate-700/50";
};

// ═══════════════════════════════════════════
// Sub-components (memoized)
// ═══════════════════════════════════════════
const LoadingState = memo(function LoadingState() {
  return (
    <div className="space-y-6 p-2 max-w-6xl mx-auto" dir="rtl">
      <div className="flex justify-center items-center gap-3 py-8">
        <div className="relative w-9 h-9">
          <div className="absolute inset-0 rounded-full border-[3px] border-indigo-500/15" />
          <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-indigo-400 animate-spin" />
        </div>
        <span className="text-slate-400 font-semibold text-sm">
          جاري جلب وترتيب بيانات الطلاب...
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-56 bg-slate-800/40 border border-slate-700/40 rounded-3xl animate-pulse"
          />
        ))}
      </div>
    </div>
  );
});

const ErrorDisplay = memo(function ErrorDisplay({ selectedGroup, onRetry }) {
  return (
    <div className="text-center my-10 p-8 bg-red-500/10 border border-red-500/25 rounded-3xl max-w-md mx-auto" dir="rtl">
      <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
      <p className="text-red-400 font-bold mb-4 text-sm">
        حدث خطأ أثناء تحميل بيانات مجموعة {selectedGroup}
      </p>
      <button
        onClick={onRetry}
        className="px-6 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-lg shadow-red-600/20 active:scale-95"
      >
        إعادة المحاولة
      </button>
    </div>
  );
});

const EmptyState = memo(function EmptyState({ searchQuery, selectedGroup }) {
  return (
    <div className="text-center my-14 p-10 bg-slate-900/50 border border-slate-700/40 rounded-3xl max-w-lg mx-auto" dir="rtl">
      <div className="text-5xl mb-4 opacity-60">🔍</div>
      <h3 className="text-lg font-bold text-white mb-2">
        {searchQuery
          ? "لا توجد نتائج مطابقة لبحثك"
          : `لا يوجد طلاب في مجموعة ${selectedGroup}`}
      </h3>
      <p className="text-slate-500 text-xs leading-relaxed">
        {searchQuery
          ? "جرّب اسمًا آخر أو تأكد من صحة الحروف."
          : "سيتم ظهور الطلاب بمجرد تسجيل بياناتهم."}
      </p>
    </div>
  );
});

// ── Group Details Modal ──
const GroupDetailsModal = memo(function GroupDetailsModal({
  selectedGroup,
  status,
  totalLectures,
  studentsCount,
  onClose,
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-sm bg-slate-900 border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden"
        dir="rtl"
      >
        <div className="relative p-5 border-b border-slate-800 bg-linear-to-l from-indigo-500/15 to-purple-500/10">
          <button
            onClick={onClose}
            className="absolute top-3 left-3 w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
          <h2 className="font-black text-center text-xl text-white">
            مجموعة {selectedGroup}
          </h2>
        </div>

        <div className="p-5 space-y-3">
          {/* Status */}
          <div className="text-center py-2">
            <p className="text-slate-500 text-xs mb-2">حالة المجموعة</p>
            {status ? (
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                نشطة ومستمرة
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                منتهية
              </span>
            )}
          </div>

          {typeof totalLectures === "number" && (
            <div className="flex items-center justify-between p-3.5 bg-slate-800/50 border border-slate-700/40 rounded-2xl">
              <span className="flex items-center gap-2 text-slate-400 text-sm">
                <BookOpen className="w-4 h-4" />
                إجمالي المحاضرات
              </span>
              <span className="text-indigo-400 font-black tabular-nums text-lg">
                {totalLectures}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between p-3.5 bg-slate-800/50 border border-slate-700/40 rounded-2xl">
            <span className="flex items-center gap-2 text-slate-400 text-sm">
              <Users className="w-4 h-4" />
              عدد الطلاب
            </span>
            <span className="text-indigo-400 font-black tabular-nums text-lg">
              {studentsCount}
            </span>
          </div>
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition active:scale-[0.98]"
          >
            إغلاق
          </button>
        </div>
      </motion.div>
    </div>
  );
});

// ═══════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════
export default function MainContent() {
  const router = useRouter();
  const { selectedGroup, groupStatuses } = useGroupContext();
  const { authenticateStudent, isStudentAuthorized, isAdmin } = useStudentAuth();

  const {
    students,
    rankedStudents,
    filteredStudents,
    totalLecturesForGroup,
    isDataLoading,
    isRefreshingData,
    hasError,
    searchQuery,
    setSearchQuery,
    sortMode,
    setSortMode,
    retryFetch,
  } = useMainContentData(selectedGroup, "combined");

  // UI state
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [enteredPassword, setEnteredPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [pwAttempts, setPwAttempts] = useState(0);
  const [pwLockedUntil, setPwLockedUntil] = useState(null);

  // Image modal
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  const sortRef = useRef(null);
  const status = groupStatuses ? groupStatuses[selectedGroup] : true;

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!showSortOptions) return;
    const handler = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setShowSortOptions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSortOptions]);

  // ── Password flow ──
  const openPasswordModal = useCallback(
    async (student) => {
      setSelectedStudent(student);
      setEnteredPassword("");
      setErrorMessage("");
      setShowPassword(false);
      setPwAttempts(0);
      setPwLockedUntil(null);

      if (isAdmin) {
        router.push(`/student?id=${student.id}`);
        return;
      }

      try {
        setIsLoadingPassword(true);
        const pass = await fetchStudentPassword(student.id);
        const authorized = await isStudentAuthorized(student.id, pass || "");
        if (authorized) {
          router.push(`/student?id=${student.id}`);
          return;
        }
      } catch (err) {
        console.error("Session check error:", err);
      } finally {
        setIsLoadingPassword(false);
      }

      setShowPasswordModal(true);
    },
    [isAdmin, router, isStudentAuthorized]
  );

  const closePasswordModal = useCallback(() => {
    setShowPasswordModal(false);
    setSelectedStudent(null);
    setErrorMessage("");
    setEnteredPassword("");
    setShowPassword(false);
    setRememberMe(false);
    setPwAttempts(0);
    setPwLockedUntil(null);
  }, []);

  const handlePasswordSubmit = useCallback(async () => {
    if (pwLockedUntil && Date.now() < pwLockedUntil) {
      const remaining = Math.ceil((pwLockedUntil - Date.now()) / 1000);
      setErrorMessage(`تم تجميد المحاولات. انتظر ${remaining} ثانية.`);
      return;
    }

    const trimmed = enteredPassword.trim();
    if (!trimmed) {
      setErrorMessage("يرجى إدخال كلمة المرور أولاً");
      return;
    }

    try {
      setIsLoadingPassword(true);
      setErrorMessage("");

      const freshPass = await fetchStudentPassword(selectedStudent.id);
      if (!freshPass) {
        setErrorMessage("لم يتم تعيين كلمة مرور لهذا الطالب. تواصل مع المدرب.");
        return;
      }

      if (trimmed === String(freshPass).trim()) {
        setPwAttempts(0);
        setPwLockedUntil(null);
        await authenticateStudent(selectedStudent.id, trimmed, rememberMe);
        closePasswordModal();
        router.push(`/student?id=${selectedStudent.id}`);
      } else {
        const next = pwAttempts + 1;
        setPwAttempts(next);
        if (next >= 5) {
          setPwLockedUntil(Date.now() + 60_000);
          setPwAttempts(0);
          setErrorMessage("تم تجميد المحاولات لمدة 60 ثانية.");
        } else {
          setErrorMessage(`كلمة المرور غير صحيحة! (${next}/5)`);
        }
      }
    } catch (err) {
      console.error("Password submit error:", err);
      setErrorMessage("حدث خطأ، يرجى المحاولة مرة أخرى");
    } finally {
      setIsLoadingPassword(false);
    }
  }, [
    enteredPassword,
    selectedStudent,
    rememberMe,
    router,
    closePasswordModal,
    authenticateStudent,
    pwAttempts,
    pwLockedUntil,
  ]);

  const openImageModal = useCallback((img) => {
    setSelectedImage(img);
    setIsImageModalOpen(true);
  }, []);

  const closeImageModal = useCallback(() => {
    setIsImageModalOpen(false);
    setSelectedImage("");
  }, []);

  // ── Early returns ──
  if (!selectedGroup) return null;
  if (isDataLoading && rankedStudents.length === 0) return <LoadingState />;
  if (hasError) {
    return <ErrorDisplay selectedGroup={selectedGroup} onRetry={retryFetch} />;
  }

  return (
    <div className="space-y-5 w-full mx-auto" dir="rtl">
      {/* ── Action buttons ── */}
      <div className="flex flex-wrap justify-center gap-2.5">
        <button
          onClick={() => setShowStatsModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 hover:bg-indigo-500/20 transition-all active:scale-95"
        >
          <BarChart3 className="w-4 h-4" />
          إحصائيات المجموعة
        </button>

        <button
          onClick={() => setOpenDetails(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:bg-slate-800 transition-all active:scale-95"
        >
          <MessageSquareWarning className="w-4 h-4" />
          تفاصيل المجموعة
        </button>
      </div>

      {/* ── Search + Sort ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 max-w-3xl mx-auto">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="ابحث عن طالب بالاسم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 bg-slate-900/70 border border-slate-700/50 text-slate-200 placeholder-slate-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 text-sm transition"
          />
        </div>

        <div className="relative" ref={sortRef}>
          <button
            onClick={() => setShowSortOptions((p) => !p)}
            className="w-full sm:w-auto flex items-center justify-between gap-2.5 px-4 py-2.5 bg-slate-900/70 border border-slate-700/50 text-slate-300 rounded-2xl hover:bg-slate-800/80 text-sm font-bold transition"
          >
            <span>فرز: {SORT_OPTIONS[sortMode]}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showSortOptions ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {showSortOptions && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.15 }}
                className="absolute z-30 mt-1.5 w-full sm:w-48 bg-slate-900 border border-slate-700/60 rounded-2xl shadow-xl overflow-hidden right-0"
              >
                {Object.entries(SORT_OPTIONS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSortMode(key);
                      setShowSortOptions(false);
                    }}
                    className={`w-full text-right px-4 py-2.5 text-xs font-bold transition-colors ${
                      sortMode === key
                        ? "bg-indigo-500/20 text-indigo-300"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Refresh indicator */}
      {isRefreshingData && (
        <div className="flex justify-center items-center gap-2 py-1">
          <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin" />
          <span className="text-[11px] text-slate-500">جاري التحديث...</span>
        </div>
      )}

      {/* ── Students grid ── */}
      {filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              allStudents={rankedStudents}
              openPasswordModal={openPasswordModal}
              openImageModal={openImageModal}
              getBorderColor={getBorderColor}
              totalLecturesForGroup={totalLecturesForGroup}
            />
          ))}
        </div>
      ) : (
        <EmptyState searchQuery={searchQuery} selectedGroup={selectedGroup} />
      )}

      {/* ── Modals ── */}
      <AnimatePresence>
        {openDetails && (
          <GroupDetailsModal
            selectedGroup={selectedGroup}
            status={status}
            totalLectures={totalLecturesForGroup}
            studentsCount={students.length}
            onClose={() => setOpenDetails(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showStatsModal && (
          <TopStats
            students={rankedStudents}
            totalLectures={totalLecturesForGroup}
            onClose={() => setShowStatsModal(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPasswordModal && (
          <PasswordModal
            showModal={showPasswordModal}
            closeModal={closePasswordModal}
            enteredPassword={enteredPassword}
            setEnteredPassword={setEnteredPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            handlePasswordSubmit={handlePasswordSubmit}
            isLoading={isLoadingPassword}
            errorMessage={errorMessage}
            rememberMe={rememberMe}
            setRememberMe={setRememberMe}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isImageModalOpen && (
          <ImageModal
            isImageModalOpen={isImageModalOpen}
            closeImageModal={closeImageModal}
            selectedImage={selectedImage}
          />
        )}
      </AnimatePresence>
    </div>
  );
}