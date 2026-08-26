'use client';

import React, { memo } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Zap,
  Star,
  Code2,
  Server,
  Award,
  Shield,
  Building2,
  NotebookPen,
  Sparkles,
} from "lucide-react";
import { FeaturePill } from "../Cards";

const FEATURES = [
  { text: "تسجيلات المحاضرات", icon: BookOpen, color: "text-indigo-400" },
  { text: "PDF مجاني للطلاب", icon: Award, color: "text-amber-400" },
  { text: "Tasks أسبوعية", icon: Zap, color: "text-cyan-400" },
  { text: "اختبارات أسبوعية", icon: Shield, color: "text-emerald-400" },
  { text: "+20 تاسك", icon: NotebookPen, color: "text-green-400" },
  { text: "6 مشاريع", icon: Building2, color: "text-yellow-400" },
  { text: "شهادة FullStack", icon: Award, color: "text-purple-400" },
  { text: "نظام مكافآت", icon: Star, color: "text-yellow-400" },
];

const TRACKS = [
  {
    title: "Frontend Track",
    subtitle: "المرحلة الأولى",
    icon: Code2,
    gradient: "from-cyan-500 to-blue-600",
    glow: "group-hover:shadow-cyan-500/15",
    accentLine: "from-cyan-400 via-blue-500 to-transparent",
    techs: [
      "HTML5",
      "CSS3",
      "FlexBox",
      "Grid",
      "Animation",
      "Media query",
      "Git & GitHub",
      "SASS",
      "Bootstrap",
      "Tailwind",
      "JavaScript (ES6+)",
      "OOP",
      "ReactJS",
      "NextJS",
    ],
    desc: "من المبتدئ إلى بناء تطبيقات React كاملة",
  },
  {
    title: "Backend Track",
    subtitle: "المرحلة الثانية",
    icon: Server,
    gradient: "from-emerald-500 to-teal-600",
    glow: "group-hover:shadow-emerald-500/15",
    accentLine: "from-emerald-400 via-teal-500 to-transparent",
    techs: [
      "NodeJS",
      "Express JS",
      "Postman",
      "MongoDB",
      "npm",
      "REST API",
      "Mongoose",
      "JWT Auth",
      "Roles",
      "Password Hashing",
      "Multer",
      "Validation",
      "Error Handling",
      "Deployment",
    ],
    desc: "بناء APIs قوية وقواعد بيانات احترافية",
  },
];

function FeaturesSection() {
  return (
    <section className="relative py-20 sm:py-28 px-4 overflow-hidden" dir="rtl">
      {/* soft ambient */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-500/[0.06] blur-[100px] rounded-full" />

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] uppercase text-indigo-300/90 bg-indigo-500/10 border border-indigo-500/25 px-3 py-1 rounded-full mb-4">
            <Sparkles className="w-3 h-3" />
            المميزات والمسارات
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3">
            لماذا{" "}
            <span className="bg-gradient-to-l from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              CodaX
            </span>
            ؟
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto">
            كل ما تحتاجه لتبدأ مسيرتك في تطوير الويب باحتراف
          </p>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="flex flex-wrap justify-center gap-2.5 sm:gap-3 mb-14"
        >
          {FEATURES.map((f, i) => (
            <FeaturePill key={f.text} {...f} />
          ))}
        </motion.div>

        {/* Track cards */}
        <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
          {TRACKS.map((track, i) => {
            const Icon = track.icon;
            return (
              <motion.article
                key={track.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.12 }}
                className={`group relative p-6 sm:p-7 rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-white/15 hover:shadow-2xl ${track.glow}`}
              >
                {/* hover wash */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${track.gradient} opacity-0 group-hover:opacity-[0.07] transition-opacity duration-500`}
                />

                {/* top accent line */}
                <div
                  className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-l ${track.accentLine} opacity-70`}
                />

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`p-3 rounded-2xl bg-gradient-to-br ${track.gradient} shadow-lg`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-slate-500 tracking-[0.18em] uppercase font-semibold">
                        {track.subtitle}
                      </p>
                      <h3 className="text-lg sm:text-xl font-black text-white">
                        {track.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-slate-400 text-sm mb-5 leading-relaxed">
                    {track.desc}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {track.techs.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold text-slate-300 bg-white/[0.06] border border-white/10 hover:border-white/20 hover:bg-white/[0.09] transition-colors"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default memo(FeaturesSection);