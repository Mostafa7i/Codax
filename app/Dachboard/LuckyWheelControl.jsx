"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Save,
  RotateCcw,
  Scale,
  Play,
  Clock,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Percent,
  Coins,
  Shield,
  Award,
  Crown,
  Eye,
  Settings2,
  ToggleLeft,
  ToggleRight,
  Flame,
  Plus,
  Trash2,
  Edit3,
  X,
  Palette,
  Gift,
  Zap,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  DEFAULT_WHEEL_CONFIG,
  DEFAULT_WHEEL_SECTORS,
  DEFAULT_BLUE_CARD_ITEMS,
  getLuckyWheelConfig,
  saveLuckyWheelConfig,
  getWeightedSectorIndex,
} from "@/app/utils/luckyWheelConfig";
import { AVATAR_BORDERS, AVATAR_BADGES } from "@/app/utils/avatarDecorations";

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

const PRESET_COLORS = [
  "#475569",
  "#0284c7",
  "#d97706",
  "#c026d3",
  "#7c3aed",
  "#eab308",
  "#059669",
  "#e11d48",
  "#0d9488",
  "#4c1d95",
  "#1e1b4b",
  "#dc2626",
  "#2563eb",
  "#047857",
  "#9333ea",
];

export default function LuckyWheelControl() {
  const [config, setConfig] = useState(DEFAULT_WHEEL_CONFIG);
  const [sectors, setSectors] = useState(DEFAULT_WHEEL_SECTORS);
  const [cooldownHours, setCooldownHours] = useState(24);
  const [isActive, setIsActive] = useState(true);
  const [greenCardBorderIds, setGreenCardBorderIds] = useState(
    DEFAULT_WHEEL_CONFIG.greenCardBorderIds,
  );
  const [blueCardItems, setBlueCardItems] = useState(
    DEFAULT_WHEEL_CONFIG.blueCardItems,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // نافذة الإضافة والتعديل
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSectorId, setEditingSectorId] = useState(null);
  const [formData, setFormData] = useState({
    id: "",
    label: "",
    icon: "🎁",
    type: "points",
    value: 10,
    color: "#0284c7",
    textColor: "#ffffff",
    percentage: 5,
    enabled: true,
  });

  // محاكي اللفات
  const [showSimulator, setShowSimulator] = useState(false);
  const [simResults, setSimResults] = useState(null);
  const [simCount, setSimCount] = useState(1000);
  const [isSimulating, setIsSimulating] = useState(false);

  // جلب الإعدادات من Firestore
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getLuckyWheelConfig();
        setConfig(data);
        setSectors(data.sectors || DEFAULT_WHEEL_SECTORS);
        setCooldownHours(data.cooldownHours ?? 24);
        setIsActive(data.isActive ?? true);
        setGreenCardBorderIds(
          Array.isArray(data.greenCardBorderIds)
            ? data.greenCardBorderIds
            : DEFAULT_WHEEL_CONFIG.greenCardBorderIds,
        );
        setBlueCardItems(
          Array.isArray(data.blueCardItems)
            ? data.blueCardItems
            : DEFAULT_WHEEL_CONFIG.blueCardItems,
        );
      } catch (err) {
        console.error("Error loading lucky wheel config:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // حساب المجموع الإجمالي للنسب المفعلة
  const totalPercentage = useMemo(() => {
    const sum = sectors
      .filter((s) => s.enabled !== false)
      .reduce((acc, s) => acc + (parseFloat(s.percentage) || 0), 0);
    return Math.round(sum * 100) / 100;
  }, [sectors]);

  const isExact100 = Math.abs(totalPercentage - 100) < 0.01;

  // فتح نافذة إضافة جائزة جديدة
  const handleOpenAddModal = () => {
    setEditingSectorId(null);
    setFormData({
      id: "custom_" + Date.now(),
      label: "+25 نقطة",
      icon: "🪙",
      type: "points",
      value: 25,
      color: "#0284c7",
      textColor: "#ffffff",
      percentage: 2,
      enabled: true,
    });
    setModalOpen(true);
  };

  // فتح نافذة تعديل جائزة
  const handleOpenEditModal = (sector) => {
    setEditingSectorId(sector.id);
    setFormData({
      ...sector,
      percentage: parseFloat(sector.percentage) || 0,
    });
    setModalOpen(true);
  };

  // عند تغيير نوع الجائزة في الـ Form
  const handleTypeChange = (newType) => {
    if (newType === "points") {
      setFormData((prev) => ({
        ...prev,
        type: "points",
        label: "+50 نقطة",
        icon: "💰",
        value: 50,
        color: "#d97706",
        textColor: "#ffffff",
      }));
    } else if (newType === "border" || newType === "exclusive_border") {
      const firstBorder =
        AVATAR_BORDERS.find((b) => b.id !== "default") || AVATAR_BORDERS[1];
      setFormData((prev) => ({
        ...prev,
        type: newType,
        label: firstBorder.name,
        icon: firstBorder.previewEmoji || "✨",
        value: firstBorder.id,
        color: "#4c1d95",
        textColor: "#e9d5ff",
      }));
    } else if (newType === "badge") {
      const firstBadge = AVATAR_BADGES[0];
      setFormData((prev) => ({
        ...prev,
        type: "badge",
        label: firstBadge.name,
        icon: firstBadge.emoji || "🍀",
        value: firstBadge.id,
        color: "#0d9488",
        textColor: "#ffffff",
      }));
    } else if (newType === "reserve") {
      setFormData((prev) => ({
        ...prev,
        type: "reserve",
        label: "+1 حضور احتياطي",
        icon: "🛡️",
        value: 1,
        color: "#059669",
        textColor: "#ffffff",
      }));
    } else if (newType === "spin_again") {
      setFormData((prev) => ({
        ...prev,
        type: "spin_again",
        label: "لفة إضافية مجانية",
        icon: "🔄",
        value: 0,
        color: "#e11d48",
        textColor: "#ffffff",
      }));
    } else if (newType === "green_card") {
      setFormData((prev) => ({
        ...prev,
        type: "green_card",
        label: "+1 Green Card",
        icon: "🟩",
        value: 1,
        color: "#059669",
        textColor: "#ecfdf5",
      }));
    } else if (newType === "blue_card") {
      setFormData((prev) => ({
        ...prev,
        type: "blue_card",
        label: "+1 Blue Card",
        icon: "🟦",
        value: 1,
        color: "#0284c7",
        textColor: "#eff6ff",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        type: newType,
      }));
    }
  };

  // عند اختيار إطار محدد من القائمة
  const handleSelectBorder = (borderId) => {
    const selected = AVATAR_BORDERS.find((b) => b.id === borderId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        label: selected.name,
        icon: selected.previewEmoji || "✨",
        value: selected.id,
        type: selected.isExclusive ? "exclusive_border" : "border",
      }));
    }
  };

  // عند اختيار شارة محددة من القائمة
  const handleSelectBadge = (badgeId) => {
    const selected = AVATAR_BADGES.find((b) => b.id === badgeId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        label: selected.name,
        icon: selected.emoji || "🍀",
        value: selected.id,
      }));
    }
  };

  // حفظ الجائزة (إضافة أو تعديل)
  const handleSaveSectorForm = (e) => {
    e.preventDefault();
    if (!formData.label.trim()) {
      Swal.fire("تنبيه", "يرجى كتابة اسم الجائزة", "warning");
      return;
    }

    const percentage = Math.max(0, parseFloat(formData.percentage) || 0);

    if (editingSectorId) {
      setSectors((prev) =>
        prev.map((s) =>
          s.id === editingSectorId ? { ...formData, percentage } : s,
        ),
      );
      Swal.fire({
        icon: "success",
        title: "تم تعديل الجائزة",
        timer: 1200,
        showConfirmButton: false,
      });
    } else {
      const newSector = {
        ...formData,
        id: formData.id || "sector_" + Date.now(),
        percentage,
        enabled: true,
      };
      setSectors((prev) => [...prev, newSector]);
      Swal.fire({
        icon: "success",
        title: "تمت إضافة الجائزة للعجلة 🎉",
        text: "لا تنس الضغط على زر حفظ التغييرات لحفظها في السيرفر.",
        timer: 1800,
        showConfirmButton: false,
      });
    }

    setModalOpen(false);
  };

  // حذف قطاع بالكامل من العجلة
  const handleDeleteSector = async (id, label) => {
    if (sectors.length <= 2) {
      Swal.fire("تنبيه", "يجب أن تحتوي العجلة على قطاعين على الأقل", "warning");
      return;
    }

    const result = await Swal.fire({
      title: "حذف جائزة " + label + "؟",
      text: "سيتم حذف هذه الجائزة نهائياً من عجلة الحظ.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "نعم، احذفها",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
    });

    if (result.isConfirmed) {
      setSectors((prev) => prev.filter((s) => s.id !== id));
      Swal.fire({
        icon: "success",
        title: "تم الحذف",
        text: "تم حذف الجائزة من العجلة (اضغط حفظ التغييرات لاعتمادها في السيرفر).",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  // تحديث نسبة قطاع معين
  const handlePercentageChange = (id, newPct) => {
    const parsed = Math.max(0, parseFloat(newPct) || 0);
    setSectors((prev) =>
      prev.map((s) => (s.id === id ? { ...s, percentage: parsed } : s)),
    );
  };

  // تفعيل / تعطيل قطاع
  const handleToggleSector = (id) => {
    setSectors((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
    );
  };

  // موازنة تلقائية للنسب لتصبح 100% تماماً
  const handleAutoNormalize = () => {
    const enabledSectors = sectors.filter((s) => s.enabled !== false);
    if (enabledSectors.length === 0) {
      Swal.fire("تنبيه", "يجب تفعيل قطاع واحد على الأقل للموازنة", "warning");
      return;
    }

    const currentSum = enabledSectors.reduce(
      (sum, s) => sum + (parseFloat(s.percentage) || 0),
      0,
    );

    if (currentSum === 0) {
      const equalShare = Math.round((100 / enabledSectors.length) * 100) / 100;
      setSectors((prev) =>
        prev.map((s) =>
          s.enabled !== false ? { ...s, percentage: equalShare } : s,
        ),
      );
      return;
    }

    const factor = 100 / currentSum;
    let distributedSum = 0;
    const updated = sectors.map((s) => {
      if (s.enabled === false) return s;
      const normalized =
        Math.round((parseFloat(s.percentage) || 0) * factor * 100) / 100;
      distributedSum += normalized;
      return { ...s, percentage: normalized };
    });

    const diff = Math.round((100 - distributedSum) * 100) / 100;
    if (Math.abs(diff) > 0) {
      let maxIdx = -1;
      let maxVal = -1;
      updated.forEach((s, idx) => {
        if (s.enabled !== false && s.percentage > maxVal) {
          maxVal = s.percentage;
          maxIdx = idx;
        }
      });
      if (maxIdx !== -1) {
        updated[maxIdx].percentage =
          Math.round((updated[maxIdx].percentage + diff) * 100) / 100;
      }
    }

    setSectors(updated);
    Swal.fire({
      icon: "success",
      title: "تمت الموازنة بنجاح! ⚖️",
      text: "تمت إعادة توزيع النسب المئوية تلقائياً لتساوي 100.00% تماماً.",
      timer: 1800,
      showConfirmButton: false,
    });
  };

  // استعادة الإعدادات الافتراضية
  const handleResetDefaults = async () => {
    const result = await Swal.fire({
      title: "استعادة الإعدادات الافتراضية؟",
      text: "سيتم إعادة تعيين جميع النسب والجوائز إلى الإعدادات الافتراضية.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "نعم، استعد الافتراضي",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#f59e0b",
      cancelButtonColor: "#64748b",
    });

    if (result.isConfirmed) {
      setSectors(DEFAULT_WHEEL_SECTORS);
      setCooldownHours(24);
      setIsActive(true);
      setGreenCardBorderIds(DEFAULT_WHEEL_CONFIG.greenCardBorderIds);
      setBlueCardItems(DEFAULT_WHEEL_CONFIG.blueCardItems);
      Swal.fire({
        icon: "success",
        title: "تمت الاستعادة",
        text: "تمت استعادة الإعدادات الافتراضية (تذكر الضغط على حفظ لحفظها في السيرفر).",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  // حفظ في Firestore
  const handleSave = async () => {
    if (!isExact100) {
      const confirm = await Swal.fire({
        title: "تنبيه: مجموع النسب لا يساوي 100%",
        text:
          "المجموع الحالي للنسب هو " +
          totalPercentage +
          "%. هل تريد الحفظ على أي حال؟",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "حفظ على أي حال",
        cancelButtonText: "سأقوم بالموازنة أولاً",
        confirmButtonColor: "#d97706",
        cancelButtonColor: "#3b82f6",
      });
      if (!confirm.isConfirmed) return;
    }

    try {
      setSaving(true);
      const newConfig = {
        cooldownHours: Number(cooldownHours) || 24,
        isActive: Boolean(isActive),
        greenCardBorderIds,
        blueCardItems,
        sectors: sectors.map((s) => ({
          ...s,
          percentage: parseFloat(s.percentage) || 0,
        })),
      };

      await saveLuckyWheelConfig(newConfig);
      setConfig(newConfig);

      Swal.fire({
        icon: "success",
        title: "تم الحفظ بنجاح! 🎉",
        text: "تم تحديث إعدادات وجوائز عجلة الحظ، وتطبيقها فوراً لجميع الطلاب.",
        timer: 2500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error saving lucky wheel config:", err);
      Swal.fire("خطأ", "فشل حفظ الإعدادات في قاعدة البيانات", "error");
    } finally {
      setSaving(false);
    }
  };

  // تشغيل محاكي اللفات التجريبي
  const runSimulation = (count = 1000) => {
    setIsSimulating(true);
    setTimeout(() => {
      const counts = {};
      sectors.forEach((s) => {
        counts[s.id] = 0;
      });

      for (let i = 0; i < count; i++) {
        const winIdx = getWeightedSectorIndex(sectors);
        const wonSector = sectors[winIdx];
        if (wonSector) {
          counts[wonSector.id] = (counts[wonSector.id] || 0) + 1;
        }
      }

      const results = sectors.map((s) => {
        const hits = counts[s.id] || 0;
        const actualPct = Math.round((hits / count) * 10000) / 100;
        return {
          ...s,
          hits,
          actualPct,
        };
      });

      setSimResults({
        totalSpins: count,
        results,
      });
      setIsSimulating(false);
    }, 300);
  };

  // دوال مساعدة لإدارة Blue Card items
  const handleToggleBlueCardBorder = (borderId) => {
    setBlueCardItems((current) => {
      const exists = current.some(
        (item) => (item.borderId || item.id) === borderId,
      );
      if (exists) {
        return current.filter(
          (item) => (item.borderId || item.id) !== borderId,
        );
      } else {
        return [...current, { borderId, durationDays: 3 }];
      }
    });
  };

  const handleUpdateBlueCardDuration = (borderId, days) => {
    const parsedDays = Math.max(1, parseInt(days) || 1);
    setBlueCardItems((current) =>
      current.map((item) =>
        (item.borderId || item.id) === borderId
          ? { ...item, durationDays: parsedDays }
          : item,
      ),
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-400">
            جاري تحميل إعدادات عجلة الحظ...
          </p>
        </div>
      </div>
    );
  }

  const totalSectorsCount = sectors.length;
  const sectorAngle = totalSectorsCount > 0 ? 360 / totalSectorsCount : 360;
  const wheelSize = 220;
  const wheelCenter = wheelSize / 2;
  const wheelRadius = wheelCenter - 6;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6" dir="rtl">
      {/* ── الرأس والإحصائيات العلوية ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/20 shrink-0">
              🎡
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black text-white">
                  إدارة عجلة الحظ والجوائز
                </h1>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  تحكم كامل بالنسبة المئوية %
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                أضف إطارات حصرية، نقاط، أو ألقاب جديدة إلى العجلة، وتحكم في نسب
                ظهورها أو احذف أي جائزة بنقرة واحدة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleOpenAddModal}
              className="px-5 py-3 rounded-2xl bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة جائزة للعجلة</span>
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 rounded-2xl bg-linear-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "جاري الحفظ..." : "حفظ التغييرات"}</span>
            </button>
          </div>
        </div>

        {/* شريط الإحصائيات السريعة */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50">
            <span className="text-[11px] text-slate-400 block mb-1">
              مجموع النسب الحالي
            </span>
            <div className="flex items-center gap-2">
              <span
                className={
                  "text-xl font-black " +
                  (isExact100 ? "text-emerald-400" : "text-amber-400")
                }
              >
                {totalPercentage}%
              </span>
              {isExact100 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
              )}
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50">
            <span className="text-[11px] text-slate-400 block mb-1">
              عدد الجوائز بالعجلة
            </span>
            <span className="text-xl font-black text-white">
              {sectors.length} جوائز
            </span>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50">
            <span className="text-[11px] text-slate-400 block mb-1">
              فترة الانتظار (Cooldown)
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                max="168"
                value={cooldownHours}
                onChange={(e) =>
                  setCooldownHours(Math.max(1, parseInt(e.target.value) || 24))
                }
                className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-center font-bold text-amber-400 text-sm"
              />
              <span className="text-xs text-slate-400 font-bold">ساعة</span>
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50">
            <span className="text-[11px] text-slate-400 block mb-1">
              حالة العجلة للطلاب
            </span>
            <button
              onClick={() => setIsActive(!isActive)}
              className={
                "flex items-center gap-2 font-bold text-xs px-2.5 py-1 rounded-xl transition-all " +
                (isActive
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-rose-500/20 text-rose-300")
              }
            >
              {isActive ? (
                <ToggleRight className="w-4 h-4 text-emerald-400" />
              ) : (
                <ToggleLeft className="w-4 h-4 text-rose-400" />
              )}
              <span>{isActive ? "مفعلة وتعمل" : "معطلة مؤقتاً"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── إعدادات Green Card ── */}
      <section
        className="rounded-3xl border border-emerald-500/30 bg-emerald-950/25 p-5 shadow-xl"
        aria-label="إعدادات Green Card"
      >
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-2xl">
              🟩
            </div>
            <div>
              <h2 className="font-black text-emerald-200">
                جوائز Green Card (إطارات دائمة)
              </h2>
              <p className="text-xs text-emerald-100/65">
                عند استخدام البطاقة، تظهر هذه الإطارات فقط في العجلة بفرص
                متساوية ويحصل الطالب عليها بشكل دائم.
              </p>
            </div>
          </div>
          <span className="self-start rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-300 sm:self-auto">
            {greenCardBorderIds.length} إطارات مختارة
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {AVATAR_BORDERS.filter((border) => border.id !== "default").map(
            (border) => {
              const selected = greenCardBorderIds.includes(border.id);
              return (
                <label
                  key={border.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition ${selected ? "border-emerald-400/70 bg-emerald-500/15" : "border-slate-700 bg-slate-900/60 hover:border-emerald-500/40"}`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() =>
                      setGreenCardBorderIds((current) =>
                        selected
                          ? current.filter((id) => id !== border.id)
                          : [...current, border.id],
                      )
                    }
                    className="h-4 w-4 accent-emerald-500"
                  />
                  <span className="text-xl">{border.previewEmoji || "✨"}</span>
                  <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-100">
                    {border.name}
                  </span>
                  {border.isExclusive && (
                    <span className="text-[10px] text-amber-300">حصري</span>
                  )}
                </label>
              );
            },
          )}
        </div>
        {greenCardBorderIds.length === 0 && (
          <p className="mt-3 text-xs font-bold text-rose-300">
            اختر إطاراً واحداً على الأقل حتى تصبح Green Card قابلة للاستخدام.
          </p>
        )}
      </section>

      {/* ── إعدادات Blue Card ── */}
      <section
        className="rounded-3xl border border-sky-500/30 bg-sky-950/25 p-5 shadow-xl"
        aria-label="إعدادات Blue Card"
      >
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/20 text-2xl">
              🟦
            </div>
            <div>
              <h2 className="font-black text-sky-200">
                جوائز Blue Card (إطارات مؤقتة بمدد محددة)
              </h2>
              <p className="text-xs text-sky-100/65">
                عند استخدام البطاقة، تظهر هذه الإطارات بفرص متساوية وتُمنح
                للطالب للمدة المحددة لكل إطار (مثلاً: 1 يوم، 3 أيام، 7 أيام).
              </p>
            </div>
          </div>
          <span className="self-start rounded-full border border-sky-400/30 bg-sky-500/15 px-3 py-1 text-xs font-black text-sky-300 sm:self-auto">
            {blueCardItems.length} إطارات مؤقتة مختارة
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AVATAR_BORDERS.filter((border) => border.id !== "default").map(
            (border) => {
              const currentItem = blueCardItems.find(
                (item) => (item.borderId || item.id) === border.id,
              );
              const selected = Boolean(currentItem);
              const durationDays = currentItem?.durationDays || 3;

              return (
                <div
                  key={border.id}
                  className={`rounded-2xl border p-3.5 transition-all flex flex-col justify-between gap-2.5 ${
                    selected
                      ? "border-sky-400/70 bg-sky-950/40 shadow-md shadow-sky-500/10"
                      : "border-slate-700 bg-slate-900/60 hover:border-sky-500/30"
                  }`}
                >
                  <div
                    onClick={() => handleToggleBlueCardBorder(border.id)}
                    className="flex items-center gap-3 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => handleToggleBlueCardBorder(border.id)}
                      className="h-4 w-4 accent-sky-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="text-xl">
                      {border.previewEmoji || "✨"}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-100">
                      {border.name}
                    </span>
                    {border.isExclusive && (
                      <span className="text-[10px] text-amber-300 font-bold">
                        حصري
                      </span>
                    )}
                  </div>

                  {selected && (
                    <div className="mt-1 pt-2 border-t border-sky-500/20 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[11px] text-sky-200">
                        <span className="font-semibold">
                          مدة الصلاحية للطالب:
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            max="365"
                            value={durationDays}
                            onChange={(e) =>
                              handleUpdateBlueCardDuration(
                                border.id,
                                e.target.value,
                              )
                            }
                            className="w-12 rounded-lg border border-sky-500/40 bg-slate-900 px-1.5 py-0.5 text-center text-xs font-bold text-sky-300 focus:outline-none focus:ring-1 focus:ring-sky-400"
                          />
                          <span className="text-slate-400 font-bold">يوم</span>
                        </div>
                      </div>

                      {/* أزرار سريعة لاختيار المدة */}
                      <div className="flex items-center gap-1">
                        {[1, 3, 7, 14, 30].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() =>
                              handleUpdateBlueCardDuration(border.id, preset)
                            }
                            className={`flex-1 py-0.5 rounded-md text-[10px] font-black transition-all ${
                              durationDays === preset
                                ? "bg-sky-500 text-slate-950 shadow-xs"
                                : "bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700"
                            }`}
                          >
                            {preset}ي
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            },
          )}
        </div>
        {blueCardItems.length === 0 && (
          <p className="mt-3 text-xs font-bold text-rose-300">
            اختر إطاراً واحداً على الأقل حتى تصبح Blue Card قابلة للاستخدام.
          </p>
        )}
      </section>

      {/* ── أدوات التحكم السريعة ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleAutoNormalize}
            className="px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>موازنة تلقائية إلى 100%</span>
          </button>

          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className={
              "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer " +
              (showSimulator
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700")
            }
          >
            <Play className="w-3.5 h-3.5" />
            <span>
              {showSimulator ? "إخفاء المحاكي" : "تشغيل محاكي السحب التجريبي"}
            </span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700/60 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة الافتراضي</span>
          </button>
        </div>

        <div className="text-xs text-slate-400">
          اضغط على زر{" "}
          <span className="text-emerald-400 font-bold">+ إضافة جائزة</span>{" "}
          لإضافة إطارات أو نقاط جديدة للعجلة.
        </div>
      </div>

      {/* ── محاكي السحب التجريبي (Simulation Box) ── */}
      <AnimatePresence>
        {showSimulator && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-purple-950/30 border border-purple-800/50 rounded-3xl p-6 overflow-hidden space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="font-black text-white text-base">
                  محاكي السحب Monte Carlo
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">
                  عدد اللفات التجريبية:
                </span>
                {[100, 1000, 10000].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      setSimCount(num);
                      runSimulation(num);
                    }}
                    disabled={isSimulating}
                    className={
                      "px-3 py-1 rounded-lg text-xs font-black transition-all " +
                      (simCount === num
                        ? "bg-purple-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white")
                    }
                  >
                    {num.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {simResults && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
                {simResults.results.map((r) => (
                  <div
                    key={r.id}
                    className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-center"
                  >
                    <span className="text-xl block mb-1">{r.icon}</span>
                    <span className="text-xs font-bold text-white block truncate">
                      {r.label}
                    </span>
                    <div className="mt-2 text-[11px] space-y-0.5">
                      <div className="text-slate-400">
                        الهدف:{" "}
                        <span className="text-amber-400 font-bold">
                          {r.percentage}%
                        </span>
                      </div>
                      <div className="text-slate-300">
                        الفعلي:{" "}
                        <span className="text-emerald-400 font-bold">
                          {r.actualPct}%
                        </span>{" "}
                        ({r.hits})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── العرض الرئيسي: معاينة العجلة + جدول الجوائز ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* معاينة شكل العجلة */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
          <h3 className="font-bold text-sm text-white mb-2 flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400" />
            <span>معاينة حية لشكل العجلة</span>
          </h3>
          <p className="text-[11px] text-slate-400 mb-4">
            تتحدث تلقائياً مع إضافة أو تعديل أو حذف أي جائزة
          </p>

          <div className="relative p-2 rounded-full bg-linear-to-tr from-amber-500/30 via-slate-800 to-cyan-500/30 shadow-[0_0_25px_rgba(245,158,11,0.25)] my-2">
            <svg
              width={wheelSize}
              height={wheelSize}
              viewBox={"0 0 " + wheelSize + " " + wheelSize}
              className="rounded-full select-none"
            >
              <defs>
                {sectors.map((s, i) => (
                  <radialGradient
                    key={"grad-" + i}
                    id={"controlGrad-" + i}
                    cx="50%"
                    cy="50%"
                    r="50%"
                  >
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
                    <stop
                      offset="100%"
                      stopColor={s.color || "#475569"}
                      stopOpacity="1"
                    />
                  </radialGradient>
                ))}
              </defs>

              <g>
                {sectors.map((sector, i) => {
                  const startAngle = i * sectorAngle;
                  const endAngle = (i + 1) * sectorAngle;
                  const path = getSectorPath(
                    wheelCenter,
                    wheelCenter,
                    wheelRadius,
                    startAngle,
                    endAngle,
                  );
                  const midAngle = startAngle + sectorAngle / 2;

                  return (
                    <g
                      key={sector.id || i}
                      opacity={sector.enabled !== false ? 1 : 0.25}
                    >
                      <path
                        d={path}
                        fill={"url(#controlGrad-" + i + ")"}
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      />
                      <g
                        transform={
                          "rotate(" +
                          midAngle +
                          ", " +
                          wheelCenter +
                          ", " +
                          wheelCenter +
                          ")"
                        }
                      >
                        <text
                          x={wheelCenter}
                          y={wheelCenter - wheelRadius + 22}
                          fill={sector.textColor || "#ffffff"}
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {sector.icon}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>

              <circle
                cx={wheelCenter}
                cy={wheelCenter}
                r={20}
                fill="#0f172a"
                stroke="#fbbf24"
                strokeWidth="2"
              />
              <circle cx={wheelCenter} cy={wheelCenter} r={8} fill="#f59e0b" />
            </svg>
          </div>

          <span className="text-xs text-slate-400 mt-3">
            {sectors.filter((s) => s.enabled !== false).length} قطاعات نشطة من
            أصل {sectors.length}
          </span>
        </div>

        {/* قائمة وجدول الجوائز */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-400" />
              <span>قائمة جوائز العجلة الحالية ({sectors.length})</span>
            </h3>
            <button
              onClick={handleOpenAddModal}
              className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة جائزة جديدة</span>
            </button>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {sectors.map((sector) => {
              const isEnabled = sector.enabled !== false;
              const isBorder =
                sector.type === "exclusive_border" || sector.type === "border";

              return (
                <div
                  key={sector.id}
                  className={
                    "p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 " +
                    (isEnabled
                      ? "bg-slate-800/70 border-slate-700/80 hover:border-slate-600"
                      : "bg-slate-900/40 border-slate-800/40 opacity-60")
                  }
                >
                  <div className="flex items-center gap-3.5">
                    {/* أيقونة ولون القطاع */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-md shrink-0 border border-white/20"
                      style={{ backgroundColor: sector.color || "#475569" }}
                    >
                      {sector.icon}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-white text-sm">
                          {sector.label}
                        </span>
                        {isBorder && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            إطار أسطوري 👑
                          </span>
                        )}
                        {sector.type === "points" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            نقاط 🪙
                          </span>
                        )}
                        {sector.type === "reserve" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            حضور 🛡️
                          </span>
                        )}
                        {sector.type === "badge" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30">
                            لقب 🍀
                          </span>
                        )}
                        {sector.type === "green_card" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Green Card 🟩
                          </span>
                        )}
                        {sector.type === "blue_card" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            Blue Card 🟦
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        القيمة: {String(sector.value)} | المعرّف: {sector.id}
                      </span>
                    </div>
                  </div>

                  {/* نسبة الظهور وأزرار التعديل والحذف */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {/* حقل النسبة المئوية */}
                    <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={sector.percentage}
                        onChange={(e) =>
                          handlePercentageChange(sector.id, e.target.value)
                        }
                        disabled={!isEnabled}
                        className="w-16 bg-transparent text-left font-black text-amber-400 text-sm focus:outline-none"
                      />
                      <span className="text-xs font-bold text-slate-400">
                        %
                      </span>
                    </div>

                    {/* زر التفعيل / التعطيل */}
                    <button
                      onClick={() => handleToggleSector(sector.id)}
                      title={isEnabled ? "تعطيل مؤقتاً" : "تفعيل"}
                      className={
                        "p-2 rounded-xl transition-all cursor-pointer " +
                        (isEnabled
                          ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                          : "bg-slate-800 text-slate-500 hover:bg-slate-700")
                      }
                    >
                      {isEnabled ? (
                        <ToggleRight className="w-4 h-4" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                    </button>

                    {/* زر التعديل */}
                    <button
                      onClick={() => handleOpenEditModal(sector)}
                      title="تعديل تفاصيل الجائزة"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-300 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* زر الحذف */}
                    <button
                      onClick={() =>
                        handleDeleteSector(sector.id, sector.label)
                      }
                      title="حذف الجائزة نهائياً من العجلة"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600/30 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Modal إضافة / تعديل جائزة للعجلة ── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {editingSectorId ? "✏️" : "➕"}
                  </span>
                  <h3 className="font-black text-lg text-white">
                    {editingSectorId
                      ? "تعديل بيانات الجائزة"
                      : "إضافة جائزة جديدة لعجلة الحظ"}
                  </h3>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveSectorForm} className="space-y-4">
                {/* 1. نوع الجائزة */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    نوع الجائزة
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        id: "exclusive_border",
                        label: "إطار أسطوري",
                        icon: "👑",
                      },
                      { id: "points", label: "نقاط", icon: "🪙" },
                      { id: "badge", label: "لقب وشارة", icon: "🍀" },
                      { id: "reserve", label: "حضور احتياطي", icon: "🛡️" },
                      { id: "spin_again", label: "لفة إضافية", icon: "🔄" },
                      { id: "green_card", label: "Green Card", icon: "🟩" },
                      { id: "blue_card", label: "Blue Card", icon: "🟦" },
                      { id: "custom", label: "مخصص", icon: "🎁" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleTypeChange(t.id)}
                        className={
                          "p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer " +
                          (formData.type === t.id
                            ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-md"
                            : "bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-600")
                        }
                      >
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* إذا كان النوع Green Card أو Blue Card: تلميح للقيمة */}
                {(formData.type === "green_card" ||
                  formData.type === "blue_card") && (
                  <div className={`rounded-xl border px-3 py-2 text-xs font-bold ${formData.type === "green_card" ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-300" : "border-sky-500/40 bg-sky-950/20 text-sky-300"}`}>
                    {formData.type === "green_card" ? "🟩" : "🟦"}{" "}
                    عند الفوز بهذه الجائزة، يحصل الطالب على عدد من البطاقات تحدده في حقل &quot;القيمة&quot; أدناه (مثلاً: 1 أو 2). يستخدم الطالب البطاقة لاحقاً لتدوير عجلة خاصة بالإطارات.
                  </div>
                )}

                {/* إذا كان النوع إطار: قائمة اختيار من إطارات المنصة */}
                {(formData.type === "exclusive_border" ||
                  formData.type === "border") && (
                  <div>
                    <label className="text-xs font-bold text-purple-300 block mb-1.5">
                      اختر الإطار من إطارات المنصة
                    </label>
                    <select
                      value={formData.value}
                      onChange={(e) => handleSelectBorder(e.target.value)}
                      className="w-full bg-slate-800 border border-purple-500/40 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none"
                    >
                      {AVATAR_BORDERS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.previewEmoji || "✨"} {b.name} (
                          {b.rarity || "border"})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* إذا كان النوع شارة: قائمة اختيار من شارات المنصة */}
                {formData.type === "badge" && (
                  <div>
                    <label className="text-xs font-bold text-teal-300 block mb-1.5">
                      اختر اللقب / الشارة
                    </label>
                    <select
                      value={formData.value}
                      onChange={(e) => handleSelectBadge(e.target.value)}
                      className="w-full bg-slate-800 border border-teal-500/40 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none"
                    >
                      {AVATAR_BADGES.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.emoji} {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 2. اسم الجائزة والأيقونة */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="col-span-3">
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      اسم الجائزة (يظهر بالعجلة)
                    </label>
                    <input
                      type="text"
                      value={formData.label}
                      onChange={(e) =>
                        setFormData({ ...formData, label: e.target.value })
                      }
                      placeholder="مثلاً: +50 نقطة أو الشبح 👻"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      الأيقونة
                    </label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) =>
                        setFormData({ ...formData, icon: e.target.value })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center text-lg text-white font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* 3. القيمة والنسبة المئوية */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      {formData.type === "points"
                        ? "عدد النقاط"
                        : formData.type === "reserve"
                          ? "عدد مرات الحضور"
                          : "القيمة البرمجية (Value)"}
                    </label>
                    <input
                      type={
                        formData.type === "points" ||
                        formData.type === "reserve"
                          ? "number"
                          : "text"
                      }
                      value={formData.value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          value:
                            formData.type === "points" ||
                            formData.type === "reserve"
                              ? Number(e.target.value) || 0
                              : e.target.value,
                        })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-amber-300 block mb-1">
                      نسبة الظهور المئوية (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.percentage}
                      onChange={(e) =>
                        setFormData({ ...formData, percentage: e.target.value })
                      }
                      className="w-full bg-slate-800 border border-amber-500/50 rounded-xl px-3 py-2 text-sm text-amber-400 font-black focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* 4. ألوان القطاع */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    لون خلفية القطاع في العجلة
                  </label>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: c })}
                        className={
                          "w-6 h-6 rounded-full border-2 transition-all cursor-pointer " +
                          (formData.color === c
                            ? "border-white scale-110 shadow-md"
                            : "border-transparent opacity-80")
                        }
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      className="w-10 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                {/* أزرار الإجراءات */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-xs cursor-pointer"
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    {editingSectorId ? "حفظ التعديلات" : "إضافة للعجلة 🎡"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
