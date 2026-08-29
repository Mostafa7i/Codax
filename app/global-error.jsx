"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("[CodaX Fatal Global Error]", error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-950/40 border border-rose-800/60 flex items-center justify-center mx-auto text-rose-500 shadow-lg shadow-rose-500/10">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-100">
              خطأ في تحميل التطبيق
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              حدث خطأ أثناء تشغيل النظام. يُرجى النقر على زر إعادة المحاولة أدناه.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full py-3.5 px-4 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>إعادة التحميل</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
