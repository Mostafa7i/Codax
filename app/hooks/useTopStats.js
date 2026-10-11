"use client";
import { useState, useEffect, useCallback } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig";
import { getTopStudents } from "@/app/components/calculations";
import {
  fetchTopTaskStudents,
  fetchTopTestStudents,
} from "@/app/services/groupService";

/**
 * دالة مساعدة لاستخراج أفضل N طلاب بناءً على معيار معين
 * @param {Array} arr - مصفوفة الطلاب
 * @param {Function} getter - دالة استخراج القيمة
 * @param {number} n - عدد الطلاب المطلوبين (افتراضي 3)
 * @param {number} minVal - الحد الأدنى للقيمة للتأهل
 * @param {string} dir - اتجاه الترتيب ("desc" أو "asc")
 */
const topN = (arr, getter, n = 3, minVal = 1, dir = "desc") => {
  const list = arr
    .map((student) => ({
      ...student,
      _v: getter(student),
    }))
    .filter(
      (student) =>
        student._v !== null &&
        student._v !== undefined &&
        !Number.isNaN(student._v) &&
        (dir === "desc" ? student._v >= minVal : true)
    );

  if (!list.length) return [];

  list.sort((a, b) => (dir === "desc" ? b._v - a._v : a._v - b._v));

  return list.slice(0, n);
};

/**
 * Hook لحساب وتجميع إحصائيات الأوائل الشاملة
 * (المتصدر الأكاديمي، ملك الالتزام، محظوظ العجلة، أكثر داعم، إحصائيات المجموعة ككل)
 */
export const useTopStats = (selectedGroup) => {
  const [stats, setStats] = useState(null);
  const [groupOverview, setGroupOverview] = useState(null);
  const [latestLectures, setLatestLectures] = useState({});
  const [latestLectureForGroup, setLatestLectureForGroup] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. جلب الطلاب
      const studentsRef = collection(db, "students");
      const studentsQuery = selectedGroup
        ? query(studentsRef, where("group", "==", selectedGroup))
        : studentsRef;

      const snapshot = await getDocs(studentsQuery);
      const rawStudents = snapshot.docs.map((d) => ({
        id: d.id,
        docId: d.id,
        ...d.data(),
      }));

      // 2. حساب آخر محاضرة لكل مجموعة
      const lecturesMap = {};
      rawStudents.forEach((student) => {
        const group = student.group;
        if (!group) return;
        const lecture = Number(student.startLecture || 0);
        if (!lecturesMap[group] || lecture > lecturesMap[group]) {
          lecturesMap[group] = lecture;
        }
      });

      setLatestLectures(lecturesMap);
      const currentLatestLecture = selectedGroup
        ? lecturesMap[selectedGroup] || 0
        : Math.max(...Object.values(lecturesMap), 0);
      setLatestLectureForGroup(currentLatestLecture);

      if (!rawStudents.length) {
        setStats(null);
        setGroupOverview(null);
        return;
      }

      // 3. حساب ترتيب ومعدلات الطلاب الموحدة
      const rankedStudents = getTopStudents(
        rawStudents,
        currentLatestLecture,
        "combined"
      );

      // 4. جلب سجلات عجلة الحظ لحساب "أكثر طالب محظوظ"
      const wheelPointsMap = {};
      try {
        const wheelSnap = await getDocs(
          query(
            collection(db, "gamificationActivity"),
            where("type", "==", "wheel_spin")
          )
        );
        wheelSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.prizeType === "points" && Number(data.prizeValue) > 0) {
            const val = Number(data.prizeValue);
            if (data.studentId) {
              wheelPointsMap[data.studentId] =
                (wheelPointsMap[data.studentId] || 0) + val;
            }
            if (data.studentName) {
              wheelPointsMap[data.studentName] =
                (wheelPointsMap[data.studentName] || 0) + val;
            }
          }
        });
      } catch (wheelErr) {
        console.warn("Could not fetch gamificationActivity wheel spins:", wheelErr);
      }

      // 5. حساب خريطة "أكثر طالب داعم لزملائه بالإعجابات"
      const likesGivenMap = {};
      rankedStudents.forEach((s) => {
        if (Array.isArray(s.likedBy)) {
          s.likedBy.forEach((entry) => {
            const likerId =
              entry && typeof entry === "object" ? entry.likerId : entry;
            if (likerId) {
              likesGivenMap[likerId] = (likesGivenMap[likerId] || 0) + 1;
            }
          });
        }
      });

      // 6. تجهيز وحساب بيانات كل طالب
      const processedStudents = rankedStudents.map((student) => {
        const tasks = Array.isArray(student.tasks) ? student.tasks : [];

        // إجمالي درجات المهام
        const totalTaskScore = tasks.reduce(
          (total, task) => total + Number(task.score || 0),
          0
        );

        // عدد المهام بدرجة كاملة 100
        const perfectTasksCount = tasks.filter(
          (t) => t && t.enabled !== false && Number(t.score) === 100
        ).length;

        // درجات الاختبارات والكويزات
        const examScore = tasks
          .filter(
            (t) =>
              t &&
              (t.isExam ||
                t.type === "exam" ||
                /^(اختبار|امتحان|كويز|quiz|exam)/i.test(t.name || t.title || ""))
          )
          .reduce((sum, t) => sum + Number(t.score || 0), 0);

        // نقاط عجلة الحظ
        const luckyWheelPoints = Math.max(
          Number(student.wheelPointsWon || 0),
          wheelPointsMap[student.id] || 0,
          wheelPointsMap[student.docId] || 0,
          wheelPointsMap[student.name] || 0
        );

        // الغيابات
        const totalLec =
          currentLatestLecture - Number(student.startLecture || 1) + 1;
        const absences = Math.max(
          0,
          totalLec - Number(student.attendedLectures || 0)
        );

        // اللايكات التي منحها للآخرين
        const likesGiven =
          likesGivenMap[student.id] ||
          likesGivenMap[student.docId] ||
          likesGivenMap[student.name] ||
          0;

        return {
          ...student,
          totalTaskScore,
          perfectTasksCount,
          examScore,
          luckyWheelPoints,
          absences,
          likesGiven,
        };
      });

      // 7. حساب المؤشرات العامة للمجموعة (Group Overview KPIs)
      const totalStudentsCount = processedStudents.length;
      const avgScore = Math.round(
        processedStudents.reduce(
          (sum, s) => sum + (Number(s.combinedScore) || 0),
          0
        ) / (totalStudentsCount || 1)
      );
      const avgAttendance = Math.round(
        processedStudents.reduce(
          (sum, s) => sum + (Number(s.attendancePercentage) || 0),
          0
        ) / (totalStudentsCount || 1)
      );
      const totalPoints = processedStudents.reduce(
        (sum, s) => sum + (Number(s.score) || 0),
        0
      );
      const totalWheelPoints = processedStudents.reduce(
        (sum, s) => sum + (Number(s.luckyWheelPoints) || 0),
        0
      );
      const totalPerfectAttendance = processedStudents.filter(
        (s) => s.absences === 0 && Number(s.attendedLectures || 0) > 0
      ).length;

      const groupKpis = {
        totalStudents: totalStudentsCount,
        averageCombinedScore: avgScore,
        averageAttendanceRate: avgAttendance,
        totalGroupPoints: totalPoints,
        totalWheelPointsWon: totalWheelPoints,
        totalPerfectAttendanceStudents: totalPerfectAttendance,
        latestLectureNumber: currentLatestLecture,
      };

      setGroupOverview(groupKpis);

      // 8. حساب الفئات التنافسية للأوائل (مع دعم الـ Top 3 لكل فئة)
      const calculatedStats = {
        // 🍀 أكثر طالب محظوظ من عجلة الحظ
        luckiestWheel: {
          winner: topN(processedStudents, (s) => s.luckyWheelPoints, 1)[0] || null,
          top3: topN(processedStudents, (s) => s.luckyWheelPoints, 3),
        },

        // 🏆 المتصدر الأكاديمي (المركز الأول في الترتيب العام)
        academicLeader: {
          winner: topN(processedStudents, (s) => s.combinedScore, 1)[0] || null,
          top3: topN(processedStudents, (s) => s.combinedScore, 3),
        },

        // 👑 ملك الالتزام (حضور مثالي بدون أي غياب)
        perfectAttendance: {
          winner:
            topN(
              processedStudents.filter(
                (s) => s.absences === 0 && Number(s.attendedLectures || 0) > 0
              ),
              (s) => Number(s.attendedLectures || 0),
              1
            )[0] || null,
          top3: topN(
            processedStudents.filter(
              (s) => s.absences === 0 && Number(s.attendedLectures || 0) > 0
            ),
            (s) => Number(s.attendedLectures || 0),
            3
          ),
        },

        // 🎯 نجم المهام (أعلى مجموع درجات في المهام)
        highestTaskGrades: {
          winner: topN(processedStudents, (s) => s.totalTaskScore, 1)[0] || null,
          top3: topN(processedStudents, (s) => s.totalTaskScore, 3),
        },

        // 💯 العلامة الكاملة (أكبر عدد تاسكات بدرجة 100)
        perfectTasksMaster: {
          winner: topN(processedStudents, (s) => s.perfectTasksCount, 1)[0] || null,
          top3: topN(processedStudents, (s) => s.perfectTasksCount, 3),
        },

        // 📝 نجم الاختبارات (أعلى درجات في الكويزات والاختبارات)
        highestExamGrades: {
          winner: topN(processedStudents, (s) => s.examScore, 1)[0] || null,
          top3: topN(processedStudents, (s) => s.examScore, 3),
        },

        // ⭐ أعلى نقاط إضافية
        highestScore: {
          winner: topN(processedStudents, (s) => Number(s.score || 0), 1)[0] || null,
          top3: topN(processedStudents, (s) => Number(s.score || 0), 3),
        },

        // 👍 الأكثر إعجاباً (Most Liked)
        mostLiked: {
          winner: topN(processedStudents, (s) => s.likedBy?.length || 0, 1)[0] || null,
          top3: topN(processedStudents, (s) => s.likedBy?.length || 0, 3),
        },

        // ❤️ الأكثر دعماً لزملائه (Spirit Award - أكثر من أهدى لايكات)
        mostGenerousLiker: {
          winner: topN(processedStudents, (s) => s.likesGiven, 1)[0] || null,
          top3: topN(processedStudents, (s) => s.likesGiven, 3),
        },

        // 🛡️ الأكثر استخداماً للاحتياطي
        highestReserveUsage: {
          winner:
            topN(processedStudents, (s) => Number(s.reserveUsageCount || 0), 1)[0] ||
            null,
          top3: topN(
            processedStudents,
            (s) => Number(s.reserveUsageCount || 0),
            3
          ),
        },

        // 📉 الأكثر غياباً
        higheAbsencest: {
          winner: topN(processedStudents, (s) => s.absences, 1)[0] || null,
          top3: topN(processedStudents, (s) => s.absences, 3),
        },

        // 👎 الأكثر Dislike
        mostDisliked: {
          winner:
            topN(processedStudents, (s) => s.dislikedBy?.length || 0, 1)[0] ||
            null,
          top3: topN(processedStudents, (s) => s.dislikedBy?.length || 0, 3),
        },
      };

      setStats(calculatedStats);
    } catch (err) {
      console.error("Error fetching top statistics:", err);
      setStats(null);
      setGroupOverview(null);
      setError("حدث خطأ أثناء تحميل الإحصائيات.");
    } finally {
      setLoading(false);
    }
  }, [selectedGroup]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    groupOverview,
    latestLectures,
    latestLectureForGroup,
    loading,
    error,
    refetch: fetchStats,
  };
};

/**
 * Hook لأوائل التاسك
 */
export const useTopTaskStudents = (selectedGroup) => {
  const [topStudents, setTopStudents] = useState([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedGroup) {
      setIsLoading(false);
      setTopStudents([]);
      setTaskTitle("");
      return;
    }

    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchTopTaskStudents(selectedGroup);
        if (!isMounted) return;
        setTopStudents(res.topStudents);
        setTaskTitle(res.taskTitle);
      } catch (err) {
        if (!isMounted) return;
        setError("حدث خطأ أثناء تحميل قائمة أوائل التاسك.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [selectedGroup]);

  return { topStudents, taskTitle, isLoading, error };
};

/**
 * Hook لأوائل الاختبار
 */
export const useTopTestStudents = (selectedGroup) => {
  const [topTestStudents, setTopTestStudents] = useState([]);
  const [testTitle, setTestTitle] = useState("");
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedGroup) {
      setIsLoading(false);
      setTopTestStudents([]);
      setTestTitle("");
      setHistory([]);
      return;
    }

    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchTopTestStudents(selectedGroup);
        if (!isMounted) return;
        setTopTestStudents(res.topTestStudents || []);
        setTestTitle(res.testTitle || "");
        setHistory(res.history || []);
      } catch (err) {
        if (!isMounted) return;
        setError("حدث خطأ أثناء تحميل قائمة أوائل الاختبار.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [selectedGroup]);

  return { topTestStudents, testTitle, history, isLoading, error };
};
