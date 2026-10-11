"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAvatarBorder, getAvatarBadge } from "@/app/utils/avatarDecorations";
import AvatarFrame from "@/app/utils/AvatarFrame";
import { useGamificationFeatures } from "@/app/hooks/useGamificationFeatures";

const DEFAULT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236366f1'><circle cx='12' cy='8' r='4'/><path d='M4 20c0-4 3.6-7 8-7s8 3 8 7'/></svg>`;

export default function SpotlightBanner() {
  const router = useRouter();
  const { activeSpotlights, isSpotlightEnabled, spotlightConfig } = useGamificationFeatures();
  const [currentIndex, setCurrentIndex] = useState(0);

  // تدوير تلقائي للبانر إذا كان هناك أكثر من طالب مميز
  useEffect(() => {
    if (activeSpotlights.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSpotlights.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeSpotlights.length]);

  if (!isSpotlightEnabled || activeSpotlights.length === 0) {
    return null;
  }

  const currentSpotlight = activeSpotlights[currentIndex] || activeSpotlights[0];
  const borderConfig = getAvatarBorder(currentSpotlight.activeBorder);
  const badgeConfig = currentSpotlight.activeBadge ? getAvatarBadge(currentSpotlight.activeBadge) : null;

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeSpotlights.length);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + activeSpotlights.length) % activeSpotlights.length);
  };


  return (
    <div className="w-full max-w-5xl mx-auto mb-6 px-2 sm:px-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: -15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative overflow-hidden rounded-3xl bg-linear-to-r from-amber-950/80 via-slate-900 to-indigo-950/80 border border-amber-500/40 p-4 sm:p-5 shadow-[0_0_35px_rgba(245,158,11,0.2)]"
      >
        {/* خلفيات متوهجة وجمالية */}
        <div className="pointer-events-none absolute -top-12 -right-12 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 w-44 h-44 bg-indigo-500/15 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* الجانب الأيمن: شارة نجم اليوم والأفاتار وبيانات الطالب */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* الأفاتار مع الإطار */}
            <div className="relative shrink-0">
              <AvatarFrame
                frameStyle={borderConfig.frameStyle}
                size={64}
                className={`ring-2 ring-offset-2 ring-offset-slate-900 ${borderConfig.ringClass} ${borderConfig.glowClass || ""}`}
              >
                <img
                  src={currentSpotlight.profilePic || DEFAULT_AVATAR}
                  alt={currentSpotlight.studentName}
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = DEFAULT_AVATAR;
                  }}
                />
              </AvatarFrame>
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 rounded-full p-1 shadow-md animate-bounce">
                <Star size={12} className="fill-current" />
              </div>
            </div>

            {/* تفاصيل الطالب */}
            <div className="min-w-0 flex-1 text-right">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-linear-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/40 text-[10px] font-black text-amber-300 tracking-wider">
                  <Sparkles size={11} className="text-amber-400" />
                  {spotlightConfig.title || "نجم اليوم ⭐"}
                </span>

                {badgeConfig && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeConfig.badgeClass}`}>
                    {badgeConfig.emoji} {badgeConfig.name}
                  </span>
                )}
              </div>

              <h3 className="text-base sm:text-lg font-black text-white mt-1 truncate">
                {currentSpotlight.studentName}
              </h3>

              {currentSpotlight.group && (
                <p className="text-[11px] text-slate-400 font-medium">
                  المجموعة: <span className="text-indigo-300">{currentSpotlight.group}</span>
                </p>
              )}
            </div>
          </div>

          {/* الرسالة المخصصة (Shoutout) */}
          <div className="flex-1 w-full md:w-auto bg-slate-950/60 border border-amber-500/20 rounded-2xl px-4 py-2.5 text-right">
            <p className="text-xs sm:text-sm font-semibold text-amber-100/90 leading-relaxed italic">
              "{currentSpotlight.message || "مرحباً بكم جميعاً في منصة CodaX!"}"
            </p>
          </div>

          {/* الجانب الأيسر: زر استعراض البروفايل وأسهم التنقل */}
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
            {activeSpotlights.length > 1 && (
              <div className="flex items-center gap-1 bg-slate-900/80 rounded-xl p-1 border border-slate-700">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="السابق"
                >
                  <ChevronRight size={16} />
                </button>
                <span className="text-[10px] font-mono font-bold text-amber-400 px-1">
                  {currentIndex + 1}/{activeSpotlights.length}
                </span>
                <button
                  type="button"
                  onClick={handleNext}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="التالي"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
