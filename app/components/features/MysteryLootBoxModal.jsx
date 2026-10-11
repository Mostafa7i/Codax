"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Package,
  Gift,
  Coins,
  ChevronRight,
  Shield,
  Award,
  Crown,
  Zap,
  Flame,
  CheckCircle2,
  RefreshCw,
  Info,
} from "lucide-react";
import Swal from "sweetalert2";
import { openLootBox } from "@/app/services/gamificationFeaturesService";
import { useGamificationFeatures } from "@/app/hooks/useGamificationFeatures";

// مؤثر صوتي خفيف عند الفتح عبر Web Audio API لضمان عمله في كل المتصفحات
function playOpeningSound(type = "normal") {
  try {
    if (typeof window === "undefined") return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === "suspense") {
      // صوت دوران/حماس
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 1.2);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } else {
      // نغمة فوز مبهجة
      const notes = [261.63, 329.63, 392.0, 523.25, 659.25];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.45);
      });
    }
  } catch {
    // Web audio might be blocked without prior user interaction
  }
}

const BOX_VISUALS = {
  bronze_box: {
    theme: "amber",
    border: "border-amber-600/50",
    bg: "bg-linear-to-b from-amber-950/40 via-amber-900/20 to-slate-900",
    glow: "shadow-amber-500/20",
    badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    iconColor: "text-amber-400",
    emoji: "🥉",
  },
  silver_box: {
    theme: "cyan",
    border: "border-cyan-500/50",
    bg: "bg-linear-to-b from-cyan-950/40 via-sky-900/20 to-slate-900",
    glow: "shadow-cyan-500/20",
    badgeBg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    iconColor: "text-cyan-400",
    emoji: "🥈",
  },
  legendary_box: {
    theme: "purple",
    border: "border-amber-400/60 ring-2 ring-amber-400/30",
    bg: "bg-linear-to-b from-purple-950/60 via-amber-950/30 to-slate-900",
    glow: "shadow-purple-500/30",
    badgeBg: "bg-linear-to-r from-amber-500/30 to-purple-500/30 text-amber-300 border-amber-400/40",
    iconColor: "text-amber-400",
    emoji: "👑",
  },
};

export default function MysteryLootBoxModal({
  open,
  onClose,
  studentData,
  studentDocId,
  onSuccess = () => {},
}) {
  const { lootBoxesConfig } = useGamificationFeatures();
  const boxes = Array.isArray(lootBoxesConfig?.boxes) ? lootBoxesConfig.boxes : [];

  const [selectedBoxId, setSelectedBoxId] = useState(boxes[0]?.id || "bronze_box");
  const [openingState, setOpeningState] = useState("idle"); // "idle" | "opening" | "revealed"
  const [wonPrizeData, setWonPrizeData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (boxes.length > 0 && !boxes.some((b) => b.id === selectedBoxId)) {
      setSelectedBoxId(boxes[0].id);
    }
  }, [boxes, selectedBoxId]);

  if (!open) return null;

  const currentBox = boxes.find((b) => b.id === selectedBoxId) || boxes[0];
  const visual = BOX_VISUALS[currentBox?.id] || BOX_VISUALS.bronze_box;
  const studentScore = Number(studentData?.score) || 0;
  const cost = Number(currentBox?.cost) || 30;
  const canAfford = studentScore >= cost;

  const handleOpenBox = async () => {
    if (!currentBox) return;
    if (!canAfford) {
      Swal.fire({
        icon: "warning",
        title: "نقاط غير كافية",
        text: `تحتاج إلى ${cost} نقطة لفتح هذا الصندوق، ورصيدك الحالي ${studentScore} نقطة.`,
        confirmButtonText: "حسناً",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    try {
      setErrorMsg("");
      setOpeningState("opening");
      playOpeningSound("suspense");

      // وقت تحميسي لفتح الصندوق
      const [result] = await Promise.all([
        openLootBox({
          studentDocId,
          studentName: studentData?.name,
          boxId: currentBox.id,
          boxConfig: currentBox,
        }),
        new Promise((resolve) => setTimeout(resolve, 1800)),
      ]);

      setWonPrizeData(result.wonPrize);
      setOpeningState("revealed");
      playOpeningSound("win");
      onSuccess();
    } catch (err) {
      console.error(err);
      setOpeningState("idle");
      setErrorMsg(err.message || "حدث خطأ أثناء فتح الصندوق.");
      Swal.fire({
        icon: "error",
        title: "تعذر فتح الصندوق",
        text: err.message || "حدث خطأ غير متوقع.",
        confirmButtonText: "حسناً",
      });
    }
  };

  const handleReset = () => {
    setOpeningState("idle");
    setWonPrizeData(null);
  };

  // حساب مجموع الأوزان لحساب النسب المئوية للجوائز
  const totalWeight = (currentBox?.prizes || []).reduce((s, p) => s + (Number(p.weight) || 0), 0) || 1;

  return (
    <div
      className="fixed inset-0  z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      dir="rtl"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className={`w-full  max-h-svh overflow-y-scroll max-w-2xl bg-slate-900/95 border ${visual.border} rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden my-8`}
      >
        {/* خلفية جمالية */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* زر الإغلاق */}
        <button
          type="button"
          onClick={() => {
            if (openingState === "opening") return;
            handleReset();
            onClose();
          }}
          disabled={openingState === "opening"}
          className="absolute top-5 left-5 p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-all z-10 disabled:opacity-30 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* الهيدر */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-6 h-6 rounded-2xl bg-linear-to-br from-amber-500/30 to-purple-600/30 border border-amber-400/30 flex items-center justify-center text-2xl shadow-lg">
            🎁
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-100 flex items-center gap-2">
              <span>صناديق المفاجآت الغامضة</span>
            </h3>
            <p className="text-xs text-slate-400">
              افتح الصناديق واحظَ بفرصة ربح نقاط، بطاقات نادرة، أو إطارات خرافية!
            </p>
          </div>
        </div>

        {/* حالة الصندوق: إما الاختيار، أو الفتح والنتيجة */}
        {openingState === "idle" && (
          <div className="space-y-6">
            {/* أزرار اختيار نوع الصندوق */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {boxes.map((box) => {
                const isSel = box.id === selectedBoxId;
                const bVis = BOX_VISUALS[box.id] || BOX_VISUALS.bronze_box;
                return (
                  <button
                    key={box.id}
                    type="button"
                    onClick={() => setSelectedBoxId(box.id)}
                    className={`relative p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${
                      isSel
                        ? `${bVis.bg} ${bVis.border} shadow-lg scale-102`
                        : "bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600"
                    }`}
                  >
                    <span className="text-3xl">{bVis.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-black text-slate-100 truncate">
                        {box.name}
                      </p>
                      <span className="text-[11px] font-bold text-amber-400 flex items-center justify-center gap-1 mt-0.5">
                        <Coins className="w-3 h-3" />
                        {box.cost} نقطة
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* تفاصيل الصندوق المختار */}
            {currentBox && (
              <div className={`p-5 rounded-2xl border ${visual.border} ${visual.bg} space-y-4`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
                  <div>
                    <h4 className="font-black text-base text-slate-100 flex items-center gap-2">
                      <span>{visual.emoji}</span>
                      <span className="text-xs">{currentBox.name}</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {currentBox.description || "صندوق مميز يحتوي على مكافآت عشوائية قيمة."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-slate-700 self-start sm:self-auto">
                    <span className="text-xs text-slate-400">التكلفة:</span>
                    <span className="text-sm font-black text-amber-400 flex items-center gap-1">
                      <Coins className="w-4 h-4" />
                      {cost} نقطة
                    </span>
                  </div>
                </div>

                {/* جدول احتمالات الجوائز */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      محتويات الصندوق ونسب الحصول:
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {currentBox.prizes?.length || 0} جائزة محتملة
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {(currentBox.prizes || []).map((prize, idx) => {
                      const prob = Math.round(((Number(prize.weight) || 0) / totalWeight) * 1000) / 10;
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base shrink-0">{prize.icon || "🎁"}</span>
                            <span className="font-bold text-slate-200 truncate">
                              {prize.label}
                            </span>
                          </div>
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded-lg text-[11px] shrink-0 ${
                              prob <= 5
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : prob <= 20
                                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                  : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {prob}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* شريط حالة الرصيد وزر الفتح */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">رصيدك الحالي:</span>
                <span className="font-black text-amber-400 flex items-center gap-1">
                  <Coins className="w-4 h-4" />
                  {studentScore} نقطة
                </span>
                {!canAfford && (
                  <span className="text-rose-400 font-bold mr-1">
                    (ينقصك {cost - studentScore} نقطة)
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleOpenBox}
                disabled={!canAfford}
                className="w-full sm:w-auto p-2 rounded-2xl bg-linear-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Gift className="w-5 h-5" />
                <span className="text-xs md:text-base">فتح الصندوق الآن ({cost} نقطة) 🎁</span>
              </button>
            </div>
          </div>
        )}

        {/* أنيميشن فتح الصندوق */}
        {openingState === "opening" && (
          <div className="py-16 text-center space-y-6">
            <motion.div
              animate={{
                rotate: [0, -10, 10, -12, 12, -8, 8, 0],
                scale: [1, 1.08, 0.95, 1.15, 1],
                y: [0, -15, 0, -20, 0],
              }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="inline-block"
            >
              <div className="w-32 h-32 mx-auto rounded-3xl bg-linear-to-br from-amber-400 via-purple-500 to-indigo-600 p-1 shadow-2xl shadow-amber-500/40 animate-pulse">
                <div className="w-full h-full rounded-[22px] bg-slate-900 flex items-center justify-center text-6xl">
                  🎁
                </div>
              </div>
            </motion.div>

            <div className="space-y-1.5">
              <h4 className="text-lg font-black text-amber-300 animate-pulse">
                جاري فتح {currentBox?.name}...
              </h4>
              <p className="text-xs text-slate-400">
                ترقب المفاجأة! ما الجائزة التي ستحصل عليها؟ ✨
              </p>
            </div>
          </div>
        )}

        {/* عرض النتيجة والربح */}
        {openingState === "revealed" && wonPrizeData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-8 text-center space-y-6"
          >
            <div className="relative inline-block">
              {/* هالة دائرية براقة */}
              <div className="absolute -inset-6 rounded-full bg-linear-to-r from-amber-400 via-purple-500 to-pink-500 opacity-60 blur-xl animate-spin [animation-duration:6s]" />

              <div className="relative w-28 h-28 mx-auto rounded-3xl bg-linear-to-br from-slate-800 to-slate-900 border-2 border-amber-400 p-2 shadow-2xl flex items-center justify-center text-5xl">
                <span>{wonPrizeData.icon || "🎉"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                مبروك! لقد ربحت 🎉
              </span>
              <h4 className="text-2xl font-black text-slate-100">
                {wonPrizeData.label}
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                تمت إضافة الجائزة تلقائياً إلى حسابك وبروفايلك بنجاح!
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                <span>فتح صندوق آخر 🎁</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleReset();
                  onClose();
                }}
                className="px-6 py-2.5 rounded-2xl bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تم واستلام الجائزة ✅</span>
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
