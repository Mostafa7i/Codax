"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Sparkles,
  Home,
  Users,
  Clock,
  BookOpen,
  Laptop,
  ShieldCheck,
} from "lucide-react";

const RegistrationSuccess = () => {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("codax_reg_success_payload");
        if (!stored) {
          // محاولة الدخول مباشرة عبر الرابط دون تسجيل → تحويل فوري لصفحة التسجيل
          router.replace("/auth/Register");
          return;
        }

        const data = JSON.parse(stored);
        const now = Date.now();
        // صلاحية الجلسة: 30 دقيقة من لحظة التسجيل
        if (now - data.timestamp > 30 * 60 * 1000) {
          sessionStorage.removeItem("codax_reg_success_payload");
          router.replace("/auth/Register");
          return;
        }

        setStudentInfo(data);
        setIsAuthorized(true);
      } catch (err) {
        console.error("Error reading registration session:", err);
        router.replace("/auth/Register");
      } finally {
        setLoading(false);
      }
    }
  }, [router]);

  // حالة التحميل أثناء فحص الصلاحية
  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
        <p className="mt-4 text-sm font-bold text-slate-400">جاري التحقق من بيانات التسجيل...</p>
      </div>
    );
  }

  const trackLabel =
    studentInfo?.track === "frontend"
      ? "تراك الفرونت إند (Frontend Development)"
      : studentInfo?.track === "backend"
        ? "تراك الباك إند (Backend Development)"
        : studentInfo?.track || "المسار البرمجي";

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden"
      dir="rtl"
    >
      {/* ─── خلفيات وإضاءات متوهجة في الخلفية ─── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full" />
        <div className="absolute top-10 left-10 w-[300px] h-[300px] bg-purple-500/10 blur-[90px] rounded-full" />
      </div>

      {/* ─── بطاقة النجاح الرئيسية ─── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 25 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="
          relative z-10
          max-w-xl w-full
          bg-slate-900/80 dark:bg-slate-900/90
          backdrop-blur-2xl
          border border-emerald-500/30
          rounded-3xl sm:rounded-4xl
          p-6 sm:p-10
          shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_40px_rgba(16,185,129,0.15)]
          text-center
        "
      >
        {/* خط التدرج العلوي */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-emerald-400 via-teal-400 to-indigo-500 rounded-t-3xl sm:rounded-t-4xl" />

        {/* ─── الأيقونة المتحركة ─── */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-linear-to-tr from-emerald-500 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40"
            >
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" strokeWidth={2.5} />
            </motion.div>

            {/* نجوم إضافية متحركة */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-2 -right-2 text-amber-400"
            >
              <Sparkles className="w-6 h-6" />
            </motion.div>
          </div>
        </div>

        {/* ─── النصوص والعناوين ─── */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3 shadow-inner">
          <Sparkles className="w-3.5 h-3.5" />
          <span>تم استلام طلب التسجيل بنجاح!</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">
          أهلاً بك في أكاديمية <span className="bg-linear-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">CodaX</span> 🎉
        </h1>

        {studentInfo?.name && (
          <p className="text-base sm:text-lg font-bold text-slate-200 mb-2">
            مرحباً يا <span className="text-emerald-400 font-black">{studentInfo.name}</span>
          </p>
        )}

        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md mx-auto mb-6">
          يسعدنا انضمامك إلينا. تم تسجيل بياناتك بنجاح وسيقوم فريق القبول والمتابعة بالتواصل معك قريباً لتأكيد الاشتراك وبدء الرحلة.
        </p>

        {/* ─── بطاقة تفاصيل المسار ─── */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 mb-6 text-right space-y-2.5 shadow-inner">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              المسار المسجل:
            </span>
            <span className="font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
              {trackLabel}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Laptop className="w-4 h-4 text-emerald-400" />
              طريقة الدراسة:
            </span>
            <span className="font-bold text-emerald-300">
              {studentInfo?.studyMethod === "inPerson" ? "🏫 حضوري في المقر" : "🌐 أونلاين عن بعد"}
            </span>
          </div>
        </div>

        {/* ─── خطوات ما بعد التسجيل ─── */}
        <div className="text-right mb-8">
          <h4 className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            ماذا سيحدث بعد الآن؟
          </h4>

          <div className="space-y-2.5">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 mt-0.5">
                1
              </div>
              <p className="leading-relaxed">
                <strong className="text-white">المراجعة والتواصل:</strong> سيقوم المنسق بالتواصل معك عبر الواتساب لتأكيد بياناتك ومواعيد المحاضرات.
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs text-slate-300">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0 mt-0.5">
                2
              </div>
              <p className="leading-relaxed">
                <strong className="text-white">الانضمام للمجموعة:</strong> ستتم إضافتك إلى مجموعة الطلاب الخاصة بمجموعتك والتواصل المباشر مع المدرب.
              </p>
            </div>
          </div>
        </div>

        {/* ─── أزرار الإجراءات ─── */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/pages/main"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Users className="w-4 h-4" />
            <span>استكشف منصة الطلاب</span>
          </Link>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-sm border border-slate-700/60 active:scale-95 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>الرئيسية</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default React.memo(RegistrationSuccess);