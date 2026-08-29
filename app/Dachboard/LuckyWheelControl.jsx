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
} from "lucide-react";
import Swal from "sweetalert2";
import {
  DEFAULT_WHEEL_CONFIG,
  DEFAULT_WHEEL_SECTORS,
  getLuckyWheelConfig,
  saveLuckyWheelConfig,
  getWeightedSectorIndex,
} from "@/app/utils/luckyWheelConfig";

export default function LuckyWheelControl() {
  const [config, setConfig] = useState(DEFAULT_WHEEL_CONFIG);
  const [sectors, setSectors] = useState(DEFAULT_WHEEL_SECTORS);
  const [cooldownHours, setCooldownHours] = useState(24);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // حالة محاكي اللفات (Simulator)
  const [showSimulator, setShowSimulator] = useState(false);
  const [simResults, setSimResults] = useState(null);
  const [simCount, setSimCount] = useState(1000);
  const [isSimulating, setIsSimulating] = useState(false);

  // جلب الإعدادات من Firestore عند التحميل
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getLuckyWheelConfig();
        setConfig(data);
        setSectors(data.sectors || DEFAULT_WHEEL_SECTORS);
        setCooldownHours(data.cooldownHours ?? 24);
        setIsActive(data.isActive ?? true);
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

  // تحديث نسبة قطاع معين
  const handlePercentageChange = (id, newPct) => {
    const parsed = Math.max(0, parseFloat(newPct) || 0);
    setSectors((prev) =>
      prev.map((s) => (s.id === id ? { ...s, percentage: parsed } : s))
    );
  };

  // تفعيل / تعطيل قطاع
  const handleToggleSector = (id) => {
    setSectors((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
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
      0
    );

    if (currentSum === 0) {
      // إذا كان الكل 0، وزع بالتساوي
      const equalShare = Math.round((100 / enabledSectors.length) * 100) / 100;
      setSectors((prev) =>
        prev.map((s) =>
          s.enabled !== false ? { ...s, percentage: equalShare } : s
        )
      );
      return;
    }

    // مقياس الموازنة
    const factor = 100 / currentSum;
    let distributedSum = 0;
    const updated = sectors.map((s) => {
      if (s.enabled === false) return s;
      const normalized = Math.round((parseFloat(s.percentage) || 0) * factor * 100) / 100;
      distributedSum += normalized;
      return { ...s, percentage: normalized };
    });

    // ضبط الفرق البسيط الناتج عن التقريب على أكبر قطاع
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
      text: "سيتم إعادة تعيين جميع النسب والجوائز إلى الإعدادات الموصى بها الافتراضية.",
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
        text: `المجموع الحالي للنسب هو ${totalPercentage}%. هل تريد الحفظ على أي حال أم تفضل الموازنة أولاً إلى 100%؟`,
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
        text: "تم تحديث نسب وجوائز عجلة الحظ، وتم تطبيقها فوراً لجميع الطلاب.",
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
    }, 200);
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400">جاري تحميل إعدادات عجلة الحظ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6" dir="rtl">
      {/* ── Header ── */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-right">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl shadow-lg">
              🎡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">
                  التحكم في عجلة الحظ اليومية
                </h1>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black px-2.5 py-0.5 rounded-full">
                  النسب المئوية %
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                حدد بالضبط النسبة المئوية لظهور كل جائزة من العجلة وتحكم في وقت اللف والتفعيل
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setShowSimulator(true);
                runSimulation(simCount);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 font-bold text-xs shadow-md transition-all hover:scale-105"
            >
              <Play className="w-4 h-4 text-purple-400" />
              <span>محاكي اللفات التجريبي 🧪</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs shadow-md transition-all hover:scale-105"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>استعادة الافتراضي</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-linear-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "جاري الحفظ..." : "حفظ التغييرات 💾"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Total Percentage Bar & Alert ── */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isExact100
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
              }`}
            >
              {isExact100 ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-800 dark:text-white">
                  المجموع الكلي لنسب الجوائز:
                </span>
                <span
                  className={`text-lg font-black font-mono px-3 py-0.5 rounded-full border ${
                    isExact100
                      ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                      : totalPercentage > 100
                        ? "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 border-rose-300 dark:border-rose-700"
                        : "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                  }`}
                >
                  {totalPercentage}%
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {isExact100
                  ? "النسب متطابقة بنسبة 100% تماماً ومثالية للتطبيق العملي."
                  : totalPercentage < 100
                    ? `المجموع أقل من 100% بمقدار ${(100 - totalPercentage).toFixed(2)}% — اضغط زر الموازنة التلقائية لضبطها فوراً.`
                    : `المجموع يتجاوز 100% بمقدار ${(totalPercentage - 100).toFixed(2)}% — اضغط زر الموازنة التلقائية لتعديلها.`}
              </p>
            </div>
          </div>

          {!isExact100 && (
            <button
              type="button"
              onClick={handleAutoNormalize}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Scale className="w-4 h-4" />
              <span>موازنة تلقائية إلى 100.00% ⚖️</span>
            </button>
          )}
        </div>

        {/* شريط التقدم المرئي */}
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden flex shadow-inner">
          <div
            className={`h-full transition-all duration-500 ${
              isExact100
                ? "bg-linear-to-r from-emerald-500 to-teal-400"
                : totalPercentage > 100
                  ? "bg-linear-to-r from-rose-500 to-red-600"
                  : "bg-linear-to-r from-amber-500 to-yellow-400"
            }`}
            style={{ width: `${Math.min(100, totalPercentage)}%` }}
          />
        </div>
      </div>

      {/* ── General Configuration Bar ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* فترة الانتظار (Cooldown) */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-800 dark:text-white">
                فترة إعادة اللف (Cooldown)
              </h3>
              <p className="text-xs text-gray-400">
                الوقت الذي يجب على الطالب انتظاره بين كل لفة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {[24, 12, 6, 1].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setCooldownHours(h)}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                  cooldownHours === h
                    ? "bg-amber-500 text-slate-950 shadow-md"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>

        {/* حالة تفعيل العجلة بالكامل */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-800 dark:text-white">
                حالة نظام العجلة
              </h3>
              <p className="text-xs text-gray-400">
                {isActive ? "العجلة مفعلة ومتاحة للطلاب حالياً" : "العجلة معطلة ومغلقة مؤقتاً"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              isActive
                ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/40"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700"
            }`}
          >
            {isActive ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
            <span>{isActive ? "مفعلة ✅" : "معطلة ⏸️"}</span>
          </button>
        </div>
      </div>

      {/* ── Prizes & Probabilities Grid ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2">
            <span>الجوائز والنسب المئوية</span>
            <span className="text-xs text-gray-400 font-normal">
              ({sectors.length} قطاعات)
            </span>
          </h2>
          <span className="text-xs text-gray-400">
            يمكنك كتابة النسبة العشرية مباشرة (مثال: 0.1 أو 65 أو 2.5)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectors.map((sector, index) => {
            const isEnabled = sector.enabled !== false;
            const pct = parseFloat(sector.percentage) || 0;
            // حساب احتمال اللفات التقريبي (1 من كل X لفة)
            const ratio = pct > 0 ? (100 / pct).toFixed(1) : "—";

            return (
              <motion.div
                key={sector.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white dark:bg-gray-900 rounded-3xl p-5 border transition-all flex flex-col justify-between ${
                  !isEnabled
                    ? "opacity-50 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50"
                    : pct >= 20
                      ? "border-amber-400/40 dark:border-amber-500/30 shadow-md ring-1 ring-amber-400/10"
                      : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 shadow-sm"
                }`}
              >
                <div>
                  {/* الرأس: الأيقونة واسم الجائزة وزر التفعيل */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-md border border-white/20"
                        style={{ backgroundColor: sector.color, color: sector.textColor }}
                      >
                        {sector.icon}
                      </div>
                      <div>
                        <h4 className="font-black text-gray-800 dark:text-white text-sm">
                          {sector.label}
                        </h4>
                        <span className="text-[10px] text-gray-400 font-medium block">
                          {sector.type === "points" && `نقاط مكتسبة (+${sector.value})`}
                          {sector.type === "reserve" && `حضور احتياطي (+${sector.value})`}
                          {sector.type === "badge" && `لقب مخصص (${sector.value})`}
                          {sector.type === "exclusive_border" && `إطار أسطوري حصري (${sector.value})`}
                          {sector.type === "spin_again" && "لفة إضافية مجانية"}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleSector(sector.id)}
                      className={`p-1.5 rounded-xl transition-all ${
                        isEnabled
                          ? "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                          : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                      title={isEnabled ? "تعطيل هذا القطاع" : "تفعيل هذا القطاع"}
                    >
                      {isEnabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    </button>
                  </div>

                  {/* إدخال النسبة المئوية */}
                  <div className="bg-gray-50 dark:bg-gray-800/80 rounded-2xl p-3 border border-gray-100 dark:border-gray-700/60 mb-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5 text-amber-500" />
                        <span>نسبة الظهور (%):</span>
                      </span>
                      <span className="text-[11px] text-gray-400 font-mono">
                        {pct > 0 ? `1 من كل ~${ratio} لفة` : "غير متاح"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          disabled={!isEnabled}
                          value={sector.percentage}
                          onChange={(e) => handlePercentageChange(sector.id, e.target.value)}
                          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-base font-black font-mono text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all text-left dir-ltr"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-bold pointer-events-none">
                          %
                        </span>
                      </div>

                      {/* أزرار زيادة ونقصان سريعة */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={!isEnabled}
                          onClick={() =>
                            handlePercentageChange(sector.id, Math.max(0, pct - 1))
                          }
                          className="w-8 h-8 rounded-lg bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 font-bold text-xs flex items-center justify-center text-gray-600 dark:text-gray-300 disabled:opacity-50"
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          disabled={!isEnabled}
                          onClick={() =>
                            handlePercentageChange(sector.id, Math.min(100, pct + 1))
                          }
                          className="w-8 h-8 rounded-lg bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 font-bold text-xs flex items-center justify-center text-gray-600 dark:text-gray-300 disabled:opacity-50"
                        >
                          +1
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* مؤشر شريط النسبة */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-400">
                  <span>القطاع #{index + 1}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <span className="font-mono font-bold text-gray-600 dark:text-gray-300">
                      {pct}%
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Modal محاكي اللفات التجريبي (Simulator) ── */}
      <AnimatePresence>
        {showSimulator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowSimulator(false)}
            dir="rtl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-white">
                  <span className="text-2xl">🧪</span>
                  <h3 className="text-lg font-black">
                    محاكي اللفات التجريبي (Monte Carlo Simulation)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSimulator(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-400">
                يقوم المحاكي بإجراء عدد كبير من اللفات الافتراضية في ثانية واحدة بناءً على النسب المحددة، ليعرض لك النتائج الفعلية ومطابقتها للنسب المتوقعة.
              </p>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-300">عدد اللفات:</span>
                {[500, 1000, 5000, 10000].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      setSimCount(n);
                      runSimulation(n);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                      simCount === n
                        ? "bg-purple-600 text-white shadow-md shadow-purple-500/30"
                        : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                    }`}
                  >
                    {n.toLocaleString()} لفة
                  </button>
                ))}
              </div>

              {/* النتائج */}
              {isSimulating ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
                  <p className="text-xs text-slate-400">جاري تشغيل المحاكاة...</p>
                </div>
              ) : simResults ? (
                <div className="space-y-3">
                  <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 overflow-hidden">
                    <table className="w-full text-xs text-right">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-700 pb-2">
                          <th className="py-2">الجائزة</th>
                          <th className="py-2">النسبة المحددة (%)</th>
                          <th className="py-2">عدد مرات الفوز</th>
                          <th className="py-2">النسبة الفعلية (%)</th>
                          <th className="py-2 text-left">التطابق</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {simResults.results.map((r) => {
                          const target = parseFloat(r.percentage) || 0;
                          const diff = Math.abs(r.actualPct - target);
                          return (
                            <tr key={r.id} className="text-slate-200">
                              <td className="py-2.5 font-bold flex items-center gap-1.5">
                                <span>{r.icon}</span>
                                <span>{r.label}</span>
                              </td>
                              <td className="py-2.5 font-mono text-amber-400 font-bold">
                                {target}%
                              </td>
                              <td className="py-2.5 font-mono text-white">
                                {r.hits.toLocaleString()}
                              </td>
                              <td className="py-2.5 font-mono text-purple-300 font-bold">
                                {r.actualPct}%
                              </td>
                              <td className="py-2.5 text-left font-mono">
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                                    diff <= 1
                                      ? "bg-emerald-500/20 text-emerald-400"
                                      : "bg-amber-500/20 text-amber-400"
                                  }`}
                                >
                                  {diff <= 1 ? "ممتاز ✨" : `فرق ${diff.toFixed(2)}%`}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
