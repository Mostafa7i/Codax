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


  const handleRequest = async () => {
    if (content == "") return Swal.fire("خطأ", "اكتب شيئً..");

    setIsSubmitting(true);
    try {
      const q = query(collection(db, "students"), where("id", "==", Number(studentId)));
      const snap = await getDocs(q);
      if (snap.empty) throw new Error("الطالب غير موجود");

      const studentRef = snap.docs[0].ref;
      const now = Timestamp.now();
      const entry = {
        content: content,
        readMsg : false,
        uploadedAt: now,
      };

      await updateDoc(studentRef, {
        studentContent: content,
        contentReq: arrayUnion(entry),
        lastUpdated: now,
      });

      setContent("");
      Swal.fire({
        icon: "success",
        title: "تم بنجاح!",
        text: "تم ارسال الطلب بنجاح!",
        timer: 4000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire("فشل", "حدث خطأ أثناء الرفع", "error");
      console.error(err)
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div>
      <button
        onClick={() => setOpenSub(true)}
        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 w-full text-white p-2 rounded-lg gap-2 shadow-2xl transition hover:scale-105 flex items-center justify-center"
        title="تفاصيل الاشتراك"
      >
        <CreditCard className="w-5 h-5" /> الاشتراك
        <span
          className={`px-2 py-1.5 rounded text-sm font-bold ${
            (studentData?.remainingAmount || 0) > 0
              ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
              : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
          }`}
        >
          {(studentData?.remainingAmount || 0) > 0 ? " مستحق" : "سداد كامل"}
        </span>
      </button>

      {/* البوب أب */}
      {openSub && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setOpenSub(false)} // إغلاق بالضغط خارج الصندوق
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()} // منع الإغلاق لما تضغط جوا الصندوق
          >
            {/* الهيدر */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                  <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  تفاصيل الاشتراك
                </h3>
              </div>

              <div className="flex items-center gap-3">
                {/* حالة الدفع */}
                <span
                  className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                    (studentData?.remainingAmount || 0) > 0
                      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                      : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                  }`}
                >
                  {(studentData?.remainingAmount || 0) > 0
                    ? " مستحق"
                    : "سداد كامل"}
                </span>

                {/* زر الإغلاق */}
                <button
                  onClick={() => setOpenSub(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  <X className="w-6 h-6 text-gray-500 hover:text-red-600" />
                </button>
              </div>
            </div>

            {/* المحتوى */}
            <div className="p-6 space-y-5">
              {/* نوع الاشتراك */}
              <div className="flex justify-between flex-wrap items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  <span className="text-gray-600 dark:text-gray-400">
                    نوع الاشتراك
                  </span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {studentData?.subscriptionType || "غير محدد"}
                  </span>
                </div>
                <button
                  className="bg-blue-500 p-1 flex w-full justify-center mt-1 sm:w-fit items-center gap-2 rounded-md text-xs text-white"
                  onClick={() => setOpenModelUpdateData(true)}
                >
                  طلب تحديث البيانات <Send size={20} />{" "}
                </button>

                {openModelUpdateData && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white max-w-96 p-4 rounded-md shadow-lg">
                      {/* header */}
                      <div className="my-2">
                        <p className="text-sm text-center">
                          ارسال طلب بتحديث البيانات او تعديلها.
                        </p>
                      </div>
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="اكتب هنا ما الذي تود تحديثه؟"
                        className="w-full border p-3"
                      ></textarea>
                      <div className="flex justify-between items-center p-2">
                        <button
                          onClick={handleRequest}
                          disabled={isSubmitting}
                          className="border border-green-500 w-7 h-7 rounded-full"
                        >
                          {isSubmitting ? (
                            <>جاري الارسال...</>
                          ) : (
                            <>
                              <Check />
                            </>
                          )}
                        </button>
                        <button
                          className="text-red-500 font-bold border border-red-500 w-7 h-7 rounded-full"
                          onClick={() => setOpenModelUpdateData(false)}
                        >
                          X
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* إجمالي السعر */}
              <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-600 dark:text-gray-400">
                    إجمالي السعر
                  </span>
                </div>
                <span className="text-xl font-bold text-blue-700 dark:text-blue-300">
                  {studentData?.totalPrice || "0"} جنيه
                </span>
              </div>

              {/* المدفوع */}
              <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-gray-600 dark:text-gray-400">
                    المدفوع
                  </span>
                </div>
                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                  {studentData?.paidAmount || "0"} جنيه
                </span>
              </div>

              {/* المتبقي */}
              <div
                className={`flex justify-between items-center p-4 rounded-xl ${
                  (studentData?.remainingAmount || 0) > 0
                    ? "bg-red-50 dark:bg-red-900/20"
                    : "bg-green-50 dark:bg-green-900/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  {(studentData?.remainingAmount || 0) > 0 ? (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  <span className="text-gray-600 dark:text-gray-400">
                    المتبقي
                  </span>
                </div>
                <span
                  className={`text-xl font-bold ${
                    (studentData?.remainingAmount || 0) > 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-green-600 dark:text-green-400"
                  }`}
                >
                  {studentData?.remainingAmount || 0} جنيه
                </span>
              </div>

              {/* شريط التقدم */}
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    نسبة السداد
                  </span>
                  <span className="font-bold">
                    {studentData?.totalPrice > 0
                      ? Math.round(
                          ((studentData.paidAmount || 0) /
                            studentData.totalPrice) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${Math.min(
                        studentData?.totalPrice > 0
                          ? ((studentData.paidAmount || 0) /
                              studentData.totalPrice) *
                              100
                          : 0,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* رسالة تحذير إذا فيه مستحق */}
              {(studentData?.remainingAmount || 0) > 0 && (
                <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/30 border-r-4 border-orange-500 rounded-lg flex gap-3">
                  <Clock className="w-6 h-6 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-orange-800 dark:text-orange-200">
                      يرجى إكمال السداد قريبًا
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                      تواصل مع الإدارة لتسوية المبلغ المتبقي:{" "}
                      {studentData?.remainingAmount} جنيه
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
