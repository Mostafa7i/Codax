"use client";

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

  useEffect(() => {
    if (!studentDocId) return;
    const studentRef = doc(db, "students", studentDocId);
    const unsubscribe = onSnapshot(studentRef, (docSnap) => {
      if (docSnap.exists()) {
        const studentData = docSnap.data();
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
      if (!giftData?.giftLogId) console.error("Gift Log ID is missing!");
      return;
    }

    setIsProcessing(true);

    try {
      const batch = writeBatch(db);
      const studentRef = doc(db, "students", studentDocId);
      const giftLogRef = doc(db, "gifts", giftData.giftLogId);

      const claimedType = giftData.type?.toLowerCase();

      const fieldToUpdate =
        claimedType === "points"
          ? "score"
          : claimedType === "attendance" || claimedType === "reserveattendance"
            ? "reserveAttendance"
            : claimedType === "vip"
              ? "CardPoint"
              : claimedType === "green_card" || claimedType === "greencard"
                ? "greenCards"
                : claimedType === "blue_card" || claimedType === "bluecard"
                  ? "blueCards"
                  : "unknown";

      const amountToAdd = Number(giftData.amount) || 1;

      const updateData = {
        "gift.isOpened": true,
      };
      if (fieldToUpdate !== "unknown") {
        updateData[fieldToUpdate] = increment(amountToAdd);
      }

      batch.update(studentRef, updateData);

      batch.update(giftLogRef, {
        isOpened: true,
        openedAt: serverTimestamp(),
      });

      await batch.commit();

      const updatedDoc = await getDoc(studentRef);
      if (updatedDoc.exists()) {
        const newTotal = updatedDoc.data()[fieldToUpdate] ?? amountToAdd;

        let message = "";
        switch (claimedType) {
          case "points":
            message = `أصبح رصيد نقاطك: ${newTotal}`;
            break;
          case "attendance":
          case "reserveattendance":
            message = `أصبح رصيد حضورك الاحتياطي: ${newTotal}`;
            break;
          case "vip":
            message = `أصبح بطاقات VIP لديك: ${newTotal}`;
            break;
          case "green_card":
          case "greencard":
            message = `أصبح رصيد بطاقات Green Card لديك: ${newTotal}`;
            break;
          case "blue_card":
          case "bluecard":
            message = `أصبح رصيد بطاقات Blue Card لديك: ${newTotal}`;
            break;
          default:
            message = `تم استلام المكافأة بنجاح (${newTotal})`;
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
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      dir="rtl"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 md:p-8 max-w-sm w-full text-center transform transition-all">
        {!isProcessing ? (
          <>
            <div className="animate-bounce mb-4 flex justify-center">
              <div className="w-20 h-20 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
                <Gift size={44} />
              </div>
            </div>
            <h2 className="text-2xl font-black text-white mb-2">
              لديك مكافأة جديدة! 🎁
            </h2>
            <p className="text-slate-300 text-sm whitespace-pre-line mb-6">
              {giftData?.message}
            </p>
            <button
              onClick={handleClaimGift}
              className="w-full bg-linear-to-r from-amber-400 via-yellow-500 to-amber-600 text-slate-950 px-6 py-3.5 rounded-2xl font-black text-base hover:scale-105 active:scale-95 transform transition-all shadow-lg shadow-amber-500/30 cursor-pointer"
            >
              استلام المكافأة ✨
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center relative shadow-lg shadow-emerald-500/20">
              <Check
                size={48}
                className="text-emerald-400 animate-ping absolute opacity-75"
              />
              <Check size={48} className="text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black text-emerald-400 mt-5">
              تم الاستلام بنجاح! 🎉
            </h2>
            {successMessage && (
              <p className="text-slate-200 mt-2 text-base font-bold">
                {successMessage}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentGift;
