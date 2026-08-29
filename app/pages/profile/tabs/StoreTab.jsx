"use client";

import React, { useRef, useState } from "react";
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
} from "lucide-react";
import { doc, updateDoc, increment, arrayUnion } from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig";
import Swal from "sweetalert2";
import {
  AVATAR_BORDERS,
  AVATAR_BADGES,
  RARITY_COLORS,
  getAvatarBorder,
  getAvatarBadge,
} from "@/app/utils/avatarDecorations";
import AvatarFrame from "@/app/utils/AvatarFrame";

const DEFAULT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236366f1'><circle cx='12' cy='8' r='4'/><path d='M4 20c0-4 3.6-7 8-7s8 3 8 7'/></svg>`;

export default function StoreTab({
  studentData,
  studentDocId,
  onOpenLuckyWheel = () => {},
}) {
  const [activeCategory, setActiveCategory] = useState("borders"); // 'borders' | 'badges'
  const [previewBorderId, setPreviewBorderId] = useState(
    studentData?.activeBorder || "default",
  );
  const [previewBadgeId, setPreviewBadgeId] = useState(
    studentData?.activeBadge || null,
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const score = studentData?.score || 0;
  const unlockedBorders = studentData?.unlockedBorders || ["default"];
  const unlockedBadges = studentData?.unlockedBadges || [];
  const currentActiveBorder = studentData?.activeBorder || "default";
  const currentActiveBadge = studentData?.activeBadge || null;

  const previewBorder = getAvatarBorder(previewBorderId);
  const previewBadge = getAvatarBadge(previewBadgeId);


  const sectionRef = useRef(null);
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
    <div className="space-y-6" dir="rtl">
      {/* هيدر المتجر ورصيد النقاط */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 border border-indigo-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-right">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">
                متجر التخصيص والألقاب
              </h2>
              <p className="text-xs text-slate-400">
                استثمر نقاطك لتخصيص بروفايلك وإبراز هويتك وتميزك في لوحة الشرف
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* رصيد النقاط */}
            <div className="flex items-center gap-2 bg-slate-800/90 border border-amber-500/40 px-4 py-2 rounded-2xl shadow-lg">
              <Coins className="w-5 h-5 text-amber-400 animate-bounce" />
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">
                  رصيد نقاطك
                </span>
                <span className="text-lg font-black text-amber-300">
                  {score} نقطة
                </span>
              </div>
            </div>

            {/* زر عجلة الحظ */}
            <button
              type="button"
              onClick={onOpenLuckyWheel}
              className="flex items-center gap-2 bg-linear-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs px-4 py-3 rounded-2xl shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              <RotateCw className="w-4 h-4" />
              <span>عجلة الحظ 🎡</span>
            </button>
          </div>
        </div>
      </div>

      {/* صندوق المعاينة الحية (Live Preview) */}
      <div  ref={sectionRef} className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-md">
        <div className="flex items-center gap-2 mb-4 text-gray-700 dark:text-gray-200">
          <Palette className="w-4 h-4 text-indigo-500" />
          <h3 className="font-bold text-sm">المعاينة الحية لمظهرك الحالي</h3>
        </div>

        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-6">
          {/* الأفاتار مع الإطار المختار */}
          <div className="relative">
            <AvatarFrame
              frameStyle={previewBorder.frameStyle}
              size={80}
              className={`ring-4 transition-all duration-300 ${previewBorder.ringClass} ${previewBorder.glowClass || ""} ${previewBorder.animationClass || ""}`}
            >
              <img
                src={studentData?.profilePic || DEFAULT_AVATAR}
                alt={studentData?.name || "Student"}
                className="w-full h-full rounded-full object-cover"
              />
            </AvatarFrame>
            {previewBorderId !== "default" && (
              <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-900 border border-amber-400 rounded-full flex items-center justify-center text-xs shadow-md">
                ✨
              </span>
            )}
          </div>

          {/* تفاصيل الطالب واللقب */}
          <div className="text-center sm:text-right">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1 flex-wrap">
              <h4 className="font-bold text-white text-base">
                {studentData?.name || "اسم الطالب"}
              </h4>
              {previewBadge && (
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${previewBadge.badgeClass}`}
                >
                  {previewBadge.emoji} {previewBadge.name}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              الإطار المفعّل:{" "}
              <strong className="text-amber-400">{previewBorder.name}</strong>
              {" • "}
              اللقب المفعّل:{" "}
              <strong className="text-cyan-400">
                {previewBadge ? previewBadge.name : "بدون لقب"}
              </strong>
            </p>
          </div>
        </div>
      </div>

      {/* أزرار التبديل بين التبويبات */}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory("borders")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${
            activeCategory === "borders"
              ? "bg-linear-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
              : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>إطارات الأفاتار ({AVATAR_BORDERS.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory("badges")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${
            activeCategory === "badges"
              ? "bg-linear-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
              : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>الألقاب والشارات ({AVATAR_BADGES.length})</span>
        </button>
      </div>

      {/* عرض العناصر حسب التبويب */}
      {activeCategory === "borders" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AVATAR_BORDERS.map((border) => {
            const isUnlocked = unlockedBorders.includes(border.id);
            const isActive = currentActiveBorder === border.id;
            const isPreviewing = previewBorderId === border.id;

            return (
              <motion.div
                key={border.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setPreviewBorderId(border.id)}
                className={`bg-white dark:bg-gray-800 rounded-3xl p-5 border transition-all flex flex-col justify-between cursor-pointer ${
                  isActive
                    ? "border-amber-400 ring-2 ring-amber-400/20 shadow-lg"
                    : isPreviewing
                      ? "border-indigo-500 ring-2 ring-indigo-500/30 shadow-md"
                      : "border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600"
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

                    <div className="text-left">
                      {border.isExclusive ? (
                        isUnlocked ? (
                          <span className="text-xs font-black px-2.5 py-1 rounded-full bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-600 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-700/30">
                            ✨ ممتلك (حصري)
                          </span>
                        ) : (
                          <span className="text-xs font-black px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-700/30">
                            حصري 🔮
                          </span>
                        )
                      ) : (
                        <>
                          {isUnlocked ? (
                            <span
                              className={` text-xs font-black px-2.5 py-1 rounded-full bg-gray-900/20 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700/30`}
                            >
                              تملكه
                            </span>
                          ) : (
                            <span
                              className={` text-xs font-black px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700/30`}
                            >
                              {border.price === 0
                                ? "مجاني"
                                : `${border.price} نقطة`}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <h4 className="font-bold text-gray-800 dark:text-white text-base mb-1">
                    {border.name}
                  </h4>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 leading-relaxed">
                    {border.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-50 dark:border-gray-700/50">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewBorderId(border.id);
                      requestAnimationFrame(() => {
                        sectionRef.current?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      });
                    }}
                    className={`w-full py-2 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      isPreviewing
                        ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-400 text-indigo-600 dark:text-indigo-300"
                        : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-indigo-400 hover:text-indigo-600"
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    <span>
                      {isPreviewing ? "تتم معاينته بالأعلى" : "معاينة الإطار"}
                    </span>
                  </button>
                  {border.isExclusive && !isUnlocked && (
                    <p className="mt-2 text-center text-[10px] font-bold text-fuchsia-600 dark:text-fuchsia-300">
                      ✨ لا يُشترى بالنقاط — احصل عليه من عجلة الحظ فقط
                    </p>
                  )}
                  <div className="mt-2">
                    {isActive ? (
                      <div className="w-full py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5">
                        <Check className="w-4 h-4" />
                        <span>مُفعّل حالياً</span>
                      </div>
                    ) : isUnlocked ? (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEquipBorder(border.id);
                        }}
                        className="w-full py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Zap className="w-4 h-4" />
                        <span>تفعيل هذا الإطار</span>
                      </button>
                    ) : border.isExclusive ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenLuckyWheel();
                        }}
                        className="w-full py-2.5 rounded-xl bg-linear-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <span>جرّب حظك في العجلة 🎡</span>
                      </button>
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
                            ? "bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
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
      )}

      {activeCategory === "badges" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AVATAR_BADGES.map((badge) => {
            const isUnlocked = unlockedBadges.includes(badge.id);
            const isActive = currentActiveBadge === badge.id;

            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white dark:bg-gray-800 rounded-3xl p-5 border transition-all flex flex-col justify-between ${
                  isActive
                    ? "border-amber-400 ring-2 ring-amber-400/20 shadow-lg"
                    : "border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">{badge.emoji}</span>
                    {!isUnlocked && (
                      <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700/30">
                        {badge.price} نقطة
                      </span>
                    )}
                  </div>

                  <div className="mb-2">
                    <span
                      className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${badge.badgeClass}`}
                    >
                      {badge.emoji} {badge.name}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-50 dark:border-gray-700/50">
                  {isActive ? (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleToggleBadge(badge.id)}
                      className="w-full py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 hover:bg-red-50 dark:hover:bg-red-900/20 text-emerald-600 hover:text-red-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-all group"
                    >
                      <Check className="w-4 h-4 group-hover:hidden" />
                      <span className="group-hover:hidden">
                        مُفعّل (اضغط للإلغاء)
                      </span>
                      <span className="hidden group-hover:inline">
                        إلغاء التفعيل ✖
                      </span>
                    </button>
                  ) : isUnlocked ? (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleToggleBadge(badge.id)}
                      className="w-full py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Zap className="w-4 h-4" />
                      <span>تفعيل هذا اللقب</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isProcessing || score < badge.price}
                      onClick={() => handleBuyBadge(badge)}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        score >= badge.price
                          ? "bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <Coins className="w-4 h-4" />
                      <span>شراء ({badge.price} نقطة)</span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
