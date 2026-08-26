"use client";
import React, { useRef, useState, useCallback } from "react";
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
  ChevronDown,
  ChevronUp,
  Download,
  FileArchive,
  CheckCircle2,
  GripVertical,
  MessageSquare,
} from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

function DraggableTaskList({ tasks, onReorder, onDelete, onInputChange, onTaskNotesChange }) {
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const dragNode = useRef(null);

  const handleDragStart = useCallback((e, index) => {
    dragNode.current = e.currentTarget;
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => { if (dragNode.current) dragNode.current.style.opacity = "0.4"; }, 0);
  }, []);

  const handleDragEnter = useCallback((e, index) => {
    e.preventDefault();
    if (index !== dragIndex) setOverIndex(index);
  }, [dragIndex]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback((e, dropIndex) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) return;
    const reordered = [...tasks];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    onReorder(reordered);
    setDragIndex(null);
    setOverIndex(null);
  }, [dragIndex, tasks, onReorder]);

  const handleDragEnd = useCallback(() => {
    if (dragNode.current) dragNode.current.style.opacity = "1";
    dragNode.current = null;
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  const handleConfirmDelete = (index) => {
    if (window.confirm("هل انت متاكد من حذف هذه المهمة؟")) { onDelete(index); }
  };

  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-600">
        <Award className="w-10 h-10 mb-2 opacity-40" />
        <p className="text-sm">لا توجد مهام بعد</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task, index) => {
        const isDragging = dragIndex === index;
        const isOver = overIndex === index && dragIndex !== index;
        return (
          <div
            key={index}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={[
              "rounded-xl border transition-all duration-150 select-none relative",
              isDragging ? "opacity-40 border-dashed border-indigo-400 bg-indigo-50 dark:bg-indigo-950" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md",
              isOver ? "border-indigo-500 ring-2 ring-indigo-300" : "",
            ].join(" ")}
          >
            {isOver && <div className="absolute -top-1 left-4 right-4 h-0.5 bg-indigo-500 rounded-full" />}
            <div className="flex items-start gap-2 p-3">
              <div className="mt-2.5 cursor-grab active:cursor-grabbing text-gray-300 hover:text-indigo-400 transition-colors flex-shrink-0" title="اسحب لاعادة الترتيب">
                <GripVertical className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <input type="text" value={task.name} readOnly className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 dark:text-gray-100 cursor-default" />
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="relative">
                      <input type="number" value={task.score} onChange={(e) => onInputChange(e, index)} className="w-20 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-center font-bold text-indigo-700 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="0" />
                      <span className="absolute -top-2 -right-1 text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-1 rounded-sm font-bold">درجة</span>
                    </div>
                    <button onClick={() => handleConfirmDelete(index)} className="p-2 bg-red-50 dark:bg-red-900 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all" title="حذف المهمة">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {(task.submittedFile || task.submittedLink) && (
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900 border border-indigo-100 dark:border-indigo-800 rounded-lg flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-semibold text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>تم التسليم</span>
                      {task.submittedAt && <span className="text-indigo-400 font-normal">({new Date(task.submittedAt).toLocaleString("ar-EG")})</span>}
                    </div>
                    {task.submittedFile ? (
                      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-1.5 rounded border border-indigo-100 dark:border-indigo-700">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileArchive className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-xs" title={task.submittedFile.name}>{task.submittedFile.name}</span>
                        </div>
                        <a href={task.submittedFile.url} target="_blank" rel="noopener noreferrer" className="shrink-0 flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-xs font-bold transition-colors"><Download className="w-3 h-3" /> تنزيل</a>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-1.5 rounded border border-indigo-100 dark:border-indigo-700">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Link2 className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-xs" title={task.submittedLink}>{task.submittedLink}</span>
                        </div>
                        <a href={task.submittedLink} target="_blank" rel="noopener noreferrer" className="shrink-0 flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-xs font-bold transition-colors"><Link2 className="w-3 h-3" /> فتح</a>
                      </div>
                    )}
                  </div>
                )}
                <textarea value={task.notes || ""} onChange={(e) => onTaskNotesChange(e, index)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:text-gray-100 resize-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder-gray-400" rows="2" placeholder="ملاحظات على المهمة..." />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ImprovedStudentModal({
  students, showModal, selectedStudent, editedData, setEditedData,
  selectedGroup, newTask, setNewTask, calculateAbsences, getRemainingLectures,
  updateReserveForOne, handleInputChange, handleDeleteTask, handleTaskNotesChange,
  handleSaveChanges, handleAddTask, loading, setShowModal, handleDeleteContent,
}) {
  const modalRef = useRef(null);
  const [expandedSections, setExpandedSections] = useState({ links: false, actions: false, subscription: false });
  const [newPaymentAmount, setNewPaymentAmount] = useState("");

  if (!showModal || !selectedStudent) return null;

  const toggleSection = (section) => setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));

  const markAllContentAsRead = async (docId) => {
    try {
      const studentRef = doc(db, "students", String(docId));
      const student = students.find((s) => String(s.docId) === String(docId));
      if (!student || !Array.isArray(student.contentReq)) return;
      const updatedContent = student.contentReq.map((item) => ({ ...item, readMsg: true }));
      await updateDoc(studentRef, { contentReq: updatedContent });
    } catch (err) { console.error(err); }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "غير محدد";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true, locale: ar });
  };

  const getAbsenceStatus = () => {
    const a = calculateAbsences(selectedStudent);
    if (a >= 12) return { color: "text-red-600", badge: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300", status: "حرج" };
    if (a >= 7) return { color: "text-yellow-600", badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300", status: "تحذير" };
    return { color: "text-green-600", badge: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", status: "جيد" };
  };

  const currentTotalPrice = editedData.totalPrice !== undefined ? Number(editedData.totalPrice) : Number(selectedStudent.totalPrice) || 0;
  const currentPaidAmount = editedData.paidAmount !== undefined ? Number(editedData.paidAmount) : Number(selectedStudent.paidAmount) || 0;
  const remaining = currentTotalPrice - currentPaidAmount;
  const absenceInfo = getAbsenceStatus();
  const absencesCount = calculateAbsences(selectedStudent);
  const payPercent = currentTotalPrice > 0 ? Math.min(Math.round((currentPaidAmount / currentTotalPrice) * 100), 100) : 0;
  const initials = (selectedStudent.name || "").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const handleTaskReorder = (reordered) => setEditedData({ ...editedData, tasks: reordered });

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/65 backdrop-blur-sm z-50 p-3" dir="rtl" onClick={() => setShowModal(false)}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden" ref={modalRef} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 text-white p-5 flex-shrink-0">
          <button onClick={() => setShowModal(false)} className="absolute left-4 top-4 p-1.5 rounded-full hover:bg-white/20 transition-colors z-10">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-xl font-black shadow-lg flex-shrink-0">
              {initials || <User className="w-7 h-7" />}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold truncate">{selectedStudent.name}</h2>
              <div className="flex flex-wrap gap-2 mt-1 text-sm text-indigo-100">
                <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />ID: {selectedStudent.id}</span>
                {selectedStudent?.lastUpdate && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{selectedStudent.lastUpdate}</span>}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "المتبقي", value: `${remaining} ج`, color: remaining > 0 ? "text-red-200" : "text-green-200" },
              { label: "الغياب", value: absencesCount, color: absenceInfo.color },
              { label: "الرصيد", value: selectedStudent.reserveAttendance || 0, color: "text-white" },
              { label: "المهام", value: editedData.tasks?.length || 0, color: "text-white" },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center">
                <div className="text-[11px] text-indigo-200 mb-0.5">{s.label}</div>
                <div className={`text-base font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-indigo-200 mb-1">
              <span>نسبة السداد</span>
              <span className="font-bold text-white">{payPercent}%</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-400 to-emerald-300 rounded-full transition-all duration-700" style={{ width: `${payPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-3">

            {/* Attendance */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-4 border border-blue-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4 text-blue-500" />احصائيات الحضور
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "من المحاضرة", value: selectedStudent.startLecture, color: "text-gray-800 dark:text-gray-100" },
                  { label: "مرات الغياب", value: absencesCount, color: absenceInfo.color },
                  { label: "مرات الحضور", value: editedData.attendedLectures, color: "text-green-600" },
                  { label: "الاجمالي", value: getRemainingLectures(selectedStudent, selectedGroup), color: "text-gray-700 dark:text-gray-200" },
                ].map((s) => (
                  <div key={s.label} className="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm text-center">
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">{s.label}</div>
                    <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${absenceInfo.badge}`}>حالة الغياب: {absenceInfo.status}</span>
              </div>
            </div>

            {/* Links */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button onClick={() => toggleSection("links")} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <span className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200 text-sm">
                  <Link2 className="w-4 h-4 text-blue-500" />روابط الطالب
                  {selectedStudent.linksHistory?.length > 0 && <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full font-bold">{selectedStudent.linksHistory.length}</span>}
                </span>
                {expandedSections.links ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {expandedSections.links && selectedStudent.linksHistory?.length > 0 && (
                <div className="px-4 pb-4 pt-2 space-y-2 max-h-52 overflow-y-auto border-t border-gray-100 dark:border-gray-700">
                  {selectedStudent.linksHistory.sort((a, b) => (b.uploadedAt?.seconds || 0) - (a.uploadedAt?.seconds || 0)).map((item, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-sm break-all">{item.url}</a>
                      {item.uploadedAt && <div className="text-xs text-gray-400 mt-1">{new Date(item.uploadedAt.seconds * 1000).toLocaleString("ar-EG")}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button onClick={() => toggleSection("actions")} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <span className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200 text-sm"><TrendingUp className="w-4 h-4 text-green-500" />اجراءات اخرى</span>
                {expandedSections.actions ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {expandedSections.actions && (
                <div className="px-4 pb-4 pt-2 space-y-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-700 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">رصيد الحضور</span>
                      <span className="text-2xl font-black text-green-600">{selectedStudent.reserveAttendance || 0}</span>
                    </div>
                    <div className="flex gap-2">
                      {[
                        { label: "+ اضافة", val: 1, cls: "bg-green-600 hover:bg-green-700" },
                        { label: "- خصم", val: -1, cls: "bg-red-500 hover:bg-red-600" },
                        { label: "تصفير", val: -(selectedStudent.reserveAttendance || 0), cls: "bg-gray-500 hover:bg-gray-600" },
                      ].map((btn) => (
                        <button key={btn.label} onClick={() => updateReserveForOne(selectedStudent.id, btn.val)} disabled={loading} className={`flex-1 ${btn.cls} text-white py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50`}>{btn.label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5"><MessageSquare className="w-3.5 h-3.5" />ملاحظات عن الطالب</label>
                    <textarea name="note" value={editedData.note || ""} onChange={(e) => setEditedData({ ...editedData, note: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 dark:bg-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none text-sm transition" rows="3" placeholder="ادخل ملاحظات عن الطالب..." />
                  </div>
                </div>
              )}
            </div>

            {/* Subscription */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button onClick={() => toggleSection("subscription")} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <span className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-200 text-sm">
                  <CreditCard className="w-4 h-4 text-purple-500" />معلومات الاشتراك
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${remaining > 0 ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300" : "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"}`}>{remaining > 0 ? "مستحق" : "مسدد"}</span>
                </span>
                {expandedSections.subscription ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {expandedSections.subscription && (
                <div className="px-4 pb-4 pt-2 space-y-4 border-t border-gray-100 dark:border-gray-700">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">نوع الاشتراك</label>
                    <select value={editedData.subscriptionType || ""} onChange={(e) => setEditedData({ ...editedData, subscriptionType: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 dark:bg-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition">
                      <option value="">اختر نوع الاشتراك...</option>
                      <option value="Front End">Front End</option>
                      <option value="Back End">Back End</option>
                      <option value="Full Stack">Full Stack</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">السعر الكلي (ج.م)</label>
                      <input type="number" value={editedData.totalPrice !== undefined ? editedData.totalPrice : (selectedStudent.totalPrice || "")} onChange={(e) => setEditedData({ ...editedData, totalPrice: Number(e.target.value) })} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 dark:bg-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent font-bold text-sm" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">اجمالي المدفوع (ج.م)</label>
                      <input type="number" value={editedData.paidAmount !== undefined ? editedData.paidAmount : (selectedStudent.paidAmount || "")} onChange={(e) => setEditedData({ ...editedData, paidAmount: Number(e.target.value) })} className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 dark:bg-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent font-bold text-green-600 dark:text-green-400 text-sm" placeholder="0" />
                    </div>
                  </div>
                  <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 border border-emerald-300 dark:border-emerald-700 rounded-xl space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 dark:text-emerald-300"><Plus className="w-3.5 h-3.5 text-emerald-600" />اضافة دفعة جديدة تراكميا</label>
                    <div className="flex gap-2">
                      <input type="number" value={newPaymentAmount} onChange={(e) => setNewPaymentAmount(e.target.value)} placeholder="المبلغ الجديد (مثال: 500)" className="flex-1 border border-emerald-400 dark:border-emerald-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none" />
                      <button type="button" onClick={() => { const v = Number(newPaymentAmount) || 0; if (v <= 0) return; const c = editedData.paidAmount !== undefined ? Number(editedData.paidAmount) : Number(selectedStudent.paidAmount) || 0; setEditedData({ ...editedData, paidAmount: c + v }); setNewPaymentAmount(""); }} disabled={!newPaymentAmount || Number(newPaymentAmount) <= 0} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 disabled:cursor-not-allowed">
                        <Plus className="w-4 h-4" />اضافة
                      </button>
                    </div>
                    {Number(newPaymentAmount) > 0 && (
                      <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 bg-white/80 dark:bg-gray-800 p-2 rounded-lg border border-emerald-200 dark:border-emerald-700 flex flex-wrap justify-between gap-1">
                        <span>القديم: <strong>{currentPaidAmount} ج</strong> + <strong className="text-emerald-600">{Number(newPaymentAmount)} ج</strong></span>
                        <span>= الاجمالي: <strong className="text-emerald-700 dark:text-emerald-400">{currentPaidAmount + Number(newPaymentAmount)} ج</strong></span>
                      </div>
                    )}
                  </div>
                  <div className={`rounded-xl p-3 flex items-center justify-between border ${remaining > 0 ? "bg-red-50 dark:bg-red-950 border-red-100 dark:border-red-800" : "bg-green-50 dark:bg-green-950 border-green-100 dark:border-green-800"}`}>
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">المتبقي</span>
                    <span className={`text-xl font-black ${remaining > 0 ? "text-red-600" : "text-green-600"}`}>{remaining} ج.م</span>
                  </div>
                  {selectedStudent.contentReq?.length > 0 && (
                    <details className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <summary onClick={() => markAllContentAsRead(selectedStudent.docId)} className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-semibold text-gray-700 dark:text-gray-200 list-none">
                        <MessageSquare className="w-4 h-4 text-blue-500" />رسائل الاشتراك
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full font-bold">{selectedStudent.contentReq.length}</span>
                      </summary>
                      <div className="p-4 space-y-3 max-h-60 overflow-y-auto border-t border-gray-100 dark:border-gray-700">
                        {selectedStudent.contentReq.map((item, index) => (
                          <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex justify-between items-start gap-3 border border-gray-200 dark:border-gray-600">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-800 dark:text-gray-100 leading-relaxed break-words">{item.content}</p>
                              <p className="text-xs text-gray-400 mt-1.5">{formatDate(item.uploadedAt)}</p>
                            </div>
                            <button onClick={() => handleDeleteContent(selectedStudent.docId, index)} className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex-shrink-0">حذف</button>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>

            {/* Tasks */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2 text-sm">
                  <Award className="w-4 h-4 text-amber-500" />المهام والدرجات
                  {editedData.tasks?.length > 0 && <span className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-xs px-2 py-0.5 rounded-full font-bold">{editedData.tasks.length}</span>}
                </h3>
                <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                  <GripVertical className="w-3.5 h-3.5" /><span>اسحب لاعادة الترتيب</span>
                </div>
              </div>
              <div className="p-3 max-h-96 overflow-y-auto">
                <DraggableTaskList tasks={editedData.tasks || []} onReorder={handleTaskReorder} onDelete={handleDeleteTask} onInputChange={handleInputChange} onTaskNotesChange={handleTaskNotesChange} />
              </div>
              <div className="border-t border-gray-100 dark:border-gray-700 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800 p-3">
                <div className="flex gap-2">
                  <input type="text" placeholder="اسم المهمة الجديدة..." value={newTask.name} onChange={(e) => setNewTask({ ...newTask, name: e.target.value })} onKeyDown={(e) => e.key === "Enter" && handleAddTask()} className="flex-1 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 dark:bg-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition" />
                  <button onClick={handleAddTask} className="px-5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors flex items-center gap-1.5 text-sm whitespace-nowrap shadow-sm">
                    <Plus className="w-4 h-4" />اضافة
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 flex gap-3">
          <button onClick={handleSaveChanges} className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm">
            <Save className="w-4 h-4" />حفظ التغييرات
          </button>
          <button onClick={() => setShowModal(false)} className="px-6 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-semibold transition-colors text-sm">
            الغاء
          </button>
        </div>

      </div>
    </div>
  );
}

export default ImprovedStudentModal;
