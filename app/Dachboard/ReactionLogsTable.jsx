"use client";

import React, { useEffect, useState } from "react";
import { getReactionViewLogs } from "@/app/hooks/allHooks"; 

const ReactionLogsTable = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const logsData = await getReactionViewLogs();
        setLogs(logsData);
      } catch (error) {
        console.error("فشل في جلب السجلات:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="p-4" dir="rtl">
      <h2 className="text-sm font-bold mb-4">سجل مشاهدة التفاعلات</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full border text-xs border-gray-300 text-right">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="px-2 py-2 border">#</th>
              <th className="px-2 py-2 border">(اللي استخدم الميزة)</th>
              <th className="px-2 py-2 border">شاهد تفاعلات مين</th>
              <th className="px-2 py-2 border">الوقت</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-500">
                  جاري تحميل البيانات...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-500">
                  لا يوجد بيانات حالياً
                </td>
              </tr>
            ) : (
              logs.map((log, index) => (
                <tr key={log.id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-2 py-2 border">{index + 1}</td>
                  <td className="px-2 py-2 border font-medium">{log.studentName || "غير محدد"}</td>
                  <td className="px-2 py-2 border font-medium">{log.targetName || "غير محدد"}</td>
                  <td className="px-2 py-2 border text-gray-500">
                    {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString("ar-EG") : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(ReactionLogsTable);