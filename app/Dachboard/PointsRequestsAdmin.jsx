"use client";
import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  serverTimestamp,
  getDoc,
  where,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  User,
  Filter,
  FileText,
  MessageSquare,
  AlertCircle,
} from "lucide-react";

const STATUS_TABS = [
  { key: "pending", label: "قيد الانتظار", icon: Clock, color: "text-amber-600" },
  { key: "approved", label: "مقبولة", icon: CheckCircle2, color: "text-emerald-600" },
  { key: "rejected", label: "مرفوضة", icon: XCircle, color: "text-red-600" },
  { key: "all", label: "الكل", icon: Filter, color: "text-indigo-600" },
];

const formatDate = (ts) => {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const STATUS_BADGE = {
  pending: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
  rejected: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
};

export default function PointsRequestsAdmin() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [processing, setProcessing] = useState("");
  const [adminNotes, setAdminNotes] = useState({});
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, "pointsRequests"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleApprove = async (req) => {
    if (processing) return;
    setProcessing(req.id);
    try {
      // 1. Find student doc in Firestore
      let studentFirestoreId = req.studentDocId;
      if (!studentFirestoreId) {
        const q = query(collection(db, "students"), where("id", "==", req.studentId));
        const snap = await getDocs(q);
        if (snap.empty) throw new Error("الطالب غير موجود في قاعدة البيانات");
        studentFirestoreId = snap.docs[0].id;
      }

      const adminNote = adminNotes[req.id] || "";

      // 2. Update request status
      await updateDoc(doc(db, "pointsRequests", req.id), {
        status: "approved",
        reviewedAt: serverTimestamp(),
        adminNote,
      });

      // 3. Add points to student
      const studentRef = doc(db, "students", studentFirestoreId);
      await updateDoc(studentRef, {
        score: increment(req.requestedPoints),
      });

      // 4. Send notification to student
      await addDoc(collection(db, "notifications"), {
        studentId: req.studentId,
        type: "pointsRequestApproved",
        message: `🎉 تمت الموافقة على طلبك! تم إضافة ${req.requestedPoints} نقطة إلى رصيدك. ${adminNote ? `ملاحظة الأدمن: ${adminNote}` : ""}`,
        requestedPoints: req.requestedPoints,
        read: false,
        createdAt: serverTimestamp(),
      });

      showMessage(`✅ تمت الموافقة وإضافة ${req.requestedPoints} نقطة للطالب ${req.studentName}`);
      setAdminNotes((prev) => ({ ...prev, [req.id]: "" }));
    } catch (err) {
      console.error(err);
      showMessage("❌ " + (err.message || "حدث خطأ أثناء الموافقة"), "error");
    } finally {
      setProcessing("");
    }
  };

  const handleReject = async (req) => {
    if (processing) return;
    const adminNote = adminNotes[req.id] || "";
    setProcessing(req.id);
    try {
      await updateDoc(doc(db, "pointsRequests", req.id), {
        status: "rejected",
        reviewedAt: serverTimestamp(),
        adminNote,
      });

      // Send rejection notification
      await addDoc(collection(db, "notifications"), {
        studentId: req.studentId,
        type: "pointsRequestRejected",
        message: `❌ تم رفض طلبك لإضافة ${req.requestedPoints} نقطة. ${adminNote ? `السبب: ${adminNote}` : ""}`,
        requestedPoints: req.requestedPoints,
        read: false,
        createdAt: serverTimestamp(),
      });

      showMessage(`تم رفض طلب الطالب ${req.studentName}`, "error");
      setAdminNotes((prev) => ({ ...prev, [req.id]: "" }));
    } catch (err) {
      console.error(err);
      showMessage("❌ حدث خطأ أثناء الرفض", "error");
    } finally {
      setProcessing("");
    }
  };

  const filteredRequests =
    activeTab === "all"
      ? requests
      : requests.filter((r) => r.status === activeTab);

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-linear-to-br from-yellow-400 to-orange-500 shadow-lg mb-3">
            <Coins className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            طلبات النقاط
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            راجع وافق أو ارفض طلبات النقاط المقدمة من الطلاب
          </p>
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 bg-amber-500 text-white text-sm font-bold rounded-full">
              <Clock className="w-4 h-4" />
              {pendingCount} طلب معلق
            </span>
          )}
        </div>

        {/* Feedback message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex items-center gap-3 p-4 rounded-2xl border ${
                message.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 text-emerald-700 dark:text-emerald-300"
                  : "bg-red-50 dark:bg-red-900/20 border-red-300 text-red-700 dark:text-red-300"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <span className="font-medium">{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 justify-center">
          {STATUS_TABS.map((tab) => {
            const Icon = tab.icon;
            const count =
              tab.key === "all"
                ? requests.length
                : requests.filter((r) => r.status === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border-2 ${
                  activeTab === tab.key
                    ? "bg-linear-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-md"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-indigo-300"
                }`}
              >
                <Icon className={`w-4 h-4 ${activeTab === tab.key ? "text-white" : tab.color}`} />
                {tab.label}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.key
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Requests list */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-yellow-500" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
            <Coins className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">لا توجد طلبات في هذا القسم</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Card header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {req.studentName?.[0] || "?"}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 dark:text-white">
                        {req.studentName}
                      </p>
                      <div className="flex flex-col gap-0.5 mt-1">
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          ID: {req.studentId}
                        </p>
                        <p className="text-xs text-indigo-400 dark:text-indigo-300 flex items-center gap-1">
                          <span className="font-semibold text-gray-500 dark:text-gray-400">المجموعة:</span>
                          {req.studentGroup || "غير محدد"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="text-2xl font-extrabold text-yellow-500">
                      +{req.requestedPoints}
                    </span>
                    <p className="text-xs text-gray-400 text-center">نقطة</p>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4 space-y-3">
                  {/* Status badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                        STATUS_BADGE[req.status] || STATUS_BADGE.pending
                      }`}
                    >
                      {req.status === "pending" && <Clock className="w-3.5 h-3.5" />}
                      {req.status === "approved" && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {req.status === "rejected" && <XCircle className="w-3.5 h-3.5" />}
                      {req.status === "pending"
                        ? "قيد الانتظار"
                        : req.status === "approved"
                        ? "مقبول"
                        : "مرفوض"}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(req.createdAt)}</span>
                  </div>

                  {/* Reason */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      سبب الطلب:
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                      {req.reason}
                    </p>
                  </div>

                  {/* Admin note (existing) */}
                  {req.adminNote && req.status !== "pending" && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3">
                      <p className="text-xs font-semibold text-indigo-500 mb-1 flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        ملاحظة الأدمن:
                      </p>
                      <p className="text-sm text-indigo-700 dark:text-indigo-300">{req.adminNote}</p>
                    </div>
                  )}

                  {/* Admin note input + action buttons (only for pending) */}
                  {req.status === "pending" && (
                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                          ملاحظة للطالب (اختياري)
                        </label>
                        <input
                          type="text"
                          value={adminNotes[req.id] || ""}
                          onChange={(e) =>
                            setAdminNotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                          }
                          placeholder="اكتب ملاحظة للطالب..."
                          className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApprove(req)}
                          disabled={!!processing}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-linear-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-xl shadow disabled:opacity-60 transition-all"
                        >
                          {processing === req.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          موافقة وإضافة النقاط
                        </button>
                        <button
                          onClick={() => handleReject(req)}
                          disabled={!!processing}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-linear-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold rounded-xl shadow disabled:opacity-60 transition-all"
                        >
                          {processing === req.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          رفض
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Review date for non-pending */}
                  {req.status !== "pending" && req.reviewedAt && (
                    <p className="text-xs text-gray-400 text-left">
                      تمت المراجعة: {formatDate(req.reviewedAt)}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
