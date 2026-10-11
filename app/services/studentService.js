import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

/**
 * إنشاء Query للبحث عن الطالب بواسطة رقم ID
 */
export const getStudentByIdQuery = (studentId) => {
  const studentsRef = collection(db, "students");
  return query(studentsRef, where("id", "==", Number(studentId)));
};

/**
 * جلب المعرف الداخلي (Firestore Document ID) للطالب بواسطة رقم الـ ID
 */
export const getStudentDocId = async (studentId) => {
  if (!studentId) throw new Error("معرف الطالب مطلوب");
  const q = getStudentByIdQuery(studentId);
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error("لم يتم العثور على بيانات الطالب");
  }

  return snapshot.docs[0].id;
};


/**
 * رفع الصورة على Cloudinary
 */
export const uploadImageToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "image_photo");

  const response = await fetch(
    "https://api.cloudinary.com/v1_1/dyqs8bid2/image/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("فشل في رفع الصورة إلى الخادم");
  }

  const data = await response.json();
  return data.secure_url;
};

/**
 * تحديث صورة البروفايل للطالب
 */
export const updateStudentProfilePic = async (studentId, imageUrl) => {
  const docId = await getStudentDocId(studentId);
  const studentRef = doc(db, "students", docId);
  await updateDoc(studentRef, { profilePic: imageUrl });
  return imageUrl;
};

/**
 * دمج الرفع والتحديث للصورة الشخصية
 */
export const uploadAndUpdateProfilePic = async (studentId, file) => {
  const imageUrl = await uploadImageToCloudinary(file);
  await updateStudentProfilePic(studentId, imageUrl);
  return imageUrl;
};

/**
 * تحديث الاسم باللغة الإنجليزية في students و NewStudents
 */
export const updateStudentEnglishName = async ({
  studentDocId,
  newStudentDocId,
  studentId,
  englishName,
}) => {
  const trimmed = englishName.trim();
  if (studentDocId) {
    await updateDoc(doc(db, "students", studentDocId), {
      englishName: trimmed,
    });
  }
  if (newStudentDocId) {
    await updateDoc(doc(db, "NewStudents", newStudentDocId), {
      englishName: trimmed,
    });
  } else if (studentId) {
    const q = query(
      collection(db, "NewStudents"),
      where("phone", "==", String(studentId))
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      await updateDoc(snap.docs[0].ref, { englishName: trimmed });
    }
  }
};

/**
 * تحديث الكلية / الدراسة
 */
export const updateStudentCollege = async ({
  studentDocId,
  newStudentDocId,
  studentId,
  college,
}) => {
  const trimmed = college.trim();
  if (studentDocId) {
    await updateDoc(doc(db, "students", studentDocId), { college: trimmed });
  }
  if (newStudentDocId) {
    await updateDoc(doc(db, "NewStudents", newStudentDocId), {
      college: trimmed,
    });
  } else if (studentId) {
    const q = query(
      collection(db, "NewStudents"),
      where("phone", "==", String(studentId))
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      await updateDoc(snap.docs[0].ref, { college: trimmed });
    }
  }
};

/**
 * تحديث المدينة ومحل الإقامة
 */
export const updateStudentCity = async ({
  studentDocId,
  newStudentDocId,
  studentId,
  city,
}) => {
  const trimmed = city.trim();
  if (studentDocId) {
    await updateDoc(doc(db, "students", studentDocId), { city: trimmed });
  }
  if (newStudentDocId) {
    await updateDoc(doc(db, "NewStudents", newStudentDocId), { city: trimmed });
  } else if (studentId) {
    const q = query(
      collection(db, "NewStudents"),
      where("phone", "==", String(studentId))
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      await updateDoc(snap.docs[0].ref, { city: trimmed });
    }
  }
};

/**
 * تغيير طريقة الحضور (Online / Offline)
 */
export const updateStudentStudyMethod = async ({
  studentDocId,
  newStudentDocId,
  studentId,
  studyMethod,
}) => {
  if (newStudentDocId) {
    await updateDoc(doc(db, "NewStudents", newStudentDocId), { studyMethod });
  } else if (studentId) {
    const q = query(
      collection(db, "NewStudents"),
      where("phone", "==", String(studentId))
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      await updateDoc(snap.docs[0].ref, { studyMethod });
    }
  }
  if (studentDocId) {
    await updateDoc(doc(db, "students", studentDocId), { studyMethod });
  }
};

/**
 * تغيير كلمة المرور للطالب
 */
export const updateStudentPassword = async (studentId, newPassword) => {
  const numericId = Number(studentId);
  const studentsRef = collection(db, "students");
  const q = query(
    studentsRef,
    where("id", "==", !isNaN(numericId) ? numericId : studentId)
  );
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error("لا يوجد طالب بهذا المعرف");
  }

  const studentDoc = querySnapshot.docs[0];
  await updateDoc(doc(db, "students", studentDoc.id), {
    password: newPassword.trim(),
  });
};

/**
 * استخدام الحضور الاحتياطي
 */
export const useStudentReserveAttendance = async ({
  studentDocId,
  studentId,
  absences,
  reserveCount,
  currentAttended,
  currentUsageCount,
}) => {
  const studentRef = doc(db, "students", studentDocId);
  const newAttendedLectures = (currentAttended || 0) + 1;

  await updateDoc(studentRef, {
    attendedLectures: newAttendedLectures,
    absences: Math.max(0, absences - 1),
    reserveAttendance: Math.max(0, reserveCount - 1),
    lastReserveUsed: serverTimestamp(),
    reserveUsageCount: (currentUsageCount || 0) + 1,
  });

  const usageLogRef = collection(
    db,
    "students",
    studentDocId,
    "reserveUsageLogs"
  );
  await addDoc(usageLogRef, {
    type: "subtract",
    timestamp: serverTimestamp(),
  });
};
