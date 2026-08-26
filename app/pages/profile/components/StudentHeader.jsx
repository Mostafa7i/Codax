import React, { Suspense, lazy } from "react";
import { CreditCard } from "lucide-react";

const UploadProfilePic = lazy(() =>
  import("./UploadProfilePic").then((mod) => ({ default: mod.default || mod })).catch(() => ({ default: () => null }))
);
const StudentBio = lazy(() =>
  import("./StudentBio").then((mod) => ({ default: mod.default || mod })).catch(() => ({ default: () => null }))
);
const StudentGift = lazy(() =>
  import("./StudentGift").then((mod) => ({ default: mod.default || mod })).catch(() => ({ default: () => null }))
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
}) {
  return (
    <div className="mb-6">
      {/* Profile Picture Upload */}
      <div className="flex flex-col items-center mb-6 relative">
        <Suspense fallback={<LoadingSpinner />}>
          <UploadProfilePic
            studentId={studentData?.id}
            currentProfilePic={profilePic}
            onUploadSuccess={onUploadSuccess}
          />
        </Suspense>
      </div>

      {/* Main Student Info Container */}
      <div
        className={`${
          isPerfectStudent ? "bg-yellow-500" : ""
        } mb-3 bg-transparent p-2 md:p-4 w-full max-w-4xl mx-auto rounded-xl shadow-lg ${
          state.attendancePercentage >= 100 && state.average >= 99
            ? "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-300 dark:border-yellow-700"
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
