"use client";
import React, { useState, useEffect } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

const defaultAvatar = "/favicon.png";
const StudentActivityStatus = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const q = query(collection(db, "students"));
    // إذا كنت تريد فلترة حسب مجموعة معينة:
    // const q = query(collection(db, "students"), where("group", "==", "1"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let studentsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || "طالب بدون اسم",
          profilePic : doc.data().profilePic,
          lastActivity: doc.data().lastActivity, // Firebase Timestamp أو null
          showTime: doc.data().showTime , 
        }));

        // الترتيب من الأحدث إلى الأقدم
        studentsList.sort((a, b) => {
          // إذا ما عندوش lastActivity خالص → يروح للأخر
          if (!a.lastActivity) return 1;
          if (!b.lastActivity) return -1;

          const timeA = a.lastActivity.toDate ? a.lastActivity.toDate().getTime() : a.lastActivity;
          const timeB = b.lastActivity.toDate ? b.lastActivity.toDate().getTime() : b.lastActivity;

          return timeB - timeA; // تنازلي (الأحدث أولاً)
        });
        setStudents(studentsList);
        setLoading(false);
      },
      (error) => {
        console.error("خطأ في جلب الطلاب:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const getStatus = (lastActivity) => {
    if (!lastActivity) {
      return { status: "لم يدخل بعد", color: "gray", icon: "offline", time: "" };
    }

    const last = lastActivity.toDate ? lastActivity.toDate().getTime() : lastActivity;
    const secondsAgo = Math.floor((Date.now() - last) / 1000);

    if (secondsAgo < 30) {
      return {
        status: "متصل الآن",
        color: "emerald",
        icon: "online",
        time: "الآن",
      };
    } else if (secondsAgo < 300) {
      return {
        status: "نشط مؤخرًا",
        color: "yellow",
        icon: "recent",
        time: formatDistanceToNow(last, { locale: ar, addSuffix: true }),
      };
    } else {
      return {
        status: "غير نشط",
        color: "red",
        icon: "offline",
        time: formatDistanceToNow(last, { locale: ar, addSuffix: true }),
      };
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-4xl font-bold text-indigo-700">جاري تحميل الطلاب...</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto">
        {/* العنوان */}
        <div className="text-center mb-12 mt-8">
          <h1 className="text-5xl md:text-6xl font-bold text-indigo-800 mb-4">
            حالة نشاط الطلاب
          </h1>
          <p className="text-xl text-gray-600">إجمالي الطلاب: {students.length} طالب</p>
        </div>

        {/* قائمة الطلاب مُرتبة حسب آخر نشاط */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {students.map((student) => {
            const { status, color, icon, time } = getStatus(student.lastActivity);

            return (
              <div
                key={student.id}
                className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100"
              >
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative w-full">
                           <div className="flex justify-between flex-1 items-center">
                              <img
                                        loading="lazy"
                                        src={student.profilePic || defaultAvatar}
                                        alt={`صورة ${student.name}`}
                                        className="w-16 h-16 rounded-full shadow-md object-cover cursor-pointer transition-transform hover:scale-105"
                                     
                                      />
                      <div
                        className={`w-12 h-12 rounded-full bg-${color}-500 shadow-lg flex items-center justify-center text-white text-2xl`}
                      >
                        {icon === "online" && "WiFi"}
                        {icon === "recent" && "Clock"}
                        {icon === "offline" && "No WiFi"}
                      </div>
                      {status === "متصل الآن" && (
                        <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping"></div>
                      )}
                           </div>
                    </div>

                  </div>
                    <div>
                      <h3 className="font-bold md:text-xl text-gray-800">{student.name}</h3>
                      <h3 className="text-xs text-gray-800"> الخصوصية :{student.showTime ? "🟢" :"🔘"} </h3>
                      <p className={`text-sm font-bold text-${color}-600`}>{status}</p>
                    </div>

                  {time && (
                    <div className="mt-3 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-xl">
                      آخر نشاط: <span className="font-semibold">{time}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {students.length === 0 && (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">Confused Face</div>
            <p className="text-3xl text-gray-600">لا يوجد طلاب مسجلين بعد</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentActivityStatus;