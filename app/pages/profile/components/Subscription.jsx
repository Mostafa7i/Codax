"use client";
import React, { useState } from "react";
import {
  DollarSign,
  CheckCircle,
  AlertCircle,
  Check,
  Send,
  CreditCard,
  Clock,
  X,
  ChevronLeft,
  Sparkles,
  Wallet,
} from "lucide-react";
import Swal from "sweetalert2";
import { db } from "@/app/services/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  Timestamp,
  arrayUnion,
} from "firebase/firestore";

export default function SubDetails({ studentData, studentId }) {
  const [openSub, setOpenSub] = useState(false);
  const [openModelUpdateData, setOpenModelUpdateData] = useState(false);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPrice = Number(studentData?.totalPrice) || 0;
  const paidAmount = Number(studentData?.paidAmount) || 0;
  const remainingAmount = Number(studentData?.remainingAmount) || 0;
  const isPaidFull = remainingAmount <= 0;
  const paidPercentage =
    totalPrice > 0
      ? Math.min(Math.round((paidAmount / totalPrice) * 100), 100)
      : 100;

  const handleRequest = async () => {
    if (!content.trim()) {
      Swal.fire({
        icon: "warning",
        title: "تنبيه",
        text: "يرجى كتابة تفاصيل ما تود تحديثه أو الاستفسار عنه أولاً.",
        confirmButtonText: "حسناً",
        background: "#0f172a",
        color: "#f8fafc",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const q = query(
        collection(db, "students"),
        where("id", "==", Number(studentId)),
      );
      const snap = await getDocs(q);
      if (snap.empty) throw new Error("الطالب غير موجود");

      const studentRef = snap.docs[0].ref;
      const now = Timestamp.now();
      const entry = {
        content: content.trim(),
        readMsg: false,
        uploadedAt: now,
      };

      await updateDoc(studentRef, {
        studentContent: content.trim(),
        contentReq: arrayUnion(entry),
        lastUpdated: now,
      });

      setContent("");
      setOpenModelUpdateData(false);
      Swal.fire({
        icon: "success",
        title: "تم الإرسال!",
        text: "تم إرسال طلب تحديث البيانات للإدارة بنجاح.",
        timer: 3500,
        showConfirmButton: false,
        background: "#0f172a",
        color: "#f8fafc",
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "فشل الإرسال",
        text: "حدث خطأ أثناء إرسال الطلب. يرجى المحاولة لاحقاً.",
        background: "#0f172a",
        color: "#f8fafc",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-3.5">
      {/* Financial Snapshot Grid */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-2.5">
          <p className="text-[11px] text-slate-400 font-medium mb-0.5">
            الإجمالي
          </p>
          <p className="text-sm sm:text-base font-black text-slate-100">
            {totalPrice}{" "}
            <span className="text-[10px] font-normal text-slate-400">ج.م</span>
          </p>
        </div>

        <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-2xl p-2.5">
          <p className="text-[11px] text-emerald-400 font-medium mb-0.5">
            المدفوع
          </p>
          <p className="text-sm sm:text-base font-black text-emerald-300">
            {paidAmount}{" "}
            <span className="text-[10px] font-normal text-emerald-400/70">
              ج.م
            </span>
          </p>
        </div>

        <div
          className={`rounded-2xl p-2.5 border ${
            !isPaidFull
              ? "bg-rose-950/30 border-rose-800/40"
              : "bg-slate-800/60 border-slate-700/50"
          }`}
        >
          <p
            className={`text-[11px] font-medium mb-0.5 ${
              !isPaidFull ? "text-rose-400" : "text-slate-400"
            }`}
          >
            المتبقي
          </p>
          <p
            className={`text-sm sm:text-base font-black ${
              !isPaidFull ? "text-rose-300" : "text-slate-100"
            }`}
          >
            {remainingAmount}{" "}
            <span
              className={`text-[10px] font-normal ${
                !isPaidFull ? "text-rose-400/70" : "text-slate-400"
              }`}
            >
              ج.م
            </span>
          </p>
        </div>
      </div>

      {/* Payment Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">نسبة السداد</span>
          <span
            className={`font-black ${
              isPaidFull ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {paidPercentage}%
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700/50">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              isPaidFull
                ? "bg-linear-to-r from-emerald-500 to-teal-400"
                : "bg-linear-to-r from-amber-500 to-orange-400"
            }`}
            style={{ width: `${paidPercentage}%` }}
          />
        </div>
      </div>

      {/* Button to Open Full Details Modal */}
      <button
        type="button"
        onClick={() => setOpenSub(true)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 text-xs font-bold transition-all shadow-sm active:scale-98 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <CreditCard size={15} className="text-indigo-400" />
          <span>تفاصيل الاشتراك وسجل الدفع</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-indigo-400">
          <span>عرض كامل</span>
          <ChevronLeft size={14} />
        </div>
      </button>

      {/* Full Details Modal */}
      {openSub && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setOpenSub(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/15 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-indigo-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    تفاصيل الاشتراك والسداد
                  </h3>
                  <p className="text-xs text-slate-400">
                    بيانات خطتك المالية والمدفوعات
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black ${
                    isPaidFull
                      ? "bg-emerald-950/60 text-emerald-300 border border-emerald-700/50"
                      : "bg-rose-950/60 text-rose-300 border border-rose-700/50"
                  }`}
                >
                  {isPaidFull ? "سداد كامل ✓" : "مستحق دفع ⚠️"}
                </span>
                <button
                  type="button"
                  onClick={() => setOpenSub(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Subscription Type & Update Request */}
              <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Wallet className="w-4 h-4 text-indigo-400" />
                    <span>نوع الاشتراك:</span>
                    <span className="font-bold text-slate-100 text-sm">
                      {studentData?.subscriptionType || "اشتراك عادي"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOpenModelUpdateData(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition cursor-pointer"
                >
                  <Send size={14} />
                  <span>طلب تحديث أو مراجعة البيانات المالية</span>
                </button>
              </div>

              {/* Price Details */}
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3.5 bg-slate-800/40 border border-slate-800 rounded-2xl">
                  <span className="text-xs text-slate-400">
                    إجمالي رسوم الدورة
                  </span>
                  <span className="text-sm font-black text-slate-100">
                    {totalPrice} جنيه
                  </span>
                </div>

                <div className="flex justify-between items-center p-3.5 bg-emerald-950/20 border border-emerald-800/30 rounded-2xl">
                  <span className="text-xs text-emerald-400">
                    المبلغ المسدد
                  </span>
                  <span className="text-sm font-black text-emerald-300">
                    {paidAmount} جنيه
                  </span>
                </div>

                <div
                  className={`flex justify-between items-center p-3.5 rounded-2xl border ${
                    !isPaidFull
                      ? "bg-rose-950/20 border-rose-800/30"
                      : "bg-slate-800/40 border-slate-800"
                  }`}
                >
                  <span
                    className={`text-xs ${
                      !isPaidFull ? "text-rose-400" : "text-slate-400"
                    }`}
                  >
                    المبلغ المتبقي
                  </span>
                  <span
                    className={`text-sm font-black ${
                      !isPaidFull ? "text-rose-300" : "text-slate-300"
                    }`}
                  >
                    {remainingAmount} جنيه
                  </span>
                </div>
              </div>

              {/* Overdue Alert */}
              {!isPaidFull && (
                <div className="p-3.5 bg-rose-950/30 border border-rose-800/40 rounded-2xl flex items-start gap-3">
                  <Clock className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-rose-300 text-xs">
                      تنبيه بمستحقات مالية
                    </p>
                    <p className="text-[11px] text-rose-300/80 mt-0.5 leading-relaxed">
                      يرجى تسوية المبلغ المتبقي ({remainingAmount} ج.م) مع إدارة
                      المنصة لضمان استمرار كافة الخدمات والشهادات.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Nested Modal: Update Request */}
      {openModelUpdateData && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-60 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setOpenModelUpdateData(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 max-w-md w-full p-6 rounded-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Send size={16} className="text-indigo-400" />
                <span>طلب تعديل أو تحديث البيانات</span>
              </h4>
              <button
                type="button"
                onClick={() => setOpenModelUpdateData(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              اكتب استفسارك أو طلبك للإدارة بخصوص الرسوم أو طريقة السداد وسيتم
              مراجعتها فوراً:
            </p>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="اكتب تفاصيل طلبك هنا..."
              rows={4}
              className="w-full bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition resize-none mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpenModelUpdateData(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleRequest}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-slate-100 text-xs font-bold transition shadow-md shadow-indigo-500/25 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري الإرسال...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>إرسال الطلب</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
