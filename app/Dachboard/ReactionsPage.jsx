"use client";
import React, { useEffect, useState, useMemo, memo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig";
import { ThumbsUp, ThumbsDown, User, Hash, Search, Loader, Users } from "lucide-react";
import ReactionLogsTable from "./ReactionLogsTable";

// --- مكونات فرعية لتحسين العرض ---

// 1. بطاقة الطالب
const StudentReactionCard = memo(({ student, getStudentNameById }) => (
  <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-5 border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-700">
    <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
      <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate flex items-center gap-2">
        <User size={20} className="text-purple-500" />
        {student.name}
      </h3>
      <span className="text-sm text-gray-400 dark:text-gray-500 font-mono">ID: {student.id}</span>
    </div>

    <div className="space-y-5">
      {/* قسم الإعجابات */}
      <div>
        <div className="flex items-center text-blue-600 dark:text-blue-400 font-semibold mb-2">
          <ThumbsUp size={18} className="mr-2" />
          <span>أعجب به ({student.likedBy?.length || 0})</span>
        </div>
        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1 rounded-md bg-gray-50 dark:bg-gray-900/50">
          {student.likedBy?.length > 0 ? (
            student.likedBy.map((entry, i) => (
              <div key={`like-${i}`} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                <User size={12} /> {getStudentNameById(entry.likerId)}
                <span className="text-blue-600">|</span>
                <Hash size={12} /> {entry.lectureNumber}
              </div>
            ))
          ) : (
            <span className="text-gray-500 text-sm px-2">لا توجد إعجابات</span>
          )}
        </div>
      </div>

      {/* قسم عدم الإعجاب */}
      <div>
        <div className="flex items-center text-red-600 dark:text-red-400 font-semibold mb-2">
          <ThumbsDown size={18} className="mr-2" />
          <span>لم يعجب به ({student.dislikedBy?.length || 0})</span>
        </div>
        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1 rounded-md bg-gray-50 dark:bg-gray-900/50">
          {student.dislikedBy?.length > 0 ? (
            student.dislikedBy.map((entry, i) => (
              <div key={`dislike-${i}`} className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                <User size={12} /> {getStudentNameById(entry.dislikerId)}
                <span className="text-red-600">|</span>
                <Hash size={12} /> {entry.lectureNumber}
              </div>
            ))
          ) : (
            <span className="text-gray-500 text-sm px-2">لا يوجد رفض</span>
          )}
        </div>
      </div>
    </div>
  </div>
));

// --- المكون الرئيسي ---
const ReactionsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const snapshot = await getDocs(collection(db, "students"));
        const studentList = snapshot.docs.map((doc) => doc.data());
        setStudents(studentList);
      } catch (error) {
        console.error("Error fetching students:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const getStudentNameById = useMemo(() => {
    const nameMap = new Map(students.map(s => [s.id, s.name]));
    return (id) => nameMap.get(id) || `ID: ${id}`;
  }, [students]);

  const filteredAndSortedStudents = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    const isLectureNumber = !isNaN(search) && search !== "";

    return students
      .map((student) => {
        let filteredLikedBy = student.likedBy || [];
        let filteredDislikedBy = student.dislikedBy || [];

        if (isLectureNumber) {
          filteredLikedBy = filteredLikedBy.filter(e => e.lectureNumber?.toString() === search);
          filteredDislikedBy = filteredDislikedBy.filter(e => e.lectureNumber?.toString() === search);
        }

        const matchesName = !isLectureNumber && student.name?.toLowerCase().includes(search);
        const hasReactionsInLecture = isLectureNumber && (filteredLikedBy.length > 0 || filteredDislikedBy.length > 0);

        if (search === "" || matchesName || hasReactionsInLecture) {
          return { ...student, likedBy: filteredLikedBy, dislikedBy: filteredDislikedBy };
        }
        return null;
      })
      .filter(Boolean)
      .filter(student => {
        if (filterType === 'liked') return (student.likedBy?.length || 0) > 0;
        if (filterType === 'disliked') return (student.dislikedBy?.length || 0) > 0;
        return true;
      })
      .sort((a, b) => (b.likedBy?.length || 0) - (a.likedBy?.length || 0));
  }, [students, searchTerm, filterType]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8" dir="rtl">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center justify-center gap-3">
          <Users className="text-purple-500" />
          لوحة تفاعلات الطلاب
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          عرض وتحليل الإعجابات وعدم الإعجاب بين الطلاب.
        </p>
      </div>

      {/* Logs Table */}
      <ReactionLogsTable />

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border dark:border-gray-700 flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:flex-1">
          <Search className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="ابحث بالاسم أو رقم المحاضرة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-10 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1 w-full md:w-auto">
          <button onClick={() => setFilterType('all')} className={`flex-1 p-2 text-sm font-semibold rounded-md transition-colors ${filterType === 'all' ? 'bg-purple-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}>الكل</button>
          <button onClick={() => setFilterType('liked')} className={`flex-1 p-2 text-sm font-semibold rounded-md transition-colors ${filterType === 'liked' ? 'bg-purple-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}>أعجب به</button>
          <button onClick={() => setFilterType('disliked')} className={`flex-1 p-2 text-sm font-semibold rounded-md transition-colors ${filterType === 'disliked' ? 'bg-purple-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}>لم يعجب به</button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-10"><Loader className="animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedStudents.length > 0 ? (
            filteredAndSortedStudents.map((student) => (
              <StudentReactionCard key={student.id} student={student} getStudentNameById={getStudentNameById} />
            ))
          ) : (
            <div className="col-span-full text-center py-10 text-gray-500">
              <p>لا توجد نتائج تطابق معايير البحث والتصفية الحالية.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(ReactionsPage);
