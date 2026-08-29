"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("[CodaX Error Boundary]", error);
  }, [error]);

  return (
    <div
      dir="rtl"
      className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6"
    >
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center mx-auto text-rose-500 shadow-lg shadow-rose-500/10">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">
            حدث خطأ غير متوقع
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            نعتذر عن هذا الخطأ، تم تسجيل تفاصيل المشكلة لمعالجتها. يمكنك المحاولة مجدداً أو العودة للصفحة الرئيسية.
          </p>
        </div>

        {error?.message && (
          <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/80 text-left font-mono text-[11px] text-slate-400 truncate max-w-full overflow-hidden">
            {error.message}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 py-3 px-4 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>إعادة المحاولة</span>
          </button>

          <Link
            href="/"
            className="py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>الرئيسية</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
