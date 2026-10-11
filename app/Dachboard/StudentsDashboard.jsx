"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { auth, db } from "@/app/services/firebaseConfig";
import {
  collection,
  doc,
  updateDoc,
  onSnapshot,
  getDocs,
  query,
  where,
  setDoc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";

import {
  ChevronUp,
  ChevronDown,
  Edit2,
  Award,
  AlertTriangle,
  CheckCircle,
  Search,
} from "lucide-react";

const defaultAvatar = "/favicon.png";

import { serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Swal from "sweetalert2";
import { useLatestLecture } from "@/app/context/LatestLectureContext";
import { useGroupContext } from "@/app/context/GroupContextProvider";
import StudentModal from "./StudentModal";
import StudentMangment from "./StudentMangment";
import { useRouter } from "next/navigation";

const StudentsDashboard = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [newTask, setNewTask] = useState({ name: "", score: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOption, setSelectedOption] = useState("startLecture");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [user, setUser] = useState(null);
  const modalRef = useRef(null);
  const { latestLectures } = useLatestLecture();
  const latestLecture = latestLectures?.[selectedGroup]?.count || 0;
  const [groupName, setGroupName] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    reserve: false,
    report: false,
    reportMony: false,
    mangementGroup: false,
  });
  const [isUpdateSuccess, setIsUpdateSuccess] = useState(false);
  const { availableGroups, setGroupLectures, groupLectures } =
    useGroupContext();
  // وسيتم جلب الطلاب في useEffect موحد بالأسفل لمنع التكرار وتسريب الاتصال بكومبوننت firebase

  const handleGroupChange = (group) => {
    setSelectedGroup(group);
  };

  // دالة تحديث عدد المحاضرات لمجموعة محددة
  const updateGroupLecture = async (group, newLectureCount) => {
    try {
      const lecturesRef = doc(db, "lectures", "groups");
      await updateDoc(lecturesRef, {
        [`${group}.count`]: parseInt(newLectureCount),
      });

      setGroupLectures((prev) => ({
        ...prev,
        [group]: {
          ...prev[group],
          count: parseInt(newLectureCount),
        },
      }));

      return true;
    } catch (error) {
      console.error("Error updating group lecture:", error);
      return false;
    }
  };

  const toggleSection = (section) => {
    if (!selectedGroup)
      return Swal.fire({
        title: "اختر مجموعة اولاً",
        icon: "warning",
      });
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };
  // دالة إضافة طالب جديد
  const handleAddStudent = async () => {
    const { value: formValues } = await Swal.fire({
      title: "إضافة طالب جديد",
      html: `
      <input id="studentName" class="swal2-input" placeholder="اسم الطالب" required>
      <input id="studentPhone" class="swal2-input" placeholder="رقم الموبايل" type="tel" maxlength="11" minlength="11" required>
      <select id="subscriptionType" class="swal2-input" required>
        <option value hidden="">اختر نوع الاشتراك</option>
        <option value="Front End">Front End</option>
        <option value="Back End">Back End</option>
      </select>

      <input id="totalPrice" class="swal2-input" placeholder="سعر الاشتراك الكلي" type="number" min="0" required>
      <input id="paidAmount" class="swal2-input" placeholder="المدفوع" type="number" min="0" required>

      <p>المجموعة: ${selectedGroup}</p>
    `,
      focusConfirm: false,
      preConfirm: () => {
        const name = document.getElementById("studentName").value.trim();
        const phone = document.getElementById("studentPhone").value.trim();
        const subscriptionType = document
          .getElementById("subscriptionType")
          .value.trim();
        const totalPrice = Number(document.getElementById("totalPrice").value);
        const paidAmount = Number(document.getElementById("paidAmount").value);

        // ✅ تحقق من الحقول المطلوبة + رقم الموبايل
        if (
          !name ||
          !phone ||
          !subscriptionType ||
          totalPrice <= 0 ||
          paidAmount < 0
        ) {
          Swal.showValidationMessage("جميع الحقول مطلوبة ويجب أن تكون صحيحة");
          return false;
        }

        if (phone.length !== 11) {
          Swal.showValidationMessage("رقم الموبايل يجب أن يكون 11 رقمًا");
          return false;
        }

        // ✅ الباسورد تلقائي آخر 4 أرقام من رقم الموبايل
        const password = phone.slice(-4);

        return {
          name,
          phone,
          password,
          subscriptionType,
          totalPrice,
          paidAmount,
          group: selectedGroup,
        };
      },
      confirmButtonText: "إضافة الطالب",
      cancelButtonText: "إلغاء",
      showCancelButton: true,
    });

    if (!formValues) return;

    try {
      // ✅ الخطوة 1: البحث عن طالب موجود في نفس المجموعة لجلب هيكل التاسكات
      const groupQuery = query(
        collection(db, "students"),
        where("group", "==", selectedGroup),
        // limit(1) // نكتفي بطالب واحد فقط لزيادة الكفاءة
      );
      const groupSnapshot = await getDocs(groupQuery);

      let initialTasks = [];
      if (!groupSnapshot.empty) {
        // ✅ جمع كافة المهام الفريدة من جميع طلاب المجموعة لضمان نسخ كل التاسكات
        const groupTasksMap = new Map();
        groupSnapshot.docs.forEach((d) => {
          const sTasks = d.data().tasks || [];
          sTasks.forEach((t) => {
            if (t && t.name && !groupTasksMap.has(t.name.trim())) {
              groupTasksMap.set(t.name.trim(), {
                id: t.id,
                name: t.name,
                score: 0,
                submissionType: t.submissionType || "file",
                enabled: false, // مقفول افتراضياً للطالب الجديد
              });
            }
          });
        });

        initialTasks = Array.from(groupTasksMap.values()).sort(
          (a, b) => (Number(a.id) || 0) - (Number(b.id) || 0),
        );
      }
      // إذا لم يتم العثور على أي تاسكات في المجموعة، أنشئ تاسكاً افتراضياً مقفولاً
      if (initialTasks.length === 0) {
        initialTasks = [
          {
            id: 1,
            name: "Task - 1",
            score: 0,
            submissionType: "file",
            enabled: false,
          },
        ];
      }
      const studentRef = doc(db, "students", formValues.phone);

      await setDoc(studentRef, {
        name: formValues.name,
        id: Number(formValues.phone),
        password: formValues.password, // ✅ يستخدم الباسورد المُولد
        group: formValues.group,
        subscriptionType: formValues.subscriptionType,
        totalPrice: formValues.totalPrice,
        paidAmount: formValues.paidAmount,
        remainingAmount: formValues.totalPrice - formValues.paidAmount,
        startLecture: groupLectures[formValues.group]?.count || 1,
        attendedLectures: 1,
        reserveAttendance: 1,
        tasks: initialTasks,
        createdAt: new Date().toISOString(),
      });

      Swal.fire(
        "تمت الإضافة!",
        `تم إضافة الطالب إلى مجموعة ${formValues.group} بنجاح`,
        "success",
      );
    } catch (error) {
      console.error("🔥 Error adding student:", error);
      Swal.fire("خطأ!", "حدث خطأ أثناء إضافة الطالب. حاول مرة أخرى.", "error");
    }
  };

  const handleAddTaskToGroup = async () => {
    // ── Step 1: جلب التاسكات الحالية للمجموعة كمرجع ──
    let existingTasksSample = [];
    let suggestedName = "";
    try {
      const q = query(
        collection(db, "students"),
        where("group", "==", selectedGroup),
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const sampleData = snap.docs[0].data();
        existingTasksSample = [...(sampleData.tasks || [])].sort(
          (a, b) => a.id - b.id,
        );
      }

      // ── اقتراح اسم التاسك التالي تلقائياً ──
      if (existingTasksSample.length > 0) {
        const lastTask = existingTasksSample[existingTasksSample.length - 1];
        const lastName = lastTask.name || "";
        // نمط: "Task - 3" أو "Task-3" أو "تاسك 3"
        const numberMatch = lastName.match(/(\d+)\s*$/);
        if (numberMatch) {
          const nextNum = parseInt(numberMatch[1]) + 1;
          suggestedName = lastName.replace(/(\d+)\s*$/, String(nextNum));
        } else {
          suggestedName = lastName + " 2";
        }
      } else {
        suggestedName = "Task - 1";
      }
    } catch (err) {
      console.error("خطأ في جلب التاسكات:", err);
    }

    // ── بناء HTML للتاسكات الحالية ──
    const tasksListHTML =
      existingTasksSample.length > 0
        ? `<div style="margin-bottom:12px; background:#f8f7ff; border:1px solid #e2e0ff; border-radius:12px; padding:10px; text-align:right; direction:rtl; max-height:180px; overflow-y:auto;">
          <p style="font-size:12px; color:#7c3aed; font-weight:bold; margin:0 0 8px 0;">📋 التاسكات الحالية في مجموعة ${selectedGroup}:</p>
          ${existingTasksSample
            .map(
              (t) =>
                `<div style="display:flex; justify-content:space-between; align-items:center; padding:5px 8px; background:white; border-radius:8px; margin-bottom:4px; border:1px solid #ede9fe;">
              <span style="font-size:12px; font-weight:bold; color:#1f2937;">${t.name}</span>
              <span style="font-size:11px; color:#9ca3af; background:#f3f4f6; padding:1px 6px; border-radius:999px;">ID: ${t.id}</span>
            </div>`,
            )
            .join("")}
        </div>`
        : `<div style="margin-bottom:12px; padding:8px; background:#fef9c3; border-radius:10px; font-size:12px; color:#92400e; direction:rtl;">⚠️ لا توجد تاسكات في هذه المجموعة بعد.</div>`;

    const lastTaskInfo =
      existingTasksSample.length > 0
        ? `<p style="font-size:11px; color:#6b7280; text-align:right; direction:rtl; margin-bottom:6px;">
           آخر تاسك: <strong style="color:#4f46e5;">${existingTasksSample[existingTasksSample.length - 1].name}</strong>
           &nbsp;•&nbsp; الاقتراح التالي: <strong style="color:#059669;">${suggestedName}</strong>
         </p>`
        : "";

    // ── Step 2: فتح Dialog الإضافة ──
    const { value: formResult } = await Swal.fire({
      title: `➕ إضافة تاسك جديد`,
      html: `
        ${tasksListHTML}
        ${lastTaskInfo}
        <input
          id="swal-task-name"
          class="swal2-input"
          placeholder="اسم التاسك الجديد"
          value="${suggestedName}"
          style="direction:rtl; text-align:right; font-size:14px; font-weight:bold; width: 90%; margin: 10px auto;"
          dir="rtl"
        />
        <div style="margin-top:14px; text-align:right; direction:rtl; width:90%; margin-left:auto; margin-right:auto;">
          <label style="font-size:13px; font-weight:bold; color:#374151; display:block; margin-bottom:8px;">
            🎯 طريقة التسليم المسموحة للطلاب (اختر نوعاً واحداً):
          </label>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <label style="display:flex; align-items:center; gap:8px; padding:10px; border:2px solid #e0e7ff; border-radius:12px; cursor:pointer; background:#f8fafc; text-align:right;">
              <input type="radio" name="swal-submission-type" value="file" checked style="accent-color:#6366f1; width:16px; height:16px;" />
              <div>
                <strong style="display:block; font-size:12px; color:#1e1b4b;">📁 ملف مضغوط</strong>
                <span style="font-size:10px; color:#6b7280;">.zip, .rar فقط</span>
              </div>
            </label>
            <label style="display:flex; align-items:center; gap:8px; padding:10px; border:2px solid #e0e7ff; border-radius:12px; cursor:pointer; background:#f8fafc; text-align:right;">
              <input type="radio" name="swal-submission-type" value="link" style="accent-color:#6366f1; width:16px; height:16px;" />
              <div>
                <strong style="display:block; font-size:12px; color:#1e1b4b;">🔗 رابط خارجي</strong>
                <span style="font-size:10px; color:#6b7280;">GitHub / لايف لينك</span>
              </div>
            </label>
          </div>
          <p style="font-size:11px; color:#ef4444; font-weight:bold; margin-top:6px;">
            ⚠️ سيتمكن الطالب من التسليم بالطريقة المحددة فقط دون إمكانية التبديل.
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "✅ إضافة للجميع",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#7c3aed",
      focusConfirm: false,
      preConfirm: () => {
        const val = document.getElementById("swal-task-name")?.value?.trim();
        if (!val) {
          Swal.showValidationMessage("⚠️ يجب إدخال اسم التاسك!");
          return false;
        }
        // التحقق من عدم التكرار
        const isDuplicate = existingTasksSample.some(
          (t) => t.name.toLowerCase() === val.toLowerCase(),
        );
        if (isDuplicate) {
          Swal.showValidationMessage(
            `⛔ يوجد تاسك بنفس الاسم "${val}" بالفعل!`,
          );
          return false;
        }

        const selectedType =
          document.querySelector('input[name="swal-submission-type"]:checked')
            ?.value || "file";

        return {
          taskName: val,
          submissionType: selectedType,
        };
      },
    });

    if (!formResult) return;
    const { taskName, submissionType } = formResult;

    // ── Step 3: إضافة التاسك لكل طلاب المجموعة ──
    try {
      const q = query(
        collection(db, "students"),
        where("group", "==", selectedGroup),
      );
      const studentSnapshot = await getDocs(q);

      const updatePromises = studentSnapshot.docs.map(async (studentDoc) => {
        const studentRef = doc(db, "students", studentDoc.id);
        const studentData = studentDoc.data();
        const tasks = studentData.tasks ? [...studentData.tasks] : [];
        const newId =
          tasks.length > 0 ? Math.max(...tasks.map((t) => t.id)) + 1 : 1;
        return updateDoc(studentRef, {
          tasks: [
            ...tasks,
            {
              id: newId,
              name: taskName,
              score: 0,
              submissionType: submissionType, // "file" | "link"
              allowedSubmission: submissionType,
            },
          ],
        });
      });

      await Promise.all(updatePromises);

      Swal.fire({
        title: "✅ تم الإضافة!",
        html: `تم إضافة التاسك <strong>"${taskName}"</strong> (تسليم: <strong>${submissionType === "file" ? "ملف مضغوط" : "رابط خارجي"}</strong>) لجميع طلاب مجموعة <strong>${selectedGroup}</strong> بنجاح!`,
        icon: "success",
      });
    } catch (error) {
      console.error("❌ خطأ أثناء إضافة التاسك:", error);
      Swal.fire("❌ خطأ!", "حدث خطأ أثناء إضافة التاسك!", "error");
    }
  };

  const handleDeleteTaskFromGroup = async () => {
    const q = query(
      collection(db, "students"),
      where("group", "==", selectedGroup),
    );
    const studentSnapshot = await getDocs(q);

    const taskKeysSet = new Set();
    const uniqueTasks = [];

    studentSnapshot.docs.forEach((studentDoc) => {
      const studentData = studentDoc.data();
      if (studentData.tasks && Array.isArray(studentData.tasks)) {
        studentData.tasks.forEach((task) => {
          const key = `${task.id}-${task.name}`;
          if (!taskKeysSet.has(key)) {
            taskKeysSet.add(key);
            uniqueTasks.push(task);
          }
        });
      }
    });

    if (uniqueTasks.length === 0) {
      return Swal.fire(
        "لا توجد تاسكات!",
        "لا توجد تاسكات لحذفها في هذه المجموعة.",
        "info",
      );
    }

    uniqueTasks.sort((a, b) => a.id - b.id);

    const taskOptions = {};
    uniqueTasks.forEach((task) => {
      taskOptions[task.id] = `${task.name} (ID: ${task.id})`;
    });

    const { value: taskId } = await Swal.fire({
      title: `احذف تاسك من مجموعة ${selectedGroup}`,
      input: "select",
      inputOptions: taskOptions,
      inputPlaceholder: "اختر التاسك",
      showCancelButton: true,
      confirmButtonText: "التالي",
      cancelButtonText: "إلغاء",
    });

    if (!taskId) return;

    const { isConfirmed } = await Swal.fire({
      title: "هل أنت متأكد؟",
      text: `سيتم حذف التاسك رقم ${taskId} من جميع الطلاب في المجموعة ${selectedGroup}!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "نعم، احذف!",
      cancelButtonText: "إلغاء",
    });

    if (!isConfirmed) return;

    try {
      const updatePromises = studentSnapshot.docs.map(async (studentDoc) => {
        const studentRef = doc(db, "students", studentDoc.id);
        const studentData = studentDoc.data();

        if (!studentData.tasks) return;

        const updatedTasks = studentData.tasks.filter(
          (task) => task.id !== parseInt(taskId),
        );

        return updateDoc(studentRef, { tasks: updatedTasks });
      });

      await Promise.all(updatePromises);
      Swal.fire(
        "تم الحذف!",
        `تم حذف التاسك رقم ${taskId} من المجموعة ${selectedGroup}!`,
        "success",
      );
    } catch (error) {
      console.error("❌ خطأ أثناء حذف التاسك:", error);
      Swal.fire("❌ خطأ!", "حدث خطأ أثناء حذف التاسك!", "error");
    }
  };

  const handleUpdateLecture = async () => {
    const currentCount = groupLectures[selectedGroup]?.count || 0;

    const { value: newLectureCount } = await Swal.fire({
      title: `تحديث عدد محاضرات ${selectedGroup}`,
      input: "number",
      inputValue: currentCount,
      inputPlaceholder: "أدخل عدد المحاضرات الجديد",
      showCancelButton: true,
      confirmButtonText: "التالي",
      cancelButtonText: "إلغاء",
      inputValidator: (value) => {
        if (!value || isNaN(value) || value <= 0) {
          return "يجب إدخال عدد محاضرات صحيح!";
        }
      },
    });

    if (!newLectureCount) return;

    // ✅ التحقق من أن الرقم الجديد أكبر من الحالي
    if (Number(newLectureCount) <= currentCount) {
      await Swal.fire({
        title: "❌ غير مسموح!",
        text: "العدد الجديد يجب أن يكون أكبر من العدد الحالي.",
        icon: "error",
        confirmButtonText: "موافق",
      });
      return; // ⛔ إيقاف التنفيذ
    }

    const { isConfirmed } = await Swal.fire({
      title: "هل أنت متأكد؟",
      text: `سيتم تحديث عدد محاضرات ${selectedGroup} إلى ${newLectureCount}!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "نعم، تحديث!",
      cancelButtonText: "إلغاء",
    });

    if (!isConfirmed) return;

    try {
      // ✅ تحديث عدد المحاضرات في المجموعة
      const success = await updateGroupLecture(selectedGroup, newLectureCount);
      if (success) {
        setIsUpdateSuccess(true);

        await Swal.fire({
          title: "تم التحديث!",
          text: `تم تحديث عدد محاضرات ${selectedGroup} إلى ${newLectureCount} بنجاح!`,
          icon: "success",
          confirmButtonText: "ابدأ تسجيل الحضور",
        });

        // 🔥 بعد التحديث نبدأ تسجيل الحضور
        for (const student of students) {
          const { isConfirmed: attended } = await Swal.fire({
            html: `
                <div class="text-center flex gap-1 justify-center">
                  <img src="${student.profilePic || defaultAvatar}" 
                      onerror="this.src='${defaultAvatar}'" 
                      class="w-12 h-12 rounded-full object-cover" />
                  <div class="text-lg font-bold items-center place-content-center"> ${
                    student.name || "غير معروف"
                  }</div>
                </div>
              `,
            text: "هل حضر المحاضرة؟",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "حضر ✅",
            cancelButtonText: "لم يحضر ❌",
            allowOutsideClick: false,
          });

          if (attended) {
            const current = student.attendedLectures || 0;
            await updateDoc(doc(db, "students", student.docId), {
              attendedLectures: current + 1,
            });
          }
        }

        await Swal.fire({
          title: "🎉 تم تسجيل الحضور!",
          text: "تم تحديث عدد المحاضرات وعدّ الحضور بنجاح.",
          icon: "success",
          confirmButtonText: "تم",
        });

        setTimeout(() => setIsUpdateSuccess(false), 2000);
      }
    } catch (error) {
      console.error("❌ خطأ أثناء تحديث المحاضرات:", error);
      setIsUpdateSuccess(false);
      Swal.fire("❌ خطأ!", "حدث خطأ أثناء تحديث عدد المحاضرات!", "error");
    }
  };

  const handleMoveStudent = async () => {
    // --- الخطوة 1: اختيار الطالب المراد نقله ---
    const { value: studentId } = await Swal.fire({
      title: "نقل طالب",
      input: "select",
      inputOptions: students.reduce((options, student) => {
        options[student.docId] =
          `${student.name} (${student.docId}) - المجموعة الحالية: ${student.group}`;
        return options;
      }, {}),
      inputPlaceholder: "اختر الطالب الذي تريد نقله",
      showCancelButton: true,
      confirmButtonText: "التالي",
      cancelButtonText: "إلغاء",
    });

    if (!studentId) return;

    const studentToMove = students.find((s) => s.docId === studentId);
    const currentGroup = studentToMove.group;
    // جلب القيم الحالية من بيانات الطالب، مع وضع قيمة افتراضية (0) إذا لم تكن موجودة
    const currentAttendedLectures = studentToMove.attendedLectures || 0;
    const currentStartLecture = studentToMove.startLecture || 0;

    // --- الخطوة 2: جلب المجموعات المتاحة ---
    let availableGroups = {};
    try {
      const allStudentsSnapshot = await getDocs(collection(db, "students"));
      const allGroups = new Set();
      allStudentsSnapshot.forEach((doc) => {
        const groupName = doc.data().group;
        if (groupName) allGroups.add(groupName);
      });

      allGroups.forEach((group) => {
        if (group !== currentGroup) {
          availableGroups[group] = group;
        }
      });

      if (Object.keys(availableGroups).length === 0) {
        Swal.fire(
          "لا توجد مجموعات أخرى",
          "لا توجد مجموعات أخرى لنقل الطالب إليها.",
          "info",
        );
        return;
      }
    } catch (error) {
      console.error("خطأ أثناء جلب المجموعات:", error);
      Swal.fire("خطأ!", "حدث خطأ أثناء جلب قائمة المجموعات!", "error");
      return;
    }

    // --- الخطوة 3: اختيار المجموعة الجديدة وتعديل البيانات ---
    const { value: formValues } = await Swal.fire({
      title: "نقل وتعديل بيانات الطالب",
      html:
        // حقل لاختيار المجموعة الجديدة
        `<label for="swal-input-group" class="swal2-label">اختر المجموعة الجديدة</label>` +
        `<select id="swal-input-group" class="swal2-select">${Object.keys(
          availableGroups,
        )
          .map((group) => `<option value="${group}">${group}</option>`)
          .join("")}</select>` +
        // حقل لتعديل عدد المحاضرات التي حضرها
        `<label for="swal-input-lectures" class="swal2-label">تعديل عدد المحاضرات التي حضرها</label>` +
        `<input id="swal-input-lectures" class="swal2-input" type="number" value="${currentAttendedLectures}" placeholder="عدد المحاضرات">` +
        // حقل لتعديل رقم محاضرة البداية
        `<label for="swal-input-start-lecture" class="swal2-label">تعديل رقم محاضرة البداية</label>` +
        `<input id="swal-input-start-lecture" class="swal2-input" type="number" value="${currentStartLecture}" placeholder="محاضرة البداية">`,

      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "نقل",
      cancelButtonText: "إلغاء",
      preConfirm: () => {
        // استخراج القيم من الحقول
        const newGroup = document.getElementById("swal-input-group").value;
        const attendedLectures = document.getElementById(
          "swal-input-lectures",
        ).value;
        const startLecture = document.getElementById(
          "swal-input-start-lecture",
        ).value;

        // التحقق من صحة المدخلات
        if (!attendedLectures || isNaN(attendedLectures)) {
          Swal.showValidationMessage(
            `من فضلك أدخل عددًا صحيحًا للمحاضرات التي حضرها`,
          );
          return false;
        }
        if (!startLecture || isNaN(startLecture)) {
          Swal.showValidationMessage(
            `من فضلك أدخل عددًا صحيحًا لمحاضرة البداية`,
          );
          return false;
        }

        return {
          newGroup: newGroup,
          attendedLectures: parseInt(attendedLectures, 10),
          startLecture: parseInt(startLecture, 10),
        };
      },
    });

    if (!formValues) return;

    const { newGroup, attendedLectures, startLecture } = formValues;

    // --- الخطوة 4: تأكيد عملية النقل والتعديل ---
    const { isConfirmed } = await Swal.fire({
      title: "هل أنت متأكد؟",
      html: `
      <p>سيتم نقل الطالب <b>${studentToMove.name}</b> وتحديث بياناته كالتالي:</p>
      <ul style="text-align: right; list-style-type: none; padding-right: 0;">
        <li><b>المجموعة الجديدة:</b> ${newGroup}</li>
        <li><b>عدد المحاضرات:</b> ${attendedLectures}</li>
        <li><b>محاضرة البداية:</b> ${startLecture}</li>
      </ul>
    `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "نعم، نفذ!",
      cancelButtonText: "إلغاء",
    });

    if (!isConfirmed) return;

    // --- الخطوة 5: تحديث بيانات الطالب في قاعدة البيانات ---
    try {
      const studentRef = doc(db, "students", studentId);
      // تحديث جميع الحقول معًا
      await updateDoc(studentRef, {
        group: newGroup,
        attendedLectures: attendedLectures,
        startLecture: startLecture,
      });
      Swal.fire("تم بنجاح!", "تم نقل الطالب وتعديل بياناته بنجاح!", "success");
    } catch (error) {
      console.error("خطأ أثناء نقل وتعديل الطالب:", error);
      Swal.fire("خطأ!", "حدث خطأ أثناء تحديث بيانات الطالب!", "error");
    }
  };

  const handleDeleteStudent = async () => {
    const { value: studentId } = await Swal.fire({
      title: "حذف طالب",
      input: "select",
      inputOptions: students.reduce((options, student) => {
        options[student.docId] =
          `${student.name} (${student.docId}) - ${student.group}`;
        return options;
      }, {}),
      inputPlaceholder: "اختر الطالب للحذف",
      showCancelButton: true,
      confirmButtonText: "حذف",
      cancelButtonText: "إلغاء",
    });

    if (!studentId) return;

    const { isConfirmed } = await Swal.fire({
      title: "هل أنت متأكد؟",
      text: `سيتم حذف الطالب نهائياً!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "نعم، احذف!",
      cancelButtonText: "إلغاء",
    });

    if (!isConfirmed) return;

    try {
      const studentRef = doc(db, "students", studentId);
      await deleteDoc(studentRef);
      Swal.fire("تم الحذف!", "تم حذف الطالب بنجاح!", "success");
    } catch (error) {
      console.error("خطأ أثناء حذف الطالب:", error);
      Swal.fire("خطأ!", "حدث خطأ أثناء حذف الطالب!", "error");
    }
  };

  const getRemainingLectures = (student, groupName) => {
    // إجمالي محاضرات المجموعة (رقم أو 0 لو مش موجود)
    const total = Number(groupLectures?.[groupName]?.count ?? 0);

    // بداية الطالب (تحويل لـ Number وفرض 0 لو مش موجود)
    const start = Number(student?.startLecture ?? 0);

    // لو انت بتحسب شامل (بـ +1 زي اللي كتبتها) — نفس منطقك:
    const remaining = total + 1 - start;

    // لا نسمح بقيم سالبة
    return Math.max(0, remaining);
  };

  // التحقق من صلاحيات المستخدم
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.email === "mostasafi7@gmail.com") {
        setUser(currentUser);
      } else {
        router.replace("/");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // جلب بيانات الطلاب حسب المجموعة المحددة في الوقت الحقيقي
  useEffect(() => {
    if (!selectedGroup) {
      setStudents([]);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "students"),
      where("group", "==", selectedGroup),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const updatedStudents = snapshot.docs.map((doc) => ({
          docId: doc.id,
          ...doc.data(),
        }));
        setStudents(updatedStudents);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching students:", error);
        Swal.fire("خطأ!", "فشل في جلب بيانات الطلاب", "error");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [selectedGroup]);

  //زر انشاء مجموعه جديده
  const handleAddGroup = async () => {
    if (!groupName.trim()) {
      Swal.fire("اكتب اسم المجموعة أولاً");
      return;
    }

    setLoading(true);
    try {
      const groupRef = doc(db, "lectures", "groups");

      await updateDoc(groupRef, {
        [groupName]: {
          count: 1,
          status: true,
        },
      });
      Swal.fire("✅ تم إنشاء المجموعة بنجاح");
      setGroupName("");
    } catch (error) {
      console.error("Error adding group:", error);
      Swal.fire("حدث خطأ أثناء إنشاء المجموعة");
    } finally {
      setLoading(false);
    }
  };

  const getAbsenceStatus = (absences) => {
    if (absences >= 12)
      return {
        color: "text-red-600",
        bg: "bg-red-50",
        icon: <AlertTriangle className="w-4 h-4" />,
        text: "لا يوجد شهادة",
      };
    if (absences >= 7)
      return {
        color: "text-yellow-600",
        bg: "bg-yellow-50",
        icon: <AlertTriangle className="w-4 h-4" />,
        text: "⚠️",
      };
    return {
      color: "text-green-600",
      bg: "bg-green-50",
      icon: <CheckCircle className="w-4 h-4" />,
      text: "",
    };
  };

  const SortButton = ({ label, sortKey }) => (
    <button
      onClick={() => handleSort(sortKey)}
      className="flex items-center justify-center  w-full text-xs rounded  transition-colors group"
    >
      <span className="font-semibold">{label}</span>
      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
        {sortConfig.key === sortKey ? (
          sortConfig.direction === "ascending" ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )
        ) : (
          <ChevronUp className="w-4 h-4 opacity-30" />
        )}
      </span>
    </button>
  );
  const handleEditClick = (student) => {
    setSelectedStudent(student); // نحدد الطالب المختار في الـ state للعرض في المودال

    // ✅ الخطوة 2: نملأ بيانات التعديل من المتغير 'student' مباشرة
    setEditedData({
      attendedLectures: student.attendedLectures || 0,
      tasks: student.tasks ? student.tasks.map((task) => ({ ...task })) : [],
      note: student.note || "",
      subscriptionType: student.subscriptionType || "", // <-- استخدام 'student'
      totalPrice: student.totalPrice || 0, // <-- استخدام 'student'
      paidAmount: student.paidAmount || 0, // <-- استخدام 'student'
    });

    setShowModal(true); // نظهر المودال بعد تجهيز البيانات الصحيحة
  };

  ///////////////////////////////////////////////////////////////////
  ///ملاحظة التاسكس
  // دالة لتحديث حالة الملاحظات عند التعديل
  const handleTaskNotesChange = (e, taskIndex) => {
    const updatedTasks = [...editedData.tasks];
    updatedTasks[taskIndex] = {
      ...updatedTasks[taskIndex],
      notes: e.target.value,
    };

    setEditedData({
      ...editedData,
      tasks: updatedTasks,
    });
  };

  //////////////////////////////////////////////////////////////////////////////////////////////////

  const fetchStudents = async () => {
    try {
      setLoading(true);

      const q = query(
        collection(db, "students"),
        where("group", "==", selectedGroup),
      );

      const querySnapshot = await getDocs(q);

      // استخدم Promise.all لجلب عدد الاستخدام لكل طالب من السجل الفرعي
      const studentsData = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          const reserveUsageCount = await getReserveUsageCount(doc.id); // جلب العد من السجل الفرعي
          return {
            docId: doc.id,
            ...data,
            reserveAttendance: data.reserveAttendance || 0,
            reserveUsageCount: reserveUsageCount || 0,
          };
        }),
      );

      setStudents(studentsData);
    } catch (error) {
      console.error("Error fetching students:", error);
      Swal.fire("خطأ!", "فشل في جلب بيانات الطلاب", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateReserveForOne = async (studentCustomId, amount) => {
    try {
      const studentsRef = collection(db, "students");
      const q = query(studentsRef, where("id", "==", studentCustomId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.error("Student not found with id:", studentCustomId);
        return;
      }

      const docSnap = querySnapshot.docs[0];
      const studentRef = doc(db, "students", docSnap.id);
      const student = docSnap.data();

      const current = Number(student.reserveAttendance) || 0;
      const newCount = amount === 0 ? 0 : Math.max(0, current + amount);

      await updateDoc(studentRef, {
        reserveAttendance: newCount,
      });

      // 2. حفظ سجل الاستخدام
      const logRef = collection(studentRef, "reserveUsageLogs");
      await addDoc(logRef, {
        type: amount === 0 ? "reset" : amount > 0 ? "add" : "subtract",
        amount: Math.abs(amount),
        timestamp: serverTimestamp(),
      });
      // تحديث الطالب في state الأساسي
      setStudents((prevStudents) =>
        prevStudents.map((s) =>
          s.id === studentCustomId ? { ...s, reserveAttendance: newCount } : s,
        ),
      );

      // تحديث الطالب المحدد في المودال
      setSelectedStudent((prev) =>
        prev && prev.id === studentCustomId
          ? { ...prev, reserveAttendance: newCount }
          : prev,
      );
    } catch (error) {
      console.error("Error updating student reserve:", error);
    }
  };

  const getReserveUsageCount = async (studentDocId) => {
    try {
      const logRef = collection(
        db,
        "students",
        studentDocId,
        "reserveUsageLogs",
      );
      const q = query(logRef, where("type", "==", "subtract"));
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error("Error fetching reserve usage count:", error);
      return 0; // يرجع صفر لو حصل خطأ بدل ما يكسر اللوجيك
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        await fetchStudents();
      } catch (error) {
        if (isMounted) {
          console.error("Initial load error:", error);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);
  //////////////////////////////////////////////////////////////////////////////////////////////
  const handleInputChange = (e, index) => {
    const { name, value } = e.target;
    if (name === "attendedLectures") {
      setEditedData((prev) => ({ ...prev, attendedLectures: parseInt(value) }));
    } else {
      const updatedTasks = [...editedData.tasks];
      updatedTasks[index].score = parseInt(value);
      setEditedData((prev) => ({ ...prev, tasks: updatedTasks }));
    }
  };

  const handleAddTask = (taskData = null) => {
    const taskToAdd = taskData || newTask;
    if (!taskToAdd.name || taskToAdd.name.trim() === "") return;
    setEditedData((prev) => {
      const currentTasks = prev.tasks || [];
      const maxId = currentTasks.reduce(
        (max, t) => Math.max(max, Number(t.id) || 0),
        0,
      );
      return {
        ...prev,
        tasks: [
          ...currentTasks,
          {
            id: maxId + 1,
            name: taskToAdd.name.trim(),
            score: Number(taskToAdd.score) || 0,
            submissionType: taskToAdd.submissionType || "file",
          },
        ],
      };
    });
    setNewTask({ name: "", score: 0, submissionType: "file" });
  };

  const handleDeleteTask = (taskIndex) => {
    setEditedData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((_, index) => index !== taskIndex),
    }));
  };

  const handleSaveChanges = async () => {
    // 1. التحقق من وجود معرف الطالب
    if (!selectedStudent?.docId) {
      console.error("❌ خطأ: لا يوجد docId لهذا الطالب!", selectedStudent);
      return;
    }

    // 2. التحقق من وجود تغييرات فعلية
    const isDataChanged = Object.keys(editedData).some(
      (key) => editedData[key] !== selectedStudent[key],
    );

    if (!isDataChanged) {
      Swal.fire({
        position: "center",
        icon: "info",
        title: "لم يتم إجراء أي تغييرات!",
        showConfirmButton: false,
        timer: 1500,
      });
      return;
    }

    try {
      // دالة مساعدة لتنظيف أي حقول undefined لتجنب أخطاء Firestore
      const sanitizeData = (obj) => {
        if (obj === null || obj === undefined) return null;
        if (Array.isArray(obj)) {
          return obj.map(sanitizeData);
        }
        if (typeof obj === "object") {
          const cleaned = {};
          Object.entries(obj).forEach(([key, val]) => {
            if (key === "docId") return; // لا نحفظ docId كحقل داخل المستند
            if (val !== undefined) {
              cleaned[key] = sanitizeData(val);
            }
          });
          return cleaned;
        }
        return obj;
      };

      // ضمان أن جميع المهام تمتلك ID فريد وبيانات نظيفة
      let sanitizedTasks = editedData.tasks;
      if (Array.isArray(sanitizedTasks)) {
        const seenIds = new Set();
        let maxId = sanitizedTasks.reduce(
          (max, t) => Math.max(max, Number(t.id) || 0),
          0,
        );
        sanitizedTasks = sanitizedTasks.map((t, idx) => {
          let tid = t.id !== undefined && t.id !== null ? Number(t.id) : null;
          if (!tid || seenIds.has(tid)) {
            maxId += 1;
            tid = maxId;
          } else {
            seenIds.add(tid);
          }
          const taskObj = {
            id: tid,
            name: t.name || `Task - ${idx + 1}`,
            score: Number(t.score) || 0,
            submissionType: t.submissionType || "file",
            enabled: t.enabled !== false,
          };
          if (t.isExam !== undefined) taskObj.isExam = Boolean(t.isExam);
          if (t.type !== undefined) taskObj.type = t.type;
          if (t.notes) taskObj.notes = t.notes;
          if (t.submittedFile) taskObj.submittedFile = t.submittedFile;
          if (t.submittedLink) taskObj.submittedLink = t.submittedLink;
          if (t.submittedAt) taskObj.submittedAt = t.submittedAt;
          if (t.submitted !== undefined)
            taskObj.submitted = Boolean(t.submitted);
          return taskObj;
        });
      }

      // 3. إعداد مرجع مستند الطالب
      const studentRef = doc(db, "students", selectedStudent.docId);

      // 4. إعداد البيانات المحدثة مع تاريخ الحفظ
      const rawDataToUpdate = {
        ...editedData, // كل البيانات المعدلة
        tasks: sanitizedTasks || editedData.tasks,
        remainingAmount:
          (editedData.totalPrice || 0) - (editedData.paidAmount || 0),
        lastUpdate: new Date().toLocaleString("ar-EG", {
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      const dataToUpdate = sanitizeData(rawDataToUpdate);

      // 5. حفظ البيانات في Firebase
      await updateDoc(studentRef, dataToUpdate);

      // 6. عرض رسالة نجاح مع تاريخ التحديث
      Swal.fire({
        position: "center",
        icon: "success",
        title: "تم الحفظ بنجاح!",
        html: `تم الحفظ في: <br/><strong>${dataToUpdate.lastUpdate}</strong>`,
        showConfirmButton: false,
        timer: 2000,
      });

      // 7. إغلاق النافذة المنبثقة
      setShowModal(false);
    } catch (error) {
      // 8. معالجة الأخطاء
      console.error("❌ خطأ أثناء تحديث الطالب:", error);
      Swal.fire({
        position: "center",
        icon: "error",
        title: "حدث خطأ أثناء الحفظ!",
        text: error.message,
        showConfirmButton: true,
      });
    }
  };

  useEffect(() => {
    if (showModal && modalRef.current) {
      modalRef.current.scrollTop = modalRef.current.scrollHeight;
    }
  }, [showModal]);

  //  const [selectedOption, setSelectedOption] = useState("startLecture");
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const calculateStudentAverage = (student) => {
    if (
      !student?.tasks ||
      !Array.isArray(student.tasks) ||
      student.tasks.length === 0
    ) {
      return 0;
    }
    const sum = student.tasks.reduce(
      (acc, t) => acc + (Number(t.score) || 0),
      0,
    );
    const avg = Math.round(sum / student.tasks.length);
    return isNaN(avg) ? 0 : avg;
  };

  const calculateAvailableLectures = (student) => {
    const start = Number(student?.startLecture) || 1;
    const available = (Number(latestLecture) || 0) - start + 1;
    return isNaN(available) ? 0 : Math.max(0, available);
  };

  const calculateAbsences = (student) => {
    const attended = Number(student?.attendedLectures) || 0;
    const absences = calculateAvailableLectures(student) - attended;
    return isNaN(absences) ? 0 : Math.max(0, absences);
  };

  const filteredStudents = useMemo(() => {
    let filtered = students.filter((student) =>
      (student.name?.toLowerCase() || "").includes(
        searchQuery?.toLowerCase() || "",
      ),
    );

    // 2. فرز حسب إعدادات المستخدم
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        let aValue, bValue;

        if (sortConfig.key === "name") {
          aValue = a.name || "";
          bValue = b.name || "";
        } else if (sortConfig.key === "average") {
          aValue = calculateStudentAverage(a);
          bValue = calculateStudentAverage(b);
        } else if (sortConfig.key === "attendance") {
          aValue =
            selectedOption === "startLecture"
              ? Number(a.startLecture) || 0
              : selectedOption === "attendedFromLecture"
                ? Number(a.attendedLectures) || 0
                : selectedOption === "vailableLectures"
                  ? calculateAvailableLectures(a)
                  : calculateAbsences(a);
          bValue =
            selectedOption === "startLecture"
              ? Number(b.startLecture) || 0
              : selectedOption === "attendedFromLecture"
                ? Number(b.attendedLectures) || 0
                : selectedOption === "vailableLectures"
                  ? calculateAvailableLectures(b)
                  : calculateAbsences(b);
        } else if (sortConfig.key === "reserveUsageCount") {
          aValue = Number(a.reserveUsageCount) || 0;
          bValue = Number(b.reserveUsageCount) || 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [students, sortConfig, selectedOption, searchQuery]);

  const handleDeleteContent = async (docId, index) => {
    const result = await Swal.fire({
      title: "هل أنت متأكد؟",
      text: "لن تتمكن من التراجع عن هذا الحذف!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "نعم، احذف!",
      cancelButtonText: "إلغاء",
    });

    if (!result.isConfirmed) return;

    try {
      const studentRef = doc(db, "students", docId);

      const student = students.find((s) => s.docId === docId);

      if (!student || !Array.isArray(student.contentReq)) return;

      const updatedContent = student.contentReq.filter((_, i) => i !== index);

      await updateDoc(studentRef, { contentReq: updatedContent });

      Swal.fire({
        icon: "success",
        title: "تم الحذف",
        text: "تم حذف المحتوى بنجاح",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("خطأ أثناء حذف المحتوى:", err);
      Swal.fire({
        icon: "error",
        title: "فشل الحذف",
        text: err.message || "حدث خطأ أثناء الحذف",
      });
    }
  };

  const safeRender = (value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number" && isNaN(value)) return 0;
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return value;
  };

  const financialSummary = useMemo(() => {
    // نستخدم 'filteredStudents' لحساب الإجماليات للطلاب المعروضين فقط
    const totalRevenue = filteredStudents.reduce((sum, student) => {
      return sum + (Number(student.totalPrice) || 0);
    }, 0);

    const totalPaid = filteredStudents.reduce((sum, student) => {
      return sum + (Number(student.paidAmount) || 0);
    }, 0);

    const totalRemaining = Math.max(0, totalRevenue - totalPaid);

    // دالة لتنسيق الأرقام الكبيرة
    const formatCurrency = (number) => {
      const num = Number(number);
      return new Intl.NumberFormat("ar-EG").format(isNaN(num) ? 0 : num);
    };

    return {
      totalRevenue: formatCurrency(totalRevenue),
      totalPaid: formatCurrency(totalPaid),
      totalRemaining: formatCurrency(totalRemaining),
    };
  }, [filteredStudents]); // ✅ يتم إعادة الحساب فقط عند تغيير قائمة الطلاب
  return (
    <div className="container mx-auto">
      <StudentMangment
        students={students}
        groupName={groupName}
        handleAddGroup={handleAddGroup}
        loading={loading}
        availableGroups={availableGroups}
        groupLectures={groupLectures}
        selectedGroup={selectedGroup}
        financialSummary={financialSummary}
        expandedSections={expandedSections}
        setGroupLectures={setGroupLectures}
        setGroupName={setGroupName}
        handleAddStudent={handleAddStudent}
        handleDeleteStudent={handleDeleteStudent}
        handleMoveStudent={handleMoveStudent}
        handleAddTaskToGroup={handleAddTaskToGroup}
        handleDeleteTaskFromGroup={handleDeleteTaskFromGroup}
        handleUpdateLecture={handleUpdateLecture}
        isUpdateSuccess={isUpdateSuccess}
        handleGroupChange={handleGroupChange}
        toggleSection={toggleSection}
      />
      {selectedGroup && (
        <div
          className="w-full  bg-gray-50 dark:bg-transparent mt-4 py-6 min-h-screen"
          dir="rtl"
        >
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                إدارة الطلاب :{" "}
                <span className="text-blue-600">{selectedGroup}</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                عدد الطلاب:{" "}
                <span className="font-semibold">{students.length}</span>
              </p>
            </div>

            {/* Filter Section */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 mb-4">
              <div>
                <select
                  className="w-full md:w-auto px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  onChange={(e) => setSelectedOption(e.target.value)}
                  value={selectedOption}
                >
                  <option value="startLecture">الحضور من المحاضرة</option>
                  <option value="vailableLectures">المحاضرات المتاحة</option>
                  <option value="attendedFromLecture">مرات الحضور</option>
                  <option value="attend">مرات الغياب</option>
                  <option value="reserveAttendance">رصيد المحاضرات</option>
                  <option value="reserveUsageCount">رصيد الاستخدام</option>
                  <option value="certificate">اسم الشهادة</option>
                  <option value="buyers">قاموا بالشراء</option>
                  <option value="sub">الاشتراك</option>
                </select>
              </div>

              {/* Search Bar */}
              <div className="mt-2">
                <div className="relative">
                  <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl pr-12 pl-4 py-3 dark:bg-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="🔍 البحث عن الطالب..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="overflow-x-auto hidden md:block ">
                <table className="w-full">
                  <thead className="bg-linear-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                    <tr>
                      <th className="px-4 py-4 text-center text-gray-700 dark:text-gray-300 font-semibold text-sm">
                        #
                      </th>
                      <th className="px-4 py-4 text-gray-700 dark:text-gray-300">
                        <SortButton label="الاسم" sortKey="name" />
                      </th>
                      <th className="px-4 py-4 text-gray-700 dark:text-gray-300">
                        <SortButton label="البيانات" sortKey="attendance" />
                      </th>
                      <th className="px-4 py-4 text-gray-700 dark:text-gray-300">
                        <SortButton label="المتوسط" sortKey="average" />
                      </th>
                      <th className="px-4 py-4 text-center text-gray-700 dark:text-gray-300 font-semibold text-sm">
                        الإجراءات
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredStudents.map((student, index) => (
                      <tr
                        key={student.docId}
                        className={`
                      border-b border-gray-100 dark:border-gray-800
                      hover:bg-blue-50 dark:hover:bg-gray-800/50 
                      transition-all duration-150 
                      ${
                        index % 2 === 0
                          ? "bg-white dark:bg-gray-900"
                          : "bg-gray-50 dark:bg-gray-900/50"
                      }
                    `}
                      >
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold text-sm">
                            {index + 1}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="relative flex items-center gap-3  top-0">
                            <img
                              className="w-14 h-14  rounded-full object-cover"
                              src={student.profilePic || defaultAvatar}
                            />
                            {student && (
                              <div className="absolute -top-3">
                                {student.contentReq?.some(
                                  (msg) => msg.readMsg === false,
                                ) ? (
                                  <p className="mt-2 cursor-pointer flex justify-center items-center w-5 h-5 rounded-full bg-red-500 text-white text-xs">
                                    {
                                      student.contentReq.filter(
                                        (msg) => msg.readMsg === false,
                                      ).length
                                    }
                                  </p>
                                ) : null}
                              </div>
                            )}

                            <h3 className="font-bold text-gray-900 dark:text-gray-100">
                              {student.name}
                            </h3>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-center">
                          {selectedOption === "startLecture" && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
                              {safeRender(student.startLecture)}
                            </span>
                          )}

                          {selectedOption === "attendedFromLecture" && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">
                              {safeRender(student.attendedLectures)}
                            </span>
                          )}

                          {selectedOption === "vailableLectures" && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium">
                              {safeRender(calculateAvailableLectures(student))}
                            </span>
                          )}

                          {selectedOption === "attend" && (
                            <div className="flex items-center justify-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-medium ${
                                  getAbsenceStatus(calculateAbsences(student))
                                    .bg
                                } ${
                                  getAbsenceStatus(calculateAbsences(student))
                                    .color
                                }`}
                              >
                                {
                                  getAbsenceStatus(calculateAbsences(student))
                                    .icon
                                }
                                {calculateAbsences(student)}
                              </span>
                              {getAbsenceStatus(calculateAbsences(student))
                                .text && (
                                <span className="text-xs">
                                  {
                                    getAbsenceStatus(calculateAbsences(student))
                                      .text
                                  }
                                </span>
                              )}
                            </div>
                          )}

                          {selectedOption === "reserveAttendance" && (
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full font-medium ${
                                student.reserveAttendance === 0
                                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                  : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                              }`}
                            >
                              {student.reserveAttendance}
                            </span>
                          )}

                          {selectedOption === "reserveUsageCount" && (
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full font-medium ${
                                student.reserveUsageCount >= 2
                                  ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                                  : student.reserveUsageCount >= 1
                                    ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {student.reserveUsageCount || 0} مرة
                            </span>
                          )}

                          {selectedOption === "buyers" && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium">
                              {student.buyingHistory?.length || 0} مرة
                            </span>
                          )}

                          {selectedOption === "certificate" && (
                            <div className="flex items-center justify-center gap-2">
                              {student.certificate ? (
                                <>
                                  <Award className="w-4 h-4 text-yellow-500" />
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {student.certificate}
                                  </span>
                                </>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          )}

                          {selectedOption === "sub" && (
                            <div className="flex flex-col items-center gap-1">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full font-bold text-xs ${
                                  student.subscriptionType === "Front End"
                                    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                                    : student.subscriptionType === "Back End"
                                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                      : "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                                }`}
                              >
                                {student.subscriptionType === "Front End"
                                  ? "Front End"
                                  : student.subscriptionType === "Back End"
                                    ? "Back End"
                                    : "Full Stack"}
                              </span>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                <span className="font-medium">
                                  {student.totalPrice} ج.م
                                </span>
                                {student.remainingAmount > 0 && (
                                  <span className="text-red-600 dark:text-red-400 mr-1">
                                    | متبقي: {student.remainingAmount}
                                  </span>
                                )}

                                {student.contentReq?.length > 0 ? (
                                  <p className="mt-2 block cursor-pointer border rounded-md p-1 border-gray-400">
                                    يوجد رسالة!
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4 text-center">
                          <div className="inline-flex items-center gap-2">
                            {student.tasks?.length > 0 ? (
                              <span
                                className={`text-lg font-bold ${
                                  calculateStudentAverage(student) >= 85
                                    ? "text-green-600 dark:text-green-400"
                                    : calculateStudentAverage(student) >= 70
                                      ? "text-yellow-600 dark:text-yellow-400"
                                      : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {calculateStudentAverage(student)}%
                              </span>
                            ) : (
                              <span className="text-gray-400 font-bold">
                                N/A
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(student);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span className="font-medium">تعديل</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-4 text-gray-700 dark:text-gray-300">
                        <SortButton label="الاسم" sortKey="name" />
                      </th>
                      <th className="px-4 py-4 text-gray-700 dark:text-gray-300">
                        <SortButton label="البيانات" sortKey="attendance" />
                      </th>
                      <th className="px-4 py-4 text-gray-700 dark:text-gray-300">
                        <SortButton label="المتوسط" sortKey="average" />
                      </th>
                    </tr>
                  </thead>
                </table>
                {filteredStudents.map((student, index) => (
                  <div
                    key={student.docId}
                    className={`
                      border-b border-gray-200 dark:border-gray-800 p-4 
                      dark:hover:bg-gray-800/50 
                      transition-all duration-150
                      ${
                        index % 2 === 0
                          ? "bg-white dark:bg-gray-900"
                          : " dark:bg-gray-900"
                      }
                    `}
                  >
                    <div
                      className="flex items-center justify-between mb-3 cursor-pointer hover:border-b transition-all"
                      onClick={() => handleEditClick(student)}
                    >
                      <div className="flex items-center gap-3 relative top-0">
                        <img
                          className="w-14 h-14  rounded-full object-cover"
                          src={student.profilePic || defaultAvatar}
                        />

                        {student && (
                          <div className="absolute -top-3">
                            {student.contentReq?.some(
                              (msg) => msg.readMsg === false,
                            ) ? (
                              <p className="mt-2 cursor-pointer flex justify-center items-center w-5 h-5 rounded-full bg-red-500 text-white text-xs">
                                {
                                  student.contentReq.filter(
                                    (msg) => msg.readMsg === false,
                                  ).length
                                }
                              </p>
                            ) : null}
                          </div>
                        )}
                        <span className="absolute inline-flex items-center justify-center w-5 h-5  bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold">
                          {index + 1}
                        </span>
                        <h3 className="font-bold text-ellipsis text-nowrap overflow-hidden text-gray-900 dark:text-gray-100">
                          {student.name}
                        </h3>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(student);
                        }}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg flex items-center gap-2 shadow-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* البيانات حسب selectedOption */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          البيانات:
                        </span>
                        <div className="p-2 text-center">
                          {selectedOption === "startLecture" && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
                              {safeRender(student.startLecture)}
                            </span>
                          )}

                          {selectedOption === "attendedFromLecture" && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">
                              {safeRender(student.attendedLectures)}
                            </span>
                          )}

                          {selectedOption === "vailableLectures" && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium">
                              {safeRender(calculateAvailableLectures(student))}
                            </span>
                          )}

                          {selectedOption === "attend" && (
                            <div className="flex items-center justify-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-medium ${
                                  getAbsenceStatus(calculateAbsences(student))
                                    .bg
                                } ${
                                  getAbsenceStatus(calculateAbsences(student))
                                    .color
                                }`}
                              >
                                {
                                  getAbsenceStatus(calculateAbsences(student))
                                    .icon
                                }
                                {calculateAbsences(student)}
                              </span>
                              {getAbsenceStatus(calculateAbsences(student))
                                .text && (
                                <span className="text-xs">
                                  {
                                    getAbsenceStatus(calculateAbsences(student))
                                      .text
                                  }
                                </span>
                              )}
                            </div>
                          )}

                          {selectedOption === "reserveAttendance" && (
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full font-medium ${
                                student.reserveAttendance === 0
                                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                  : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                              }`}
                            >
                              {student.reserveAttendance}
                            </span>
                          )}

                          {selectedOption === "reserveUsageCount" && (
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full font-medium ${
                                student.reserveUsageCount >= 2
                                  ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                                  : student.reserveUsageCount >= 1
                                    ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {student.reserveUsageCount || 0} مرة
                            </span>
                          )}

                          {selectedOption === "buyers" && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium">
                              {student.buyingHistory?.length || 0} مرة
                            </span>
                          )}

                          {selectedOption === "certificate" && (
                            <div className="flex items-center justify-center gap-2">
                              {student.certificate ? (
                                <>
                                  <span className="text-xs  font-medium text-gray-900 dark:text-gray-100">
                                    {student.certificate}
                                  </span>
                                </>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          )}

                          {selectedOption === "sub" && (
                            <div className="flex flex-col items-center gap-1">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full font-bold text-xs ${
                                  student.subscriptionType === "Front End"
                                    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                                    : student.subscriptionType === "Back End"
                                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                      : "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                                }`}
                              >
                                {student.subscriptionType === "Front End"
                                  ? "Front End"
                                  : student.subscriptionType === "Back End"
                                    ? "Back End"
                                    : "Full Stack"}
                              </span>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                <span className="font-medium">
                                  {student.totalPrice} ج.م
                                </span>
                                {student.remainingAmount > 0 && (
                                  <span className="text-red-600 dark:text-red-400 mr-1">
                                    | متبقي: {student.remainingAmount}
                                  </span>
                                )}
                                {student.contentReq?.length > 0 ? (
                                  <p className="mt-2 block cursor-pointer border rounded-md p-1 border-gray-400">
                                    يوجد رسالة!
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-left">
                        <span className="text-gray-500 dark:text-gray-400">
                          المتوسط:
                        </span>
                        <div className="mt-1 font-bold text-lg">
                          {student.tasks?.length > 0 ? (
                            <span
                              className={
                                calculateStudentAverage(student) >= 85
                                  ? "text-green-600"
                                  : calculateStudentAverage(student) >= 70
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              }
                            >
                              {calculateStudentAverage(student)}%
                            </span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Footer Stats */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  متوسط الحضور
                </div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {students.length > 0
                    ? Math.round(
                        students.reduce(
                          (sum, s) => sum + (Number(s.attendedLectures) || 0),
                          0,
                        ) / students.length,
                      ) || 0
                    : 0}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  متوسط الدرجات
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {students.length > 0
                    ? Math.round(
                        students.reduce((sum, s) => {
                          if (s.tasks?.length > 0) {
                            const taskSum = s.tasks.reduce(
                              (t, task) => t + (Number(task.score) || 0),
                              0,
                            );
                            return sum + taskSum / s.tasks.length;
                          }
                          return sum;
                        }, 0) / students.length,
                      ) || 0
                    : 0}
                  %
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  إجمالي المشتريات
                </div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {students.reduce(
                    (sum, s) => sum + (s.buyingHistory?.length || 0),
                    0,
                  ) || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <StudentModal
        handleDeleteContent={handleDeleteContent}
        students={students}
        showModal={showModal}
        selectedStudent={selectedStudent}
        editedData={editedData}
        setEditedData={setEditedData}
        selectedGroup={selectedGroup}
        newTask={newTask}
        setNewTask={setNewTask}
        calculateAbsences={calculateAbsences}
        getRemainingLectures={getRemainingLectures}
        updateReserveForOne={updateReserveForOne}
        handleInputChange={handleInputChange}
        handleDeleteTask={handleDeleteTask}
        handleTaskNotesChange={handleTaskNotesChange}
        handleSaveChanges={handleSaveChanges}
        handleAddTask={handleAddTask}
        loading={loading}
        setShowModal={setShowModal}
      />

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span>جاري تحميل بيانات المجموعة...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(StudentsDashboard);
