"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Coins,
  Check,
  Zap,
  ShoppingBag,
  Palette,
  Award,
  RotateCw,
  Eye,
  Heart,
  Gift,
  Star,
} from "lucide-react";
import {
  doc,
  updateDoc,
  increment,
  arrayUnion,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig";
import Swal from "sweetalert2";
import {
  AVATAR_BORDERS,
  AVATAR_BADGES,
  RARITY_COLORS,
  getAvatarBorder,
  getAvatarBadge,
  isBorderUnlocked,
  getEffectiveActiveBorder,
  getTemporaryBorderRemainingTime,
} from "@/app/utils/avatarDecorations";
import {
  DEFAULT_WHEEL_CONFIG,
  subscribeLuckyWheelConfig,
} from "@/app/utils/luckyWheelConfig";
import AvatarFrame from "@/app/utils/AvatarFrame";
import SpotlightPurchaseModal from "@/app/components/features/SpotlightPurchaseModal";
import MysteryLootBoxModal from "@/app/components/features/MysteryLootBoxModal";
import { useGamificationFeatures } from "@/app/hooks/useGamificationFeatures";

const DEFAULT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236366f1'><circle cx='12' cy='8' r='4'/><path d='M4 20c0-4 3.6-7 8-7s8 3 8 7'/></svg>`;

export default function StoreTab({
  studentData,
  studentDocId,
  onOpenLuckyWheel = () => {},
}) {
  const [activeCategory, setActiveCategory] = useState("borders"); // 'borders' | 'badges'
  const [activeBorderType, setActiveBorderType] = useState("all");
  const [wheelConfig, setWheelConfig] = useState(DEFAULT_WHEEL_CONFIG);
  const [previewBorderId, setPreviewBorderId] = useState(
    getEffectiveActiveBorder(studentData) || "default",
  );
  const [previewBadgeId, setPreviewBadgeId] = useState(
    studentData?.activeBadge || null,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [favoriteBorderId, setFavoriteBorderId] = useState(
    studentData?.favoriteBorder || null,
  );
  const [isSpotlightModalOpen, setIsSpotlightModalOpen] = useState(false);
  const [isLootBoxModalOpen, setIsLootBoxModalOpen] = useState(false);
  const { spotlightConfig, lootBoxesConfig } = useGamificationFeatures();

  useEffect(() => {
    const unsub = subscribeLuckyWheelConfig((newConfig) => {
      if (newConfig) {
        setWheelConfig(newConfig);
      }
    });
    return () => unsub();
  }, []);

  useEffect(
    () => setFavoriteBorderId(studentData?.favoriteBorder || null),
    [studentData?.favoriteBorder],
  );

  const score = studentData?.score || 0;
  const unlockedBorders = studentData?.unlockedBorders || ["default"];
  const unlockedBadges = studentData?.unlockedBadges || [];
  const currentActiveBorder = studentData?.activeBorder || "default";
  const currentActiveBadge = studentData?.activeBadge || null;

  const previewBorder = getAvatarBorder(previewBorderId);
  const previewBadge = getAvatarBadge(previewBadgeId);
  const borderTypes = [
    { id: "all", label: "كل الإطارات", count: AVATAR_BORDERS.length },
    ...Object.entries(RARITY_COLORS)
      .filter(([rarity]) =>
        AVATAR_BORDERS.some((border) => border.rarity === rarity),
      )
      .map(([rarity, config]) => ({
        id: rarity,
        label: config.label,
        count: AVATAR_BORDERS.filter((border) => border.rarity === rarity)
          .length,
      })),
  ];
  const displayedBorders =
    activeBorderType === "all"
      ? AVATAR_BORDERS
      : AVATAR_BORDERS.filter((border) => border.rarity === activeBorderType);

  const previewRef = useRef(null);
  // شراء إطار
  const handleBuyBorder = async (border) => {
    if (score < border.price) {
      Swal.fire({
        title: "نقاط غير كافية",
        text: `تحتاج إلى ${border.price} نقطة لشراء هذا الإطار، رصيدك الحالي ${score} نقطة.`,
        icon: "warning",
        confirmButtonText: "حسناً",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    const result = await Swal.fire({
      title: "تأكيد الشراء",
      text: `هل تريد شراء إطار "${border.name}" مقابل ${border.price} نقطة؟`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "نعم، اشتري الآن",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#64748b",
    });

    if (!result.isConfirmed) return;

    try {
      setIsProcessing(true);
      const studentRef = doc(db, "students", studentDocId);
      await updateDoc(studentRef, {
        score: increment(-border.price),
        unlockedBorders: arrayUnion(border.id),
        activeBorder: border.id,
      });

      setPreviewBorderId(border.id);
      await addDoc(collection(db, "gamificationActivity"), {
        type: "store_purchase",
        studentId: studentDocId,
        studentName: studentData?.name || "طالب",
        itemType: "border",
        itemId: border.id,
        itemName: border.name,
        itemIcon: border.previewEmoji || "✨",
        price: border.price,
        createdAt: serverTimestamp(),
      });
      Swal.fire({
        title: "مبروك! 🎉",
        text: `تم شراء وتفعيل إطار "${border.name}" بنجاح!`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error purchasing border:", err);
      Swal.fire("خطأ", "فشلت عملية الشراء، يرجى المحاولة لاحقاً", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // تفعيل إطار مملوك
  const handleEquipBorder = async (borderId) => {
    try {
      setIsProcessing(true);
      const studentRef = doc(db, "students", studentDocId);
      await updateDoc(studentRef, {
        activeBorder: borderId,
      });
      setPreviewBorderId(borderId);
    } catch (err) {
      console.error("Error equipping border:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleFavoriteBorder = async (borderId) => {
    const previousFavorite = favoriteBorderId;
    const nextFavorite = previousFavorite === borderId ? null : borderId;
    setFavoriteBorderId(nextFavorite);
    try {
      setIsProcessing(true);
      await updateDoc(doc(db, "students", studentDocId), {
        favoriteBorder: nextFavorite,
      });
    } catch (err) {
      setFavoriteBorderId(previousFavorite);
      console.error("Error saving favorite border:", err);
      Swal.fire("خطأ", "تعذر حفظ الإطار المفضل، حاول مرة أخرى", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // شراء لقب
  const handleBuyBadge = async (badge) => {
    if (score < badge.price) {
      Swal.fire({
        title: "نقاط غير كافية",
        text: `تحتاج إلى ${badge.price} نقطة لشراء هذا اللقب، رصيدك الحالي ${score} نقطة.`,
        icon: "warning",
        confirmButtonText: "حسناً",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    const result = await Swal.fire({
      title: "تأكيد الشراء",
      text: `هل تريد شراء لقب "${badge.name} ${badge.emoji}" مقابل ${badge.price} نقطة؟`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "نعم، اشتري الآن",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#64748b",
    });

    if (!result.isConfirmed) return;

    try {
      setIsProcessing(true);
      const studentRef = doc(db, "students", studentDocId);
      await updateDoc(studentRef, {
        score: increment(-badge.price),
        unlockedBadges: arrayUnion(badge.id),
        activeBadge: badge.id,
      });

      setPreviewBadgeId(badge.id);
      await addDoc(collection(db, "gamificationActivity"), {
        type: "store_purchase",
        studentId: studentDocId,
        studentName: studentData?.name || "طالب",
        itemType: "badge",
        itemId: badge.id,
        itemName: badge.name,
        itemIcon: badge.emoji || "🏷️",
        price: badge.price,
        createdAt: serverTimestamp(),
      });
      Swal.fire({
        title: "مبروك! 🎉",
        text: `تم شراء وتفعيل لقب "${badge.name}" بنجاح!`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error purchasing badge:", err);
      Swal.fire("خطأ", "فشلت عملية الشراء، يرجى المحاولة لاحقاً", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // تفعيل أو إزالة لقب
  const handleToggleBadge = async (badgeId) => {
    const nextBadge = currentActiveBadge === badgeId ? null : badgeId;
    try {
      setIsProcessing(true);
      const studentRef = doc(db, "students", studentDocId);
      await updateDoc(studentRef, {
        activeBadge: nextBadge,
      });
      setPreviewBadgeId(nextBadge);
    } catch (err) {
      console.error("Error toggling badge:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* هيدر المتجر ورصيد النقاط */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4">
          {/* الصف الأول: أيقونة + عنوان */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black text-slate-100 leading-tight">
                متجر التخصيص والألقاب
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 leading-snug">
                استثمر نقاطك لتخصيص بروفايلك وتميزك في لوحة الشرف
              </p>
            </div>
          </div>

          {/* الصف الثاني: بطاقات الرصيد + الأزرار */}
          <div className="flex flex-wrap items-center gap-2">
            {/* رصيد Green Cards إن وُجد */}
            {Number(studentData?.greenCards) > 0 && (
              <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1.5 rounded-xl shadow-md">
                <span className="text-sm">🟩</span>
                <div className="text-right">
                  <span className="text-[9px] text-emerald-300/80 block leading-none">
                    Green Cards
                  </span>
                  <span className="text-xs font-black text-emerald-300">
                    {studentData.greenCards}
                  </span>
                </div>
              </div>
            )}

            {/* رصيد Blue Cards إن وُجد */}
            {Number(studentData?.blueCards) > 0 && (
              <div className="flex items-center gap-1.5 bg-sky-950/80 border border-sky-500/40 px-2.5 py-1.5 rounded-xl shadow-md">
                <span className="text-sm">🟦</span>
                <div className="text-right">
                  <span className="text-[9px] text-sky-300/80 block leading-none">
                    Blue Cards
                  </span>
                  <span className="text-xs font-black text-sky-300">
                    {studentData.blueCards}
                  </span>
                </div>
              </div>
            )}

            {/* رصيد النقاط */}
            <div className="flex items-center gap-2 bg-slate-800/90 border border-amber-500/40 px-3 py-1.5 rounded-xl shadow-md">
              <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-bounce shrink-0" />
              <div className="text-right">
                <span className="text-[9px] text-slate-400 block leading-none">
                  نقاطك
                </span>
                <span className="text-sm sm:text-base font-black text-amber-300">
                  {score}
                </span>
              </div>
            </div>

            {/* فاصل */}
            <div className="hidden sm:block w-px h-8 bg-slate-700/60 mx-1" />

            {/* زر عجلة الحظ */}
            <button
              type="button"
              onClick={onOpenLuckyWheel}
              className="flex items-center gap-1.5 bg-linear-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black text-xs px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>عجلة الحظ 🎡</span>
            </button>

            {/* زر تسليط الضوء */}
            {spotlightConfig?.enabled && (
              <button
                type="button"
                onClick={() => setIsSpotlightModalOpen(true)}
                className="flex items-center gap-1.5 bg-linear-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-slate-950 font-black text-xs px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-md shadow-yellow-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title={`نجم اليوم — ${spotlightConfig.cost || 80} نقطة`}
              >
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>نجم اليوم ⭐</span>
              </button>
            )}

            {/* زر صناديق المفاجآت */}
            {lootBoxesConfig?.enabled && (
              <button
                type="button"
                onClick={() => setIsLootBoxModalOpen(true)}
                className="flex items-center gap-1.5 bg-linear-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-slate-100 font-black text-xs px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-md shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="صناديق المفاجآت الغامضة"
              >
                <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>الصناديق 🎁</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* صندوق المعاينة الحية (Live Preview) */}
      <div
        ref={previewRef}
        className="bg-gray-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-700 shadow-md"
      >
        <div className="flex items-center gap-2 mb-3 text-gray-200">
          <Palette className="w-4 h-4 text-indigo-500" />
          <h3 className="font-bold text-sm">المعاينة الحية لمظهرك الحالي</h3>
        </div>

        <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-800 flex flex-row items-center gap-4">
          {/* الأفاتار مع الإطار المختار */}
          <div className="relative shrink-0">
            <AvatarFrame
              frameStyle={previewBorder.frameStyle}
              size={64}
              className={`ring-4 transition-all duration-300 ${previewBorder.ringClass} ${previewBorder.glowClass || ""} ${previewBorder.animationClass || ""}`}
            >
              <img
                src={studentData?.profilePic || DEFAULT_AVATAR}
                alt={studentData?.name || "Student"}
                className="w-full h-full rounded-full object-cover"
              />
            </AvatarFrame>
            {previewBorderId !== "default" && (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-900 border border-amber-400 rounded-full flex items-center justify-center text-[10px] shadow-md">
                ✨
              </span>
            )}
          </div>

          {/* تفاصيل الطالب واللقب */}
          <div className="text-right min-w-0">
            <div className="flex items-center justify-end gap-2 mb-1 flex-wrap">
              <h4 className="font-bold text-slate-100 text-sm sm:text-base truncate">
                {studentData?.name || "اسم الطالب"}
              </h4>
              {previewBadge && (
                <span
                  className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full ${previewBadge.badgeClass}`}
                >
                  {previewBadge.emoji} {previewBadge.name}
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 leading-snug">
              <span className="text-slate-500">الإطار:</span>{" "}
              <strong className="text-amber-400">{previewBorder.name}</strong>
              {" • "}
              <span className="text-slate-500">اللقب:</span>{" "}
              <strong className="text-cyan-400">
                {previewBadge ? previewBadge.name : "بدون لقب"}
              </strong>
            </p>
          </div>
        </div>
      </div>

      {/* أزرار التبديل بين التبويبات */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory("borders")}
          className={`flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all ${
            activeCategory === "borders"
              ? "bg-linear-to-r from-indigo-500 to-purple-600 text-slate-100 shadow-lg shadow-indigo-500/30"
              : "text-gray-300 border border-gray-700 hover:bg-gray-700/50"
          }`}
        >
          <Palette className="w-4 h-4 shrink-0" />
          <span>إطارات ({AVATAR_BORDERS.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory("badges")}
          className={`flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all ${
            activeCategory === "badges"
              ? "bg-linear-to-r from-indigo-500 to-purple-600 text-slate-100 shadow-lg shadow-indigo-500/30"
              : "text-gray-300 border border-gray-700 hover:bg-gray-700/50"
          }`}
        >
          <Award className="w-4 h-4 shrink-0" />
          <span>الألقاب ({AVATAR_BADGES.length})</span>
        </button>
      </div>

      {/* عرض العناصر حسب التبويب */}
      {activeCategory === "borders" && (
        <>
          <div className="rounded-xl border px-3 py-2.5 text-xs border-rose-900/50 bg-rose-950/20 text-rose-200 leading-relaxed">
            <span className="font-black">♥ اختر إطارك المفضل:</span> يمكنك ابداء
            الاعجاب بالإطار الذي تفضله. كما يمكنك إلغاء المفضلة بالضغط عليه مرة
            ثانية | تزيد من فرصتك للحصول عليه.
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 px-1 scrollbar-thin scrollbar-thumb-indigo-300 scrollbar-thumb-indigo-800">
            {borderTypes.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setActiveBorderType(type.id)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-black transition-all ${activeBorderType === type.id ? "shadow-md shadow-indigo-500/30" : "bg-slate-800 text-slate-300 border hover:border-indigo-500"}`}
              >
                {type.label} <span className="opacity-70">({type.count})</span>
              </button>
            ))}
          </div>{" "}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {displayedBorders.map((border) => {
              const isPermanentlyUnlocked = (
                studentData?.unlockedBorders || ["default"]
              ).includes(border.id);
              const isTemporary = !!studentData?.temporaryBorders?.[border.id];
              const tempInfo = isTemporary
                ? getTemporaryBorderRemainingTime(border.id, studentData)
                : null;
              const isTemporarilyUnlocked =
                isTemporary && tempInfo && !tempInfo.isExpired;
              const isUnlocked = isPermanentlyUnlocked || isTemporarilyUnlocked;
              const isPurchasable = !border.isExclusive && border.price > 0;

              // التحقق من وجود الإطار في إعدادات العجلة والبطاقات
              const inNormalWheel = (wheelConfig?.sectors || []).some(
                (s) =>
                  (s.type === "exclusive_border" ||
                    s.type === "border" ||
                    s.value === border.id) &&
                  s.value === border.id &&
                  s.enabled !== false &&
                  Number(s.percentage) > 0,
              );
              const inGreenCard = (
                wheelConfig?.greenCardBorderIds || []
              ).includes(border.id);
              const inBlueCard = (wheelConfig?.blueCardItems || []).some(
                (item) => (item.borderId || item.id) === border.id,
              );

              const isActive = currentActiveBorder === border.id;
              const isPreviewing = previewBorderId === border.id;
              const isFavorite = favoriteBorderId === border.id;

              return (
                <motion.div
                  key={border.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setPreviewBorderId(border.id)}
                  className={`bg-gray-800 rounded-3xl p-5 border transition-all flex flex-col justify-between cursor-pointer ${
                    isActive
                      ? "border-amber-400 ring-2 ring-amber-400/20 shadow-lg"
                      : isPreviewing
                        ? "border-indigo-500 ring-2 ring-indigo-500/30 shadow-md"
                        : "hover:border-gray-600"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-col items-center gap-1.5">
                        <div
                          className={`w-14 h-14 rounded-full p-1 bg-linear-to-tr ${border.previewGradient} flex items-center justify-center shadow-md ${border.animationClass || ""}`}
                        >
                          <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-lg">
                            {border.previewEmoji || "✨"}
                          </div>
                        </div>
                        {border.rarity && RARITY_COLORS[border.rarity] && (
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${RARITY_COLORS[border.rarity].bg} ${RARITY_COLORS[border.rarity].text} ${RARITY_COLORS[border.rarity].border}`}
                          >
                            {RARITY_COLORS[border.rarity].label}
                          </span>
                        )}
                      </div>

                      <div className="text-left flex flex-col items-end gap-1">
                        {isPermanentlyUnlocked ? (
                          <span
                            className={`text-xs font-black px-2.5 py-1 rounded-full ${
                              border.isExclusive
                                ? "bg-fuchsia-950/30 text-fuchsia-300 border border-fuchsia-700/40"
                                : "bg-slate-900 text-slate-400 border border-slate-700"
                            }`}
                          >
                            {border.isExclusive ? "✨ ممتلك (حصري)" : "تملكه"}
                          </span>
                        ) : isTemporarilyUnlocked ? (
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-sky-950/40 text-sky-300 border border-sky-600/50 flex items-center gap-1 shadow-sm">
                              <span>🟦 مؤقت</span>
                            </span>
                            {tempInfo && (
                              <span className="text-[10px] text-sky-300 font-bold bg-sky-950/30 px-2 py-0.5 rounded-md border border-sky-800/40">
                                ⏱️ {tempInfo.text}
                              </span>
                            )}
                            {isPurchasable && (
                              <span className="text-[10px] font-bold text-amber-300/90 bg-amber-950/20 px-2 py-0.5 rounded-md border border-amber-800/30">
                                شراء دائم: {border.price} نقطة
                              </span>
                            )}
                          </div>
                        ) : isTemporary && tempInfo?.isExpired ? (
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950/40 text-rose-300 border border-rose-700/40">
                              انتهت الصلاحية المؤقتة
                            </span>
                            {border.isExclusive ? (
                              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-purple-950/30 text-purple-300 border border-purple-700/40">
                                حصري 🔮
                              </span>
                            ) : (
                              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-950/30 text-amber-300 border border-amber-700/40">
                                {border.price === 0
                                  ? "مجاني"
                                  : `${border.price} نقطة`}
                              </span>
                            )}
                          </div>
                        ) : border.isExclusive ? (
                          <span className="text-xs font-black px-2.5 py-1 rounded-full bg-purple-950/30 text-purple-300 border border-purple-700/40">
                            حصري 🔮
                          </span>
                        ) : (
                          <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-950/30 text-amber-300 border border-amber-700/40">
                            {border.price === 0
                              ? "مجاني"
                              : `${border.price} نقطة`}
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="font-bold text-slate-100 text-base mb-1">
                      {border.name}
                    </h4>
                    <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                      {border.description || "إطار أفاتار مميز لحسابك الشخصي"}
                    </p>

                    {/* توضيح مصدر الإطار وكيفية الحصول عليه */}
                    {!isPermanentlyUnlocked && (
                      <div className="mb-3 text-[11px] font-bold">
                        {border.isExclusive ? (
                          inNormalWheel ? (
                            <p className="text-amber-300/90 flex items-center gap-1">
                              <span>🎡</span>
                              <span>متاح في عجلة الحظ اليومية</span>
                            </p>
                          ) : inGreenCard && inBlueCard ? (
                            <p className="text-teal-300/90 flex items-center gap-1">
                              <span>🃏</span>
                              <span>
                                متاح عبر بطاقات الحظ (Green / Blue Card)
                              </span>
                            </p>
                          ) : inGreenCard ? (
                            <p className="text-emerald-300/90 flex items-center gap-1">
                              <span>🟩</span>
                              <span>متاح كإطار دائم عبر بطاقة Green Card</span>
                            </p>
                          ) : inBlueCard ? (
                            <p className="text-sky-300/90 flex items-center gap-1">
                              <span>🟦</span>
                              <span>متاح كإطار مؤقت عبر بطاقة Blue Card</span>
                            </p>
                          ) : (
                            <p className="text-purple-300/80 flex items-center gap-1">
                              <span>🔒</span>
                              <span>
                                إطار حصري خاص — غير متوفر في العجلة حالياً
                              </span>
                            </p>
                          )
                        ) : inNormalWheel ? (
                          <p className="text-indigo-300/80 flex items-center gap-1">
                            <span>✨</span>
                            <span>
                              متاح للشراء بالنقاط أو الفوز به من العجلة
                            </span>
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-700/70">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewBorderId(border.id);

                        requestAnimationFrame(() => {
                          previewRef.current?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        });
                      }}
                      className={`w-full py-2 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        isPreviewing
                          ? "bg-indigo-950/40 border-indigo-500 text-indigo-300"
                          : "hover:border-indigo-400 hover:text-indigo-300"
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      <span>
                        {isPreviewing ? "تتم معاينته بالأعلى" : "معاينة الإطار"}
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavoriteBorder(border.id);
                      }}
                      className={`mt-2 w-full py-2 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${isFavorite ? "bg-rose-950/30 text-rose-300" : "hover:border-rose-400 hover:text-rose-300"}`}
                    >
                      <Heart
                        className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`}
                      />
                      <span>
                        {isFavorite ? "إطارك المفضل ♥" : "أضف إلى المفضلة"}
                      </span>
                    </button>

                    {/* منطقة أزرار الإجراءات والشراء والتفعيل */}
                    <div className="mt-2 space-y-2">
                      {isActive ? (
                        <>
                          <div
                            className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 ${
                              isPermanentlyUnlocked
                                ? "bg-emerald-950/30 text-emerald-300"
                                : "bg-sky-950/40 text-sky-300 border border-sky-700/40"
                            }`}
                          >
                            <Check className="w-4 h-4" />
                            <span>
                              {isPermanentlyUnlocked
                                ? "مُفعّل حالياً"
                                : "مُفعّل حالياً (مؤقت ⏱️)"}
                            </span>
                          </div>

                          {/* زر إتاحة الشراء الدائم بالنقاط إذا كان الإطار مفعلاً مؤقتاً */}
                          {!isPermanentlyUnlocked && isPurchasable && (
                            <button
                              type="button"
                              disabled={isProcessing || score < border.price}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBuyBorder(border);
                              }}
                              className={`w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                                score >= border.price
                                  ? "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/20"
                                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
                              }`}
                            >
                              <Coins className="w-4 h-4" />
                              <span>امتلاك دائم ({border.price} نقطة)</span>
                            </button>
                          )}
                        </>
                      ) : isUnlocked ? (
                        <>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEquipBorder(border.id);
                            }}
                            className="w-full py-2.5 rounded-xl hover:bg-indigo-900/60 text-indigo-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-indigo-500/30 hover:border-indigo-400"
                          >
                            <Zap className="w-4 h-4" />
                            <span>
                              {isPermanentlyUnlocked
                                ? "تفعيل هذا الإطار"
                                : "تفعيل الإطار (مؤقت)"}
                            </span>
                          </button>

                          {/* زر إتاحة الشراء الدائم بالنقاط حتى لو كان ممتلكاً مؤقتاً */}
                          {!isPermanentlyUnlocked && isPurchasable && (
                            <button
                              type="button"
                              disabled={isProcessing || score < border.price}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBuyBorder(border);
                              }}
                              className={`w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                                score >= border.price
                                  ? "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/20"
                                  : "bg-slate-800 text-slate-500 cursor-not-allowed"
                              }`}
                            >
                              <Coins className="w-4 h-4" />
                              <span>شراء دائم ({border.price} نقطة)</span>
                            </button>
                          )}
                        </>
                      ) : border.isExclusive ? (
                        inNormalWheel ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenLuckyWheel();
                            }}
                            className="w-full py-2.5 rounded-xl bg-linear-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-slate-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <span>جرّب حظك في العجلة 🎡</span>
                          </button>
                        ) : inGreenCard ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenLuckyWheel();
                            }}
                            className="w-full py-2.5 rounded-xl bg-linear-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-slate-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <span>متاح عبر Green Card 🟩</span>
                          </button>
                        ) : inBlueCard ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenLuckyWheel();
                            }}
                            className="w-full py-2.5 rounded-xl bg-linear-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-slate-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <span>متاح عبر Blue Card 🟦</span>
                          </button>
                        ) : (
                          <div className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-400 font-bold text-xs flex items-center justify-center gap-1.5 text-center cursor-not-allowed">
                            <span>🔒 غير متوفر في العجلة حالياً</span>
                          </div>
                        )
                      ) : (
                        <button
                          type="button"
                          disabled={isProcessing || score < border.price}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBuyBorder(border);
                          }}
                          className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                            score >= border.price
                              ? "hover:bg-amber-600 text-slate-100 shadow-md shadow-amber-500/20"
                              : "bg-slate-800 text-slate-500 cursor-not-allowed"
                          }`}
                        >
                          <Coins className="w-4 h-4" />
                          <span>شراء ({border.price} نقطة)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {activeCategory === "badges" && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {AVATAR_BADGES.map((badge) => {
            const isUnlocked = unlockedBadges.includes(badge.id);
            const isActive = currentActiveBadge === badge.id;

            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border transition-all flex flex-col justify-between ${
                  isActive
                    ? "border-amber-400 ring-2 ring-amber-400/20 shadow-lg"
                    : "hover:border-slate-600"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-3 gap-1">
                    <span className="text-2xl sm:text-3xl">{badge.emoji}</span>
                    {!isUnlocked && (
                      <span className="text-[10px] sm:text-xs font-black px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-amber-950/30 text-amber-300 border border-amber-700/40 shrink-0">
                        {badge.price} نقطة
                      </span>
                    )}
                    {isUnlocked && (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-emerald-950/30 text-emerald-300 border border-emerald-700/40 shrink-0">
                        ✓ مملوك
                      </span>
                    )}
                  </div>

                  <div className="mb-1.5">
                    <span
                      className={`inline-block text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full ${badge.badgeClass}`}
                    >
                      {badge.emoji} {badge.name}
                    </span>
                  </div>

                  <p className="text-[10px] sm:text-xs text-slate-400 mb-3 leading-relaxed line-clamp-3">
                    {badge.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-700/70">
                  {isActive ? (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleToggleBadge(badge.id)}
                      className="w-full py-2 sm:py-2.5 rounded-xl hover:bg-rose-950/30 hover:text-rose-300 font-bold text-[10px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5 transition-all group"
                    >
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:hidden" />
                      <span className="group-hover:hidden">مُفعّل ✓</span>
                      <span className="hidden group-hover:inline">إلغاء ✖</span>
                    </button>
                  ) : isUnlocked ? (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleToggleBadge(badge.id)}
                      className="w-full py-2 sm:py-2.5 rounded-xl hover:bg-indigo-900/60 text-indigo-300 font-bold text-[10px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5 transition-all"
                    >
                      <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>تفعيل اللقب</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isProcessing || score < badge.price}
                      onClick={() => handleBuyBadge(badge)}
                      className={`w-full py-2 sm:py-2.5 rounded-xl font-bold text-[10px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5 transition-all ${
                        score >= badge.price
                          ? "hover:bg-amber-600 text-slate-100 shadow-md shadow-amber-500/20"
                          : "bg-slate-800/50 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>شراء ({badge.price})</span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* مودال تسليط الضوء على البروفايل */}
      <SpotlightPurchaseModal
        open={isSpotlightModalOpen}
        onClose={() => setIsSpotlightModalOpen(false)}
        studentData={studentData}
        studentDocId={studentDocId}
        onSuccess={() => setIsSpotlightModalOpen(false)}
      />

      {/* مودال صناديق المفاجآت الغامضة */}
      <MysteryLootBoxModal
        open={isLootBoxModalOpen}
        onClose={() => setIsLootBoxModalOpen(false)}
        studentData={studentData}
        studentDocId={studentDocId}
        onSuccess={() => {}}
      />
    </div>
  );
}
