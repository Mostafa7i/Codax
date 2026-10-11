'use client';

import React, { useEffect, useState, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import { db } from "@/app/services/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
  X,
  Github,
  Clock,
  ExternalLink,
  AlertCircle,
  Link2,
  ClipboardList,
} from "lucide-react";

const isValidUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  try {
    const u = new URL(url.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

const formatDate = (timestamp) => {
  if (!timestamp) return "تاريخ غير محدد";
  try {
    const date = timestamp?.toDate?.() || new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "تاريخ غير صحيح";
    return date.toLocaleString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "تاريخ غير صحيح";
  }
};

const toTime = (timestamp) => {
  if (!timestamp) return 0;
  try {
    const d = timestamp?.toDate?.() || new Date(timestamp);
    return d.getTime() || 0;
  } catch {
    return 0;
  }
};

const StudentGithubLinksPopup = ({ studentId, onClose }) => {
  const [mounted, setMounted] = useState(false);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentName, setStudentName] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchLinks = useCallback(async () => {
    if (!studentId) {
      setError("معرف الطالب مطلوب");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const q = query(
        collection(db, "students"),
        where("id", "==", Number(studentId))
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError("الطالب غير موجود");
        setLinks([]);
        return;
      }

      const data = snapshot.docs[0].data();
      setStudentName(data.name || "طالب غير معروف");

      const fromHistory = (data.linksHistory || [])
        .filter((item) => item?.url)
        .map((item, i) => ({
          id: `history-${i}-${item.url}`,
          url: String(item.url).trim(),
          title: item.title || "رابط GitHub",
          uploadedAt: item.uploadedAt || null,
          source: "history",
        }));

      const fromTasks = (data.tasks || [])
        .filter((task) => task?.submittedLink)
        .map((task, i) => ({
          id: `task-${task.id ?? i}-${task.submittedLink}`,
          url: String(task.submittedLink).trim(),
          title:
            task.title ||
            task.taskTitle ||
            task.name ||
            `تسليم تاسك${task.id != null ? ` #${task.id}` : ""}`,
          uploadedAt:
            task.submittedAt ||
            task.uploadedAt ||
            task.completedAt ||
            task.date ||
            null,
          source: "task",
          taskScore: task.score ?? null,
        }));

      const mergedMap = new Map();
      [...fromHistory, ...fromTasks].forEach((item) => {
        const key = item.url.toLowerCase();
        const existing = mergedMap.get(key);
        if (!existing || toTime(item.uploadedAt) > toTime(existing.uploadedAt)) {
          mergedMap.set(key, item);
        }
      });

      const sorted = [...mergedMap.values()].sort(
        (a, b) => toTime(b.uploadedAt) - toTime(a.uploadedAt)
      );

      setLinks(sorted);
    } catch (err) {
      console.error("خطأ في جلب الروابط:", err);
      setError("حدث خطأ أثناء جلب الروابط. يرجى المحاولة مرة أخرى.");
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  // ESC + منع سكرول الخلفية
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const historyCount = links.filter((l) => l.source === "history").length;
  const taskCount = links.filter((l) => l.source === "task").length;

  if (!mounted) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 backdrop-blur-sm p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="github-popup-title"
      dir="rtl"
    >
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg max-h-[min(90vh,640px)] flex flex-col overflow-hidden">
        {/* Header — ثابت */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800">
          <div className="min-w-0">
            <h2
              id="github-popup-title"
              className="text-sm font-bold text-slate-100 flex items-center gap-2 truncate"
            >
              <Github className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="truncate">{studentName || "روابط الطالب"}</span>
            </h2>
            {!loading && !error && links.length > 0 && (
              <p className="text-[11px] text-slate-500 mt-0.5">
                {links.length} رابط
                {historyCount > 0 && ` · ${historyCount} سجل`}
                {taskCount > 0 && ` · ${taskCount} تاسك`}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition shrink-0"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body — سكرول داخلي فقط */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin" />
              <p className="text-slate-400 text-sm">جاري تحميل الروابط...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-300 text-sm mb-2">{error}</p>
                <button
                  type="button"
                  onClick={fetchLinks}
                  className="text-xs font-bold hover:bg-red-500/30 text-red-200 px-3 py-1.5 rounded-lg transition"
                >
                  إعادة المحاولة
                </button>
              </div>
            </div>
          )}

          {!loading && !error && links.length === 0 && (
            <div className="text-center py-12">
              <Github className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <p className="text-slate-300 font-medium mb-1">لا توجد روابط</p>
              <p className="text-slate-500 text-xs">
                لا يوجد روابط في السجل أو تسليمات التاسكات
              </p>
            </div>
          )}

          {!loading && !error && links.length > 0 && (
            <ul className="space-y-2">
              {links.map((link, index) => {
                const valid = isValidUrl(link.url);
                return (
                  <li
                    key={link.id}
                    className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <a
                        href={valid ? link.url : undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          if (!valid) e.preventDefault();
                        }}
                        className={`flex items-center gap-2 min-w-0 flex-1 ${
                          valid
                            ? "hover:text-indigo-200"
                            : "text-slate-500 cursor-not-allowed"
                        }`}
                      >
                        {link.source === "task" ? (
                          <ClipboardList className="w-4 h-4 shrink-0" />
                        ) : (
                          <Link2 className="w-4 h-4 shrink-0" />
                        )}
                        <span className="text-sm font-semibold truncate">
                          {link.title}
                        </span>
                        {valid && (
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                        )}
                      </a>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {index === 0 && (
                          <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                            الأحدث
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            link.source === "task"
                              ? "bg-violet-500/15 text-violet-300 border-violet-500/25"
                              : "bg-slate-500/15 text-slate-400 border-slate-500/25"
                          }`}
                        >
                          {link.source === "task" ? "تاسك" : "سجل"}
                        </span>
                      </div>
                    </div>

                    <p
                      className="text-[11px] text-slate-500 truncate mb-1.5 text-left"
                      dir="ltr"
                      title={link.url}
                    >
                         <a
                        href={valid ? link.url : undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          if (!valid) e.preventDefault();
                        }}
                        className={`flex items-center gap-2 min-w-0 flex-1 ${
                          valid
                            ? "hover:text-indigo-200"
                            : "text-slate-500 cursor-not-allowed"
                        }`}
                      >
                        {link.source === "task" ? (
                          <ClipboardList className="w-4 h-4 shrink-0" />
                        ) : (
                          <Link2 className="w-4 h-4 shrink-0" />
                        )}
                        <span className="text-xs font-semibold truncate">
                          {link.url}
                        </span>
                        {valid && (
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                        )}
                      </a>
                    </p>

                    <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(link.uploadedAt)}
                      </span>
                 
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );

  // المهم: يخرج برّة شجرة الكارت تمامًا
  return createPortal(modal, document.body);
};

export default memo(StudentGithubLinksPopup);
