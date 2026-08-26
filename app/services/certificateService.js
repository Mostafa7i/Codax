import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

/**
 * تحليل كود الشهادة واستخراج رقم الطالب ونوع الدورة
 */
export const parseCertificateId = (certId) => {
  if (!certId) return null;
  // Format: CODAX-(FE|BE|FS|...)-2026-00127
  const match = certId.match(/^CODAX-([A-Za-z]+)-(\d{4})-(\d+)$/i);
  if (match) {
    return {
      type: match[1].toUpperCase(),
      year: match[2],
      studentId: parseInt(match[3], 10),
    };
  }
  // Fallback: extract any digits at the end
  const numMatch = certId.match(/(\d+)$/);
  if (numMatch) {
    return {
      type: "FE",
      year: new Date().getFullYear().toString(),
      studentId: parseInt(numMatch[1], 10),
    };
  }
  return null;
};

export const buildIssueDate = () => {
  const d = new Date();
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

/**
 * التحقق الكامل من صحة الشهادة من قاعدة البيانات مع دعم الشهادات الموحدة (Full-Stack)
 */
export const verifyCertificate = async (certificateId) => {
  if (!certificateId) {
    return { status: "invalid", data: null };
  }

  const parsed = parseCertificateId(certificateId);
  if (!parsed || isNaN(parsed.studentId)) {
    return { status: "invalid", data: null };
  }

  const q = query(
    collection(db, "students"),
    where("id", "==", parsed.studentId)
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    return { status: "invalid", data: null };
  }

  const studentDoc = snap.docs[0];
  const studentRef = studentDoc.ref;
  const student = studentDoc.data();

  const isFullStackCert =
    parsed.type === "FS" ||
    student.certMode === "fullstack" ||
    student.isFullStack ||
    (student.subscriptionType || "").toLowerCase().includes("full") ||
    (student.certCourse || "").toLowerCase().includes("full") ||
    (student.group || "").toLowerCase().includes("full");

  // إذا كانت شهادة موحدة Full-Stack وكان للطالب سجل آخر (مثلاً مسار فرونت ومسار باك)
  let linkedStudents = [student];
  if (isFullStackCert && (student.phone || student.name)) {
    try {
      let linkedQuery;
      if (student.phone) {
        linkedQuery = query(
          collection(db, "students"),
          where("phone", "==", student.phone)
        );
      } else {
        linkedQuery = query(
          collection(db, "students"),
          where("name", "==", student.name)
        );
      }
      const linkedSnap = await getDocs(linkedQuery);
      if (!linkedSnap.empty) {
        linkedStudents = linkedSnap.docs.map((d) => d.data());
      }
    } catch (err) {
      console.warn("Could not fetch linked student records for FullStack:", err);
    }
  }

  // جلب بيانات المجموعات وحالة انتهائها لجميع السجلات المرتبطة
  let groupEnded = false;
  let totalAttended = 0;
  let totalGroupLectures = 0;
  let combinedLinks = [];

  try {
    const groupLecSnap = await getDoc(doc(db, "lectures", "groups"));
    const groupsData = groupLecSnap.exists() ? groupLecSnap.data() : {};

    linkedStudents.forEach((st) => {
      const gName = st.group;
      const gInfo = groupsData?.[gName] || {};
      const gCount = gInfo.count || st.latestLecture || 0;
      totalGroupLectures += gCount;
      totalAttended += Number(st.attendedLectures || 0);

      if (gInfo.status === false) {
        groupEnded = true;
      }

      if (Array.isArray(st.linksHistory)) {
        combinedLinks.push(...st.linksHistory);
      }
    });
  } catch (e) {
    console.error("Error fetching group lectures for certificate:", e);
  }

  // إزالة تكرار الروابط
  const uniqueGithubLinks = Array.from(
    new Map(
      combinedLinks.filter((l) => l && l.url).map((l) => [l.url, l])
    ).values()
  );

  const certName = (
    student.certificate ||
    student.englishName ||
    student.nameEn ||
    student.name ||
    ""
  ).trim();
  const hasName = certName.length >= 2;
  const totalP = Number(student.totalPrice || 0);
  const paidP = Number(student.paidAmount || 0);
  const isFeesPaid =
    totalP > 0 ? paidP >= totalP : Number(student.remainingAmount ?? 0) <= 0;

  // التحقق من الاستحقاق
  const isEligible = hasName && isFeesPaid && groupEnded;
  if (!isEligible) {
    return { status: "invalid", data: null };
  }

  // زيادة عدد المشاهدات
  const currentViews = Number(student.viewsCount || 0);
  let updatedViews = currentViews;
  if (typeof window !== "undefined") {
    const sessionKey = `visited_cert_${certificateId}`;
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, "true");
      updatedViews = currentViews + 1;
      updateDoc(studentRef, { viewsCount: increment(1) }).catch((err) =>
        console.error("Error incrementing view count:", err)
      );
    }
  }

  // تخصيص عدد المحاضرات والمدة حسب إعدادات الأدمن أو التجميع التلقائي
  let groupCount =
    student.certGroupLectures !== undefined &&
    student.certGroupLectures !== null &&
    student.certGroupLectures !== ""
      ? Number(student.certGroupLectures)
      : totalGroupLectures > 0
      ? totalGroupLectures
      : student.latestLecture || 24;

  let attendedLectures =
    student.certAttendedLectures !== undefined &&
    student.certAttendedLectures !== null &&
    student.certAttendedLectures !== ""
      ? Number(student.certAttendedLectures)
      : totalAttended > 0
      ? totalAttended
      : student.attendedLectures || 0;

  const subType = (student.subscriptionType || "").toLowerCase();
  const groupName = (student.group || "").toLowerCase();
  const rawCourse = (student.certCourse || "").toLowerCase();

  const isFrontCert =
    parsed.type === "FE" ||
    rawCourse.includes("front") ||
    subType.includes("front") ||
    groupName.includes("front");

  const isBackCert =
    parsed.type === "BE" ||
    rawCourse.includes("back") ||
    subType.includes("back") ||
    groupName.includes("back");

  let duration = student.certDuration;
  if (!duration) {
    if (isFullStackCert) {
      duration = "60+ Hours (Comprehensive)";
    } else if (isFrontCert) {
      duration = groupCount >= 25 ? "60 Hours" : "30 Hours";
    } else if (isBackCert) {
      duration = groupCount <= 25 ? "30 Hours" : "60 Hours";
    } else {
      duration = groupCount >= 25 ? "60 Hours" : "30 Hours";
    }
  }

  let course = student.certCourse;
  if (!course) {
    if (isFullStackCert) {
      course = "Full-Stack Web Development";
    } else if (isFrontCert) {
      course = "Front-End Development";
    } else if (isBackCert) {
      course = "Back-End Development";
    } else {
      // إذا لم يُحدد بالاسم: 25 فأكثر فرونت، أقل من 25 باك
      course = groupCount >= 25 ? "Front-End Development" : "Back-End Development";
    }
  } else {
    if (course === "Front-End" || course.toLowerCase() === "frontend")
      course = "Front-End Development";
    if (course === "Back-End" || course.toLowerCase() === "backend")
      course = "Back-End Development";
    if (
      course === "Full-Stack" ||
      course === "Full Stack" ||
      course.toLowerCase() === "fullstack"
    )
      course = "Full-Stack Web Development";
  }

  return {
    status: "valid",
    data: {
      certificateId,
      studentName: student.certificate || student.englishName || student.name,
      group: student.group || "غير محدد",
      attendedLectures,
      groupLectures: groupCount,
      githubLinks: uniqueGithubLinks,
      showGithubButton: student.showGithubButton !== false,
      duration,
      course,
      isFullStack: isFullStackCert,
      viewsCount: updatedViews,
      assessment: "Successfully Passed with Excellence",
      capstoneProject: isFullStackCert
        ? "Full-Stack Capstone Project Completed"
        : "Completed",
      issueDate: buildIssueDate(),
      status: "valid",
    },
  };
};
