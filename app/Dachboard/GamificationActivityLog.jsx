"use client";
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig";
import { getAvatarBorder } from "@/app/utils/avatarDecorations";
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Coins,
  Heart,
  RotateCw,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";

const PAGE_SIZE = 12;
const dateFormatter = new Intl.DateTimeFormat("ar-EG", {
  timeZone: "Africa/Cairo",
  dateStyle: "medium",
  timeStyle: "short",
});

export default function GamificationActivityLog() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [studentNames, setStudentNames] = useState({});
  const [favoriteStudents, setFavoriteStudents] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    const activityQuery = query(
      collection(db, "gamificationActivity"),
      orderBy("createdAt", "desc"),
      limit(250),
    );
    return onSnapshot(activityQuery, (snapshot) =>
      setLogs(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    );
  }, []);

  useEffect(() => {
    return onSnapshot(collection(db, "students"), (snapshot) => {
      setFavoriteStudents(
        snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .filter((student) => student.favoriteBorder),
      );
    });
  }, []);

  useEffect(() => {
    const missingIds = [
      ...new Set(
        logs
          .filter((item) => !item.studentName && item.studentId)
          .map((item) => item.studentId),
      ),
    ];
    Promise.all(
      missingIds.map(async (id) => {
        const snapshot = await getDoc(doc(db, "students", id));
        return [id, snapshot.data()?.name || `طالب (${id.slice(0, 6)})`];
      }),
    ).then((entries) =>
      setStudentNames((current) => ({
        ...current,
        ...Object.fromEntries(entries),
      })),
    );
  }, [logs]);

  const filteredLogs = useMemo(
    () =>
      filter === "all" ? logs : logs.filter((item) => item.type === filter),
    [filter, logs],
  );
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageLogs = useMemo(
    () =>
      filteredLogs.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
      ),
    [currentPage, filteredLogs],
  );
  const rangeStart = filteredLogs.length
    ? (currentPage - 1) * PAGE_SIZE + 1
    : 0;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filteredLogs.length);
  const getDate = (value) => {
    const date = value?.toDate?.();
    if (!date) return { full: "جاري حفظ العملية…", relative: "" };
    const minutes = Math.max(
      0,
      Math.floor((Date.now() - date.getTime()) / 60000),
    );
    const relative =
      minutes >= 1440
        ? `منذ ${Math.floor(minutes / 1440)} يوم`
        : minutes >= 60
          ? `منذ ${Math.floor(minutes / 60)} ساعة`
          : minutes
            ? `منذ ${minutes} دقيقة`
            : "الآن";
    return { full: dateFormatter.format(date), relative };
  };

  useEffect(() => setPage(1), [filter]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div dir="rtl" className="space-y-5">
      <div className="rounded-3xl border border-indigo-500/25 bg-linear-to-l from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-black">
              <RotateCw className="text-amber-400" /> سجل العجلة والمشتريات
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              كل لفة، جائزتها، وكل شراء من متجر التخصيص يظهر هنا لحظياً.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFavorites(true)}
              className="flex items-center gap-2 rounded-2xl border border-rose-300/30 bg-rose-500/15 px-4 py-2 text-xs font-black text-rose-100 transition hover:bg-rose-500/25"
            >
              <Heart className="h-4 w-4 fill-rose-400 text-rose-400" /> المفضلة{" "}
              <span className="rounded-full bg-white/15 px-1.5 py-0.5">
                {favoriteStudents.length}
              </span>
            </button>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-center">
              <p className="text-lg font-black text-amber-300">
                {filteredLogs.length}
              </p>
              <p className="text-[11px] text-slate-300">عملية ظاهرة</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          ["all", "الكل"],
          ["task_review_request", "مراجعة المهام 🔍"],
          ["wheel_spin", "لفات العجلة 🎡"],
          ["store_purchase", "مشتريات المتجر 🛍️"],
          ["loot_box_opened", "صناديق الحظ 🎁"],
          ["spotlight_purchase", "تسليط الضوء ⭐"],
          ["reactions_reveal_purchase", "كشف المتفاعلين 👁️"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              filter === id
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        {filteredLogs.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-400">
            لا توجد عمليات مسجلة حتى الآن.
          </p>
        ) : (
          <>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {pageLogs.map((log) => {
                const date = getDate(log.createdAt);
                const name =
                  log.studentName ||
                  studentNames[log.studentId] ||
                  `طالب (${log.studentId?.slice(0, 6) || "غير معروف"})`;

                let actionTitle = "عملية";
                let actionDesc = "";
                let iconBox = <ShoppingBag size={18} />;
                let iconBg = "bg-indigo-500/15 text-indigo-500";
                let costDisplay = `${log.price || log.cost || 0} نقطة`;

                if (log.type === "task_review_request") {
                  actionTitle = "طلب مراجعة مهمة";
                  actionDesc = `المهمة: ${log.taskName || "مهمة تدريبية"} (الدرجة السابقة: ${log.previousScore ?? 0}%)`;
                  iconBox = <RotateCw size={18} />;
                  iconBg = "bg-amber-500/15 text-amber-500";
                  costDisplay = `تكلفة ${log.cost || 10} نقاط`;
                } else if (log.type === "wheel_spin") {
                  actionTitle = "لف العجلة";
                  actionDesc = `${log.prizeIcon || "🎁"} ${log.prizeLabel || "جائزة"} (${log.spinKind === "paid" ? "لفة مدفوعة" : log.spinKind === "bonus" ? "لفة إضافية" : "لفة مجانية"})`;
                  iconBox = <RotateCw size={18} />;
                  iconBg = "bg-purple-500/15 text-purple-500";
                  costDisplay = log.paidCost
                    ? `تكلفة ${log.paidCost} نقطة`
                    : "مجانية";
                } else if (log.type === "store_purchase") {
                  actionTitle = "اشترى من المتجر";
                  actionDesc = `${log.itemIcon || "🛍️"} ${log.itemName || "عنصر متجر"}`;
                  iconBox = <ShoppingBag size={18} />;
                  iconBg = "bg-emerald-500/15 text-emerald-500";
                  costDisplay = `${log.price || 0} نقطة`;
                } else if (log.type === "loot_box_opened") {
                  actionTitle = `فتح ${log.boxName || "صندوق حظ"}`;
                  actionDesc = `ربح: ${log.prizeIcon || "🎁"} ${log.prizeLabel || "جائزة"}`;
                  iconBox = <ShoppingBag size={18} />;
                  iconBg = "bg-pink-500/15 text-pink-500";
                  costDisplay = `تكلفة ${log.boxCost || 0} نقطة`;
                } else if (log.type === "spotlight_purchase") {
                  actionTitle = "حجز تسليط الضوء (نجم اليوم)";
                  actionDesc = `رسالة: "${log.message || "نجم اليوم"}" لمدة ${log.durationHours || 24} ساعة`;
                  iconBox = <Heart size={18} />;
                  iconBg = "bg-amber-500/15 text-amber-500";
                  costDisplay = `تكلفة ${log.cost || 0} نقطة`;
                } else if (log.type === "reactions_reveal_purchase") {
                  actionTitle = "شراء تصريح كشف المتفاعلين";
                  actionDesc = `صلاحية ${log.durationHours || 48} ساعة`;
                  iconBox = <Users size={18} />;
                  iconBg = "bg-cyan-500/15 text-cyan-500";
                  costDisplay = `تكلفة ${log.cost || 0} نقطة`;
                }

                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}
                    >
                      {iconBox}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-slate-800 dark:text-white">
                        {name}{" "}
                        <span className="font-normal text-slate-400">
                          — {actionTitle}
                        </span>
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {actionDesc}
                      </p>
                    </div>
                    <div className="shrink-0 text-left">
                      <p className="text-xs font-bold text-amber-600 flex items-center justify-end gap-1">
                        <Coins className="inline h-3.5 w-3.5" /> {costDisplay}
                      </p>
                      <p
                        title={date.full}
                        className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-400"
                      >
                        <Clock3 size={11} /> {date.relative || date.full}
                      </p>
                      {date.relative && (
                        <p className="mt-0.5 hidden text-[10px] text-slate-400 sm:block">
                          {date.full}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/30">
              <p className="text-xs font-medium text-slate-500">
                عرض {rangeStart}–{rangeEnd} من {filteredLogs.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  aria-label="الصفحة التالية"
                  onClick={() =>
                    setPage((value) => Math.min(totalPages, value + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800"
                >
                  <ChevronRight size={17} />
                </button>
                <span className="min-w-20 text-center text-xs font-bold text-slate-600 dark:text-slate-300">
                  {currentPage} / {totalPages}
                </span>
                <button
                  aria-label="الصفحة السابقة"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800"
                >
                  <ChevronLeft size={17} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showFavorites && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"
          onClick={() => setShowFavorites(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
              <div>
                <h2 className="flex items-center gap-2 font-black text-slate-800 dark:text-white">
                  <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />{" "}
                  الإطارات المفضلة
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {favoriteStudents.length} طالب اختاروا إطارًا للمفضلة
                </p>
              </div>
              <button
                type="button"
                aria-label="إغلاق"
                onClick={() => setShowFavorites(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto p-4">
              {favoriteStudents.length ? (
                favoriteStudents.map((student) => {
                  const border = getAvatarBorder(student.favoriteBorder);
                  return (
                    <div
                      key={student.id}
                      className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 dark:border-slate-800"
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-tr ${border.previewGradient || "from-slate-600 to-slate-800"}`}
                      >
                        <span>{border.previewEmoji || "✨"}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-800 dark:text-white">
                          {student.name || `طالب (${student.id.slice(0, 6)})`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {border.name || "إطار غير معروف"}
                        </p>
                      </div>
                      <Heart className="h-4 w-4 shrink-0 fill-rose-500 text-rose-500" />
                    </div>
                  );
                })
              ) : (
                <div className="py-10 text-center text-sm text-slate-400">
                  <Users className="mx-auto mb-3 h-8 w-8" />
                  لا توجد إطارات مفضلة حتى الآن.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
