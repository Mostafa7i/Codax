// دالة محسنة لحساب المتوسط مع تحقق كامل من أنواع البيانات
export const calculateStudentAverage = (tasks = [], score = 0) => {
  if (!Array.isArray(tasks)) {
    console.warn("Tasks is not an array:", tasks);
    return Math.round(score);
  }

  // ✅ استبعاد التاسكات المقفولة (enabled: false) من حساب المتوسط
  const validTasks = tasks.filter(
    (task) => task && task.enabled !== false && typeof task.score === "number",
  );

  if (validTasks.length === 0) return Math.round(score);

  const maxPossibleTaskScore = validTasks.length * 100;
  const totalTaskScore = validTasks.reduce((sum, task) => sum + task.score, 0);

  return maxPossibleTaskScore > 0
    ? Math.round((totalTaskScore / maxPossibleTaskScore) * 100)
    : 0;
};

export const calculateGradesPercentage = (tasks, score = 0) => {
  if (!tasks || tasks.length === 0) return 0;
  const activeTasks = tasks.filter((task) => task && task.enabled !== false);
  if (activeTasks.length === 0) return 0;

  const totalScore =
    activeTasks.reduce((sum, task) => sum + task.score, 0) + score;
  const totalMaxScore = activeTasks.length * 100 + score; // اجمالي النقاط الممكنة

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
  if (
    !student ||
    typeof student.startLecture !== "number" ||
    typeof student.attendedLectures !== "number" ||
    typeof latestLecture !== "number"
  )
    return 0;
  const totalRequiredLectures = latestLecture - student.startLecture + 1;
  return Math.max(0, totalRequiredLectures - student.attendedLectures);
};

export const calculateAvailableLectures = (student, latestLecture) => {
  if (
    !student ||
    typeof student.startLecture !== "number" ||
    typeof latestLecture !== "number"
  )
    return 0;
  return Math.max(0, latestLecture - student.startLecture + 1);
};

// دالة مساعدة لحساب نسبة الحضور (إذا لم تكن موجودة، أضفها)
// const calculateAttendancePercentage = (attended, available) => {
//   if (available <= 0) return 100;
//   return Math.min(100, Math.round((attended / available) * 100));
// };

export const getTopStudents = (
  studentsData = [],
  latestLecture,
  sortMode = "combined",
) => {
  // 1. التحقق من المدخلات
  if (!Array.isArray(studentsData)) {
    console.error("[getTopStudents] Error: studentsData is not an array.");
    return [];
  }
  if (typeof latestLecture !== "number" || latestLecture < 0) {
    latestLecture = 0;
  }

  // 2. معالجة كل طالب على حدة
  const processedStudents = studentsData.map((student) => {
    const tasks = Array.isArray(student.tasks) ? student.tasks : [];
    // ✅ تجاهل التاسكات المقفولة (enabled: false) في حساب الدرجات
    const activeTasks = tasks.filter((task) => task && task.enabled !== false);
    const validTasks = activeTasks.filter(
      (task) => typeof task.score === "number",
    );

    // --- حساب نسبة التاسكات (مع التعامل مع حالة عدم وجود تاسكات) ---
    let taskPercentage = null; // القيمة الافتراضية هي null
    if (validTasks.length > 0) {
      const totalTaskScore = validTasks.reduce(
        (sum, task) => sum + task.score,
        0,
      );
      const maxPossibleTaskScore = validTasks.length * 100;
      taskPercentage =
        maxPossibleTaskScore > 0
          ? Math.round((totalTaskScore / maxPossibleTaskScore) * 100)
          : 0;
    }

    // --- حساب نسبة الحضور ---
    const attendedLectures =
      typeof student.attendedLectures === "number"
        ? student.attendedLectures
        : 0;
    const startLecture =
      typeof student.startLecture === "number" ? student.startLecture : 1;
    const availableLectures = Math.max(0, latestLecture - startLecture + 1);
    const attendancePercentage = calculateAttendancePercentage(
      attendedLectures,
      availableLectures,
    );

    // --- حساب النقاط الإضافية والـ Boost ---
    const extraPoints = typeof student.score === "number" ? student.score : 0;
    const boostPercentage = Math.min(Math.floor(extraPoints / 40), 5);

    // --- حساب النتيجة النهائية (Combined Score) بشكل ديناميكي ---
    let combinedScore;
    if (taskPercentage !== null) {
      // ✅ المعادلة الصحيحة: 60% للتاسكات و 40% للحضور
      const scoreWithoutBoost = Math.round(
        taskPercentage * 0.6 + attendancePercentage * 0.4,
      );
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
      case "task":
        // الطلاب الذين ليس لديهم تاسكات (null) يأتون في الآخر
        if (a.taskPercentage === null) return 1;
        if (b.taskPercentage === null) return -1;
        if (b.taskPercentage !== a.taskPercentage) {
          return b.taskPercentage - a.taskPercentage;
        }
        return (b.extraPoints || 0) - (a.extraPoints || 0);

      case "attendance":
        if (b.attendancePercentage !== a.attendancePercentage) {
          return b.attendancePercentage - a.attendancePercentage;
        }
        return (b.extraPoints || 0) - (a.extraPoints || 0);

      case "extraPoints":
        if ((b.extraPoints || 0) !== (a.extraPoints || 0)) {
          return (b.extraPoints || 0) - (a.extraPoints || 0);
        }
        return b.combinedScore - a.combinedScore;

      case "combined":
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

/**
 * دالة مساعدة لتوحيد مفتاح المهمة / الاختبار للتعرف على التطابق ومنع أي تكرار مع فصل الاختبارات عن المهام
 */
export function normalizeTaskKey(task) {
  if (!task) return "";
  const name = String(task.name || task.title || task.taskName || "")
    .trim()
    .toLowerCase();

  const isExam = Boolean(
    task.isExam ||
    task.type === "exam" ||
    /^(اختبار|كويز|امتحان|exam|quiz)/i.test(name),
  );

  const numMatch = name.match(/\d+/);

  if (isExam) {
    // مفتاح فريد للاختبارات
    const cleanedExamName = name
      .replace(/^(اختبار|كويز|امتحان|exam|quiz)[:\s\-_]*/i, "")
      .trim();
    return numMatch
      ? `exam-num-${parseInt(numMatch[0], 10)}`
      : `exam-${cleanedExamName.replace(/[\s\-_]+/g, "")}`;
  }

  // مفتاح فريد للمهام التدريبية
  if (numMatch) {
    return `task-num-${parseInt(numMatch[0], 10)}`;
  }
  return `task-${name.replace(/[\s\-_]+/g, "")}`;
}

/**
 * استخراج رقم المهمة بدقة لترتيبها تصاعدياً بشكل صحيح
 */
export function extractTaskNumber(task) {
  if (!task) return 9999;
  const isExam = Boolean(
    task.isExam ||
    task.type === "exam" ||
    /^(اختبار|كويز|امتحان|exam|quiz)/i.test(
      String(task.name || task.title || ""),
    ),
  );

  const name = String(task.name || task.title || task.taskName || "");
  const numMatch = name.match(/\d+/);

  // إذا كان اختبار، يتم إعطاؤه ترتيب بعد أو مع رقمه
  if (isExam) {
    const examNum = numMatch ? parseInt(numMatch[0], 10) : 9000;
    return typeof task.id === "number" && task.id > 0
      ? task.id
      : 5000 + examNum;
  }

  if (typeof task.id === "number" && !isNaN(task.id) && task.id > 0) {
    return task.id;
  }
  if (numMatch) return parseInt(numMatch[0], 10);
  return 9999;
}

/**
 * استخراج النموذج المرجعي الموحد للمهام والاختبارات من أقدم/أشمل طالب في المجموعة
 */
export function buildGroupMasterTasks(groupStudents = []) {
  if (!Array.isArray(groupStudents) || groupStudents.length === 0) return [];

  // البحث عن الطالب الذي حضر من البداية أو يمتلك أكبر قائمة مهام واختبارات
  let bestStudent = null;
  let maxTasksCount = -1;

  groupStudents.forEach((student) => {
    const sTasks = Array.isArray(student.tasks) ? student.tasks : [];
    const isEarly = student.startLecture === 1 ? 100 : 0;
    const scoreVal = isEarly + sTasks.length;
    if (scoreVal > maxTasksCount && sTasks.length > 0) {
      maxTasksCount = scoreVal;
      bestStudent = student;
    }
  });

  if (!bestStudent) return [];

  const seenKeys = new Set();
  const cleanMasterTasks = [];

  const rawTasks = (bestStudent.tasks || []).slice().sort((a, b) => {
    return extractTaskNumber(a) - extractTaskNumber(b);
  });

  rawTasks.forEach((t) => {
    if (!t) return;
    const key = normalizeTaskKey(t);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      const isExam = Boolean(
        t.isExam ||
        t.type === "exam" ||
        /^(اختبار|كويز|امتحان|exam|quiz)/i.test(
          String(t.name || t.title || ""),
        ),
      );
      const taskNum = extractTaskNumber(t);
      cleanMasterTasks.push({
        id: typeof t.id === "number" ? t.id : taskNum,
        name: t.name || (isExam ? `اختبار ${taskNum}` : `Task - ${taskNum}`),
        submissionType: t.submissionType || (isExam ? "exam" : "file"),
        isExam: isExam,
        type: isExam ? "exam" : t.type || "task",
        score: 0,
        enabled: false,
      });
    }
  });

  return cleanMasterTasks.sort(
    (a, b) => extractTaskNumber(a) - extractTaskNumber(b),
  );
}

/**
 * مطابقة وترتيب مهام واختبارات الطالب مع النموذج المرجعي للمجموعة ومنع أي تكرار
 */
export function syncStudentTasksWithMaster(
  studentTasks = [],
  masterTasks = [],
) {
  if (!Array.isArray(masterTasks) || masterTasks.length === 0) {
    const seen = new Set();
    const result = [];
    (studentTasks || []).forEach((t) => {
      if (!t) return;
      const key = normalizeTaskKey(t);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(t);
      }
    });
    return result.sort((a, b) => extractTaskNumber(a) - extractTaskNumber(b));
  }

  // خريطة بمهام واختبارات الطالب الحالية بدون تكرار
  const studentTaskMap = new Map();
  (studentTasks || []).forEach((st) => {
    if (!st) return;
    const key = normalizeTaskKey(st);
    if (!studentTaskMap.has(key)) {
      studentTaskMap.set(key, st);
    }
  });

  // بناء القائمة الموحدة طبقاً لترتيب الـ Master
  const finalTasks = masterTasks.map((mt) => {
    const key = normalizeTaskKey(mt);
    const existing = studentTaskMap.get(key);

    if (existing) {
      return {
        ...mt,
        ...existing,
        name: existing.name || mt.name,
        isExam: mt.isExam || existing.isExam,
        type: mt.type || existing.type,
        enabled: existing.enabled !== false,
      };
    }

    // عنصر سابق مقفول
    return {
      ...mt,
      score: 0,
      enabled: false,
    };
  });

  // إضافة أي مهام أو اختبارات أخرى خاصة بالطالب لم ترد في الماستر
  (studentTasks || []).forEach((st) => {
    if (!st) return;
    const key = normalizeTaskKey(st);
    const inMaster = masterTasks.some((mt) => normalizeTaskKey(mt) === key);
    if (!inMaster) {
      finalTasks.push(st);
    }
  });

  return finalTasks.sort((a, b) => extractTaskNumber(a) - extractTaskNumber(b));
}
