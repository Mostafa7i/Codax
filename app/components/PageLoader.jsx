"use client";
import React, { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

/* ─────────────────────────────────────────────────────────────
   PageLoader (Top Navigation Progress Bar)
   - يعمل فقط كشريط تقدم علوي أنيق عند الانتقال بين الصفحات
   - لا يظهر مطلقاً في التحميل الأول (لأن اللودر الكامل يغطيه)
   - لا يسبب وميض أو ظهور مزدوج (Double Loader)
───────────────────────────────────────────────────────────── */
export default function PageLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    // إذا لم يتغير المسار (التحميل الأول أو نفس الصفحة) -> لا تفعل شيئاً
    if (prevPathRef.current === pathname) {
      return;
    }
    prevPathRef.current = pathname;

    // حدث انتقال فعلي بين الصفحات
    setLoading(true);
    setProgress(30);

    const t1 = setTimeout(() => setProgress(75), 150);
    const t2 = setTimeout(() => setProgress(100), 350);
    const t3 = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] z-[99999] pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(99,102,241,0.8)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
