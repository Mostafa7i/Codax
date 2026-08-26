'use client';
import React from "react";
import { motion } from "framer-motion";
import { Star, MessageCircle, Quote, Sparkles, BadgeCheck } from "lucide-react";
import { useReviewsRating } from "@/app/hooks/allHooks";
import Button from "../utils/Button";

// ─── Stars ───────────────────────────────────────────────────────────────
function Stars({ rating, size = 14, gap = "gap-0.5" }) {
  const value = Number(rating) || 0;
  return (
    <div className={`flex items-center ${gap}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={i <= value ? 0 : 1.5}
          className={
            i <= value
              ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.55)]"
              : "text-slate-600"
          }
        />
      ))}
    </div>
  );
}

// ─── Review Card ─────────────────────────────────────────────────────────
export function ReviewCard({ review, expanded, toggle, index }) {
  const formattedDate = review.createdAt?.toDate
    ? review.createdAt.toDate().toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : review.createdAt
      ? new Date(review.createdAt).toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—";

  const rating = Number(review.rating) || 5;
  const isTop = rating >= 5;
  const name =
    !review.name || review.name === "مجهول" ? "طالب مجهول" : review.name;

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.3), ease: [0.22, 1, 0.36, 1] }}
      className={`group relative  overflow-hidden rounded-2xl border p-5 sm:p-6 transition-all duration-400
        ${
          isTop
            ? "bg-linear-to-br from-amber-500/[0.12] via-slate-900/90 to-slate-950 border-amber-500/30 hover:border-amber-400/50 hover:shadow-[0_0_50px_-12px_rgba(251,191,36,0.35)]"
            : "bg-slate-900/70 border-slate-700/40 hover:border-slate-600/70 hover:bg-slate-900/90 hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.5)]"
        }`}
    >
      {/* Glow for top reviews */}
      {isTop && (
        <>
          <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-28 bg-amber-400/20 blur-[50px] rounded-full" />
          <div className="pointer-events-none absolute top-0 inset-x-0 h-px bg-linear-to-l from-transparent via-amber-400/50 to-transparent" />
        </>
      )}

      {/* Quote watermark */}
      <Quote
        className={`absolute top-5 left-5 w-10 h-10 opacity-[0.06] rotate-180 transition-opacity duration-300 group-hover:opacity-[0.12] ${
          isTop ? "text-amber-400" : "text-slate-400"
        }`}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div
              className={`relative w-11 h-11 rounded-full flex items-center justify-center text-sm font-black shrink-0
                ${
                  isTop
                    ? "bg-linear-to-br from-amber-300 via-amber-400 to-orange-500 text-black shadow-lg shadow-amber-500/30"
                    : "bg-slate-800 text-slate-300 border border-slate-700"
                }`}
            >
              {name.charAt(0)}
              {isTop && (
                <span className="absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full bg-slate-950 flex items-center justify-center">
                  <BadgeCheck className="w-3 h-3 text-amber-400" />
                </span>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-slate-100 font-bold text-sm truncate flex items-center gap-1.5">
                {name}
              </p>
              <p className="text-slate-500 text-[11px] mt-0.5">{formattedDate}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <Stars rating={rating} size={13} />
            {isTop && (
              <span className="text-[9px] font-bold tracking-wider text-amber-400/80 uppercase">
                تقييم كامل
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <p className="text-slate-300/95 text-[13px] sm:text-sm leading-[1.75]">
          {expanded ? review.review : review.review?.slice(0, 140)}
          {review.review && review.review.length > 140 && (
            <>
              {!expanded && <span className="text-slate-500">...</span>}
              <button
                onClick={() => toggle(review.id)}
                className="mr-1.5 text-amber-400 hover:text-amber-300 font-bold text-xs transition-colors underline underline-offset-2 decoration-amber-400/30 hover:decoration-amber-300"
              >
                {expanded ? "عرض أقل" : "اقرأ المزيد"}
              </button>
            </>
          )}
        </p>
      </div>
    </motion.article>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────
export default function ReviewsRating({ model }) {
  const {
    reviews,
    averageRating,
    totalReviews,
    loadingReviews,
    expandedReviews,
    toggleReview,
  } = useReviewsRating(12);

  const avg = Number(averageRating) || 0;

  return (
    <section className="relative max-w-5xl mx-auto" dir="rtl">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[300px] bg-amber-500/[0.07] blur-[110px] rounded-full" />
      <div className="pointer-events-none absolute top-40 -right-20 w-64 h-64 bg-orange-500/4 blur-[80px] rounded-full" />

      {/* ── Header ── */}
      <div className="relative mb-12 sm:mb-14">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          {/* Title */}
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-4"
            >
              <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase text-amber-400 bg-amber-500/10 border border-amber-500/25 px-3.5 py-1.5 rounded-full shadow-[0_0_20px_-5px_rgba(251,191,36,0.4)]">
                <Sparkles className="w-3 h-3" />
                تقييمات حقيقية
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-[1.15]"
            >
              آراء{" "}
              <span className="relative inline-block">
                <span className="bg-linear-to-l from-amber-200 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  طلابنا
                </span>
                <span className="absolute -bottom-1 inset-x-0 h-[3px] bg-linear-to-l from-amber-400/0 via-amber-400/70 to-amber-400/0 rounded-full" />
              </span>
            </motion.h2>

            {/* Rating summary */}
            {!loadingReviews && reviews.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.12 }}
                className="flex flex-wrap items-center gap-4 mt-6"
              >
                {/* Score badge */}
                <div className="flex items-center gap-3 bg-slate-950/80 border border-amber-500/25 rounded-2xl px-5 py-3 shadow-[0_0_40px_-10px_rgba(251,191,36,0.35)] backdrop-blur-sm">
                  <span className="text-3xl sm:text-4xl font-black text-amber-400 tabular-nums tracking-tight">
                    {avg.toFixed(1)}
                  </span>
                  <div className="flex flex-col gap-1">
                    <Stars rating={Math.round(avg)} size={15} gap="gap-0.5" />
                    <span className="text-[10px] text-slate-400 font-medium">
                      من أصل 5 نجوم
                    </span>
                  </div>
                </div>

                <div className="hidden sm:block h-10 w-px bg-slate-700/50" />

                <p className="text-slate-400 text-sm leading-relaxed">
                  بناءً على{" "}
                  <span className="text-white font-bold text-base">
                    {totalReviews}
                  </span>{" "}
                  تقييم من طلاب حقيقيين
                </p>
              </motion.div>
            )}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="shrink-0"
          >
            <Button />
          </motion.div>
        </div>
      </div>

      {/* ── Content ── */}
      {loadingReviews ? (
        <div className="flex flex-col items-center justify-center py-28 gap-5">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-[3px] border-amber-500/15" />
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-amber-400 animate-spin" />
            <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-orange-400/60 animate-spin [animation-direction:reverse] [animation-duration:0.8s]" />
          </div>
          <p className="text-slate-400 text-sm font-medium">
            جاري تحميل التقييمات...
          </p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="relative overflow-hidden rounded-3xl border border-slate-700/40 bg-slate-900/40 py-24 px-6 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.07),transparent_65%)]" />
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800/80 border border-slate-700/50 flex items-center justify-center">
              <MessageCircle className="w-9 h-9 text-slate-500" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-slate-200">
              لا توجد تقييمات بعد
            </p>
            <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
              كن أول من يشارك تجربته ويساعد زملاءه في اتخاذ القرار
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 max-h-[640px] overflow-y-auto pl-1 pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700 hover:scrollbar-thumb-slate-600">
          {reviews.map((review, idx) => (
            <ReviewCard
              key={review.id}
              review={review}
              index={idx}
              expanded={!!expandedReviews[review.id]}
              toggle={toggleReview}
            />
          ))}
        </div>
      )}
    </section>
  );
}