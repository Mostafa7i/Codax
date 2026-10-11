'use client';
import Swal from "sweetalert2";
import {
  collection,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  addDoc
} from "firebase/firestore";
import { useState } from "react";
import { db } from "../firebaseConfig";

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export const useStudentActions = (studentIdV) => {
  const [loading, setLoading] = useState(false);

  const handleLike = async (targetStudentId) => {
    const likerId = Number(studentIdV);
    if (likerId === targetStudentId) return;

    setLoading(true);
    const now = Date.now();

    try {
      const qTarget = query(collection(db, "students"), where("id", "==", targetStudentId));
      const qLiker = query(collection(db, "students"), where("id", "==", likerId));

      const [snapshotTarget, snapshotLiker] = await Promise.all([
        getDocs(qTarget),
        getDocs(qLiker)
      ]);

      if (snapshotTarget.empty) return;

      const targetDoc = snapshotTarget.docs[0];
      const targetRef = doc(db, "students", targetDoc.id);
      const targetData = targetDoc.data();
      const likedBy = targetData.likedBy || [];

      const likerData = snapshotLiker.empty ? {} : snapshotLiker.docs[0].data();

      // البحث عن آخر لايك تم إعطاؤه لهذا الطالب خلال آخر 24 ساعة
      const lastLikeIndex = likedBy.findIndex(
        (entry) => entry.likerId === likerId && (now - (entry.timestamp || 0)) < TWENTY_FOUR_HOURS
      );

      let updatedLikedBy = [...likedBy];
      let updatedLikesCount = targetData.likesCount || 0;

      if (lastLikeIndex !== -1) {
        // إذا ضغط مرة أخرى خلال 24 ساعة يتم إلغاء اللايك (Toggle)
        const removedEntry = updatedLikedBy.splice(lastLikeIndex, 1)[0];
        updatedLikesCount = Math.max(0, updatedLikesCount - 1);

        const qLikeRecord = query(
          collection(db, "likesStudents"),
          where("likerId", "==", likerId),
          where("targetId", "==", targetStudentId),
          where("timestamp", "==", removedEntry.timestamp)
        );
        const likeSnapshot = await getDocs(qLikeRecord);
        likeSnapshot.forEach((d) => deleteDoc(d.ref));
      } else {
        // إضافة لايك جديد بالطابع الزمني الحالي
        updatedLikedBy.push({ likerId, timestamp: now });
        updatedLikesCount += 1;

        await addDoc(collection(db, "likesStudents"), {
          likerName: likerData.name || "",
          likerId,
          targetName: targetData.name || "",
          targetId: targetStudentId,
          timestamp: now,
          read: false
        });
      }

      await updateDoc(targetRef, {
        likedBy: updatedLikedBy,
        likesCount: updatedLikesCount
      });

    } catch (error) {
      console.error("Error in handleLike:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDislike = async (targetStudentId) => {
    const dislikerId = Number(studentIdV);
    if (dislikerId === targetStudentId) {
      Swal.fire({
        icon: "warning",
        title: "تنبيه",
        text: "لا يمكنك عمل Dislike لنفسك.",
        confirmButtonText: "تمام",
      });
      return;
    }

    setLoading(true);
    const now = Date.now();

    try {
      const qTarget = query(collection(db, "students"), where("id", "==", targetStudentId));
      const qDisliker = query(collection(db, "students"), where("id", "==", dislikerId));

      const [snapshotTarget, snapshotDisliker] = await Promise.all([
        getDocs(qTarget),
        getDocs(qDisliker)
      ]);

      if (snapshotTarget.empty) return;

      const targetDoc = snapshotTarget.docs[0];
      const targetRef = doc(db, "students", targetDoc.id);
      const targetData = targetDoc.data();
      const dislikedBy = targetData.dislikedBy || [];

      const dislikerData = snapshotDisliker.empty ? {} : snapshotDisliker.docs[0].data();

      // البحث عن آخر ديسلايك تم إعطاؤه لهذا الطالب خلال آخر 24 ساعة
      const lastDislikeIndex = dislikedBy.findIndex(
        (entry) => entry.dislikerId === dislikerId && (now - (entry.timestamp || 0)) < TWENTY_FOUR_HOURS
      );

      let updatedDislikedBy = [...dislikedBy];
      let updatedDislikesCount = targetData.dislikesCount || 0;

      if (lastDislikeIndex !== -1) {
        // إلغاء الديسلايك إذا تم النقر مجدداً خلال الـ 24 ساعة
        const removedEntry = updatedDislikedBy.splice(lastDislikeIndex, 1)[0];
        updatedDislikesCount = Math.max(0, updatedDislikesCount - 1);

        const qDislikeRecord = query(
          collection(db, "dislikesStudents"),
          where("dislikerId", "==", dislikerId),
          where("targetId", "==", targetStudentId),
          where("timestamp", "==", removedEntry.timestamp)
        );
        const dislikeSnapshot = await getDocs(qDislikeRecord);
        dislikeSnapshot.forEach((d) => deleteDoc(d.ref));
      } else {
        // إضافة ديسلايك جديد
        updatedDislikedBy.push({ dislikerId, timestamp: now });
        updatedDislikesCount += 1;

        await addDoc(collection(db, "dislikesStudents"), {
          dislikerName: dislikerData.name || "",
          dislikerId,
          targetName: targetData.name || "",
          targetId: targetStudentId,
          timestamp: now,
          read: false
        });
      }

      await updateDoc(targetRef, {
        dislikedBy: updatedDislikedBy,
        dislikesCount: updatedDislikesCount
      });
    } catch (error) {
      console.error("Error in handleDislike:", error);
    } finally {
      setLoading(false);
    }
  };

  return { handleLike, handleDislike, loading };
};