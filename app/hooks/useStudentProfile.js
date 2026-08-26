"use client";
import { useState, useEffect, useCallback } from "react";
import {
  doc,
  updateDoc,
  onSnapshot,
  getDocs,
  collection,
  query,
  where,
  getDoc,
  deleteField,
} from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig";
import {
  calculateStudentAverage,
  calculateAttendancePercentage,
} from "@/app/components/calculations";
import {
  updateStudentEnglishName,
  updateStudentCollege,
  updateStudentCity,
  updateStudentStudyMethod,
  updateStudentPassword,
  useStudentReserveAttendance,
} from "@/app/services/studentService";
import Swal from "sweetalert2";

export function useStudentProfile(studentId) {
  const [studentData, setStudentData] = useState(null);
  const [studentDocId, setStudentDocId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // إحصائيات الدورة والمحاضرات
  const [latestLecture, setLatestLecture] = useState(0);
  const [totalLectures, setTotalLectures] = useState(0);
  const [average, setAverage] = useState(0);
  const [attendancePercentage, setAttendancePercentage] = useState(0);
  const [combinedScore, setCombinedScore] = useState(0);
  const [reserveAttendanceCount, setReserveAttendanceCount] = useState(0);
  const [isProcessingReserve, setIsProcessingReserve] = useState(false);

  // إعدادات العرض
  const [profilePic, setProfilePic] = useState("/favicon.png");
  const [showIcons, setShowIcons] = useState(true);
  const [showTime, setShowTime] = useState(true);
  const [showStatusText, setShowStatusText] = useState(false);
  const [showGithubButton, setShowGithubButton] = useState(true);
  const [lastQuestionStatus, setLastQuestionStatus] = useState("");

  // الاختبارات والكويز
  const [hasActiveExam, setHasActiveExam] = useState(false);
  const [hasStartedQuiz, setHasStartedQuiz] = useState(false);
  const [hasNewQuestion, setHasNewQuestion] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);

  // بيانات NewStudents
  const [newStudentData, setNewStudentData] = useState(null);
  const [loadingNewStudent, setLoadingNewStudent] = useState(true);

  // حالات التعديل
  const [isEditingEnglishName, setIsEditingEnglishName] = useState(false);
  const [editedEnglishName, setEditedEnglishName] = useState("");
  const [isSavingEnglishName, setIsSavingEnglishName] = useState(false);

  const [isEditingCollege, setIsEditingCollege] = useState(false);
  const [editedCollege, setEditedCollege] = useState("");
  const [isSavingCollege, setIsSavingCollege] = useState(false);

  const [isEditingCity, setIsEditingCity] = useState(false);
  const [editedCity, setEditedCity] = useState("");
  const [isSavingCity, setIsSavingCity] = useState(false);

  const [isChangingStudyMethod, setIsChangingStudyMethod] = useState(false);
  const [localPassword, setLocalPassword] = useState("");
  const [showLocalPassword, setShowLocalPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const studentGroup = studentData?.group || "";

  // ── 1. جلب بيانات الطالب الأساسية لحظياً ──
  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const numericId = Number(studentId);
    const studentsRef = collection(db, "students");
    const studentQuery = query(
      studentsRef,
      where("id", "==", !isNaN(numericId) ? numericId : studentId)
    );

    const unsubscribe = onSnapshot(
      studentQuery,
      (querySnapshot) => {
        if (!querySnapshot.empty) {
          const studentDoc = querySnapshot.docs[0];
          const data = studentDoc.data();
          setStudentDocId(studentDoc.id);

          setHasStartedQuiz(
            Boolean(
              data.quizStartTime && Object.keys(data.quizStartTime).length > 0
            )
          );
          setShowTime(data.showTime !== false);
          setShowIcons(data.showScoreIcons !== false);
          setShowGithubButton(data.showGithubButton !== false);
          setLastQuestionStatus(data.lastQuestionStatus || "");
          setProfilePic(data.profilePic || "/favicon.png");
          setReserveAttendanceCount(data.reserveAttendance || 0);

          setStudentData({ ...data, reserveUsageCount: 0 });
          setError(null);
        } else {
          setStudentData(null);
          setError("الطالب غير موجود");
        }
        setLoading(false);
      },
      (err) => {
        console.error("Firestore student snapshot error:", err);
        setError("حدث خطأ أثناء تحميل بيانات الطالب");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [studentId]);

  // ── 2. جلب سجل استخدام النقاط الاحتياطية ──
  useEffect(() => {
    if (!studentDocId) return;
    const fetchUsageCount = async () => {
      try {
        const logRef = collection(
          db,
          "students",
          studentDocId,
          "reserveUsageLogs"
        );
        const q = query(logRef, where("type", "==", "subtract"));
        const snapshot = await getDocs(q);
        setStudentData((prev) =>
          prev ? { ...prev, reserveUsageCount: snapshot.size } : prev
        );
      } catch (err) {
        console.error("Error fetching reserve usage count:", err);
      }
    };
    fetchUsageCount();
  }, [studentDocId]);

  // ── 3. ترحيل الملف القديم zipFile إن وجد ──
  useEffect(() => {
    if (!studentDocId || !studentData) return;
    if (
      studentData.zipFile &&
      studentData.tasks &&
      studentData.tasks.length > 0
    ) {
      const migrateZip = async () => {
        try {
          const tasks = [...studentData.tasks];
          if (!tasks[0].submittedFile && !tasks[0].submittedLink) {
            tasks[0].submitted = true;
            tasks[0].submittedFile = studentData.zipFile;
            tasks[0].submittedAt = studentData.zipFile.uploadedAt
              ? studentData.zipFile.uploadedAt.seconds
                ? new Date(
                    studentData.zipFile.uploadedAt.seconds * 1000
                  ).toISOString()
                : new Date(studentData.zipFile.uploadedAt).toISOString()
              : new Date().toISOString();

            await updateDoc(doc(db, "students", studentDocId), {
              tasks,
              zipFile: deleteField(),
            });
          }
        } catch (err) {
          console.error("Error migrating zip:", err);
        }
      };
      migrateZip();
    }
  }, [studentDocId, studentData]);

  // ── 4. مراقبة NewStudents ──
  useEffect(() => {
    if (!studentDocId && !studentId) return;
    setLoadingNewStudent(true);

    const phoneToQuery = studentDocId || String(studentId);
    const q1 = query(
      collection(db, "NewStudents"),
      where("phone", "==", phoneToQuery)
    );

    const unsubscribe = onSnapshot(q1, (snap) => {
      if (!snap.empty) {
        setNewStudentData({ id: snap.docs[0].id, ...snap.docs[0].data() });
        setLoadingNewStudent(false);
      } else {
        const q2 = query(
          collection(db, "NewStudents"),
          where("phone", "==", String(studentId))
        );
        getDocs(q2)
          .then((snap2) => {
            if (!snap2.empty) {
              setNewStudentData({
                id: snap2.docs[0].id,
                ...snap2.docs[0].data(),
              });
            } else if (studentData?.name) {
              const q3 = query(
                collection(db, "NewStudents"),
                where("arabicName", "==", studentData.name)
              );
              getDocs(q3).then((snap3) => {
                setNewStudentData(
                  !snap3.empty
                    ? { id: snap3.docs[0].id, ...snap3.docs[0].data() }
                    : null
                );
                setLoadingNewStudent(false);
              });
            } else {
              setNewStudentData(null);
              setLoadingNewStudent(false);
            }
          })
          .catch(() => {
            setNewStudentData(null);
            setLoadingNewStudent(false);
          });
      }
    });

    return () => unsubscribe();
  }, [studentDocId, studentId, studentData?.name]);

  // ── 5. مراقبة عدد المحاضرات الإجمالي ──
  useEffect(() => {
    if (!studentGroup) return;
    const docRef = doc(db, "lectures", "groups");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const groupData = data[studentGroup];
        setLatestLecture(groupData?.count ?? 1);
      }
    });
    return () => unsubscribe();
  }, [studentGroup]);

  // ── 6. مراقبة كويز المجموعة ──
  useEffect(() => {
    if (!studentGroup) return;
    const quizRef = query(
      collection(db, "quizze"),
      where("group", "==", studentGroup)
    );
    const unsubscribe = onSnapshot(quizRef, (snapshot) => {
      if (snapshot.empty) {
        setCurrentQuestion(null);
        setHasNewQuestion(false);
        return;
      }
      const docSnap = snapshot.docs[0];
      const data = docSnap.data();
      if (
        data?.question &&
        typeof data.question === "string" &&
        data.question.trim() !== "" &&
        Array.isArray(data?.options) &&
        data.options.length > 0
      ) {
        setCurrentQuestion({ id: docSnap.id, ...data });
        setHasNewQuestion(true);
      } else {
        setCurrentQuestion(null);
        setHasNewQuestion(false);
      }
    });
    return () => unsubscribe();
  }, [studentGroup]);

  // ── 7. مراقبة الاختبارات النشطة ──
  useEffect(() => {
    const sId = studentData?.id || newStudentData?.id || studentId;
    const currentExamId =
      studentData?.currentExamId || newStudentData?.currentExamId;

    if (currentExamId) {
      const examRef = doc(db, "exams", String(currentExamId));
      const unsub = onSnapshot(examRef, async (examSnap) => {
        if (!examSnap.exists()) {
          setHasActiveExam(false);
          return;
        }
        const examData = examSnap.data();
        if (
          examData.status !== "published" ||
          !examData.startAt ||
          !examData.closeAt
        ) {
          setHasActiveExam(false);
          return;
        }

        const now = new Date();
        const closeTime = examData.closeAt?.toDate
          ? examData.closeAt.toDate()
          : new Date(examData.closeAt);
        if (now > closeTime) {
          setHasActiveExam(false);
          return;
        }

        if (sId) {
          const resultRef = doc(db, "examResults", `${sId}_${currentExamId}`);
          const resultSnap = await getDoc(resultRef);
          if (resultSnap.exists() && resultSnap.data()?.finishedAt) {
            setHasActiveExam(false);
            return;
          }
        }

        setHasActiveExam(true);
      });
      return () => unsub();
    }

    const studentGrp = studentData?.group || newStudentData?.group;
    if (!studentGrp) {
      setHasActiveExam(false);
      return;
    }

    const qExams = query(
      collection(db, "exams"),
      where("status", "==", "published")
    );
    const unsubAll = onSnapshot(qExams, async (snapshot) => {
      let activeFound = false;
      const now = new Date();

      for (const examDoc of snapshot.docs) {
        const eData = examDoc.data();
        if (!eData.startAt || !eData.closeAt) continue;

        const closeTime = eData.closeAt?.toDate
          ? eData.closeAt.toDate()
          : new Date(eData.closeAt);
        if (now > closeTime) continue;

        const targetGroups = Array.isArray(eData.groups)
          ? eData.groups
          : [eData.group].filter(Boolean);
        if (targetGroups.length > 0 && !targetGroups.includes(studentGrp))
          continue;

        if (sId) {
          const resRef = doc(db, "examResults", `${sId}_${examDoc.id}`);
          const resSnap = await getDoc(resRef);
          if (resSnap.exists() && resSnap.data()?.finishedAt) continue;
        }

        activeFound = true;
        break;
      }

      setHasActiveExam(activeFound);
    });

    return () => unsubAll();
  }, [
    studentData?.currentExamId,
    newStudentData?.currentExamId,
    studentData?.id,
    newStudentData?.id,
    studentId,
    studentData?.group,
    newStudentData?.group,
  ]);

  // ── 8. حساب المتوسطات والأداء الأكاديمي ──
  useEffect(() => {
    if (!studentData || !latestLecture) return;
    try {
      const studentAvailableLectures =
        latestLecture - (studentData.startLecture || 0) + 1;
      const newAverage = calculateStudentAverage(studentData.tasks || []);
      const newAttendancePercentage = calculateAttendancePercentage(
        studentData.attendedLectures || 0,
        studentAvailableLectures
      );
      const extraPoints =
        typeof studentData.score === "number" ? studentData.score : 0;
      const boostPercentage = Math.min(Math.floor(extraPoints / 40), 5);
      const combinedScoreWithoutBoost = Math.round(
        newAverage * 0.6 + newAttendancePercentage * 0.4
      );
      const newCombined = Math.min(
        combinedScoreWithoutBoost + boostPercentage,
        100
      );

      setTotalLectures(latestLecture);
      setAverage(newAverage);
      setAttendancePercentage(newAttendancePercentage);
      setCombinedScore(newCombined);
    } catch (err) {
      console.error("Error calculating student data:", err);
    }
  }, [studentData, latestLecture]);

  // ── Handlers ──

  const getAttendanceStats = useCallback(() => {
    if (!studentData || !latestLecture) return { absences: 0, total: 0 };
    const total = latestLecture - (studentData.startLecture || 0) + 1;
    const attended = studentData.attendedLectures || 0;
    return { total, absences: Math.max(0, total - attended) };
  }, [studentData, latestLecture]);

  const { absences, total } = getAttendanceStats();

  const getRankTitle = useCallback(() => {
    if (
      combinedScore >= 99 &&
      attendancePercentage >= 100 &&
      latestLecture >= 10
    ) {
      return { title: "Engineer 🔱👑🔱", colorClass: "text-green-300" };
    } else if (combinedScore >= 95 && attendancePercentage >= 90) {
      return { title: "Lead 🌟🌟🌟🌟", colorClass: "text-yellow-500" };
    } else if (combinedScore >= 85 && attendancePercentage >= 90) {
      return { title: "Senior ⭐⭐⭐⭐", colorClass: "text-yellow-500" };
    } else if (combinedScore >= 75) {
      return { title: "Mid-level ⭐⭐⭐", colorClass: "text-yellow-600" };
    } else if (combinedScore >= 65) {
      return { title: "Junior ⭐⭐", colorClass: "text-yellow-600" };
    } else if (combinedScore >= 50) {
      return { title: "Junior ⭐", colorClass: "text-yellow-600" };
    } else {
      return { title: "بياع جرجير 🥬", colorClass: "text-red-500" };
    }
  }, [combinedScore, attendancePercentage, latestLecture]);

  const isPerfectStudent =
    combinedScore >= 99 && attendancePercentage >= 100 && latestLecture >= 10;

  const handleSaveEnglishName = async () => {
    const trimmed = editedEnglishName.trim();
    if (!trimmed) {
      Swal.fire("خطأ", "يجب كتابة الاسم باللغة الإنجليزية", "error");
      return;
    }
    if (/[^A-Za-z\s]/.test(trimmed)) {
      Swal.fire("خطأ", "الاسم يجب أن يحتوي على حروف إنجليزية فقط", "error");
      return;
    }

    setIsSavingEnglishName(true);
    try {
      await updateStudentEnglishName({
        studentDocId,
        newStudentDocId: newStudentData?.id,
        studentId,
        englishName: trimmed,
      });
      Swal.fire({
        icon: "success",
        title: "تم الحفظ بنجاح",
        text: "تم تحديث الاسم باللغة الإنجليزية في الشهادة والملف الشخصي.",
        timer: 3000,
        showConfirmButton: false,
      });
      setIsEditingEnglishName(false);
    } catch (err) {
      console.error(err);
      Swal.fire("خطأ", "حدث خطأ أثناء حفظ الاسم.", "error");
    } finally {
      setIsSavingEnglishName(false);
    }
  };

  const handleSaveCollege = async () => {
    setIsSavingCollege(true);
    try {
      await updateStudentCollege({
        studentDocId,
        newStudentDocId: newStudentData?.id,
        studentId,
        college: editedCollege,
      });
      Swal.fire({
        icon: "success",
        title: "تم الحفظ بنجاح",
        text: "تم تحديث الكلية/الدراسة بنجاح.",
        timer: 3000,
        showConfirmButton: false,
      });
      setIsEditingCollege(false);
    } catch (err) {
      console.error(err);
      Swal.fire("خطأ", "حدث خطأ أثناء حفظ البيانات.", "error");
    } finally {
      setIsSavingCollege(false);
    }
  };

  const handleSaveCity = async () => {
    setIsSavingCity(true);
    try {
      await updateStudentCity({
        studentDocId,
        newStudentDocId: newStudentData?.id,
        studentId,
        city: editedCity,
      });
      Swal.fire({
        icon: "success",
        title: "تم الحفظ بنجاح",
        text: "تم تحديث محل الإقامة بنجاح.",
        timer: 3000,
        showConfirmButton: false,
      });
      setIsEditingCity(false);
    } catch (err) {
      console.error(err);
      Swal.fire("خطأ", "حدث خطأ أثناء حفظ البيانات.", "error");
    } finally {
      setIsSavingCity(false);
    }
  };

  const handleChangeStudyMethod = async () => {
    const currentMethod = newStudentData?.studyMethod || "online";
    const newMethod = currentMethod === "offline" ? "online" : "offline";
    const newMethodLabel = newMethod === "offline" ? "حضوري 🏫" : "أونلاين 🌐";

    const { isConfirmed } = await Swal.fire({
      icon: "warning",
      title: "⚠️ تنبيه هام قبل التغيير",
      html: `<div dir="rtl" style="text-align:right; font-family:inherit;">أنت على وشك تغيير طريقة حضورك إلى <strong style="color:#6366f1">${newMethodLabel}</strong></div>`,
      confirmButtonText: "نعم، غيّر الطريقة",
      cancelButtonText: "إلغاء",
      showCancelButton: true,
      confirmButtonColor: "#6366f1",
      cancelButtonColor: "#6b7280",
    });

    if (!isConfirmed) return;

    setIsChangingStudyMethod(true);
    try {
      await updateStudentStudyMethod({
        studentDocId,
        newStudentDocId: newStudentData?.id,
        studentId,
        studyMethod: newMethod,
      });
      Swal.fire({
        icon: "success",
        title: "تم التغيير بنجاح!",
        text: `تم تغيير طريقة حضورك إلى ${newMethodLabel}`,
        timer: 4000,
      });
    } catch (err) {
      console.error(err);
      Swal.fire("خطأ", "حدث خطأ أثناء تغيير طريقة الحضور.", "error");
    } finally {
      setIsChangingStudyMethod(false);
    }
  };

  const handleLocalPasswordSave = async () => {
    const trimmed = localPassword.trim();
    if (trimmed.length < 5 || trimmed.length > 10) {
      Swal.fire(
        "خطأ",
        "كلمة المرور يجب أن لا تقل عن 5 أحرف ولا تزيد عن 10 أحرف.",
        "error"
      );
      return;
    }

    setIsSavingPassword(true);
    try {
      await updateStudentPassword(studentId, trimmed);
      Swal.fire({
        icon: "success",
        title: "تم التغيير!",
        text: "تم تغيير كلمة المرور بنجاح!",
        timer: 3000,
        showConfirmButton: false,
      });
      setLocalPassword("");
    } catch (error) {
      console.error(error);
      Swal.fire("خطأ", "حدث خطأ أثناء تغيير كلمة المرور!", "error");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleUseReserveAttendance = async () => {
    if (
      reserveAttendanceCount <= 0 ||
      absences <= 0 ||
      !studentData ||
      isProcessingReserve
    )
      return;

    setIsProcessingReserve(true);
    try {
      await useStudentReserveAttendance({
        studentDocId,
        studentId,
        absences,
        reserveCount: reserveAttendanceCount,
        currentAttended: studentData.attendedLectures,
        currentUsageCount: studentData.reserveUsageCount,
      });
      Swal.fire({
        title: "تم بنجاح!",
        text: "تم استخدام الحضور الاحتياطي بنجاح",
        icon: "success",
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: "خطأ!",
        text: "حدث خطأ أثناء استخدام الحضور الاحتياطي",
        icon: "error",
      });
    } finally {
      setIsProcessingReserve(false);
    }
  };

  const toggleGithubButton = async () => {
    if (!studentDocId) return;
    const newValue = !showGithubButton;
    setShowGithubButton(newValue);
    setShowStatusText(true);
    setTimeout(() => setShowStatusText(false), 3000);
    try {
      await updateDoc(doc(db, "students", studentDocId), {
        showGithubButton: newValue,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleIcons = async () => {
    if (!studentDocId) return;
    const newValue = !showIcons;
    setShowIcons(newValue);
    try {
      await updateDoc(doc(db, "students", studentDocId), {
        showScoreIcons: newValue,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActiveTime = async () => {
    if (!studentDocId) return;
    const newValue = !showTime;
    setShowTime(newValue);
    try {
      await updateDoc(doc(db, "students", studentDocId), {
        showTime: newValue,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadSuccess = useCallback((newPic) => {
    setProfilePic(newPic);
  }, []);

  return {
    studentData,
    studentDocId,
    studentGroup,
    loading,
    error,
    latestLecture,
    totalLectures,
    average,
    attendancePercentage,
    combinedScore,
    absences,
    total,
    isPerfectStudent,
    getRankTitle,
    profilePic,
    showIcons,
    showTime,
    showStatusText,
    showGithubButton,
    lastQuestionStatus,
    hasActiveExam,
    hasStartedQuiz,
    hasNewQuestion,
    currentQuestion,
    newStudentData,
    loadingNewStudent,
    reserveAttendanceCount,
    isProcessingReserve,
    // Handlers
    handleUseReserveAttendance,
    toggleGithubButton,
    toggleIcons,
    toggleActiveTime,
    handleUploadSuccess,
    // Editable fields
    isEditingEnglishName,
    setIsEditingEnglishName,
    editedEnglishName,
    setEditedEnglishName,
    isSavingEnglishName,
    handleSaveEnglishName,
    isEditingCollege,
    setIsEditingCollege,
    editedCollege,
    setEditedCollege,
    isSavingCollege,
    handleSaveCollege,
    isEditingCity,
    setIsEditingCity,
    editedCity,
    setEditedCity,
    isSavingCity,
    handleSaveCity,
    isChangingStudyMethod,
    handleChangeStudyMethod,
    localPassword,
    setLocalPassword,
    showLocalPassword,
    setShowLocalPassword,
    isSavingPassword,
    handleLocalPasswordSave,
  };
}
