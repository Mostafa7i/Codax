"use client";

import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  User,
  MessageCircle,
  AlertCircle,
  Eye,
  Clock,
  Shield,
  Loader2,
  EyeOff,
  Lightbulb,
  Inbox,
} from "lucide-react";

// استدعاء خدمات البيانات المفسولة
import {
  subscribeToMessages,
  markAllMessagesAsRead,
  deleteMessageById,
} from "@/app/hooks/allHooks";

const TYPE_META = {
  problem: {
    text: "مشكلة",
    icon: AlertCircle,
    badge: "bg-red-500/15 text-red-300 border-red-500/25",
    iconColor: "text-red-400",
    accent: "from-red-500/20 to-transparent",
  },
  suggestion: {
    text: "اقتراح",
    icon: Lightbulb,
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/25",
    iconColor: "text-sky-400",
    accent: "from-sky-500/20 to-transparent",
  },
  complaint: {
    text: "شكوى",
    icon: AlertCircle,
    badge: "bg-orange-500/15 text-orange-300 border-orange-500/25",
    iconColor: "text-orange-400",
    accent: "from-orange-500/20 to-transparent",
  },
};

function getTypeMeta(type) {
  return (
    TYPE_META[type?.toLowerCase()] || {
      text: "رسالة",
      icon: MessageCircle,
      badge: "bg-slate-500/15 text-slate-300 border-slate-500/25",
      iconColor: "text-slate-400",
      accent: "from-indigo-500/15 to-transparent",
    }
  );
}

function formatDate(timestamp) {
  if (!timestamp) return "غير محدد";
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "غير محدد";
    return formatDistanceToNow(date, { addSuffix: true, locale: ar });
  } catch {
    return "غير محدد";
  }
}

const MessageCard = memo(function MessageCard({
  msg,
  index,
  onAskDelete,
  deletingId,
}) {
  const [revealName, setRevealName] = useState(false);
  const meta = getTypeMeta(msg.type);
  const TypeIcon = meta.icon;
  const initial = msg.name?.[0]?.toUpperCase() || "؟";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: Math.min(index * 0.03, 0.2), duration: 0.3 }}
      className="relative rounded-2xl border border-slate-700/50 bg-slate-900/70 overflow-hidden hover:border-slate-600/60 transition-colors"
    >
      <div
        className={`pointer-events-none absolute top-0 inset-x-0 h-20 bg-linear-to-b ${meta.accent}`}
      />

      <div className="relative p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 min-w-0">
            {/* Avatar */}
            <div
              className={`shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-white ${
                msg.isAnonymous
                  ? "bg-slate-700 border border-slate-600"
                  : "bg-linear-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20"
              }`}
            >
              {msg.isAnonymous ? (
                <Shield className="w-5 h-5 text-slate-300" />
              ) : (
                <span className="text-lg">{initial}</span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {msg.isAnonymous ? (
                  <span className="font-bold text-slate-200 flex items-center gap-1.5 text-sm sm:text-base">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    مجهول
                    <button
                      type="button"
                      onClick={() => setRevealName((p) => !p)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title={revealName ? "إخفاء الاسم" : "إظهار الاسم"}
                    >
                      {revealName ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                    {revealName && (
                      <span className="text-indigo-300 font-semibold">
                        ({msg.name || "—"})
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="font-bold text-white flex items-center gap-1.5 text-sm sm:text-base">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    {msg.name || "غير محدد"}
                  </span>
                )}

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${meta.badge}`}
                >
                  <TypeIcon className={`w-3 h-3 ${meta.iconColor}`} />
                  {meta.text}
                </span>

                {msg.read === false && (
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" title="غير مقروء" />
                )}
              </div>

              <p className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                {formatDate(msg.createdAt)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onAskDelete(msg.id)}
            disabled={deletingId === msg.id}
            className="shrink-0 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition disabled:opacity-60"
            title="حذف الرسالة"
          >
            {deletingId === msg.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="rounded-xl bg-slate-800/60 border border-slate-700/40 p-3.5 sm:p-4">
          <p className="text-slate-200 text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap">
            {msg.message || "لا يوجد محتوى"}
          </p>
        </div>
      </div>
    </motion.article>
  );
});

export default function MessageProblems() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null);
  const [filter, setFilter] = useState("all");

  // 1. جلب البيانات والتنصت التلقائي
  useEffect(() => {
    const unsubscribe = subscribeToMessages(
      (fetchedData) => {
        setMessages(fetchedData);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, []);

  // 2. علم الكُتل المقروءة عند التحميل
  useEffect(() => {
    markAllMessagesAsRead();
  }, []);

  // 3. حذف الرسالة
  const handleDelete = useCallback(async (id) => {
    setDeletingId(id);
    try {
      await deleteMessageById(id);
      setShowConfirm(null);
    } catch (error) {
      alert("فشل الحذف: " + error.message);
    } finally {
      setDeletingId(null);
    }
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return messages;
    return messages.filter(
      (m) => (m.type || "").toLowerCase() === filter
    );
  }, [messages, filter]);

  const counts = useMemo(() => {
    const c = { all: messages.length, problem: 0, suggestion: 0, complaint: 0 };
    messages.forEach((m) => {
      const t = (m.type || "").toLowerCase();
      if (c[t] != null) c[t] += 1;
    });
    return c;
  }, [messages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060912] py-10 px-4" dir="rtl">
        <div className="max-w-3xl mx-auto space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 rounded-2xl bg-slate-800/40 border border-slate-700/40 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#060912] text-slate-200 py-8 sm:py-10 px-3 sm:px-4"
      dir="rtl"
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-[11px] font-bold tracking-wide mb-3">
            <Inbox className="w-3.5 h-3.5" />
            صندوق الرسائل
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">
            رسائل وشكاوى الطلاب
          </h1>
          <p className="text-slate-500 text-sm">
            إجمالي الرسائل:{" "}
            <span className="text-indigo-300 font-bold tabular-nums">
              {messages.length}
            </span>
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {[
            { key: "all", label: "الكل" },
            { key: "problem", label: "مشاكل" },
            { key: "suggestion", label: "اقتراحات" },
            { key: "complaint", label: "شكاوى" },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                filter === f.key
                  ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-200"
                  : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-slate-200"
              }`}
            >
              {f.label}
              <span className="mr-1.5 tabular-nums opacity-70">
                {counts[f.key] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <MessageCircle className="w-14 h-14 mx-auto text-slate-600 mb-3" />
              <p className="text-lg font-semibold text-slate-400">
                لا توجد رسائل هنا
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filtered.map((msg, index) => (
                <MessageCard
                  key={msg.id}
                  msg={msg}
                  index={index}
                  onAskDelete={setShowConfirm}
                  deletingId={deletingId}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Delete confirm */}
        <AnimatePresence>
          {showConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setShowConfirm(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 max-w-sm w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center">
                    <AlertCircle className="w-7 h-7 text-red-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    تأكيد الحذف
                  </h3>
                  <p className="text-slate-400 text-sm mb-6">
                    هل أنت متأكد من حذف هذه الرسالة نهائيًا؟
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      type="button"
                      onClick={() => setShowConfirm(null)}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-sm hover:bg-slate-700 transition"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(showConfirm)}
                      disabled={deletingId === showConfirm}
                      className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm disabled:opacity-70 transition flex items-center gap-2"
                    >
                      {deletingId === showConfirm && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      حذف نهائي
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}