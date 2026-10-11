"use client";
import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/app/services/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  Gift,
  Users,
  User,
  CreditCard,
  Star,
  CalendarPlus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ITEMS_PER_PAGE = 15;

const GiftTypeDisplay = ({ type, amount }) => {
  const types = {
    attendance: {
      icon: CalendarPlus,
      color: "text-blue-600",
      bg: "bg-blue-100",
      label: "حضور احتياطي",
    },
    points: {
      icon: Star,
      color: "text-yellow-600",
      bg: "bg-yellow-100",
      label: "نقاط إضافية",
    },
    vip: {
      icon: CreditCard,
      color: "text-purple-600",
      bg: "bg-purple-100",
      label: "بطاقة VIP",
    },
    green_card: {
      icon: CreditCard,
      color: "text-emerald-700",
      bg: "bg-emerald-100",
      label: "Green Card",
    },
    blue_card: {
      icon: CreditCard,
      color: "text-sky-700",
      bg: "bg-sky-100",
      label: "Blue Card",
    },
  };

  const {
    icon: Icon,
    color,
    bg,
    label,
  } = types[type] || {
    icon: AlertTriangle,
    color: "text-gray-600",
    bg: "bg-gray-100",
    label: "غير معروف",
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${bg}`}>
      <Icon size={16} className={color} />
      <span className="font-bold text-sm">{amount}</span>
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
};

const StatusBadge = ({ isOpened }) => (
  <div
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
      isOpened ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
    }`}
  >
    {isOpened ? <CheckCircle size={16} /> : <XCircle size={16} />}
    <span>{isOpened ? "تم الفتح" : "لم تُفتح"}</span>
  </div>
);

const GiftsLogDashboard = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const q = query(collection(db, "gifts"), orderBy("sentAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          sentAt: doc.data().sentAt?.toDate(),
          openedAt: doc.data().openedAt?.toDate(),
        }));
        setLogs(data);
      } catch (err) {
        console.error("خطأ في جلب الهدايا:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // إحصائيات
  const stats = useMemo(() => {
    const total = logs.length;
    const opened = logs.filter((l) => l.isOpened).length;
    const unopened = total - opened;
    const byType = logs.reduce((acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      opened,
      unopened,
      byType,
      openRate: total > 0 ? ((opened / total) * 100).toFixed(1) : 0,
    };
  }, [logs]);

  //حذف من السجل
  const handelDelete = async (giftId) => {
    if (
      !window.confirm(
        "هل أنت متأكد من حذف هذه الهدية نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.",
      )
    ) {
      return;
    }
    try {
      await deleteDoc(doc(db, "gifts", giftId));

      setLogs((prevLogs) => prevLogs.filter((log) => log.id !== giftId));
      alert("تم حذف الهدية بنجاح");
    } catch (error) {
      console.error("خطأ في حذف الهدية:", error);
      alert("حدث خطأ أثناء الحذف، حاول مرة أخرى");
    }
  };

  // الفلترة والبحث
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        searchTerm === "" ||
        (log.targetType === "group"
          ? log.targetValue
          : log.targetValue?.name || ""
        )
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        log.message?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === "all" || log.type === typeFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "opened" ? log.isOpened : !log.isOpened);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [logs, searchTerm, typeFilter, statusFilter]);

  // الترقيم
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6" dir="rtl">
      {/* العنوان */}
      <div className="bg-linear-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-6 shadow-xl">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Gift size={36} />
          سجل المكافآت والجوائز
        </h1>
        <p className="mt-2 text-purple-100">
          تابع كل هدية تم إرسالها ومن فتحها
        </p>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي الهدايا</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.total}
              </p>
            </div>
            <Gift className="w-12 h-12 text-purple-600 opacity-80" />
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-5 shadow-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-600 dark:text-green-400">تم الفتح</p>
          <p className="text-3xl font-bold">{stats.opened}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/30 rounded-xl p-5 shadow-lg border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">لم تُفتح</p>
          <p className="text-3xl font-bold">{stats.unopened}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-5 shadow-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-600 dark:text-blue-400">نسبة الفتح</p>
          <p className="text-3xl font-bold">{stats.openRate}%</p>
        </div>
      </div>

      {/* البحث والفلاتر */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute right-3 top-3 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="ابحث بالاسم أو المجموعة أو الرسالة..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pr-10 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="all">كل الأنواع</option>
            <option value="points">نقاط</option>
            <option value="vip">VIP</option>
            <option value="green_card">Green Card</option>
            <option value="blue_card">Blue Card</option>
            <option value="attendance">حضور احتياطي</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="all">كل الحالات</option>
            <option value="opened">تم الفتح</option>
            <option value="unopened">لم تُفتح</option>
          </select>
        </div>
      </div>

      {/* النتائج */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-gray-200">
            عرض {paginatedLogs.length} من أصل {filteredLogs.length} سجل
          </p>
          {/* <button className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700">
            <Download size={16} />
            تصدير CSV
          </button> */}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 dark:text-gray-300">
                  المرسل إليه
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 dark:text-gray-300">
                  المكافأة
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 dark:text-gray-300">
                  تاريخ الإرسال
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 dark:text-gray-300">
                  الحالة
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 dark:text-gray-300">
                  الرسالة
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 dark:text-gray-300">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    لا توجد سجلات تطابق الفلاتر المحددة
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {log.targetType === "group" ? (
                          <Users className="text-gray-500" size={20} />
                        ) : (
                          <User className="text-gray-500" size={20} />
                        )}
                        <div>
                          <p className="font-medium">
                            {log.targetType === "group"
                              ? log.targetValue
                              : log.targetValue?.name || "غير معروف"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {log.targetType === "group"
                              ? `مجموعة • ${log.studentCount || 0} طالب`
                              : "طالب فردي"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <GiftTypeDisplay type={log.type} amount={log.amount} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.sentAt?.toLocaleString("ar-EG", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }) || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge isOpened={log.isOpened} />
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate"
                      title={log.message}
                    >
                      {log.message || "—"}
                    </td>
                    <td className="px-6 py-4 text-left">
                      <button
                        onClick={() => handelDelete(log.id)}
                        className="text-red-600 hover:text-red-800 font-medium text-sm flex items-center gap-1 transition"
                        title="حذف الهدية نهائياً"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        حذف
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4 p-4">
          {paginatedLogs.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Gift size={48} className="mx-auto mb-4 text-gray-300" />
              <p>لا توجد سجلات تطابق الفلاتر</p>
            </div>
          ) : (
            paginatedLogs.map((log) => (
              <div
                key={log.id}
                className="bg-gray-50 dark:bg-gray-700  rounded-xl p-3 space-y-4 border border-gray-200 dark:border-gray-600"
              >
                <div className="flex flex-wrap justify-between items-start">
                  <div className="flex items-center gap-3">
                    {log.targetType === "group" ? (
                      <Users size={24} className="text-purple-600" />
                    ) : (
                      <User size={24} className="text-indigo-600" />
                    )}
                    <div>
                      <p className="font-bold text-gray-800 dark:text-white">
                        {log.targetType === "group"
                          ? log.targetValue
                          : log.targetValue?.name || "غير معروف"}
                      </p>
                      <p className="text-xs text-gray-300">
                        {log.targetType === "group"
                          ? `مجموعة • ${log.studentCount || 0} طالب`
                          : "طالب فردي"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge isOpened={log.isOpened} />
                    <button
                      onClick={() => handelDelete(log.id)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
                      title="حذف الهدية"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap justify-between items-center text-sm">
                  <GiftTypeDisplay type={log.type} amount={log.amount} />
                  <span className="dark:text-gray-300">
                    {log.sentAt?.toLocaleDateString("ar-EG")}
                  </span>
                </div>

                {log.message && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                    <p className="text-xs dark:text-gray-300 flex items-start gap-2">
                      <MessageSquare size={14} className="mt-0.5" />
                      {log.message}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <ChevronRight size={20} />
            </button>
            <span className="text-sm text-gray-600">
              صفحة {currentPage} من {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GiftsLogDashboard;
