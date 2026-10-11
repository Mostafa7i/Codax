"use client";
import React, { useState, useEffect, useMemo } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

const defaultAvatar = "/favicon.png";

const StudentActivityStatus = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | online | recent | offline

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
          profilePic: doc.data().profilePic,
          lastActivity: doc.data().lastActivity,
          showTime: doc.data().showTime,
        }));

        studentsList.sort((a, b) => {
          if (!a.lastActivity) return 1;
          if (!b.lastActivity) return -1;

          const timeA = a.lastActivity.toDate
            ? a.lastActivity.toDate().getTime()
            : a.lastActivity;
          const timeB = b.lastActivity.toDate
            ? b.lastActivity.toDate().getTime()
            : b.lastActivity;

          return timeB - timeA;
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
      return {
        status: "لم يدخل بعد",
        key: "offline",
        color: "slate",
        bg: "bg-slate-100",
        text: "text-slate-600",
        border: "border-slate-200",
        dot: "bg-slate-400",
        ring: "ring-slate-300",
        time: "",
      };
    }

    const last = lastActivity.toDate
      ? lastActivity.toDate().getTime()
      : lastActivity;
    const secondsAgo = Math.floor((Date.now() - last) / 1000);

    if (secondsAgo < 30) {
      return {
        status: "متصل الآن",
        key: "online",
        color: "emerald",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
        ring: "ring-emerald-400",
        time: "الآن",
      };
    } else if (secondsAgo < 300) {
      return {
        status: "نشط مؤخرًا",
        key: "recent",
        color: "amber",
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        dot: "bg-amber-500",
        ring: "ring-amber-400",
        time: formatDistanceToNow(last, { locale: ar, addSuffix: true }),
      };
    } else {
      return {
        status: "غير نشط",
        key: "offline",
        color: "rose",
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
        dot: "bg-rose-500",
        ring: "ring-rose-400",
        time: formatDistanceToNow(last, { locale: ar, addSuffix: true }),
      };
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch = s.name
        .toLowerCase()
        .includes(search.trim().toLowerCase());
      if (!matchesSearch) return false;

      if (filter === "all") return true;
      const { key } = getStatus(s.lastActivity);
      return key === filter;
    });
  }, [students, search, filter]);

  const stats = useMemo(() => {
    let online = 0,
      recent = 0,
      offline = 0;
    students.forEach((s) => {
      const { key } = getStatus(s.lastActivity);
      if (key === "online") online++;
      else if (key === "recent") recent++;
      else offline++;
    });
    return { online, recent, offline, total: students.length };
  }, [students]);

  if (loading) {
    return (
      <div
        className="min-h-screen bg-linear-to-br from-indigo-50 via-violet-50 to-fuchsia-50 flex flex-col items-center justify-center gap-6"
        dir="rtl"
      >
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-indigo-100 animate-pulse" />
          </div>
        </div>
        <p className="text-2xl font-bold text-indigo-700 animate-pulse">
          جاري تحميل الطلاب...
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-linear-to-br from-indigo-50 via-violet-50 to-fuchsia-50 p-4 sm:p-6 lg:p-8"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 mt-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold bg-linear-to-r from-indigo-700 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent tracking-tight">
            حالة نشاط الطلاب
          </h1>
          <p className="mt-3 text-lg text-slate-500 font-medium">
            متابعة لحظية لنشاط جميع الطلاب
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-white/60 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">الإجمالي</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-2xl">
                👥
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-white/60 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">متصل الآن</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">
                  {stats.online}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-white/60 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">نشط مؤخرًا</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">
                  {stats.recent}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl">
                ⏱️
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-white/60 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">غير نشط</p>
                <p className="text-3xl font-bold text-rose-600 mt-1">
                  {stats.offline}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-2xl">
                💤
              </div>
            </div>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 items-center">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="ابحث عن طالب بالاسم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-12 pl-5 py-3.5 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-slate-800 placeholder:text-slate-400 transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
              🔍
            </span>
          </div>

          <div className="flex gap-2 flex-wrap justify-center">
            {[
              { id: "all", label: "الكل", emoji: "✨" },
              { id: "online", label: "متصل", emoji: "🟢" },
              { id: "recent", label: "نشط", emoji: "🟡" },
              { id: "offline", label: "غير نشط", emoji: "🔴" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                  filter === f.id
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105"
                    : "bg-white/80 text-slate-600 hover:bg-white border border-white/60 shadow-sm"
                }`}
              >
                <span>{f.emoji}</span>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Students Grid */}
        {filteredStudents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredStudents.map((student, index) => {
              const st = getStatus(student.lastActivity);

              return (
                <div
                  key={student.id}
                  className="group relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg hover:shadow-2xl border border-white/60 overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02]"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  {/* Top accent bar */}
                  <div
                    className={`h-1.5 w-full ${
                      st.key === "online"
                        ? "bg-linear-to-r from-emerald-400 to-teal-500"
                        : st.key === "recent"
                        ? "bg-linear-to-r from-amber-400 to-orange-500"
                        : "bg-linear-to-r from-slate-300 to-slate-400"
                    }`}
                  />

                  <div className="p-5">
                    {/* Avatar + Status Dot */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="relative">
                        <img
                          loading="lazy"
                          src={student.profilePic || defaultAvatar}
                          alt={student.name}
                          className="w-16 h-16 rounded-2xl object-cover shadow-md ring-4 ring-white group-hover:ring-indigo-100 transition-all duration-300"
                        />
                        <span
                          className={`absolute -bottom-1 -left-1 w-5 h-5 rounded-full border-[3px] border-white ${st.dot} ${
                            st.key === "online" ? "animate-pulse" : ""
                          }`}
                        />
                      </div>

                      {/* Privacy indicator */}
                      <div
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          student.showTime
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {student.showTime ? "🟢 مرئي" : "🔘 مخفي"}
                      </div>
                    </div>

                    {/* Name */}
                    <h3 className="font-bold text-lg text-slate-800 truncate mb-1 group-hover:text-indigo-700 transition-colors">
                      {student.name}
                    </h3>

                    {/* Status Badge */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${st.bg} ${st.text} ${st.border} border`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${st.dot} ${
                          st.key === "online" ? "animate-ping" : ""
                        }`}
                      />
                      {st.status}
                    </div>

                    {/* Last activity */}
                    {st.time && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 bg-slate-50/80 rounded-xl px-3 py-2.5">
                        <span className="text-base">🕒</span>
                        <span>
                          آخر نشاط:{" "}
                          <span className="font-semibold text-slate-700">
                            {st.time}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="text-7xl mb-5 opacity-80">🔍</div>
            <p className="text-2xl font-bold text-slate-600 mb-2">
              {search || filter !== "all"
                ? "لا توجد نتائج مطابقة"
                : "لا يوجد طلاب مسجلين بعد"}
            </p>
            <p className="text-slate-400">
              {search || filter !== "all"
                ? "جرب تغيير البحث أو الفلتر"
                : "سيظهر الطلاب هنا فور تسجيلهم"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentActivityStatus;