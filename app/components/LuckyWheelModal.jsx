"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Clock,
  RotateCw,
  PartyPopper,
  AlertCircle,
  Gift,
  CreditCard,
  Diamond,
  ShipWheel,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  doc,
  updateDoc,
  increment,
  arrayUnion,
  addDoc,
  collection,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig";
import Swal from "sweetalert2";
import {
  DEFAULT_WHEEL_SECTORS,
  DEFAULT_WHEEL_CONFIG,
  subscribeLuckyWheelConfig,
  getWeightedSectorIndex,
} from "@/app/utils/luckyWheelConfig";
import { AVATAR_BORDERS } from "@/app/utils/avatarDecorations";

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
    "M",
    x,
    y,
    "L",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
    "Z",
  ].join(" ");
}

export default function LuckyWheelModal({
  open,
  onClose,
  studentDocId,
  studentName = "طالب",
  lastSpinTimestamp = null,
  paidSpinsCount = 0,
  bonusSpinCount = 0,
  studentScore = 0,
  greenCardsCount = 0,
  blueCardsCount = 0,
  studentGroup = "",
  onSpinSuccess = () => {},
}) {
  const [wheelConfig, setWheelConfig] = useState(DEFAULT_WHEEL_CONFIG);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [canSpin, setCanSpin] = useState(true);
  const [bonusSpins, setBonusSpins] = useState(bonusSpinCount);
  const [greenCards, setGreenCards] = useState(Number(greenCardsCount) || 0);
  const [blueCards, setBlueCards] = useState(Number(blueCardsCount) || 0);
  const [cardMode, setCardMode] = useState("none"); // "none" | "green" | "blue"
  const [soundEnabled, setSoundEnabled] = useState(true);

  // استرجاع تفضيل الصوت من localStorage بأمان
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("codax_wheel_sound");
      if (saved !== null) {
        setSoundEnabled(saved === "true");
      }
    }
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("codax_wheel_sound", String(next));
      }
      return next;
    });
  }, []);

  // ── صوت العجلة (Web Audio API — لا ملفات خارجية) ──────────────────────────
  const audioCtxRef = useRef(null);
  const tickIntervalRef = useRef(null);
  const spinStartTimeRef = useRef(null);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new (
        window.AudioContext || window.webkitAudioContext
      )();
    }
    return audioCtxRef.current;
  }, []);

  /** صوت نقرة خفيفة للأزرار */
  const playClickSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(850, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.06);
    } catch (_) {}
  }, [getAudioCtx, soundEnabled]);

  /** صوت طقطقة واحدة (tick) */
  const playTick = useCallback(
    (volume = 0.4, pitch = 800) => {
      if (!soundEnabled) return;
      try {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(pitch, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(
          pitch * 0.5,
          ctx.currentTime + 0.04,
        );
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.07);
      } catch (_) {}
    },
    [getAudioCtx, soundEnabled],
  );

  /** صوت الفوز — نغمة صاعدة بهيجة */
  const playWinSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        const t = ctx.currentTime + i * 0.12;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.35, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.start(t);
        osc.stop(t + 0.35);
      });
    } catch (_) {}
  }, [getAudioCtx, soundEnabled]);

  /** بدء جدول الطقطقة — يسرع في البداية ويتباطأ في النهاية */
  const startSpinSound = useCallback(
    (totalDurationMs = 4300) => {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
      if (!soundEnabled) return;
      spinStartTimeRef.current = Date.now();

      const tick = () => {
        const elapsed = Date.now() - spinStartTimeRef.current;
        const progress = Math.min(elapsed / totalDurationMs, 1); // 0 → 1

        // المعادلة: يبدأ بـ 60ms بين الطقطقات ويصل لـ 600ms في النهاية
        const minInterval = 55;
        const maxInterval = 650;
        const interval =
          minInterval + (maxInterval - minInterval) * Math.pow(progress, 2.5);

        // الحجم والطبقة تتناسب عكسياً مع التقدم
        const volume = 0.5 - progress * 0.25;
        const pitch = 900 - progress * 400;
        playTick(volume, pitch);

        if (progress < 1) {
          tickIntervalRef.current = setTimeout(tick, interval);
        }
      };

      tickIntervalRef.current = setTimeout(tick, 60);
    },
    [playTick, soundEnabled],
  );

  const stopSpinSound = useCallback(() => {
    if (tickIntervalRef.current) {
      clearTimeout(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
  }, []);

  // تنظيف عند إغلاق المودال
  useEffect(() => {
    if (!open) {
      stopSpinSound();
    }
  }, [open, stopSpinSound]);
  // ─────────────────────────────────────────────────────────────────────────────

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

  const greenCardSectors = useMemo(() => {
    const configuredIds = Array.isArray(wheelConfig.greenCardBorderIds)
      ? wheelConfig.greenCardBorderIds
      : DEFAULT_WHEEL_CONFIG.greenCardBorderIds;

    return configuredIds
      .map((id) => AVATAR_BORDERS.find((border) => border.id === id))
      .filter(Boolean)
      .map((border, index) => ({
        id: `green_card_${border.id}`,
        label: border.name,
        icon: border.previewEmoji || "✨",
        type: "green_card_border",
        value: border.id,
        color: ["#047857", "#059669", "#0f766e", "#15803d", "#166534"][
          index % 5
        ],
        textColor: "#ecfdf5",
        percentage: 1,
        enabled: true,
      }));
  }, [wheelConfig.greenCardBorderIds]);

  const blueCardSectors = useMemo(() => {
    const configuredItems = Array.isArray(wheelConfig.blueCardItems)
      ? wheelConfig.blueCardItems
      : DEFAULT_WHEEL_CONFIG.blueCardItems;

    return configuredItems
      .map((item, index) => {
        const border = AVATAR_BORDERS.find(
          (b) => b.id === (item.borderId || item.id),
        );
        if (!border) return null;
        const duration = Number(item.durationDays) || 1;
        return {
          id: `blue_card_${border.id}_${duration}`,
          label: `${border.name} (${duration} يوم)`,
          icon: border.previewEmoji || "⏱️",
          type: "blue_card_border",
          value: border.id,
          durationDays: duration,
          color: ["#1e40af", "#2563eb", "#0284c7", "#0369a1", "#0ea5e9"][
            index % 5
          ],
          textColor: "#eff6ff",
          percentage: 1,
          enabled: true,
        };
      })
      .filter(Boolean);
  }, [wheelConfig.blueCardItems]);

  useEffect(() => {
    setGreenCards(Number(greenCardsCount) || 0);
  }, [greenCardsCount]);

  useEffect(() => {
    setBlueCards(Number(blueCardsCount) || 0);
  }, [blueCardsCount]);

  const displaySectors =
    cardMode === "green"
      ? greenCardSectors
      : cardMode === "blue"
        ? blueCardSectors
        : sectors;

  const cooldownHours = wheelConfig.cooldownHours ?? 24;
  const isWheelActive = wheelConfig.isActive ?? true;
  const paidSpinCost = 5 * 2 ** Math.max(0, Number(paidSpinsCount) || 0);

  const totalSectors = displaySectors.length;
  const sectorAngle = 360 / Math.max(totalSectors, 1);
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
        const minutes = Math.floor(
          (remainingMs % (1000 * 60 * 60)) / (1000 * 60),
        );
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

    const isGreenCardSpin = cardMode === "green";
    const isBlueCardSpin = cardMode === "blue";

    if (isGreenCardSpin && greenCards <= 0) {
      Swal.fire("لا توجد بطاقة", "لا تملك Green Card حالياً.", "warning");
      return;
    }
    if (isGreenCardSpin && greenCardSectors.length === 0) {
      Swal.fire(
        "جوائز غير متاحة",
        "لم يحدد الأدمن أي إطارات لـ Green Card بعد.",
        "info",
      );
      return;
    }

    if (isBlueCardSpin && blueCards <= 0) {
      Swal.fire("لا توجد بطاقة", "لا تملك Blue Card حالياً.", "warning");
      return;
    }
    if (isBlueCardSpin && blueCardSectors.length === 0) {
      Swal.fire(
        "جوائز غير متاحة",
        "لم يحدد الأدمن أي إطارات لـ Blue Card بعد.",
        "info",
      );
      return;
    }

    const isCardSpin = isGreenCardSpin || isBlueCardSpin;
    const isBonusSpin = !isCardSpin && !canSpin && bonusSpins > 0;
    const isPaidSpin = !isCardSpin && !canSpin && !isBonusSpin;
    if (isPaidSpin && studentScore < paidSpinCost) {
      Swal.fire(
        "نقاط غير كافية",
        `تحتاج إلى ${paidSpinCost} نقطة للفة التالية، ورصيدك ${studentScore} نقطة.`,
        "warning",
      );
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

    // 🔊 تشغيل صوت دوران العجلة
    startSpinSound(4300);

    const winningIndex = getWeightedSectorIndex(displaySectors);
    const selectedSector = displaySectors[winningIndex];
    const targetAngle =
      360 * 6 + (360 - (winningIndex * sectorAngle + sectorAngle / 2));
    setRotation(rotation + targetAngle + (360 - (rotation % 360)));

    setTimeout(async () => {
      try {
        const studentRef = doc(db, "students", studentDocId);

        if (isGreenCardSpin) {
          await runTransaction(db, async (transaction) => {
            const snapshot = await transaction.get(studentRef);
            const availableCards = Number(snapshot.data()?.greenCards) || 0;
            if (!snapshot.exists() || availableCards < 1) {
              throw new Error("GREEN_CARD_UNAVAILABLE");
            }
            transaction.update(studentRef, {
              greenCards: availableCards - 1,
              unlockedBorders: arrayUnion(selectedSector.value),
              activeBorder: selectedSector.value,
            });
          });
          setGreenCards((count) => Math.max(0, count - 1));
        } else if (isBlueCardSpin) {
          const durationDays = Number(selectedSector.durationDays) || 1;
          const expiresAt = new Date(
            Date.now() + durationDays * 24 * 60 * 60 * 1000,
          ).toISOString();

          await runTransaction(db, async (transaction) => {
            const snapshot = await transaction.get(studentRef);
            const availableCards = Number(snapshot.data()?.blueCards) || 0;
            if (!snapshot.exists() || availableCards < 1) {
              throw new Error("BLUE_CARD_UNAVAILABLE");
            }
            const currentTemp = snapshot.data()?.temporaryBorders || {};
            transaction.update(studentRef, {
              blueCards: availableCards - 1,
              temporaryBorders: {
                ...currentTemp,
                [selectedSector.value]: expiresAt,
              },
              activeBorder: selectedSector.value,
            });
          });
          setBlueCards((count) => Math.max(0, count - 1));
        } else {
          const updates = {};
          const pointPrize =
            selectedSector.type === "points" ? selectedSector.value : 0;
          const scoreChange = pointPrize - (isPaidSpin ? paidSpinCost : 0);
          if (scoreChange) updates.score = increment(scoreChange);
          if (pointPrize > 0) {
            updates.wheelPointsWon = increment(pointPrize);
          }

          if (selectedSector.type === "reserve") {
            updates.reserveAttendance = increment(selectedSector.value);
          } else if (selectedSector.type === "badge") {
            updates.unlockedBadges = arrayUnion(selectedSector.value);
          } else if (
            selectedSector.type === "exclusive_border" ||
            selectedSector.type === "border"
          ) {
            updates.unlockedBorders = arrayUnion(selectedSector.value);
            updates.activeBorder = selectedSector.value;
          } else if (selectedSector.type === "green_card") {
            updates.greenCards = increment(Number(selectedSector.value) || 1);
          } else if (selectedSector.type === "blue_card") {
            updates.blueCards = increment(Number(selectedSector.value) || 1);
          }

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
        }

        setWonPrize(selectedSector);
        // 🎉 صوت الفوز الاحتفالي
        playWinSound();
        await addDoc(collection(db, "gamificationActivity"), {
          type: "wheel_spin",
          studentId: studentDocId,
          studentName,
          prizeLabel: selectedSector.label,
          prizeIcon: selectedSector.icon || "🎁",
          prizeType: selectedSector.type,
          prizeValue: selectedSector.value ?? null,
          durationDays: selectedSector.durationDays ?? null,
          spinKind: isGreenCardSpin
            ? "green_card"
            : isBlueCardSpin
              ? "blue_card"
              : canSpin
                ? "free"
                : isBonusSpin
                  ? "bonus"
                  : "paid",
          paidCost: isPaidSpin ? paidSpinCost : 0,
          createdAt: serverTimestamp(),
        });
        onSpinSuccess(selectedSector);
      } catch (err) {
        console.error("Error saving lucky spin result:", err);
        const errorMsg =
          err.message === "GREEN_CARD_UNAVAILABLE"
            ? "تم استخدام Green Card بالفعل أو لا تملك بطاقة حالياً."
            : err.message === "BLUE_CARD_UNAVAILABLE"
              ? "تم استخدام Blue Card بالفعل أو لا تملك بطاقة حالياً."
              : "حدث خطأ أثناء حفظ الجائزة، حاول مرة أخرى.";
        Swal.fire("تعذر تنفيذ اللفة", errorMsg, "error");
      } finally {
        setIsSpinning(false);
      }
    }, 4300);
  };
  // رسالة الفوز المخصصة
  const getWinMessage = (prize) => {
    if (!prize) return "";
    if (prize.type === "blue_card_border") {
      return `🟦 Blue Card منحتك الإطار: ${prize.icon} ${prize.label}! متاح لمدة ${prize.durationDays} يوم وتم تفعيله فوراً ⏱️✨`;
    }
    if (prize.type === "green_card_border") {
      return `🟩 Green Card منحتك الإطار الأسطوري الدائم: ${prize.icon} ${prize.label}! تم تفعيله فوراً 👑✨`;
    }
    if (prize.type === "green_card") {
      const count = Number(prize.value) || 1;
      return `🟩 مبروك! ربحت ${count} Green Card! استخدمها لتدوير عجلة الإطارات الدائمة 🎡✨`;
    }
    if (prize.type === "blue_card") {
      const count = Number(prize.value) || 1;
      return `🟦 مبروك! ربحت ${count} Blue Card! استخدمها لتدوير عجلة الإطارات المؤقتة ⏱️🎡`;
    }
    if (prize.type === "exclusive_border" || prize.type === "border") {
      return `🤯 لا يُصدَّق! ربحت الإطار المميز: ${prize.icon} ${prize.label}! تم إضافته لبروفايلك وتفعيله فوراً!`;
    }
    if (prize.type === "badge") {
      return `مبروك! ربحت لقب: ${prize.icon} ${prize.label} 🎉`;
    }
    if (prize.type === "spin_again") {
      return `🔄 يا محظوظ! ربحت لفة إضافية مجانية! دوّر مرة ثانية!`;
    }
    if (prize.type === "reserve") {
      return `🛡️ مبروك! ربحت ${prize.value || 1} رصيد حضور احتياطي يحميك من الغياب!`;
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
          className="fixed inset-0  bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4"
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
            className="bg-slate-900  overflow-y-auto overflow-x-hidden max-h-svh scale-95 md:scale-none border border-slate-700/80 rounded-3xl w-full max-w-sm p-4   relative shadow-[0_0_50px_rgba(245,158,11,0.25)] text-center "
            onClick={(e) => e.stopPropagation()}
          >
            {/* زر الإغلاق */}
            {!isSpinning && (
              <button
                onClick={onClose}
                title="إغلاق"
                className="absolute top-4 left-4 z-20 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            )}

            {/* زر كتم / تفعيل المؤثرات الصوتية */}
            <button
              type="button"
              onClick={toggleSound}
              title={
                soundEnabled
                  ? "كتم المؤثرات الصوتية 🔊"
                  : "تشغيل المؤثرات الصوتية 🔇"
              }
              className={`absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                soundEnabled
                  ? "bg-slate-800 text-amber-400 hover:bg-slate-700 hover:text-amber-300 shadow-sm"
                  : "bg-slate-800/80 text-slate-500 hover:bg-slate-700 hover:text-slate-300"
              }`}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* العنوان */}
            <div className="flex items-center justify-center  mb-2">
              <span >
                {cardMode === "green"
                  ? "🟩"
                  : cardMode === "blue"
                    ? "🟦"
                    : "🎡"}
              </span>
              <h2 className="text-[10px] md:text-base font-black text-white bg-linear-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text">
                {cardMode === "green"
                  ? "عجلة Green Card (إطارات دائمة)"
                  : cardMode === "blue"
                    ? "عجلة Blue Card (إطارات مؤقتة)"
                    : "عجلة الحظ اليومية"}
              </h2>
            </div>

            {/* أشرطة التبويب لاختيار العجلات الثلاث */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/80 border border-slate-700/80 rounded-2xl mb-2.5 shadow-inner">
              {/* 1. العجلة اليومية */}
              <button
                type="button"
                disabled={isSpinning}
                onClick={() => {
                  if (cardMode !== "none") {
                    playClickSound();
                    setCardMode("none");
                    setWonPrize(null);
                  }
                }}
                className={`relative flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  cardMode === "none"
                    ? "bg-linear-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/25 scale-[1.02]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <ShipWheel
                  size={14}
                  className={
                    cardMode === "none" && isSpinning ? "animate-spin" : ""
                  }
                />
                <span>اليومية</span>
              </button>

              {/* 2. عجلة Green Card */}
              <button
                type="button"
                disabled={isSpinning}
                onClick={() => {
                  if (cardMode !== "green") {
                    playClickSound();
                    setCardMode("green");
                    setWonPrize(null);
                  }
                }}
                className={`relative flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  cardMode === "green"
                    ? "bg-linear-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/25 scale-[1.02]"
                    : "text-slate-400 hover:text-emerald-300 hover:bg-emerald-950/30"
                }`}
              >
                <div className="relative flex items-center">
                  <CreditCard size={14} />
                  {greenCards > 0 && cardMode !== "green" && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                    </span>
                  )}
                </div>
                <span>GC</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold leading-none ${
                    cardMode === "green"
                      ? "bg-slate-950/25 text-slate-950"
                      : "bg-emerald-900/70 text-emerald-300 border border-emerald-700/50"
                  }`}
                >
                  {greenCards}
                </span>
              </button>

              {/* 3. عجلة Blue Card */}
              <button
                type="button"
                disabled={isSpinning}
                onClick={() => {
                  if (cardMode !== "blue") {
                    playClickSound();
                    setCardMode("blue");
                    setWonPrize(null);
                  }
                }}
                className={`relative flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  cardMode === "blue"
                    ? "bg-linear-to-r from-sky-400 to-blue-500 text-slate-950 shadow-md shadow-sky-500/25 scale-[1.02]"
                    : "text-slate-400 hover:text-sky-300 hover:bg-sky-950/30"
                }`}
              >
                <div className="relative flex items-center">
                  <Diamond size={14} />
                  {blueCards > 0 && cardMode !== "blue" && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400"></span>
                    </span>
                  )}
                </div>
                <span>BC</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold leading-none ${
                    cardMode === "blue"
                      ? "bg-slate-950/25 text-slate-950"
                      : "bg-sky-900/70 text-sky-300 border border-sky-700/50"
                  }`}
                >
                  {blueCards}
                </span>
              </button>
            </div>

            {/* وصف توضيحي للعجلة المحددة */}
            <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
              {cardMode === "green"
                ? "👑 إطارات أسطورية دائمة — كل لفة تمنحك إطاراً دائماً!"
                : cardMode === "blue"
                  ? "⏱️ إطارات مميزة مؤقتة — كل لفة تمنحك إطاراً للمدة المحددة!"
                  : `✨ لف العجلة كل ${cooldownHours} ساعة واكسب نقاطاً وجوائز!`}
            </p>
            {/* حالة العجلة إذا كانت مغلقة من الأدمن */}
            {!isWheelActive ? (
              <div className="my-8 p-6 bg-slate-800/80 rounded-2xl border border-amber-500/30 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto animate-pulse" />
                <h3 className="font-bold text-white text-sm">
                  عجلة الحظ مغلقة مؤقتاً
                </h3>
                <p className="text-xs text-slate-400">
                  العجلة تخضع للصيانة وتحديث الجوائز حالياً، يرجى المحاولة
                  لاحقاً.
                </p>
              </div>
            ) : (
              <>
                {/* حاوية العجلة مع المؤشر */}
                <div className="relative flex items-center justify-center my-2">
                  {/* المؤشر العلوي */}
                  <div className="absolute -top-3.5 z-30 flex flex-col items-center">
                    <div className="w-0 h-0 border-l-12 border-l-transparent border-r-12 border-r-transparent border-t-20 border-t-amber-400 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] animate-bounce" />
                  </div>

                  {/* ═══════════════════════════════════════════════════════════════
    PREMIUM WHEEL
    Luxury Dark Glass / Soft Neon UI
═══════════════════════════════════════════════════════════════ */}

                  {/* عجلة الـ SVG التفاعلية */}
                  <div className="relative p-2 rounded-full bg-[#080d17] border border-white/[0.07] shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                    {/* Glow خفيف جدًا خلف العجلة */}
                    <div
                      className="
      absolute inset-[-18px]
      rounded-full
      pointer-events-none
      bg-[radial-gradient(circle,rgba(56,189,248,0.10),transparent_60%)]
      blur-xl
    "
                    />

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
                      className="relative   transition rounded-full select-none drop-shadow-[0_8px_25px_rgba(0,0,0,0.35)]"
                    >
                      <defs>
                        {/* Shadow */}
                        <filter
                          id="wheelSoftShadow"
                          x="-40%"
                          y="-40%"
                          width="180%"
                          height="180%"
                        >
                          <feDropShadow
                            dx="0"
                            dy="5"
                            stdDeviation="7"
                            floodColor="#000000"
                            floodOpacity="0.35"
                          />
                        </filter>

                        {/* Center */}
                        <radialGradient
                          id="wheelCenterGlow"
                          cx="50%"
                          cy="45%"
                          r="65%"
                        >
                          <stop
                            offset="0%"
                            stopColor="#ffffff"
                            stopOpacity="0.16"
                          />

                          <stop
                            offset="35%"
                            stopColor="#38bdf8"
                            stopOpacity="0.10"
                          />

                          <stop
                            offset="70%"
                            stopColor="#0f172a"
                            stopOpacity="0.95"
                          />

                          <stop
                            offset="100%"
                            stopColor="#020617"
                            stopOpacity="1"
                          />
                        </radialGradient>

                        {/* Center gloss */}
                        <linearGradient
                          id="wheelCenterGloss"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop
                            offset="0%"
                            stopColor="#ffffff"
                            stopOpacity="0.18"
                          />

                          <stop
                            offset="35%"
                            stopColor="#ffffff"
                            stopOpacity="0.04"
                          />

                          <stop
                            offset="100%"
                            stopColor="#000000"
                            stopOpacity="0.35"
                          />
                        </linearGradient>

                        {/* Sector gradients */}
                        {displaySectors.map((sector, i) => (
                          <React.Fragment key={`wheel-def-${i}`}>
                            <linearGradient
                              id={`wheelSector-${i}`}
                              x1="20%"
                              y1="0%"
                              x2="80%"
                              y2="100%"
                            >
                              <stop
                                offset="0%"
                                stopColor="#ffffff"
                                stopOpacity="0.12"
                              />

                              <stop
                                offset="25%"
                                stopColor={sector.color}
                                stopOpacity="0.96"
                              />

                              <stop
                                offset="70%"
                                stopColor={sector.color}
                                stopOpacity="0.82"
                              />

                              <stop
                                offset="100%"
                                stopColor="#020617"
                                stopOpacity="0.35"
                              />
                            </linearGradient>

                            <filter
                              id={`wheelGlow-${i}`}
                              x="-30%"
                              y="-30%"
                              width="160%"
                              height="160%"
                            >
                              <feGaussianBlur stdDeviation="2" result="blur" />

                              <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                          </React.Fragment>
                        ))}
                      </defs>

                      {/* خلفية العجلة */}
                      <circle
                        cx={center}
                        cy={center}
                        r={radius + 2}
                        fill="#060b14"
                        filter="url(#wheelSoftShadow)"
                      />

                      {/* القطاعات */}
                      <g>
                        {displaySectors.map((sector, i) => {
                          const startAngle = i * sectorAngle;
                          const endAngle = (i + 1) * sectorAngle;

                          const path = getSectorPath(
                            center,
                            center,
                            radius,
                            startAngle,
                            endAngle,
                          );

                          const midAngle = startAngle + sectorAngle / 2;

                          const isExclusive =
                            sector.type === "exclusive_border";

                          /* =========================================================
           حسابات النص حسب عدد القطاعات
        ========================================================= */

                          const count = displaySectors.length;

                          let iconSize = 12;
                          let labelSize = 9.5;
                          let maxChars = 12;
                          let labelY = radius - 43;

                          if (count <= 6) {
                            iconSize = 13;
                            labelSize = 10;
                            maxChars = 14;
                            labelY = radius - 45;
                          } else if (count <= 8) {
                            iconSize = 11;
                            labelSize = 8.5;
                            maxChars = 11;
                            labelY = radius - 41;
                          } else if (count <= 10) {
                            iconSize = 9.5;
                            labelSize = 7.5;
                            maxChars = 9;
                            labelY = radius - 37;
                          } else if (count <= 12) {
                            iconSize = 8.5;
                            labelSize = 6.7;
                            maxChars = 8;
                            labelY = radius - 34;
                          } else {
                            iconSize = 7.5;
                            labelSize = 5.8;
                            maxChars = 7;
                            labelY = radius - 31;
                          }

                          /* =========================================================
           تقسيم الاسم إلى سطرين
        ========================================================= */

                          const rawLabel = String(sector.label ?? "").trim();

                          let labelLines = [];

                          if (rawLabel.length <= maxChars) {
                            labelLines = [rawLabel];
                          } else {
                            const words = rawLabel.split(/\s+/);

                            let firstLine = "";
                            let secondLine = "";

                            words.forEach((word) => {
                              if (!firstLine && word.length <= maxChars) {
                                firstLine = word;
                                return;
                              }

                              const testFirst = firstLine
                                ? `${firstLine} ${word}`
                                : word;

                              if (!secondLine && testFirst.length <= maxChars) {
                                firstLine = testFirst;
                                return;
                              }

                              if (!secondLine && word.length <= maxChars) {
                                secondLine = word;
                                return;
                              }

                              if (firstLine && !secondLine) {
                                secondLine = word;
                              }
                            });

                            if (!firstLine) {
                              firstLine = rawLabel.slice(0, maxChars);
                            }

                            if (!secondLine) {
                              const remaining = rawLabel
                                .replace(firstLine, "")
                                .trim();

                              if (remaining) {
                                secondLine =
                                  remaining.length > maxChars
                                    ? `${remaining.slice(0, maxChars - 1)}…`
                                    : remaining;
                              }
                            }

                            labelLines = [firstLine, secondLine].filter(
                              Boolean,
                            );
                          }

                          return (
                            <g key={`sector-${i}`}>
                              {/* Glow خفيف */}
                              <path
                                d={path}
                                fill={sector.color}
                                fillOpacity="0.08"
                                stroke="none"
                                filter={`url(#wheelGlow-${i})`}
                              />

                              {/* القطاع الأساسي */}
                              <path
                                d={path}
                                fill={`url(#wheelSector-${i})`}
                                stroke="#08101d"
                                strokeWidth="4"
                                strokeLinejoin="round"
                              />

                              {/* Highlight */}
                              <path
                                d={path}
                                fill="none"
                                stroke="#ffffff"
                                strokeWidth="1"
                                strokeOpacity="0.12"
                              />

                              {/* محتوى القطاع */}
                              <g
                                transform={`rotate(${midAngle}, ${center}, ${center})`}
                              >
                                {/* الأيقونة */}
                                <text
                                  x={center}
                                  y={center - labelY}
                                  fill="#ffffff"
                                  fontSize={
                                    isExclusive
                                      ? Math.max(6, iconSize - 1)
                                      : iconSize
                                  }
                                  fontWeight="700"
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  style={{
                                    fontFamily: "inherit",
                                    pointerEvents: "none",
                                    paintOrder: "stroke",
                                    stroke: "rgba(0,0,0,0.25)",
                                    strokeWidth: "1.2px",
                                  }}
                                >
                                  {sector.icon}
                                </text>

                                {/* الاسم */}
                                <text
                                  x={center}
                                  y={center - labelY + iconSize + 6}
                                  fill={sector.textColor || "#ffffff"}
                                  fontSize={
                                    isExclusive
                                      ? Math.max(5, labelSize - 0.5)
                                      : labelSize
                                  }
                                  fontWeight="700"
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  style={{
                                    fontFamily: "inherit",
                                    pointerEvents: "none",
                                    paintOrder: "stroke",
                                    stroke: "rgba(0,0,0,0.38)",
                                    strokeWidth:
                                      count >= 10 ? "1.1px" : "1.4px",
                                    letterSpacing: count >= 10 ? "0" : "0.15px",
                                  }}
                                >
                                  {labelLines.map((line, index) => (
                                    <tspan
                                      key={`${i}-line-${index}`}
                                      x={center}
                                      dy={index === 0 ? 0 : labelSize + 1}
                                    >
                                      {line}
                                    </tspan>
                                  ))}
                                </text>
                              </g>
                            </g>
                          );
                        })}
                      </g>

                      {/* الحلقة الداخلية */}
                      <circle
                        cx={center}
                        cy={center}
                        r={radius * 0.22}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="1"
                        strokeOpacity="0.06"
                      />

                      <circle
                        cx={center}
                        cy={center}
                        r={radius * 0.245}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1"
                        strokeOpacity="0.065"
                      />

                      {/* مركز العجلة */}
                      <circle
                        cx={center}
                        cy={center}
                        r={29}
                        fill="url(#wheelCenterGlow)"
                        stroke="#ffffff"
                        strokeWidth="1"
                        strokeOpacity="0.10"
                        filter="url(#wheelSoftShadow)"
                      />

                      <circle
                        cx={center}
                        cy={center}
                        r={29}
                        fill="url(#wheelCenterGloss)"
                      />

                      <circle
                        cx={center}
                        cy={center}
                        r={23}
                        fill="#020617"
                        stroke="#38bdf8"
                        strokeWidth="2"
                        strokeOpacity="0.35"
                      />

                      <circle
                        cx={center}
                        cy={center}
                        r={8}
                        fill="#38bdf8"
                        fillOpacity="0.95"
                      />

                      <circle
                        cx={center - 2}
                        cy={center - 2}
                        r={3}
                        fill="#ffffff"
                        fillOpacity="0.72"
                      />

                      <circle
                        cx={center}
                        cy={center}
                        r={34}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="1"
                        strokeOpacity="0.035"
                      />

                      {/* الحافة الخارجية */}
                      <circle
                        cx={center}
                        cy={center}
                        r={radius + 1}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="1"
                        strokeOpacity="0.10"
                      />

                      <circle
                        cx={center}
                        cy={center}
                        r={radius + 5}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1"
                        strokeOpacity="0.055"
                      />

                      <circle
                        cx={center}
                        cy={center}
                        r={radius + 8}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="1"
                        strokeOpacity="0.022"
                      />
                    </svg>

                    {/* المؤشر الثابت */}
                    <div
                      className="
      absolute
      left-1/2
      top-[-5px]
      -translate-x-1/2
      z-30
      pointer-events-none
    "
                    >
                      <div
                        className="
        w-[7px]
        h-[7px]
        rounded-full
        bg-cyan-300
        shadow-[0_0_12px_rgba(34,211,238,0.65)]
      "
                      />

                      <div
                        className="
        mx-auto
        mt-px
        w-[3px]
        h-[15px]
        rounded-full
        bg-white/80
        shadow-[0_0_10px_rgba(255,255,255,0.45)]
      "
                      />
                    </div>
                  </div>
                </div>

                {/* إشعار الفوز عند التوقف */}
                {wonPrize && !isSpinning && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`my-2 p-3 rounded-2xl border flex items-center justify-center gap-2 shadow-lg ${
                      wonPrize.type === "exclusive_border"
                        ? "bg-linear-to-r from-violet-500/30 via-fuchsia-500/20 to-purple-500/30 border-fuchsia-400/60 text-fuchsia-200"
                        : "bg-linear-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-amber-500/40 text-amber-300"
                    }`}
                  >
                    <PartyPopper
                      className={`w-4 h-4 ${
                        wonPrize.type === "exclusive_border"
                          ? "text-fuchsia-400"
                          : "text-amber-400"
                      } animate-spin`}
                    />
                    <span className="font-bold text-xs">
                      {getWinMessage(wonPrize)}
                    </span>
                  </motion.div>
                )}

                {/* العداد التنازلي أو زر اللف */}
                <div className="mt-4 space-y-3">
                  {/* أزرار اللف حسب العجلة المختارة */}
                  {cardMode === "green" ? (
                    <button
                      type="button"
                      onClick={handleSpin}
                      disabled={isSpinning}
                      className={`w-full py-3.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-xl cursor-pointer ${
                        isSpinning
                          ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                          : greenCards > 0
                            ? "bg-linear-to-r from-emerald-400 via-green-500 to-emerald-600 text-white shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98]"
                            : "bg-slate-800 text-emerald-400/70 border border-emerald-800/40 hover:bg-slate-800/80"
                      }`}
                    >
                      <RotateCw
                        className={`w-4 h-4 ${isSpinning ? "animate-spin" : ""}`}
                      />
                      {isSpinning
                        ? "جاري الدوران..."
                        : greenCards > 0
                          ? ` دوّر عجلة Green Card (${greenCards})`
                          : "🔒 لا تملك Green Card"}
                    </button>
                  ) : cardMode === "blue" ? (
                    <button
                      type="button"
                      onClick={handleSpin}
                      disabled={isSpinning}
                      className={`w-full py-3.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-xl cursor-pointer ${
                        isSpinning
                          ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                          : blueCards > 0
                            ? "bg-linear-to-r from-sky-400 via-blue-500 to-indigo-600 text-white shadow-sky-500/30 hover:scale-[1.02] active:scale-[0.98]"
                            : "bg-slate-800 text-sky-400/70 border border-sky-800/40 hover:bg-slate-800/80"
                      }`}
                    >
                      <RotateCw
                        className={`w-4 h-4 ${isSpinning ? "animate-spin" : ""}`}
                      />
                      {isSpinning
                        ? "جاري الدوران..."
                        : blueCards > 0
                          ? `🟦 دوّر عجلة Blue Card (${blueCards})`
                          : "🔒 لا تملك Blue Card"}
                    </button>
                  ) : canSpin || bonusSpins > 0 ? (
                    <button
                      type="button"
                      onClick={handleSpin}
                      disabled={isSpinning}
                      className={`w-full py-3.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-xl cursor-pointer ${
                        isSpinning
                          ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                          : "bg-linear-to-r from-amber-400 via-yellow-500 to-amber-600 text-slate-950 shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98]"
                      }`}
                    >
                      <RotateCw
                        className={`w-4 h-4 ${isSpinning ? "animate-spin" : ""}`}
                      />
                      {isSpinning
                        ? "جاري الدوران..."
                        : bonusSpins > 0
                          ? `🔄 لفة مجانية إضافية (${bonusSpins})`
                          : "✨ دوّر مجاناً!"}
                    </button>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>اللفة المجانية التالية بعد:</span>
                      </div>

                      {timeLeft && (
                        <div className="flex items-center gap-2 text-amber-400 font-mono font-black text-base">
                          <span>
                            {String(timeLeft.hours).padStart(2, "0")}h
                          </span>
                          :
                          <span>
                            {String(timeLeft.minutes).padStart(2, "0")}m
                          </span>
                          :
                          <span>
                            {String(timeLeft.seconds).padStart(2, "0")}s
                          </span>
                        </div>
                      )}

                      {/* زر اللفة المدفوعة */}
                      <button
                        type="button"
                        onClick={handleSpin}
                        disabled={isSpinning || studentScore < paidSpinCost}
                        className={`w-full py-2.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-xl cursor-pointer ${
                          isSpinning || studentScore < paidSpinCost
                            ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                            : "bg-linear-to-r from-amber-400 via-yellow-500 to-amber-600 text-slate-950 shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98]"
                        }`}
                      >
                        <RotateCw
                          className={`w-4 h-4 ${isSpinning ? "animate-spin" : ""}`}
                        />
                        ✨ دوّر مقابل {paidSpinCost} نقطة
                      </button>
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
