"use client";
import React, { useState, useEffect, memo } from "react";
import { auth, db } from "@/app/services/firebaseConfig";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  deleteDoc,
  doc,
  addDoc,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useGroupContext } from "@/app/context/GroupContextProvider";
import { useRouter } from "next/navigation";
import {
  Bell,
  Send,
  Trash2,
  Loader,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";

// --- مكونات فرعية لتحسين العرض ---

// 1. زر اختيار المجموعة
const GroupTab = memo(({ group, selectedGroup, onClick }) => (
  <button
    onClick={() => onClick(group)}
    className={`
      px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200
      transform hover:scale-105
      ${
        selectedGroup === group
          ? "bg-purple-600 text-white shadow-lg"
          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
      }
    `}
  >
    {group}
  </button>
));

// 2. بطاقة الإشعار
const NotificationCard = memo(({ notif, onDelete }) => (
  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 relative overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-1">
          {notif.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words">
          {notif.message}
        </p>
      </div>
      <button
        onClick={() => onDelete(notif.id)}
        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors"
        aria-label="حذف الإشعار"
      >
        <Trash2 size={18} />
      </button>
    </div>
    <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-left">
      {notif.createdAt?.toLocaleString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) || "..."}
    </p>
  </div>
));

// --- المكون الرئيسي ---
const NotificationsControl = () => {
  const [selectedGroup, setSelectedGroup] = useState("");
  const [title, setTitle] = useState("Codax");
  const [message, setMessage] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const router = useRouter();
  const { availableGroups , groupStatuses } = useGroupContext();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (
        currentUser &&
        (currentUser.email === "mostasafi7@gmail.com" ||
          currentUser.email === "farrag2572005@gmail.com")
      ) {
        setUser(currentUser);
      } else {
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router]);


  useEffect(() => {
  if (!groupStatuses) return;

  // هات المجموعات اللي حالتها true
  const activeGroups = Object.keys(groupStatuses).filter(
    (g) => groupStatuses[g] === true
  );

  // لو مفيش مجموعة فعّالة → بلاش تختار
  if (activeGroups.length === 0) return;

  // لو selectedGroup فاضي → اختار أول مجموعة فعّالة
  if (!selectedGroup) {
    setSelectedGroup(activeGroups[0]);
  }
}, [groupStatuses]);


  useEffect(() => {
    if (!user || !selectedGroup) return;

    setLoading(true);
    const q = query(
      collection(db, "notificationsGroups"),
      where("group", "==", selectedGroup),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setNotifications(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
          }))
        );
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching notifications:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, selectedGroup]);

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    try {
      await addDoc(collection(db, "notificationsGroups"), {
        title,
        message,
        group: selectedGroup,
        createdAt: serverTimestamp(),
        read: false,
      });
      setMessage(""); // فقط أفرغ الرسالة
    } catch (error) {
      console.error("خطأ أثناء إرسال الإشعار:", error);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteNotification = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الإشعار؟")) return;
    try {
      await deleteDoc(doc(db, "notificationsGroups", id));
    } catch (error) {
      console.error("خطأ أثناء حذف الإشعار:", error);
    }
  };

  if (!user)
    return <div className="text-center p-8">جارٍ التحقق من الصلاحيات...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-8" dir="rtl">
      {/* 1. قسم إرسال الإشعارات */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-3">
          <MessageSquare className="text-purple-500" />
          إرسال إشعار جديد
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              إلى مجموعة:
            </label>
            <div className="flex flex-wrap gap-2">
              {availableGroups.map((group) => (
                <GroupTab
                  key={group}
                  group={group}
                  selectedGroup={selectedGroup}
                  onClick={setSelectedGroup}
                />
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              العنوان:
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              نص الرسالة:
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-purple-500"
              rows="4"
            />
          </div>

          <button
            onClick={handleSendNotification}
            disabled={sending || !message.trim()}
            className="w-full bg-purple-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {sending ? (
              <Loader size={20} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
            {sending ? "جاري الإرسال..." : "إرسال الإشعار"}
          </button>
        </div>
      </div>

      {/* 2. قسم الإشعارات الحالية */}
      <div className="bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <h2 className=" flex-wrap font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-3">
          <Bell className="text-purple-500" />
          الإشعارات الحالية لمجموعة:{" "}
          <span className="text-purple-500">{selectedGroup}</span>
        </h2>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader className="animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded-r-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-yellow-500" />
                <p>لا توجد إشعارات لعرضها في هذه المجموعة حتى الآن.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
            {notifications.map((notif) => (
              <NotificationCard
                key={notif.id}
                notif={notif}
                onDelete={handleDeleteNotification}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(NotificationsControl);
