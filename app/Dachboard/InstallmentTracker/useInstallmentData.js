"use client";
// ============================================================
//  useInstallmentData.js  —  Custom Hook
//  إدارة بيانات الأقساط والسحوبات مع Firebase Firestore
// ============================================================
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc, setDoc, deleteField,
  onSnapshot, query, orderBy, serverTimestamp, getDocs, where
} from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig";

const GROUPS_COLLECTION = "installmentGroups";
const WITHDRAWALS_COLLECTION = "installmentWithdrawals";

const GROUP_COLORS = [
  "#6366f1", "#a855f7", "#06b6d4", "#10b981",
  "#f59e0b", "#ef4444", "#ec4899", "#14b8a6",
];

// ─── هيكل الطالب الافتراضي (مطابق لملف الإكسيل) ──────────────
export const defaultStudent = () => ({
  name: "",
  referral: "", // الترشيح
  phone: "", // الرقم
  priceFrontend: 0, // سعر الفرونت
  priceBackend: 0, // سعر الباك
  installment1: 0, // القسط الأول
  date1: "", // تاريخ القسط الأول
  installment2: 0, // القسط الثاني
  date2: "", // تاريخ القسط الثاني
  installment3: 0, // القسط الثالث
  date3: "", // تاريخ القسط الثالث
  notes: "", // ملاحظات
});

// ─── هيكل المجموعة الافتراضية ──────────────────────────────
export const defaultGroup = () => ({
  name: "مجموعة جديدة",
  color: "#6366f1",
  students: [],
  createdAt: null,
});

export function useInstallmentData() {
  const [groupsMeta, setGroupsMeta]       = useState([]);
  const [allStudents, setAllStudents]     = useState([]);
  const [withdrawals, setWithdrawals]     = useState([]);
  const [loadingGroupsMeta, setLoadingGroupsMeta] = useState(true);
  const [loadingStudents, setLoadingStudents]     = useState(true);
  const [loadingWithdraws, setLoadingWithdraws]   = useState(true);
  const [error, setError]                 = useState(null);
  const [saving, setSaving]               = useState(false);

  // ─── Real-time listener للطلاب ─────────────────────────────
  useEffect(() => {
    const q = collection(db, "students");
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ docId: d.id, id: d.id, ...d.data() }));
        setAllStudents(data);
        setLoadingStudents(false);
      },
      (err) => {
        console.error("Firestore students error:", err);
        setError(err.message);
        setLoadingStudents(false);
      }
    );
    return () => unsub();
  }, []);

  // ─── Real-time listener للمجموعات (البيانات الوصفية) ─────────
  useEffect(() => {
    const q = query(collection(db, GROUPS_COLLECTION), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setGroupsMeta(data);
        setLoadingGroupsMeta(false);
      },
      (err) => {
        console.error("Firestore groups error:", err);
        setError(err.message);
        setLoadingGroupsMeta(false);
      }
    );
    return () => unsub();
  }, []);

  // ─── Real-time listener للسحوبات ───────────────────────────
  useEffect(() => {
    const q = query(collection(db, WITHDRAWALS_COLLECTION), orderBy("date", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setWithdrawals(data);
        setLoadingWithdraws(false);
      },
      (err) => {
        console.error("Firestore withdrawals error:", err);
        setError(err.message);
        setLoadingWithdraws(false);
      }
    );
    return () => unsub();
  }, []);

  // ─── تجميع الطلاب والمجموعات ──────────────────────────────────
  const groups = useMemo(() => {
    // 1. تجميع الطلاب حسب مجموعاتهم
    const groupedStudents = {};
    allStudents.forEach((student) => {
      const gName = student.group || "غير محدد";
      if (!groupedStudents[gName]) {
        groupedStudents[gName] = [];
      }
      
      const isBackend = student.track === "backend" || student.subscriptionType?.toLowerCase().includes("back");
      const priceFrontend = student.priceFrontend ?? (isBackend ? 0 : (student.totalPrice || 0));
      const priceBackend = student.priceBackend ?? (isBackend ? (student.totalPrice || 0) : 0);
      const installment1 = student.installment1 ?? (student.paidAmount || 0);
      const installment2 = student.installment2 ?? 0;
      const installment3 = student.installment3 ?? 0;

      groupedStudents[gName].push({
        id: student.docId || student.id?.toString(),
        docId: student.docId || student.id?.toString(),
        name: student.name || "",
        phone: student.phone || student.docId || student.id?.toString() || "",
        referral: student.referredBy || student.referral || "",
        priceFrontend,
        priceBackend,
        installment1,
        installment2,
        installment3,
        date1: student.date1 || "",
        date2: student.date2 || "",
        date3: student.date3 || "",
        notes: student.notes || "",
      });
    });

    // 2. دمج البيانات الوصفية للمجموعات مع الطلاب
    const finalGroups = groupsMeta.map((g) => {
      const gStudents = groupedStudents[g.name] || [];
      // إزالة اسم المجموعة لعدم التكرار
      delete groupedStudents[g.name];
      return {
        id: g.id,
        name: g.name,
        color: g.color || "#6366f1",
        students: gStudents,
      };
    });

    // 3. إضافة المجموعات التي ظهرت من الطلاب ولم تكن موجودة في groupsMeta
    Object.keys(groupedStudents).forEach((gName) => {
      const hash = gName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const color = GROUP_COLORS[hash % GROUP_COLORS.length] || "#6366f1";
      finalGroups.push({
        id: gName,
        name: gName,
        color,
        students: groupedStudents[gName],
      });
    });

    return finalGroups;
  }, [groupsMeta, allStudents]);

  // ─── إضافة مجموعة جديدة ────────────────────────────────────
  const addGroup = useCallback(async (groupData = {}) => {
    setSaving(true);
    try {
      // إضافة المجموعة في installmentGroups
      await addDoc(collection(db, GROUPS_COLLECTION), {
        name: groupData.name || "مجموعة جديدة",
        color: groupData.color || "#6366f1",
        createdAt: serverTimestamp(),
      });

      // أيضاً إضافة/تحديث المجموعة في محاضرات lectures/groups
      const groupRef = doc(db, "lectures", "groups");
      const groupSnap = await getDoc(groupRef);
      if (groupSnap.exists()) {
        await updateDoc(groupRef, {
          [groupData.name]: {
            count: 1,
            status: true,
          }
        });
      } else {
        await setDoc(groupRef, {
          [groupData.name]: {
            count: 1,
            status: true,
          }
        });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, []);

  // ─── تحديث مجموعة ──────────────────────────────────────────
  const updateGroup = useCallback(async (groupId, updates) => {
    setSaving(true);
    try {
      const oldGroup = groupsMeta.find(g => g.id === groupId) || { name: groupId };
      const oldGroupName = oldGroup.name;

      // 1. لو تم تعديل الاسم، نقوم بتحديث المجموعة لكل الطلاب المنتمين لها
      if (updates.name && updates.name !== oldGroupName) {
        const q = query(collection(db, "students"), where("group", "==", oldGroupName));
        const snapshot = await getDocs(q);
        const batchPromises = snapshot.docs.map(studentDoc => {
          return updateDoc(doc(db, "students", studentDoc.id), { group: updates.name });
        });
        await Promise.all(batchPromises);
        
        // تحديث الاسم أيضاً في lectures/groups
        const groupLecturesRef = doc(db, "lectures", "groups");
        const groupLecturesSnap = await getDoc(groupLecturesRef);
        if (groupLecturesSnap.exists()) {
          const data = groupLecturesSnap.data();
          const oldGroupData = data[oldGroupName] || { count: 1, status: true };
          await updateDoc(groupLecturesRef, {
            [updates.name]: oldGroupData,
            [oldGroupName]: deleteField()
          });
        }
      }

      // 2. تحديث metadata المجموعة في installmentGroups
      if (groupsMeta.some(g => g.id === groupId)) {
        await updateDoc(doc(db, GROUPS_COLLECTION, groupId), {
          ...updates,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, GROUPS_COLLECTION, groupId), {
          name: updates.name || oldGroupName,
          color: updates.color || "#6366f1",
          createdAt: serverTimestamp(),
        });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, [groupsMeta]);

  // ─── حذف مجموعة ────────────────────────────────────────────
  const deleteGroup = useCallback(async (groupId) => {
    setSaving(true);
    try {
      const groupObj = groupsMeta.find(g => g.id === groupId) || { name: groupId };
      const groupName = groupObj.name;

      if (groupsMeta.some(g => g.id === groupId)) {
        await deleteDoc(doc(db, GROUPS_COLLECTION, groupId));
      }

      // حذف كل الطلاب في هذه المجموعة
      const q = query(collection(db, "students"), where("group", "==", groupName));
      const snapshot = await getDocs(q);
      const batchPromises = snapshot.docs.map(studentDoc => {
        return deleteDoc(doc(db, "students", studentDoc.id));
      });
      await Promise.all(batchPromises);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, [groupsMeta]);

  // ─── إضافة طالب لمجموعة ────────────────────────────────────
  const addStudent = useCallback(async (groupId, studentData = {}) => {
    setSaving(true);
    try {
      const phoneClean = studentData.phone ? studentData.phone.trim() : "";
      if (!phoneClean) throw new Error("رقم الهاتف مطلوب");

      const studentRef = doc(db, "students", phoneClean);

      // جلب آخر تاسك للمجموعة لوضعها للطالب الجديد بدرجة صفر
      const groupQuery = query(collection(db, "students"), where("group", "==", groupId));
      const groupSnapshot = await getDocs(groupQuery);
      let initialTasks = [];
      if (!groupSnapshot.empty) {
        const sampleStudent = groupSnapshot.docs[0].data();
        const sampleTasks = sampleStudent.tasks || [];
        if (sampleTasks.length > 0) {
          const latestTask = sampleTasks.reduce((latest, current) => {
            return current.id > latest.id ? current : latest;
          });
          initialTasks = [{ ...latestTask, score: 0 }];
        }
      }
      if (initialTasks.length === 0) {
        initialTasks = [{ id: 1, name: "Task - 1", score: 0 }];
      }

      const priceFrontend = Number(studentData.priceFrontend) || 0;
      const priceBackend = Number(studentData.priceBackend) || 0;
      const totalPrice = priceFrontend + priceBackend;
      const installment1 = Number(studentData.installment1) || 0;
      const installment2 = Number(studentData.installment2) || 0;
      const installment3 = Number(studentData.installment3) || 0;
      const totalPaid = installment1 + installment2 + installment3;

      await setDoc(studentRef, {
        name: studentData.name,
        id: Number(phoneClean),
        password: phoneClean.slice(-4),
        group: groupId,
        subscriptionType: priceBackend > 0 ? "Back End" : "Front End",
        totalPrice,
        paidAmount: totalPaid,
        remainingAmount: totalPrice - totalPaid,
        startLecture: 1,
        attendedLectures: 1,
        reserveAttendance: 1,
        tasks: initialTasks,
        createdAt: new Date().toISOString(),
        referredBy: studentData.referral || "",
        phone: phoneClean,
        priceFrontend,
        priceBackend,
        installment1,
        installment2,
        installment3,
        date1: studentData.date1 || "",
        date2: studentData.date2 || "",
        date3: studentData.date3 || "",
        notes: studentData.notes || "",
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, []);

  // ─── تحديث طالب ────────────────────────────────────────────
  const updateStudent = useCallback(async (groupId, studentId, updates) => {
    setSaving(true);
    try {
      const studentRef = doc(db, "students", studentId);
      const studentSnap = await getDoc(studentRef);
      if (!studentSnap.exists()) throw new Error("الطالب غير موجود");
      const currentData = studentSnap.data();

      // حساب القيم المالية
      const isBackend = currentData.track === "backend" || currentData.subscriptionType?.toLowerCase().includes("back");
      
      const priceFrontend = Number(updates.priceFrontend !== undefined ? updates.priceFrontend : (currentData.priceFrontend ?? (isBackend ? 0 : (currentData.totalPrice || 0))));
      const priceBackend = Number(updates.priceBackend !== undefined ? updates.priceBackend : (currentData.priceBackend ?? (isBackend ? (currentData.totalPrice || 0) : 0)));
      const totalPrice = priceFrontend + priceBackend;

      const installment1 = Number(updates.installment1 !== undefined ? updates.installment1 : (currentData.installment1 ?? (currentData.paidAmount || 0)));
      const installment2 = Number(updates.installment2 !== undefined ? updates.installment2 : (currentData.installment2 ?? 0));
      const installment3 = Number(updates.installment3 !== undefined ? updates.installment3 : (currentData.installment3 ?? 0));
      const paidAmount = installment1 + installment2 + installment3;

      const remainingAmount = totalPrice - paidAmount;

      // تحديث البيانات في Firestore
      await updateDoc(studentRef, {
        ...updates,
        totalPrice,
        paidAmount,
        remainingAmount,
        priceFrontend,
        priceBackend,
        installment1,
        installment2,
        installment3,
        // تحديث referredBy لو تم تعديل referral
        ...(updates.referral !== undefined ? { referredBy: updates.referral } : {}),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, []);

  // ─── حذف طالب ──────────────────────────────────────────────
  const deleteStudent = useCallback(async (groupId, studentId) => {
    setSaving(true);
    try {
      await deleteDoc(doc(db, "students", studentId));
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, []);

  // ─── عمليات السحوبات ───────────────────────────────────────
  const addWithdrawal = useCallback(async (withdrawalData = {}) => {
    setSaving(true);
    try {
      await addDoc(collection(db, WITHDRAWALS_COLLECTION), {
        date: withdrawalData.date || new Date().toISOString().slice(0, 10),
        amount: Number(withdrawalData.amount) || 0,
        reason: withdrawalData.reason || "",
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, []);

  const updateWithdrawal = useCallback(async (id, updates) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, WITHDRAWALS_COLLECTION, id), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteWithdrawal = useCallback(async (id) => {
    setSaving(true);
    try {
      await deleteDoc(doc(db, WITHDRAWALS_COLLECTION, id));
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, []);

  // ─── إحصائيات إجمالية (الخزنة والمجموعات) ───────────────────
  const stats = useMemo(() => {
    let totalStudents = 0, totalRevenue = 0, totalCollected = 0;
    groups.forEach((g) => {
      const sts = g.students || [];
      totalStudents += sts.length;
      sts.forEach((s) => {
        const totalCost = (Number(s.priceFrontend) || 0) + (Number(s.priceBackend) || 0);
        totalRevenue   += totalCost;
        totalCollected += Number(s.installment1) || 0;
        totalCollected += Number(s.installment2) || 0;
        totalCollected += Number(s.installment3) || 0;
      });
    });

    const totalWithdrawals = withdrawals.reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
    const vaultBalance = totalCollected - totalWithdrawals;

    return {
      totalStudents,
      totalRevenue,
      totalCollected,
      totalWithdrawals,
      vaultBalance,
      groupCount: groups.length
    };
  }, [groups, withdrawals]);

  return {
    groups,
    withdrawals,
    loading: loadingGroupsMeta || loadingStudents || loadingWithdraws,
    error,
    saving,
    stats,
    addGroup,
    updateGroup,
    deleteGroup,
    addStudent,
    updateStudent,
    deleteStudent,
    addWithdrawal,
    updateWithdrawal,
    deleteWithdrawal,
  };
}
