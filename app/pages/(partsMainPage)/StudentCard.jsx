'use client';

import React, { useMemo, memo } from "react";
import { motion } from "framer-motion";
import StudentCardContent from "./StudentCardContent";

const StudentCard = memo(function StudentCard({
  student,
  allStudents,
  openPasswordModal,
  openImageModal,
  getBorderColor,
  totalLecturesForGroup,
}) {
  const cardConfig = useMemo(() => {
    const isPerfectStudent =
      student.combinedScore >= 99 &&
      student.attendancePercentage >= 100 &&
      totalLecturesForGroup >= 10;

    const isTopPerformer = student.rank <= 3;
    const isHighAchiever = student.combinedScore >= 85;

    return {
      isPerfectStudent,
      isTopPerformer,
      isHighAchiever,
      isFirst: student.rank === 1,
    };
  }, [
    student.combinedScore,
    student.attendancePercentage,
    student.rank,
    totalLecturesForGroup,
  ]);

  const cardClasses = useMemo(() => {
    const base =
      "relative rounded-2xl overflow-hidden backdrop-blur-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl";

    const border = getBorderColor(student);

    let bg = "bg-slate-900/70 border-slate-700/40";
    if (cardConfig.isPerfectStudent) {
      bg =
        "bg-gradient-to-br from-amber-900/25 via-slate-900/80 to-indigo-900/20";
    } else if (cardConfig.isFirst) {
      bg =
        "bg-gradient-to-br from-yellow-900/20 via-slate-900/80 to-slate-900/90";
    }

    return `${base} ${border} ${bg}`;
  }, [getBorderColor, student, cardConfig]);

  // stagger خفيف حسب الترتيب (حد أقصى 0.35s)
  const delay = Math.min((student.rank || 1) * 0.035, 0.35);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className={cardClasses}
    >
      {/* توهج خفيف للمركز الأول فقط */}
      {cardConfig.isFirst && (
        <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-20 bg-yellow-400/15 blur-3xl rounded-full" />
      )}

      {/* خط ذهبي علوي للـ Top 3 */}
      {cardConfig.isTopPerformer && (
        <div
          className={`absolute top-0 inset-x-0 h-0.5 ${
            student.rank === 1
              ? "bg-linear-to-l from-transparent via-yellow-400 to-transparent"
              : student.rank === 2
              ? "bg-linear-to-l from-transparent via-slate-300 to-transparent"
              : "bg-linear-to-l from-transparent via-amber-600 to-transparent"
          }`}
        />
      )}

      {/* شارة طالب مثالي */}
      {cardConfig.isPerfectStudent && (
        <div className="absolute top-2 right-2 z-20 text-[9px] font-black tracking-wide text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
          مثالي
        </div>
      )}

      <div className="p-3 text-slate-200 relative z-10">
        <StudentCardContent
          student={student}
          allStudents={allStudents}
          openPasswordModal={openPasswordModal}
          openImageModal={openImageModal}
          totalLecturesForGroup={totalLecturesForGroup}
          cardConfig={cardConfig}
        />
      </div>
    </motion.div>
  );
});

StudentCard.displayName = "StudentCard";

export default StudentCard;