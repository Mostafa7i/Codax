import { Suspense } from "react";
import StudentDetails from "@/app/pages/profile/StudentDetails";

export default function StudentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500" />
        </div>
      }
    >
      <StudentDetails />
    </Suspense>
  );
}
