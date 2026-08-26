import React from "react";
import { motion } from "framer-motion";
import { CreditCard, SmilePlus } from "lucide-react";
import Likes from "../components/Likes";

export default function ReactionsTab({
  studentData,
  isPerfectStudent,
  onViewReactions,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="space-y-5 max-w-4xl mx-auto">
        {/* ── View Reactions Button ── */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() =>
            onViewReactions(
              studentData?.id,
              studentData?.name,
              isPerfectStudent
            )
          }
          className="relative w-full overflow-hidden rounded-2xl shadow-xl"
          style={{
            background: isPerfectStudent
              ? "linear-gradient(135deg, #b8860b, #ffd700, #b8860b)"
              : "linear-gradient(135deg, #4f46e5, #7c3aed, #db2777)",
          }}
        >
          {/* Shimmer overlay */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background:
                "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%)",
              animation: "shimmer 2.5s infinite",
            }}
          />
          <div className="relative flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                {isPerfectStudent ? "👑" : "🔍"}
              </div>
              <div className="text-right">
                <p className="text-white font-black text-lg leading-tight">
                  اعرف مين تفاعل معك
                </p>
                <p className="text-white/70 text-sm mt-0.5">
                  {isPerfectStudent
                    ? "🎉 طالب مثالي — خصم 50% على النقاط"
                    : "سيتم خصم 10 نقاط من رصيدك"}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              {isPerfectStudent && (
                <CreditCard className="text-yellow-200" size={20} />
              )}
              <SmilePlus className="text-white/80" size={28} />
            </div>
          </div>
        </motion.button>

        {/* ── Likes System ── */}
        <div
          className="rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background:
              "linear-gradient(160deg, #1e1b4b 0%, #312e81 40%, #4c1d95 70%, #831843 100%)",
          }}
        >
            <Likes studentIdV={studentData?.id} />
        </div>
      </div>
    </motion.div>
  );
}
