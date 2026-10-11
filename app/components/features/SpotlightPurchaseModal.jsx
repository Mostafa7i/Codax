"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Star, Coins, Send, CheckCircle2 } from "lucide-react";
import Swal from "sweetalert2";
import { purchaseSpotlight } from "@/app/services/gamificationFeaturesService";
import { useGamificationFeatures } from "@/app/hooks/useGamificationFeatures";

export default function SpotlightPurchaseModal({
  open,
  onClose,
  studentData,
  studentDocId,
  onSuccess = () => {},
}) {
  const { spotlightConfig } = useGamificationFeatures();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const cost = Number(spotlightConfig?.cost) || 80;
  const durationHours = Number(spotlightConfig?.durationHours) || 24;
  const studentScore = Number(studentData?.score) || 0;
  const canAfford = studentScore >= cost;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentDocId) return;

    if (!canAfford) {
      Swal.fire({
        icon: "warning",
        title: "نقاط غير كافية",
        text: `تحتاج إلى ${cost} نقطة لتسليط الضوء على بروفايلك، ورصيدك الحالي ${studentScore} نقطة.`,
        confirmButtonText: "حسناً",
      });
      return;
    }

    const trimmedMsg = message.trim();
    if (!trimmedMsg) {
      Swal.fire({
        icon: "info",
        title: "اكتب رسالتك",
        text: "يرجى كتابة رسالة تشجيعية أو إنجازك ليظهر للجميع في البانر.",
        confirmButtonText: "حسناً",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await purchaseSpotlight({
        studentDocId,
        studentId: studentData?.id,
        studentName: studentData?.name,
        profilePic: studentData?.profilePic,
        activeBorder: studentData?.activeBorder || "default",
        activeBadge: studentData?.activeBadge || null,
        group: studentData?.group || "",
        message: trimmedMsg,
        cost,
        durationHours,
      });

      Swal.fire({
        icon: "success",
        title: "تم تسليط الضوء بنجاح! ⭐🎉",
        text: `أنت الآن نجم اليوم في الصفحة الرئيسية لمدة ${durationHours} ساعة!`,
        timer: 3000,
        showConfirmButton: false,
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: err.message || "حدث خطأ أثناء حجز تسليط الضوء.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
        onClick={onClose}
        dir="rtl"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl bg-slate-900 border border-amber-500/40 p-6 shadow-2xl text-right"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-2xl">
              ⭐
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                تسليط الضوء على بروفايلك
              </h3>
              <p className="text-xs text-slate-400">
                كن نجم اليوم في أعلى الصفحة الرئيسية أمام جميع الطلاب!
              </p>
            </div>
          </div>

          <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 mb-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">مدة الظهور:</span>
              <span className="font-bold text-amber-300">{durationHours} ساعة كاملة</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">تكلفة الميزة:</span>
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <Coins size={13} />
                <span>{cost} نقطة</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-700">
              <span className="text-slate-400">رصيد نقاطك الحالي:</span>
              <span className={`font-bold ${canAfford ? "text-emerald-400" : "text-rose-400"}`}>
                {studentScore} نقطة
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                رسالتك أو إنجازك الذي سيظهر للجميع:
              </label>
              <textarea
                rows={3}
                maxLength={120}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="مثال: سعيد بإنهاء مشروع التخرج اليوم وأتمنى التوفيق للجميع! 🚀"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition resize-none"
              />
              <span className="text-[10px] text-slate-500 block text-left mt-1">
                {message.length}/120 حرف
              </span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !canAfford}
                className={`flex-1 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                  canAfford
                    ? "bg-linear-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 shadow-amber-500/20 active:scale-95 cursor-pointer"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  <span>جاري الحجز...</span>
                ) : (
                  <>
                    <Send size={14} />
                    <span>تأكيد الحجز ({cost} نقطة)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-2xl border border-slate-700 text-slate-400 hover:bg-slate-800 text-xs font-bold transition"
              >
                إلغاء
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
