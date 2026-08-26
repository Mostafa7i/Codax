import React, { Suspense, lazy } from "react";
import { motion } from "framer-motion";

const GiftStu = lazy(() =>
  import("../components/GiftStu").then((mod) => ({ default: mod.default || mod })).catch(() => ({ default: () => null }))
);

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
  </div>
);

export default function GiftTab({ studentId, studentGroup }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="space-y-6">
        {studentId && studentGroup && (
          <Suspense fallback={<LoadingSpinner />}>
            <GiftStu studentId={studentId} studentGroup={studentGroup} />
          </Suspense>
        )}
      </div>
    </motion.div>
  );
}
