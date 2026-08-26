"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  deleteDoc,
  writeBatch,
  where,
} from "firebase/firestore";


import { db } from "@/app/services/firebaseConfig";

// ----------------------------------------------------
// 1. useNotifications Hook
// ----------------------------------------------------
export function useNotifications(studentGroup) {
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  useEffect(() => {
    if (!studentGroup) {
      setNotifications([]);
      setLoadingNotifications(false);
      return;
    }

    setLoadingNotifications(true);

    try {
      const notificationsRef = collection(db, "notificationsGroups");

      const q = query(
        notificationsRef,
        where("group", "==", studentGroup),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const data = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: docSnap.data().createdAt?.toDate ? docSnap.data().createdAt.toDate() : docSnap.data().createdAt,
          }));

          setNotifications(data);
          setLoadingNotifications(false);
        },
        (err) => {
          console.error("Firestore onSnapshot error:", err);
          setLoadingNotifications(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up notifications listener:", err);
      setLoadingNotifications(false);
    }
  }, [studentGroup]);

  return notifications;
}

// ----------------------------------------------------
// 2. useGroupData Hook
// ----------------------------------------------------
export function useGroupData(selectedGroup) {
  const [groupData, setGroupData] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState(null);

  // الكاش لمنع استدعاء Firestore المتكرر لنفس المجموعة
  const dataCache = useRef(new Map());

  const fetchGroupData = useCallback(async (groupName) => {
    if (!groupName) return null;

    if (dataCache.current.has(groupName)) {
      return dataCache.current.get(groupName);
    }

    setIsLoadingData(true);
    setError(null);

    try {
      const tasksRef = collection(db, "groupTasks");
      const q = query(tasksRef, where("groupName", "==", groupName));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        const fallbackData = {
          groupName,
          topStudents: [],
          tasks: [],
          tests: [],
          notice: "لا توجد بيانات مسجلة حالياً لهذه المجموعة",
        };
        dataCache.current.set(groupName, fallbackData);
        return fallbackData;
      }

      const docData = snapshot.docs[0].data();
      const data = {
        ...docData,
        id: snapshot.docs[0].id,
      };

      dataCache.current.set(groupName, data);
      return data;
    } catch (err) {
      console.error("Error fetching group:", err);
      setError("فشل تحميل بيانات المجموعة. يرجى المحاولة مرة أخرى.");
      return null;
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedGroup) {
      setGroupData(null);
      return;
    }

    let cancelled = false;

    const loadGroup = async () => {
      const data = await fetchGroupData(selectedGroup);
      if (!cancelled) {
        setGroupData(data);
      }
    };

    loadGroup();

    return () => {
      cancelled = true;
    };
  }, [selectedGroup, fetchGroupData]);

  const retryGroupData = useCallback(async () => {
    if (!selectedGroup) return null;

    dataCache.current.delete(selectedGroup);
    setIsLoadingData(true);
    setError(null);

    const data = await fetchGroupData(selectedGroup);
    setGroupData(data);
    return data;
  }, [selectedGroup, fetchGroupData]);

  const clearCache = useCallback(() => {
    dataCache.current.clear();
  }, []);

  return {
    groupData,
    setGroupData,
    isLoadingData,
    error,
    setError,
    fetchGroupData,
    retryGroupData,
    clearCache,
    dataCache: dataCache.current,
  };
}

// ----------------------------------------------------
// 3. useReviewsRating Hook
// ----------------------------------------------------
export function useReviewsRating(limitCount = 12) {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [expandedReviews, setExpandedReviews] = useState({});
  const [reviewError, setReviewError] = useState(null);

  const toggleReview = useCallback((id) => {
    setExpandedReviews((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const fetchReviews = useCallback(async () => {
    setLoadingReviews(true);
    setReviewError(null);
    try {
      const q = query(
        collection(db, "courseRatings"),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );

      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setReviews(data);
      setTotalReviews(data.length);

      if (data.length > 0) {
        const sum = data.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0);
        const avg = (sum / data.length).toFixed(1);
        setAverageRating(avg);
      } else {
        setAverageRating(0);
      }
    } catch (err) {
      console.error("Firestore ERROR in useReviewsRating:", err);
      setReviewError("فشل تحميل التقييمات");
    } finally {
      setLoadingReviews(false);
    }
  }, [limitCount]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return {
    reviews,
    setReviews,
    averageRating,
    totalReviews,
    loadingReviews,
    expandedReviews,
    toggleReview,
    reviewError,
    refetchReviews: fetchReviews,
  };
}





// ----------------------------------------------------
// 5. Group Total Lectures & Password Fetching Functions
// ----------------------------------------------------
export async function fetchGroupSpecificTotalLectures(groupName) {
  if (!groupName) return null;
  try {
    const docRef = doc(db, "lectures", "groups");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const group = data[groupName];
      if (!group) return 0;
      return group.count ?? group.total ?? 0;
    }
    return 0;
  } catch (error) {
    console.error(`Error fetching total lectures for group '${groupName}':`, error);
    return null;
  }
}

export async function fetchStudentPassword(studentId) {
  if (!studentId) return null;
  try {
    // البحث بحقل id الرقمي داخل الـ document (مش الـ Firestore document ID)
    const numId = Number(studentId);
    const q = query(
      collection(db, "students"),
      where("id", "==", isNaN(numId) ? studentId : numId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs[0].data().password || null;
    }
    return null;
  } catch (error) {
    console.error("Error fetching student password:", error);
    return null;
  }
}
// Rating ///////////////////////////////////////////////////////////////////////

export async function fetchRating(){
    const [name, setName] = useState("");
    const [review, setReview] = useState("");
    const [rating, setRating] = useState(0);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
  try {
    await addDoc(collection(db, "courseRatings"), {
        courseId,
        name: name.trim() || "مجهول",
        review: review.trim(),
        rating,
        createdAt: serverTimestamp(),
      });

      setSubmitted(true);
      // إعادة تعيين الحقول
      setName("");
      setReview("");
      setRating(0);
    } catch (error) {
      console.error("Error adding review: ", error);
      alert("حدث خطأ أثناء إرسال التقييم، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
}













////////// جلب الاحصائيات للطلاب//////////////////////////////////////////
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

  list.sort((a, b) =>
    dir === "desc"
      ? b._v - a._v
      : a._v - b._v
  );

  return list[0];
};

export const useTopStats = (selectedGroup) => {
  const [stats, setStats] = useState(null);
  const [latestLectures, setLatestLectures] = useState({});
  const [latestLectureForGroup, setLatestLectureForGroup] =
    useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      /*
       * =====================================================
       * 1. جلب الطلاب
       * =====================================================
       */

      const studentsRef = collection(db, "students");

      const studentsQuery = selectedGroup
        ? query(
            studentsRef,
            where("group", "==", selectedGroup)
          )
        : studentsRef;

      const snapshot = await getDocs(studentsQuery);

      const students = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      /*
       * =====================================================
       * 2. حساب آخر Lecture لكل Group
       * =====================================================
       *
       * هنا نعتمد على startLecture الموجود عند الطلاب.
       *
       * لو عندك Collection منفصلة للمحاضرات،
       * سنغير هذا الجزء فقط.
       */

      const lecturesMap = {};

      students.forEach((student) => {
        const group = student.group;

        if (!group) return;

        const lecture = Number(
          student.startLecture || 0
        );

        if (
          !lecturesMap[group] ||
          lecture > lecturesMap[group]
        ) {
          lecturesMap[group] = lecture;
        }
      });

      setLatestLectures(lecturesMap);

      const currentLatestLecture =
        selectedGroup
          ? lecturesMap[selectedGroup] || 0
          : 0;

      setLatestLectureForGroup(
        currentLatestLecture
      );

      /*
       * =====================================================
       * 3. لا يوجد طلاب
       * =====================================================
       */

      if (!students.length) {
        setStats(null);
        return;
      }

      /*
       * =====================================================
       * 4. حساب مجموع درجات المهام
       * =====================================================
       */

      const taskAgg = students.map((student) => ({
        ...student,

        totalTaskScore: (
          student.tasks || []
        ).reduce(
          (total, task) =>
            total + Number(task.score || 0),
          0
        ),
      }));

      /*
       * =====================================================
       * 5. حساب الإحصائيات
       * =====================================================
       */

      const calculatedStats = {
        /*
         * الأكثر إعجاباً
         */
        mostLiked: topBy(
          students,
          (student) =>
            student.likedBy?.length || 0
        ),

        /*
         * الأكثر Dislike
         */
        mostDisliked: topBy(
          students,
          (student) =>
            student.dislikedBy?.length || 0
        ),

        /*
         * أعلى نقاط إضافية
         */
        highestScore: topBy(
          students,
          (student) =>
            Number(student.score || 0)
        ),

        /*
         * أعلى درجات مهام
         */
        highestTaskGrades: topBy(
          taskAgg,
          (student) =>
            Number(student.totalTaskScore || 0)
        ),

        /*
         * الأكثر استخداماً للاحتياطي
         */
        highestReserveUsage: topBy(
          students,
          (student) =>
            Number(
              student.reserveUsageCount || 0
            )
        ),

        /*
         * الأكثر غياباً
         */
        higheAbsencest: topBy(
          students,
          (student) => {
            const totalLectures =
              currentLatestLecture -
              Number(student.startLecture || 1) +
              1;

            return (
              totalLectures -
              Number(
                student.attendedLectures || 0
              )
            );
          }
        ),
      };

      setStats(calculatedStats);
    } catch (err) {
      console.error(
        "Error fetching top statistics:",
        err
      );

      setStats(null);

      setError(
        "حدث خطأ أثناء تحميل الإحصائيات."
      );
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

///////////////////////////////////////////////////////
//جلب الديدلاين للتسكات ////////////////////////////////////////////////////
export function useTaskDetails(selectedGroup) {
  const [taskDetails, setTaskDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedGroup) {
      setTaskDetails(null);
      setIsLoading(false);
      return;
    }

    const fetchTaskDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const tasksRef = collection(db, "groupTasks");

        const q = query(
          tasksRef,
          where("groupName", "==", selectedGroup)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setTaskDetails(null);
          return;
        }

        const taskData = snapshot.docs[0].data();

        setTaskDetails(taskData);
      } catch (error) {
        console.error("Error fetching task details:", error);

        setError("حدث خطأ أثناء تحميل تفاصيل المهمة.");
        setTaskDetails(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskDetails();
  }, [selectedGroup]);

  return {
    taskDetails,
    isLoading,
    error,
  };
}






















































// 5- calculations --------------------------------------------------------
import { getTopStudents } from "../components/calculations.jsx";























// ----------------------------------------------------
// 6. useMainContentData Hook (المخصص لصفحة MainContent بالكامل)
// ----------------------------------------------------
export function useMainContentData(selectedGroup, initialSortMode = "combined") {
  const [students, setStudents] = useState([]);
  const [totalLecturesForGroup, setTotalLecturesForGroup] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState(initialSortMode);

  const mainDataCache = useRef(new Map());

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!selectedGroup) {
        setStudents([]);
        setTotalLecturesForGroup(null);
        setIsDataLoading(false);
        setIsRefreshingData(false);
        return;
      }

      const cacheKey = `group-${selectedGroup}`;
      if (!isRefresh && mainDataCache.current.has(cacheKey)) {
        const cached = mainDataCache.current.get(cacheKey);
        setStudents(cached.students);
        setTotalLecturesForGroup(cached.totalLectures);
        setIsDataLoading(false);
        return;
      }

      if (isRefresh) {
        setIsRefreshingData(true);
      } else {
        setIsDataLoading(true);
      }

      setHasError(false);

      try {
        const totalLecturesPromise = fetchGroupSpecificTotalLectures(selectedGroup);

        const q = query(
          collection(db, "students"),
          where("group", "==", selectedGroup)
        );
        const studentsPromise = getDocs(q);

        const [totalLectures, studentsSnap] = await Promise.all([
          totalLecturesPromise,
          studentsPromise,
        ]);

        let studentsData = [];
        if (studentsSnap && !studentsSnap.empty) {
          studentsData = studentsSnap.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));
        }

        setTotalLecturesForGroup(totalLectures);
        setStudents(studentsData);

        mainDataCache.current.set(cacheKey, {
          students: studentsData,
          totalLectures,
        });
      } catch (error) {
        console.error(`Error fetching data for group ${selectedGroup}:`, error);
        setHasError(true);
        setStudents([]);
        setTotalLecturesForGroup(null);
      } finally {
        setIsDataLoading(false);
        setIsRefreshingData(false);
      }
    },
    [selectedGroup]
  );

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  // حساب الترتيب
  const rankedStudents = useMemo(() => {
    if (!students || students.length === 0) return [];
    return getTopStudents(students, totalLecturesForGroup, sortMode);
  }, [students, totalLecturesForGroup, sortMode]);

  // التصفية بالبحث
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) {
      return rankedStudents;
    }
    const qLower = searchQuery.toLowerCase().trim();
    return rankedStudents.filter((student) =>
      student.name?.toLowerCase().includes(qLower)
    );
  }, [rankedStudents, searchQuery]);

  return {
    students,
    rankedStudents,
    filteredStudents,
    totalLecturesForGroup,
    isDataLoading,
    isRefreshingData,
    hasError,
    searchQuery,
    setSearchQuery,
    sortMode,
    setSortMode,
    fetchData,
    retryFetch: () => fetchData(false),
  };
}

// ----------------------------------------------------
// 7. useGroupStudents Hook
// ----------------------------------------------------
export function useGroupStudents(selectedGroup) {
  const [students, setStudents] = useState([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [studentsError, setStudentsError] = useState(null);

  const fetchStudents = useCallback(async () => {
    if (!selectedGroup) {
      setStudents([]);
      return;
    }

    setIsLoadingStudents(true);
    setStudentsError(null);

    try {
      const q = query(
        collection(db, "students"),
        where("group", "==", selectedGroup)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setStudents(data);
    } catch (err) {
      console.error("Error fetching group students:", err);
      setStudentsError("فشل تحميل بيانات طلاب المجموعة");
    } finally {
      setIsLoadingStudents(false);
    }
  }, [selectedGroup]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return {
    students,
    isLoadingStudents,
    studentsError,
    refetchStudents: fetchStudents,
  };
}




// ////////////////////////////////////////////////////////////////////////////
const MESSAGES_COLLECTION = "messages";

/**
 * الاشتراك في الاستماع المباشر للرسائل
 */
export const subscribeToMessages = (onSuccess, onError) => {
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      onSuccess(messages);
    },
    (error) => {
      console.error("Error fetching messages:", error);
      if (onError) onError(error);
    }
  );
};

/**
 * تحديث حالة جميع الرسائل غير المقروءة إلى مقروءة (Batch Update)
 */
export const markAllMessagesAsRead = async () => {
  try {
    const snap = await getDocs(collection(db, MESSAGES_COLLECTION));
    const unreadDocs = snap.docs.filter((d) => d.data().read === false);
    
    if (unreadDocs.length === 0) return;

    // Firestore batch max limit is 500 operations
    const BATCH_SIZE = 450;
    for (let i = 0; i < unreadDocs.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = unreadDocs.slice(i, i + BATCH_SIZE);
      
      chunk.forEach((d) => {
        batch.update(doc(db, MESSAGES_COLLECTION, d.id), { read: true });
      });
      
      await batch.commit();
    }
  } catch (err) {
    console.error("markAllMessagesAsRead error:", err);
    throw err;
  }
};

/**
 * حذف رسالة بواسطة المكنّف (ID)
 */
export const deleteMessageById = async (id) => {
  try {
    await deleteDoc(doc(db, MESSAGES_COLLECTION, id));
  } catch (error) {
    console.error("deleteMessageById error:", error);
    throw error;
  }
};

// ///////////////////////////////////////////////
const LOGS_COLLECTION = "reactionViewLogs";

/**
 * جلب جميع سجلات مشاهدة التفاعلات مرتبة تنازلياً حسب الوقت
 */
export const getReactionViewLogs = async () => {
  try {
    const logsRef = collection(db, LOGS_COLLECTION);
    const q = query(logsRef, orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching reaction logs:", error);
    throw error;
  }
};