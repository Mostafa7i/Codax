"use client";
import React, { useState, useEffect } from "react";
import { useInternetStatus } from "../context/InternetStatusContext";
import {
  WifiOff,
  RotateCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Home,
  RefreshCw,
} from "lucide-react";

// مؤشر جودة الشبكة
const SignalBars = ({ quality }) => {
  const getQualityData = () => {
    switch (quality) {
      case "good":
        return { color: "text-emerald-500", bg: "bg-emerald-500", bars: 4, label: "ممتاز" };
      case "moderate":
        return { color: "text-amber-500", bg: "bg-amber-500", bars: 2, label: "متوسط" };
      case "poor":
        return { color: "text-rose-500", bg: "bg-rose-500", bars: 1, label: "ضعيف" };
      default:
        return { color: "text-gray-400", bg: "bg-gray-400", bars: 0, label: "غير متصل" };
    }
  };

  const { color, bg, bars, label } = getQualityData();

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold">
      <span className={color}>{label}</span>
      <div className="flex items-end gap-1 h-3.5">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`w-1 rounded-full transition-all duration-300 ${
              bar <= bars ? bg : "bg-gray-300 dark:bg-gray-600"
            }`}
            style={{ height: `${bar * 25}%` }}
          />
        ))}
      </div>
    </div>
  );
};

export default function OfflineHandler({ children, expired }) {
  const [mounted, setMounted] = useState(false);
  const {
    isOnline,
    connectionQuality,
    isReconnecting,
    reconnectionAttempts,
    maxReconnectionAttempts,
    retryConnection,
    lastOnlineTime,
    showReconnectedBanner,
  } = useInternetStatus();

  const [offlineDuration, setOfflineDuration] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // حساب وقت الانقطاع
  useEffect(() => {
    if (!isOnline && mounted) {
      const timer = setInterval(() => {
        const duration = Math.floor((Date.now() - lastOnlineTime) / 1000);
        setOfflineDuration(Math.max(0, duration));
      }, 1000);
      return () => clearInterval(timer);
    }
    setOfflineDuration(0);
  }, [isOnline, lastOnlineTime, mounted]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins} دقيقة و ${secs} ثانية` : `${secs} ثانية`;
  };

  // حماية التوافق بين السيرفر والعميل لمنع أخطاء Hydration
  if (!mounted) {
    return children;
  }

  // 1. شاشة انتهاء الجلسة أو الوقت
  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 via-gray-950 to-black p-4 text-white">
        <div className="w-full max-w-md bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <Clock size={36} className="animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">انتهت صلاحية الجلسة</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              الوقت المخصص لهذه الصفحة قد انتهى. يرجى التحديث أو العودة للرئيسية.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => (window.location.href = "/")}
              className="w-full py-3.5 px-6 rounded-2xl font-bold bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <Home size={18} />
              العودة للرئيسية
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-6 rounded-2xl font-bold bg-gray-800 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 transition-all flex items-center justify-center gap-2"
            >
              <RotateCw size={16} />
              إعادة التحميل
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. شاشة انقطاع الإنترنت الكاملة
  if (!isOnline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 via-gray-950 to-black p-4 text-white">
        {/* Glow backdrop effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-lg bg-gray-900/85 backdrop-blur-2xl border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
          {/* Status Icon */}
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 rounded-3xl bg-rose-500/20 blur-xl animate-pulse" />
            <div className="relative w-full h-full rounded-3xl bg-linear-to-br from-rose-500/20 to-red-950/40 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-xl">
              {isReconnecting ? (
                <RotateCw size={40} className="animate-spin text-indigo-400" />
              ) : (
                <WifiOff size={40} className="animate-bounce" />
              )}
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-extrabold">
              <AlertCircle size={14} />
              انقطع الاتصال بالإنترنت
            </div>
            <h2 className="text-2xl font-black text-white">
              {isReconnecting ? "جارٍ محاولة إعادة الاتصال..." : "أنت غير متصل بالإنترنت حالياً"}
            </h2>
            <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
              تعذر الاتصال بخوادم CodaX. يرجى التأكد من اتصالك بالشبكة للمتابعة.
            </p>
          </div>

          {/* Connection info pills */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-gray-800/60 border border-gray-700/60 text-right text-xs">
            <div>
              <span className="text-gray-400 block mb-1">جودة الإشارة:</span>
              <SignalBars quality={connectionQuality} />
            </div>
            <div>
              <span className="text-gray-400 block mb-1">مدة الانقطاع:</span>
              <span className="font-bold text-gray-200 font-mono">
                {offlineDuration > 0 ? formatDuration(offlineDuration) : "الآن"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-1">
            <button
              onClick={retryConnection}
              disabled={isReconnecting}
              className="w-full py-3.5 px-6 rounded-2xl font-black text-sm bg-linear-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-600/30 transition-all active:scale-98 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {isReconnecting ? (
                <>
                  <RotateCw size={18} className="animate-spin" />
                  جارٍ فحص الاتصال... (محاولة {reconnectionAttempts + 1}/{maxReconnectionAttempts})
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  إعادة المحاولة الآن
                </>
              )}
            </button>

            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-6 rounded-2xl font-bold text-xs bg-gray-800/80 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 transition-all flex items-center justify-center gap-2"
            >
              <RotateCw size={14} />
              إعادة تحميل الصفحة بالكامل
            </button>
          </div>

          {/* Quick Troubleshooting tips */}
          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-900/30 text-right space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
              <HelpCircle size={14} />
              <span>نصائح سريعة لحل المشكلة:</span>
            </div>
            <ul className="text-[11px] text-gray-400 space-y-1 pr-4 list-disc list-inside">
              <li>تأكد من تفعيل الواي فاي أو باقة البيانات في جهازك</li>
              <li>جرب إيقاف وتشغيل وضع الطيران (Airplane Mode)</li>
              <li>أعد تشغيل الراوتر (Router) إذا استمر الانقطاع</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // 3. بنر استعادة الاتصال العلوي عند عودة الإنترنت
  return (
    <>
      {showReconnectedBanner && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-99999 animate-bounce">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-emerald-600 text-white shadow-2xl shadow-emerald-600/40 border border-emerald-400/40 text-sm font-bold backdrop-blur-md">
            <CheckCircle2 size={20} className="text-white" />
            <span>تمت استعادة الاتصال بالإنترنت بنجاح! 🚀</span>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
