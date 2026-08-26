import React, { Suspense, lazy } from "react";
import { motion } from "framer-motion";

const StudentPanel = lazy(() =>
  import("../components/Exam/StudentPanel").then((mod) => ({ default: mod.default || mod })).catch(() => ({ default: () => null }))
);

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
  </div>
);

export default function ExamTab() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="space-y-6">
        <Suspense fallback={<LoadingSpinner />}>
          <StudentPanel />
        </Suspense>
      </div>
    </motion.div>
  );
}
