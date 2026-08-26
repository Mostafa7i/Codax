"use client";
import React, { useState } from "react";
import {
  Wrench,
  Sparkles,
  RotateCw,
  Send,
  ShieldCheck,
  Clock,
} from "lucide-react";

export default function MaintenancePage({
  message,
  estimatedTime,
  onCheckStatus,
}) {
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    setChecking(true);
    if (onCheckStatus) {
      await onCheckStatus();
    } else {
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 via-gray-950 to-black p-4 text-white relative overflow-hidden">
      {/* Glowing Ambient Light Orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-lg bg-gray-900/85 backdrop-blur-2xl border border-gray-800 rounded-3xl p-7 sm:p-9 shadow-2xl text-center space-y-7">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/20 shadow-md">
            <img src="/favicon.png" alt="CodaX" className="w-full h-full object-cover" />
          </div>
          <span className="font-black text-xl tracking-wider bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            CodaX Platform
          </span>
        </div>

        {/* Maintenance Icon */}
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 rounded-3xl bg-amber-500/20 blur-xl animate-pulse" />
          <div className="relative w-full h-full rounded-3xl bg-linear-to-br from-amber-500/20 to-orange-950/40 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl">
            <Wrench size={42} className="animate-spin-slow" />
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black">
            <Sparkles size={13} />
            <span>نعمل على تحسينات جديدة</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white">
            الموقع قيد الصيانة والتطوير
          </h1>

          <p className="text-sm text-gray-300 leading-relaxed max-w-md mx-auto">
            {message ||
              "نقوم حالياً بإجراء بعض التحديثات والتحسينات الدورية لنمنحكم أفضل تجربة تعليمية برمجية. سنعود للعمل قريباً جداً!"}
          </p>
        </div>

        {/* Estimated Time (if provided) */}
        {estimatedTime && (
          <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold">
            <Clock size={16} />
            <span>الوقت المتوقع للعودة: {estimatedTime}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleCheck}
            disabled={checking}
            className="w-full py-3.5 px-6 rounded-2xl font-black text-sm bg-linear-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-xl shadow-amber-500/20 transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <RotateCw size={17} className={checking ? "animate-spin" : ""} />
            <span>{checking ? "جارٍ التحقق من الحالة..." : "فحص حالة الموقع الآن"}</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <a
              href="https://t.me/codax_academy"
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-4 rounded-xl text-xs font-bold bg-gray-800 hover:bg-gray-750 text-gray-200 border border-gray-700 transition-all flex items-center justify-center gap-2"
            >
              <Send size={14} className="text-sky-400" />
              <span>قناة التليجرام</span>
            </a>

            <a
              href="/auth/Login"
              className="py-2.5 px-4 rounded-xl text-xs font-bold bg-gray-800 hover:bg-gray-750 text-gray-200 border border-gray-700 transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>دخول الإدارة</span>
            </a>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-[11px] text-gray-500">
          شكراً لتفهمكم وصبركم • فريق CodaX البرمجي
        </p>
      </div>
    </div>
  );
}
