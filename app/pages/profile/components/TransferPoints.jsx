'use client';

import React, { useState, useEffect, useMemo } from "react";
import { onSnapshot } from "firebase/firestore";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Search, Users, ArrowRightLeft, Loader2 } from "lucide-react";
import NotificationsSt from "@/app/components/Notifications/NotificationsSt";
import {
  getStudentByIdQuery,
  fetchUniqueGroups,
  fetchGroupStudents,
  transferPoints,
} from "@/app/services/fetch"; 

const TransferPoints = ({ studentId }) => {
  const [recipientId, setRecipientId] = useState("");
  const [points, setPoints] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // success | error
  const [studentScore, setStudentScore] = useState(0);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("الكل");
  const [groupStudents, setGroupStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // رصيد الطالب لحظيًا
  useEffect(() => {
    if (!studentId) return;

    const q = getStudentByIdQuery(studentId);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setStudentScore(snapshot.docs[0].data().score || 0);
      } else {
        setStudentScore(0);
      }
    });

    return () => unsubscribe();
  }, [studentId]);

  // جلب المجموعات مرة واحدة
  useEffect(() => {
    fetchUniqueGroups()
      .then(setGroups)
      .catch((err) => console.error("خطأ في جلب المجموعات:", err));
  }, []);

  // جلب طلاب المجموعة
  useEffect(() => {
    if (!selectedGroup) {
      setGroupStudents([]);
      return;
    }

    setLoadingStudents(true);
    fetchGroupStudents(selectedGroup, studentId)
      .then(setGroupStudents)
      .catch((err) => console.error("خطأ في جلب الطلاب:", err))
      .finally(() => setLoadingStudents(false));
  }, [selectedGroup, studentId]);

  // فلترة البحث
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return groupStudents.filter((s) =>
      s.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [groupStudents, searchTerm]);

  const showMessage = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3500);
  };

  const handleTransfer = async () => {
    if (!recipientId || !points) {
      showMessage("الرجاء اختيار الطالب وإدخال عدد النقاط");
      return;
    }

    if (Number(studentId) === Number(recipientId)) {
      showMessage("لا يمكنك تحويل النقاط إلى نفسك");
      return;
    }

    const pointsToTransfer = Number(points);
    if (pointsToTransfer <= 0) {
      showMessage("يجب أن يكون عدد النقاط أكبر من الصفر");
      return;
    }

    const result = await Swal.fire({
      title: "تأكيد التحويل",
      text: `هل أنت متأكد من تحويل ${pointsToTransfer} نقطة؟`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "نعم، قم بالتحويل",
      cancelButtonText: "إلغاء",
      background: "rgba(15, 23, 42, 0.97)",
      color: "#fff",
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#64748b",
    });

    if (!result.isConfirmed) return;

    try {
      setIsTransferring(true);

      const newScore = await transferPoints({
        senderId: studentId,
        recipientId,
        pointsToTransfer,
      });

      setStudentScore(newScore);
      setRecipientId("");
      setPoints("");
      setSearchTerm("");
      showMessage(`تم تحويل ${pointsToTransfer} نقطة بنجاح`, "success");
    } catch (error) {
      console.error("خطأ أثناء التحويل:", error);
      showMessage(error.message || "حدث خطأ أثناء التحويل");
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto" dir="rtl">
      <div className="bg-slate-900 border border-slate-700/70 rounded-2xl overflow-hidden shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-l from-blue-600 to-indigo-600 px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">تحويل النقاط</h2>
            <p className="text-blue-100 text-xs">أرسل نقاط لزملائك</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Notifications */}
          <NotificationsSt studentId={studentId} />

          {/* Balance */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-slate-400 text-sm">رصيدك الحالي</span>
            <span className="text-xl font-bold text-blue-400 tabular-nums">
              {studentScore} <span className="text-sm font-medium text-slate-400">نقطة</span>
            </span>
          </div>

          {/* Group Select */}
          <div>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
              <Users className="w-3.5 h-3.5" />
              المجموعة
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setRecipientId("");
                setSearchTerm("");
              }}
              className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="الكل">كل المجموعات</option>
              {groups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>

          {/* Search Student */}
          <div className="relative">
            <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
              <Search className="w-3.5 h-3.5" />
              ابحث عن الطالب
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (!e.target.value) setRecipientId("");
              }}
              placeholder="اكتب اسم الطالب..."
              className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-500"
            />

            {/* Search Results */}
            <AnimatePresence>
              {searchTerm && (
                <motion.ul
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute z-20 mt-1 w-full border border-slate-700 rounded-xl bg-slate-800 max-h-44 overflow-y-auto shadow-xl"
                >
                  {loadingStudents ? (
                    <li className="p-3 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري التحميل...
                    </li>
                  ) : filteredStudents.length > 0 ? (
                    filteredStudents.map((s) => (
                      <li
                        key={s.id}
                        onClick={() => {
                          setRecipientId(s.id);
                          setSearchTerm(s.name);
                        }}
                        className={`px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                          Number(recipientId) === Number(s.id)
                            ? "bg-blue-600/30 text-blue-300"
                            : "text-slate-300 hover:bg-slate-700/70"
                        }`}
                      >
                        <span className="font-medium">{s.name}</span>
                        <span className="text-slate-500 text-xs mr-2">— {s.group}</span>
                      </li>
                    ))
                  ) : (
                    <li className="p-3 text-center text-slate-500 text-sm">
                      لا يوجد طلاب بهذا الاسم
                    </li>
                  )}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* Points Input */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">عدد النقاط</label>
            <input
              type="number"
              min="1"
              placeholder="مثال: 10"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-500"
            />
          </div>

          {/* Transfer Button */}
          <button
            onClick={handleTransfer}
            disabled={isTransferring}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/20 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
          >
            {isTransferring ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري التحويل...
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-4 h-4" />
                تحويل النقاط
              </>
            )}
          </button>

          {/* Message */}
          <AnimatePresence>
            {message && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`text-center text-sm font-medium py-2 rounded-lg ${
                  messageType === "success"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-red-500/15 text-red-400"
                }`}
              >
                {message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TransferPoints);