"use client";
import React, { useState, useEffect, useCallback } from "react";
import { db } from "@/app/services/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { FaEdit, FaTrash, FaSave, FaTimes, FaPlus } from "react-icons/fa";
import Select from "react-select";

// --- المكون الرئيسي ---
export default function TopTestStudentsManager({ selectedGroup }) {
  // --- حالات لإدارة البيانات ---
  const [students, setStudents] = useState([]);
  const [testTitle, setTestTitle] = useState("");
  const [groupStudents, setGroupStudents] = useState([]); // قائمة طلاب المجموعة للاختيار منها

  // --- حالات لإدارة واجهة المستخدم ---
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [newStudent, setNewStudent] = useState({
    name: "",
    degree: "",
    studentId: "",
    profilePic: "",
  });
  const [selectedStudentOption, setSelectedStudentOption] = useState(null); // حالة خاصة بـ react-select
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // [جديد] لتتبع التغييرات
  const [isSaving, setIsSaving] = useState(false);

  // --- جلب البيانات الأولية ---
  const fetchData = useCallback(async () => {
    if (!selectedGroup) return;
    setIsLoading(true);
    try {
      // جلب بيانات الاختبار والطلاب الأوائل
      const testDocRef = doc(db, "topTestStudents", selectedGroup);
      const testDocSnap = await getDoc(testDocRef);
      if (testDocSnap.exists()) {
        const data = testDocSnap.data();
        setStudents(data.students || []);
        setTestTitle(data.testTitle || "");
      } else {
        setStudents([]);
        setTestTitle("");
      }

      // جلب قائمة كل طلاب المجموعة
      const studentsQuery = query(
        collection(db, "students"),
        where("group", "==", selectedGroup)
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      const list = studentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGroupStudents(list);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
      setHasUnsavedChanges(false); // إعادة تعيين عند تحميل بيانات جديدة
    }
  }, [selectedGroup]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- دوال التعديل المحلية (بدون حفظ مباشر) ---

  const handleTitleChange = (e) => {
    setTestTitle(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleAddOrUpdateStudent = () => {
    if (!selectedStudentOption || !newStudent.degree) {
      alert("يرجى اختيار طالب وإدخال الدرجة.");
      return;
    }

    const studentData = selectedStudentOption.student;
    let updatedStudents;

    if (isEditing) {
      // تعديل طالب موجود
      updatedStudents = students.map((s) =>
        s.id === editingStudentId
          ? { ...s, degree: parseInt(newStudent.degree) || 0 }
          : s
      );
    } else {
      // إضافة طالب جديد مع التأكد من عدم وجوده مسبقًا
      const isAlreadyAdded = students.some(
        (s) => s.studentId === studentData.id
      );
      if (isAlreadyAdded) {
        alert("هذا الطالب مضاف بالفعل إلى القائمة.");
        return;
      }
      const newStudentObj = {
        id: `student_${Date.now()}`,
        name: studentData.name,
        degree: parseInt(newStudent.degree) || 0,
        studentId: studentData.id, // استخدام المعرف الرقمي
        profilePic: studentData.profilePic || "",
      };
      updatedStudents = [...students, newStudentObj];
    }

    // إعادة ترتيب وتحديث الحالة المحلية
    updatedStudents.sort((a, b) => b.degree - a.degree);
    updatedStudents.forEach((s, index) => {
      s.rank = index + 1;
    });

    setStudents(updatedStudents);
    setHasUnsavedChanges(true);
    cancelEditing(); // إعادة تعيين النموذج
  };

  const deleteStudent = (studentId) => {
    if (!confirm("هل أنت متأكد من حذف هذا الطالب؟")) return;
    const updatedStudents = students.filter((s) => s.id !== studentId);
    updatedStudents.sort((a, b) => b.degree - a.degree);
    updatedStudents.forEach((s, index) => {
      s.rank = index + 1;
    });
    setStudents(updatedStudents);
    setHasUnsavedChanges(true);
  };

  const editStudent = (student) => {
    const studentOption = groupStudents.find((s) => s.id === student.studentId);
    setSelectedStudentOption(
      studentOption
        ? {
            value: studentOption.name,
            label: studentOption.name,
            student: studentOption,
          }
        : null
    );
    setNewStudent({ ...student, degree: student.degree.toString() });
    setIsEditing(true);
    setEditingStudentId(student.id);
  };

  const cancelEditing = () => {
    setNewStudent({ name: "", degree: "", studentId: "", profilePic: "" });
    setSelectedStudentOption(null);
    setIsEditing(false);
    setEditingStudentId(null);
  };

  // --- [الحل] دالة الحفظ الموحدة مع الحفاظ على سجل الاختبارات السابقة ---
  const saveAllChanges = async () => {
    if (!selectedGroup) return;
    setIsSaving(true);
    try {
      const docRef = doc(db, "topTestStudents", selectedGroup);
      const docSnap = await getDoc(docRef);
      const existingData = docSnap.exists() ? docSnap.data() : {};
      const existingHistory = Array.isArray(existingData.history) ? existingData.history : [];

      let updatedHistory = [...existingHistory];
      if (existingData.testTitle && Array.isArray(existingData.students) && existingData.students.length > 0) {
        const isSameTitle = existingData.testTitle === testTitle;
        const isSameStudents = JSON.stringify(existingData.students) === JSON.stringify(students);
        if (!isSameTitle || !isSameStudents) {
          const alreadyArchived = updatedHistory.some(
            (h) => h.testTitle === existingData.testTitle && JSON.stringify(h.students) === JSON.stringify(existingData.students)
          );
          if (!alreadyArchived) {
            updatedHistory.unshift({
              id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              testTitle: existingData.testTitle,
              students: existingData.students,
              date: existingData.updatedAt?.toDate ? existingData.updatedAt.toDate().toISOString() : new Date().toISOString(),
              groupName: selectedGroup,
            });
          }
        }
      }

      // بناء الكائن الذي سيتم حفظه
      const dataToSave = {
        groupName: selectedGroup,
        testTitle: testTitle || "",
        students: students,
        history: updatedHistory,
        updatedAt: serverTimestamp(),
      };
      await setDoc(docRef, dataToSave, { merge: true });
      setHasUnsavedChanges(false);
      alert("تم حفظ كل التغييرات وتحديث سجل الاختبارات السابقة بنجاح!");
    } catch (error) {
      console.error("Error saving all changes:", error);
      alert("حدث خطأ أثناء حفظ التغييرات.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- العرض ---
  if (isLoading) return <div className="text-center py-4">جاري التحميل...</div>;

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-semibold mb-4">
        إدارة أوائل الاختبار - {selectedGroup}
      </h2>

      {/* Test Title Form */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-medium mb-2 flex items-center">
          عنوان الاختبار
          {hasUnsavedChanges && (
            <span
              className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"
              title="تغييرات غير محفوظة"
            ></span>
          )}
        </h3>
        <input
          type="text"
          value={testTitle}
          onChange={handleTitleChange}
          className="shadow-sm appearance-none dark:bg-gray-900 border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200"
          placeholder="مثال: الاختبار النهائي - JS"
        />
      </div>

      {/* Add/Edit Student Form */}
      <div
        id="test-student-form"
        className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6"
      >
        <h3 className="text-lg font-medium mb-3">
          {isEditing ? "تعديل درجة الطالب" : "إضافة طالب للقائمة"}
        </h3>
        <div className="space-y-4">
          <Select
            options={groupStudents.map((s) => ({
              value: s.name,
              label: `${s.name} (${s.id})`,
              student: s,
            }))}
            value={selectedStudentOption}
            onChange={(option) => {
              setSelectedStudentOption(option);
              setNewStudent((prev) => ({
                ...prev,
                degree: isEditing ? prev.degree : "",
              }));
            }}
            placeholder="ابحث أو اختر الطالب"
            isDisabled={isEditing}
            styles={{ menu: (base) => ({ ...base, zIndex: 9999 }) }}
          />
          <input
            type="number"
            value={newStudent.degree}
            onChange={(e) =>
              setNewStudent((prev) => ({ ...prev, degree: e.target.value }))
            }
            className="shadow-sm appearance-none dark:bg-gray-900 border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200"
            placeholder="درجة الطالب"
            min="0"
            max="100"
            required
          />
          <div className="flex justify-end gap-2">
            {isEditing && (
              <button
                type="button"
                onClick={cancelEditing}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded flex items-center"
              >
                <FaTimes className="mr-2" /> إلغاء
              </button>
            )}
            <button
              type="button"
              onClick={handleAddOrUpdateStudent}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded flex items-center"
            >
              {isEditing ? (
                <FaSave className="mr-2" />
              ) : (
                <FaPlus className="mr-2" />
              )}
              {isEditing ? "تعديل الدرجة" : "إضافة للقائمة"}
            </button>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div>
        <h3 className="text-lg font-medium mb-3">
          قائمة الطلاب ({students.length})
        </h3>
        {students.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      الترتيب
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      اسم الطالب
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      الدرجة
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td className="px-4 py-4 dark:text-gray-300">
                        {student.rank}
                      </td>
                      <td className="px-4 py-4 dark:text-gray-300">
                        {student.name}
                      </td>
                      <td className="px-4 py-4 dark:text-gray-300">
                        {student.degree}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => editStudent(student)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="تعديل"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => deleteStudent(student.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="حذف"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            لا يوجد طلاب في القائمة بعد.
          </div>
        )}
      </div>

      {/* --- [الحل] زر الحفظ الموحد --- */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800/90 backdrop-blur-sm p-4 flex justify-center items-center gap-4 z-50">
          <p className="text-white">لديك تغييرات غير محفوظة!</p>
          <button
            onClick={saveAllChanges}
            disabled={isSaving}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg flex items-center disabled:opacity-50"
          >
            {isSaving ? (
              "جاري الحفظ..."
            ) : (
              <>
                <FaSave className="mr-2" /> حفظ كل التغييرات
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
