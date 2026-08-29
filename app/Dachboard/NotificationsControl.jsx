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
  Trophy,
  Sparkles,
} from "lucide-react";
import GroupRankingsManager from "./GroupRankingsManager";

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
  const [activeTab, setActiveTab] = useState("rankings"); // "rankings" | "manual"
  const [selectedGroup, setSelectedGroup] = useState("");
  const [title, setTitle] = useState("Codax");
  const [message, setMessage] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const router = useRouter();
  const { availableGroups, groupStatuses } = useGroupContext();

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

    const activeGroups = Object.keys(groupStatuses).filter(
      (g) => groupStatuses[g] === true
    );

    if (activeGroups.length === 0) return;

    if (!selectedGroup) {
      setSelectedGroup(activeGroups[0]);
    }
  }, [groupStatuses, selectedGroup]);

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
            createdAt: doc.data().createdAt?.toDate
              ? doc.data().createdAt.toDate()
              : doc.data().createdAt,
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
    if (!message.trim() || !selectedGroup) return;

    setSending(true);
    try {
      await addDoc(collection(db, "notificationsGroups"), {
        title,
        message,
        group: selectedGroup,
        createdAt: serverTimestamp(),
      });
      setMessage("");
      setTitle("Codax");
    } catch (error) {
      console.error("Error sending notification:", error);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await deleteDoc(doc(db, "notificationsGroups", id));
    } catch (error) {
      console.error("خطأ أثناء حذف الإشعار:", error);
    }
  };

  if (!user)
    return <div className="text-center p-8">جارٍ التحقق من الصلاحيات...</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6" dir="rtl">
      {/* ─── شريط التبديل بين الأقسام ─── */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("rankings")}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === "rankings"
              ? "bg-linear-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>متابعة ترتيب الطلاب والإشعارات التلقائية</span>
        </button>
        <button
          onClick={() => setActiveTab("manual")}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            activeTab === "manual"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>إرسال إشعار يدوي وسجل الإشعارات</span>
        </button>
      </div>

      {/* ─── قسم اختيار المجموعة المشترك ─── */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60">
        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
          المجموعة المحددة:
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

      {/* ─── التبويب 1: متابعة الترتيب التلقائي ─── */}
      {activeTab === "rankings" && (
        <GroupRankingsManager
          selectedGroup={selectedGroup}
          availableGroups={availableGroups}
        />
      )}

      {/* ─── التبويب 2: إرسال إشعار يدوي ─── */}
      {activeTab === "manual" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2.5">
              <MessageSquare className="text-purple-500 w-5 h-5" />
              إرسال إشعار يدوي جديد لمجموعة {selectedGroup}
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1"
                >
                  عنوان الإشعار:
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 text-sm border border-gray-200 rounded-xl dark:bg-gray-900 dark:text-white dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1"
                >
                  نص الرسالة:
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-2.5 text-sm border border-gray-200 rounded-xl dark:bg-gray-900 dark:text-white dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  rows="4"
                  placeholder="اكتب نص الإشعار هنا..."
                />
              </div>

              <button
                onClick={handleSendNotification}
                disabled={sending || !message.trim()}
                className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-600/20"
              >
                {sending ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {sending ? "جاري الإرسال..." : "إرسال الإشعار للمجموعة"}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="font-bold text-base text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Bell className="text-purple-500 w-4 h-4" />
              سجل الإشعارات المرسلة لمجموعة:{" "}
              <span className="text-purple-600 dark:text-purple-400">{selectedGroup}</span>
            </h2>

            {loading ? (
              <div className="flex justify-center items-center py-10">
                <Loader className="animate-spin text-purple-500" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl max-w-md mx-auto">
                  <div className="flex items-center gap-2.5 justify-center text-amber-700 dark:text-amber-400 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4" />
                    <p>لا توجد إشعارات سابقة في هذه المجموعة حتى الآن.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto p-1">
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
      )}
    </div>
  );
};

export default memo(NotificationsControl);
