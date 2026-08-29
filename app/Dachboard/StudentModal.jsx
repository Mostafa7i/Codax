"use client";
import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  X,
  User,
  BookOpen,
  TrendingUp,
  Plus,
  Trash2,
  Save,
  Link2,
  FileText,
  CreditCard,
  Award,
  Clock,
  Download,
  FileArchive,
  CheckCircle2,
  GripVertical,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Layers,
  HelpCircle,
} from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig";
import {
  buildGroupMasterTasks,
  syncStudentTasksWithMaster,
} from "@/app/components/calculations";

function DraggableTaskList({
  tasks,
  onReorder,
  onDelete,
  onInputChange,
  onTaskNotesChange,
  onTaskTypeChange,
  onToggleEnabled,
}) {
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const dragNode = useRef(null);

  const handleDragStart = useCallback((e, index) => {
    dragNode.current = e.currentTarget;
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => {
      if (dragNode.current) dragNode.current.style.opacity = "0.4";
    }, 0);
  }, []);

  const handleDragEnter = useCallback(
    (e, index) => {
      e.preventDefault();
      if (index !== dragIndex) setOverIndex(index);
    },
    [dragIndex],
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e, dropIndex) => {
      e.preventDefault();
      if (dragIndex === null || dragIndex === dropIndex) return;
      const reordered = [...tasks];
      const [moved] = reordered.splice(dragIndex, 1);
      reordered.splice(dropIndex, 0, moved);
      onReorder(reordered);
      setDragIndex(null);
      setOverIndex(null);
    },
    [dragIndex, tasks, onReorder],
  );

  const handleDragEnd = useCallback(() => {
    if (dragNode.current) dragNode.current.style.opacity = "1";
    dragNode.current = null;
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  const handleConfirmDelete = (index) => {
    if (window.confirm("هل أنت متأكد من حذف هذه المهمة للطالب؟")) {
      onDelete(index);
    }
  };

  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
        <Award className="w-12 h-12 mb-3 text-indigo-400 opacity-40" />
        <p className="text-sm font-bold">لا توجد مهام مسجلة للطالب بعد</p>
        <p className="text-xs text-gray-400 mt-1">
          أضف مهمة جديدة من الأسفل وحدد نوع التسليم
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task, index) => {
        const isDragging = dragIndex === index;
        const isOver = overIndex === index && dragIndex !== index;
        const isFileType =
          task.submissionType === "file" ||
          (!task.submissionType &&
            !task.submittedLink &&
            (task.submittedFile || true));
        const isLocked = task.enabled === false; // مقفول؟

        return (
          <div
            key={index}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`rounded-2xl border transition-all duration-150 select-none relative ${
              isDragging
                ? "opacity-40 border-dashed border-indigo-400 bg-indigo-50 dark:bg-indigo-950"
                : isLocked
                  ? "bg-gray-50 dark:bg-gray-900/60 border-gray-200 dark:border-gray-700/60 opacity-70"
                  : "bg-white dark:bg-gray-800 border-gray-200/80 dark:border-gray-700/80 shadow-xs hover:shadow-md"
            } ${isOver ? "border-indigo-500 ring-2 ring-indigo-300" : ""}`}
          >
            {isOver && (
              <div className="absolute -top-1 left-4 right-4 h-0.5 bg-indigo-500 rounded-full" />
            )}

            {/* شارة مقفول في الزاوية */}
            {isLocked && (
              <div className="absolute top-2 left-2 z-10">
                <span className="inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600">
                  🔒 مقفول
                </span>
              </div>
            )}

            <div className="flex items-start gap-2.5 p-3.5">
              {/* Handle */}
              <div
                className="mt-2.5 cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 hover:text-indigo-500 transition-colors shrink-0"
                title="اسحب لإعادة الترتيب"
              >
                <GripVertical className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0 space-y-2.5">
                {/* Task Title & Type & Score Row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                    <span
                      className={`font-bold text-sm truncate ${isLocked ? "text-gray-400 dark:text-gray-500" : "text-gray-800 dark:text-gray-100"}`}
                    >
                      {task.name}
                    </span>

                    {/* Submission Type Badge */}
                    {!isLocked && (
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isFileType
                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                            : "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800"
                        }`}
                      >
                        {isFileType ? (
                          <>
                            <FileArchive className="w-3 h-3" />
                            <span>ملف مضغوط</span>
                          </>
                        ) : (
                          <>
                            <Link2 className="w-3 h-3" />
                            <span>رابط خارجي</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* تغيير نوع التسليم — ملف أو رابط */}
                    {!isLocked && onTaskTypeChange && (
                      <div className="flex items-center rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 text-[11px] font-black">
                        <button
                          type="button"
                          onClick={() => onTaskTypeChange(index, "file")}
                          title="تسليم ملف مضغوط فقط (.zip)"
                          className={`flex items-center gap-1 px-2 py-1.5 transition-all ${
                            isFileType
                              ? "bg-indigo-600 text-white"
                              : "bg-white dark:bg-gray-800 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                          }`}
                        >
                          <FileArchive className="w-3 h-3" />
                          <span>zip</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onTaskTypeChange(index, "link")}
                          title="تسليم رابط خارجي فقط (GitHub/Live)"
                          className={`flex items-center gap-1 px-2 py-1.5 transition-all ${
                            !isFileType
                              ? "bg-cyan-600 text-white"
                              : "bg-white dark:bg-gray-800 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20"
                          }`}
                        >
                          <Link2 className="w-3 h-3" />
                          <span>link</span>
                        </button>
                      </div>
                    )}
                    {/* زر تفعيل / إيقاف التاسك */}
                    <button
                      type="button"
                      onClick={() => onToggleEnabled && onToggleEnabled(index)}
                      title={
                        isLocked ? "تفعيل المهمة للطالب" : "إيقاف وقفل المهمة"
                      }
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-black transition-all border ${
                        isLocked
                          ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100"
                          : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60 hover:bg-amber-100"
                      }`}
                    >
                      {isLocked ? (
                        <>
                          <span>🔓</span>
                          <span>تفعيل</span>
                        </>
                      ) : (
                        <>
                          <span>🔒</span>
                          <span>قفل</span>
                        </>
                      )}
                    </button>

                    {/* حقل الدرجة — معطّل إذا مقفول */}
                    <div className="relative">
                      <input
                        type="number"
                        value={task.score ?? 0}
                        onChange={(e) => !isLocked && onInputChange(e, index)}
                        disabled={isLocked}
                        className={`w-20 border rounded-xl px-2.5 py-1.5 text-center font-black focus:ring-2 focus:outline-none text-sm transition-all ${
                          isLocked
                            ? "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed"
                            : "bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-indigo-700 dark:text-indigo-400 focus:ring-indigo-500"
                        }`}
                        placeholder="0"
                        min="0"
                        max="100"
                      />
                      <span
                        className={`absolute -top-2 -right-1 text-[9px] px-1.5 rounded-full font-bold ${isLocked ? "bg-gray-400 text-white" : "bg-indigo-600 text-white"}`}
                      >
                        درجة
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleConfirmDelete(index)}
                      className="p-2 bg-red-50 dark:bg-red-900/30 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all"
                      title="حذف المهمة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Submission State — مخفي لو مقفول */}
                {!isLocked && (task.submittedFile || task.submittedLink) && (
                  <div className="p-2.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 rounded-xl flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>قام الطالب بالتسليم</span>
                      {task.submittedAt && (
                        <span className="text-gray-400 font-normal text-[11px]">
                          ({new Date(task.submittedAt).toLocaleString("ar-EG")})
                        </span>
                      )}
                    </div>

                    {task.submittedFile ? (
                      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-lg border border-indigo-100 dark:border-indigo-700/60">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileArchive className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span
                            className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate max-w-xs"
                            title={task.submittedFile.name}
                          >
                            {task.submittedFile.name}
                          </span>
                        </div>
                        <a
                          href={task.submittedFile.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition-colors shadow-xs"
                        >
                          <Download className="w-3 h-3" /> تنزيل
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-lg border border-indigo-100 dark:border-indigo-700/60">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <ExternalLink className="w-4 h-4 text-cyan-500 shrink-0" />
                          <span
                            className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate max-w-xs"
                            title={task.submittedLink}
                          >
                            {task.submittedLink}
                          </span>
                        </div>
                        <a
                          href={task.submittedLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 flex items-center gap-1 bg-cyan-600 hover:bg-cyan-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition-colors shadow-xs"
                        >
                          <Link2 className="w-3 h-3" /> فتح الرابط
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes Input */}
                <input
                  type="text"
                  value={task.notes || ""}
                  onChange={(e) => onTaskNotesChange(e, index)}
                  disabled={isLocked}
                  className={`w-full border rounded-xl px-3 py-1.5 text-xs placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all ${
                    isLocked
                      ? "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-gray-50/70 dark:bg-gray-900/60 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200"
                  }`}
                  placeholder={
                    isLocked
                      ? "🔒 المهمة مقفولة — فعّلها أولاً"
                      : "أضف ملاحظة أو تعليق للطالب حول هذه المهمة..."
                  }
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ImprovedStudentModal({
  students,
  showModal,
  selectedStudent,
  editedData,
  setEditedData,
  selectedGroup,
  newTask,
  setNewTask,
  calculateAbsences,
  getRemainingLectures,
  updateReserveForOne,
  handleInputChange,
  handleDeleteTask,
  handleTaskNotesChange,
  handleSaveChanges,
  handleAddTask,
  loading,
  setShowModal,
  handleDeleteContent,
}) {
  const modalRef = useRef(null);
  const [activeTab, setActiveTab] = useState("tasks"); // "tasks" | "subscription" | "attendance" | "links_notes"
  const [newPaymentAmount, setNewPaymentAmount] = useState("");
  const [selectedSubmissionType, setSelectedSubmissionType] = useState("file"); // "file" | "link"

  // مزامنة وترتيب مهام الطالب مع النموذج المرجعي للمجموعة لمنع أي تكرار
  useEffect(() => {
    if (
      !showModal ||
      !selectedStudent ||
      !Array.isArray(students) ||
      students.length === 0
    )
      return;
    const masterTasks = buildGroupMasterTasks(students);
    if (masterTasks.length === 0) return;

    setEditedData((prev) => {
      const currentTasks = Array.isArray(prev?.tasks)
        ? prev.tasks
        : Array.isArray(selectedStudent.tasks)
          ? selectedStudent.tasks
          : [];
      const synced = syncStudentTasksWithMaster(currentTasks, masterTasks);

      const isSame =
        synced.length === currentTasks.length &&
        synced.every(
          (t, i) =>
            t.name === currentTasks[i]?.name &&
            t.enabled === currentTasks[i]?.enabled &&
            t.score === currentTasks[i]?.score,
        );

      if (isSame) return prev;
      return { ...prev, tasks: synced };
    });
  }, [showModal, selectedStudent?.docId, students]);

  if (!showModal || !selectedStudent) return null;

  const absencesCount = calculateAbsences(selectedStudent, selectedGroup);

  const getAbsenceStatus = (count) => {
    if (count === 0)
      return {
        status: "ممتاز (بدون غياب)",
        color: "text-emerald-500",
        badge:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      };
    if (count <= 2)
      return {
        status: "جيد (غياب قليل)",
        color: "text-blue-500",
        badge:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      };
    if (count <= 4)
      return {
        status: "تحذير (غياب متوسط)",
        color: "text-amber-500",
        badge:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      };
    return {
      status: "حرج (غياب مرتفع)",
      color: "text-red-500",
      badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
  };

  const absenceInfo = getAbsenceStatus(absencesCount);

  const currentTotalPrice =
    editedData.totalPrice !== undefined
      ? Number(editedData.totalPrice)
      : Number(selectedStudent.totalPrice) || 0;
  const currentPaidAmount =
    editedData.paidAmount !== undefined
      ? Number(editedData.paidAmount)
      : Number(selectedStudent.paidAmount) || 0;
  const remaining = Math.max(0, currentTotalPrice - currentPaidAmount);
  const payPercent =
    currentTotalPrice > 0
      ? Math.min(Math.round((currentPaidAmount / currentTotalPrice) * 100), 100)
      : 0;

  const initials = (selectedStudent.name || "")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const handleTaskReorder = (reordered) =>
    setEditedData({ ...editedData, tasks: reordered });

  const handleToggleTaskEnabled = (index) => {
    const updatedTasks = [...(editedData.tasks || [])];
    if (updatedTasks[index]) {
      const currentVal = updatedTasks[index].enabled;
      updatedTasks[index] = {
        ...updatedTasks[index],
        enabled: currentVal === false ? true : false,
      };
      setEditedData({ ...editedData, tasks: updatedTasks });
    }
  };

  const handleTaskTypeChange = (index, newType) => {
    const updatedTasks = [...(editedData.tasks || [])];
    if (updatedTasks[index]) {
      updatedTasks[index] = {
        ...updatedTasks[index],
        submissionType: newType,
      };
      setEditedData({ ...editedData, tasks: updatedTasks });
    }
  };

  const onAddCustomTask = () => {
    if (!newTask.name || newTask.name.trim() === "") {
      alert("يرجى إدخال اسم المهمة أولاً!");
      return;
    }
    handleAddTask({
      name: newTask.name.trim(),
      score: 0,
      submissionType: selectedSubmissionType,
    });
  };

  const markAllContentAsRead = async (docId) => {
    try {
      const studentRef = doc(db, "students", String(docId));
      const student = students.find((s) => String(s.docId) === String(docId));
      if (!student || !Array.isArray(student.contentReq)) return;
      const updatedContent = student.contentReq.map((item) => ({
        ...item,
        readMsg: true,
      }));
      await updateDoc(studentRef, { contentReq: updatedContent });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-50 p-3 sm:p-4"
      dir="rtl"
      onClick={() => setShowModal(false)}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── 1. Header الشامل ─── */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white p-5 shrink-0">
          <button
            onClick={() => setShowModal(false)}
            className="absolute left-4 top-4 p-2 rounded-full hover:bg-white/20 transition-colors z-10 text-white/80 hover:text-white"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-xl font-black shadow-lg shrink-0">
              {initials || <User className="w-6 h-6" />}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-black truncate">
                {selectedStudent.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2.5 mt-1 text-xs text-indigo-200">
                <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-md font-bold">
                  <FileText className="w-3.5 h-3.5" /> ID: {selectedStudent.id}
                </span>
                <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-md font-bold">
                  مجموعة: {selectedStudent.group || selectedGroup}
                </span>
                {selectedStudent?.lastUpdate && (
                  <span className="flex items-center gap-1 text-[11px] text-indigo-300">
                    <Clock className="w-3.5 h-3.5" />{" "}
                    {selectedStudent.lastUpdate}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stat Badges */}
          <div className="grid grid-cols-4 gap-2">
            {[
              {
                label: "المتبقي",
                value: `${remaining} ج`,
                color:
                  remaining > 0
                    ? "text-red-200 font-black"
                    : "text-emerald-200 font-black",
              },
              {
                label: "الغياب",
                value: `${absencesCount} يوم`,
                color: absenceInfo.color,
              },
              {
                label: "رصيد الحضور",
                value: selectedStudent.reserveAttendance || 0,
                color: "text-white font-bold",
              },
              {
                label: "إجمالي المهام",
                value: editedData.tasks?.length || 0,
                color: "text-white font-bold",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/10 backdrop-blur-md rounded-xl p-2 text-center border border-white/10"
              >
                <div className="text-[10px] text-indigo-200 font-bold mb-0.5">
                  {s.label}
                </div>
                <div className={`text-sm ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── 2. شريط التبويبات الأنيق ─── */}
        <div className="flex items-center gap-1 p-2 bg-gray-100 dark:bg-gray-800/90 border-b border-gray-200 dark:border-gray-700/80 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              activeTab === "tasks"
                ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-sm border border-gray-200 dark:border-gray-600"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-700/50"
            }`}
          >
            <Award className="w-4 h-4 text-amber-500" />
            <span>المهام والدرجات</span>
            <span className="bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] px-1.5 py-0.2 rounded-full">
              {editedData.tasks?.length || 0}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("subscription")}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              activeTab === "subscription"
                ? "bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-300 shadow-sm border border-gray-200 dark:border-gray-600"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-700/50"
            }`}
          >
            <CreditCard className="w-4 h-4 text-purple-500" />
            <span>الاشتراك والمدفوعات</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                remaining > 0
                  ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300"
                  : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300"
              }`}
            >
              {remaining > 0 ? "مستحق" : "مسدد"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("attendance")}
            className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              activeTab === "attendance"
                ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 shadow-sm border border-gray-200 dark:border-gray-600"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-700/50"
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-500" />
            <span>الحضور والغياب</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("links_notes")}
            className={`flex-1 min-w-[110px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              activeTab === "links_notes"
                ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-300 shadow-sm border border-gray-200 dark:border-gray-600"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-700/50"
            }`}
          >
            <Link2 className="w-4 h-4 text-emerald-500" />
            <span>الروابط والملاحظات</span>
            {selectedStudent.linksHistory?.length > 0 && (
              <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[10px] px-1.5 py-0.2 rounded-full">
                {selectedStudent.linksHistory.length}
              </span>
            )}
          </button>
        </div>

        {/* ─── 3. محتوى التبويبات ─── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* ══════════ التبويب 1: المهام والدرجات ══════════ */}
          {activeTab === "tasks" && (
            <div className="space-y-4">
              {/* قسم إضافة مهمة جديدة مع تحديد نوع التسليم الإلزامي */}
              <div className="p-4 bg-linear-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl border border-indigo-100 dark:border-gray-700 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-indigo-600" />
                    إضافة مهمة مخصصة للطالب:
                  </label>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                    اختر نوع التسليم المطلوب أولاً
                  </span>
                </div>

                {/* محدد نوع التسليم (ملف مضغوط vs رابط) */}
                <div className="flex items-center gap-2 p-1 bg-white dark:bg-gray-900 rounded-xl border border-indigo-200/70 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setSelectedSubmissionType("file")}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      selectedSubmissionType === "file"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-gray-600 dark:text-gray-400 hover:text-indigo-600"
                    }`}
                  >
                    <FileArchive className="w-3.5 h-3.5" />
                    <span>ملف مضغوط فقط (.zip)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSubmissionType("link")}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      selectedSubmissionType === "link"
                        ? "bg-cyan-600 text-white shadow-xs"
                        : "text-gray-600 dark:text-gray-400 hover:text-cyan-600"
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>رابط خارجي فقط (GitHub/Live)</span>
                  </button>
                </div>

                {/* حقل اسم المهمة وزر الإضافة */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="اكتب اسم المهمة الجديدة (مثال: Task - 4)..."
                    value={newTask.name}
                    onChange={(e) =>
                      setNewTask({ ...newTask, name: e.target.value })
                    }
                    onKeyDown={(e) => e.key === "Enter" && onAddCustomTask()}
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded-xl px-3.5 py-2 text-sm bg-white dark:bg-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={onAddCustomTask}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-95 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة المهمة
                  </button>
                </div>
              </div>

              {/* قائمة المهام القابلة للسحب والترتيب */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
                  <span className="font-bold">
                    قائمة مهام الطالب ({editedData.tasks?.length || 0})
                  </span>
                  <span className="flex items-center gap-1 text-[11px]">
                    <GripVertical className="w-3.5 h-3.5" /> اسحب لإعادة الترتيب
                  </span>
                </div>

                <DraggableTaskList
                  tasks={editedData.tasks || []}
                  onReorder={handleTaskReorder}
                  onDelete={handleDeleteTask}
                  onInputChange={handleInputChange}
                  onTaskNotesChange={handleTaskNotesChange}
                  onToggleEnabled={handleToggleTaskEnabled}
                  onTaskTypeChange={handleTaskTypeChange}
                />
              </div>
            </div>
          )}

          {/* ══════════ التبويب 2: الاشتراك والمدفوعات ══════════ */}
          {activeTab === "subscription" && (
            <div className="space-y-4">
              {/* تفاصيل الاشتراك الأساسية */}
              <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-200 dark:border-gray-700/80 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    نوع الاشتراك
                  </label>
                  <select
                    value={editedData.subscriptionType || ""}
                    onChange={(e) =>
                      setEditedData({
                        ...editedData,
                        subscriptionType: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3.5 py-2.5 bg-white dark:bg-gray-900 text-sm font-semibold dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="">اختر نوع الاشتراك...</option>
                    <option value="Front End">Front End</option>
                    <option value="Back End">Back End</option>
                    <option value="Full Stack">Full Stack</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      السعر الكلي (ج.م)
                    </label>
                    <input
                      type="number"
                      value={
                        editedData.totalPrice !== undefined
                          ? editedData.totalPrice
                          : selectedStudent.totalPrice || ""
                      }
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          totalPrice: Number(e.target.value),
                        })
                      }
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3.5 py-2 bg-white dark:bg-gray-900 font-black text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      إجمالي المدفوع (ج.م)
                    </label>
                    <input
                      type="number"
                      value={
                        editedData.paidAmount !== undefined
                          ? editedData.paidAmount
                          : selectedStudent.paidAmount || ""
                      }
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          paidAmount: Number(e.target.value),
                        })
                      }
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3.5 py-2 bg-white dark:bg-gray-900 font-black text-sm text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* نسبة السداد والمتبقي */}
                <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-500 dark:text-gray-400">
                      نسبة السداد:
                    </span>
                    <span className="text-purple-600 dark:text-purple-400">
                      {payPercent}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-purple-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${payPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1 text-sm font-black">
                    <span className="text-gray-600 dark:text-gray-300">
                      المبلغ المتبقي:
                    </span>
                    <span
                      className={
                        remaining > 0 ? "text-red-500" : "text-emerald-500"
                      }
                    >
                      {remaining} ج.م
                    </span>
                  </div>
                </div>
              </div>

              {/* إضافة دفعة جديدة تراكمياً */}
              <div className="p-4 bg-linear-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-300 dark:border-emerald-800/60 rounded-2xl space-y-2.5">
                <label className="flex items-center gap-1.5 text-xs font-black text-emerald-800 dark:text-emerald-300">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  إضافة دفعة جديدة تراكمياً
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newPaymentAmount}
                    onChange={(e) => setNewPaymentAmount(e.target.value)}
                    placeholder="المبلغ الجديد (مثال: 500)"
                    className="flex-1 border border-emerald-400 dark:border-emerald-700 rounded-xl px-3.5 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const v = Number(newPaymentAmount) || 0;
                      if (v <= 0) return;
                      const c =
                        editedData.paidAmount !== undefined
                          ? Number(editedData.paidAmount)
                          : Number(selectedStudent.paidAmount) || 0;
                      setEditedData({ ...editedData, paidAmount: c + v });
                      setNewPaymentAmount("");
                    }}
                    disabled={
                      !newPaymentAmount || Number(newPaymentAmount) <= 0
                    }
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-4 h-4" /> إضافة للرصيد
                  </button>
                </div>
              </div>

              {/* رسائل الاشتراك */}
              {selectedStudent.contentReq?.length > 0 && (
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
                  <div
                    onClick={() => markAllContentAsRead(selectedStudent.docId)}
                    className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/80 cursor-pointer font-bold text-xs text-gray-700 dark:text-gray-200 border-b border-gray-100 dark:border-gray-700"
                  >
                    <span className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-purple-500" />
                      رسائل الاشتراك المسجلة
                    </span>
                    <span className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs px-2 py-0.5 rounded-full font-bold">
                      {selectedStudent.contentReq.length}
                    </span>
                  </div>
                  <div className="p-3 space-y-2 max-h-52 overflow-y-auto">
                    {selectedStudent.contentReq.map((item, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 flex justify-between items-start gap-3 border border-gray-100 dark:border-gray-800"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-800 dark:text-gray-100 leading-relaxed break-words">
                            {item.content}
                          </p>
                          {item.uploadedAt && (
                            <p className="text-[10px] text-gray-400 mt-1">
                              {new Date(
                                item.uploadedAt.seconds
                                  ? item.uploadedAt.seconds * 1000
                                  : item.uploadedAt,
                              ).toLocaleString("ar-EG")}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteContent(selectedStudent.docId, index)
                          }
                          className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold rounded-lg transition-colors shrink-0"
                        >
                          حذف
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════ التبويب 3: الحضور والغياب ══════════ */}
          {activeTab === "attendance" && (
            <div className="space-y-4">
              <div className="bg-linear-to-br from-blue-50/60 to-indigo-50/60 dark:from-gray-800 dark:to-gray-800 rounded-2xl p-4 border border-blue-100 dark:border-gray-700 space-y-3">
                <h3 className="font-bold text-gray-800 dark:text-gray-200 text-xs flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  إحصائيات ونسب الحضور
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    {
                      label: "محاضرة البداية",
                      value: selectedStudent.startLecture || 1,
                      color: "text-gray-800 dark:text-gray-100",
                    },
                    {
                      label: "مرات الحضور",
                      value:
                        editedData.attendedLectures ??
                        selectedStudent.attendedLectures ??
                        0,
                      color: "text-emerald-600",
                    },
                    {
                      label: "مرات الغياب",
                      value: absencesCount,
                      color: absenceInfo.color,
                    },
                    {
                      label: "إجمالي محاضرات المجموعة",
                      value: getRemainingLectures(
                        selectedStudent,
                        selectedGroup,
                      ),
                      color: "text-indigo-600 dark:text-indigo-400",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="bg-white dark:bg-gray-900 rounded-xl p-3 shadow-xs text-center border border-gray-100 dark:border-gray-800"
                    >
                      <div className="text-[10px] font-bold text-gray-400 mb-1">
                        {s.label}
                      </div>
                      <div className={`text-base font-black ${s.color}`}>
                        {s.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-1">
                  <span
                    className={`inline-block text-xs px-3 py-1 rounded-full font-bold ${absenceInfo.badge}`}
                  >
                    حالة الغياب: {absenceInfo.status}
                  </span>
                </div>
              </div>

              {/* تعديل حضور الطالب */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700/80 space-y-3">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  تعديل عدد مرات الحضور يدوياً:
                </label>
                <input
                  type="number"
                  value={
                    editedData.attendedLectures !== undefined
                      ? editedData.attendedLectures
                      : selectedStudent.attendedLectures || 0
                  }
                  onChange={(e) =>
                    setEditedData({
                      ...editedData,
                      attendedLectures: Number(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3.5 py-2 bg-gray-50 dark:bg-gray-900 font-black text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  min="0"
                />
              </div>

              {/* إدارة رصيد الحضور الاحتياطي */}
              <div className="bg-linear-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl p-4 border border-emerald-200 dark:border-gray-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-gray-700 dark:text-gray-200">
                    رصيد الحضور الاحتياطي الحالي:
                  </span>
                  <span className="text-xl font-black text-emerald-600">
                    {selectedStudent.reserveAttendance || 0} محاضرة
                  </span>
                </div>
                <div className="flex gap-2">
                  {[
                    {
                      label: "+1 إضافة",
                      val: 1,
                      cls: "bg-emerald-600 hover:bg-emerald-700 text-white",
                    },
                    {
                      label: "-1 خصم",
                      val: -1,
                      cls: "bg-red-500 hover:bg-red-600 text-white",
                    },
                    {
                      label: "تصفير الرصيد",
                      val: -(selectedStudent.reserveAttendance || 0),
                      cls: "bg-gray-500 hover:bg-gray-600 text-white",
                    },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={() =>
                        updateReserveForOne(selectedStudent.id, btn.val)
                      }
                      disabled={loading}
                      className={`flex-1 ${btn.cls} py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 shadow-xs`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════ التبويب 4: الروابط والملاحظات ══════════ */}
          {activeTab === "links_notes" && (
            <div className="space-y-4">
              {/* ملاحظات عن الطالب */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700/80 space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                  ملاحظات المشرف عن الطالب:
                </label>
                <textarea
                  name="note"
                  value={editedData.note || ""}
                  onChange={(e) =>
                    setEditedData({ ...editedData, note: e.target.value })
                  }
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-3 dark:bg-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs leading-relaxed transition"
                  rows="3"
                  placeholder="اكتب أي ملاحظات إدارية أو توجيهات خاصة بالطالب هنا..."
                />
              </div>

              {/* سجل روابط الطالب */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/80 overflow-hidden">
                <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700">
                  <span className="font-bold text-xs text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-emerald-500" />
                    سجل الروابط الخارجية المسلمة للطالب
                  </span>
                  <span className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs px-2 py-0.5 rounded-full font-bold">
                    {selectedStudent.linksHistory?.length || 0}
                  </span>
                </div>

                <div className="p-3.5 space-y-2 max-h-60 overflow-y-auto">
                  {!selectedStudent.linksHistory ||
                  selectedStudent.linksHistory.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 py-6">
                      لم يتم تسجيل أي روابط خارجية لهذا الطالب حتى الآن.
                    </p>
                  ) : (
                    selectedStudent.linksHistory
                      .sort(
                        (a, b) =>
                          (b.uploadedAt?.seconds || 0) -
                          (a.uploadedAt?.seconds || 0),
                      )
                      .map((item, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 border border-gray-200/70 dark:border-gray-700 flex items-center justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 dark:text-indigo-400 hover:underline text-xs font-bold break-all flex items-center gap-1"
                            >
                              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                              <span>{item.url}</span>
                            </a>
                            {item.uploadedAt && (
                              <div className="text-[10px] text-gray-400 mt-1">
                                {new Date(
                                  item.uploadedAt.seconds * 1000,
                                ).toLocaleString("ar-EG")}
                              </div>
                            )}
                          </div>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors"
                          >
                            زيارة
                          </a>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── 4. Footer أزرار الحفظ والإلغاء ─── */}
        <div className="shrink-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white py-3 rounded-2xl font-black transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 flex items-center justify-center gap-2 text-sm disabled:opacity-50 active:scale-98"
          >
            <Save className="w-4 h-4" />
            <span>حفظ جميع التعديلات</span>
          </button>
          <button
            type="button"
            onClick={() => setShowModal(false)}
            disabled={loading}
            className="px-6 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 rounded-2xl font-bold transition-colors text-sm"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImprovedStudentModal;
