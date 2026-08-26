"use client";
import React, { useState, useEffect } from "react";
import { db } from "@/app/services/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Search, Calendar, TrendingUp, Users, ArrowUpCircle } from "lucide-react";

const ReserveConversionDashboard = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month
  const [sortBy, setSortBy] = useState("totalConverted"); // totalConverted, recentDate, name

  useEffect(() => {
    fetchStudentsWithConversions();
  }, []);

  const fetchStudentsWithConversions = async () => {
    try {
      setLoading(true);
      
      // جلب جميع الطلاب
      const studentsRef = collection(db, "students");
      const snapshot = await getDocs(studentsRef);
      
      const studentsData = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const buyingHistory = data.buyingHistory || [];
        
        // البحث عن عمليات تحويل الحضور الاحتياطي
        const conversions = buyingHistory.filter(item => item.type === "convertReserve");
        
        if (conversions.length > 0) {
          // حساب إجمالي التحويلات
          const totalReserveConverted = conversions.reduce((sum, conv) => sum + (conv.quantity || 0), 0);
          const totalPointsGained = conversions.reduce((sum, conv) => sum + (conv.pointsGained || 0), 0);
          
          // آخر عملية تحويل
          const latestConversion = conversions.sort((a, b) => 
            new Date(b.date) - new Date(a.date)
          )[0];
          
          studentsData.push({
            id: data.id,
            name: data.name || `طالب ${data.id}`,
            totalReserveConverted,
            totalPointsGained,
            conversionsCount: conversions.length,
            latestConversionDate: latestConversion.date,
            latestConversion,
            conversions,
            currentScore: data.score || 0,
            currentReserveAttendance: data.reserveAttendance || 0,
          });
        }
      });
      
      setStudents(studentsData);
    } catch (error) {
      console.error("Error fetching conversion data:", error);
    } finally {
      setLoading(false);
    }
  };

  // تصفية البيانات حسب البحث والتاريخ
  const filteredStudents = students.filter(student => {
    // تصفية البحث
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.id.toString().includes(searchTerm);
    
    // تصفية التاريخ
    if (dateFilter === "all") return matchesSearch;
    
    const now = new Date();
    const conversionDate = new Date(student.latestConversionDate);
    
    switch (dateFilter) {
      case "today":
        return matchesSearch && conversionDate.toDateString() === now.toDateString();
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return matchesSearch && conversionDate >= weekAgo;
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return matchesSearch && conversionDate >= monthAgo;
      default:
        return matchesSearch;
    }
  });

  // ترتيب البيانات
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    switch (sortBy) {
      case "totalConverted":
        return b.totalReserveConverted - a.totalReserveConverted;
      case "recentDate":
        return new Date(b.latestConversionDate) - new Date(a.latestConversionDate);
      case "name":
        return a.name.localeCompare(b.name, 'ar');
      default:
        return 0;
    }
  });

  // إحصائيات عامة
  const totalStudentsConverted = students.length;
  const totalReserveConverted = students.reduce((sum, student) => sum + student.totalReserveConverted, 0);
  const totalPointsGained = students.reduce((sum, student) => sum + student.totalPointsGained, 0);
  const averageConversionsPerStudent = totalStudentsConverted > 0 
    ? (students.reduce((sum, student) => sum + student.conversionsCount, 0) / totalStudentsConverted).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-lg">جاري تحميل البيانات...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* العنوان */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            تقرير تحويل الحضور الاحتياطي إلى نقاط
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            عرض جميع الطلاب الذين قاموا بتحويل حضورهم الاحتياطي إلى نقاط
          </p>
        </div>

        {/* الإحصائيات العامة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600 ml-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">عدد الطلاب</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {totalStudentsConverted}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <ArrowUpCircle className="w-8 h-8 text-orange-600 ml-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">إجمالي المحول</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {totalReserveConverted}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-600 ml-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">إجمالي النقاط</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {totalPointsGained}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-purple-600 ml-3" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">متوسط العمليات</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {averageConversionsPerStudent}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* أدوات البحث والتصفية */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* البحث */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="البحث بالاسم أو الرقم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              />
            </div>

            {/* تصفية التاريخ */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              <option value="all">جميع التواريخ</option>
              <option value="today">اليوم</option>
              <option value="week">آخر أسبوع</option>
              <option value="month">آخر شهر</option>
            </select>

            {/* الترتيب */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              <option value="totalConverted">الأكثر تحويلاً</option>
              <option value="recentDate">الأحدث</option>
              <option value="name">الاسم (أبجدي)</option>
            </select>
          </div>
        </div>

        {/* جدول النتائج */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    الطالب
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    إجمالي المحول
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    النقاط المكتسبة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    عدد العمليات
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    آخر تحويل
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    الرصيد الحالي
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    تفاصيل
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                {sortedStudents.map((student, index) => (
                  <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {student.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-300">
                          ID: {student.id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-orange-600">
                        {student.totalReserveConverted}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-green-600">
                        +{student.totalPointsGained}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                        {student.conversionsCount} عملية
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {new Date(student.latestConversionDate).toLocaleDateString("ar-EG", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-green-600 font-medium">
                          {student.currentScore} نقطة
                        </div>
                        <div className="text-orange-600 text-xs">
                          {student.currentReserveAttendance} احتياطي
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <details className="relative">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm">
                          عرض التفاصيل
                        </summary>
                        <div className="absolute left-0 top-6 z-10 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-4 min-w-80">
                          <h4 className="font-bold mb-2">سجل التحويلات:</h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {student.conversions.map((conv, idx) => (
                              <div key={idx} className="text-xs p-2 bg-gray-50 dark:bg-gray-600 rounded">
                                <div className="flex justify-between">
                                  <span>{conv.quantity} حضور</span>
                                  <span className="text-green-600">+{conv.pointsGained} نقطة</span>
                                </div>
                                <div className="text-gray-500 dark:text-gray-400">
                                  {new Date(conv.date).toLocaleDateString("ar-EG", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {sortedStudents.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 text-lg">
              {searchTerm || dateFilter !== "all" 
                ? "لا توجد نتائج تطابق معايير البحث"
                : "لا توجد عمليات تحويل حضور احتياطي مسجلة"
              }
            </div>
          </div>
        )}

        {/* معلومات إضافية */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            <strong>ملاحظة:</strong> معدل التحويل المستخدم هو 1 حضور احتياطي = 5 نقاط
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReserveConversionDashboard;