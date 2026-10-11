"use client";
import React from "react";
import { Clock, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";

// --- المكون الرئيسي ---
export const ReserveAttendance = ({
  reserveCount = 0,
  absences = 0,
  onUseReserve,
  isLoading = false,
  reserveUsageCount = 0,
}) => {
  const canUseReserve = reserveCount > 0 && absences > 0;

  return (
    <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-3xl space-y-4 text-right dir-rtl">
      {/* 1. الهيدر الرئيسي */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-sky-500/15 border border-sky-500/30 rounded-2xl flex items-center justify-center text-sky-400 shrink-0">
          <Clock size={20} />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-100">
            الحضور الاحتياطي
          </h3>
          <p className="text-xs text-slate-400">
            استخدم رصيدك المكتسب لتعويض أيام الغياب تلقائياً.
          </p>
        </div>
      </div>

      {/* 2. عرض الإحصائيات */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-slate-800/60 border border-slate-700/50 p-3 rounded-2xl">
          <p className="text-xs text-slate-400 font-medium">رصيدك الحالي</p>
          <p
            className={`text-2xl font-black mt-0.5 ${
              reserveCount > 0 ? "text-emerald-400" : "text-slate-500"
            }`}
          >
            {reserveCount}{" "}
            <span className="text-xs font-normal text-slate-400">حضور</span>
          </p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 p-3 rounded-2xl">
          <p className="text-xs text-slate-400 font-medium">مرات الاستخدام</p>
          <p className="text-2xl font-black text-slate-200 mt-0.5">
            {reserveUsageCount}
          </p>
        </div>
      </div>

      {/* 3. زر الإجراء */}
      <div className="pt-1">
        <button
          type="button"
          onClick={onUseReserve}
          disabled={!canUseReserve || isLoading}
          className={`
            w-full py-3 px-4 rounded-2xl text-slate-100 text-xs sm:text-sm font-bold transition-all duration-300
            flex items-center justify-center gap-2 shadow-lg cursor-pointer
            ${
              canUseReserve
                ? "bg-linear-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 hover:scale-101 active:scale-98 shadow-sky-500/25"
                : "bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-70"
            }
          `}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>جاري المعالجة...</span>
            </>
          ) : (
            <>
              <ShieldCheck size={16} />
              <span>استخدام 1 رصيد لتعويض غياب</span>
            </>
          )}
        </button>
      </div>

      {/* 4. رسالة توضيحية في حالة عدم إمكانية الاستخدام */}
      {!canUseReserve && (
        <div className="flex items-center gap-2 text-xs p-3 rounded-2xl bg-amber-950/20 border border-amber-800/30 text-amber-300">
          <AlertTriangle size={18} className="shrink-0" />
          <p className="text-[11px] leading-relaxed">
            {reserveCount === 0
              ? "لا يوجد لديك رصيد من الحضور الاحتياطي حالياً."
              : "لا يوجد لديك أيام غياب لتعويضها، سجلك منتظم!"}
          </p>
        </div>
      )}
    </div>
  );
};

// --- المكون المساعد ---
export const StatCard = ({ label, value, colorClass }) => (
  <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/40">
    <div className="flex justify-between items-center text-xs">
      <span className="text-slate-400">{label}</span>
      <span className={`font-bold ${colorClass}`}>{value}</span>
    </div>
  </div>
);

export default ReserveAttendance;
