import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig";

/**
 * إرسال إشعار احتفال جماعي للمجموعة عند حصول طالب على Green Card أو Blue Card
 * @param {Object} params
 * @param {string} params.group اسم المجموعة
 * @param {string} params.studentName اسم الطالب المحتفى به
 * @param {string} params.cardType نوع البطاقة ("green_card" | "blue_card")
 * @param {number} params.amount عدد البطاقات
 */
export async function sendCardCelebrationNotification({
  group,
  studentName = "أحد الأبطال",
  cardType = "green_card",
  amount = 1,
}) {
  if (!group) return;

  try {
    const isGreen = cardType === "green_card" || cardType === "greencard";
    const title = isGreen
      ? "🌟 احتفال خاص: Green Card أسطورية! 🟩"
      : "🎉 تهنئة خاصة: Blue Card مميزة! 🟦";

    const message = isGreen
      ? `👑 احتفال فخم بالبطل ${studentName}! 👑\nحصل على (${amount}) Green Card 🟩! حظاً موفقاً في عجلة الحظ للفوز بأقوى الإطارات الأسطورية الدائمة! ✨🔥`
      : `✨ تهانينا للطالب المتألق ${studentName}! ✨\nحصل على (${amount}) Blue Card 🟦! استمتع بالإطارات المؤقتة المميزة داخل عجلة الحظ! 🚀💫`;

    await addDoc(collection(db, "notificationsGroups"), {
      title,
      message,
      group,
      createdAt: serverTimestamp(),
      read: false,
      type: isGreen ? "green_card_celebration" : "blue_card_celebration",
      studentName,
      cardType,
    });
  } catch (err) {
    console.error("Error sending card celebration notification:", err);
  }
}
