// دالة محسنة لحساب المتوسط مع تحقق كامل من أنواع البيانات
export const calculateStudentAverage = (tasks = [], score = 0) => {
  if (!Array.isArray(tasks)) {
    console.warn("Tasks is not an array:", tasks);
    return Math.round(score);
  }

  const validTasks = tasks.filter(task => 
    task && typeof task.score === 'number'
  );

  if (validTasks.length === 0) return Math.round(score);

  const totalScore = validTasks.reduce((sum, task) => sum + task.score, score);
  // Corrected: Max score should be based on number of valid tasks * 100, plus the initial score?
  // This calculation seems potentially flawed if score is meant to be extra points.
  // Assuming score is extra points and shouldn't be part of max task score.
  const maxPossibleTaskScore = validTasks.length * 100; 
  const totalTaskScore = validTasks.reduce((sum, task) => sum + task.score, 0);

  // This average calculation seems specific and might not be the general task percentage.
  // Reverting to a simpler task percentage calculation as used later in getTopStudents.
  // return Math.round((totalScore / maxPossibleScore) * 100);
  return maxPossibleTaskScore > 0 ? Math.round((totalTaskScore / maxPossibleTaskScore) * 100) : 0;
};

// This function seems redundant or incorrectly named given the one above and the logic in getTopStudents.
// It's not used in the provided getTopStudents. Let's keep it but note potential issues.
export const calculateGradesPercentage = (tasks, score = 0) => {
  if (!tasks || tasks.length === 0) return 0;

  const totalScore = tasks.reduce((sum, task) => sum + task.score, 0) + score;
  const totalMaxScore = tasks.length * 100 + score; // اجمالي النقاط الممكنة

  return Math.round((totalScore / totalMaxScore) * 100);
};

// This function also seems potentially incorrect. Average shouldn't typically be scaled by attendance.
// It's not used in getTopStudents.
export const calculateFinalAverage = (average, attendancePercentage) => {
  return Math.round(average * (attendancePercentage / 100));
};

// دالة مساعدة لحساب نسبة الحضور
export const calculateAttendancePercentage = (attended, total) => {
  if (total <= 0) return 0;
  const percentage = (attended / total) * 100;
  return Math.min(Math.round(percentage), 100); // لا تتجاوز 100%
};

// دالة حساب الغيابات
export const calculateAbsences = (student, latestLecture) => {
  if (!student || typeof student.startLecture !== 'number' || typeof student.attendedLectures !== 'number' || typeof latestLecture !== 'number') return 0;
  const totalRequiredLectures = latestLecture - student.startLecture + 1;
  return Math.max(0, totalRequiredLectures - student.attendedLectures);
};

export const calculateAvailableLectures = (student, latestLecture) => {
  if (!student || typeof student.startLecture !== 'number' || typeof latestLecture !== 'number') return 0;
  return Math.max(0, latestLecture - student.startLecture + 1);
};


// دالة مساعدة لحساب نسبة الحضور (إذا لم تكن موجودة، أضفها)
// const calculateAttendancePercentage = (attended, available) => {
//   if (available <= 0) return 100;
//   return Math.min(100, Math.round((attended / available) * 100));
// };


export const getTopStudents = (studentsData = [], latestLecture, sortMode = 'combined') => {
  // 1. التحقق من المدخلات
  if (!Array.isArray(studentsData)) {
    console.error("[getTopStudents] Error: studentsData is not an array.");
    return [];
  }
  if (typeof latestLecture !== 'number' || latestLecture < 0) {
    latestLecture = 0;
  }

  // 2. معالجة كل طالب على حدة
  const processedStudents = studentsData.map((student) => {
    const tasks = Array.isArray(student.tasks) ? student.tasks : [];
    const validTasks = tasks.filter(task => task && typeof task.score === 'number');

    // --- حساب نسبة التاسكات (مع التعامل مع حالة عدم وجود تاسكات) ---
    let taskPercentage = null; // القيمة الافتراضية هي null
    if (validTasks.length > 0) {
      const totalTaskScore = validTasks.reduce((sum, task) => sum + task.score, 0);
      const maxPossibleTaskScore = validTasks.length * 100;
      taskPercentage = maxPossibleTaskScore > 0
        ? Math.round((totalTaskScore / maxPossibleTaskScore) * 100)
        : 0;
    }

    // --- حساب نسبة الحضور ---
    const attendedLectures = typeof student.attendedLectures === 'number' ? student.attendedLectures : 0;
    const startLecture = typeof student.startLecture === 'number' ? student.startLecture : 1;
    const availableLectures = Math.max(0, latestLecture - startLecture + 1);
    const attendancePercentage = calculateAttendancePercentage(attendedLectures, availableLectures);

    // --- حساب النقاط الإضافية والـ Boost ---
    const extraPoints = typeof student.score === 'number' ? student.score : 0;
    const boostPercentage = Math.min(Math.floor(extraPoints / 40), 5);

    // --- حساب النتيجة النهائية (Combined Score) بشكل ديناميكي ---
      let combinedScore;
    if (taskPercentage !== null) {
      // ✅ المعادلة الصحيحة: 60% للتاسكات و 40% للحضور
      const scoreWithoutBoost = Math.round((taskPercentage * 0.6) + (attendancePercentage * 0.4));
      combinedScore = Math.min(scoreWithoutBoost + boostPercentage, 100);
    } else {
      // ✅ إذا لا يوجد تاسكات، النتيجة هي الحضور + الـ Boost
      const scoreWithoutBoost = attendancePercentage;
      combinedScore = Math.min(scoreWithoutBoost + boostPercentage, 100);
    }
    return {
      ...student,
      taskPercentage, // ستكون null إذا لم توجد تاسكات
      attendancePercentage,
      extraPoints,
      combinedScore,
    };
  });

  // 3. فرز الطلاب بناءً على النمط المحدد
  const sortedStudents = processedStudents.sort((a, b) => {
    switch (sortMode) {
      case 'task':
        // الطلاب الذين ليس لديهم تاسكات (null) يأتون في الآخر
        if (a.taskPercentage === null) return 1;
        if (b.taskPercentage === null) return -1;
        if (b.taskPercentage !== a.taskPercentage) {
          return b.taskPercentage - a.taskPercentage;
        }
        return (b.extraPoints || 0) - (a.extraPoints || 0);

      case 'attendance':
        if (b.attendancePercentage !== a.attendancePercentage) {
          return b.attendancePercentage - a.attendancePercentage;
        }
        return (b.extraPoints || 0) - (a.extraPoints || 0);

      case 'extraPoints':
        if ((b.extraPoints || 0) !== (a.extraPoints || 0)) {
          return (b.extraPoints || 0) - (a.extraPoints || 0);
        }
        return b.combinedScore - a.combinedScore;

      case 'combined':
      default:
        if (b.combinedScore !== a.combinedScore) {
          return b.combinedScore - a.combinedScore;
        }
        return (b.extraPoints || 0) - (a.extraPoints || 0);
    }
  });

  // 4. إضافة الترتيب النهائي
  const rankedStudents = sortedStudents.map((student, index) => ({
    ...student,
    rank: index + 1,
  }));

  return rankedStudents;
};
