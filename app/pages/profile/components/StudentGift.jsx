import React, { useState, useEffect } from "react";
import { db } from "@/app/services/firebaseConfig";
import {
  doc,
  onSnapshot,
  increment,
  getDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { Gift, Check } from "lucide-react";

const StudentGift = ({ studentDocId }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [giftData, setGiftData] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [claimedType, setClaimedType] = useState(null); // 🟡 نوع الهدية المحفوظ

  useEffect(() => {
    if (!studentDocId) return;
    const studentRef = doc(db, "students", studentDocId);
    const unsubscribe = onSnapshot(studentRef, (doc) => {
      if (doc.exists()) {
        const studentData = doc.data();
        if (studentData.gift && studentData.gift.isOpened === false) {
          setGiftData(studentData.gift);
          setIsVisible(true);
        }
      }
    });
    return () => unsubscribe();
  }, [studentDocId]);

const handleClaimGift = async () => {
  if (!studentDocId || !giftData || !giftData.giftLogId || isProcessing) {
    if (!giftData.giftLogId) console.error("Gift Log ID is missing!");
    return;
  }

  setIsProcessing(true);

  try {
    const batch = writeBatch(db);
    const studentRef = doc(db, "students", studentDocId);
    const giftLogRef = doc(db, "gifts", giftData.giftLogId);

    // ✅ نحفظ نوع الهدية مؤقتًا هنا قبل أي تغيير
    const claimedType = giftData.type?.toLowerCase();

    const fieldToUpdate =
      claimedType === "points"
        ? "score"
        : claimedType === "reserveattendance"
        ? "reserveAttendance"
        : claimedType === "vip"
        ? "CardPoint"
        : "unknown";

    const amountToAdd = giftData.amount || 1;

    batch.update(studentRef, {
      "gift.isOpened": true,
      [fieldToUpdate]: increment(amountToAdd),
    });

    batch.update(giftLogRef, {
      isOpened: true,
      openedAt: serverTimestamp(),
    });

    await batch.commit();

    // ✅ الآن نستخدم claimedType الثابت اللي اتخزن قبل التحديث
    const updatedDoc = await getDoc(studentRef);
    if (updatedDoc.exists()) {
      const newTotal = updatedDoc.data()[fieldToUpdate] || amountToAdd;

      let message = "";
      switch (claimedType) {
        case "points":
          message = `أصبح رصيد نقاطك: ${newTotal}`;
          break;
        case "reserveattendance":
          message = `أصبح رصيد حضورك الاحتياطي: ${newTotal}`;
          break;
        case "vip":
          message = `أصبح بطاقات VIP لديك: ${newTotal}`;
          break;
        default:
          message = `تم تحديث رصيدك بنجاح (${newTotal})`;
      }

      setSuccessMessage(message);
    }

    setTimeout(() => {
      setIsVisible(false);
      setIsProcessing(false);
    }, 3500);
  } catch (error) {
    console.error("Error claiming gift: ", error);
    setIsProcessing(false);
  }
};

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4"
      dir="rtl"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center transform transition-all scale-100">
        {!isProcessing ? (
          <>
            <div className="animate-bounce mb-4">
              <Gift size={80} className="mx-auto text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              لديك مكافأة!
            </h2>
            <p className="text-gray-600 mb-6">{giftData?.message}</p>
            <button
              onClick={handleClaimGift}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-lg font-semibold text-lg hover:scale-105 transform transition-transform"
            >
              استلام المكافأة
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center relative">
              <Check
                size={60}
                className="text-green-500 animate-ping absolute opacity-75"
              />
              <Check size={60} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-green-600 mt-4">
              تم الاستلام بنجاح!
            </h2>
            {successMessage && (
              <p className="text-gray-800 mt-2 text-lg">{successMessage}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentGift;
