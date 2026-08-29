"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Clock,
  RotateCw,
  PartyPopper,
  AlertCircle,
  Gift,
} from "lucide-react";
import { doc, updateDoc, increment, arrayUnion } from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig";
import Swal from "sweetalert2";
import {
  DEFAULT_WHEEL_SECTORS,
  DEFAULT_WHEEL_CONFIG,
  subscribeLuckyWheelConfig,
  getWeightedSectorIndex,
} from "@/app/utils/luckyWheelConfig";

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function getSectorPath(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", x, y,
    "L", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    "Z",
  ].join(" ");
}

export default function LuckyWheelModal({
  open,
  onClose,
  studentDocId,
  lastSpinTimestamp = null,
  paidSpinsCount = 0,
  bonusSpinCount = 0,
  studentScore = 0,
  onSpinSuccess = () => {},
}) {
  const [wheelConfig, setWheelConfig] = useState(DEFAULT_WHEEL_CONFIG);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [canSpin, setCanSpin] = useState(true);
  const [bonusSpins, setBonusSpins] = useState(bonusSpinCount);
  const [showPrizeList, setShowPrizeList] = useState(false);

  // استماع لحظي لإعدادات الأدمن من Firestore
  useEffect(() => {
    const unsub = subscribeLuckyWheelConfig((newConfig) => {
      if (newConfig) {
        setWheelConfig(newConfig);
      }
    });
    return () => unsub();
  }, []);

  const sectors = useMemo(() => {
    return wheelConfig.sectors || DEFAULT_WHEEL_SECTORS;
  }, [wheelConfig]);

  const cooldownHours = wheelConfig.cooldownHours ?? 24;
  const isWheelActive = wheelConfig.isActive ?? true;
  const paidSpinCost = 20 * 2 ** Math.max(0, Number(paidSpinsCount) || 0);

  const totalSectors = sectors.length;
  const sectorAngle = 360 / totalSectors;
  const size = 300;
  const center = size / 2;
  const radius = center - 8;

  // حساب حالة التوفر والعد التنازلي بناءً على فترة الـ cooldown المحددة
  useEffect(() => {
    if (!lastSpinTimestamp) {
      setCanSpin(true);
      setTimeLeft(null);
      return;
    }

    const checkAvailability = () => {
      const last = new Date(lastSpinTimestamp).getTime();
      if (isNaN(last)) {
        setCanSpin(true);
        setTimeLeft(null);
        return;
      }

      const now = Date.now();
      const diffMs = now - last;
      const cooldownMs = cooldownHours * 60 * 60 * 1000;

      if (diffMs < cooldownMs) {
        setCanSpin(false);
        const remainingMs = cooldownMs - diffMs;
        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      } else {
        setCanSpin(true);
        setTimeLeft(null);
      }
    };

    checkAvailability();
    const interval = setInterval(checkAvailability, 1000);
    return () => clearInterval(interval);
  }, [lastSpinTimestamp, cooldownHours]);

  const handleSpin = async () => {
    if (isSpinning) return;

    const isBonusSpin = !canSpin && bonusSpins > 0;
    const isPaidSpin = !canSpin && !isBonusSpin;
    if (isPaidSpin && studentScore < paidSpinCost) {
      Swal.fire("نقاط غير كافية", `تحتاج إلى ${paidSpinCost} نقطة للفة التالية، ورصيدك ${studentScore} نقطة.`, "warning");
      return;
    }
    if (!isWheelActive) {
      Swal.fire("تنبيه", "عجلة الحظ مغلقة حالياً للصيانة", "info");
      return;
    }
    if (!studentDocId) {
      Swal.fire("تنبيه", "بيانات الطالب غير مكتملة", "warning");
      return;
    }

    setIsSpinning(true);
    setWonPrize(null);
    if (isBonusSpin) setBonusSpins((count) => Math.max(0, count - 1));

    // اختيار جائزة بناءً على النسب المئوية المحددة من الأدمن
    const winningIndex = getWeightedSectorIndex(sectors);
    const selectedSector = sectors[winningIndex];

    // زاوية التوقف المطلوبة (المؤشر في الأعلى عند 0 / 360 درجة)
    const targetAngle = 360 * 6 + (360 - (winningIndex * sectorAngle + sectorAngle / 2));
    const newRotation = rotation + targetAngle + (360 - (rotation % 360));
    setRotation(newRotation);

    // انتهاء دوران العجلة بعد 4.3 ثانية
    setTimeout(async () => {
      setIsSpinning(false);
      setWonPrize(selectedSector);

      try {
        const studentRef = doc(db, "students", studentDocId);
        const updates = {};
        const pointPrize = selectedSector.type === "points" ? selectedSector.value : 0;
        const scoreChange = pointPrize - (isPaidSpin ? paidSpinCost : 0);
        if (scoreChange) updates.score = increment(scoreChange);

        if (selectedSector.type === "points") {
          // تمت إضافة النقاط مع خصم تكلفة اللفة المدفوعة في scoreChange أعلاه
        } else if (selectedSector.type === "reserve") {
          updates.reserveAttendanceCount = increment(selectedSector.value);
        } else if (selectedSector.type === "badge") {
          updates.unlockedBadges = arrayUnion(selectedSector.value);
        } else if (selectedSector.type === "exclusive_border") {
          // إطار حصري من العجلة فقط
          updates.unlockedBorders = arrayUnion(selectedSector.value);
          updates.activeBorder = selectedSector.value;
        }

        // اللفة المجانية تبدأ دورة 24 ساعة جديدة؛ اللفات المدفوعة تتضاعف داخلها.
        if (canSpin) {
          updates.lastSpinTimestamp = new Date().toISOString();
          updates.wheelPaidSpins = 0;
        } else if (isPaidSpin) {
          updates.wheelPaidSpins = increment(1);
        }
        if (selectedSector.type === "spin_again") {
          updates.wheelBonusSpins = increment(1);
          setBonusSpins((count) => count + 1);
        } else if (isBonusSpin) {
          updates.wheelBonusSpins = increment(-1);
        }

        await updateDoc(studentRef, updates);
        onSpinSuccess(selectedSector);
      } catch (err) {
        console.error("Error saving lucky spin result:", err);
      }
    }, 4300);
  };

  // رسالة الفوز المخصصة
  const getWinMessage = (prize) => {
    if (!prize) return "";
    if (prize.type === "exclusive_border") {
      return `🤯 لا يُصدَّق! ربحت الإطار الأسطوري الحصري: ${prize.icon} ${prize.label}! هذا الإطار لا يُشترى من المتجر!`;
    }
    if (prize.type === "badge") {
      return `مبروك! ربحت لقب: ${prize.icon} ${prize.label} 🎉`;
    }
    if (prize.type === "spin_again") {
      return `🔄 يا محظوظ! ربحت لفة إضافية مجانية! دوّر مرة ثانية!`;
    }
    return `مبروك! ربحت: ${prize.icon} ${prize.label} 🎉`;
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="lucky-wheel-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => {
            if (!isSpinning) onClose();
          }}
          dir="rtl"
        >
          <motion.div
            key="lucky-wheel-modal"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-sm p-6 relative shadow-[0_0_50px_rgba(245,158,11,0.25)] text-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* زر الإغلاق */}
            {!isSpinning && (
              <button
                onClick={onClose}
                className="absolute top-4 left-4 z-20 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            )}

            {/* العنوان */}
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-2xl">🎡</span>
              <h2 className="text-xl font-black text-white bg-linear-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text">
                عجلة الحظ اليومية
              </h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              لف العجلة كل {cooldownHours} ساعة واكسب نقاطاً وجوائز حصرية ترفع ترتيبك!
            </p>

            <button
              type="button"
              onClick={() => setShowPrizeList((visible) => !visible)}
              className="mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full border border-violet-400/35 bg-violet-500/10 px-3 py-1.5 text-xs font-bold text-violet-200 transition hover:bg-violet-500/20"
            >
              <Gift className="h-3.5 w-3.5 text-fuchsia-300" />
              {showPrizeList ? "إخفاء الجوائز" : "عرض جوائز العجلة"}
            </button>

            <AnimatePresence>
              {showPrizeList && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950/55 text-right"
                >
                  <div className="border-b border-slate-700/70 px-3 py-2 text-center text-xs font-black text-amber-300">
                    الجوائز المتاحة الآن
                  </div>
                  <div className="max-h-44 space-y-1 overflow-y-auto p-2">
                    {sectors.filter((sector) => sector.enabled !== false && Number(sector.percentage) > 0).map((sector) => (
                      <div key={sector.id} className="rounded-xl bg-slate-800/75 px-2.5 py-2 text-xs">
                        <span className="font-bold text-slate-100">{sector.icon} {sector.label}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* حالة العجلة إذا كانت مغلقة من الأدمن */}
            {!isWheelActive ? (
              <div className="my-8 p-6 bg-slate-800/80 rounded-2xl border border-amber-500/30 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto animate-pulse" />
                <h3 className="font-bold text-white text-sm">عجلة الحظ مغلقة مؤقتاً</h3>
                <p className="text-xs text-slate-400">
                  العجلة تخضع للصيانة وتحديث الجوائز حالياً، يرجى المحاولة لاحقاً.
                </p>
              </div>
            ) : (
              <>
                {/* حاوية العجلة مع المؤشر */}
                <div className="relative flex items-center justify-center my-2">
                  {/* المؤشر العلوي */}
                  <div className="absolute -top-3.5 z-30 flex flex-col items-center">
                    <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-amber-400 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] animate-bounce" />
                  </div>

                  {/* عجلة الـ SVG التفاعلية */}
                  <div className="relative p-2 rounded-full bg-linear-to-tr from-amber-500/30 via-slate-800 to-cyan-500/30 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                    <svg
                      width={size}
                      height={size}
                      viewBox={`0 0 ${size} ${size}`}
                      style={{
                        transform: `rotate(${rotation}deg)`,
                        transition: isSpinning
                          ? "transform 4.3s cubic-bezier(0.12, 0.9, 0.18, 1)"
                          : "none",
                      }}
                      className="rounded-full select-none"
                    >
                      {/* تدرجات إشعاعية خلف القطاعات */}
                      <defs>
                        {sectors.map((sector, i) => (
                          <radialGradient key={`grad-${i}`} id={`modalSectorGrad-${i}`} cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
                            <stop offset="100%" stopColor={sector.color} stopOpacity="1" />
                          </radialGradient>
                        ))}
                      </defs>

                      <g>
                        {sectors.map((sector, i) => {
                          const startAngle = i * sectorAngle;
                          const endAngle = (i + 1) * sectorAngle;
                          const path = getSectorPath(center, center, radius, startAngle, endAngle);
                          const midAngle = startAngle + sectorAngle / 2;
                          const isExclusive = sector.type === "exclusive_border";

                          return (
                            <g key={i}>
                              <path
                                d={path}
                                fill={`url(#modalSectorGrad-${i})`}
                                stroke="#1e293b"
                                strokeWidth="2"
                              />
                              <path
                                d={path}
                                fill="none"
                                stroke="rgba(255,255,255,0.15)"
                                strokeWidth="1"
                              />
                              {/* النص والأيقونة داخل القطاع */}
                              <g
                                transform={`rotate(${midAngle}, ${center}, ${center})`}
                              >
                                <text
                                  x={center}
                                  y={center - radius + 28}
                                  fill={sector.textColor}
                                  fontSize={isExclusive ? "10" : "11"}
                                  fontWeight="bold"
                                  textAnchor="middle"
                                  style={{ fontFamily: "inherit" }}
                                >
                                  {sector.icon}
                                </text>
                                <text
                                  x={center}
                                  y={center - radius + 42}
                                  fill={sector.textColor}
                                  fontSize="9"
                                  fontWeight="bold"
                                  textAnchor="middle"
                                  style={{ fontFamily: "inherit" }}
                                >
                                  {sector.label}
                                </text>
                              </g>
                            </g>
                          );
                        })}
                      </g>

                      {/* دائرة المنتصف الزخرفية */}
                      <circle
                        cx={center}
                        cy={center}
                        r={28}
                        fill="#0f172a"
                        stroke="#fbbf24"
                        strokeWidth="3"
                      />
                      <circle
                        cx={center}
                        cy={center}
                        r={10}
                        fill="#f59e0b"
                      />
                    </svg>
                  </div>
                </div>

                {/* إشعار الفوز عند التوقف */}
                {wonPrize && !isSpinning && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`my-3 p-3 rounded-2xl border flex items-center justify-center gap-2 shadow-lg ${
                      wonPrize.type === "exclusive_border"
                        ? "bg-linear-to-r from-violet-500/30 via-fuchsia-500/20 to-purple-500/30 border-fuchsia-400/60 text-fuchsia-200"
                        : "bg-linear-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-amber-500/40 text-amber-300"
                    }`}
                  >
                    <PartyPopper className={`w-5 h-5 ${
                      wonPrize.type === "exclusive_border" ? "text-fuchsia-400" : "text-amber-400"
                    } animate-spin`} />
                    <span className="font-bold text-xs">
                      {getWinMessage(wonPrize)}
                    </span>
                  </motion.div>
                )}

                {/* العداد التنازلي أو زر اللف */}
                <div className="mt-4">
                  {canSpin || bonusSpins > 0 || studentScore >= paidSpinCost ? (
                    <button
                      type="button"
                      onClick={handleSpin}
                      disabled={isSpinning}
                      className={`w-full py-3.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-xl ${
                        isSpinning
                          ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                          : "bg-linear-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-yellow-600 text-slate-950 shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98]"
                      }`}
                    >
                      <RotateCw
                        className={`w-4 h-4 ${isSpinning ? "animate-spin" : ""}`}
                      />
                      {isSpinning ? "جاري الدوران والبحث عن حظك..." : canSpin ? "✨ دوّر العجلة الآن مجاناً!" : bonusSpins > 0 ? "🔄 لفّة إضافية مجانية!" : `✨ دوّر مقابل ${paidSpinCost} نقطة`}
                    </button>
                  ) : (
                    <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700/60 flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>لفتك المجانية التالية ستكون متاحة بعد:</span>
                      </div>
                      {timeLeft && (
                        <div className="flex items-center gap-2 text-amber-400 font-mono font-black text-base">
                          <span>{String(timeLeft.hours).padStart(2, "0")}h</span>:
                          <span>{String(timeLeft.minutes).padStart(2, "0")}m</span>:
                          <span>{String(timeLeft.seconds).padStart(2, "0")}s</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
