"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { db } from "@/app/services/firebaseConfig";
import {
  collection, getDocs, getDoc, query, where, doc, updateDoc, deleteField
} from "firebase/firestore";
import {
  FileArchive, Download, Users, Clock, RefreshCcw, Search,
  FolderOpen, CheckCircle2, AlertCircle, Award, Trash2, X, Link2, Filter
} from "lucide-react";

const formatSize = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (ts) => {
  if (!ts) return "—";
  const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });
};

export default function GroupSubmissions({ selectedGroup }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTaskFilter, setSelectedTaskFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentTask, setSelectedStudentTask] = useState(null);
  const [gradeInput, setGradeInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    if (!selectedGroup) return;
    setLoading(true);
    try {
      const q = query(collection(db, "students"), where("group", "==", selectedGroup));
      const snap = await getDocs(q);
      const list = [];

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.tasks && Array.isArray(data.tasks)) {
          data.tasks.forEach((task) => {
            if (task.submittedFile?.url) {
              list.push({
                docId: `${docSnap.id}_task_${task.id}`,
                studentId: data.id,
                name: data.name || "غير متوفر",
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
                zipFile: {
                  name: "رابط خارجي",
                  url: task.submittedLink,
                  uploadedAt: task.submittedAt ? { seconds: new Date(task.submittedAt).getTime() / 1000 } : null,
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

      list.sort((a, b) => (b.zipFile?.uploadedAt?.seconds || 0) - (a.zipFile?.uploadedAt?.seconds || 0));
      setStudents(list);
    } catch (err) {
      console.error("خطأ في جلب التسليمات:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedGroup]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const uniqueTaskNames = useMemo(() => {
    const names = new Set(students.map((s) => s.taskName).filter(Boolean));
    return Array.from(names);
  }, [students]);

  const filtered = useMemo(() => students.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(s.studentId).includes(searchQuery);
    const matchTask = selectedTaskFilter === "all" || s.taskName === selectedTaskFilter;
    return matchSearch && matchTask;
  }), [students, searchQuery, selectedTaskFilter]);

  const openGradeModal = (st) => {
    setSelectedStudentTask(st);
    setGradeInput(st.score > 0 ? String(st.score) : "");
    setNotesInput(st.notes || "");
    setIsModalOpen(true);
  };

  const handleSaveGrade = async () => {
    if (!selectedStudentTask) return;
    setSaving(true);
    try {
      const { studentDocId, taskId } = selectedStudentTask;
      const studentRef = doc(db, "students", studentDocId);
      const studentDocSnap = await getDoc(studentRef);
      if (studentDocSnap.exists()) {
        const studentData = studentDocSnap.data();
        const updatedTasks = (studentData.tasks || []).map((t) =>
          String(t.id) === String(taskId)
            ? { ...t, score: Number(gradeInput) || 0, notes: notesInput || "" }
            : t
        );
        await updateDoc(studentRef, { tasks: updatedTasks });
      }
      setIsModalOpen(false);
      setSelectedStudentTask(null);
      fetchSubmissions();
    } catch (err) {
      console.error("Error saving grade:", err);
      alert("حدث خطأ أثناء حفظ التعديلات!");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubmission = async (student) => {
    if (!window.confirm(`هل أنت متأكد من حذف تسليم "${student.taskName}" للطالب "${student.name}"؟`)) return;
    try {
      const studentRef = doc(db, "students", student.studentDocId);
      const studentDocSnap = await getDoc(studentRef);
      if (studentDocSnap.exists()) {
        const studentData = studentDocSnap.data();
        const updatedTasks = (studentData.tasks || []).map((t) =>
          String(t.id) === String(student.taskId)
            ? { ...t, submitted: false, submittedFile: null, submittedLink: "", submittedAt: null, score: 0, notes: "" }
            : t
        );
        await updateDoc(studentRef, { tasks: updatedTasks });
      }
      fetchSubmissions();
    } catch (err) {
      console.error("Error deleting submission:", err);
      alert("حدث خطأ أثناء حذف التسليم!");
    }
  };

  const handleDownload = async (student) => {
    const url = student.zipFile.url;
    if (student.type === "link") { window.open(url, "_blank"); return; }
    const originalName = student.zipFile.name || "file.zip";
    const ext = originalName.includes(".") ? originalName.split(".").pop() : "zip";
    const safeName = (student.name || "student").replace(/[/\\?%*:|"<>]/g, "-");
    const safeTask = (student.taskName || "task").replace(/[/\\?%*:|"<>]/g, "-");
    const fileName = `${safeName} - ${safeTask}.${ext}`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl; a.download = fileName;
      document.body.appendChild(a); a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(blobUrl); }, 100);
    } catch { window.open(url, "_blank"); }
  };

  if (!selectedGroup) return (
    <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">اختر مجموعة أولاً</div>
  );

  return (
    <div dir="rtl" className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl flex items-center justify-center">
            <FileArchive className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 dark:text-white text-sm">تسليمات الطلاب</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">مجموعة: {selectedGroup}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-bold px-3 py-1.5 rounded-full">
            {filtered.length} تسليم
          </span>
          <button
            onClick={fetchSubmissions}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs transition disabled:opacity-50"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3 text-center border border-violet-100 dark:border-violet-800/40">
          <p className="text-xl font-black text-violet-700 dark:text-violet-300">{filtered.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">إجمالي التسليمات</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center border border-green-100 dark:border-green-800/40">
          <p className="text-xl font-black text-green-700 dark:text-green-300">
            {filtered.filter(s => s.score > 0).length}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">تم تصحيحها</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center border border-amber-100 dark:border-amber-800/40">
          <p className="text-xl font-black text-amber-700 dark:text-amber-300">
            {filtered.filter(s => s.score === 0).length}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">بانتظار التصحيح</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-36">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="بحث بالاسم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-8 pl-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <select
            value={selectedTaskFilter}
            onChange={(e) => setSelectedTaskFilter(e.target.value)}
            className="pr-8 pl-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none cursor-pointer"
          >
            <option value="all">كل المهام</option>
            {uniqueTaskNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 animate-pulse border border-gray-100 dark:border-gray-700">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-3 w-1/2" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-10 text-center">
          <AlertCircle className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {students.length === 0 ? "لم يقم أي طالب بتسليم مهام في هذه المجموعة بعد" : "لا توجد نتائج تطابق البحث"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((student) => (
            <div
              key={student.docId}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-violet-200 dark:hover:border-violet-800/50 transition overflow-hidden shadow-sm"
            >
              {/* Card header */}
              <div className="bg-gradient-to-br from-violet-500 to-indigo-600 px-4 py-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-white text-sm">{student.name}</h4>
                  {student.score > 0 ? (
                    <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white/20 text-white">
                      {student.score}/100
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-400/30 text-amber-100">
                      بانتظار التصحيح
                    </span>
                  )}
                </div>
              </div>

              {/* Card body */}
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2 py-1.5 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                  <span className="font-bold truncate">{student.taskName}</span>
                  <span className="mr-auto shrink-0 text-gray-400">
                    {student.type === "link" ? "🔗 رابط" : "📁 ملف"}
                  </span>
                </div>

                {student.type === "link" ? (
                  <p className="text-xs text-blue-600 dark:text-blue-400 truncate px-1" dir="ltr">
                    {student.zipFile.url}
                  </p>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 px-1">
                    <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{student.zipFile.name || "ملف مضغوط"}</span>
                  </div>
                )}

                <div className="flex items-center gap-1 text-xs text-gray-400 px-1">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>{formatDate(student.zipFile.uploadedAt)}</span>
                  {student.zipFile.size && (
                    <span className="mr-auto bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">
                      {formatSize(student.zipFile.size)}
                    </span>
                  )}
                </div>

                {student.notes && (
                  <p className="text-xs text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 rounded-lg px-2 py-1 border border-purple-100 dark:border-purple-800 truncate">
                    📝 {student.notes}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-1.5 pt-1">
                  <button
                    onClick={() => handleDownload(student)}
                    className="flex items-center justify-center gap-1 flex-1 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-lg text-xs transition"
                  >
                    <Download className="w-3 h-3" />
                    {student.type === "link" ? "فتح" : "تنزيل"}
                  </button>
                  <button
                    onClick={() => openGradeModal(student)}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs transition"
                    title="رصد الدرجة"
                  >
                    <Award className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteSubmission(student)}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg text-xs transition"
                    title="حذف التسليم"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grade Modal */}
      {isModalOpen && selectedStudentTask && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-10">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-black text-sm">رصد الدرجة</h2>
                    <p className="text-amber-100 text-xs">{selectedStudentTask.name} — {selectedStudentTask.taskName}</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-7 h-7 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition">
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">الدرجة (من 100)</label>
                <input
                  type="number" min="0" max="100"
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  placeholder="أدخل الدرجة..."
                  className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white text-lg font-black focus:outline-none focus:border-amber-500 transition text-center"
                />
                {gradeInput !== "" && (
                  <div className={`mt-1.5 text-center text-xs font-bold rounded-lg py-1 ${
                    Number(gradeInput) >= 90 ? "bg-green-100 dark:bg-green-900/30 text-green-700" :
                    Number(gradeInput) >= 75 ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700" :
                    Number(gradeInput) >= 60 ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700" :
                    "bg-red-100 dark:bg-red-900/30 text-red-700"}`}>
                    {Number(gradeInput) >= 90 ? "ممتاز 🏆" : Number(gradeInput) >= 75 ? "جيد جداً ⭐" :
                     Number(gradeInput) >= 60 ? "جيد 👍" : "يحتاج مراجعة ⚠️"}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">ملاحظات</label>
                <textarea
                  rows={3} value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="أضف ملاحظاتك هنا..."
                  className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:border-amber-500 transition resize-none"
                />
              </div>
              <button
                onClick={handleSaveGrade}
                disabled={saving}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black rounded-xl text-sm transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                حفظ الدرجة والملاحظات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
