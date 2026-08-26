import React, { useState, useEffect } from 'react';
import { db } from '@/app/services/firebaseConfig';
import { collection, getDocs, query, where, or } from 'firebase/firestore';
import { Gift, Loader, Star, CalendarPlus, Users } from 'lucide-react';

const GiftStu = ({ studentId, studentGroupId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const numericStudentId = Number(studentId);
    if (!numericStudentId) {
      console.error('[GiftStu] Invalid or missing studentId. Aborting fetch.');
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const giftsRef = collection(db, 'gifts');

        // 🟢 الاستعلام الأول: المكافآت الخاصة بالطالب
        const studentQuery = query(
          giftsRef,
          where('targetType', '==', 'student'),
          where('targetValue.id', '==', numericStudentId),
          where('isOpened', '==', true)
        );

        // 🟢 الاستعلام الثاني: المكافآت الخاصة بالجروب (لو موجود)
        let groupQuerySnapshot = { docs: [] };
        if (studentGroupId) {
          const groupQuery = query(
            giftsRef,
            where('targetType', '==', 'group'),
            where('targetValue.groupId', '==', studentGroupId),
            where('isOpened', '==', true)
          );
          groupQuerySnapshot = await getDocs(groupQuery);
        }

        // 📦 تنفيذ الاستعلام الأول
        const studentSnapshot = await getDocs(studentQuery);

        // 🧩 دمج النتائج
        const fetchedGifts = [
          ...studentSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            source: 'student', // لتوضيح المصدر
          })),
          ...groupQuerySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            source: 'group',
          })),
        ];

        // 🔽 ترتيبهم حسب وقت الفتح
        fetchedGifts.sort(
          (a, b) => (b.openedAt?.toDate() || 0) - (a.openedAt?.toDate() || 0)
        );

        setHistory(fetchedGifts);
      } catch (err) {
        console.error('[GiftStu] Error fetching gift history:', err);
        setError('حدث خطأ أثناء جلب سجل المكافآت.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [studentId, studentGroupId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader className="animate-spin text-purple-500" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 p-8">{error}</div>;
  }

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg" dir="rtl">
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
        <Gift className="ml-2 text-purple-500" />
        سجل المكافآت المستلمة ({history.length})
      </h3>

      {history.length > 0 ? (
        <div className="space-y-4 max-h-80 overflow-scroll">
          {history.map(item => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-700 dark:text-gray-200 text-sm">
                    {item.message}
                  </p>
                  {/* 🟣 إظهار نوع الهدف */}
                  <p className="text-xs text-gray-400 mt-1">
                    🎯 النوع: {item.source === 'group' ? 'مكافأة جماعية' : 'مكافأة فردية'}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm font-semibold">
                  {item.type === 'attendance' ? (
                    <CalendarPlus size={16} className="text-blue-500" />
                  ) : item.type === 'points' ? (
                    <Star size={16} className="text-yellow-500" />
                  ) : (
                    <Users size={16} className="text-purple-500" />
                  )}
                  <span>+{item.amount}</span>
                </div>
              </div>

              <div className="text-left text-xs text-gray-400 dark:text-gray-500 mt-2">
                {item.openedAt?.toDate().toLocaleString('ar-EG', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>لا توجد مكافآت مستلمة في سجلك حتى الآن.</p>
        </div>
      )}
    </div>
  );
};

export default GiftStu;
