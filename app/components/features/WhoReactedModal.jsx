"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, ThumbsDown, Lock, Unlock, Eye, Sparkles, Clock, Coins, CreditCard } from "lucide-react";
import Swal from "sweetalert2";
import {
  purchaseReactionsReveal,
  fetchReactionsDetails,
} from "@/app/services/gamificationFeaturesService";
import { useGamificationFeatures } from "@/app/hooks/useGamificationFeatures";

export default function WhoReactedModal({
  open,
  onClose,
  studentData,
  studentDocId,
  isPerfectStudent = false,
  onSuccess = () => {},
}) {
  const { reactionsRevealConfig } = useGamificationFeatures();
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "likes" | "dislikes"
  const [details, setDetails] = useState({ likes: [], dislikes: [] });
  const [loading, setLoading] = useState(true);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // فحص صلاحية الكشف الحالية للطالب
  const revealExpiresAt = studentData?.reactionsRevealExpiresAt
    ? new Date(studentData.reactionsRevealExpiresAt).getTime()
    : 0;
  const isUnlocked = revealExpiresAt > Date.now();

  const costNormal = Number(reactionsRevealConfig?.costNormal) || 30;
  const costGolden = Number(reactionsRevealConfig?.costGoldenCard) || 15;
  const effectiveCost = isPerfectStudent ? costGolden : costNormal;
  const durationHours = Number(reactionsRevealConfig?.durationHours) || 48;
  const studentScore = Number(studentData?.score) || 0;
  const canAfford = studentScore >= effectiveCost;

  // جلب التفاصيل إذا كان مسموحاً له بالكشف
  useEffect(() => {
    if (!open || !studentDocId) return;

    if (isUnlocked) {
      setLoading(true);
      fetchReactionsDetails(studentDocId, studentData?.id)
        .then((data) => {
          setDetails(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [open, isUnlocked, studentDocId, studentData?.id]);

  if (!open) return null;

  const handleUnlock = async () => {
    if (!canAfford) {
      Swal.fire({
        icon: "warning",
        title: "نقاط غير كافية",
        text: `تحتاج إلى ${effectiveCost} نقطة لكشف المتفاعلين، ورصيدك الحالي ${studentScore} نقطة.`,
        confirmButtonText: "حسناً",
      });
      return;
    }

    try {
      setIsUnlocking(true);
      await purchaseReactionsReveal({
        studentDocId,
        studentName: studentData?.name,
        cost: effectiveCost,
        durationHours,
        isGoldenCard: isPerfectStudent,
      });

      const data = await fetchReactionsDetails(studentDocId, studentData?.id);
      setDetails(data);

      Swal.fire({
        icon: "success",
        title: "تم كشف المتفاعلين! 👁️✨",
        text: `تم تفعيل الصلاحية لمدة ${durationHours} ساعة.`,
        timer: 2500,
        showConfirmButton: false,
      });

      onSuccess();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: err.message || "حدث خطأ أثناء كشف المتفاعلين.",
      });
    } finally {
      setIsUnlocking(false);
    }
  };

  const allReactions = [
    ...details.likes.map((l) => ({ ...l, type: "like" })),
    ...details.dislikes.map((d) => ({ ...d, type: "dislike" })),
  ].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const filteredReactions =
    activeFilter === "likes"
      ? details.likes.map((l) => ({ ...l, type: "like" }))
      : activeFilter === "dislikes"
        ? details.dislikes.map((d) => ({ ...d, type: "dislike" }))
        : allReactions;

  const formatDate = (ts) => {
    if (!ts) return "منذ فترة";
    return new Date(ts).toLocaleString("ar-EG", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
        dir="rtl"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl text-right"
          onClick={(e) => e.stopPropagation()}
        >
          {/* زر الإغلاق */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>

          {/* العنوان */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 text-2xl">
              👁️
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                من تفاعل مع بروفايلي؟
              </h3>
              <p className="text-xs text-slate-400">
                تعرف على أسماء وهوية زملائك الذين أرسلوا لك تفاعلات
              </p>
            </div>
          </div>

          {!isUnlocked ? (
            /* ── شاشة القفل ودفع النقاط ── */
            <div className="space-y-4 py-2">
              <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Lock size={26} />
                </div>
                <h4 className="font-black text-slate-100 text-base">
                  هذه القائمة مشفرة ومحمية
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  يمكنك استثمار نقاطك لفك التشفير ومعرفة كل من تفاعل معك بالاسم والمجموعة والتوقيت الدقيق لمدة {durationHours} ساعة!
                </p>

                {isPerfectStudent && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/15 border border-yellow-500/40 text-yellow-300 text-xs font-bold animate-pulse">
                    <CreditCard size={14} />
                    <span>ميزة الكارت الذهبي: خصم 50% على الكشف!</span>
                  </div>
                )}
              </div>

              <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">تكلفة الكشف:</span>
                  <div className="flex items-center gap-1.5">
                    {isPerfectStudent && (
                      <span className="line-through text-slate-500 text-[11px]">
                        {costNormal} نقطة
                      </span>
                    )}
                    <span className="font-bold text-amber-400 flex items-center gap-1">
                      <Coins size={13} />
                      <span>{effectiveCost} نقطة</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">صلاحية الكشف:</span>
                  <span className="font-bold text-slate-300">{durationHours} ساعة</span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                  <span className="text-slate-400">رصيدك الحالي:</span>
                  <span className={`font-bold ${canAfford ? "text-emerald-400" : "text-rose-400"}`}>
                    {studentScore} نقطة
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isUnlocking || !canAfford}
                  onClick={handleUnlock}
                  className={`flex-1 py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                    canAfford
                      ? "bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-indigo-500/25 active:scale-95 cursor-pointer"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {isUnlocking ? (
                    <span>جاري فك التشفير...</span>
                  ) : (
                    <>
                      <Unlock size={14} />
                      <span>كشف المتفاعلين الآن ({effectiveCost} نقطة)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3.5 rounded-2xl border border-slate-700 text-slate-400 hover:bg-slate-800 text-xs font-bold transition"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            /* ── شاشة استعراض المتفاعلين بعد فك التشفير ── */
            <div className="space-y-4">
              {/* أزرار الفلترة */}
              <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveFilter("all")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                    activeFilter === "all"
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  الكل ({allReactions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("likes")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    activeFilter === "likes"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-blue-400/80 hover:text-blue-300"
                  }`}
                >
                  <Heart size={13} className="fill-current" />
                  <span>إعجابات ({details.likes.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter("dislikes")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    activeFilter === "dislikes"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "text-rose-400/80 hover:text-rose-300"
                  }`}
                >
                  <ThumbsDown size={13} />
                  <span>لم يعجبهم ({details.dislikes.length})</span>
                </button>
              </div>

              {/* قائمة المتفاعلين */}
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {loading ? (
                  <div className="py-12 text-center text-slate-400 text-xs animate-pulse">
                    جاري تحميل الأسماء والتفاصيل...
                  </div>
                ) : filteredReactions.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    لا توجد تفاعلات مسجلة في هذا التبويب حتى الآن.
                  </div>
                ) : (
                  filteredReactions.map((item, idx) => {
                    const isLike = item.type === "like";
                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                          isLike
                            ? "bg-blue-950/20 border-blue-500/20"
                            : "bg-rose-950/20 border-rose-500/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                              isLike
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {isLike ? <Heart size={16} className="fill-current" /> : <ThumbsDown size={16} />}
                          </div>

                          <div>
                            <p className="font-bold text-xs text-slate-200">
                              {isLike ? item.likerName : item.dislikerName}
                            </p>
                            {item.group && (
                              <p className="text-[10px] text-slate-400">
                                مجموعة: {item.group}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-left text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock size={11} />
                          <span>{formatDate(item.timestamp)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
