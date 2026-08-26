"use client";
import { useState, useEffect, useCallback } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig";
import {
  fetchTopTaskStudents,
  fetchTopTestStudents,
} from "@/app/services/groupService";

const topBy = (arr, getter, dir = "desc") => {
  const list = arr
    .map((student) => ({
      ...student,
      _v: getter(student),
    }))
    .filter(
      (student) =>
        student._v !== null &&
        student._v !== undefined &&
        !Number.isNaN(student._v)
    );

  if (!list.length) return null;

  list.sort((a, b) => (dir === "desc" ? b._v - a._v : a._v - b._v));

  return list[0];
};

/**
 * Hook لحساب وتجميع إحصائيات الأوائل (الأكثر تفاعلاً، الأكثر غياباً، أعلى درجات)
 */
export const useTopStats = (selectedGroup) => {
  const [stats, setStats] = useState(null);
  const [latestLectures, setLatestLectures] = useState({});
  const [latestLectureForGroup, setLatestLectureForGroup] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const studentsRef = collection(db, "students");
      const studentsQuery = selectedGroup
        ? query(studentsRef, where("group", "==", selectedGroup))
        : studentsRef;

      const snapshot = await getDocs(studentsQuery);
      const students = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      const lecturesMap = {};
      students.forEach((student) => {
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
        : 0;
      setLatestLectureForGroup(currentLatestLecture);

      if (!students.length) {
        setStats(null);
        return;
      }

      const taskAgg = students.map((student) => ({
        ...student,
        totalTaskScore: (student.tasks || []).reduce(
          (total, task) => total + Number(task.score || 0),
          0
        ),
      }));

      const calculatedStats = {
        mostLiked: topBy(students, (s) => s.likedBy?.length || 0),
        mostDisliked: topBy(students, (s) => s.dislikedBy?.length || 0),
        highestScore: topBy(students, (s) => Number(s.score || 0)),
        highestTaskGrades: topBy(taskAgg, (s) =>
          Number(s.totalTaskScore || 0)
        ),
        highestReserveUsage: topBy(students, (s) =>
          Number(s.reserveUsageCount || 0)
        ),
        higheAbsencest: topBy(students, (s) => {
          const totalLec =
            currentLatestLecture - Number(s.startLecture || 1) + 1;
          return totalLec - Number(s.attendedLectures || 0);
        }),
      };

      setStats(calculatedStats);
    } catch (err) {
      console.error("Error fetching top statistics:", err);
      setStats(null);
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
