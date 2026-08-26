'use client';
import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, RotateCcw,
  Phone, Mail, CheckCircle2, Code2,
  Server, Award, AlertTriangle, CreditCard,
  FileText, Star, Sparkles, Shield
} from "lucide-react";

const slidesData = [
  {
    id: 1, type: "hero",
    title: "قواعد المنحة",
    subtitle: "CodaX Academy",
    description: "منحة تدريبية متكاملة في تطوير الويب من الصفر إلى الاحتراف",
    accent: "#6366f1",
    gradient: "from-indigo-600 via-purple-600 to-pink-600",
  },
  {
    id: 2, type: "bullets",
    title: "مميزات المنحة",
    icon: Star,
    accent: "#f59e0b",
    gradient: "from-amber-500 to-orange-500",
    items: [
      { text: "يتم عمل Tasks علي كل محاضرة ويتم التقييم عليها", highlight: true },
      { text: "يتم عمل اختبارات اسبوعية ويتم نشر اوائل الاختبار علي صفحة المنحة الرسمية", highlight: false },
      { text: "المحاضرات يتم تسجيلها علي جروب خاص بالمنحة يمكن الرجوع اليها وقت الحاجه", highlight: false },
      { text: "يتوفر pdf مجاني للطلاب كملخص للمحتوي", highlight: true },
    ]
  },
  {
    id: 3, type: "grid",
    title: "المرحلة الأولى",
    subtitle: "Front End",
    icon: Code2,
    accent: "#06b6d4",
    gradient: "from-cyan-500 to-blue-600",
    items: ["HTML", "CSS", "HTML5", "CSS3", "SASS", "BOOTSTRAP", "JavaScript", "Tailwind", "Jquery + OOP", "ReactJS"]
  },
  {
    id: 4, type: "bullets",
    title: "المرحلة الثانية",
    subtitle: "Back End",
    icon: Server,
    accent: "#10b981",
    gradient: "from-emerald-500 to-teal-600",
    items: [
      { text: "NodeJS — بناء خوادم قوية وسريعة", highlight: true },
      { text: "MONGO DB — قاعدة بيانات NoSQL الأكثر انتشاراً", highlight: false },
      { text: "Express JS — إطار عمل خفيف ومرن", highlight: false },
    ]
  },
  {
    id: 5, type: "bullets",
    title: "نظام الشهادات",
    icon: Award,
    accent: "#8b5cf6",
    gradient: "from-violet-500 to-purple-600",
    items: [
      { text: "يتم استلام شهادة الفرونت بعد 72 ساعة من اتمام الدورة التدريبية", highlight: false },
      { text: "يتم استلام شهادة الباك بعد 72 ساعة من اتمام الدورة التدريبية", highlight: false },
      { text: "في حالة اختيار تراك الفرونت والباك معاً سيتم استلام شهادة FullStack", highlight: true },
    ]
  },
  {
    id: 6, type: "bullets",
    title: "نظام الغياب",
    icon: AlertTriangle,
    accent: "#ef4444",
    gradient: "from-red-500 to-rose-600",
    items: [
      { text: "6 محاضرات غياب دون اذن يستبعد الطالب من التقييم التراكمي", highlight: true },
      { text: "10 محاضرات غياب دون اذن يستبعد الطالب من التقييم التراكمي ويتم حجب الشهادة عنه", highlight: true },
      { text: "يجب علي الطالب ابلاغ الادارة في حالة حدوث ظرف يؤدي الي عدم التمكن من التواجد في المحاضرة", highlight: false },
    ]
  },
  {
    id: 7, type: "bullets",
    title: "نظام الدفع",
    icon: CreditCard,
    accent: "#f59e0b",
    gradient: "from-yellow-500 to-amber-600",
    items: [
      { text: "للانضمام للمنحة يتم تحويل المبلغ عن طريق Vodafone Cash وابلاغ الادارة بعد اكتمال التحويل — يتم طلب الرقم من الادارة", highlight: false },
      { text: "للمزيد من التفاصيل يمكنكم الاستفسار علي الرقم: 01023669672", highlight: true },
      { text: "المبلغ المدفوع لا يسترد, لكن يمكن التأجيل بعد الدفع لدفعة جديده", highlight: true },
    ]
  },
  {
    id: 8, type: "bullets",
    title: "بنود إضافية — ١",
    icon: FileText,
    accent: "#06b6d4",
    gradient: "from-sky-500 to-cyan-600",
    items: [
      { text: "مدة الفرونت تتراوح بين 4 شهور الي 4 شهور ونصف", highlight: false },
      { text: "مدة الباك تتراوح بين 3 شهور الي 3 شهور ونصف", highlight: false },
      { text: "يجري اختبار مكون من 50 سؤال وبتقيم 100 درجة كل جمعة مساءً ومدة الاختبار ساعة واحده", highlight: true },
      { text: "مجموع علامات الطالب خلال فترة المنحة 1000 درجة", highlight: true },
    ]
  },
  {
    id: 9, type: "bullets",
    title: "بنود إضافية — ٢",
    icon: Shield,
    accent: "#8b5cf6",
    gradient: "from-purple-500 to-violet-600",
    items: [
      { text: "في حالة حدوث تجاوز سلوكي من الطالب يتم استبعاده نهائياً من المنحة", highlight: true },
      { text: "تتم مكافئة الطلاب بناء علي رؤية المهندس لمستوي الاسئلة المطروحة خلال المحاضرات", highlight: false },
      { text: "سيكون هناك ماتريال مجاني pdf للطلاب", highlight: false },
      { text: "خلال مرحلة الفرونت سيتم تنفيذ +12 Task و 5 مشاريع", highlight: true },
    ]
  },
  {
    id: 10, type: "contact",
    title: "CodaX",
    subtitle: "FRONT END × BACK END",
    accent: "#6366f1",
    gradient: "from-indigo-600 via-purple-600 to-pink-600",
  }
];

// ===================== Slide Components (Memoized) =====================

const HeroSlide = memo(function HeroSlide({ slide }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-6 sm:gap-8 px-2">
      <div className="relative w-28 h-28 sm:w-40 sm:h-40 md:w-48 md:h-48">
        <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${slide.gradient} opacity-25 blur-2xl`} />
        <div className={`w-full h-full rounded-full bg-gradient-to-tr ${slide.gradient} p-[2px] shadow-xl`}>
          <div className="w-full h-full bg-[#0a0f1e] rounded-full flex items-center justify-center">
            <span className={`text-3xl sm:text-5xl md:text-6xl font-black bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent`}>
              CX
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3">
        <p className="text-slate-400 text-xs sm:text-sm tracking-[0.25em] uppercase font-semibold">
          {slide.subtitle}
        </p>
        <h1 className={`text-4xl sm:text-5xl md:text-6xl font-black bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent leading-tight`}>
          {slide.title}
        </h1>
        <p className="text-slate-300 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
          {slide.description}
        </p>
      </div>

      <div className={`flex gap-2 bg-gradient-to-r ${slide.gradient} p-[1px] rounded-full`}>
        <div className="bg-[#0a0f1e] rounded-full px-6 py-2.5 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span className="text-white font-semibold text-sm sm:text-base">ابدأ رحلتك معنا</span>
        </div>
      </div>
    </div>
  );
});

const BulletsSlide = memo(function BulletsSlide({ slide }) {
  const Icon = slide.icon;
  return (
    <div className="flex flex-col h-full gap-4 overflow-hidden">
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br ${slide.gradient} shadow-lg`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div className="min-w-0">
          {slide.subtitle && (
            <p className="text-[10px] sm:text-xs text-slate-400 tracking-widest uppercase">
              {slide.subtitle}
            </p>
          )}
          <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-white truncate">
            {slide.title}
          </h2>
        </div>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto pr-1 custom-scroll">
        {slide.items?.map((item, i) => (
          <div
            key={i}
            className={`relative flex items-start gap-3 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border
              ${item.highlight
                ? "bg-white/10 border-white/20"
                : "bg-white/5 border-white/10"}`}
          >
            {item.highlight && (
              <div className={`absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r ${slide.gradient} opacity-[0.12]`} />
            )}
            <div className={`mt-0.5 shrink-0 p-1 rounded-full bg-gradient-to-br ${slide.gradient}`}>
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </div>
            <p className={`text-sm sm:text-base leading-relaxed relative z-10 ${item.highlight ? "text-white font-medium" : "text-slate-300"}`}>
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
});

const GridSlide = memo(function GridSlide({ slide }) {
  const Icon = slide.icon;
  return (
    <div className="flex flex-col h-full gap-5 overflow-hidden">
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br ${slide.gradient} shadow-lg`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div>
          <p className="text-[10px] sm:text-xs text-slate-400 tracking-widest uppercase">{slide.subtitle}</p>
          <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-white">{slide.title}</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5 flex-1 content-start">
        {slide.items?.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-center p-3 sm:p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span className="font-bold text-slate-200 text-xs sm:text-sm md:text-base text-center">
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

const ContactSlide = memo(function ContactSlide({ slide }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-8 sm:gap-10 px-2">
      <div className="space-y-2">
        <h2 className={`text-5xl sm:text-7xl md:text-8xl font-black bg-gradient-to-r ${slide.gradient} bg-clip-text text-transparent`}>
          {slide.title}
        </h2>
        <p className="text-slate-400 text-sm sm:text-base tracking-[0.2em] font-semibold">
          {slide.subtitle}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg">
        <a
          href="tel:01023669672"
          className={`flex-1 flex items-center justify-center gap-2.5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br ${slide.gradient} shadow-lg hover:brightness-110 transition-all`}
        >
          <Phone className="w-5 h-5 text-white" />
          <span className="text-white font-bold text-base">01023669672</span>
        </a>
        <a
          href="mailto:codax.developer@gmail.com"
          className="flex-1 flex items-center justify-center gap-2.5 p-3.5 sm:p-4 rounded-2xl bg-white/10 border border-white/20 hover:bg-white/15 transition-all"
        >
          <Mail className="w-5 h-5 text-indigo-400" />
          <span className="text-slate-200 font-bold text-sm">codax.developer@gmail.com</span>
        </a>
      </div>

      <p className="text-slate-500 text-xs sm:text-sm">
        © 2025 CodaX Academy — جميع الحقوق محفوظة
      </p>
    </div>
  );
});

// ===================== Main Component =====================

export default function CodaXRules() {
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState(1);
  const touchStartX = useRef(null);
  const total = slidesData.length;

  const go = useCallback((next) => {
    if (next < 0 || next >= total) return;
    setDir(next > current ? 1 : -1);
    setCurrent(next);
  }, [current, total]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") go(current + 1);
      if (e.key === "ArrowRight") go(current - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, current]);

  // Touch swipe
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      go(diff > 0 ? current + 1 : current - 1);
    }
    touchStartX.current = null;
  };

  const slide = slidesData[current];
  const progress = ((current + 1) / total) * 100;

  const renderSlide = () => {
    switch (slide.type) {
      case "hero": return <HeroSlide slide={slide} />;
      case "grid": return <GridSlide slide={slide} />;
      case "contact": return <ContactSlide slide={slide} />;
      default: return <BulletsSlide slide={slide} />;
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-[100dvh] bg-[#070b14] text-slate-200 relative overflow-hidden"
    >
      {/* Soft static glow (no continuous animation) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.07]"
          style={{ background: `radial-gradient(circle, ${slide.accent}, transparent 70%)` }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent 70%)" }}
        />
      </div>

      <div
        className="relative z-10 w-full max-w-3xl mx-auto flex flex-col gap-4 p-3 sm:p-4"
        style={{ height: "100dvh", maxHeight: "820px" }}
      >
        {/* Progress */}
        <div className="h-1 bg-white/10 rounded-full overflow-hidden shrink-0">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(to left, ${slide.accent}, ${slide.accent}99)`,
            }}
          />
        </div>

        {/* Slide Card */}
        <div
          className="relative flex-1 overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md shadow-2xl"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="absolute inset-0 p-4 sm:p-6 md:p-8">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={current}
                custom={dir}
                initial={{ opacity: 0, x: dir > 0 ? 40 : -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir > 0 ? -40 : 40 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="h-full"
              >
                {renderSlide()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Slide number */}
          <div className="absolute top-3 left-3 text-[11px] font-mono text-white/30 select-none">
            {String(current + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-3 shrink-0 pb-1">
          <button
            onClick={() => go(current - 1)}
            disabled={current === 0}
            className="p-2.5 sm:p-3 rounded-xl border border-white/10 bg-white/5 text-white disabled:opacity-25 disabled:cursor-not-allowed hover:bg-white/10 active:scale-95 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="flex items-center gap-1.5" dir="ltr">
            {slidesData.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === current ? 22 : 6,
                  background: i === current ? slide.accent : "rgba(255,255,255,0.25)",
                }}
              />
            ))}
          </div>

          {current === total - 1 ? (
            <button
              onClick={() => go(0)}
              className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:brightness-110 active:scale-95 transition-all"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => go(current + 1)}
              className="p-2.5 sm:p-3 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 active:scale-95 transition-all"
              style={{ boxShadow: `0 0 16px ${slide.accent}22` }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <style jsx global>{`
        .custom-scroll::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}