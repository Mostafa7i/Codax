"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Save,
  RotateCcw,
  Star,
  Eye,
  Gift,
  RefreshCw,
  Plus,
  Trash2,
  Coins,
  Clock,
  Award,
  Crown,
  Search,
  UserCheck,
  Flame,

} from "lucide-react";
import Swal from "sweetalert2";
import Link from "next/link";
import { db } from "@/app/services/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import {
  DEFAULT_GAMIFICATION_FEATURES_CONFIG,
  subscribeGamificationFeaturesConfig,
  saveGamificationFeaturesConfig,
  resetGamificationFeaturesConfigToDefault,
  adminAssignSpotlight,
  adminRemoveSpotlight,
  subscribeActiveSpotlights,
} from "@/app/services/gamificationFeaturesService";
import {
  AVATAR_BORDERS,
  getEffectiveActiveBorder,
  getAvatarBorder,
  getAvatarBadge,
} from "@/app/utils/avatarDecorations";
import AvatarFrame from "@/app/utils/AvatarFrame";

function ToggleSwitch({ enabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className="flex items-center gap-2.5 cursor-pointer select-none focus:outline-none"
    >
      <div
        className={`w-13 h-7 rounded-full p-1 transition-colors duration-200 flex items-center ${
          enabled
            ? "bg-emerald-500 shadow-lg shadow-emerald-500/25 justify-start"
            : "bg-slate-700 justify-end"
        }`}
      >
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 600, damping: 35 }}
          className="w-5 h-5 rounded-full bg-white shadow-md"
        />
      </div>
      <span
        className={`text-xs font-black transition-colors ${
          enabled ? "text-emerald-400" : "text-slate-400"
        }`}
      >
        {enabled ? "مفعل ✅" : "معطل ❌"}
      </span>
    </button>
  );
}

export default function GamificationFeaturesControl() {
  const [config, setConfig] = useState(DEFAULT_GAMIFICATION_FEATURES_CONFIG);
  const [activeTab, setActiveTab] = useState("spotlight");
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // ── إدارة تسليط الضوء الإداري للطلاب ──
  const [studentsList, setStudentsList] = useState([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("all");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [adminSpotlightMessage, setAdminSpotlightMessage] = useState(
    "نجم مميز تم اختياره وتكريمه من قبل إدارة المنصة! 🌟👑"
  );
  const [adminSpotlightDuration, setAdminSpotlightDuration] = useState(24);
  const [isAssigningAdminSpotlight, setIsAssigningAdminSpotlight] =
    useState(false);
  const [activeSpotlights, setActiveSpotlights] = useState([]);
  const [isRemovingSpotlightId, setIsRemovingSpotlightId] = useState(null);

  // جلب إعدادات التلعيب
  useEffect(() => {
    const unsub = subscribeGamificationFeaturesConfig((newConfig) => {
      if (newConfig) {
        setConfig(newConfig);
      }
    });
    return () => unsub();
  }, []);

  // الاستماع للنجوم النشطين حالياً في البانر
  useEffect(() => {
    const unsub = subscribeActiveSpotlights((list) => {
      setActiveSpotlights(list || []);
    });
    return () => unsub();
  }, []);

  // جلب قائمة الطلاب
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoadingStudents(true);
        const snap = await getDocs(collection(db, "students"));
        const list = snap.docs.map((d) => ({
          docId: d.id,
          ...d.data(),
        }));
        list.sort((a, b) => (a.name || "").localeCompare(b.name || "", "ar"));
        setStudentsList(list);
      } catch (err) {
        console.error("Error fetching students for gamification control:", err);
      } finally {
        setIsLoadingStudents(false);
      }
    };

    fetchStudents();
  }, []);

  // استخراج المجموعات الفريدة
  const uniqueGroups = useMemo(() => {
    const set = new Set();
    studentsList.forEach((s) => {
      if (s.group) set.add(s.group);
    });
    return Array.from(set).sort();
  }, [studentsList]);

  // تصفية الطلاب حسب المجموعة والبحث
  const filteredStudents = useMemo(() => {
    return studentsList.filter((s) => {
      const matchGroup =
        selectedGroupFilter === "all" || s.group === selectedGroupFilter;
      const q = studentSearchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.id && String(s.id).includes(q));
      return matchGroup && matchSearch;
    });
  }, [studentsList, selectedGroupFilter, studentSearchQuery]);

  // تسليط الضوء على الطالب إدارياً
  const handleAssignAdminSpotlight = async () => {
    if (!selectedStudent) {
      Swal.fire({
        icon: "warning",
        title: "يرجى اختيار طالب أولاً",
        text: "ابحث عن الطالب وحدده لتتويجه كنجم اليوم.",
        background: "#0f172a",
        color: "#f8fafc",
      });
      return;
    }

    const duration = Number(adminSpotlightDuration) || 24;
    const msg =
      adminSpotlightMessage.trim() ||
      "نجم مميز تم اختياره وتكريمه من قبل إدارة المنصة! 🌟👑";

    const confirmRes = await Swal.fire({
      title: `تسليط الضوء على «${selectedStudent.name}»؟`,
      text: `سيتم تتويجه كنجم اليوم في البانر لمدة ${duration} ساعة مجاناً بدون خصم أي نقاط من رصيده.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "نعم، تتويج الطالب ⭐",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#f59e0b",
      cancelButtonColor: "#64748b",
      background: "#0f172a",
      color: "#f8fafc",
    });

    if (!confirmRes.isConfirmed) return;

    try {
      setIsAssigningAdminSpotlight(true);
      const effectiveBorder = getEffectiveActiveBorder(selectedStudent);

      await adminAssignSpotlight({
        studentDocId: selectedStudent.docId,
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        profilePic: selectedStudent.profilePic || "",
        activeBorder: effectiveBorder,
        activeBadge: selectedStudent.activeBadge || null,
        group: selectedStudent.group || "",
        message: msg,
        durationHours: duration,
      });

      Swal.fire({
        icon: "success",
        title: "تم تتويج الطالب بنجاح! 🌟👑",
        text: `أصبح «${selectedStudent.name}» معروضاً في البانر أعلى الصفحة الرئيسية الآن.`,
        timer: 3000,
        showConfirmButton: false,
        background: "#0f172a",
        color: "#f8fafc",
      });

      setSelectedStudent(null);
      setStudentSearchQuery("");
    } catch (err) {
      console.error("Error assigning admin spotlight:", err);
      Swal.fire({
        icon: "error",
        title: "خطأ أثناء التسليط",
        text: err.message || "حدث خطأ غير متوقع أثناء تتويج الطالب.",
        background: "#0f172a",
        color: "#f8fafc",
      });
    } finally {
      setIsAssigningAdminSpotlight(false);
    }
  };

  // إلغاء تسليط الضوء إدارياً
  const handleRemoveSpotlight = async (spotlight) => {
    const confirmRes = await Swal.fire({
      title: "إلغاء تسليط الضوء؟",
      text: `سيتم إزالة «${spotlight.studentName}» من بنر النجوم فوراً.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "نعم، إلغاء وحذف من البانر",
      cancelButtonText: "تراجع",
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#64748b",
      background: "#0f172a",
      color: "#f8fafc",
    });

    if (!confirmRes.isConfirmed) return;

    try {
      setIsRemovingSpotlightId(spotlight.id);
      await adminRemoveSpotlight(
        spotlight.id,
        spotlight.studentDocId,
        spotlight.studentName
      );

      Swal.fire({
        icon: "success",
        title: "تم الإلغاء بنجاح! 🗑️",
        text: `تم حذف «${spotlight.studentName}» من البانر.`,
        timer: 2000,
        showConfirmButton: false,
        background: "#0f172a",
        color: "#f8fafc",
      });
    } catch (err) {
      console.error("Error removing spotlight:", err);
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: "تعذر إلغاء تسليط الضوء.",
        background: "#0f172a",
        color: "#f8fafc",
      });
    } finally {
      setIsRemovingSpotlightId(null);
    }
  };

  // الحفظ في Firestore
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveGamificationFeaturesConfig(config);
      Swal.fire({
        icon: "success",
        title: "تم حفظ الإعدادات بنجاح! 💾✨",
        text: "تم تطبيق التغييرات فوراً على جميع الطلاب ولوحات التحكم.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error saving gamification config:", err);
      Swal.fire({
        icon: "error",
        title: "خطأ أثناء الحفظ",
        text: err.message || "حدث خطأ غير متوقع أثناء حفظ الإعدادات.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // استعادة الإعدادات الافتراضية
  const handleResetToDefaults = async () => {
    const result = await Swal.fire({
      title: "استعادة الإعدادات الافتراضية؟",
      text: "سيتم إعادة تعيين جميع تكاليف ونسب الميزات الأربعة إلى القيم الافتراضية الأصلية.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "نعم، استعد الافتراضي",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#64748b",
    });

    if (!result.isConfirmed) return;

    try {
      setIsResetting(true);
      await resetGamificationFeaturesConfigToDefault();
      setConfig(DEFAULT_GAMIFICATION_FEATURES_CONFIG);
      Swal.fire({
        icon: "success",
        title: "تمت الاستعادة بنجاح! 🔄",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: "تعذر استعادة الإعدادات الافتراضية.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  // مساعدات تحديث الكائن
  const updateSpotlight = (key, value) => {
    setConfig((prev) => ({
      ...prev,
      spotlight: { ...prev.spotlight, [key]: value },
    }));
  };

  const updateReactionsReveal = (key, value) => {
    setConfig((prev) => ({
      ...prev,
      reactionsReveal: { ...prev.reactionsReveal, [key]: value },
    }));
  };

  const updateCodeResubmission = (key, value) => {
    setConfig((prev) => ({
      ...prev,
      codeResubmission: { ...prev.codeResubmission, [key]: value },
    }));
  };

  const updateLootBoxField = (boxIndex, field, value) => {
    setConfig((prev) => {
      const boxes = [...(prev.lootBoxes?.boxes || [])];
      if (boxes[boxIndex]) {
        boxes[boxIndex] = { ...boxes[boxIndex], [field]: value };
      }
      return {
        ...prev,
        lootBoxes: { ...prev.lootBoxes, boxes },
      };
    });
  };

  const updatePrizeField = (boxIndex, prizeIndex, field, value) => {
    setConfig((prev) => {
      const boxes = [...(prev.lootBoxes?.boxes || [])];
      if (boxes[boxIndex]) {
        const prizes = [...(boxes[boxIndex].prizes || [])];
        if (prizes[prizeIndex]) {
          prizes[prizeIndex] = { ...prizes[prizeIndex], [field]: value };
        }
        boxes[boxIndex] = { ...boxes[boxIndex], prizes };
      }
      return {
        ...prev,
        lootBoxes: { ...prev.lootBoxes, boxes },
      };
    });
  };

  const addPrizeToBox = (boxIndex) => {
    setConfig((prev) => {
      const boxes = [...(prev.lootBoxes?.boxes || [])];
      if (boxes[boxIndex]) {
        const prizes = [
          ...(boxes[boxIndex].prizes || []),
          {
            label: "جائزة جديدة",
            type: "points",
            value: 20,
            icon: "🪙",
            weight: 10,
          },
        ];
        boxes[boxIndex] = { ...boxes[boxIndex], prizes };
      }
      return {
        ...prev,
        lootBoxes: { ...prev.lootBoxes, boxes },
      };
    });
  };

  const removePrizeFromBox = (boxIndex, prizeIndex) => {
    setConfig((prev) => {
      const boxes = [...(prev.lootBoxes?.boxes || [])];
      if (boxes[boxIndex]) {
        const prizes = (boxes[boxIndex].prizes || []).filter(
          (_, idx) => idx !== prizeIndex,
        );
        boxes[boxIndex] = { ...boxes[boxIndex], prizes };
      }
      return {
        ...prev,
        lootBoxes: { ...prev.lootBoxes, boxes },
      };
    });
  };

  const tabs = [
    {
      id: "spotlight",
      label: "تسليط الضوء (Spotlight)",
      icon: Star,
      color: "text-amber-400",
    },
    {
      id: "reactions",
      label: "كشف المتفاعلين",
      icon: Eye,
      color: "text-cyan-400",
    },
    {
      id: "lootboxes",
      label: "صناديق المفاجآت",
      icon: Gift,
      color: "text-purple-400",
    },
    {
      id: "resubmission",
      label: "طلب مراجعة التاسك",
      icon: RefreshCw,
      color: "text-indigo-400",
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12" dir="rtl">
      {/* هيدر الصفحة */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-right">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
                <span>إدارة ميزات التلعيب واقتصاد النقاط</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                  Gamification Engine v2
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                تحكم كامل في ميزات حرق واكتساب النقاط: تسليط الضوء، كشف
                المتفاعلين، الصناديق، وإعادة التقييم.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/gamification-activity"
              className="px-4 py-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition flex items-center gap-1.5"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>سجل الأنشطة 📜</span>
            </Link>

            <button
              type="button"
              onClick={handleResetToDefaults}
              disabled={isResetting || isSaving}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-rose-950/40 text-rose-300 font-bold text-xs border border-slate-700 hover:border-rose-700/50 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <RotateCcw
                className={`w-4 h-4 ${isResetting ? "animate-spin" : ""}`}
              />
              <span>الافتراضي</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-2xl bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Save className={`w-4 h-4 ${isSaving ? "animate-spin" : ""}`} />
              <span>حفظ التعديلات 💾</span>
            </button>
          </div>
        </div>
      </div>

      {/* شريط التبويبات */}
      <div className="flex items-center gap-2 bg-slate-900/70 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs transition cursor-pointer shrink-0 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${isActive ? "text-white" : t.color}`}
              />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* محتوى التبويبات */}
      <AnimatePresence mode="wait">
        {/* 1. تبويب تسليط الضوء (Spotlight) */}
        {activeTab === "spotlight" && (
          <motion.div
            key="spotlight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 space-y-6 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span>
                    تسليط الضوء على البروفايل (Spotlight / Star of the Day)
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  يتيح للطلاب حجز مساحة بنر نجم اليوم أعلى الصفحة الرئيسية
                  /pages/main لإبراز كرتهم ورسالتهم.
                </p>
              </div>

              {/* زر التفعيل */}
              <ToggleSwitch
                enabled={Boolean(config.spotlight?.enabled)}
                onChange={(val) => updateSpotlight("enabled", val)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  تكلفة الحجز (بالنقاط):
                </label>
                <input
                  type="number"
                  min="0"
                  value={config.spotlight?.cost ?? 50}
                  onChange={(e) =>
                    updateSpotlight("cost", Number(e.target.value))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-amber-300 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-400">
                  النقاط التي تُخصم من الطالب عند حجز النجم.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sky-400" />
                  مدة الظهور (بالساعات):
                </label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={config.spotlight?.durationHours ?? 24}
                  onChange={(e) =>
                    updateSpotlight("durationHours", Number(e.target.value))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-sky-300 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-400">
                  الافتراضي 24 ساعة (يوم كامل).
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-purple-400" />
                  الحد الأقصى للنجوم المتزامنين:
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={config.spotlight?.maxActive ?? 5}
                  onChange={(e) =>
                    updateSpotlight("maxActive", Number(e.target.value))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-purple-300 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-400">
                  عدد النجوم في السلايدر المتنقل أعلى الصفحة.
                </p>
              </div>
            </div>

            {/* ── 🌟 قسم تسليط الضوء الإداري على أي طالب (Admin Grant) ── */}
            <div className="bg-linear-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 p-5 sm:p-6 rounded-3xl border border-amber-500/30 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-slate-100 flex items-center gap-2">
                      <span>تسليط الضوء وتتويج طالب من قبل الإدارة</span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
                        تكريم إداري مجاني ✨
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      اختر أي طالب من أي مجموعة لتتويجه كنجم اليوم مجاناً (بدون
                      خصم نقاط) وإبرازه فوراً في البانر أعلى الصفحة الرئيسية.
                    </p>
                  </div>
                </div>
              </div>

              {/* شبكة الاختيار والتخصيص */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* 1. الجانب الأيمن: البحث واختيار الطالب */}
                <div className="space-y-3.5 bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-800">
                  <h5 className="text-xs font-black text-slate-200 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-400" />
                    <span>الخطوة 1: اختيار الطالب المستهدف</span>
                  </h5>

                  {/* فلاتر المجموعة والبحث */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* اختيار المجموعة */}
                    <div>
                      <label className="text-[11px] text-slate-400 font-bold mb-1 block">
                        تصفية حسب المجموعة:
                      </label>
                      <select
                        value={selectedGroupFilter}
                        onChange={(e) => {
                          setSelectedGroupFilter(e.target.value);
                          setSelectedStudent(null);
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="all">كل المجموعات ({studentsList.length})</option>
                        {uniqueGroups.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* حقل البحث */}
                    <div>
                      <label className="text-[11px] text-slate-400 font-bold mb-1 block">
                        بحث بالاسم أو ID:
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="اكتب اسم الطالب أو ID..."
                          value={studentSearchQuery}
                          onChange={(e) => setStudentSearchQuery(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl pr-8 pl-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* قائمة نتائج الطلاب */}
                  {!selectedStudent && (
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                      {isLoadingStudents ? (
                        <div className="py-6 text-center text-xs text-slate-400 animate-pulse flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                          <span>جاري تحميل قائمة الطلاب...</span>
                        </div>
                      ) : filteredStudents.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-500">
                          لا يوجد طلاب يطابقون شروط البحث.
                        </div>
                      ) : (
                        filteredStudents.slice(0, 50).map((s) => (
                          <button
                            key={s.docId || s.id}
                            type="button"
                            onClick={() => setSelectedStudent(s)}
                            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-indigo-950/50 hover:border-indigo-500/40 border border-slate-700/50 transition cursor-pointer text-right group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-slate-700 overflow-hidden shrink-0">
                                <img
                                  src={s.profilePic || "/favicon.png"}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = "/favicon.png";
                                  }}
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 truncate">
                                  {s.name}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  ID: {s.id} {s.group ? `• ${s.group}` : ""}
                                </p>
                              </div>
                            </div>

                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 shrink-0">
                              {s.score || 0} نقطة
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {/* بطاقة الطالب المختار */}
                  {selectedStudent && (
                    <div className="p-3.5 bg-indigo-950/40 border-2 border-indigo-500/50 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* الأفاتار مع الإطار الفعلي */}
                        <div className="relative shrink-0">
                          {(() => {
                            const effectiveBorder =
                              getEffectiveActiveBorder(selectedStudent);
                            const borderObj =
                              effectiveBorder && effectiveBorder !== "default"
                                ? getAvatarBorder(effectiveBorder)
                                : null;

                            return (
                              <AvatarFrame
                                frameStyle={borderObj?.frameStyle}
                                size={48}
                                className={`ring-2 ring-offset-1 ring-offset-slate-900 ${
                                  borderObj?.ringClass || "ring-indigo-400"
                                } ${borderObj?.glowClass || ""}`}
                              >
                                <img
                                  src={
                                    selectedStudent.profilePic ||
                                    "/favicon.png"
                                  }
                                  alt={selectedStudent.name}
                                  className="w-full h-full rounded-full object-cover"
                                  onError={(e) => {
                                    e.target.src = "/favicon.png";
                                  }}
                                />
                              </AvatarFrame>
                            );
                          })()}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h6 className="text-xs font-black text-slate-100 truncate">
                              {selectedStudent.name}
                            </h6>
                            {(() => {
                              const badgeObj = selectedStudent.activeBadge
                                ? getAvatarBadge(selectedStudent.activeBadge)
                                : null;
                              if (!badgeObj) return null;
                              return (
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${badgeObj.badgeClass}`}
                                >
                                  {badgeObj.emoji} {badgeObj.name}
                                </span>
                              );
                            })()}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            المعرف: #{selectedStudent.id} • المجموعة:{" "}
                            <span className="text-indigo-300 font-bold">
                              {selectedStudent.group || "غير محدد"}
                            </span>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedStudent(null)}
                        className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 text-xs font-bold border border-slate-700 transition cursor-pointer shrink-0"
                      >
                        تغيير
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. الجانب الأيسر: تخصيص وتتويج النجم */}
                <div className="space-y-3.5 bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h5 className="text-xs font-black text-slate-200 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>الخطوة 2: خيارات رسالة ومدة التتويج</span>
                    </h5>

                    {/* رسالة البانر */}
                    <div>
                      <label className="text-[11px] text-slate-400 font-bold mb-1 block">
                        رسالة النجم المعروضة في البانر:
                      </label>
                      <textarea
                        rows={2}
                        value={adminSpotlightMessage}
                        onChange={(e) =>
                          setAdminSpotlightMessage(e.target.value)
                        }
                        placeholder="اكتب رسالة التكريم للطالب..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                      />

                      {/* اقتراحات رسائل جاهزة سريعة */}
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {[
                          "🌟 نجم مميز تم اختياره وتكريمه من قبل إدارة المنصة! 👑",
                          "🚀 أداء استثنائي وتفوق رائع في تسليم المهام والاختبارات!",
                          "🏆 التزام كامل وإصرار مذهل يستحق كل التقدير والدعم!",
                          "🔥 طالب الأسبوع المتميز — فخورون بك وبإنجازك المستمر!",
                        ].map((msgPreset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() =>
                              setAdminSpotlightMessage(msgPreset)
                            }
                            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 px-2 py-1 rounded-lg border border-slate-700/60 transition cursor-pointer text-right truncate max-w-full"
                          >
                            {msgPreset}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* مدة الظهور */}
                    <div>
                      <label className="text-[11px] text-slate-400 font-bold mb-1 block">
                        مدة الظهور في البانر (بالساعات):
                      </label>
                      <div className="flex items-center gap-2">
                        {[
                          { label: "12 ساعة", val: 12 },
                          { label: "24 ساعة (يوم)", val: 24 },
                          { label: "48 ساعة (يومين)", val: 48 },
                          { label: "72 ساعة (3 أيام)", val: 72 },
                          { label: "أسبوع (168 س)", val: 168 },
                        ].map((d) => (
                          <button
                            key={d.val}
                            type="button"
                            onClick={() => setAdminSpotlightDuration(d.val)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                              adminSpotlightDuration === d.val
                                ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                                : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* زر التسليط والتتويج */}
                  <button
                    type="button"
                    onClick={handleAssignAdminSpotlight}
                    disabled={!selectedStudent || isAssigningAdminSpotlight}
                    className="w-full mt-2 py-3 px-4 rounded-2xl bg-linear-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 transition-all hover:scale-101 active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAssigningAdminSpotlight ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>جاري تتويج الطالب كنجم اليوم...</span>
                      </>
                    ) : (
                      <>
                        <Star className="w-4 h-4 fill-current" />
                        <span>
                          {selectedStudent
                            ? `تسليط الضوء على «${selectedStudent.name}» الآن ⭐`
                            : "اختر طالباً أولاً لتتويجه كنجم"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* ── 🌟 قائمة النجوم المسلط عليهم الضوء حالياً (Active Spotlights) ── */}
            <div className="space-y-3.5 border-t border-slate-800 pt-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-black text-slate-100">
                    النجوم المسلط عليهم الضوء حالياً في البانر (Active Stars)
                  </h4>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {activeSpotlights.length} نجم نشط
                </span>
              </div>

              {activeSpotlights.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-800/40 border border-slate-800 text-center space-y-2">
                  <Star className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-bold">
                    لا يوجد نجوم مسلط عليهم الضوء في البانر حالياً.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    يمكنك اختيار أي طالب وتتويجه من النموذج أعلاه أو انتظار قيام
                    الطلاب بحجز النجم بنقاطهم من المتجر.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeSpotlights.map((spotlight) => {
                    const borderConfig = getAvatarBorder(
                      spotlight.activeBorder
                    );
                    const badgeConfig = spotlight.activeBadge
                      ? getAvatarBadge(spotlight.activeBadge)
                      : null;
                    const expiresDate = new Date(spotlight.expiresAt);
                    const remainingHours = Math.max(
                      0,
                      Math.round(
                        (expiresDate.getTime() - Date.now()) / (1000 * 60 * 60)
                      )
                    );

                    return (
                      <div
                        key={spotlight.id}
                        className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-amber-500/40 transition-all space-y-3 flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative shrink-0">
                              <AvatarFrame
                                frameStyle={borderConfig.frameStyle}
                                size={44}
                                className={`ring-2 ring-offset-1 ring-offset-slate-900 ${borderConfig.ringClass} ${borderConfig.glowClass || ""}`}
                              >
                                <img
                                  src={
                                    spotlight.profilePic || "/favicon.png"
                                  }
                                  alt={spotlight.studentName}
                                  className="w-full h-full rounded-full object-cover"
                                  onError={(e) => {
                                    e.target.src = "/favicon.png";
                                  }}
                                />
                              </AvatarFrame>
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h5 className="text-xs font-black text-slate-100 truncate">
                                  {spotlight.studentName}
                                </h5>
                                {badgeConfig && (
                                  <span
                                    className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full ${badgeConfig.badgeClass}`}
                                  >
                                    {badgeConfig.emoji} {badgeConfig.name}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                #{spotlight.studentId}{" "}
                                {spotlight.group
                                  ? `• ${spotlight.group}`
                                  : ""}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-full border shrink-0 ${
                              spotlight.grantedByAdmin
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                            }`}
                          >
                            {spotlight.grantedByAdmin
                              ? "👑 تتويج إداري"
                              : `🪙 شراء (${spotlight.cost || 0}ن)`}
                          </span>
                        </div>

                        {/* الرسالة */}
                        <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-amber-200/90 leading-relaxed italic">
                          «{spotlight.message}»
                        </div>

                        {/* معلومات الوقت وزر الإلغاء */}
                        <div className="flex items-center justify-between gap-2 border-t border-slate-700/60 pt-2.5">
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-sky-400" />
                            <span>متبقي: {remainingHours} ساعة</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveSpotlight(spotlight)}
                            disabled={
                              isRemovingSpotlightId === spotlight.id
                            }
                            className="px-2.5 py-1 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-[10px] font-bold transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>
                              {isRemovingSpotlightId === spotlight.id
                                ? "جاري الإلغاء..."
                                : "إلغاء وحذف"}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 2. تبويب كشف المتفاعلين (Who Reacted) */}
        {activeTab === "reactions" && (
          <motion.div
            key="reactions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 space-y-6 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-cyan-400" />
                  <span>
                    كشف المتفاعلين على البروفايل (Who Liked / Disliked Me)
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  يتيح للطلاب دفع نقاط لكشف أسماء ومجموعات وتوقيتات من قاموا
                  بالإعجاب أو عدم الإعجاب ببروفايلهم.
                </p>
              </div>

              {/* زر التفعيل */}
              <ToggleSwitch
                enabled={Boolean(config.reactionsReveal?.enabled)}
                onChange={(val) => updateReactionsReveal("enabled", val)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  التكلفة العادية (بالنقاط):
                </label>
                <input
                  type="number"
                  min="0"
                  value={config.reactionsReveal?.costNormal ?? 30}
                  onChange={(e) =>
                    updateReactionsReveal("costNormal", Number(e.target.value))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-amber-300 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-400">
                  التكلفة القياسية للطلاب العاديين.
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  تكلفة البطاقة الذهبية (خصم 50%):
                </label>
                <input
                  type="number"
                  min="0"
                  value={config.reactionsReveal?.costGoldenCard ?? 15}
                  onChange={(e) =>
                    updateReactionsReveal(
                      "costGoldenCard",
                      Number(e.target.value),
                    )
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-yellow-300 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-400">
                  سعر مخفض لأصحاب بطاقة الطالب المثالي (Golden Card).
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  مدة صلاحية الكشف (بالساعات):
                </label>
                <input
                  type="number"
                  min="1"
                  max="720"
                  value={config.reactionsReveal?.durationHours ?? 48}
                  onChange={(e) =>
                    updateReactionsReveal(
                      "durationHours",
                      Number(e.target.value),
                    )
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-cyan-300 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-400">
                  الفترة التي يظل الكشف فيها متاحاً للطالب قبل انتهاء الصلاحية
                  (افتراضي 48 ساعة).
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* 3. تبويب صناديق المفاجآت (Mystery Loot Boxes) */}
        {activeTab === "lootboxes" && (
          <motion.div
            key="lootboxes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 space-y-6 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-purple-400" />
                  <span>صناديق المفاجآت الغامضة (Mystery Loot Boxes)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  إدارة الصناديق الثلاثة (البرونزي، الفضي، الأسطوري) مع التحكم
                  في الأسعار ونسب جوائز كل صندوق.
                </p>
              </div>

              {/* زر التفعيل */}
              <ToggleSwitch
                enabled={Boolean(config.lootBoxes?.enabled)}
                onChange={(val) =>
                  setConfig((prev) => ({
                    ...prev,
                    lootBoxes: { ...prev.lootBoxes, enabled: val },
                  }))
                }
              />
            </div>

            {/* بطاقات الصناديق الثلاثة */}
            <div className="space-y-6">
              {(config.lootBoxes?.boxes || []).map((box, boxIdx) => {
                const totalW =
                  (box.prizes || []).reduce(
                    (s, p) => s + (Number(p.weight) || 0),
                    0,
                  ) || 1;

                return (
                  <div
                    key={box.id || boxIdx}
                    className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{box.icon || "🎁"}</span>
                        <div>
                          <input
                            type="text"
                            value={box.name}
                            onChange={(e) =>
                              updateLootBoxField(boxIdx, "name", e.target.value)
                            }
                            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-sm font-black text-slate-100 focus:outline-none focus:border-indigo-500"
                          />
                          <p className="text-[11px] text-slate-400 mt-1">
                            {box.id}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400 font-bold">
                          تكلفة الفتح (نقطة):
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={box.cost}
                          onChange={(e) =>
                            updateLootBoxField(
                              boxIdx,
                              "cost",
                              Number(e.target.value),
                            )
                          }
                          className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-sm font-bold text-amber-300 text-center focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* وصف الصندوق */}
                    <div>
                      <label className="text-[11px] text-slate-400 font-bold mb-1 block">
                        وصف الصندوق:
                      </label>
                      <input
                        type="text"
                        value={box.description}
                        onChange={(e) =>
                          updateLootBoxField(
                            boxIdx,
                            "description",
                            e.target.value,
                          )
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {/* قائمة الجوائز داخل الصندوق */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-300">
                          الجوائز ونسب الاحتمالات ({box.prizes?.length || 0}):
                        </span>
                        <button
                          type="button"
                          onClick={() => addPrizeToBox(boxIdx)}
                          className="px-3 py-1 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة جائزة جديدة</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                        {(box.prizes || []).map((prize, prizeIdx) => {
                          const prob =
                            Math.round(
                              ((Number(prize.weight) || 0) / totalW) * 1000,
                            ) / 10;
                          return (
                            <div
                              key={prizeIdx}
                              className="flex items-center gap-2 p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs"
                            >
                              <input
                                type="text"
                                value={prize.icon || "🎁"}
                                onChange={(e) =>
                                  updatePrizeField(
                                    boxIdx,
                                    prizeIdx,
                                    "icon",
                                    e.target.value,
                                  )
                                }
                                className="w-8 text-center bg-slate-800 border border-slate-700 rounded p-1 text-sm shrink-0"
                              />

                              <input
                                type="text"
                                value={prize.label}
                                onChange={(e) =>
                                  updatePrizeField(
                                    boxIdx,
                                    prizeIdx,
                                    "label",
                                    e.target.value,
                                  )
                                }
                                className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 min-w-0"
                              />

                              <select
                                value={prize.type}
                                onChange={(e) =>
                                  updatePrizeField(
                                    boxIdx,
                                    prizeIdx,
                                    "type",
                                    e.target.value,
                                  )
                                }
                                className="bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-xs text-slate-300 shrink-0"
                              >
                                <option value="points">نقاط</option>
                                <option value="reserve">حضور احتياطي</option>
                                <option value="blue_card">Blue Card</option>
                                <option value="green_card">Green Card</option>
                                <option value="border">إطار</option>
                                <option value="badge">شارة</option>
                              </select>

                              {prize.type === "points" ||
                              prize.type === "reserve" ||
                              prize.type === "blue_card" ||
                              prize.type === "green_card" ? (
                                <input
                                  type="number"
                                  value={prize.value}
                                  onChange={(e) =>
                                    updatePrizeField(
                                      boxIdx,
                                      prizeIdx,
                                      "value",
                                      Number(e.target.value),
                                    )
                                  }
                                  placeholder="الكمية"
                                  className="w-14 bg-slate-800 border border-slate-700 rounded px-1.5 py-1 text-xs text-amber-300 text-center shrink-0"
                                />
                              ) : prize.type === "border" ? (
                                <select
                                  value={prize.value}
                                  onChange={(e) =>
                                    updatePrizeField(
                                      boxIdx,
                                      prizeIdx,
                                      "value",
                                      e.target.value,
                                    )
                                  }
                                  className="w-24 bg-slate-800 border border-slate-700 rounded px-1 py-1 text-xs text-purple-300 truncate shrink-0"
                                >
                                  {AVATAR_BORDERS.map((b) => (
                                    <option key={b.id} value={b.id}>
                                      {b.name}
                                    </option>
                                  ))}
                                </select>
                              ) : null}

                              <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded border border-slate-700 shrink-0">
                                <span className="text-[10px] text-slate-400">
                                  وزن:
                                </span>
                                <input
                                  type="number"
                                  min="1"
                                  value={prize.weight}
                                  onChange={(e) =>
                                    updatePrizeField(
                                      boxIdx,
                                      prizeIdx,
                                      "weight",
                                      Number(e.target.value),
                                    )
                                  }
                                  className="w-10 bg-transparent text-xs text-center font-bold text-cyan-300 focus:outline-none"
                                />
                                <span className="text-[10px] text-purple-400 font-bold">
                                  ({prob}%)
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removePrizeFromBox(boxIdx, prizeIdx)
                                }
                                className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                                title="حذف الجائزة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* 4. تبويب طلب مراجعة التاسك (Task Review Request) */}
        {activeTab === "resubmission" && (
          <motion.div
            key="resubmission"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 space-y-6 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-indigo-400" />
                  <span>طلب مراجعة التاسك (Task Review Request)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  تسمح للطالب بطلب مراجعة المهمة لمرة واحدة بالنقاط، مع تصفير
                  الدرجة فوراً لتتحول إلى «جاري المراجعة» ليقوم المدرب بإعادة
                  تقييمها.
                </p>
              </div>

              {/* زر التفعيل */}
              <ToggleSwitch
                enabled={Boolean(config.codeResubmission?.enabled)}
                onChange={(val) => updateCodeResubmission("enabled", val)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  تكلفة طلب المراجعة (بالنقاط):
                </label>
                <input
                  type="number"
                  min="0"
                  value={
                    config.codeResubmission?.cost !== undefined &&
                    config.codeResubmission?.cost !== 40
                      ? config.codeResubmission.cost
                      : 10
                  }
                  onChange={(e) =>
                    updateCodeResubmission("cost", Number(e.target.value))
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-amber-300 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-400">
                  النقاط التي تُخصم من الطالب لطلب مراجعة المهمة (افتراضي 10
                  نقاط).
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-indigo-400" />
                  الحد الأقصى للمحاولات لكل مهمة:
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={config.codeResubmission?.maxAttemptsPerTask ?? 1}
                  onChange={(e) =>
                    updateCodeResubmission(
                      "maxAttemptsPerTask",
                      Number(e.target.value),
                    )
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-indigo-300 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-400">
                  عدد مرات السماح بطلب المراجعة لنفس المهمة (افتراضي مرة واحدة).
                </p>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-400" />
                  الحد الأقصى لدرجة الأهلية (%):
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={config.codeResubmission?.maxEligibleScore ?? 100}
                  onChange={(e) =>
                    updateCodeResubmission(
                      "maxEligibleScore",
                      Number(e.target.value),
                    )
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-emerald-300 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-400">
                  المهام الحاصلة على هذه الدرجة أو أقل تكون مؤهلة للمراجعة
                  (افتراضي 100%).
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
