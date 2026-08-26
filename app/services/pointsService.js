import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  increment,
  addDoc,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

/**
 * تنفيذ تحويل النقاط بين الطلاب + تسجيل الإشعارات
 */
export const transferPoints = async ({
  senderId,
  recipientId,
  pointsToTransfer,
}) => {
  const studentsRef = collection(db, "students");

  // جلب الطالب المرسل
  const senderQuery = query(studentsRef, where("id", "==", Number(senderId)));
  const senderSnap = await getDocs(senderQuery);

  if (senderSnap.empty) {
    throw new Error("الطالب المرسل غير موجود");
  }

  const senderDoc = senderSnap.docs[0];
  const senderRef = doc(db, "students", senderDoc.id);
  const senderData = senderDoc.data();

  // جلب الطالب المستلم
  const recipientQuery = query(
    studentsRef,
    where("id", "==", Number(recipientId))
  );
  const recipientSnap = await getDocs(recipientQuery);

  if (recipientSnap.empty) {
    throw new Error("الطالب المستقبل غير موجود");
  }

  const recipientDoc = recipientSnap.docs[0];
  const recipientRef = doc(db, "students", recipientDoc.id);
  const recipientData = recipientDoc.data();

  // التحقق من كفاية الرصيد
  if ((senderData.score || 0) < pointsToTransfer) {
    throw new Error("ليس لديك نقاط كافية لإجراء التحويل");
  }

  // تحديث رصيد الطرفين
  await updateDoc(senderRef, {
    score: increment(-pointsToTransfer),
  });

  await updateDoc(recipientRef, {
    score: increment(pointsToTransfer),
  });

  // إضافة إشعار للمستلم والمرسل
  const notificationsRef = collection(db, "notifications");

  await addDoc(notificationsRef, {
    recipientId: Number(recipientId),
    senderName: senderData.name,
    message: `📩 لقد استلمت ${pointsToTransfer} نقطة من ${senderData.name}`,
    points: pointsToTransfer,
    timestamp: new Date(),
  });

  await addDoc(notificationsRef, {
    recipientId: Number(senderId),
    senderName: recipientData.name,
    message: `📤 لقد أرسلت ${pointsToTransfer} نقطة إلى ${recipientData.name}`,
    points: pointsToTransfer,
    timestamp: new Date(),
  });

  // إرجاع الرصيد المتبقي للمرسل
  const updatedSender = await getDoc(senderRef);
  return updatedSender.exists() ? updatedSender.data().score || 0 : 0;
};
