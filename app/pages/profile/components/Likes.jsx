"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/app/services/firebaseConfig";
import {
  collection,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { Trash2, Heart, ThumbsDown, Clock, Sparkles } from "lucide-react";
import { useStudentActions } from "@/app/hooks/useStudentActions";

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

const Likes = ({ studentIdV }) => {
  const [myReactions, setMyReactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const { handleLike, handleDislike } = useStudentActions(studentIdV);

  // جلب التفاعلات وتنظيم البيانات
  useEffect(() => {
    if (!studentIdV) return;

    const myId = Number(studentIdV);
    const q = collection(db, "students");

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reactions = [];

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();

        // تجميع الإعجابات
        (data.likedBy || []).forEach((entry) => {
          if (entry.likerId === myId) {
            reactions.push({
              targetId: docSnap.id,
              targetName: data.name || "طالب مجهول",
              type: "like",
              timestamp: entry.timestamp || Date.now(),
            });
          }
        });

        // تجميع عدم الإعجابات
        (data.dislikedBy || []).forEach((entry) => {
          if (entry.dislikerId === myId) {
            reactions.push({
              targetId: docSnap.id,
              targetName: data.name || "طالب مجهول",
              type: "dislike",
              timestamp: entry.timestamp || Date.now(),
            });
          }
        });
      });

      // ترتيب التفاعلات من الأحدث للأقدم
      reactions.sort((a, b) => b.timestamp - a.timestamp);
      setMyReactions(reactions);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [studentIdV]);

  // إلغاء التفاعل وإزالته من السجل
  const handleCancelReaction = async (targetDocId, type, timestamp) => {
    try {
      const targetRef = doc(db, "students", targetDocId);

      const reactionField = type === "like" ? "likedBy" : "dislikedBy";
      const countField = type === "like" ? "likesCount" : "dislikesCount";
      const idKey = type === "like" ? "likerId" : "dislikerId";
      const collectionName =
        type === "like" ? "likesStudents" : "dislikesStudents";

      const myId = Number(studentIdV);

      // تحديث وثيقة الطالب المستهدف
      const targetDocSnap = await getDocs(
        query(collection(db, "students"), where("__name__", "==", targetDocId)),
      );
      if (targetDocSnap.empty) return;

      const targetData = targetDocSnap.docs[0].data();

      const updatedReactions = (targetData[reactionField] || []).filter(
        (r) => !(r[idKey] === myId && r.timestamp === timestamp),
      );

      const updatedCount = Math.max((targetData[countField] || 1) - 1, 0);

      await updateDoc(targetRef, {
        [reactionField]: updatedReactions,
        [countField]: updatedCount,
      });

      // حذف السجل من مجموعة الإشعارات
      const qRecord = query(
        collection(db, collectionName),
        where(idKey, "==", myId),
        where("timestamp", "==", timestamp),
      );
      const recordSnap = await getDocs(qRecord);
      recordSnap.forEach(async (d) => {
        await deleteDoc(d.ref);
      });
    } catch (error) {
      console.error("Error deleting reaction:", error);
    }
  };

  // تنسيق تاريخ التفاعل
  const formatDate = (timestamp) => {
    if (!timestamp) return "منذ فترة";
    const date = new Date(timestamp);
    const now = Date.now();
    const diffHours = (now - timestamp) / (1000 * 60 * 60);

    if (diffHours < 1) {
      const diffMins = Math.max(1, Math.round((now - timestamp) / (1000 * 60)));
      return `منذ ${diffMins} دقيقة`;
    }
    if (diffHours < 24) {
      return `منذ ${Math.round(diffHours)} ساعة`;
    }

    return date.toLocaleDateString("ar-EG", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-4 sm:p-5 border border-slate-800/80 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Clock size={16} />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">سجل التفاعلات</h3>
            <p className="text-[11px] text-slate-400">
              يمكنك التفاعل مع نفس الطالب مرة كل 24 ساعة
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
          {myReactions.length} تفاعل
        </span>
      </div>

      {/* Content Feed */}
      {loading ? (
        <div className="py-8 text-center text-slate-400 text-xs animate-pulse flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>جاري تحميل السجل...</span>
        </div>
      ) : myReactions.length === 0 ? (
        <div className="py-7 text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-500">
            <Sparkles size={18} />
          </div>
          <p className="text-slate-400 text-xs font-medium">
            لا توجد تفاعلات مسجلة لديك حتى الآن
          </p>
          <p className="text-slate-500 text-[10px] mt-0.5">
            تفاعل مع زملائك في قائمة الأوائل بالإعجاب أو الدعم!
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
          {myReactions.map((item, index) => {
            const isLike = item.type === "like";
            return (
              <div
                key={index}
                className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all duration-200 hover:translate-x-0.5 ${
                  isLike
                    ? "bg-linear-to-r from-sky-950/30 to-blue-950/20 border-sky-500/20 hover:border-sky-500/40"
                    : "bg-linear-to-r from-rose-950/30 to-red-950/20 border-rose-500/20 hover:border-rose-500/40"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isLike
                        ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                        : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {isLike ? (
                      <Heart size={15} fill="currentColor" />
                    ) : (
                      <ThumbsDown size={15} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      <span className="text-slate-400 text-[11px] font-normal">
                        {isLike ? "أعجبك بروفايل: " : "لم يعجبك بروفايل: "}
                      </span>
                      <span className="text-slate-100 font-bold">
                        {item.targetName}
                      </span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formatDate(item.timestamp)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleCancelReaction(
                      item.targetId,
                      item.type,
                      item.timestamp,
                    )
                  }
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all shrink-0 cursor-pointer"
                  title="إلغاء التفاعل"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default React.memo(Likes);
