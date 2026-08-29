import React, { Suspense, lazy } from "react";
import { CreditCard } from "lucide-react";

const UploadProfilePic = lazy(() =>
  import("./UploadProfilePic")
    .then((mod) => ({ default: mod.default || mod }))
    .catch(() => ({ default: () => null })),
);
const StudentBio = lazy(() =>
  import("./StudentBio")
    .then((mod) => ({ default: mod.default || mod }))
    .catch(() => ({ default: () => null })),
);
const StudentGift = lazy(() =>
  import("./StudentGift")
    .then((mod) => ({ default: mod.default || mod }))
    .catch(() => ({ default: () => null })),
);

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
  </div>
);

export default function StudentHeader({
  studentData,
  studentDocId,
  profilePic,
  isPerfectStudent,
  state,
  onUploadSuccess,
  onOpenLuckyWheel,
  onOpenStore,
}) {
  return (
    <div className="mb-6">
      {/* Profile Picture Upload & Quick Action Badges */}
      <div className="flex flex-col items-center mb-6 relative">
        <Suspense fallback={<LoadingSpinner />}>
          <UploadProfilePic
            studentId={studentData?.id}
            currentProfilePic={profilePic}
            activeBorder={studentData?.activeBorder}
            onUploadSuccess={onUploadSuccess}
          />
        </Suspense>

        {/* Quick Action Buttons for Lucky Wheel and Store */}
        <div className="flex items-center justify-center gap-2.5 mt-3 flex-wrap">
          {onOpenLuckyWheel && (
            <button
              type="button"
              onClick={onOpenLuckyWheel}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-linear-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black text-xs shadow-md hover:shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all"
            >
              <span>🎡</span>
              <span>عجلة الحظ اليومية</span>
            </button>
          )}

          {onOpenStore && (
            <button
              type="button"
              onClick={onOpenStore}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 hover:border-amber-400/60 font-bold text-xs shadow-sm hover:scale-105 active:scale-95 transition-all"
            >
              <span>🛍️</span>
              <span>متجر التخصيص</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Student Info Container */}
      <div
        className={`${
          isPerfectStudent ? "bg-yellow-500" : ""
        } mb-3 bg-transparent p-2 md:p-4 w-full max-w-4xl mx-auto rounded-xl shadow-lg ${
          state.attendancePercentage >= 100 && state.average >= 99
            ? "bg-linear-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-300 dark:border-yellow-700"
            : ""
        } ${
          state.combinedScore < 60
            ? "border-red-500 dark:border-red-700 border-blink"
            : ""
        }`}
      >
        {studentDocId && (
          <Suspense fallback={null}>
            <StudentGift studentDocId={studentDocId} />
          </Suspense>
        )}

        {/* Student Bio */}
        <div className="col-start-1 col-span-2">
          <div>
            <Suspense
              fallback={
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-2" />
              }
            >
              <StudentBio studentId={studentData?.id} />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Perfect Student Golden Card Banner */}
      {isPerfectStudent && (
        <div className="flex justify-center my-3 gap-1 text-yellow-500 animate-pulse">
          <CreditCard />
          <details>
            <summary>الكارد الذهبي</summary>
            <summary>خصم 50% علي رؤية من تفاعل معك</summary>
          </details>
        </div>
      )}
    </div>
  );
}
