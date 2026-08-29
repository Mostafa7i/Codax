"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  Bell,
  BellRing,
  CheckCheck,
  Clock,
  Sparkles,
  BookOpen,
  ClipboardList,
  Trophy,
  Megaphone,
  X,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/app/hooks/allHooks";

// دالة مساعدة لتصنيف الإشعار واختيار الأيقونة والألوان المناسبة
function getNotificationBadge(title = "", message = "") {
  const text = `${title} ${message}`.toLowerCase();

  if (
    text.includes("اختبار") ||
    text.includes("امتحان") ||
    text.includes("exam") ||
    text.includes("quiz")
  ) {
    return {
      type: "exam",
      label: "اختبار",
      icon: BookOpen,
      gradient: "from-purple-500 to-indigo-600",
      bgSoft: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      accent: "text-purple-400",
      dot: "bg-purple-500",
    };
  }

  if (
    text.includes("مهمة") ||
    text.includes("تاسك") ||
    text.includes("task") ||
    text.includes("مشروع")
  ) {
    return {
      type: "task",
      label: "مهمة",
      icon: ClipboardList,
      gradient: "from-sky-500 to-blue-600",
      bgSoft: "bg-sky-500/10 text-sky-400 border-sky-500/30",
      accent: "text-sky-400",
      dot: "bg-sky-500",
    };
  }

  if (
    text.includes("نقاط") ||
    text.includes("أوائل") ||
    text.includes("مركز") ||
    text.includes("ترتيب") ||
    text.includes("فائز") ||
    text.includes("تراجع") ||
    text.includes("صعود")
  ) {
    const hasPromotion =
      text.includes("صعود") ||
      text.includes("🟢") ||
      text.includes("المتقدمين");
    const hasDemotion =
      text.includes("تراجع") ||
      text.includes("🔴") ||
      text.includes("المتراجعين");

    if (hasDemotion && !hasPromotion) {
      return {
        type: "rank-down",
        label: "تراجع ترتيب ⚠️",
        icon: AlertTriangle,
        gradient: "from-rose-600 to-amber-600",
        bgSoft: "bg-rose-500/10 text-rose-400 border-rose-500/30",
        accent: "text-rose-400",
        dot: "bg-rose-500",
      };
    }

    if (hasPromotion && !hasDemotion) {
      return {
        type: "rank-up",
        label: "صعود ترتيب 🚀",
        icon: Trophy,
        gradient: "from-emerald-500 to-teal-600",
        bgSoft: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        accent: "text-emerald-400",
        dot: "bg-emerald-500",
      };
    }

    return {
      type: "rank",
      label: "تحديث الترتيب 🏆",
      icon: Trophy,
      gradient: "from-amber-500 to-orange-600",
      bgSoft: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      accent: "text-amber-400",
      dot: "bg-amber-500",
    };
  }

  return {
    type: "general",
    label: "إعلان",
    icon: Megaphone,
    gradient: "from-emerald-500 to-teal-600",
    bgSoft: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    accent: "text-emerald-400",
    dot: "bg-emerald-500",
  };
}

// دالة لتنسيق التاريخ بشكل جذاب بالعربية
function formatNotificationDate(rawDate) {
  if (!rawDate) return "الآن";

  try {
    let dateObj = rawDate;
    if (typeof rawDate === "string" || typeof rawDate === "number") {
      dateObj = new Date(rawDate);
    } else if (rawDate.toDate && typeof rawDate.toDate === "function") {
      dateObj = rawDate.toDate();
    }

    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      return "حديثاً";
    }

    const now = new Date();
    const diffMs = now - dateObj;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 2) return "منذ لحظات";
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays === 1) return "أمس";
    if (diffDays < 7) return `منذ ${diffDays} أيام`;

    return dateObj.toLocaleDateString("ar-EG", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  } catch (e) {
    return "حديثاً";
  }
}

// مكون مخصص لعرض إشعارات الترتيب بشكل منظم واحترافي
function RankChangeDisplay({ message }) {
  const lines = (message || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const promotions = [];
  const demotions = [];
  let footer = "";

  lines.forEach((line) => {
    if (
      line.startsWith("🟢") ||
      line.includes("صعود في الترتيب") ||
      line.includes("الطلاب المتقدمين") ||
      (line.includes("تقدم(ت)") && !line.includes("تراجع"))
    ) {
      if (
        !line.includes("الطلاب المتقدمين") &&
        !line.includes("صعود في الترتيب:")
      ) {
        promotions.push(line.replace(/^[🟢•\s⬆️]+/, "").trim());
      }
    } else if (
      line.startsWith("🔴") ||
      line.includes("تراجع في الترتيب") ||
      line.includes("الطلاب المتراجعين") ||
      line.includes("تراجع(ت)")
    ) {
      if (
        !line.includes("الطلاب المتراجعين") &&
        !line.includes("تراجع في الترتيب:")
      ) {
        demotions.push(line.replace(/^[🔴•\s⬇️]+/, "").trim());
      }
    } else if (
      line.includes("واصلوا") ||
      line.includes("💪") ||
      line.includes("المنافسة")
    ) {
      footer = line;
    }
  });

  return (
    <div className="mt-2.5 space-y-2.5 text-xs" dir="rtl">
      {/* 🚀 قسم الطلاب المتقدمين (الصعود) */}
      {promotions.length > 0 && (
        <div className="rounded-xl bg-emerald-950/40 border border-emerald-500/30 p-2.5 space-y-1.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-emerald-400 font-black text-[11px] pb-1 border-b border-emerald-500/20">
            <span className="text-sm">🚀</span>
            <span>الطلاب المتقدمين في المراكز:</span>
          </div>
          <div className="space-y-1.5 pt-0.5">
            {promotions.map((p, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg text-emerald-100"
              >
                <span className="shrink-0 inline-flex items-center justify-center gap-0.5 px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-black text-[10px]">
                  🟢 ⬆️
                </span>
                <span className="font-bold text-white leading-tight wrap-break-word flex-1">
                  {p}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ⚠️ قسم الطلاب المتراجعين (التراجع) */}
      {demotions.length > 0 && (
        <div className="rounded-xl bg-rose-950/30 border border-rose-500/30 p-2.5 space-y-1.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-rose-400 font-black text-[11px] pb-1 border-b border-rose-500/20">
            <span className="text-sm">⚠️</span>
            <span>الطلاب المتراجعين في المراكز:</span>
          </div>
          <div className="space-y-1.5 pt-0.5">
            {demotions.map((d, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-rose-900/20 border border-rose-500/20 px-2.5 py-1.5 rounded-lg text-rose-200"
              >
                <span className="shrink-0 inline-flex items-center justify-center gap-0.5 px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-400/40 text-rose-300 font-black text-[10px]">
                  🔴 ⬇️
                </span>
                <span className="font-semibold text-slate-200 leading-tight wrap-break-word flex-1">
                  {d}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {footer && (
        <p className="text-[11px] text-amber-300/90 font-bold text-center pt-1">
          {footer}
        </p>
      )}
    </div>
  );
}

// تفكيك وتنسيق الرسائل
function FormattedMessage({ message }) {
  if (!message) return null;

  // فحص إذا كان الإشعار خاصاً بتغير الترتيب
  const isRankMessage =
    message.includes("صعود") ||
    message.includes("تراجع") ||
    message.includes("🟢") ||
    message.includes("🔴") ||
    message.includes("ترتيب أوائل");

  if (isRankMessage) {
    return <RankChangeDisplay message={message} />;
  }

  // إذا كانت الرسالة تحتوي على فواصل تواريخ (مواعيد اختبارات / مهام)
  const parts = message.split(/(📅|🏁)/g).filter(Boolean);

  if (parts.length > 1) {
    const mainText = parts[0]?.replace(/[📅🏁].*$/, "").trim();
    const dateChips = [];

    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === "📅" && parts[i + 1]) {
        dateChips.push({ icon: "📅", text: parts[i + 1].trim() });
        i++;
      } else if (parts[i] === "🏁" && parts[i + 1]) {
        dateChips.push({ icon: "🏁", text: parts[i + 1].trim() });
        i++;
      }
    }

    return (
      <div className="space-y-1.5 mt-1">
        {mainText && (
          <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-line leading-relaxed">
            {mainText}
          </p>
        )}
        {dateChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {dateChips.map((chip, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/80 border border-slate-700/60 text-slate-300"
              >
                <span>{chip.icon}</span>
                <span>{chip.text}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-line leading-relaxed font-normal mt-1">
      {message}
    </p>
  );
}

const Notifications = ({ studentGroup }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [readLocally, setReadLocally] = useState([]);
  const [filterTab, setFilterTab] = useState("all"); // "all" | "unread"

  const dropdownRef = useRef(null);

  // استرجاع الإشعارات المقروءة من الـ localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("readNotifications");
        if (stored) {
          setReadLocally(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Error parsing read notifications:", e);
      }
    }
  }, []);

  const notifications = useNotifications(studentGroup);

  // حساب غير المقروء
  useEffect(() => {
    const unread = notifications.filter(
      (n) => !readLocally.includes(n.id),
    ).length;
    setUnreadCount(unread);
  }, [notifications, readLocally]);

  // إغلاق عند الضغط بالخارج أو زر Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const toggleNotifications = () => {
    setIsOpen((prev) => !prev);
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    const updated = [...new Set([...readLocally, ...allIds])];
    setReadLocally(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("readNotifications", JSON.stringify(updated));
    }
  };

  const markSingleAsRead = (id, e) => {
    e?.stopPropagation();
    if (readLocally.includes(id)) return;
    const updated = [...readLocally, id];
    setReadLocally(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("readNotifications", JSON.stringify(updated));
    }
  };

  // تصفية الإشعارات بناءً على التاب النشط
  const filteredNotifications = useMemo(() => {
    if (filterTab === "unread") {
      return notifications.filter((n) => !readLocally.includes(n.id));
    }
    return notifications;
  }, [notifications, readLocally, filterTab]);

  return (
    <div className="relative inline-block" ref={dropdownRef} dir="rtl">
      {/* ─── زر جرس الإشعارات الحديث ─── */}
      <button
        onClick={toggleNotifications}
        aria-label="الإشعارات"
        aria-expanded={isOpen}
        className={`relative p-2.5 rounded-2xl transition-all duration-300 flex items-center justify-center group ${
          isOpen
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400/50"
            : "bg-slate-900/60 hover:bg-indigo-600/20 text-slate-300 hover:text-white border border-slate-700/60 hover:border-indigo-500/40 shadow-sm backdrop-blur-md active:scale-95"
        }`}
      >
        <div className="relative">
          {unreadCount > 0 ? (
            <BellRing className="w-5 h-5 text-indigo-300 group-hover:text-indigo-200 transition-transform group-hover:rotate-12" />
          ) : (
            <Bell className="w-5 h-5 transition-transform group-hover:scale-110" />
          )}
        </div>

        {/* بادج العداد المتوهج */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -left-1.5 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-[11px] font-black text-white shadow-lg shadow-rose-500/50 border border-slate-950 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ─── نافذة الإشعارات المنسدلة ─── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* خلفية معتمة على الموبايل */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* الحاوية الرئيسية للإشعارات */}
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="
                z-50
                fixed inset-x-3 top-20 max-h-[82vh]
                md:absolute md:inset-auto md:top-full md:left-0 md:mt-3
                md:w-[420px] md:max-h-[75vh]
                flex flex-col
                rounded-3xl
                bg-slate-900/95 dark:bg-slate-950/95
                backdrop-blur-2xl
                border border-indigo-500/25
                shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_35px_rgba(99,102,241,0.15)]
                overflow-hidden
              "
            >
              {/* شريط الإضاءة العلوي */}
              <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

              {/* ─── Header ─── */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      الإشعارات
                      {unreadCount > 0 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {unreadCount} جديد
                        </span>
                      )}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-xl text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all flex items-center gap-1"
                      title="تحديد الكل كمقروء"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">مقروء للكل</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    aria-label="إغلاق"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ─── Tabs الفلترة ─── */}
              <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-950/40 border-b border-slate-800/60">
                <button
                  onClick={() => setFilterTab("all")}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                    filterTab === "all"
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  الكل ({notifications.length})
                </button>
                <button
                  onClick={() => setFilterTab("unread")}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                    filterTab === "unread"
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  غير مقروءة ({unreadCount})
                </button>
              </div>

              {/* ─── قائمة الإشعارات ─── */}
              <div className="overflow-y-auto flex-1 divide-y divide-slate-800/60 custom-scrollbar max-h-[55vh] md:max-h-[50vh]">
                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3.5 shadow-inner">
                      <BellRing className="w-8 h-8 opacity-70" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-200 mb-1">
                      {filterTab === "unread"
                        ? "لا توجد إشعارات غير مقروءة"
                        : "لا توجد إشعارات حالياً"}
                    </h4>
                    <p className="text-xs text-slate-400 max-w-xs">
                      {filterTab === "unread"
                        ? "لقد قمت بقراءة جميع الإشعارات المتاحة."
                        : "سيتم إشعارك فور نشر اختبارات أو مهام أو إعلانات جديدة لمجموعتك."}
                    </p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1.5">
                    {filteredNotifications.map((notif) => {
                      const isUnread = !readLocally.includes(notif.id);
                      const badge = getNotificationBadge(
                        notif.title,
                        notif.message,
                      );
                      const IconComponent = badge.icon;

                      return (
                        <div
                          key={notif.id}
                          onClick={() => markSingleAsRead(notif.id)}
                          className={`group relative p-3.5 rounded-2xl transition-all duration-200 cursor-pointer border ${
                            isUnread
                              ? "bg-gradient-to-r from-indigo-950/40 via-slate-900/90 to-purple-950/30 border-indigo-500/30 shadow-md shadow-indigo-950/20 hover:border-indigo-400/50"
                              : "bg-slate-900/30 hover:bg-slate-800/50 border-slate-800/50 text-slate-400"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {/* أيقونة الفئة */}
                            <div
                              className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center shadow-md bg-gradient-to-br ${badge.gradient} text-white`}
                            >
                              <IconComponent className="w-5 h-5" />
                            </div>

                            {/* المحتوى */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.bgSoft}`}
                                  >
                                    {badge.label}
                                  </span>
                                  {isUnread && (
                                    <span className="w-2 h-2 rounded-full bg-indigo-400 ring-4 ring-indigo-400/20 animate-pulse" />
                                  )}
                                </div>

                                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                                  <Clock className="w-3 h-3 text-slate-500" />
                                  <span>
                                    {formatNotificationDate(notif.createdAt)}
                                  </span>
                                </div>
                              </div>

                              {/* عنوان الإشعار */}
                              <h4
                                className={`text-sm leading-snug font-bold ${
                                  isUnread ? "text-white" : "text-slate-200"
                                }`}
                              >
                                {notif.title || "إشعار جديد"}
                              </h4>

                              {/* نص الإشعار المنسق */}
                              <FormattedMessage message={notif.message} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ─── Footer ─── */}
              {filteredNotifications.length > 0 && (
                <div className="px-5 py-3 bg-slate-950/70 border-t border-slate-800/70 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    المجموعة:{" "}
                    <strong className="text-slate-200">
                      {studentGroup || "عام"}
                    </strong>
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline"
                    >
                      تحديد الكل كمقروء
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(Notifications);
