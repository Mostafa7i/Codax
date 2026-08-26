"use client";
import React, { useState, useEffect } from "react";
import { doc, updateDoc, getDoc, collection, getDocs  ,addDoc} from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig";

const TrophyControl = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);
  const [scoreValue, setScoreValue] = useState(""); // 🔹 إدخال عدد النقاط

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const studentsRef = collection(db, "students");
        const querySnapshot = await getDocs(studentsRef);
        const studentsList = querySnapshot.docs.map(doc => ({
          docId: doc.id,
          ...doc.data()
        }));

        setStudents(studentsList);
        setFilteredStudents(studentsList);
      } catch (error) {
        console.error("❌ خطأ أثناء جلب قائمة الطلاب:", error);
      }
    };

    fetchStudents();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearch(value);
    if (value) {
      const results = students.filter(student =>
        student.name.toLowerCase().includes(value)
      );
      setFilteredStudents(results);
    } else {
      setFilteredStudents(students);
    }
    setShowList(true);
  };

  const handleStudentSelect = async (student) => {
    setSelectedStudent(student);
    setSearch(student.name);
    setShowList(false);
  };

  const updateTrophy = async (change) => {
    if (!selectedStudent) {
      alert("⚠️ الرجاء اختيار طالب أولًا!");
      return;
    }

    setLoading(true);
    const studentRef = doc(db, "students", selectedStudent.docId);

    try {
      const studentSnap = await getDoc(studentRef);
      if (!studentSnap.exists()) {
        console.warn(`⚠️ لم يتم العثور على الطالب بالـ ID: ${selectedStudent.docId}`);
        return;
      }

      const currentTrophies = studentSnap.data().trophies || 0;
      const newTrophies = Math.max(0, currentTrophies + change);

      await updateDoc(studentRef, { trophies: newTrophies });

      setSelectedStudent(prev => ({
        ...prev,
        trophies: newTrophies
      }));

      alert(`✅ ${change > 0 ? "تمت إضافة كأس" : "تمت إزالة كأس"} للطالب ${selectedStudent.name}`);
    } catch (error) {
      console.error("❌ خطأ أثناء تحديث الكؤوس:", error);
    }

    setLoading(false);
  };


const updateScore = async (change) => {
  if (!selectedStudent) {
    alert("⚠️ الرجاء اختيار طالب أولًا!");
    return;
  }

  if (isNaN(change) || change === 0) {
    alert("⚠️ الرجاء إدخال عدد صحيح للنقاط.");
    return;
  }

  setLoading(true);
  const studentRef = doc(db, "students", selectedStudent.docId);

  try {
    const studentSnap = await getDoc(studentRef);
    if (!studentSnap.exists()) {
      console.warn(`⚠️ لم يتم العثور على الطالب بالـ ID: ${selectedStudent.docId}`);
      return;
    }

    const currentScore = studentSnap.data().score || 0;
    const newScore = Math.max(0, currentScore + change);

    await updateDoc(studentRef, { score: newScore });

    // تحديث الحالة
    setSelectedStudent(prev => ({
      ...prev,
      score: newScore
    }));

    // ✅ إرسال إشعار تلقائي
    await addDoc(collection(db, "notifications"), {
      recipientId: Number(selectedStudent.id), // مهم جدًا استخدام id مش docId
      message: `Technical حول ${Math.abs(change)} نقطة ${change > 0 ? "إليك" : "منك"}`,
      timestamp: Date.now(), // optional لو حابب ترتبهم لاحقًا بالوقت
    });

    alert(`✅ ${change > 0 ? "تمت إضافة" : "تمت إزالة"} ${Math.abs(change)} نقطة للطالب ${selectedStudent.name}`);
  } catch (error) {
    console.error("❌ خطأ أثناء تحديث النقاط أو إرسال الإشعار:", error);
  }

  setLoading(false);
};


  return (
    <div className="p-2 lg:p-6 bg-white shadow-md rounded-md w-full dark:bg-gray-700">
      <h2 className="text-lg font-semibold mb-2">🏆 إدارة الكؤوس والنقاط</h2>

      <input
        type="text"
        className="p-2 border rounded w-full mb-2 dark:bg-gray-900"
        placeholder="🔍 ابحث عن الطالب..."
        value={search}
        onChange={handleSearch}
        onFocus={() => setShowList(true)}
      />

      {showList && (
        <ul className="border rounded bg-white w-fit shadow-md max-h-40 overflow-y-auto">
          {filteredStudents.length > 0 ? (
            filteredStudents.map(student => (
              <li
                key={student.docId}
                className="p-2 hover:bg-gray-200 cursor-pointer dark:bg-gray-900"
                onClick={() => handleStudentSelect(student)}
              >
                {student.name} ({student.group})
              </li>
            ))
          ) : (
            <li className="p-2 text-gray-500">🚫 لا يوجد نتائج</li>
          )}
        </ul>
      )}

      {selectedStudent && (
        <p className="mt-4 text-lg font-semibold">
          {selectedStudent.name} لديه {selectedStudent.trophies || 0} 🏆 و {selectedStudent.score || 0} 🎯 نقاط
        </p>
      )}

      <div className="flex gap-2 mt-4 flex-wrap">
        {/* أزرار الكؤوس */}
        <button
          onClick={() => updateTrophy(1)}
          className="bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:bg-gray-400"
          disabled={loading || !selectedStudent}
        >
          {loading ? "⏳ ..." : "➕ إضافة كأس"}
        </button>
        <button
          onClick={() => updateTrophy(-1)}
          className="bg-red-500 text-white p-2 rounded hover:bg-red-600 disabled:bg-gray-400"
          disabled={loading || !selectedStudent || (selectedStudent.trophies || 0) === 0}
        >
          {loading ? "⏳ ..." : "➖ إزالة كأس"}
        </button>

        {/* حقل إدخال النقاط */}
        <input
          type="number"
          className="p-2 border rounded w-28 dark:bg-gray-900"
          placeholder="عدد النقاط"
          value={scoreValue}
          onChange={(e) => setScoreValue(e.target.value)}
        />

        {/* أزرار النقاط */}
        
        <button
          onClick={() => updateScore(parseInt(scoreValue))}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
           disabled={loading || !selectedStudent || !scoreValue || isNaN(scoreValue)}
          
        >
          {loading ? "⏳ ..." : "➕ أضف نقاط"}
        </button>
        <button
          onClick={() => updateScore(-parseInt(scoreValue))}
          className="bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600 disabled:bg-gray-400"
          disabled={loading || !selectedStudent || parseInt(scoreValue) <= 0}
        >
          {loading ? "⏳ ..." : "➖ احذف نقاط"}
        </button>
      </div>
    </div>
  );
};

export default React.memo(TrophyControl);
