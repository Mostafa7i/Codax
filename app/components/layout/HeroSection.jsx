"use client";

import React, { memo } from "react";
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
} from "lucide-react";
import TextEffect from "../TextEffect..jsx";
import LoadingLink from "../LoadingLink";
import { StatCard } from "../Cards";

const toRotate = [
  "تعلّم أحدث تقنيات Front-End و Back-End",
  "أتقن الواجهة الأمامية والخلفية بتقنية MERN Stack واحصل على شهادة FullStack 🔥",
  "تعلّم الأساسيات من الصفر لتكون مميزًا في عصر الـ AI",
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.12 * i, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
};

function HeroSection() {
  return (
    <section
      className="relative min-h-[100dvh] flex flex-col items-center justify-center px-4 pt-20 pb-10 text-center overflow-hidden"
      dir="rtl"
    >
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-indigo-500/[0.12] blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[320px] h-[320px] bg-purple-500/[0.08] blur-[100px] rounded-full" />
        <div className="absolute top-1/3 left-1/4 w-[240px] h-[240px] bg-pink-500/[0.06] blur-[90px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
        {/* Badge */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs sm:text-sm font-semibold mb-8 backdrop-blur-sm shadow-[0_0_24px_-8px_rgba(99,102,241,0.4)]"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          منحة تدريبية متكاملة في تطوير الويب
          <Zap className="w-3.5 h-3.5 text-indigo-400" />
        </motion.div>

        {/* Title */}
        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[1.1] mb-5 tracking-tight"
        >
          <span className="text-white">مرحباً بك في </span>
          <span className="relative inline-block">
            <span className="bg-gradient-to-l from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              CodaX
            </span>
            <span className="absolute -bottom-1 inset-x-0 h-[3px] bg-gradient-to-l from-indigo-400/0 via-purple-400/70 to-pink-400/0 rounded-full" />
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="text-slate-400 text-base sm:text-lg md:text-xl max-w-xl mx-auto mb-8 leading-relaxed"
        >
          منصة تعليم البرمجة الأكثر احترافية بالعربية — من الصفر إلى سوق العمل
        </motion.p>

        {/* Typewriter box */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="w-full max-w-2xl mb-10"
        >
          <div className="relative group">
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-l from-indigo-500/40 via-purple-500/30 to-pink-500/40 opacity-60 blur-[1px] group-hover:opacity-90 transition-opacity" />
            <div className="relative flex items-start gap-3 px-4 py-4 sm:px-5 sm:py-5 rounded-2xl bg-slate-950/80 border border-white/10 backdrop-blur-md min-h-[5.5rem]">
              <div className="mt-0.5 p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/25 shrink-0">
                <Code2 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
              </div>
              <span className="text-sm sm:text-base md:text-lg font-bold text-slate-100 font-mono text-right leading-relaxed flex-1">
                <TextEffect toRotate={toRotate} />
              </span>
            </div>
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center w-full sm:w-auto mb-14"
        >
          <LoadingLink
            href="/auth/Register"
            spinnerColor="white"
            className="relative flex items-center justify-center gap-2.5 px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl font-bold text-base sm:text-lg text-white overflow-hidden group bg-gradient-to-l from-lime-500 via-emerald-500 to-teal-500 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <Sparkles className="w-5 h-5 relative z-10" />
            <span className="relative z-10">سجّل الآن مجانًا</span>
          </LoadingLink>

          <LoadingLink
            href="/pages/main"
            spinnerColor="#818cf8"
            className="flex items-center justify-center gap-2.5 px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl font-bold text-base sm:text-lg text-white border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 backdrop-blur-sm transition-all active:scale-[0.98]"
          >
            <LucideLogIn className="w-5 h-5 text-indigo-300" />
            دخول الطلاب
          </LoadingLink>
        </motion.div>

        {/* Stats */}
        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full max-w-2xl mx-auto"
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

        {/* Scroll hint — CSS only, lighter than infinite JS motion */}
        <div className="mt-12 sm:mt-14 text-slate-500 animate-bounce">
          <ChevronDown className="w-6 h-6 mx-auto opacity-70" />
        </div>
      </div>
    </section>
  );
}

export default memo(HeroSection);