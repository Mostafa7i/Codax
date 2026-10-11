"use client";

import React, { memo, useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  LogIn as LucideLogIn,
  Star,
  Code2,
  Award,
  Users,
  ChevronDown,
  Zap,
  Volume2,
  VolumeX,
  RotateCcw,
} from "lucide-react";
import TextEffect from "../TextEffect..jsx";
import LoadingLink from "../LoadingLink";
import { StatCard } from "../Cards";
import { useStudentAuth } from "@/app/context/StudentAuthContext.jsx";
import RotatingText from "./RotatingText.jsx";

const toRotate = [
  "تعلّم أحدث تقنيات Front-End و Back-End",
  "أتقن الواجهة الأمامية والخلفية بتقنية MERN Stack واحصل على شهادة FullStack 🔥",
  "تعلّم الأساسيات من الصفر لتكون مميزًا في عصر الـ AI",
];

function HeroSection() {
  const { authenticatedStudentId } = useStudentAuth();
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnded, setIsVideoEnded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // نبدأ الفيديو فوراً مع muted لضمان تشغيل الفيديو 100% بدون أي تجميد في المتصفح
    video.muted = true;
    setIsMuted(true);

    const initPlayback = async () => {
      try {
        // محاولة التشغيل مع الصوت مباشرة
        video.muted = false;
        await video.play();
        setIsMuted(false);
      } catch {
        // إذا اعترضت سياسة المتصفح على الصوت التلقائي، نشغل الفيديو فوراً صامتاً
        video.muted = true;
        setIsMuted(true);
        video.play().catch(() => {});

        // عند أول نقرة للمستخدم على الصفحة، نفتح الصوت ونعيد المزامنة إذا كنا في الثواني الأولى
        const handleUserGesture = async () => {
          if (!videoRef.current || videoRef.current.ended) return;
          try {
            videoRef.current.muted = false;
            if (videoRef.current.currentTime < 4) {
              videoRef.current.currentTime = 0;
            }
            await videoRef.current.play();
            setIsMuted(false);
          } catch {
            // تجاهل إن لم ينجح
          }
        };

        window.addEventListener("pointerdown", handleUserGesture, {
          once: true,
        });
        window.addEventListener("keydown", handleUserGesture, { once: true });
      }
    };

    initPlayback();
  }, []);

  const toggleMute = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.muted) {
      // فتح الصوت
      video.muted = false;
      // إذا كان الفيديو في أول 4 ثواني، نعيده للبداية لمزامنة الصوت والصورة من البداية
      if (video.currentTime < 4) {
        video.currentTime = 0;
      }
      try {
        await video.play();
        setIsMuted(false);
      } catch (err) {
        console.warn("Autoplay blocked on unmute:", err);
        // في حال اعترض المتصفح، نبقي الفيديو مستمراً صامتاً لكي لا يتجمد إطلاقاً
        video.muted = true;
        video.play().catch(() => {});
        setIsMuted(true);
      }
    } else {
      // كتم الصوت مع ضمان استمرار تشغيل الفيديو
      video.muted = true;
      setIsMuted(true);
      if (video.paused) {
        video.play().catch(() => {});
      }
    }
  }, []);

  const handleReplay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.muted = false;
    setIsVideoEnded(false);
    try {
      await video.play();
      setIsMuted(false);
    } catch {
      video.muted = true;
      video.play().catch(() => {});
      setIsMuted(true);
    }
  }, []);

  const getDelay = (delaySec) => (isVideoEnded ? 0 : delaySec);

  return (
    <section
      className="relative min-h-svh w-full flex flex-col items-center justify-center px-4 pt-12 pb-12 sm:pt-20 sm:pb-16 text-center overflow-hidden"
      dir="rtl"
    >
      {/* ── خلفية الفيديو المضبوطة تماماً بحجم الشاشة للديسكتوب والموبايل ── */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <video
          ref={videoRef}
          src="/viduo/codax.mp4"
          autoPlay
          playsInline
          preload="auto"
          onEnded={() => setIsVideoEnded(true)}
          className={`w-full h-full object-cover object-center pointer-events-none transition-opacity duration-1000 ease-in-out ${
            isVideoEnded ? "opacity-0" : "opacity-100"
          }`}
        />
      </div>

      {/* ── إضاءات الخلفية الطبيعية للموقع — تظهر وتندمج بسلاسة عند انتهاء الفيديو ── */}
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-1000 ${
          isVideoEnded ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-indigo-500/12 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[320px] h-80 bg-purple-500/8 blur-[100px] rounded-full" />
        <div className="absolute top-1/3 left-1/4 w-60 h-60 bg-pink-500/6 blur-[90px] rounded-full" />
      </div>

      {/* ── تدرج ناعم متعدد الطبقات لدمج حافة الهيرو السفلية مع السكشن الثاني بانسيابية تامة ── */}
      <div className="absolute inset-x-0 bottom-0 h-44 sm:h-64 bg-linear-to-t from-[#060912] via-[#060912]/85 via-40% via-[#060912]/25 via-75% to-transparent z-1 pointer-events-none" />

      {/* ── زر التحكم بالصوت وإعادة التشغيل الطافي ── */}
      <motion.button
        type="button"
        onClick={isVideoEnded ? handleReplay : toggleMute}
        title={
          isVideoEnded
            ? "إعادة تشغيل الفيديو"
            : isMuted
              ? "تشغيل الصوت"
              : "كتم الصوت"
        }
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`absolute top-4 left-4 sm:top-6 sm:left-6 z-30 flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl backdrop-blur-xl border shadow-2xl transition-all cursor-pointer ${
          isVideoEnded
            ? "bg-indigo-600/20 border-indigo-400/40 text-indigo-200 hover:bg-indigo-600/20"
            : isMuted
              ? "bg-amber-500/25 border-amber-400/20 text-amber-200 hover:bg-amber-500/20 shadow-amber-500/10 animate-pulse"
              : "bg-black/20 border-white/20 text-white hover:bg-black/20"
        }`}
      >
        {isVideoEnded ? (
          <>
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-300" />
            <span className="text-xs font-bold text-indigo-200">
              إعادة تشغيل الفيديو ↺
            </span>
          </>
        ) : isMuted ? (
          <>
            <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-200">
              تشغيل الصوت 🔊
            </span>
          </>
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-300">
              الصوت شغّال
            </span>
          </>
        )}
      </motion.button>

      {/* ── محتوى الهيرو فوق الفيديو ── */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
        {/* البادج الترحيبي */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-1.5 rounded-full bg-slate-950/40 border border-white/20 text-indigo-200 text-xs sm:text-sm font-semibold mb-5 sm:mb-8 backdrop-blur-md shadow-lg shadow-black/40"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          منحة تدريبية متكاملة في تطوير الويب
          <Zap className="w-3.5 h-3.5 text-indigo-400" />
        </motion.div>

        {/* العنوان الرئيسي */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: isVideoEnded ? 0.6 : 2,
            delay: getDelay(10),
            ease: [0.22, 1, 0.36, 1],
          }}
          className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-[1.15] mb-4 sm:mb-5 tracking-tight"
        >
          <span className="text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
            مرحباً بك في{" "}
          </span>
          <span className="relative inline-block">
            <span className="bg-linear-to-l from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent filter drop-shadow-[0_4px_20px_rgba(147,51,234,0.7)]">
              CodaX
            </span>
            <span className="absolute -bottom-1 inset-x-0 h-[3px] bg-linear-to-l from-indigo-400/0 via-purple-400/90 to-pink-400/0 rounded-full" />
          </span>
        </motion.h1>

        {/* العنوان الفرعي */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: isVideoEnded ? 0.5 : 1,
            delay: getDelay(12),
          }}
          className="text-white flex items-center gap-2 text-sm sm:text-base md:text-lg lg:text-xl max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed font-semibold px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl  backdrop-blur-md shadow-xl shadow-black/40 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
        >
          <p> منصة تعليم البرمجة احترافية بالعربية </p>
          <RotatingText
            texts={["Front", "Back", "Database", "Codax!"]}
            mainClassName="px-2 sm:px-2 md:px-3 border-b bg-transparent text-white overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-lg"
            staggerFrom="last"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-120%" }}
            staggerDuration={0.025}
            splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            rotationInterval={2000}
            splitBy="characters"
            auto
            loop
            dir="ltr"
          />
        </motion.div>

        {/* صندوق الكتابة التفاعلي */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: isVideoEnded ? 0.5 : 1,
            delay: getDelay(13),
          }}
          className="w-full max-w-2xl mb-8 sm:mb-10"
        >
          <div className="relative group">
            <div className="absolute -inset-px rounded-2xl bg-linear-to-l from-indigo-500/20 via-purple-500/20 to-pink-500/20 opacity-80 blur-[2px] group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-start gap-3 px-3.5 py-3.5 sm:px-5 sm:py-5 rounded-2xl bg-slate-950/75 border border-white/20 backdrop-blur-lg min-h-[4.5rem] sm:min-h-[5.5rem] shadow-2xl">
              <div className="mt-0.5 p-1.5 sm:p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/40 shrink-0">
                <Code2 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-300" />
              </div>
              <span className="text-xs sm:text-base md:text-lg font-bold text-white font-mono text-right leading-relaxed flex-1 drop-shadow-sm">
                <TextEffect toRotate={toRotate} />
              </span>
            </div>
          </div>
        </motion.div>

        {/* أزرار التسجيل والدخول */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: isVideoEnded ? 0.6 : 1.5,
            delay: getDelay(14),
          }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center w-full sm:w-auto mb-10 sm:mb-14"
        >
          <LoadingLink
            href={
              authenticatedStudentId
                ? `/student?id=${authenticatedStudentId}`
                : "/auth/Register"
            }
            spinnerColor="white"
            className="relative flex items-center justify-center gap-2.5 px-6 sm:px-10 py-3 sm:py-4 rounded-2xl font-bold text-sm sm:text-lg text-white overflow-hidden group bg-linear-to-l from-lime-500 via-emerald-500 to-teal-500 shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" />
            <span className="relative z-10">
              {authenticatedStudentId ? "الدخول الي حسابك" : "سجّل الآن مجانًا"}
            </span>
          </LoadingLink>

          <LoadingLink
            href="/pages/main"
            spinnerColor="#818cf8"
            className="flex items-center justify-center gap-2.5 px-6 sm:px-10 py-3 sm:py-4 rounded-2xl font-bold text-sm sm:text-lg text-white border border-white/25 bg-slate-950/70 hover:bg-slate-900/90 backdrop-blur-md shadow-xl transition-all active:scale-[0.98]"
          >
            <LucideLogIn className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-300" />
            دخول الطلاب
          </LoadingLink>
        </motion.div>

        {/* بطاقات الإحصائيات السريعة */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: isVideoEnded ? 0.6 : 1,
            delay: getDelay(15),
          }}
          className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 w-full max-w-2xl mx-auto"
        >
          <StatCard
            icon={Users}
            label="طالب مسجّل"
            value={500}
            suffix="+"
            color="from-indigo-500 to-purple-600"
          />
          <StatCard
            icon={Code2}
            label="ساعة تدريب"
            value={700}
            suffix="+"
            color="from-cyan-500 to-blue-600"
          />
          <StatCard
            icon={Award}
            label="مشاريع عملية"
            value={6}
            suffix="+"
            color="from-amber-500 to-orange-600"
          />
          <StatCard
            icon={Star}
            label="معدّل التقييم"
            value={4}
            suffix=".9★"
            color="from-yellow-500 to-orange-500"
          />
        </motion.div>

        {/* مؤشر التمرير لأسفل */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: getDelay(16), duration: 0.8 }}
          className="mt-8 sm:mt-12 text-white/80 animate-bounce"
        >
          <ChevronDown className="w-6 h-6 mx-auto drop-shadow-md" />
        </motion.div>
      </div>
    </section>
  );
}

export default memo(HeroSection);
