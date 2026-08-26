"use client";
import React, { useEffect, useState, useRef } from "react";
import { Sparkles, RefreshCw } from "lucide-react";

export default function VersionWatcher() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const initialTimestampRef = useRef(null);
  const isUpdatingRef = useRef(false);

  const applyUpdate = () => {
    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;

    if (typeof window !== "undefined") {
      try {
        if ("caches" in window) {
          caches.keys().then((names) => {
            names.forEach((name) => caches.delete(name));
          });
        }
      } catch (e) {}

      setTimeout(() => {
        window.location.reload();
      }, 200);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    // تعطيل الميزة تماماً في وضع التطوير المحلي
    if (process.env.NODE_ENV === "development") {
      return;
    }

    let isMounted = true;

    const checkVersion = async () => {
      if (!isMounted || isUpdatingRef.current) return;

      try {
        const res = await fetch(`/version.json?_t=${Date.now()}`, {
          cache: "no-store",
        });

        if (res.ok && isMounted) {
          const data = await res.json();
          const incomingTimestamp = Number(data.timestamp);

          if (!incomingTimestamp || isNaN(incomingTimestamp)) return;

          // أول مرة يتم فيها فتح الصفحة: نثبت هذا الإصدار كإصدار حالي للصفحة
          if (initialTimestampRef.current === null) {
            initialTimestampRef.current = incomingTimestamp;
            return;
          }

          // لا يتم التحديث إلا إذا كان تاريخ الإصدار الجديد أكبر زمنياً من تاريخ فتح الصفحة
          if (incomingTimestamp > initialTimestampRef.current) {
            setHasUpdate(true);
          }
        }
      } catch (err) {
        // تجاهل أخطاء الشبكة المؤقتة
      }
    };

    // 1. جلب الإصدار الحالي عند فتح الصفحة لأول مرة
    checkVersion();

    // 2. فحص دوري كل 45 ثانية وعند إعادة التركيز على التاب
    const interval = setInterval(checkVersion, 45000);
    const handleFocus = () => checkVersion();

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, []);

  // عد تنازلي وتطبيق التحديث بعد التأكد من وجود إصدار أحدث
  useEffect(() => {
    if (hasUpdate) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            applyUpdate();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [hasUpdate]);

  if (!hasUpdate) return null;

  return (
    <div className="fixed top-4 inset-x-0 z-999999 flex justify-center px-4 pointer-events-none animate-bounce">
      <div className="pointer-events-auto flex items-center gap-3.5 px-5 py-3.5 rounded-2xl bg-gray-950/95 text-white border-2 border-indigo-500/80 shadow-2xl shadow-indigo-500/40 backdrop-blur-xl max-w-lg">
        <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shrink-0">
          <RefreshCw size={18} className="animate-spin" />
        </div>

        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center gap-1.5 text-xs font-black text-indigo-400 mb-0.5">
            <Sparkles size={13} />
            <span>تم نشر تحديث جديد للمنصة</span>
          </div>
          <p className="text-xs font-bold text-gray-200 truncate">
            جارٍ تطبيق التحديثات تلقائياً خلال {countdown} ثوانٍ...
          </p>
        </div>

        <button
          onClick={applyUpdate}
          className="px-3.5 py-2 rounded-xl text-xs font-black bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-600/30 transition-all active:scale-95 shrink-0"
        >
          تحديث الآن
        </button>
      </div>
    </div>
  );
}
