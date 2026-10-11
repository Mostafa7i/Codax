'use client';
import React, { useState } from "react";
import { Star, X, Send, Sparkles, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig"; // عدّل المسار لو مختلف

const ratingLabels = {
  1: "ضعيف",
  2: "مقبول",
  3: "جيد",
  4: "ممتاز",
  5: "أسطوري 🔥",
};

const CourseRating = ({ courseId = "general-course", setOpenModel }) => {
  const [name, setName] = useState("");
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const activeRating = hoverRating || rating;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      Swal.fire({
        title: "من فضلك اختر عدد النجوم",
        icon: "info",
        background: "rgba(15, 23, 42, 0.97)",
        color: "#fff",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }
    if (!review.trim()) {
      Swal.fire({
        title: "من فضلك اكتب رأيك في الكورس",
        icon: "info",
        background: "rgba(15, 23, 42, 0.97)",
        color: "#fff",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "courseRatings"), {
        courseId,
        name: name.trim() || "مجهول",
        review: review.trim(),
        rating,
        createdAt: serverTimestamp(),
      });

      setSubmitted(true);
      setName("");
      setReview("");
      setRating(0);
    } catch (error) {
      console.error("Error adding review: ", error);
      Swal.fire({
        title: "حدث خطأ",
        text: "فشل إرسال التقييم، حاول مرة أخرى",
        icon: "error",
        background: "rgba(15, 23, 42, 0.97)",
        color: "#fff",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Success State ──
  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative max-w-md mx-auto p-8 sm:p-10 text-center"
        dir="rtl"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.12),transparent_70%)] rounded-3xl" />

        <div className="relative">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-[0_0_40px_-5px_rgba(251,191,36,0.5)]">
            <CheckCircle2 className="w-10 h-10 text-black" strokeWidth={2.5} />
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">
            شكرًا لتقييمك!
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
            رأيك مهم جدًا لنا، وهيساعدنا نطور المحتوى أكتر
          </p>

          <button
            onClick={() => setOpenModel?.(false)}
            className="mt-8 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-sm font-semibold transition-all active:scale-95"
          >
            إغلاق
          </button>
        </div>
      </motion.div>
    );
  }

  // ── Form ──
  return (
    <div className="relative max-w-md mx-auto" dir="rtl">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-40 bg-amber-500/10 blur-[80px] rounded-full" />

      <div className="relative bg-slate-900/95 border border-slate-700/60 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
        {/* Top gold line */}
        <div className="h-1 bg-linear-to-l from-amber-500 via-yellow-400 to-orange-500" />

        {/* Close button */}
        {setOpenModel && (
          <button
            type="button"
            onClick={() => setOpenModel(false)}
            className="absolute top-3 left-3 z-20 w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-red-500/20 border border-slate-700 hover:border-red-500/40 flex items-center justify-center text-slate-400 hover:text-red-400 transition-all active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] uppercase text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full mb-3">
              <Sparkles className="w-3 h-3" />
              تقييمك يهمنا
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              قيّم{" "}
              <span className="bg-linear-to-l from-amber-300 to-orange-400 bg-clip-text text-transparent">
                تجربتك
              </span>
            </h2>
            <p className="text-slate-400 text-sm mt-1.5">
              ساعدنا نتحسن برأيك الصادق
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Stars */}
            <div className="text-center">
              <div className="flex justify-center gap-1.5 sm:gap-2.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isActive = star <= activeRating;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform duration-200 hover:scale-125 active:scale-95"
                    >
                      <Star
                        size={40}
                        strokeWidth={isActive ? 0 : 1.5}
                        className={`transition-all duration-200 ${
                          isActive
                            ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                            : "text-slate-600 hover:text-slate-500"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                <motion.p
                  key={activeRating}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className={`mt-2.5 text-sm font-semibold ${
                    activeRating
                      ? "text-amber-400"
                      : "text-slate-500"
                  }`}
                >
                  {activeRating
                    ? `${activeRating} من 5 — ${ratingLabels[activeRating]}`
                    : "اضغط على النجوم للتقييم"}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                الاسم <span className="text-slate-600">(اختياري)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اكتب اسمك..."
                maxLength={24}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition"
              />
            </div>

            {/* Review */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                رأيك في الكورس
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="إيه اللي عجبك؟ إيه اللي محتاج يتحسن؟..."
                required
                rows={4}
                maxLength={600}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition resize-none leading-relaxed"
              />
              <p className="text-[11px] text-slate-500 mt-1 text-left tabular-nums">
                {review.length}/600
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-linear-to-l from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-sm shadow-lg shadow-amber-500/25 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  إرسال التقييم
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CourseRating;