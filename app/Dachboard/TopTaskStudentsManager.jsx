"use client";
import React, { useState, useEffect } from 'react';
import { db } from '@/app/services/firebaseConfig';
import {doc, setDoc, collection, query, where, getDocs , getDoc, serverTimestamp } from 'firebase/firestore';
import {  FaTrash , FaArrowUp, FaArrowDown } from 'react-icons/fa';
import Select from "react-select";

export default function TopTaskStudentsManager({ selectedGroup }){
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newStudentName, setNewStudentName] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [isLoadingTitle, setIsLoadingTitle] = useState(true);
  const [groupStudents, setGroupStudents] = useState([]);
  
  // Fetch top task students for selected group
  useEffect(() => {
    if (!selectedGroup) return;
    
    const fetchTopTaskStudents = async () => {
      setIsLoading(true);
      setIsLoadingTitle(true);
      try {
        const docRef = doc(db, "topTaskStudents", selectedGroup);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStudents(data.students || []);
          setTaskTitle(data.taskTitle || '');
        } else {
          setStudents([]);
          setTaskTitle('');
        }
      } catch (error) {
        console.error("Error fetching top task students:", error);
      } finally {
        setIsLoading(false);
        setIsLoadingTitle(false);
      }
    };
    
    fetchTopTaskStudents();
  }, [selectedGroup]);





// Fetch group students for select list
useEffect(() => {
  if (!selectedGroup) return;

  const fetchGroupStudents = async () => {
    try {
      const q = query(
        collection(db, "students"),
        where("group", "==", selectedGroup)
      );
      const querySnap = await getDocs(q);
      const studentsList = querySnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGroupStudents(studentsList);
    } catch (error) {
      console.error("Error fetching group students:", error);
    }
  };

  fetchGroupStudents();
}, [selectedGroup]);

  
  // Save task title
  const saveTaskTitle = async () => {
    if (!selectedGroup) return;
    
    try {
      const docRef = doc(db, "topTaskStudents", selectedGroup);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        // Update existing document
        await setDoc(docRef, {
          ...docSnap.data(),
          taskTitle,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new document
        await setDoc(docRef, {
          groupName: selectedGroup,
          taskTitle,
          students: [],
          updatedAt: serverTimestamp()
        });
      }
      
      alert("تم حفظ عنوان التاسك بنجاح!");
    } catch (error) {
      console.error("Error saving task title:", error);
      alert("حدث خطأ أثناء حفظ عنوان التاسك. يرجى المحاولة مرة أخرى.");
    }
  };
  
  const [newStudent, setNewStudent] = useState({ name: "", degree: "", studentId: "", profilePic: "" });

const handleInputChange = (e) => {
  const { value } = e.target;
  const selected = groupStudents.find((s) => s.name === value);
  if (selected) {
    setNewStudent({
      name: selected.name,
      studentId: selected.id,
      profilePic: selected.profilePic || "/default-avatar.png",
    });
  } else {
    setNewStudent({ ...newStudent, name: value });
  }
};

const addStudent = async () => {
  if (!selectedGroup || !newStudent.name.trim()) return;

  try {
    const newStudentObj = {
      id: `student_${Date.now()}`,
      name: newStudent.name.trim(),
      studentId: newStudent.studentId,
      profilePic: newStudent.profilePic,
      rank: students.length + 1,
    };

    const updatedStudents = [...students, newStudentObj];
    updatedStudents.forEach((s, i) => (s.rank = i + 1));

    const docRef = doc(db, "topTaskStudents", selectedGroup);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      await setDoc(docRef, {
        ...docSnap.data(),
        students: updatedStudents,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(docRef, {
        groupName: selectedGroup,
        taskTitle: taskTitle || "",
        students: updatedStudents,
        updatedAt: serverTimestamp(),
      });
    }

    setStudents(updatedStudents);
    setNewStudent({ name: "", studentId: "", profilePic: "" });
  } catch (error) {
    console.error("Error adding student:", error);
    alert("حدث خطأ أثناء إضافة الطالب. يرجى المحاولة مرة أخرى.");
  }
};


  // Delete student
  const deleteStudent = async (studentId) => {
    if (!confirm("هل أنت متأكد من حذف هذا الطالب؟")) return;
    
    try {
      const updatedStudents = students.filter(student => student.id !== studentId)
        .map((student, index) => ({ ...student, rank: index + 1 }));
      
      const docRef = doc(db, "topTaskStudents", selectedGroup);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await setDoc(docRef, {
          ...docSnap.data(),
          students: updatedStudents,
          updatedAt: serverTimestamp()
        });
      }
      
      setStudents(updatedStudents);
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("حدث خطأ أثناء حذف الطالب. يرجى المحاولة مرة أخرى.");
    }
  };
  
  // Move student up in ranking
  const moveStudentUp = async (index) => {
    if (index <= 0) return;
    
    try {
      const updatedStudents = [...students];
      const temp = updatedStudents[index];
      updatedStudents[index] = updatedStudents[index - 1];
      updatedStudents[index - 1] = temp;
      
      // Update ranks
      updatedStudents.forEach((student, i) => {
        student.rank = i + 1;
      });
      
      const docRef = doc(db, "topTaskStudents", selectedGroup);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await setDoc(docRef, {
          ...docSnap.data(),
          students: updatedStudents,
          updatedAt: serverTimestamp()
        });
      }
      
      setStudents(updatedStudents);
    } catch (error) {
      console.error("Error updating student ranking:", error);
      alert("حدث خطأ أثناء تحديث ترتيب الطلاب. يرجى المحاولة مرة أخرى.");
    }
  };
  
  // Move student down in ranking
  const moveStudentDown = async (index) => {
    if (index >= students.length - 1) return;
    
    try {
      const updatedStudents = [...students];
      const temp = updatedStudents[index];
      updatedStudents[index] = updatedStudents[index + 1];
      updatedStudents[index + 1] = temp;
      
      // Update ranks
      updatedStudents.forEach((student, i) => {
        student.rank = i + 1;
      });
      
      const docRef = doc(db, "topTaskStudents", selectedGroup);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await setDoc(docRef, {
          ...docSnap.data(),
          students: updatedStudents,
          updatedAt: serverTimestamp()
        });
      }
      
      setStudents(updatedStudents);
    } catch (error) {
      console.error("Error updating student ranking:", error);
      alert("حدث خطأ أثناء تحديث ترتيب الطلاب. يرجى المحاولة مرة أخرى.");
    }
  };
  
  return (
    <div>
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">إدارة أوائل التاسك - {selectedGroup}</h2>
      
      {/* Task Title Form */}
      <div className="bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 rounded mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3">عنوان التاسك</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            className="shadow appearance-none border rounded dark:bg-gray-900 w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="مثال: التاسك العاشر - JS"
            disabled={isLoadingTitle}
          />
          <button
            type="button"
            onClick={saveTaskTitle}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline sm:ml-2 text-sm sm:text-base"
            disabled={isLoadingTitle}
          >
            حفظ
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          هذا العنوان سيظهر في صفحة أوائل التاسك
        </p>
      </div>
      
      {/* Add Student Form */}
      <div className="bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 rounded mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3">إضافة طالب جديد</h3>
        <div className="flex flex-col sm:flex-row gap-2">
            <Select
              options={groupStudents.map((student) => ({
                value: student.name,
                label: student.name,
                student,
              }))}
              onChange={(selectedOption) => {
                if (selectedOption) {
                  const selected = selectedOption.student;
                  setNewStudent({
                    name: selected.name,
                    studentId: selected.id,
                    profilePic: selected.profilePic || "/default-avatar.png",
                    degree: newStudent.degree,
                  });
                }
              }}
              placeholder="ابحث أو اختر الطالب"
            />

          <button
            type="button"
            onClick={addStudent}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline sm:ml-2 text-sm sm:text-base"
          >
            إضافة
          </button>
        </div>
      </div>
      
      {/* Students List */}
      <div>
        <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3">قائمة الطلاب</h3>
        {isLoading ? (
          <div className="text-center py-4">جاري التحميل...</div>
        ) : students.length > 0 ? (
          <div className="bg-white  border rounded-lg overflow-hidden overflow-x-auto">
            <table className="min-w-full divide-y  divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الترتيب
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    اسم الطالب
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y dark:bg-gray-900  divide-gray-200">
                {students.map((student, index) => (
                  <tr key={student.id}>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm dark:text-gray-300 text-gray-900">
                      {student.rank}
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm dark:text-gray-300 text-gray-900 truncate max-w-[150px] sm:max-w-none">
                      {student.name}
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-1 sm:space-x-2 rtl:space-x-reverse">
                        <button
                          onClick={() => moveStudentUp(index)}
                          disabled={index === 0}
                          className={`text-blue-600 hover:text-blue-900 p-1 ${index === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="نقل لأعلى"
                          aria-label="نقل لأعلى"
                        >
                          <FaArrowUp />
                        </button>
                        <button
                          onClick={() => moveStudentDown(index)}
                          disabled={index === students.length - 1}
                          className={`text-blue-600 hover:text-blue-900 p-1 ${index === students.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="نقل لأسفل"
                          aria-label="نقل لأسفل"
                        >
                          <FaArrowDown />
                        </button>
                        <button
                          onClick={() => deleteStudent(student.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="حذف الطالب"
                          aria-label="حذف الطالب"
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
        ) : (
          <div className="text-center py-4 text-gray-500">لا يوجد طلاب في قائمة أوائل التاسك لهذه المجموعة</div>
        )}
      </div>
    </div>
  );
};