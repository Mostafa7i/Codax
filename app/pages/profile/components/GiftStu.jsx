import React, { useState, useEffect } from "react";
import { db } from "@/app/services/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import {
  Gift,
  Loader,
  Star,
  CalendarPlus,
  Users,
  CreditCard,
} from "lucide-react";

const GiftStu = ({ studentId, studentGroupId, studentGroup }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const effectiveGroupId = studentGroupId || studentGroup;

  useEffect(() => {
    const numericStudentId = Number(studentId);
    if (!numericStudentId) {
      console.error("[GiftStu] Invalid or missing studentId. Aborting fetch.");
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const giftsRef = collection(db, "gifts");

        // 🟢 الاستعلام الأول: المكافآت الخاصة بالطالب
        const studentQuery = query(
          giftsRef,
          where("targetType", "==", "student"),
          where("targetValue.id", "==", numericStudentId),
          where("isOpened", "==", true),
        );

        // 🟢 الاستعلام الثاني: المكافآت الخاصة بالجروب (لو موجود)
        let groupQuerySnapshot = { docs: [] };
        if (effectiveGroupId) {
          const groupQuery = query(
            giftsRef,
            where("targetType", "==", "group"),
            where("targetValue", "==", effectiveGroupId),
            where("isOpened", "==", true),
          );
          groupQuerySnapshot = await getDocs(groupQuery);
        }

        // 📦 تنفيذ الاستعلام الأول
        const studentSnapshot = await getDocs(studentQuery);

        // 🧩 دمج النتائج
        const fetchedGifts = [
          ...studentSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            source: "student",
          })),
          ...groupQuerySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            source: "group",
          })),
        ];

        // 🔽 ترتيبهم حسب وقت الفتح
        fetchedGifts.sort(
          (a, b) => (b.openedAt?.toDate() || 0) - (a.openedAt?.toDate() || 0),
        );

        setHistory(fetchedGifts);
      } catch (err) {
        console.error("[GiftStu] Error fetching gift history:", err);
        setError("حدث خطأ أثناء جلب سجل المكافآت.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [studentId, effectiveGroupId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader className="animate-spin text-purple-500" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 p-8">{error}</div>;
  }

  return (
    <div
      className="p-4 bg-slate-900 border border-slate-800 rounded-2xl"
      dir="rtl"
    >
      <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center">
        <Gift className="ml-2 text-purple-500" />
        سجل المكافآت المستلمة ({history.length})
      </h3>

      {history.length > 0 ? (
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-slate-800/80 p-4 rounded-xl shadow-sm border border-slate-700/80"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-200 text-sm whitespace-pre-line">
                    {item.message}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    🎯 النوع:{" "}
                    {item.source === "group" ? "مكافأة جماعية" : "مكافأة فردية"}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm font-semibold shrink-0 mr-2">
                  {item.type === "attendance" ? (
                    <CalendarPlus size={16} className="text-blue-400" />
                  ) : item.type === "points" ? (
                    <Star size={16} className="text-yellow-400" />
                  ) : item.type === "green_card" ||
                    item.type === "greencard" ? (
                    <CreditCard size={16} className="text-emerald-400" />
                  ) : item.type === "blue_card" || item.type === "bluecard" ? (
                    <CreditCard size={16} className="text-sky-400" />
                  ) : (
                    <Users size={16} className="text-purple-400" />
                  )}
                  <span className="text-slate-100">+{item.amount}</span>
                </div>
              </div>

              <div className="text-left text-xs text-slate-500 mt-2">
                {item.openedAt?.toDate().toLocaleString("ar-EG", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500">
          <p>لا توجد مكافآت مستلمة في سجلك حتى الآن.</p>
        </div>
      )}
    </div>
  );
};

export default GiftStu;
