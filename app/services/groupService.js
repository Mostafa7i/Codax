import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

/**
 * جلب عدد المحاضرات الإجمالي لمجموعة معينة
 */
export async function fetchGroupSpecificTotalLectures(groupName) {
  if (!groupName) return 0;
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
    console.error(
      `Error fetching total lectures for group '${groupName}':`,
      error
    );
    return 0;
  }
}

/**
 * جلب قائمة المجموعات الفريدة
 */
export const fetchUniqueGroups = async () => {
  try {
    const studentsRef = collection(db, "students");
    const snap = await getDocs(studentsRef);
    const allGroups = snap.docs.map((d) => d.data().group).filter(Boolean);
    return [...new Set(allGroups)];
  } catch (err) {
    console.error("Error fetching unique groups:", err);
    return [];
  }
};

/**
 * جلب طلاب مجموعة معينة مع استبعاد طالب محدد (لصفحة تحويل النقاط)
 */
export const fetchGroupStudents = async (selectedGroup, currentStudentId) => {
  try {
    const studentsRef = collection(db, "students");
    const groupQuery =
      !selectedGroup || selectedGroup === "الكل"
        ? query(studentsRef)
        : query(studentsRef, where("group", "==", selectedGroup));

    const snap = await getDocs(groupQuery);
    return snap.docs
      .map((d) => d.data())
      .filter((s) => s.id !== Number(currentStudentId));
  } catch (err) {
    console.error("Error fetching group students:", err);
    return [];
  }
};

/**
 * جلب تفاصيل مهام المجموعة
 */
export const fetchGroupTaskDetails = async (selectedGroup) => {
  if (!selectedGroup) return null;
  try {
    const tasksRef = collection(db, "groupTasks");
    const q = query(tasksRef, where("groupName", "==", selectedGroup));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;
    return snapshot.docs[0].data();
  } catch (error) {
    console.error("Error fetching task details:", error);
    return null;
  }
};

/**
 * جلب أوائل التاسك لمجموعة
 */
export const fetchTopTaskStudents = async (selectedGroup) => {
  if (!selectedGroup) return { topStudents: [], taskTitle: "" };
  try {
    const docRef = doc(db, "topTaskStudents", selectedGroup);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        topStudents: data.students || [],
        taskTitle: data.taskTitle || "",
      };
    }
    return { topStudents: [], taskTitle: "" };
  } catch (err) {
    console.error("Error fetching top task students:", err);
    return { topStudents: [], taskTitle: "" };
  }
};

/**
 * جلب أوائل الاختبار لمجموعة مع سجل الاختبارات السابقة
 */
export const fetchTopTestStudents = async (selectedGroup) => {
  if (!selectedGroup) return { topTestStudents: [], testTitle: "", history: [] };
  try {
    const docRef = doc(db, "topTestStudents", selectedGroup);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        topTestStudents: data.students || [],
        testTitle: data.testTitle || "",
        history: Array.isArray(data.history) ? data.history : [],
        updatedAt: data.updatedAt || null,
      };
    }
    return { topTestStudents: [], testTitle: "", history: [] };
  } catch (err) {
    console.error("Error fetching top test students:", err);
    return { topTestStudents: [], testTitle: "", history: [] };
  }
};
