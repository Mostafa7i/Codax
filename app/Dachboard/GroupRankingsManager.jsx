"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Trophy,
  Sparkles,
  RefreshCw,
  Send,
  Save,
  CheckCircle2,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Minus,
  Users,
  Award,
  BookOpen,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  getStoredGroupRankings,
  calculateCurrentGroupRankings,
  checkAndNotifyRankChanges,
  syncAllGroupsRankings,
  getArabicRankName,
} from "@/app/services/rankingService";

export default function GroupRankingsManager({ selectedGroup, availableGroups = [] }) {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [storedData, setStoredData] = useState(null);
  const [currentRanks, setCurrentRanks] = useState([]);
  const [diffSummary, setDiffSummary] = useState({ promotions: [], demotions: [], unchanged: 0 });

  // جلب البيانات ومقارنتها
  const loadRankingsData = useCallback(async () => {
    if (!selectedGroup) {
      setStoredData(null);
      setCurrentRanks([]);
      setDiffSummary({ promotions: [], demotions: [], unchanged: 0 });
      return;
    }

    setLoading(true);
    try {
      const [stored, current] = await Promise.all([
        getStoredGroupRankings(selectedGroup),
        calculateCurrentGroupRankings(selectedGroup),
      ]);

      setStoredData(stored);
      setCurrentRanks(current);

      // حساب الفروقات
      if (stored && Array.isArray(stored.ranks) && current.length > 0) {
        const prevMap = new Map();
        stored.ranks.forEach((r) => {
          const key = r.studentId !== null && r.studentId !== undefined ? String(r.studentId) : String(r.docId || r.name);
          prevMap.set(key, r.rank);
          if (r.name) prevMap.set(`name_${r.name.trim()}`, r.rank);
        });

        const promos = [];
        const demos = [];
        let same = 0;

        current.forEach((s) => {
          const key = s.id !== null && s.id !== undefined ? String(s.id) : String(s.docId || s.name);
          let oldRank = prevMap.get(key);
          if (oldRank === undefined && s.name) {
            oldRank = prevMap.get(`name_${s.name.trim()}`);
          }

          if (oldRank !== undefined && oldRank !== null) {
            if (s.rank < oldRank) {
              promos.push({ ...s, oldRank, diff: oldRank - s.rank });
            } else if (s.rank > oldRank) {
              demos.push({ ...s, oldRank, diff: s.rank - oldRank });
            } else {
              same++;
            }
          }
        });

        setDiffSummary({ promotions: promos, demotions: demos, unchanged: same });
      } else {
        setDiffSummary({ promotions: [], demotions: [], unchanged: 0 });
      }
    } catch (err) {
      console.error("Error loading rankings data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedGroup]);

  useEffect(() => {
    loadRankingsData();
  }, [loadRankingsData]);

  // حفظ الترتيب الأولي كنقطة بداية
  const handleSaveBaseline = async () => {
    if (!selectedGroup) return;

    const confirm = await Swal.fire({
      title: "تثبيت الترتيب الحالي كمرجع؟",
      text: `سيتم حفظ الترتيب الحالي لمجموعة ${selectedGroup} كنقطة انطلاق دون إرسال إشعارات.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "نعم، تثبيت الترتيب",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#4f46e5",
    });

    if (!confirm.isConfirmed) return;

    setSyncing(true);
    try {
      const res = await checkAndNotifyRankChanges(selectedGroup, null, null, true);
      await loadRankingsData();
      Swal.fire({
        icon: "success",
        title: "تم الحفظ بنجاح!",
        text: res.message || "تم تثبيت الترتيب كمرجع للمجموعة.",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: err.message || "حدث خطأ أثناء الحفظ.",
      });
    } finally {
      setSyncing(false);
    }
  };

  // فحص وإرسال الإشعار بالتغييرات
  const handleCheckAndNotify = async () => {
    if (!selectedGroup) return;

    setSyncing(true);
    try {
      const res = await checkAndNotifyRankChanges(selectedGroup, null, null, false);
      await loadRankingsData();

      if (res.status === "updated_and_notified") {
        const promoHtml = (res.promotions || [])
          .map((p) => `🚀 <b>${p.name}</b>: تقدم إلى المركز ${p.newRank} (سابقاً ${p.oldRank})`)
          .join("<br/>");
        const demoHtml = (res.demotions || [])
          .map((d) => `⚠️ <b>${d.name}</b>: تراجع إلى المركز ${d.newRank} (سابقاً ${d.oldRank})`)
          .join("<br/>");

        Swal.fire({
          icon: "success",
          title: "تم رصد التغييرات وإرسال الإشعار بنجاح! 🏆",
          html: `
            <div style="text-align: right; font-size: 13px; line-height: 1.6;">
              <p style="font-weight: bold; margin-bottom: 6px;">وصل إشعار لمجموعة ${selectedGroup}:</p>
              ${promoHtml ? `<div style="color: #16a34a; margin-bottom: 6px;">${promoHtml}</div>` : ""}
              ${demoHtml ? `<div style="color: #ea580c;">${demoHtml}</div>` : ""}
            </div>
          `,
        });
      } else if (res.status === "initialized") {
        Swal.fire({
          icon: "success",
          title: "تم حفظ الترتيب الأولي!",
          text: res.message,
        });
      } else {
        Swal.fire({
          icon: "info",
          title: "الترتيب محدث ولا توجد تغييرات",
          text: `مراكز الطلاب في مجموعة ${selectedGroup} مستقرة ولا يوجد أي صعود أو هبوط جديد.`,
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: err.message || "حدث خطأ أثناء فحص الترتيب.",
      });
    } finally {
      setSyncing(false);
    }
  };

  // مزامنة وحفظ جميع المجموعات
  const handleSyncAll = async () => {
    const confirm = await Swal.fire({
      title: "حفظ ترتيب جميع المجموعات؟",
      text: "سيتم حساب وحفظ الترتيب الأولي لجميع المجموعات المتاحة كنقطة بداية.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "نعم، حفظ الجميع",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#7c3aed",
    });

    if (!confirm.isConfirmed) return;

    setSyncing(true);
    try {
      const results = await syncAllGroupsRankings(availableGroups, true);
      const count = Object.keys(results).length;
      await loadRankingsData();
      Swal.fire({
        icon: "success",
        title: "تم حفظ ترتيب جميع المجموعات!",
        text: `تم حفظ الترتيب الأولي بنجاح لـ ${count} مجموعة.`,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: err.message || "حدث خطأ أثناء المزامنة الشاملة.",
      });
    } finally {
      setSyncing(false);
    }
  };

  if (!selectedGroup) {
    return (
      <div className="text-center py-10 text-gray-500 dark:text-gray-400">
        <Users className="w-12 h-12 mx-auto mb-2 opacity-40" />
        <p className="font-semibold text-sm">يرجى تحديد مجموعة لعرض وإدارة ترتيب طلابها</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* رأس بطاقة الترتيب */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-linear-to-r from-amber-50 to-orange-50/60 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              نظام متابعة وتحديث ترتيب الطلاب وإرسال الإشعارات
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50">
                مجموعة {selectedGroup}
              </span>
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              {storedData?.updatedAt
                ? `آخر حفظ للترتيب: ${new Date(storedData.updatedAt).toLocaleString("ar-EG")}`
                : "لم يتم حفظ ترتيب أولي لهذه المجموعة بعد"}
            </p>
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <button
            type="button"
            onClick={loadRankingsData}
            disabled={loading || syncing}
            className="p-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl border border-gray-200 dark:border-gray-700 transition active:scale-95 disabled:opacity-50 text-xs font-bold flex items-center gap-1.5"
            title="إعادة تحميل"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </button>

          <button
            type="button"
            onClick={handleSaveBaseline}
            disabled={loading || syncing}
            className="px-3.5 py-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-indigo-700 dark:text-indigo-300 rounded-xl border border-indigo-200 dark:border-indigo-800/60 transition active:scale-95 disabled:opacity-50 text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Save className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            حفظ كترتيب أساسي
          </button>

          <button
            type="button"
            onClick={handleCheckAndNotify}
            disabled={loading || syncing}
            className="px-4 py-2 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl transition active:scale-95 disabled:opacity-50 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20"
          >
            <Send className="w-3.5 h-3.5" />
            {syncing ? "جاري الفحص..." : "فحص التغييرات وإشعار المجموعة"}
          </button>

          <button
            type="button"
            onClick={handleSyncAll}
            disabled={loading || syncing}
            className="px-3 py-2 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl transition active:scale-95 disabled:opacity-50 text-xs font-bold flex items-center gap-1.5 shadow-xs"
            title="حفظ الترتيب الأساسي لجميع المجموعات"
          >
            <Sparkles className="w-3.5 h-3.5" />
            حفظ كل المجموعات
          </button>
        </div>
      </div>

      {/* ملخص الفروقات والتغييرات */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-3.5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <ArrowUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              الطلاب المتقدمون في الترتيب
            </span>
            <span className="w-6 h-6 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 text-xs font-black flex items-center justify-center">
              {diffSummary.promotions.length}
            </span>
          </div>
          {diffSummary.promotions.length > 0 ? (
            <div className="mt-2 space-y-1">
              {diffSummary.promotions.map((p) => (
                <div key={p.id || p.name} className="text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                  <span className="font-semibold">{p.name}</span>
                  <span className="font-bold text-[11px]">
                    المركز {p.rank} (كان {p.oldRank}) ⬆️ {p.diff}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1">لا يوجد صعود جديد</p>
          )}
        </div>

        <div className="bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 p-3.5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
              <ArrowDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              الطلاب المتراجعون في الترتيب
            </span>
            <span className="w-6 h-6 rounded-full bg-rose-200 dark:bg-rose-800 text-rose-900 dark:text-rose-100 text-xs font-black flex items-center justify-center">
              {diffSummary.demotions.length}
            </span>
          </div>
          {diffSummary.demotions.length > 0 ? (
            <div className="mt-2 space-y-1">
              {diffSummary.demotions.map((d) => (
                <div key={d.id || d.name} className="text-xs text-rose-900 dark:text-rose-200 flex items-center justify-between">
                  <span className="font-semibold">{d.name}</span>
                  <span className="font-bold text-[11px]">
                    المركز {d.rank} (كان {d.oldRank}) ⬇️ {d.diff}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-1">لا يوجد تراجع جديد</p>
          )}
        </div>

        <div className="bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 p-3.5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              إجمالي طلاب المجموعة
            </span>
            <span className="w-6 h-6 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 text-xs font-black flex items-center justify-center">
              {currentRanks.length}
            </span>
          </div>
          <p className="text-[11px] text-blue-600/90 dark:text-blue-400/90 mt-2">
            مراكز مستقرة: <b className="text-blue-900 dark:text-blue-200">{diffSummary.unchanged}</b> طالب
          </p>
        </div>
      </div>

      {/* جدول الترتيب الحالي الكامل */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/60 overflow-hidden shadow-xs">
        <div className="p-3.5 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h5 className="font-bold text-xs text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            قائمة ترتيب الطلاب الحالية لمجموعة {selectedGroup}
          </h5>
          <span className="text-[11px] text-gray-400">
            يُحسب الترتيب العام بالمعادلة: 60% للتاسكات + 40% للحضور + النقاط الإضافية
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 text-gray-500 dark:text-gray-400 font-bold">
                <th className="py-2.5 px-3">المركز</th>
                <th className="py-2.5 px-3">الطالب</th>
                <th className="py-2.5 px-3">النتيجة الإجمالية</th>
                <th className="py-2.5 px-3">متوسط التاسكات</th>
                <th className="py-2.5 px-3">نسبة الحضور</th>
                <th className="py-2.5 px-3">النقاط الإضافية</th>
                <th className="py-2.5 px-3">الحالة مقارنة بالسابق</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {currentRanks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    لا يوجد طلاب في هذه المجموعة حالياً
                  </td>
                </tr>
              ) : (
                currentRanks.map((student) => {
                  const isPromo = diffSummary.promotions.find((p) => p.name === student.name || p.id === student.id);
                  const isDemo = diffSummary.demotions.find((d) => d.name === student.name || d.id === student.id);

                  return (
                    <tr
                      key={student.id || student.docId || student.name}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${
                        student.rank === 1
                          ? "bg-amber-50/40 dark:bg-amber-950/10 font-semibold"
                          : student.rank === 2
                          ? "bg-slate-50/60 dark:bg-slate-900/20 font-semibold"
                          : student.rank === 3
                          ? "bg-orange-50/40 dark:bg-orange-950/10 font-semibold"
                          : ""
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center justify-center font-bold px-2 py-0.5 rounded-lg text-xs ${
                          student.rank === 1
                            ? "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                            : student.rank === 2
                            ? "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                            : student.rank === 3
                            ? "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300"
                            : "text-gray-600 dark:text-gray-400"
                        }`}>
                          {getArabicRankName(student.rank)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-gray-900 dark:text-white">
                        {student.name}
                      </td>
                      <td className="py-2.5 px-3 font-black text-indigo-600 dark:text-indigo-400">
                        {student.combinedScore}%
                      </td>
                      <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300">
                        {student.taskPercentage !== null ? `${student.taskPercentage}%` : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300">
                        {student.attendancePercentage ?? 0}%
                      </td>
                      <td className="py-2.5 px-3 text-amber-600 dark:text-amber-400 font-bold">
                        {student.extraPoints || student.score || 0} نقطة
                      </td>
                      <td className="py-2.5 px-3">
                        {isPromo ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-900/40 px-2 py-0.5 rounded-md">
                            <ArrowUp className="w-3 h-3" /> تقدم من المركز {isPromo.oldRank}
                          </span>
                        ) : isDemo ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-100/70 dark:bg-rose-900/40 px-2 py-0.5 rounded-md">
                            <ArrowDown className="w-3 h-3" /> تراجع من المركز {isDemo.oldRank}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                            <Minus className="w-3 h-3" /> بدون تغيير
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
