"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { db } from "@/app/services/firebaseConfig";
import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  doc,
  updateDoc,
  deleteField,
} from "firebase/firestore";
import { useGroupContext } from "@/app/context/GroupContextProvider";
import {
  FileArchive,
  Download,
  Filter,
  Users,
  Clock,
  RefreshCcw,
  Search,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  Award,
  Trash2,
  X,
} from "lucide-react";
import StudentsLinksList from "./StudentsLinksList";

const ZipFilesAdmin = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTaskFilter, setSelectedTaskFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "pending" | "graded"

  // Modal states for grading/notes
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentTask, setSelectedStudentTask] = useState(null);
  const [gradeInput, setGradeInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [openModelGitHub, setOpenModelGitHub] = useState(false);
  const { availableGroups } = useGroupContext();

  const fetchStudentsWithZip = useCallback(async () => {
    setLoading(true);
    try {
      let q;
      if (selectedGroup && selectedGroup !== "all") {
        q = query(
          collection(db, "students"),
          where("group", "==", selectedGroup),
        );
      } else {
        q = collection(db, "students");
      }

      const snap = await getDocs(q);
      const list = [];

      snap.forEach((docSnap) => {
        const data = docSnap.data();

        // Old global zip file
        if (data.zipFile && data.zipFile.url) {
          list.push({
            docId: docSnap.id,
            studentId: data.id,
            name: data.name || "غير متوفر",
            group: data.group || "—",
            zipFile: data.zipFile,
            taskName: "ملف عام (الروابط)",
            type: "file",
            studentDocId: docSnap.id,
            isGlobal: true,
            score: data.zipFile.score ?? 0,
            notes: data.zipFile.notes || "",
          });
        }

        // Task-specific zip files & links
        if (data.tasks && Array.isArray(data.tasks)) {
          data.tasks.forEach((task) => {
            if (task.submittedFile && task.submittedFile.url) {
              list.push({
                docId: `${docSnap.id}_task_${task.id}`,
                studentId: data.id,
                name: data.name || "غير متوفر",
                group: data.group || "—",
                zipFile: task.submittedFile,
                taskName: task.name,
                type: "file",
                taskId: task.id,
                studentDocId: docSnap.id,
                score: task.score ?? 0,
                notes: task.notes || "",
              });
            }
            if (task.submittedLink) {
              list.push({
                docId: `${docSnap.id}_task_${task.id}_link`,
                studentId: data.id,
                name: data.name || "غير متوفر",
                group: data.group || "—",
                zipFile: {
                  name: "رابط خارجي",
                  url: task.submittedLink,
                  uploadedAt: task.submittedAt
                    ? { seconds: new Date(task.submittedAt).getTime() / 1000 }
                    : null,
                  size: null,
                },
                taskName: task.name,
                type: "link",
                taskId: task.id,
                studentDocId: docSnap.id,
                score: task.score ?? 0,
                notes: task.notes || "",
              });
            }
          });
        }
      });

      // ترتيب حسب وقت الرفع (الأحدث أولاً)
      list.sort((a, b) => {
        const timeA = a.zipFile?.uploadedAt?.seconds || 0;
        const timeB = b.zipFile?.uploadedAt?.seconds || 0;
        return timeB - timeA;
      });

      setStudents(list);
    } catch (err) {
      console.error("خطأ في جلب البيانات:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedGroup]);

  useEffect(() => {
    fetchStudentsWithZip();
  }, [fetchStudentsWithZip]);

  const formatSize = (bytes) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (ts) => {
    if (!ts) return "—";
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return d.toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // Compile unique task names
  const uniqueTaskNames = useMemo(() => {
    const names = new Set();
    students.forEach((s) => {
      if (s.taskName) names.add(s.taskName);
    });
    return Array.from(names);
  }, [students]);

  // إحصائيات التسليمات المكتملة والقيد المراجعة
  const { pendingCount, gradedCount } = useMemo(() => {
    let pending = 0;
    let graded = 0;
    students.forEach((s) => {
      if (!s.score || s.score === 0) pending++;
      else graded++;
    });
    return { pendingCount: pending, gradedCount: graded };
  }, [students]);

  const filtered = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(s.studentId).includes(searchQuery);
    const matchesTask =
      selectedTaskFilter === "all" || s.taskName === selectedTaskFilter;
    const isPending = !s.score || s.score === 0;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && isPending) ||
      (statusFilter === "graded" && !isPending);
    return matchesSearch && matchesTask && matchesStatus;
  });

  // Open Grading Modal
  const openGradeModal = (studentTask) => {
    setSelectedStudentTask(studentTask);
    setGradeInput(studentTask.score > 0 ? String(studentTask.score) : "");
    setNotesInput(studentTask.notes || "");
    setIsModalOpen(true);
  };

  // Save Grade & Notes
  const handleSaveGrade = async () => {
    if (!selectedStudentTask) return;
    setSaving(true);
    try {
      const { studentDocId, taskId, isGlobal } = selectedStudentTask;
      const studentRef = doc(db, "students", studentDocId);

      if (isGlobal) {
        await updateDoc(studentRef, {
          "zipFile.score": Number(gradeInput) || 0,
          "zipFile.notes": notesInput || "",
        });
      } else {
        const studentDocSnap = await getDoc(studentRef);
        if (studentDocSnap.exists()) {
          const studentData = studentDocSnap.data();
          const updatedTasks = (studentData.tasks || []).map((t) => {
            if (String(t.id) === String(taskId)) {
              return {
                ...t,
                score: Number(gradeInput) || 0,
                notes: notesInput || "",
              };
            }
            return t;
          });
          await updateDoc(studentRef, { tasks: updatedTasks });
        }
      }

      setIsModalOpen(false);
      setSelectedStudentTask(null);
      alert("تم رصد الدرجة والملاحظات بنجاح!");
      fetchStudentsWithZip();
    } catch (err) {
      console.error("Error saving grade:", err);
      alert("حدث خطأ أثناء حفظ التعديلات!");
    } finally {
      setSaving(false);
    }
  };

  // Delete Task Submission
  const handleDeleteSubmission = async (student) => {
    const isConfirmed = window.confirm(
      `هل أنت متأكد من حذف تسليم "${student.taskName}" للطالب "${student.name}"؟`,
    );
    if (!isConfirmed) return;

    try {
      const studentRef = doc(db, "students", student.studentDocId);
      if (student.isGlobal) {
        await updateDoc(studentRef, {
          zipFile: deleteField(),
        });
      } else {
        const studentDocSnap = await getDoc(studentRef);
        if (studentDocSnap.exists()) {
          const studentData = studentDocSnap.data();
          const updatedTasks = (studentData.tasks || []).map((t) => {
            if (String(t.id) === String(student.taskId)) {
              return {
                ...t,
                submitted: false,
                submittedFile: null,
                submittedLink: "",
                submittedAt: null,
                score: 0,
                notes: "",
              };
            }
            return t;
          });
          await updateDoc(studentRef, { tasks: updatedTasks });
        }
      }
      alert("تم حذف التسليم بنجاح!");
      fetchStudentsWithZip();
    } catch (err) {
      console.error("Error deleting submission:", err);
      alert("حدث خطأ أثناء حذف التسليم!");
    }
  };

  // ── تنزيل الملف أو فتح الرابط ──
  const handleDownload = async (student) => {
    const url = student.zipFile.url;
    if (student.type === "link") {
      window.open(url, "_blank");
      return;
    }
    // استخدم اسم الطالب + اسم المهمة كاسم الملف
    const originalName = student.zipFile.name || "file.zip";
    const ext = originalName.includes(".")
      ? originalName.split(".").pop()
      : "zip";
    const safeName = (student.name || "student").replace(/[/\\?%*:|"<>]/g, "-");
    const safeTask = (student.taskName || "task").replace(
      /[/\\?%*:|"<>]/g,
      "-",
    );
    const fileName = `${safeName} - ${safeTask}.${ext}`;
    if (!url) return;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (err) {
      console.warn("Download via blob failed, opening directly:", err);
      window.open(url, "_blank");
    }
  };

  const handleMigrateOldZips = async () => {
    const isConfirmed = window.confirm(
      "هل أنت متأكد من نقل الملفات القديمة إلى المهام؟ سيتم نقل أي ملف قديم إلى المهمة الأولى للطالب.",
    );
    if (!isConfirmed) return;

    setLoading(true);
    try {
      const q = collection(db, "students");
      const snap = await getDocs(q);

      let migratedCount = 0;

      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        if (data.zipFile && data.tasks && data.tasks.length > 0) {
          const tasks = [...data.tasks];
          // Check if first task isn't already submitted
          if (!tasks[0].submittedFile && !tasks[0].submittedLink) {
            tasks[0].submitted = true;
            tasks[0].submittedFile = data.zipFile;
            tasks[0].submittedAt = data.zipFile.uploadedAt
              ? data.zipFile.uploadedAt.seconds
                ? new Date(data.zipFile.uploadedAt.seconds * 1000).toISOString()
                : new Date(data.zipFile.uploadedAt).toISOString()
              : new Date().toISOString();

            await updateDoc(doc(db, "students", docSnap.id), {
              tasks: tasks,
              zipFile: deleteField(),
            });
            migratedCount++;
          }
        }
      }

      alert(`تم نقل ${migratedCount} ملف بنجاح!`);
      fetchStudentsWithZip();
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء النقل!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8"
      dir="rtl"
    >
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 bg-linear-to-br from-violet-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/25">
              <FileArchive className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-white">
                تسليمات المهام والملفات
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                عرض وتنزيل تسليمات الطلاب للمهام
              </p>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-800 dark:text-white">
                  {students.length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  إجمالي التسليمات
                </p>
              </div>
            </div>

            <div
              onClick={() => setStatusFilter("pending")}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-amber-200 dark:border-amber-800/60 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center relative">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                )}
              </div>
              <div>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {pendingCount}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 font-bold">
                  قيد المراجعة ⏳
                </p>
              </div>
            </div>

            <div
              onClick={() => setStatusFilter("graded")}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-emerald-100 dark:border-gray-700 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {gradedCount}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  تم التقييم ✅
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-800 dark:text-white">
                  {selectedGroup === "all" ? availableGroups.length : 1}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  مجموعات معروضة
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs (الكل / قيد المراجعة فقط / تم التقييم) */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === "all"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/30 ring-2 ring-violet-500"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <span>جميع التسليمات</span>
            <span className="bg-black/15 dark:bg-white/15 px-2 py-0.5 rounded-full text-[10px]">
              {students.length}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === "pending"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/30 ring-2 ring-amber-400"
                : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>قيد المراجعة فقط</span>
            <span className="bg-amber-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("graded")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === "graded"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>تم التقييم</span>
            <span className="bg-black/15 dark:bg-white/15 px-2 py-0.5 rounded-full text-[10px]">
              {gradedCount}
            </span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="بحث بالاسم أو رقم الطالب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
              />
            </div>

            {/* Group filter */}
            <div className="relative">
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="pr-9 pl-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm appearance-none cursor-pointer min-w-40"
              >
                <option value="all">كل المجموعات</option>
                {availableGroups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Task filter */}
            <div className="relative">
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={selectedTaskFilter}
                onChange={(e) => setSelectedTaskFilter(e.target.value)}
                className="pr-9 pl-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm appearance-none cursor-pointer min-w-40"
              >
                <option value="all">كل المهام</option>
                {uniqueTaskNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* gitHub links */}
            <button
              onClick={() => setOpenModelGitHub(true)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
            >
              سجل الجيت هاب
            </button>
            {openModelGitHub && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
                onClick={() => setOpenModelGitHub(false)}
              >
                <div
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden transform transition-all"
                  onClick={(e) => e.stopPropagation()}
                  dir="rtl"
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      🔗 سجل روابط GitHub للطلاب
                    </h3>
                    <button
                      onClick={() => setOpenModelGitHub(false)}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50 dark:bg-gray-900/20">
                    <StudentsLinksList />
                  </div>
                </div>
              </div>
            )}

            {/* Migration */}
            <button
              onClick={handleMigrateOldZips}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
            >
              نقل الملفات القديمة
            </button>

            {/* Refresh */}
            <button
              onClick={fetchStudentsWithZip}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
            >
              <RefreshCcw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              تحديث
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-2xl p-5 animate-pulse border border-gray-100 dark:border-gray-700"
              >
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3 w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-1/2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-2/3" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-16 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
              لا توجد تسليمات
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {selectedGroup !== "all"
                ? `لم يقم أي طالب في مجموعة "${selectedGroup}" بتسليم مهام بعد`
                : "لم يقم أي طالب بتسليم مهام بعد"}
            </p>
          </div>
        ) : (
          <>
            {/* Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((student) => (
                <div
                  key={student.docId}
                  className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-violet-200 dark:hover:border-violet-800/50 transition-all duration-200 overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="bg-linear-to-br from-violet-500 to-indigo-600 p-4">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <FileArchive className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs font-bold bg-white/20 backdrop-blur-sm text-white px-2.5 py-1 rounded-full">
                        {student.group}
                      </span>
                    </div>
                    <h3 className="mt-3 font-black text-white text-base">
                      {student.name}
                    </h3>
                    <p className="text-violet-200 text-xs mt-0.5">
                      ID: {student.studentId}
                    </p>
                  </div>

                  {/* Card Body */}
                  <div className="p-4">
                    {/* File info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 font-bold bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded">
                          <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                          <span className="truncate">{student.taskName}</span>
                        </div>
                        {/* Score Badge */}
                        {student.score > 0 ? (
                          <span className="text-xs font-black px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                            {student.score} / 100
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                            بانتظار التصحيح
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-2">
                        {student.type === "link" ? (
                          <div className="flex items-center gap-2">
                            <span
                              className="truncate font-medium text-blue-600 dark:text-blue-400 underline"
                              dir="ltr"
                            >
                              {student.zipFile.url}
                            </span>
                          </div>
                        ) : (
                          <>
                            <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate font-medium">
                              {student.zipFile.name || "ملف مضغوط"}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>{formatDate(student.zipFile.uploadedAt)}</span>
                      </div>

                      {student.zipFile.size && (
                        <div className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full font-medium">
                          {formatSize(student.zipFile.size)}
                        </div>
                      )}

                      {/* Notes preview */}
                      {student.notes && (
                        <p
                          className="text-xs text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 rounded-lg px-2 py-1 border border-purple-200 dark:border-purple-800 truncate"
                          title={student.notes}
                        >
                          📝 {student.notes}
                        </p>
                      )}
                    </div>

                    {/* Actions row */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload(student)}
                        className="flex items-center justify-center gap-1.5 flex-1 py-2 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {student.type === "link" ? "فتح" : "تنزيل"}
                      </button>
                      <button
                        onClick={() => openGradeModal(student)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-all shadow-md"
                        title="رصد الدرجة"
                      >
                        <Award className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubmission(student)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-xs transition-all shadow-md"
                        title="حذف التسليم"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Table view for large screens */}
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <FileArchive className="w-4 h-4 text-violet-500" />
                  جدول الملفات الكامل
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 text-right">
                      <th className="p-3 font-bold text-gray-600 dark:text-gray-300">
                        #
                      </th>
                      <th className="p-3 font-bold text-gray-600 dark:text-gray-300">
                        الاسم
                      </th>
                      <th className="p-3 font-bold text-gray-600 dark:text-gray-300">
                        المجموعة
                      </th>
                      <th className="p-3 font-bold text-gray-600 dark:text-gray-300">
                        المهمة
                      </th>
                      <th className="p-3 font-bold text-gray-600 dark:text-gray-300">
                        التسليم
                      </th>
                      <th className="p-3 font-bold text-gray-600 dark:text-gray-300">
                        الدرجة
                      </th>
                      <th className="p-3 font-bold text-gray-600 dark:text-gray-300">
                        تاريخ التسليم
                      </th>
                      <th className="p-3 font-bold text-gray-600 dark:text-gray-300">
                        إجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filtered.map((student, index) => (
                      <tr
                        key={student.docId}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="p-3 text-gray-400 dark:text-gray-500 font-mono text-xs">
                          {index + 1}
                        </td>
                        <td className="p-3 font-semibold text-gray-800 dark:text-white">
                          {student.name}
                        </td>
                        <td className="p-3">
                          <span className="px-2.5 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-full text-xs font-bold">
                            {student.group}
                          </span>
                        </td>
                        <td
                          className="p-3 text-gray-800 dark:text-white font-bold text-xs max-w-32 truncate"
                          title={student.taskName}
                        >
                          {student.taskName}
                        </td>
                        <td className="p-3 text-gray-600 dark:text-gray-400 text-xs max-w-48 truncate">
                          {student.type === "link" ? (
                            <a
                              href={student.zipFile.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 underline"
                            >
                              رابط خارجي
                            </a>
                          ) : (
                            student.zipFile.name || "—"
                          )}
                        </td>
                        <td className="p-3 text-xs">
                          {student.score > 0 ? (
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full font-black">
                              {student.score} / 100
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full font-bold">
                              لم يُصحح
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-gray-500 dark:text-gray-400 text-xs">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(student.zipFile.uploadedAt)}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleDownload(student)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition-colors"
                              title={
                                student.type === "link" ? "فتح الرابط" : "تنزيل"
                              }
                            >
                              <Download className="w-3 h-3" />
                              {student.type === "link" ? "فتح" : "تنزيل"}
                            </button>
                            <button
                              onClick={() => openGradeModal(student)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors"
                              title="رصد الدرجة"
                            >
                              <Award className="w-3 h-3" />
                              درجة
                            </button>
                            <button
                              onClick={() => handleDeleteSubmission(student)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors"
                              title="حذف التسليم"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Grade / Notes Modal ── */}
      {isModalOpen && selectedStudentTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          dir="rtl"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          {/* Modal Box */}
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-10">
            {/* Header */}
            <div className="bg-linear-to-r from-amber-500 to-orange-500 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-black text-base">
                      رصد الدرجة والملاحظات
                    </h2>
                    <p className="text-amber-100 text-xs mt-0.5">
                      {selectedStudentTask.name} —{" "}
                      {selectedStudentTask.taskName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Grade input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  الدرجة (من 100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  placeholder="أدخل الدرجة..."
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white text-lg font-black focus:outline-none focus:border-amber-500 transition-colors text-center"
                />
                {/* Visual grade display */}
                {gradeInput !== "" && (
                  <div
                    className={`mt-2 text-center text-sm font-bold rounded-xl py-1.5 ${
                      Number(gradeInput) >= 90
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                        : Number(gradeInput) >= 75
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : Number(gradeInput) >= 60
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                    }`}
                  >
                    {Number(gradeInput) >= 90
                      ? "ممتاز 🏆"
                      : Number(gradeInput) >= 75
                        ? "جيد جداً ⭐"
                        : Number(gradeInput) >= 60
                          ? "جيد 👍"
                          : "يحتاج مراجعة ⚠️"}
                  </div>
                )}
              </div>

              {/* Notes input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  ملاحظات الأدمن (اختياري)
                </label>
                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="اكتب ملاحظاتك للطالب هنا..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white text-sm focus:outline-none focus:border-amber-500 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={handleSaveGrade}
                disabled={saving || gradeInput === ""}
                className="flex-1 py-3 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black rounded-2xl text-sm transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "جاري الحفظ..." : "حفظ الدرجة والملاحظات"}
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl text-sm transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZipFilesAdmin;
