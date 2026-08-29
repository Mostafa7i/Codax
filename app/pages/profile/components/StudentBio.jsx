"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig";
import Swal from "sweetalert2";
import { Award, Crown, Loader2, Eye, EyeOff, Sparkles } from "lucide-react";
import { getTopStudents } from "@/app/components/calculations";
import ComplaintBox from "@/app/pages/profile/components/ComplaintBox";

const StudentBio = ({ studentId }) => {
  const [studentData, setStudentData] = useState(null);
  const [rank, setRank] = useState(null);
  const [bio, setBio] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [studentDocId, setStudentDocId] = useState(null);
  const [showBio, setShowBio] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const maxLength = 27;

  // حساب الترتيب + هل هو الأول؟
  const { rankDisplay, isTop } = useMemo(() => {
    if (!rank) return { rankDisplay: "-", isTop: false };
    const isTop = rank === 1;
    return { rankDisplay: `#${rank}`, isTop };
  }, [rank]);

  // جلب البيانات (مُحسّنة بـ useCallback عشان الاستقرار)
  useEffect(() => {
    if (!studentId) {
      setIsLoading(false);
      return;
    }

    const fetchStudentData = async () => {
      setIsLoading(true);
      try {
        const q = query(
          collection(db, "students"),
          where("id", "==", Number(studentId)),
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setIsLoading(false);
          return;
        }

        const docSnap = snapshot.docs[0];
        const data = docSnap.data();

        setStudentData(data);
        setStudentDocId(docSnap.id);
        setBio(data.bio || "");
        setCharCount((data.bio || "").length);
        setShowBio(data.showBio ?? true);

        // لو مفيش مجموعة → خلاص مفيش ترتيب
        if (!data.group) {
          setRank(null);
          setIsLoading(false);
          return;
        }

        // جلب عدد المحاضرات + طلاب المجموعة
        const [groupSnap, lecturesDoc] = await Promise.all([
          getDocs(
            query(collection(db, "students"), where("group", "==", data.group)),
          ),
          getDoc(doc(db, "lectures", "groups")),
        ]);

        const groupStudents = groupSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        const latestLecture = lecturesDoc.data()?.[data.group]?.count || 0;

        const rankedList = getTopStudents(groupStudents, latestLecture);
        const currentStudent = rankedList.find(
          (s) => s.id === Number(studentId),
        );

        setRank(currentStudent?.rank || null);
      } catch (err) {
        console.error("Error fetching student bio data:", err);
        Swal.fire("خطأ", "فشل تحميل البيانات", "error");
        setRank(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [studentId]);

  // تحديث النبذة والحالة المزاجية
  const handleBioChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setBio(value);
      setCharCount(value.length);
    }
  };

  // دالة الحفظ التلقائي
  const autoSaveBio = useCallback(
    async (newBio) => {
      if (!studentDocId || isSaving || newBio.trim() === studentData?.bio)
        return;

      setIsSaving(true);
      try {
        await updateDoc(doc(db, "students", studentDocId), {
          bio: newBio.trim(),
        });
        setStudentData((prev) => ({ ...prev, bio: newBio.trim() })); // تحديث فوري

        // لا يوجد تنبيه نجاح مرئي للحفظ التلقائي، فقط تحديث حالة الحفظ
      } catch (err) {
        Swal.fire("خطأ", "فشل الحفظ التلقائي للنبذة", "error");
      } finally {
        setIsSaving(false);
      }
    },
    [studentDocId, isSaving, studentData?.bio],
  );

  // تأثير الحفظ التلقائي مع تأخير (Debounce)
  useEffect(() => {
    if (bio === studentData?.bio) return; // لا تحفظ إذا لم يتغير شيء عن آخر حالة محفوظة

    const handler = setTimeout(() => {
      autoSaveBio(bio);
    }, 1000); // تأخير ثانية واحدة قبل الحفظ

    return () => {
      clearTimeout(handler);
    };
  }, [bio, studentData?.bio, autoSaveBio]);

  // تبديل إظهار النبذة
  const toggleShowBio = async () => {
    if (!studentDocId || isSaving) return;
    const newVal = !showBio;
    setShowBio(newVal);

    try {
      await updateDoc(doc(db, "students", studentDocId), { showBio: newVal });
    } catch (err) {
      setShowBio(!newVal); // رجع القيمة لو فشل
      Swal;
      Swal.fire("خطأ", "فشل تحديث الإعدادات", "error");
    }
  };

  // أيقونة الترتيب الملكية
  const RankIcon = () => (
    <AnimatePresence mode="wait">
      {isTop ? (
        <motion.div
          key="crown"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{ type: "spring", stiffness: 500 }}
          className="inline-flex"
        >
          <Crown className="w-9 h-9 text-yellow-400 drop-shadow-xl" />
          <Sparkles className="w-5 h-5 text-yellow-300 absolute -top-1 -right-1" />
        </motion.div>
      ) : (
        <motion.div
          key="award"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
        >
          <Award className="w-7 h-7 text-indigo-500" />
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (isLoading) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
        <p className="mt-4 text-gray-500">جاري تحميل بيانات الطالب...</p>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        الطالب غير موجود
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full p-4 rounded-3xl shadow-2xl"
    >
      {/* الهيدر */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white text-center sm:text-right">
          {studentData.name}
        </h1>

        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="flex items-center gap-4 bg-linear-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 p-2 rounded-3xl shadow-xl"
        >
          <RankIcon />
          <div className="text-right flex flex-col gap-2 items-center">
            <span className="text-lg">
              {" "}
              {rank == 1 ? (
                "😎☝️"
              ) : rank == 2 ? (
                "☺️✌️"
              ) : rank == 3 ? (
                "👌😌"
              ) : rank == 4 ? (
                "☺️"
              ) : rank == 5 ? (
                "😌"
              ) : rank == 6 ? (
                "🙂"
              ) : rank == 7 ? (
                "😐"
              ) : rank == 8 ? (
                "😥"
              ) : rank == 9 ? (
                "😔"
              ) : rank == 10 ? (
                "😠"
              ) : (
                <span className="animate-pulse">😡</span>
              )}
            </span>{" "}
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {rankDisplay}
            </p>
          </div>
        </motion.div>
      </div>

      {/* صندوق الشكاوى */}
      <ComplaintBox studentId={studentId} studentData={studentData} />

      {/* النبذة */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 space-y-5"
      >
        <fieldset className="border border-gray-300 dark:border-gray-600 rounded-2xl p-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
          <legend className="px-4 text-lg font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
            نبذة عنك <span className="text-xs text-gray-400">(اختياري)</span>
          </legend>

          <textarea
            value={bio}
            onChange={handleBioChange}
            placeholder="مثال: مبرمج ويب "
            maxLength={maxLength}
            rows={1}
            className="w-full resize-none bg-transparent outline-none text-gray-800 dark:text-gray-200 placeholder-gray-500 text-md"
            disabled={isSaving}
          />
        </fieldset>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm font-medium">
            <span
              className={
                charCount >= maxLength * 0.9
                  ? "text-red-500"
                  : charCount >= maxLength * 0.7
                    ? "text-orange-500"
                    : "text-green-600"
              }
            >
              {charCount}
            </span>
            <span className="text-gray-500"> / {maxLength} حرف</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleShowBio}
              className="flex items-center gap-2 text-sm font-medium"
            >
              {showBio ? (
                <Eye className="w-5 h-5 text-green-500" />
              ) : (
                <EyeOff className="w-5 h-5 text-gray-500" />
              )}
              <span>{showBio ? "مرئية للجميع" : "مخفية"}</span>
            </button>

            {isSaving && (
              <div className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري الحفظ التلقائي...</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default React.memo(StudentBio);
