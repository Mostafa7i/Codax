"use client";
import React, { useState, useEffect } from 'react';
import { db } from '@/app/services/firebaseConfig';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';

const CountdownControl = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [newQuizTime, setNewQuizTime] = useState('');
    const [quizPassword, setQuizPassword] = useState('');
  const [quizStatus, setQuizStatus] = useState('active'); 
  // ✅ الخطوة 1: إضافة حالة لتخزين رابط الاختبار
  const [quizLink, setQuizLink] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // جلب المجموعات
  useEffect(() => {
    const fetchGroups = async () => {
      setIsLoading(true);
      try {
        const groupsSnapshot = await getDocs(collection(db, 'groupTasks'));
        const groupsList = groupsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().groupName,
        }));
        setGroups(groupsList);
        if (groupsList.length > 0) {
          setSelectedGroup(groupsList[0].id); // اختيار أول مجموعة
        }
      } catch (error) {
        console.error("خطأ في جلب المجموعات:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGroups();
  }, []);

  // ✅ الخطوة 2: جلب بيانات المجموعة الحالية عند تغيير الاختيار
  useEffect(() => {
    if (!selectedGroup) return;

    const fetchGroupData = async () => {
      const groupDocRef = doc(db, 'groupTasks', selectedGroup);
      const docSnap = await getDoc(groupDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        // تعبئة الحقول بالبيانات الحالية من Firestore
        setQuizLink(data.quizLink || ''); // جلب الرابط الحالي أو وضع نص فارغ
          setQuizPassword(data.quizPassword || '');
        setQuizStatus(data.quizStatus || 'active'); // القيمة الافتراضية هي 'active'
        if (data.quizDeadline) {
          // تحويل التاريخ من ISO إلى تنسيق مناسب لـ datetime-local
          const date = new Date(data.quizDeadline);
          // تنسيق التاريخ ليتوافق مع حقل الإدخال
          const formattedDate = date.toISOString().slice(0, 16);
          setNewQuizTime(formattedDate);
        } else {
          setNewQuizTime('');
        }
      }
    };
    fetchGroupData();
  }, [selectedGroup]); // يتم تشغيله عند تغيير المجموعة المختارة

  // ✅ الخطوة 3: تحديث دالة الحفظ لتشمل الرابط
  const updateQuizData = async () => {
    if (!selectedGroup || !newQuizTime || !quizLink) {
      alert("الرجاء إكمال حقول الوقت والرابط على الأقل!");
      return;
    }

    setIsUpdating(true);
    try {
      const groupDocRef = doc(db, 'groupTasks', selectedGroup);
      const targetDate = new Date(newQuizTime);
      const quizDeadlineISO = targetDate.toISOString();

      // ✅ تحديث كل الحقول معاً
      await updateDoc(groupDocRef, {
        quizDeadline: quizDeadlineISO,
        quizLink: quizLink,
        quizPassword: quizPassword, // حفظ كلمة المرور
        quizStatus: quizStatus,     // حفظ حالة الاختبار
      });

      alert(`✅ تم تحديث بيانات الاختبار لمجموعة "${groups.find(g => g.id === selectedGroup).name}" بنجاح!`);
    } catch (error) {
      console.error("خطأ أثناء تحديث بيانات الاختبار:", error);
      alert("❌ حدث خطأ أثناء التحديث.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <p>جارِ تحميل بيانات التحكم...</p>;
  }

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">⚙️ التحكم في الاختبار</h2>
      

      <div className="mb-4">
        <label htmlFor="quiz-group-select" className="block text-sm font-medium text-gray-700 mb-1">اختر المجموعة:</label>
        <select id="quiz-group-select" value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="border p-2 rounded w-full bg-gray-50">
          {groups.map((group) => (<option key={group.id} value={group.id}>{group.name}</option>))}
        </select>
      </div>


  {/* ✅ الخطوة 2: إضافة حقل كلمة المرور */}
      <div className="mb-4">
        <label htmlFor="quiz-password-input" className="block text-sm font-medium text-gray-700 mb-1">
          كلمة سر الاختبار (اتركه فارغاً إذا لا تريد):
        </label>
        <input
          id="quiz-password-input"
          type="text"
          placeholder="مثال: 12345"
          value={quizPassword}
          onChange={(e) => setQuizPassword(e.target.value)}
          className="border p-2 rounded w-full"
          disabled={!selectedGroup}
        />
      </div>
   <div className="mb-4">
        <label htmlFor="quiz-status-select" className="block text-sm font-medium text-gray-700 mb-1">
          حالة الاختبار:
        </label>
        <select
          id="quiz-status-select"
          value={quizStatus}
          onChange={(e) => setQuizStatus(e.target.value)}
          className="border p-2 rounded w-full bg-gray-50"
          disabled={!selectedGroup}
        >
          <option value="active">نشط (يظهر للطلاب)</option>
          <option value="finished">منتهي (مخفي عن الطلاب)</option>
        </select>
      </div>
      {/* ... (حقل إدخال الوقت يبقى كما هو) ... */}
      <div className="mb-4">
        <label htmlFor="quiz-datetime-input" className="block text-sm font-medium text-gray-700 mb-1">حدد موعد بداية الاختبار:</label>
        <input id="quiz-datetime-input" type="datetime-local" value={newQuizTime} onChange={(e) => setNewQuizTime(e.target.value)} className="border p-2 rounded w-full" disabled={!selectedGroup} />
      </div>

      {/* ✅ الخطوة 4: إضافة حقل إدخال رابط الاختبار */}
      <div className="mb-4">
        <label htmlFor="quiz-link-input" className="block text-sm font-medium text-gray-700 mb-1">
          أدخل رابط الاختبار (مثل Google Form):
        </label>
        <input
          id="quiz-link-input"
          type="url"
          placeholder="https://docs.google.com/forms/..."
          value={quizLink}
          onChange={(e ) => setQuizLink(e.target.value)}
          className="border p-2 rounded w-full"
          disabled={!selectedGroup}
        />
      </div>

      <button onClick={updateQuizData} disabled={isUpdating || !selectedGroup} className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition disabled:bg-gray-400">
        {isUpdating ? 'جارِ التحديث...' : 'حفظ بيانات الاختبار 📝'}
      </button>
    </div>
  );
};

export default React.memo(CountdownControl);
