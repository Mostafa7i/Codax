"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  writeBatch,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig";
import {
  Heart,
  ThumbsUp,
  ThumbsDown,
  Search,
  Users,
  Clock,
  CheckCheck,
  Filter,
  Trash2,
  RefreshCw,
  Sparkles,
  UserCheck,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertCircle,
} from "lucide-react";
import Swal from "sweetalert2";

const PAGE_SIZE = 15;

const dateFormatter = new Intl.DateTimeFormat("ar-EG", {
  timeZone: "Africa/Cairo",
  dateStyle: "medium",
  timeStyle: "short",
});

function formatRelativeTime(timestamp) {
  if (!timestamp) return "";
  const timeMs =
    typeof timestamp === "number"
      ? timestamp
      : timestamp.seconds
        ? timestamp.seconds * 1000
        : timestamp.toDate
          ? timestamp.toDate().getTime()
          : new Date(timestamp).getTime();

  if (isNaN(timeMs)) return "";

  const diffMinutes = Math.max(0, Math.floor((Date.now() - timeMs) / 60000));
  if (diffMinutes < 1) return "الآن";
  if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "أمس";
  if (diffDays < 7) return `منذ ${diffDays} أيام`;
  return `منذ ${Math.floor(diffDays / 7)} أسبوع`;
}

function formatFullDate(timestamp) {
  if (!timestamp) return "—";
  try {
    const d =
      typeof timestamp === "number"
        ? new Date(timestamp)
        : timestamp.seconds
          ? new Date(timestamp.seconds * 1000)
          : timestamp.toDate
            ? timestamp.toDate()
            : new Date(timestamp);
    return isNaN(d.getTime()) ? "—" : dateFormatter.format(d);
  } catch {
    return "—";
  }
}

export default function ReactionsPage() {
  const [likesFeed, setLikesFeed] = useState([]);
  const [dislikesFeed, setDislikesFeed] = useState([]);
  const [students, setStudents] = useState([]);
  const [viewLogs, setViewLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("feed"); // 'feed' | 'students' | 'view_logs'
  const [filterType, setFilterType] = useState("all"); // 'all' | 'likes' | 'dislikes' | 'unread' | 'today'
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [page, setPage] = useState(1);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // 1. تصفير وإلغاء شارة الإشعارات في قاعدة البيانات بمجرد دخول الصفحة
  const markAllAsRead = useCallback(async (silent = true) => {
    try {
      setIsMarkingRead(true);
      const qLikes = query(
        collection(db, "likesStudents"),
        where("read", "==", false),
      );
      const qDislikes = query(
        collection(db, "dislikesStudents"),
        where("read", "==", false),
      );

      const [likesSnap, dislikesSnap] = await Promise.all([
        getDocs(qLikes),
        getDocs(qDislikes),
      ]);

      if (!likesSnap.empty || !dislikesSnap.empty) {
        const batch = writeBatch(db);
        likesSnap.docs.forEach((d) => batch.update(d.ref, { read: true }));
        dislikesSnap.docs.forEach((d) => batch.update(d.ref, { read: true }));
        await batch.commit();

        if (!silent) {
          Swal.fire({
            icon: "success",
            title: "تم تحديد جميع التفاعلات كمقروءة",
            timer: 1500,
            showConfirmButton: false,
          });
        }
      } else if (!silent) {
        Swal.fire({
          icon: "info",
          title: "جميع التفاعلات مقروءة بالفعل",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error("Error marking reactions as read:", err);
    } finally {
      setIsMarkingRead(false);
    }
  }, []);

  // تنفيذ تلقائي لتصفير البادج عند فتح الصفحة
  useEffect(() => {
    markAllAsRead(true);
  }, [markAllAsRead]);

  // 2. الاستماع اللحظي للإعجابات
  useEffect(() => {
    const q = query(
      collection(db, "likesStudents"),
      orderBy("timestamp", "desc"),
      limit(300),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({
          id: d.id,
          type: "like",
          ...d.data(),
        }));
        setLikesFeed(items);
        setLoading(false);
      },
      (err) => {
        console.error("Error listening to likesStudents:", err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  // 3. الاستماع اللحظي لعدم الإعجاب
  useEffect(() => {
    const q = query(
      collection(db, "dislikesStudents"),
      orderBy("timestamp", "desc"),
      limit(300),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({
          id: d.id,
          type: "dislike",
          ...d.data(),
        }));
        setDislikesFeed(items);
      },
      (err) => {
        console.error("Error listening to dislikesStudents:", err);
      },
    );
    return () => unsub();
  }, []);

  // 4. الاستماع اللحظي للطلاب
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "students"), (snap) => {
      const list = snap.docs.map((d) => ({
        docId: d.id,
        ...d.data(),
      }));
      setStudents(list);
    });
    return () => unsub();
  }, []);

  // 5. الاستماع اللحظي لسجل كشف التفاعلات
  useEffect(() => {
    const q = query(
      collection(db, "reactionViewLogs"),
      orderBy("timestamp", "desc"),
      limit(100),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setViewLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error("Error listening to reactionViewLogs:", err);
      },
    );
    return () => unsub();
  }, []);

  // خريطة الطلاب حسب ID الرقمي و docId لسرعة البحث واستخراج الصور والمجموعات
  const studentsMap = useMemo(() => {
    const map = new Map();
    students.forEach((s) => {
      if (s.id !== undefined && s.id !== null) {
        map.set(Number(s.id), s);
      }
      map.set(s.docId, s);
    });
    return map;
  }, [students]);

  // قائمة المجموعات المتاحة
  const availableGroups = useMemo(() => {
    const groups = new Set();
    students.forEach((s) => {
      if (s.group) groups.add(String(s.group));
    });
    return Array.from(groups).sort();
  }, [students]);

  // دمج كافة التفاعلات وترتيبها تنازلياً من الأحدث للأقدم
  const combinedFeed = useMemo(() => {
    const all = [...likesFeed, ...dislikesFeed];

    // تطبيع وترقية البيانات مع بيانات الطالب الفاعل والمستهدف
    const normalized = all.map((item) => {
      const fromId = item.likerId ?? item.dislikerId;
      const fromName = item.likerName ?? item.dislikerName;
      const toId = item.targetId;
      const toName = item.targetName;

      const fromStudent = studentsMap.get(Number(fromId));
      const toStudent = studentsMap.get(Number(toId));

      const timeVal =
        typeof item.timestamp === "number"
          ? item.timestamp
          : item.timestamp?.seconds
            ? item.timestamp.seconds * 1000
            : item.timestamp?.toDate
              ? item.timestamp.toDate().getTime()
              : 0;

      return {
        ...item,
        fromId,
        fromName: fromStudent?.name || fromName || `طالب #${fromId}`,
        fromPic: fromStudent?.profilePic || null,
        fromGroup: fromStudent?.group || null,
        toId,
        toName: toStudent?.name || toName || `طالب #${toId}`,
        toPic: toStudent?.profilePic || null,
        toGroup: toStudent?.group || null,
        timeMs: timeVal,
      };
    });

    return normalized.sort((a, b) => b.timeMs - a.timeMs);
  }, [likesFeed, dislikesFeed, studentsMap]);

  // الإحصائيات العلوية
  const stats = useMemo(() => {
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    let totalLikes = 0;
    let totalDislikes = 0;
    let unreadCount = 0;
    let todayCount = 0;

    combinedFeed.forEach((item) => {
      if (item.type === "like") totalLikes++;
      else totalDislikes++;

      if (item.read === false) unreadCount++;
      if (item.timeMs >= twentyFourHoursAgo) todayCount++;
    });

    return {
      total: combinedFeed.length,
      likes: totalLikes,
      dislikes: totalDislikes,
      unread: unreadCount,
      today: todayCount,
    };
  }, [combinedFeed]);

  // التصفية والبحث في الـ Feed
  const filteredFeed = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    return combinedFeed.filter((item) => {
      // فلتر النوع
      if (filterType === "likes" && item.type !== "like") return false;
      if (filterType === "dislikes" && item.type !== "dislike") return false;
      if (filterType === "unread" && item.read !== false) return false;
      if (filterType === "today" && item.timeMs < twentyFourHoursAgo)
        return false;

      // فلتر المجموعة
      if (
        selectedGroup !== "all" &&
        item.fromGroup !== selectedGroup &&
        item.toGroup !== selectedGroup
      ) {
        return false;
      }

      // فلتر البحث
      if (search) {
        const matchesFrom =
          item.fromName?.toLowerCase().includes(search) ||
          String(item.fromId).includes(search);
        const matchesTo =
          item.toName?.toLowerCase().includes(search) ||
          String(item.toId).includes(search);
        const matchesGroup =
          String(item.fromGroup || "")
            .toLowerCase()
            .includes(search) ||
          String(item.toGroup || "")
            .toLowerCase()
            .includes(search);

        if (!matchesFrom && !matchesTo && !matchesGroup) {
          return false;
        }
      }

      return true;
    });
  }, [combinedFeed, filterType, selectedGroup, searchTerm]);

  // الباجنيشن
  const totalPages = Math.max(1, Math.ceil(filteredFeed.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedFeed = useMemo(() => {
    return filteredFeed.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE,
    );
  }, [filteredFeed, currentPage]);

  // إعادة ضبط الصفحة عند تغيير الفلاتر
  useEffect(() => {
    setPage(1);
  }, [filterType, selectedGroup, searchTerm]);

  // حذف تفاعل إدارياً
  const handleDeleteReaction = async (item) => {
    const result = await Swal.fire({
      title: "حذف هذا التفاعل؟",
      html: `هل تريد حذف تفاعل <strong>${
        item.type === "like" ? "الإعجاب 👍" : "عدم الإعجاب 👎"
      }</strong> من <strong>${item.fromName}</strong> إلى <strong>${
        item.toName
      }</strong>؟`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "نعم، احذف",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#64748b",
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingId(item.id);

      // 1. حذف من المجموعة الفرعية
      const collName =
        item.type === "like" ? "likesStudents" : "dislikesStudents";
      await deleteDoc(doc(db, collName, item.id));

      // 2. تحديث وثيقة الطالب المستهدف إن وجدت
      const targetStudent = studentsMap.get(Number(item.toId));
      if (targetStudent?.docId) {
        const targetRef = doc(db, "students", targetStudent.docId);
        const reactionField = item.type === "like" ? "likedBy" : "dislikedBy";
        const countField =
          item.type === "like" ? "likesCount" : "dislikesCount";
        const idKey = item.type === "like" ? "likerId" : "dislikerId";

        const currentReactions = targetStudent[reactionField] || [];
        const updatedReactions = currentReactions.filter(
          (r) =>
            !(
              r[idKey] === Number(item.fromId) &&
              Math.abs((r.timestamp || 0) - item.timeMs) < 2000
            ),
        );
        const updatedCount = Math.max(0, updatedReactions.length);

        await updateDoc(targetRef, {
          [reactionField]: updatedReactions,
          [countField]: updatedCount,
        });
      }

      Swal.fire({
        icon: "success",
        title: "تم حذف التفاعل بنجاح",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error deleting reaction:", err);
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: "تعذر حذف التفاعل.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // قائمة الطلاب مع تفاعلاتهم للتبويب الثاني
  const studentReactionStats = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return students
      .map((student) => {
        const likedBy = Array.isArray(student.likedBy) ? student.likedBy : [];
        const dislikedBy = Array.isArray(student.dislikedBy)
          ? student.dislikedBy
          : [];

        // من قاموا بالإعجاب بهذا الطالب
        const detailedLikes = likedBy.map((e) => {
          const liker = studentsMap.get(Number(e.likerId));
          return {
            likerId: e.likerId,
            likerName: liker?.name || `طالب #${e.likerId}`,
            likerGroup: liker?.group || null,
            likerPic: liker?.profilePic || null,
            timestamp: e.timestamp,
          };
        });

        // من قاموا بعدم الإعجاب بهذا الطالب
        const detailedDislikes = dislikedBy.map((e) => {
          const disliker = studentsMap.get(Number(e.dislikerId));
          return {
            dislikerId: e.dislikerId,
            dislikerName: disliker?.name || `طالب #${e.dislikerId}`,
            dislikerGroup: disliker?.group || null,
            dislikerPic: disliker?.profilePic || null,
            timestamp: e.timestamp,
          };
        });

        return {
          ...student,
          detailedLikes,
          detailedDislikes,
          totalReactions: detailedLikes.length + detailedDislikes.length,
        };
      })
      .filter((s) => {
        if (selectedGroup !== "all" && s.group !== selectedGroup) return false;
        if (!search) return true;
        return (
          s.name?.toLowerCase().includes(search) ||
          String(s.id).includes(search) ||
          String(s.group || "")
            .toLowerCase()
            .includes(search)
        );
      })
      .sort((a, b) => b.totalReactions - a.totalReactions);
  }, [students, studentsMap, selectedGroup, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6" dir="rtl">
      {/* ── 1. الهيدر الرئيسي والإحصائيات ── */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-7 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 text-right">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-rose-500/30 via-purple-500/20 to-indigo-500/30 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-xl">
              <Heart className="w-7 h-7 fill-rose-500 text-rose-500 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-100">
                  لوحة تفاعلات الطلاب وإشعارات ردود الفعل
                </h1>
                {stats.unread > 0 && (
                  <span className="bg-rose-500 text-white font-black text-xs px-2.5 py-0.5 rounded-full animate-bounce">
                    {stats.unread} جديد
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                سجل حي وشامل لمن قام بالإعجاب أو عدم الإعجاب، ومعرفة المستهدف،
                والتوقيت اللحظي بدقة.
              </p>
            </div>
          </div>

          {/* أزرار الإجراءات السريعة */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={() => markAllAsRead(false)}
              disabled={isMarkingRead}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-emerald-500/30 shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="تحديد كافة التفاعلات كمقروءة وإخفاء شارة التنبيهات"
            >
              <CheckCheck className="w-4 h-4" />
              <span>تحديد الكل كمقروء</span>
            </button>

            <button
              type="button"
              onClick={() => markAllAsRead(true)}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
              title="تحديث البيانات"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* كروت المؤشرات السريعة (KPIs) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-800">
          <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 block">
                إجمالي الإعجابات
              </span>
              <span className="text-xl font-black text-blue-400">
                {stats.likes} 👍
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ThumbsUp className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 block">
                إجمالي عدم الإعجاب
              </span>
              <span className="text-xl font-black text-rose-400">
                {stats.dislikes} 👎
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ThumbsDown className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 block">
                تفاعلات آخر 24 ساعة
              </span>
              <span className="text-xl font-black text-amber-400">
                {stats.today} ⏱️
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 block">
                إشعارات غير مقروءة
              </span>
              <span
                className={`text-xl font-black ${
                  stats.unread > 0 ? "text-emerald-400" : "text-slate-400"
                }`}
              >
                {stats.unread} {stats.unread > 0 ? "🔔" : "✅"}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. شريط التبويبات الرئيسي ── */}
      <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("feed")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition cursor-pointer shrink-0 ${
            activeTab === "feed"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>سجل التفاعلات الزمني المباشر (Feed)</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80">
            {filteredFeed.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("students")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition cursor-pointer shrink-0 ${
            activeTab === "students"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <Users className="w-4 h-4 text-cyan-400" />
          <span>ملخص بطاقات الطلاب المستهدفين</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80">
            {studentReactionStats.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("view_logs")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition cursor-pointer shrink-0 ${
            activeTab === "view_logs"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <Eye className="w-4 h-4 text-purple-400" />
          <span>سجل من شاهد التفاعلات (Reveal Logs)</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80">
            {viewLogs.length}
          </span>
        </button>
      </div>

      {/* ── 3. شريط البحث والتصفية ── */}
      <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800/90 flex flex-col md:flex-row items-center gap-3">
        <div className="relative w-full md:flex-1">
          <Search
            className="absolute top-1/2 right-3.5 -translate-y-1/2 text-slate-400 pointer-events-none"
            size={18}
          />
          <input
            type="text"
            placeholder="ابحث باسم الطالب الفاعل أو المتلقي أو رقم المعرف ID أو المجموعة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* فلاتر النوع (فقط في تبويب الـ Feed) */}
        {activeTab === "feed" && (
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 overflow-x-auto w-full md:w-auto">
            {[
              { id: "all", label: "الكل" },
              { id: "likes", label: "👍 إعجاب" },
              { id: "dislikes", label: "👎 رفض" },
              { id: "today", label: "⏱️ اليوم" },
              { id: "unread", label: "🔔 جديد" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                  filterType === f.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* فلتر المجموعات */}
        {availableGroups.length > 0 && (
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 cursor-pointer w-full md:w-auto shrink-0"
          >
            <option value="all">كل المجموعات ({availableGroups.length})</option>
            {availableGroups.map((g) => (
              <option key={g} value={g}>
                مجموعة {g}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ── 4. المحتوى حسب التبويب المختار ── */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto text-indigo-400 animate-spin" />
          <p className="text-sm font-bold text-slate-400">
            جاري مزامنة تفاعلات الطلاب لحظياً...
          </p>
        </div>
      ) : activeTab === "feed" ? (
        /* ──── تبويب سجل التفاعلات الزمني المباشر ──── */
        <div className="space-y-3">
          {filteredFeed.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-2">
              <Users className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-bold text-slate-300">
                لا توجد تفاعلات تطابق معايير البحث الحالية
              </p>
              <p className="text-xs text-slate-500">
                جرّب تعديل البحث أو الفلترة لعرض التفاعلات الأخرى
              </p>
            </div>
          ) : (
            <>
              {pagedFeed.map((item, idx) => {
                const isLike = item.type === "like";
                const relativeTime = formatRelativeTime(item.timeMs);
                const fullDate = formatFullDate(item.timeMs);

                return (
                  <motion.div
                    key={item.id || idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      item.read === false
                        ? "bg-slate-900/90 border-indigo-500/50 shadow-lg shadow-indigo-500/5"
                        : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      {/* الجانب الأيمن: الفاعل -> التفاعل -> المتلقي */}
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        {/* الطالب الفاعل */}
                        <div className="flex items-center gap-2.5 bg-slate-950/70 p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-800">
                          {item.fromPic ? (
                            <img
                              src={item.fromPic}
                              alt={item.fromName}
                              className="w-9 h-9 rounded-full object-cover border border-slate-700"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-slate-300">
                              {item.fromName?.charAt(0) || "U"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="text-[10px] text-slate-400 block">
                              قام بالتفاعل:
                            </span>
                            <span className="text-xs sm:text-sm font-black text-slate-100 truncate block">
                              {item.fromName}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              ID: {item.fromId}{" "}
                              {item.fromGroup && `• (${item.fromGroup})`}
                            </span>
                          </div>
                        </div>

                        {/* بادج التفاعل المركزي */}
                        <div
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black shrink-0 shadow-md ${
                            isLike
                              ? "bg-linear-to-r from-blue-600/30 to-indigo-600/30 text-blue-300 border border-blue-500/40"
                              : "bg-linear-to-r from-rose-600/30 to-red-600/30 text-rose-300 border border-rose-500/40"
                          }`}
                        >
                          {isLike ? (
                            <>
                              <ThumbsUp className="w-4 h-4 text-blue-400" />
                              <span>أعجب بـ 👍</span>
                            </>
                          ) : (
                            <>
                              <ThumbsDown className="w-4 h-4 text-rose-400" />
                              <span>لم يعجب بـ 👎</span>
                            </>
                          )}
                        </div>

                        {/* الطالب المتلقي */}
                        <div className="flex items-center gap-2.5 bg-slate-950/70 p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-800">
                          {item.toPic ? (
                            <img
                              src={item.toPic}
                              alt={item.toName}
                              className="w-9 h-9 rounded-full object-cover border border-slate-700"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-slate-300">
                              {item.toName?.charAt(0) || "U"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="text-[10px] text-slate-400 block">
                              المستهدف بالبروفايل:
                            </span>
                            <span className="text-xs sm:text-sm font-black text-slate-100 truncate block">
                              {item.toName}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              ID: {item.toId}{" "}
                              {item.toGroup && `• (${item.toGroup})`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* الجانب الأيسر: التوقيت، شارة جديد، وحذف */}
                      <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto shrink-0 border-t md:border-t-0 border-slate-800 pt-2 md:pt-0">
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 text-xs font-black text-slate-300">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{relativeTime}</span>
                            {item.read === false && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 block font-mono mt-0.5">
                            {fullDate}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteReaction(item)}
                          disabled={deletingId === item.id}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer disabled:opacity-40"
                          title="حذف هذا التفاعل من السجل"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* شريط الباجنيشن */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800 text-xs text-slate-400">
                  <div>
                    عرض{" "}
                    <span className="font-bold text-slate-200">
                      {(currentPage - 1) * PAGE_SIZE + 1}
                    </span>{" "}
                    إلى{" "}
                    <span className="font-bold text-slate-200">
                      {Math.min(currentPage * PAGE_SIZE, filteredFeed.length)}
                    </span>{" "}
                    من إجمالي{" "}
                    <span className="font-bold text-slate-200">
                      {filteredFeed.length}
                    </span>{" "}
                    تفاعل
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-slate-300 px-2">
                      صفحة {currentPage} من {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : activeTab === "students" ? (
        /* ──── تبويب بطاقات الطلاب وتفاعلاتهم ──── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {studentReactionStats.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 text-slate-400">
              لا توجد بيانات طلاب مطابقة للبحث.
            </div>
          ) : (
            studentReactionStats.map((student) => (
              <div
                key={student.docId || student.id}
                className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-4 shadow-md"
              >
                {/* هيدر الطالب */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {student.profilePic ? (
                      <img
                        src={student.profilePic}
                        alt={student.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-700"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-black text-slate-300 border border-slate-700">
                        {student.name?.charAt(0) || "U"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-100 truncate">
                        {student.name}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-mono">
                        ID: {student.id}{" "}
                        {student.group && `• مجموعة ${student.group}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-black text-blue-400 bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 rounded-lg">
                      {student.detailedLikes.length} 👍
                    </span>
                    <span className="text-xs font-black text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-lg">
                      {student.detailedDislikes.length} 👎
                    </span>
                  </div>
                </div>

                {/* تفاصيل من أعجبوا به */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    أعجبوا به ({student.detailedLikes.length}):
                  </span>
                  <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                    {student.detailedLikes.length === 0 ? (
                      <span className="text-[11px] text-slate-500 block">
                        لا توجد إعجابات مسجلة بعد
                      </span>
                    ) : (
                      student.detailedLikes.map((entry, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px]"
                        >
                          <span className="font-bold text-slate-300 truncate">
                            {entry.likerName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {formatRelativeTime(entry.timestamp)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* تفاصيل من لم يعجبوا به */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/70">
                  <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                    <ThumbsDown className="w-3.5 h-3.5" />
                    لم يعجبوا به ({student.detailedDislikes.length}):
                  </span>
                  <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                    {student.detailedDislikes.length === 0 ? (
                      <span className="text-[11px] text-slate-500 block">
                        لا يوجد عدم إعجاب مسجل
                      </span>
                    ) : (
                      student.detailedDislikes.map((entry, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px]"
                        >
                          <span className="font-bold text-slate-300 truncate">
                            {entry.dislikerName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {formatRelativeTime(entry.timestamp)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* ──── تبويب سجل من شاهد التفاعلات ──── */
        <div className="bg-slate-900/80 rounded-3xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-400" />
              <span>
                الطلاب الذين استخدموا ميزة كشف المتفاعلين على بروفايلهم
              </span>
            </h3>
            <span className="text-xs text-slate-400">
              إجمالي {viewLogs.length} عملية كشف
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">الطالب المستعلم</th>
                  <th className="p-3">البروفايل المستهدف</th>
                  <th className="p-3">توقيت الاستعلام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {viewLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-8 text-center text-slate-500 font-bold"
                    >
                      لا توجد عمليات كشف مسجلة حتى الآن
                    </td>
                  </tr>
                ) : (
                  viewLogs.map((log, index) => (
                    <tr
                      key={log.id || index}
                      className="hover:bg-slate-800/40 transition"
                    >
                      <td className="p-3 text-slate-500">{index + 1}</td>
                      <td className="p-3 font-bold text-slate-200">
                        {log.studentName || "طالب"}
                      </td>
                      <td className="p-3 font-bold text-purple-300">
                        {log.targetName || "بروفايله الشخصي"}
                      </td>
                      <td className="p-3 text-slate-400 font-mono">
                        {formatFullDate(log.timestamp)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
