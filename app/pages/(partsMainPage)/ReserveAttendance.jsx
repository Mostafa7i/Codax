import React from 'react';
import { Clock, ShieldCheck, AlertTriangle, Loader } from "lucide-react";

// --- المكون الرئيسي ---
export const ReserveAttendance = ({
  reserveCount,
  absences,
  onUseReserve,
  isLoading,
  reserveUsageCount,
}) => {
  const canUseReserve = reserveCount > 0 && absences > 0;

  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl  border-gray-200 dark:border-gray-700 space-y-4">
      
      {/* 1. الهيدر الرئيسي */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
          <Clock size={24} className="text-blue-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">الحضور الاحتياطي</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            استخدم رصيدك لتعويض أيام الغياب.
          </p>
        </div>
      </div>

      {/* 2. عرض الإحصائيات */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-gray-100 dark:bg-gray-700/50 p-2 rounded-lg">
          <p className="text-sm  text-gray-600 dark:text-gray-300">رصيدك الحالي</p>
          <p className={`text-2xl font-bold ${reserveCount > 0 ? 'text-green-500' : 'text-gray-500'}`}>
            {reserveCount}
          </p>
        </div>
        <div className="bg-gray-100 dark:bg-gray-700/50 p-2 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-300">مرات الاستخدام</p>
          <p className="text-2xl font-bold text-gray-700 dark:text-white">
            {reserveUsageCount}
          </p>
        </div>
      </div>

      {/* 3. زر الإجراء */}
      <div className="pt-2">
        <button
          onClick={onUseReserve}
          disabled={!canUseReserve || isLoading}
          className={`
            w-full py-3 px-4 rounded-xl text-white text-sm font-semibold transition-all duration-300
            flex items-center justify-center gap-2
            transform hover:scale-105 active:scale-100
            shadow-lg hover:shadow-xl
            ${canUseReserve
              ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              : "bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-80"
            }
          `}
        >
          {isLoading ? (
            <>
              <Loader size={18} className="animate-spin" />
              <span>جاري المعالجة...</span>
            </>
          ) : (
            <>
              <ShieldCheck size={18} />
              <span>استخدام 1 حضور لتعويض غياب</span>
            </>
          )}
        </button>
      </div>

      {/* 4. رسالة توضيحية في حالة عدم إمكانية الاستخدام */}
      {!canUseReserve && (
        <div className="flex items-center gap-2 text-xs p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
          <AlertTriangle size={24} />
          {reserveCount === 0 
            ? "لا يوجد لديك رصيد من الحضور الاحتياطي."
            : "لا يوجد لديك أيام غياب لتعويضها."
          }
        </div>
      )}
    </div>
  );
};

// --- المكون المساعد (يبقى كما هو) ---
export const StatCard = ({
  label,
  value,
  colorClass,
}) => (
  <div className={`p-2 rounded drop-shadow`}>
    <div className="flex justify-between items-center">
      <span className="text-gray-700 dark:text-gray-300">{label}</span>
      <span className={`font-semibold ${colorClass}`}>{value}</span>
    </div>
  </div>
);
