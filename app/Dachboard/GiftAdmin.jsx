"use client";
import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/app/services/firebaseConfig";
import {
  collection,
  getDocs,
  writeBatch,
  query,
  where,
  doc,
  deleteField,
  serverTimestamp,
} from "firebase/firestore";
import {
  Gift,
  Send,
  Trash2,
  Loader2,
  Users,
  User,
  Star,
  CalendarPlus,
  Shield,
  Leaf,
  CheckCircle,
  AlertCircle,
  Search,
  Eye,
  ArrowLeft,
  CreditCard,
} from "lucide-react";
import { useGroupContext } from "@/app/context/GroupContextProvider";
import { useRouter } from "next/navigation";
import { sendCardCelebrationNotification } from "@/app/utils/notificationHelpers";

const GiftAdmin = () => {
  const [giftType, setGiftType] = useState("attendance");
  const [giftAmount, setGiftAmount] = useState(1);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: "success"|"error"|"info", msg: string }

  const [sendMode, setSendMode] = useState("student"); // "group" | "student"
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [groupStudentCount, setGroupStudentCount] = useState(0);

  const { availableGroups, selectedGroup, setSelectedGroup } =
    useGroupContext();
  const router = useRouter();

  // جلب كل الطلاب
  useEffect(() => {
    const fetchStudents = async () => {
      const snap = await getDocs(collection(db, "students"));
      const list = snap.docs.map((d) => ({
        docId: d.id,
        ...d.data(),
      }));
      setAllStudents(list);
    };
    fetchStudents();
  }, []);

  // عدد الطلاب في المجموعة المختارة
  useEffect(() => {
    if (sendMode === "group" && selectedGroup) {
      const count = allStudents.filter((s) => s.group === selectedGroup).length;
      setGroupStudentCount(count);
    } else {
      setGroupStudentCount(0);
    }
  }, [selectedGroup, allStudents, sendMode]);

  // رسالة تلقائية ذكية
  useEffect(() => {
    const name =
      sendMode === "student" && selectedStudent
        ? selectedStudent.name
        : selectedGroup || "الطالب";

    let base = `مرحباً ${name} 👋\n`;
    if (giftType === "attendance") {
      base += `لقد حصلت على (${giftAmount}) حضور احتياطي كمكافأة! 🎉\nعمل رائع، استمر على ذلك 😊`;
    } else if (giftType === "points") {
      base += `لقد حصلت على (${giftAmount}) نقطة إضافية كمكافأة! 🌟\nعمل رائع، استمر على ذلك 😊`;
    } else if (giftType === "green_card") {
      base += `لقد حصلت على (${giftAmount}) Green Card 🟩!\nاستخدمها داخل عجلة الحظ لتصبح كل جوائزها إطارات أسطورية دائمة يحددها الأدمن. ✨`;
    } else if (giftType === "blue_card") {
      base += `لقد حصلت على (${giftAmount}) Blue Card 🟦!\nاستخدمها داخل عجلة الحظ لتصبح كل جوائزها إطارات مؤقتة مميزة ومحددة المدة! ⏱️✨`;
    } else {
      base += `لقد حصلت على (${giftAmount}) بطاقة VIP كمكافأة! 🏆\nعمل رائع، استمر على ذلك 😊`;
    }
    setMessage(base);
  }, [giftType, giftAmount, selectedStudent, selectedGroup, sendMode]);

  // نتائج البحث
  const searchResults = useMemo(() => {
    if (searchTerm.length < 2) return [];
    return allStudents.filter((s) =>
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm, allStudents]);

  // إرسال الهدية
  const handleSendGift = async () => {
    if (!window.confirm("هل أنت متأكد من إرسال هذه المكافأة؟")) return;

    setLoading(true);
    setStatus(null);

    try {
      const batch = writeBatch(db);
      const giftLogRef = doc(collection(db, "gifts"));
      const giftLogId = giftLogRef.id;

      const payload = {
        giftLogId,
        message,
        type: giftType,
        amount: Number(giftAmount) || 1,
        receivedAt: serverTimestamp(),
        isOpened: false,
      };

      if (sendMode === "group") {
        if (!selectedGroup) throw new Error("اختر مجموعة أولاً");

        const q = query(
          collection(db, "students"),
          where("group", "==", selectedGroup),
        );
        const snap = await getDocs(q);
        if (snap.empty) throw new Error("لا يوجد طلاب في هذه المجموعة");

        const recipientIds = snap.docs.map((d) => d.data().id || d.id);

        batch.set(giftLogRef, {
          ...payload,
          targetType: "group",
          targetValue: selectedGroup,
          sentAt: serverTimestamp(),
          studentCount: snap.size,
          recipientIds,
        });

        snap.forEach((d) => batch.update(d.ref, { gift: payload }));

        setStatus({
          type: "success",
          msg: `تم إرسال المكافأة لـ ${snap.size} طالب بنجاح!`,
        });
      } else {
        if (!selectedStudent) throw new Error("اختر طالبًا أولاً");

        batch.set(giftLogRef, {
          ...payload,
          targetType: "student",
          targetValue: {
            id: selectedStudent.id || selectedStudent.docId,
            name: selectedStudent.name,
          },
          sentAt: serverTimestamp(),
          recipientIds: [selectedStudent.id || selectedStudent.docId],
        });

        const studentRef = doc(db, "students", selectedStudent.docId);
        batch.update(studentRef, { gift: payload });

        setStatus({
          type: "success",
          msg: `تم إرسال المكافأة للطالب ${selectedStudent.name} بنجاح!`,
        });
      }

      await batch.commit();

      // إرسال إشعار احتفال جماعي عند إرسال Green Card أو Blue Card
      if (giftType === "green_card" || giftType === "blue_card") {
        if (sendMode === "group") {
          await sendCardCelebrationNotification({
            group: selectedGroup,
            studentName: "جميع أبطال المجموعة",
            cardType: giftType,
            amount: Number(giftAmount) || 1,
          });
        } else if (selectedStudent) {
          await sendCardCelebrationNotification({
            group: selectedStudent.group,
            studentName: selectedStudent.name,
            cardType: giftType,
            amount: Number(giftAmount) || 1,
          });
        }
      }
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", msg: err.message || "حدث خطأ أثناء الإرسال" });
    } finally {
      setLoading(false);
    }
  };

  // سحب الهدية
  const handleRemoveGift = async () => {
    if (!selectedGroup) return alert("اختر مجموعة أولاً");
    if (!window.confirm(`سحب المكافأة من كل طلاب "${selectedGroup}"؟`)) return;

    setLoading(true);
    try {
      const q = query(
        collection(db, "students"),
        where("group", "==", selectedGroup),
      );
      const snap = await getDocs(q);
      if (snap.empty) throw new Error("لا يوجد طلاب");

      const batch = writeBatch(db);
      snap.forEach((d) => batch.update(d.ref, { gift: deleteField() }));
      await batch.commit();

      setStatus({
        type: "success",
        msg: `تم سحب المكافأة من ${snap.size} طالب`,
      });
    } catch (err) {
      setStatus({ type: "error", msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
            <Gift className="text-purple-600" size={40} />
            إرسال مكافأة
          </h1>
          <button
            onClick={() => router.push("/admin/gifts-log")}
            className="flex items-center gap-2 px-5 py-3 bg-linear-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition transform hover:scale-105"
          >
            <ArrowLeft size={20} />
            لوحة السجل
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">
          {/* تبديل الوضع */}
          <div className="flex  bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            <button
              onClick={() => setSendMode("group")}
              className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition ${
                sendMode === "group"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              <Users size={20} />
              مجموعة
            </button>
            <button
              onClick={() => setSendMode("student")}
              className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition ${
                sendMode === "student"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              <User size={20} />
              طالب فردي
            </button>
          </div>

          {/* نوع المكافأة */}
          <div className="space-y-4">
            <label className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              نوع المكافأة
            </label>
            <div className="flex flex-wrap gap-4">
              {[
                {
                  value: "attendance",
                  icon: CalendarPlus,
                  label: "حضور احتياطي",
                  color: "blue",
                },
                { value: "points", icon: Star, label: "نقاط", color: "yellow" },
                { value: "vip", icon: Shield, label: "VIP", color: "purple" },
                {
                  value: "green_card",
                  icon: Leaf,
                  label: "Green Card",
                  color: "green",
                },
                {
                  value: "blue_card",
                  icon: CreditCard,
                  label: "Blue Card",
                  color: "sky",
                },
              ].map((item) => (
                <label
                  key={item.value}
                  className={`flex flex-1 items-center p-3 rounded-xl border-2 cursor-pointer transition ${
                    giftType === item.value
                      ? `border-${item.color}-500 bg-${item.color}-50 dark:bg-${item.color}-900/30`
                      : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="giftType"
                    value={item.value}
                    checked={giftType === item.value}
                    onChange={(e) => setGiftType(e.target.value)}
                    className="sr-only"
                  />
                  <item.icon
                    size={36}
                    className={`text-${item.color}-600 mb-2`}
                  />
                  <span className="font-medium">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* الكمية */}
          <div>
            <label className="block text-lg font-semibold mb-2">الكمية</label>
            <input
              type="number"
              min="1"
              value={giftAmount}
              onChange={(e) =>
                setGiftAmount(Math.max(1, Number(e.target.value) || 1))
              }
              className="w-full px-4 py-3 text-lg border rounded-xl focus:ring-4 focus:ring-purple-500 dark:bg-gray-700"
            />
          </div>

          {/* اختيار المجموعة أو الطالب */}
          {sendMode === "group" ? (
            <div>
              <label className="block text-lg font-semibold mb-2">
                اختر المجموعة
              </label>
              <select
                value={selectedGroup || ""}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl dark:bg-gray-700"
              >
                <option value="">-- اختر مجموعة --</option>
                {availableGroups.map((g) => (
                  <option key={g} value={g}>
                    {g}{" "}
                    {groupStudentCount > 0 && `( ${groupStudentCount} طالب )`}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="relative">
              <label className="block text-lg font-semibold mb-2">
                ابحث عن طالب
              </label>
              <div className="relative">
                <Search
                  className="absolute right-4 top-4 text-gray-400"
                  size={22}
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedStudent(null);
                  }}
                  placeholder="اكتب اسم الطالب..."
                  className="w-full pr-12 pl-4 py-4 border rounded-xl dark:bg-gray-700"
                />
              </div>

              {searchResults.length > 0 && !selectedStudent && (
                <ul className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border rounded-xl shadow-xl max-h-64 overflow-y-auto">
                  {searchResults.map((s) => (
                    <li
                      key={s.docId}
                      onClick={() => {
                        setSelectedStudent(s);
                        setSearchTerm(s.name);
                      }}
                      className="px-4 py-3 hover:bg-purple-100 dark:hover:bg-purple-900 cursor-pointer flex justify-between"
                    >
                      <span>{s.name}</span>
                      <span className="text-sm text-gray-500">{s.group}</span>
                    </li>
                  ))}
                </ul>
              )}

              {selectedStudent && (
                <div className="mt-3 p-4 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center gap-3">
                  <CheckCircle className="text-green-600" />
                  <span className="font-medium">
                    تم اختيار: {selectedStudent.name}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* معاينة الرسالة */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-lg font-semibold">الرسالة (معاينة)</label>
              <Eye className="text-gray-500" />
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full p-4 border rounded-xl dark:bg-gray-700 resize-none font-medium"
            />
          </div>

          {/* الأزرار */}
          <div className="flex gap-4">
            <button
              onClick={handleSendGift}
              disabled={
                loading ||
                (sendMode === "group" && !selectedGroup) ||
                (sendMode === "student" && !selectedStudent)
              }
              className="flex-1 bg-linear-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:shadow-xl disabled:opacity-60 transition"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Send />}
              إرسال المكافأة
            </button>

            {sendMode === "group" && selectedGroup && (
              <button
                onClick={handleRemoveGift}
                disabled={loading}
                className="flex-1 bg-linear-to-r from-red-600 to-rose-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:shadow-xl transition"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Trash2 />}
                سحب المكافأة
              </button>
            )}
          </div>

          {/* الحالة */}
          {status && (
            <div
              className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${
                status.type === "success"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30"
              }`}
            >
              {status.type === "success" ? <CheckCircle /> : <AlertCircle />}
              <span className="font-medium">{status.msg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GiftAdmin;
