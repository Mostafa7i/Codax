import React,{ useEffect, useState } from "react";
import { db } from "@/app/services/firebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const NotificationsSt = ({ studentId }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!studentId) return;

    const notificationsRef = collection(db, "notifications");
    const q = query(notificationsRef, where("recipientId", "==", Number(studentId)));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const newNotifications = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a, b) => b.timestamp - a.timestamp); // ترتيب من الأحدث للأقدم

      setNotifications(newNotifications);
    });

    return () => unsubscribe();
  }, [studentId]);

  return (
    <div className="p-2 dark:bg-gray-800 bg-gray-200 rounded-lg">
      <h2 className="text-base font-bold mb-3">إشعارات التحويل 🔔</h2>
      {notifications.length === 0 ? (
        <p className="text-gray-400">لا يوجد إشعارات تحويل</p>
      ) : (
        <ul className="max-h-48 overflow-scroll space-y-2">
     {notifications.map((notif) => {
  let date = null;

  if (notif.timestamp) {
    // لو timestamp رقم
    if (typeof notif.timestamp === "number") {
      date = new Date(notif.timestamp);
    }
    // لو timestamp كائن Timestamp من Firebase
    else if (notif.timestamp.toDate) {
      date = notif.timestamp.toDate();
    }
  }

  const formattedDate = date
    ? format(date, "yyyy/MM/dd - HH:mm", { locale: ar })
    : "تاريخ غير متاح";

  return (
    <li key={notif.id} className="p-2 rounded-lg bg-white dark:bg-gray-700">
      <p className="text-gray-700 dark:text-gray-300 text-sm">📢 {notif.message}</p>
      <p className="text-xs text-gray-500 mt-1">{formattedDate}</p>
    </li>
  );
})}

        </ul>
      )}
    </div>
  );
};

export default React.memo(NotificationsSt);
