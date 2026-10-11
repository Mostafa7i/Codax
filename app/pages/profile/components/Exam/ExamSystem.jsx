"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Edit3, Plus, Trash2, BookOpen, Loader, X, CheckCircle,
  Copy, List, PlayCircle, Users, Archive,
  Activity, TrendingUp, TrendingDown, Star, MessageSquare, Filter, Search, Award, RefreshCw,
  Calendar, Clock, Settings, Image, Upload, ArrowLeft, ArrowRight, Check, Layers, AlertCircle,
  GripVertical, ChevronUp, ChevronDown, Trophy, Sparkles, Medal
} from "lucide-react";

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  Timestamp,
  writeBatch,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import StudentAnswersModal from "./StudentAnswersModal";
import QuestionAnalysisDashboard from "./QuestionAnalysisDashboard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const RankBadge = ({ rank }) => {
  const configs = {
    1: { bg: "bg-linear-to-br from-yellow-400 to-amber-500", text: "text-slate-100", shadow: "shadow-amber-200" },
    2: { bg: "bg-linear-to-br from-slate-400 to-slate-500", text: "text-slate-100", shadow: "shadow-slate-200" },
    3: { bg: "bg-linear-to-br from-amber-600 to-amber-800", text: "text-slate-100", shadow: "shadow-amber-200" },
  };
  const cfg = configs[rank] || { bg: "bg-gray-700", text: "text-gray-300", shadow: "" };
  return (
    <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full font-bold text-sm ${cfg.bg} ${cfg.text} shadow-lg ${cfg.shadow}`}>
      {rank === 1 ? <Award size={15} /> : rank}
    </span>
  );
};

const StatCard = ({ icon, label, value, colorClass = "text-indigo-600", gradient = "from-indigo-900/30 to-indigo-800/20" }) => (
  <div className={`bg-linear-to-br ${gradient} p-5 rounded-2xl border border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5`}>
    <div className="flex items-start justify-between mb-3">
      <div className={`p-2.5 rounded-xl bg-gray-800 shadow-sm`}>
        {React.cloneElement(icon, { className: colorClass, size: 22 })}
      </div>
      <p className={`text-3xl font-black ${colorClass}`}>{value}</p>
    </div>
    <p className="text-sm font-semibold text-gray-400">{label}</p>
  </div>
);

const ExamSelector = ({ examId, setExamId, exams, onNew, onDelete }) => (
  <div className="mb-6">
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-grow min-w-48">
        <List size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <select
          value={examId}
          onChange={(e) => setExamId(e.target.value)}
          className="w-full pr-9 pl-4 py-3 bg-gray-800 border border-gray-600 text-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none shadow-sm"
          disabled={!exams.length}
        >
          <option value="" className="bg-gray-800 text-slate-100">{exams.length ? "— اختر امتحانًا —" : "لا توجد امتحانات"}</option>
          {exams.map(e => <option key={e.id} value={e.id} className="bg-gray-800 text-slate-100">{e.title || e.id}</option>)}
        </select>
      </div>
      <button
        type="button"
        onClick={onNew}
        className="inline-flex items-center gap-2 px-5 py-3 bg-linear-to-r hover:from-emerald-700 hover:to-teal-700 text-slate-100 rounded-xl text-sm font-extrabold shadow-sm hover:shadow transition-all"
      >
        <Plus size={16} /> امتحان جديد
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={!examId}
        className="inline-flex items-center gap-2 px-4 py-3 bg-slate-800 hover:bg-red-950/40 text-red-400 border border-red-800 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
      >
        <Trash2 size={16} /> حذف
      </button>
    </div>
  </div>
);

// دالة المساعدة لإعادة ترتيب خيارات الإجابة مع الحفاظ على مؤشر الإجابة الصحيحة
const reorderOptions = (options, correctAnswer, fromIndex, toIndex) => {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || toIndex >= options.length) {
    return { options, correctAnswer };
  }
  const newOptions = [...options];
  const [moved] = newOptions.splice(fromIndex, 1);
  newOptions.splice(toIndex, 0, moved);

  let newCorrect = correctAnswer;
  if (correctAnswer === fromIndex) {
    newCorrect = toIndex;
  } else if (fromIndex < correctAnswer && toIndex >= correctAnswer) {
    newCorrect = correctAnswer - 1;
  } else if (fromIndex > correctAnswer && toIndex <= correctAnswer) {
    newCorrect = correctAnswer + 1;
  }
  return { options: newOptions, correctAnswer: newCorrect };
};

const QuestionEditor = ({ question, dirValue, onSave, onCancel }) => {
  const [editData, setEditData] = useState(question);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const fileInputRef = useRef(null);

  const handleFieldChange = (field, value) => setEditData(prev => ({ ...prev, [field]: value }));
  const handleOptionChange = (index, value) => {
    const newOptions = [...editData.options];
    newOptions[index] = value;
    setEditData(prev => ({ ...prev, options: newOptions }));
  };
  const addOption = () => setEditData(prev => ({ ...prev, options: [...prev.options, ""] }));
  const removeOption = (index) => setEditData(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== index) }));

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert("حجم الصورة كبير جداً (الحد الأقصى 3 ميجابايت)");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditData(prev => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-linear-to-br from-gray-800 to-gray-900 p-5 rounded-2xl border-2 border-indigo-600 space-y-4 shadow-md">
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-gray-300">نص السؤال</label>
        <textarea
          value={editData.text}
          dir={dirValue}
          onChange={(e) => handleFieldChange('text', e.target.value)}
          className="w-full p-3 border border-gray-600 rounded-xl bg-gray-700 text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition font-medium placeholder:text-gray-400"
          rows="3"
          placeholder="نص السؤال..."
        />
      </div>

      {/* قسم الصورة */}
         
          <div className="space-y-2 p-3 bg-gray-700/50 rounded-xl border border-gray-600">
            <label className="block text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <Image size={15} className="text-indigo-400" /> صورة السؤال (اختياري)
            </label>

            {editData.image ? (
              <div className="relative group inline-block">
                <img src={editData.image} alt="Question" className="max-h-48 rounded-lg object-contain border border-gray-600 shadow-sm" />
                <button
                  type="button"
                  onClick={() => handleFieldChange('image', '')}
                  className="absolute top-2 right-2 hover:bg-red-700 text-slate-100 p-1.5 rounded-full shadow-md transition"
                  title="إزالة الصورة"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Upload size={14} /> رفع صورة من الجهاز
                </button>
                <span className="text-xs text-gray-400">أو إدخال رابط:</span>
                <input
                  type="text"
                  value={editData.image || ''}
                  onChange={(e) => handleFieldChange('image', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 min-w-[200px] px-3 py-1.5 text-xs bg-gray-700 text-slate-100 border border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            )}
          </div>


      <div className="flex items-center gap-3">
        <label className="text-sm font-bold text-gray-300">الدرجة:</label>
        <input
          type="number"
          value={editData.marks}
          onChange={(e) => handleFieldChange('marks', parseInt(e.target.value) || 0)}
          className="w-24 p-2 border border-gray-600 rounded-xl bg-gray-700 text-slate-100 text-center font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition"
        />
      </div>

      {editData.type === 'multiple' && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm font-bold text-gray-300">الخيارات: <span className="text-indigo-400">(حدد الإجابة الصحيحة وتستطيع إعادة الترتيب بالـ Drag & Drop)</span></p>
          </div>
          {editData.options.map((opt, i) => (
            <div
              key={i}
              draggable
              onDragStart={(e) => {
                setDraggedIdx(i);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragOverIdx !== i) setDragOverIdx(i);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedIdx !== null && draggedIdx !== i) {
                  const { options: newOptions, correctAnswer: newCorrect } = reorderOptions(editData.options, editData.correctAnswer, draggedIdx, i);
                  setEditData(prev => ({ ...prev, options: newOptions, correctAnswer: newCorrect }));
                }
                setDraggedIdx(null);
                setDragOverIdx(null);
              }}
              onDragEnd={() => {
                setDraggedIdx(null);
                setDragOverIdx(null);
              }}
              className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all duration-200 ${draggedIdx === i ? 'opacity-40 border-indigo-400 bg-indigo-900/30' :
                dragOverIdx === i ? 'border-indigo-500 ring-2 ring-indigo-400 bg-indigo-900/20' :
                  editData.correctAnswer === i
                    ? 'bg-emerald-950/40 border-emerald-600 shadow-sm'
                    : 'border-gray-600 bg-gray-700'
                }`}
            >
              <div className="hover:text-indigo-600 cursor-grab active:cursor-grabbing p-1 flex-shrink-0" title="اسحب لإعادة الترتيب">
                <GripVertical size={16} />
              </div>

              <input
                type="radio"
                name={`edit-correct-${editData.id}`}
                checked={editData.correctAnswer === i}
                onChange={() => handleFieldChange('correctAnswer', i)}
                className="accent-emerald-600 w-4 h-4 cursor-pointer flex-shrink-0"
              />

              <input
                type="text" dir={dirValue} value={opt}
                onChange={(e) => handleOptionChange(i, e.target.value)}
                className="flex-1 bg-transparent text-slate-100 text-sm outline-none font-medium"
                placeholder={`الخيار ${i + 1}`}
              />

              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() => {
                    const { options: newOptions, correctAnswer: newCorrect } = reorderOptions(editData.options, editData.correctAnswer, i, i - 1);
                    setEditData(prev => ({ ...prev, options: newOptions, correctAnswer: newCorrect }));
                  }}
                  className="p-1 hover:text-indigo-600 hover:bg-gray-600 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title="تحريك لأعلى"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  disabled={i === editData.options.length - 1}
                  onClick={() => {
                    const { options: newOptions, correctAnswer: newCorrect } = reorderOptions(editData.options, editData.correctAnswer, i, i + 1);
                    setEditData(prev => ({ ...prev, options: newOptions, correctAnswer: newCorrect }));
                  }}
                  className="p-1 hover:text-indigo-600 hover:bg-gray-600 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title="تحريك لأسفل"
                >
                  <ChevronDown size={14} />
                </button>
              </div>

              {editData.options.length > 2 && (
                <button type="button" onClick={() => removeOption(i)} className="hover:text-red-700 p-1 rounded-lg hover:bg-red-900/30 transition flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addOption} className="text-xs text-indigo-400 hover:underline font-bold flex items-center gap-1">
            <Plus size={12} /> إضافة خيار جديد
          </button>
        </div>
      )}

      <div className="flex gap-2 justify-end pt-3 border-t border-gray-700">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border border-gray-600 text-gray-300 text-sm font-semibold hover:bg-gray-700 transition">إلغاء</button>
        <button type="button" onClick={() => onSave(editData)} className="px-4 py-2 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 text-slate-100 text-sm font-bold shadow-md hover:shadow-lg transition flex items-center gap-1">
          <CheckCircle size={15} /> حفظ التعديل
        </button>
      </div>
    </div>
  );
};

const QuestionDisplay = ({ dirValue, question, onEdit, onDelete, index, duplicateInfo }) => (
  <div className="group">
    <div className="flex items-start gap-3">
      <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-900/40 text-indigo-400 text-xs font-bold flex items-center justify-center mt-0.5 shadow-sm">
        {(index ?? 0) + 1}
      </span>
      <div className="flex-1 min-w-0">
        {duplicateInfo && (
          <div className="mb-1.5 flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/40 border border-amber-700 rounded-lg text-xs font-bold text-amber-300">
            <AlertCircle size={12} className="flex-shrink-0" />
            <span>⚠️ سؤال مكرر — {duplicateInfo.type === 'current' ? 'موجود في نفس هذا الامتحان' : `موجود في امتحان آخر: "${duplicateInfo.examTitle}"`}</span>
          </div>
        )}
        <p dir={dirValue} className="text-gray-100 font-semibold leading-relaxed text-base">{question.text}</p>

        {/* عرض صورة السؤال إذا كانت موجودة */}
        {question.image && (
          <div className="mt-3">
            <img
              src={question.image}
              alt={`صورة السؤال ${index + 1}`}
              className="max-h-60 max-w-full rounded-xl object-contain border border-gray-700 shadow-sm bg-gray-900"
            />
          </div>
        )}

        {question.type === 'multiple' && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {question.options.map((option, i) => (
              <div key={i} className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm ${i === question.correctAnswer
                ? 'bg-emerald-950/30 text-emerald-300 font-bold border border-emerald-800 shadow-sm'
                : 'bg-gray-800 text-gray-300 border border-gray-700'
                }`}>
                <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-extrabold ${i === question.correctAnswer ? 'text-slate-100' : 'bg-gray-700 text-gray-400'
                  }`}>{i === question.correctAnswer ? '✓' : String.fromCharCode(65 + i)}</span>
                <span dir={dirValue} className="break-words">{option}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-indigo-900/40 text-indigo-300 border border-indigo-800">
            {question.marks} درجات
          </span>
          {question.image && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/30 text-purple-300">
              <Image size={12} /> تتضمن صورة
            </span>
          )}
          {duplicateInfo && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-900/30 text-amber-300 border border-amber-700">
              <AlertCircle size={11} /> مكرر
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-2 text-indigo-400 hover:bg-indigo-900/40 rounded-xl transition" title="تعديل السؤال">
          <Edit3 size={16} />
        </button>
        <button onClick={onDelete} className="p-2 text-red-400 hover:bg-red-900/40 rounded-xl transition" title="حذف السؤال">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  </div>
);

// مكون النافذة المنبثقة للتأريخ المزدوج بالتتابع
const ExamDateModal = ({ isOpen, onClose, startAt, closeAt, onSave }) => {
  const [step, setStep] = useState(1);
  const [tempStart, setTempStart] = useState(startAt || "");
  const [tempClose, setTempClose] = useState(closeAt || "");

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setTempStart(startAt || "");
      setTempClose(closeAt || "");
    }
  }, [isOpen, startAt, closeAt]);

  if (!isOpen) return null;

  const durationMins = (() => {
    if (!tempStart || !tempClose) return 0;
    const s = new Date(tempStart).getTime();
    const c = new Date(tempClose).getTime();
    return c > s ? Math.floor((c - s) / 60000) : 0;
  })();

  const formatDateTimeText = (isoStr) => {
    if (!isoStr) return "غير محدد";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + ' - ' + d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  const handleNextStep = () => {
    if (!tempStart) {
      alert("يرجى تحديد موعد وتاريخ البداية أولاً.");
      return;
    }
    setStep(2);
  };

  const handleFinalSave = () => {
    if (!tempClose) {
      alert("يرجى تحديد موعد وتاريخ النهاية.");
      return;
    }
    if (new Date(tempClose) <= new Date(tempStart)) {
      alert("خطأ: موعد إغلاق الامتحان يجب أن يكون بعد موعد البدء.");
      return;
    }
    onSave(tempStart, tempClose);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 max-w-lg w-full overflow-hidden transition-all transform scale-100">
        {/* Header */}
        <div className="bg-linear-to-r from-indigo-600 to-purple-600 p-6 text-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-extrabold flex items-center gap-2">
              <Calendar className="w-6 h-6" /> إعداد مواعيد الامتحان
            </h3>
            <p className="text-xs text-indigo-100 mt-1">الخطوة {step} من 2: {step === 1 ? "اختيار موعد البداية" : "اختيار موعد النهاية"}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800/20 rounded-full transition text-slate-100">
            <X size={20} />
          </button>
        </div>

        {/* Indicator Bar */}
        <div className="flex border-b border-gray-700 bg-gray-800">
          <div className={`flex-1 py-3 text-center font-bold text-xs flex items-center justify-center gap-1.5 border-b-2 transition ${step === 1 ? 'border-indigo-600 bg-gray-800' : 'border-transparent text-gray-400'}`}>
            <span className="w-5 h-5 rounded-full bg-indigo-900/60 text-indigo-300 flex items-center justify-center text-xs">1</span>
            موعد البداية
          </div>
          <div className={`flex-1 py-3 text-center font-bold text-xs flex items-center justify-center gap-1.5 border-b-2 transition ${step === 2 ? 'border-indigo-600 bg-gray-800' : 'border-transparent text-gray-400'}`}>
            <span className="w-5 h-5 rounded-full bg-indigo-900/60 text-indigo-300 flex items-center justify-center text-xs">2</span>
            موعد النهاية
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-indigo-950/40 border border-indigo-800 rounded-2xl text-indigo-200">
                <Calendar className="w-8 h-8 text-indigo-400 flex-shrink-0" />
                <div className="text-xs">
                  <span className="font-bold block text-sm mb-0.5">خطوة 1: تحديد موعد وتاريخ بدء الامتحان</span>
                  حدد اليوم والوقت الساعي الذي سيُتاح فيه الامتحان للطلاب للبدء.
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-200">موعد ووقت البداية:</label>
                <input
                  type="datetime-local"
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                  className="w-full p-3.5 bg-gray-700 border-2 border-indigo-600 rounded-2xl text-slate-100 font-bold text-base focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>

              {tempStart && (
                <div className="p-3 bg-gray-700 rounded-xl text-xs text-gray-300 font-medium">
                  الموعد المحدد: <span className="font-bold text-indigo-400">{formatDateTimeText(tempStart)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-purple-950/40 border border-purple-800 rounded-2xl text-purple-200">
                <Clock className="w-8 h-8 text-purple-400 flex-shrink-0" />
                <div className="text-xs">
                  <span className="font-bold block text-sm mb-0.5">خطوة 2: تحديد موعد وتاريخ إغلاق الامتحان</span>
                  حدد اليوم والوقت الساعي الذي سينتهي فيه الامتحان ويُغلق تلقائياً.
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-200">موعد ووقت الإغلاق:</label>
                <input
                  type="datetime-local"
                  value={tempClose}
                  onChange={(e) => setTempClose(e.target.value)}
                  className="w-full p-3.5 bg-gray-700 border-2 border-purple-600 rounded-2xl text-slate-100 font-bold text-base focus:ring-2 focus:ring-purple-500 outline-none transition"
                />
              </div>

              {durationMins > 0 ? (
                <div className="p-3.5 bg-emerald-950/30 border border-emerald-800 rounded-xl text-emerald-300 text-xs space-y-1">
                  <div className="font-extrabold text-sm flex items-center gap-1.5">
                    <CheckCircle size={16} className="text-emerald-600" />
                    المدة المحسوبة للاختبار: {durationMins} دقيقة
                  </div>
                  <div className="opacity-90 font-semibold">
                    من: {formatDateTimeText(tempStart)}
                  </div>
                  <div className="opacity-90 font-semibold">
                    إلى: {formatDateTimeText(tempClose)}
                  </div>
                </div>
              ) : tempClose && tempStart && new Date(tempClose) <= new Date(tempStart) ? (
                <div className="p-3 bg-red-950/30 border border-red-800 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={16} /> تنبيه: موعد النهاية يجب أن يكون بعد موعد البداية!
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-800 flex items-center justify-between gap-3">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-gray-600 text-gray-300 text-sm font-bold hover:bg-gray-700 transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 rounded-xl bg-linear-to-r hover:from-indigo-700 hover:to-purple-700 text-slate-100 text-sm font-bold shadow-md transition flex items-center gap-1.5"
              >
                التالي: موعد النهاية <ArrowLeft size={16} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl border border-gray-600 text-gray-300 text-sm font-bold hover:bg-gray-700 transition flex items-center gap-1.5"
              >
                <ArrowRight size={16} /> السابق (موعد البداية)
              </button>
              <button
                type="button"
                onClick={handleFinalSave}
                className="px-6 py-2.5 rounded-xl bg-linear-to-r hover:from-emerald-700 hover:to-teal-700 text-slate-100 text-sm font-extrabold shadow-md transition flex items-center gap-1.5"
              >
                <Check size={18} /> حفظ وتأكيد المواعيد
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


// --- المكون الرئيسي ---
const ExamSystem = () => {
  const [exam, setExam] = useState(null);
  const [examId, setExamId] = useState("");
  const [allExams, setAllExams] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [newQuestion, setNewQuestion] = useState({ text: "", type: "multiple", options: ["", "", "", ""], correctAnswer: 0, marks: 2, image: "" });

  // حالات خاصة بالسحب والإفلات وتعيين الدرجة والمواعيد
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [unifiedMarks, setUnifiedMarks] = useState(2);
  const [newDragIdx, setNewDragIdx] = useState(null);
  const [newDragOverIdx, setNewDragOverIdx] = useState(null);

  // [جديد] حالات خاصة بتعيين المجموعة
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [dirValue, setDirValue] = useState("rtl");

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ message: "", type: "idle" });
  const debounceTimeoutRef = useRef(null);

  // حالات لوحة التحكم الموحدة لنتائج الامتحانات
  const [activeTab, setActiveTab] = useState("setup");
  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [resultsSelectedGroup, setResultsSelectedGroup] = useState("all");

  // [جديد] حالات نافذة إضافة الأوائل التلقائية للوحة الشرف
  const [showTopStudentsModal, setShowTopStudentsModal] = useState(false);
  const [topCount, setTopCount] = useState(5);
  const [topTestTitle, setTopTestTitle] = useState("");
  const [topTargetGroup, setTopTargetGroup] = useState("all");
  const [isPublishingTop, setIsPublishingTop] = useState(false);
  const [publishSuccessMessage, setPublishSuccessMessage] = useState("");

  const handleOpenTopStudentsModal = useCallback(() => {
    setTopTestTitle(exam?.title || "اختبار برمجي");
    setTopTargetGroup(resultsSelectedGroup !== "all" ? resultsSelectedGroup : "all");
    setTopCount(5);
    setPublishSuccessMessage("");
    setShowTopStudentsModal(true);
  }, [exam?.title, resultsSelectedGroup]);

  // معاينة حية لقائمة الأوائل بحسب الفلاتر
  const previewTopStudents = useMemo(() => {
    if (!results || results.length === 0) return {};

    const targetGroups =
      topTargetGroup === "all"
        ? [...new Set(results.map((r) => r.group))].filter(Boolean)
        : [topTargetGroup];

    const grouped = {};
    targetGroups.forEach((gName) => {
      let groupResults = results.filter((r) => r.group === gName);
      // ترتيب تنازلي حسب الدرجة ثم الأسبقية في الانتهاء
      groupResults.sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        return (a.finishedAt || 0) - (b.finishedAt || 0);
      });

      let selected = [];
      if (topCount === "full") {
        const maxScore = exam?.totalMarks || (groupResults[0]?.score || 0);
        selected = groupResults.filter((r) => r.score >= maxScore);
        if (selected.length === 0 && groupResults[0]) {
          selected = [groupResults[0]];
        }
      } else if (topCount === "all") {
        selected = groupResults;
      } else {
        selected = groupResults.slice(0, Number(topCount));
      }
      grouped[gName] = selected;
    });

    return grouped;
  }, [results, topTargetGroup, topCount, exam?.totalMarks]);

  // حفظ ونشر الأوائل في فايربيز (topTestStudents)
  const handlePublishTopStudents = async () => {
    const groupKeys = Object.keys(previewTopStudents).filter(
      (k) => previewTopStudents[k]?.length > 0
    );
    if (groupKeys.length === 0) {
      alert("لا يوجد طلاب مؤهلين للإضافة.");
      return;
    }

    setIsPublishingTop(true);
    setPublishSuccessMessage("");
    try {
      // 1. جلب صور الطلاب المحدثة من فايربيز
      const profilePicMap = {};
      try {
        const sSnap = await getDocs(collection(db, "students"));
        sSnap.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const sId = String(data.id || docSnap.id);
          if (data.profilePic) {
            profilePicMap[sId] = data.profilePic;
            profilePicMap[docSnap.id] = data.profilePic;
          }
        });
      } catch (err) {
        console.warn("Avatar fetch fallback:", err);
      }

      // 2. تحديث مستندات topTestStudents لكل مجموعة مع حفظ سجل الاختبارات السابقة
      const finalTitle = topTestTitle.trim() || exam?.title || "اختبار برمجي";
      let publishedCount = 0;
      let groupsCount = 0;

      for (const groupName of groupKeys) {
        const studentsList = previewTopStudents[groupName] || [];
        if (studentsList.length === 0) continue;

        const docRef = doc(db, "topTestStudents", groupName);
        const docSnap = await getDoc(docRef);
        const existingData = docSnap.exists() ? docSnap.data() : {};
        const existingHistory = Array.isArray(existingData.history) ? existingData.history : [];

        const formattedStudents = studentsList.map((s, idx) => {
          const sId = String(s.studentId || s.id || "");
          return {
            id: sId || String(idx + 1),
            name: s.studentName || "طالب",
            degree: Number(s.score || 0),
            studentId: sId,
            profilePic: profilePicMap[sId] || s.profilePic || "/favicon.png",
          };
        });

        // حفظ الاختبار السابق في السجل التاريخي إذا كان موجوداً ومختلفاً
        let updatedHistory = [...existingHistory];
        if (existingData.testTitle && Array.isArray(existingData.students) && existingData.students.length > 0) {
          const isSameTitle = existingData.testTitle === finalTitle;
          const isSameStudents = JSON.stringify(existingData.students) === JSON.stringify(formattedStudents);
          
          if (!isSameTitle || !isSameStudents) {
            const alreadyArchived = updatedHistory.some(
              (h) => h.testTitle === existingData.testTitle && JSON.stringify(h.students) === JSON.stringify(existingData.students)
            );
            if (!alreadyArchived) {
              const prevDate = existingData.updatedAt?.toDate
                ? existingData.updatedAt.toDate().toISOString()
                : new Date().toISOString();

              updatedHistory.unshift({
                id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                testTitle: existingData.testTitle,
                students: existingData.students,
                date: prevDate,
                groupName: groupName,
                examId: existingData.examId || "",
              });
            }
          }
        }

        await setDoc(
          docRef,
          {
            groupName: groupName,
            testTitle: finalTitle,
            examId: examId || "",
            students: formattedStudents,
            history: updatedHistory,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        // تسجيل في مجموعة السجل الدائم topTestStudentsHistory
        try {
          await addDoc(collection(db, "topTestStudentsHistory"), {
            groupName: groupName,
            testTitle: finalTitle,
            examId: examId || "",
            students: formattedStudents,
            createdAt: serverTimestamp(),
          });
        } catch (hErr) {
          console.warn("History log record warning:", hErr);
        }

        publishedCount += formattedStudents.length;
        groupsCount++;
      }

      setPublishSuccessMessage(
        `🎉 تم بنجاح نشر ${publishedCount} طالب في قائمة أوائل الاختبار لـ (${groupsCount}) مجموعة!`
      );
      setTimeout(() => {
        setPublishSuccessMessage("");
        setShowTopStudentsModal(false);
      }, 2500);
    } catch (err) {
      console.error("Error publishing top students:", err);
      alert("حدث خطأ أثناء حفظ الأوائل: " + (err.message || ""));
    } finally {
      setIsPublishingTop(false);
    }
  };

  const totalMarks = useMemo(() => exam?.questions.reduce((sum, q) => sum + (q.marks || 0), 0) || 0, [exam?.questions]);

  const calculatedDuration = useMemo(() => {
    if (!exam?.startAt || !exam?.closeAt) return 0;
    const start = new Date(exam.startAt);
    const close = new Date(exam.closeAt);
    const diffMs = close.getTime() - start.getTime();
    return diffMs > 0 ? Math.floor(diffMs / 60000) : 0;
  }, [exam?.startAt, exam?.closeAt]);

  // الفحص الذكي لاكتشاف الأسئلة المكررة
  const getQuestionDuplicateInfo = useCallback((text, currentQuestionId = null) => {
    const cleanText = text?.trim().toLowerCase();
    if (!cleanText || cleanText.length < 3) return null;
    // فحص في الامتحان الحالي
    if (exam?.questions) {
      const dup = exam.questions.find(q => q.id !== currentQuestionId && q.text?.trim().toLowerCase() === cleanText);
      if (dup) return { type: 'current', examTitle: exam.title || 'هذا الامتحان' };
    }
    // فحص في الامتحانات الأخرى
    for (const otherExam of allExams) {
      if (otherExam.id === examId) continue;
      const dup = (otherExam.questions || []).find(q => q.text?.trim().toLowerCase() === cleanText);
      if (dup) return { type: 'other', examTitle: otherExam.title || otherExam.id };
    }
    return null;
  }, [exam, allExams, examId]);

  const newQuestionDuplicate = useMemo(
    () => getQuestionDuplicateInfo(newQuestion.text),
    [newQuestion.text, exam?.questions, allExams, examId]
  );

  const fetchAllExams = useCallback(async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "exams"));
      const examsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllExams(examsList);
    } catch (error) { console.error("Error fetching exams:", error); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAllExams(); }, [fetchAllExams]);

  useEffect(() => {
    const fetchExamDetails = async () => {
      if (!examId) { setExam(null); setLoading(false); return; }
      setLoading(true);
      try {
        const docRef = doc(db, "exams", examId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setExam({
            ...data,
            id: docSnap.id,
            startAt: data.startAt?.toDate ? data.startAt.toDate().toISOString().slice(0, 16) : data.startAt || "",
            closeAt: data.closeAt?.toDate ? data.closeAt.toDate().toISOString().slice(0, 16) : data.closeAt || "",
          });
        }
      } catch (error) { console.error("Error fetching exam details:", error); }
      finally { setLoading(false); }
    };
    fetchExamDetails();
  }, [examId]);

  const triggerSave = useCallback(async (examToSave, idToSave) => {
    const currentId = idToSave || examId;
    if (!currentId) return;

    setStatus({ message: "جاري الحفظ...", type: "saving" });
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const examRef = doc(db, "exams", currentId);

        let calculatedMinutes = 0;
        if (examToSave.startAt && examToSave.closeAt) {
          const start = new Date(examToSave.startAt);
          const close = new Date(examToSave.closeAt);
          const diffMs = close.getTime() - start.getTime();
          if (diffMs > 0) {
            calculatedMinutes = Math.floor(diffMs / 60000);
          }
        }

        const dataToSave = {
          ...examToSave,
          duration: calculatedMinutes,
          totalMarks: examToSave.questions.reduce((sum, q) => sum + (q.marks || 0), 0),
          startAt: examToSave.startAt ? Timestamp.fromDate(new Date(examToSave.startAt)) : null,
          closeAt: examToSave.closeAt ? Timestamp.fromDate(new Date(examToSave.closeAt)) : null,
        };

        await setDoc(examRef, dataToSave, { merge: true });

        if (isCreating) {
          setIsCreating(false);
          await fetchAllExams();
        }

        setStatus({ message: "تم الحفظ بنجاح!", type: "success" });
      } catch (error) {
        console.error("Autosave error:", error);
        setStatus({ message: "خطأ في الحفظ!", type: "error" });
      } finally {
        setTimeout(() => setStatus(prev => prev.type === 'saving' ? { message: "", type: "idle" } : prev), 2000);
      }
    }, 1500);
  }, [examId, isCreating, fetchAllExams]);

  const handleExamDataChange = (field, value) => {
    setExam(prev => {
      const updatedExam = { ...prev, [field]: value };
      triggerSave(updatedExam);
      return updatedExam;
    });
    if (field === 'title') {
      setAllExams(prevExams => prevExams.map(ex => ex.id === examId ? { ...ex, title: value } : ex));
    }
  };

  const handleNewExam = async () => {
    const newId = `exam_${Date.now()}`;
    const newExamData = { title: "امتحان جديد", duration: 30, questions: [], startAt: "", closeAt: "", status: "draft" };
    setIsCreating(true);
    try {
      const examRef = doc(db, "exams", newId);
      await setDoc(examRef, newExamData);
      await fetchAllExams();
      setExamId(newId);
    } catch (error) { console.error("Error creating new exam:", error); }
    finally { setIsCreating(false); }
  };

  const handleDeleteExam = async () => {
    if (!examId || !window.confirm(`هل أنت متأكد من حذف الامتحان "${exam?.title || examId}"؟`)) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, "exams", examId));
      setExamId("");
      setExam(null);
      await fetchAllExams();
    } catch (err) { console.error("Error deleting exam:", err); }
    finally { setLoading(false); }
  };

  const addQuestion = () => {
    if (!exam || !newQuestion.text.trim()) return;
    if (newQuestionDuplicate) {
      const loc = newQuestionDuplicate.type === 'current'
        ? `نفس هذا الامتحان ("${newQuestionDuplicate.examTitle}")`
        : `امتحان آخر ("${newQuestionDuplicate.examTitle}")`;
      if (!window.confirm(`⚠️ السؤال مكرر! هذا السؤال موجود بالفعل في ${loc}.\n\nهل تريد إضافته على أي حال؟`)) return;
    }
    const questionToAdd = { ...newQuestion, id: Date.now() };
    const updatedQuestions = [...(exam.questions || []), questionToAdd];
    const updatedExam = { ...exam, questions: updatedQuestions };
    setExam(updatedExam);
    triggerSave(updatedExam);
    setNewQuestion({ text: "", type: "multiple", options: ["", "", "", ""], correctAnswer: 0, marks: 2, image: "" });
  };

  const applyUnifiedMarks = () => {
    if (!exam || !exam.questions || exam.questions.length === 0) {
      alert("لا توجد أسئلة لتعديل درجاتها.");
      return;
    }
    const markVal = Math.max(0, parseInt(unifiedMarks) || 0);
    if (!window.confirm(`هل أنت متأكد من تطبيق درجة (${markVal}) على جميع أسئلة الامتحان (${exam.questions.length} سؤال)؟`)) return;

    const updatedQuestions = exam.questions.map(q => ({ ...q, marks: markVal }));
    const updatedExam = { ...exam, questions: updatedQuestions };
    setExam(updatedExam);
    triggerSave(updatedExam);
    setStatus({ message: `تم تعيين ${markVal} درجات لجميع الأسئلة!`, type: "success" });
  };

  const deleteQuestion = (questionId) => {
    if (!exam || !window.confirm("هل أنت متأكد؟")) return;
    const updatedQuestions = exam.questions.filter(q => q.id !== questionId);
    const updatedExam = { ...exam, questions: updatedQuestions };
    setExam(updatedExam);
    triggerSave(updatedExam);
  };

  const saveEditedQuestion = (editedQuestion) => {
    if (!exam) return;
    const updatedQuestions = exam.questions.map(q => q.id === editedQuestion.id ? editedQuestion : q);
    const updatedExam = { ...exam, questions: updatedQuestions };
    setExam(updatedExam);
    triggerSave(updatedExam);
    setEditingQuestionId(null);
  };

  const updateExamStatus = async (newStatus) => {
    if (!examId) return;

    // ✅ إصلاح أمني: منع نشر الامتحان بدون مواعيد أو بدون أسئلة
    if (newStatus === 'published') {
      if (!exam?.startAt || !exam?.closeAt) {
        alert('⚠️ لا يمكن نشر الامتحان!\n\nيجب تحديد \u0645وعد البداية وموعد الإغلاق قبل نشر الامتحان. اضغط على زر "فتح نافذة المواعيد" أولاً.');
        return;
      }
      if (new Date(exam.closeAt) <= new Date(exam.startAt)) {
        alert('⚠️ خطأ في المواعيد!\n\nموعد الإغلاق يجب أن يكون بعد موعد البداية.');
        return;
      }
      if (new Date(exam.closeAt) <= new Date()) {
        alert('⚠️ خطأ في المواعيد!\n\nموعد إغلاق الامتحان في الماضي لا يمكن نشر امتحان قد انتهى وقته.');
        return;
      }
      if (!exam?.questions || exam.questions.length === 0) {
        alert('⚠️ لا يمكن نشر امتحان بدون أسئلة!\n\nيجب إضافة سؤال واحد على الأقل قبل النشر.');
        return;
      }
    }

    const updatedExam = { ...exam, status: newStatus };
    setExam(updatedExam);
    triggerSave(updatedExam);

    // إرسال إشعار تلقائي عند النشر
    if (newStatus === 'published') {
      try {
        // 1) اجلب المجموعات المعيّنة لهذا الامتحان
        const studentsSnap = await getDocs(
          query(collection(db, 'students'), where('currentExamId', '==', examId))
        );
        const assignedGroups = [...new Set(
          studentsSnap.docs.map(d => d.data().group).filter(Boolean)
        )];

        if (assignedGroups.length === 0) return;

        // 2) بنّ نص الإشعار
        const formatDT = (val) => {
          if (!val) return '—';
          const d = val?.toDate ? val.toDate() : new Date(val);
          return d.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'long' })
            + ' — '
            + d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
        };

        const startLabel = formatDT(exam.startAt);
        const closeLabel = formatDT(exam.closeAt);
        const durationText = exam.startAt && exam.closeAt
          ? (() => {
            const ms = new Date(exam.closeAt instanceof Object ? exam.closeAt.toDate?.() : exam.closeAt)
              - new Date(exam.startAt instanceof Object ? exam.startAt.toDate?.() : exam.startAt);
            const mins = Math.floor(ms / 60000);
            return mins > 0 ? `${mins} دقيقة` : '';
          })()
          : '';

        const notifTitle = `📝 اختبار قادم: ${exam.title || 'اختبار جديد'}`;
        const notifMessage = [
          `تم نشر اختبار جديد لمجموعتك.`,
          `📅 يبدأ في: ${startLabel}`,
          `🏁 ينتهي في: ${closeLabel}`,
          durationText ? `⏱ المدة: ${durationText}` : '',
          `\nاستعد جيداً وكن في الوقت المحدد! 💪`,
        ].filter(Boolean).join('\n');

        // 3) أرسل إشعاراً لكل مجموعة
        await Promise.all(
          assignedGroups.map(group =>
            addDoc(collection(db, 'notificationsGroups'), {
              title: notifTitle,
              message: notifMessage,
              group,
              createdAt: serverTimestamp(),
              read: false,
              type: 'exam',
              examId,
            })
          )
        );
      } catch (err) {
        console.error('Error sending exam notification:', err);
      }
    }
  };


  const handleDir = () => {
    if (dirValue == "rtl") {
      setDirValue("ltr")
    } else if (dirValue == "ltr") {
      setDirValue("rtl")
    }
  }

  // --- [جديد] دوال خاصة بتعيين المجموعة ---
  const fetchGroups = async () => {
    try {
      const snapshot = await getDocs(collection(db, "students"));
      const groupSet = new Set(snapshot.docs.map(doc => doc.data().group).filter(Boolean));
      setGroups(Array.from(groupSet));
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  useEffect(() => { fetchGroups(); }, []);

  const assignExamToGroup = async () => {
    if (!selectedGroup || !examId) {
      alert("اختر مجموعة وامتحانًا أولاً.");
      return;
    }
    if (!window.confirm(`هل تريد تعيين الامتحان "${exam.title}" لجميع طلاب مجموعة "${selectedGroup}"؟`)) return;

    setIsAssigning(true);
    try {
      const q = query(collection(db, "students"), where("group", "==", selectedGroup));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        alert("لا يوجد طلاب في هذه المجموعة.");
        setIsAssigning(false);
        return;
      }
      const batch = writeBatch(db);
      snapshot.docs.forEach(docSnap => {
        batch.update(docSnap.ref, { currentExamId: examId });
      });
      await batch.commit();
      alert(`تم تعيين الامتحان بنجاح لمجموعة ${selectedGroup}.`);
    } catch (err) {
      console.error("Error assigning exam:", err);
      alert("حدث خطأ أثناء التعيين.");
    } finally {
      setIsAssigning(false);
    }
  };

  // جلب نتائج الامتحان المختار تلقائياً
  useEffect(() => {
    if (!examId) {
      setResults([]);
      return;
    }
    const fetchResults = async () => {
      setResultsLoading(true);
      setResultsError(null);
      try {
        const resultsQuery = query(
          collection(db, "examResults"),
          where("examId", "==", examId),
          where("finishedAt", "!=", null)
        );
        const querySnapshot = await getDocs(resultsQuery);
        const fetchedResults = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          finishedAt: doc.data().finishedAt
            ? doc.data().finishedAt.toDate()
            : null,
        }));
        setResults(fetchedResults);
      } catch (err) {
        console.error("Error fetching results:", err);
        setResultsError("خطأ في تحميل نتائج الامتحان.");
      } finally {
        setResultsLoading(false);
      }
    };
    fetchResults();
  }, [examId]);

  const resultsGroups = useMemo(() => {
    const uniqueGroups = [...new Set(results.map((r) => r.group))].filter(Boolean);
    return ["all", ...uniqueGroups];
  }, [results]);

  const { sortedResults, stats, feedbackAnalysis } = useMemo(() => {
    const baseData = {
      sortedResults: [],
      stats: { totalStudents: 0, averageScore: 0, highestScore: 0, lowestScore: 0 },
      feedbackAnalysis: { difficultyVotes: { easy: 0, medium: 0, hard: 0 }, notes: [] },
    };

    if (results.length === 0) return baseData;

    let filtered = results.filter((result) => {
      const matchesName = result.studentName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGroup = resultsSelectedGroup === "all" || result.group === resultsSelectedGroup;
      return matchesName && matchesGroup;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return a.finishedAt - b.finishedAt;
    });

    const totalStudents = filtered.length;
    const totalScore = filtered.reduce((sum, r) => sum + r.score, 0);
    const averageScore = totalStudents > 0 ? totalScore / totalStudents : 0;
    const highestScore = filtered.length > 0 ? Math.max(...filtered.map((r) => r.score)) : 0;
    const lowestScore = filtered.length > 0 ? Math.min(...filtered.map((r) => r.score)) : 0;

    const difficultyVotes = { easy: 0, medium: 0, hard: 0 };
    const notes = [];
    filtered.forEach((result) => {
      if (result.feedback) {
        if (result.feedback.difficulty) difficultyVotes[result.feedback.difficulty]++;
        if (result.feedback.notes) notes.push({ studentName: result.studentName, note: result.feedback.notes });
      }
    });

    return {
      sortedResults: sorted,
      stats: { totalStudents, averageScore, highestScore, lowestScore },
      feedbackAnalysis: { difficultyVotes, notes },
    };
  }, [results, searchTerm, resultsSelectedGroup]);

  const difficultyChartData = {
    labels: ["سهل", "متوسط", "صعب"],
    datasets: [
      {
        label: "عدد الطلاب",
        data: [
          feedbackAnalysis.difficultyVotes.easy,
          feedbackAnalysis.difficultyVotes.medium,
          feedbackAnalysis.difficultyVotes.hard,
        ],
        backgroundColor: [
          "rgba(75, 192, 192, 0.8)",
          "rgba(255, 206, 86, 0.8)",
          "rgba(255, 99, 132, 0.8)",
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(255, 99, 132, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  if (loading && !exam) return <div className="text-center p-6"><Loader className="animate-spin mx-auto" /></div>;
  if (isCreating) return <div className="text-center p-6 flex items-center justify-center gap-2"><Loader className="animate-spin" /> <span>جاري إنشاء مسودة امتحان جديد...</span></div>;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 bg-linear-to-br from-gray-900 to-gray-800 min-h-screen" dir={dirValue}>
      {/* رأس اللوحة الإدارية الموحدة */}
      <div className="bg-gray-800 rounded-2xl shadow-xl overflow-hidden mb-8 border border-gray-700">
        <div className="bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-slate-100 animate-fadeIn">
          <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-3">
            <Edit3 className="w-9 h-9" />
            لوحة الامتحانات والنتائج الموحدة
          </h1>
          <p className="mt-2 text-indigo-100 text-sm sm:text-base">إدارة كاملة للامتحانات، تصميم الأسئلة، تعيين المجموعات، ومتابعة النتائج والتحليلات البيانية.</p>
        </div>

        <div className="p-6">
          <ExamSelector
            examId={examId}
            setExamId={setExamId}
            exams={allExams}
            onNew={handleNewExam}
            onDelete={handleDeleteExam}
            onCopy={() => { }}
          />

          {exam && (
            <>
              {/* أزرار التبويبات الموحدة */}
              <div className="flex border-b border-gray-700 mb-6 bg-gray-900/40 rounded-xl p-1.5 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("setup")}
                  className={`flex-1 py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition duration-200 ${activeTab === "setup"
                    ? "bg-linear-to-r from-indigo-600 to-purple-600 text-slate-100 shadow-md"
                    : "text-gray-400 hover:bg-gray-800"
                    }`}
                >
                  <BookOpen className="w-5 h-5" /> إعداد الامتحان والأسئلة
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("results")}
                  className={`flex-1 py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition duration-200 ${activeTab === "results"
                    ? "bg-linear-to-r from-indigo-600 to-purple-600 text-slate-100 shadow-md"
                    : "text-gray-400 hover:bg-gray-800"
                    }`}
                >
                  <Activity className="w-5 h-5" /> نتائج الطلاب والتحليلات
                </button>
              </div>

              {activeTab === "setup" && (
                <div className="space-y-6 animate-fadeIn">
                  {/* قسم البيانات العامة والجدولة */}
                  <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-100 mb-5 flex items-center gap-2 border-b pb-3 border-gray-700">
                      <Settings className="w-5 h-5 text-indigo-400" />
                      إعدادات وجدولة الامتحان
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* العمود الأول: العنوان ولغة الكتابة */}
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="block text-sm font-bold text-gray-300">عنوان الامتحان</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={exam.title}
                              onChange={(e) => handleExamDataChange("title", e.target.value)}
                              className="w-full pl-4 pr-10 py-3 bg-gray-700 border border-gray-600 rounded-xl text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium placeholder:text-gray-400"
                              placeholder="مثال: امتحان أساسيات البرمجة - الفصل الثاني"
                            />
                            <Edit3 className="w-5 h-5 text-gray-400 absolute left-auto right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-sm font-bold text-gray-300">لغة وتوجيه الأسئلة</label>
                          <button
                            type="button"
                            onClick={handleDir}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-600 border border-gray-600 rounded-xl text-slate-100 transition-all font-semibold shadow-sm"
                          >
                            <span>{dirValue === "rtl" ? "العربية (يمين إلى اليسار)" : "English (Left to Right)"}</span>
                            <span className="bg-gray-800 px-3 py-1 rounded-lg border border-gray-600 text-xs shadow-sm">📝 تبديل الاتجاه</span>
                          </button>
                        </div>
                      </div>

                      {/* العمود الثاني: التوقيت عبر النافذة المنبثقة البوب أب */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-gray-300">جدولة مواعيد الامتحان (البداية والنهاية)</label>
                          <button
                            type="button"
                            onClick={() => setIsDateModalOpen(true)}
                            className="w-full p-4 bg-linear-to-r hover:hover:from-indigo-950/40 to-purple-950/40 border-2 border-indigo-800 rounded-2xl transition-all shadow-sm hover:shadow text-right group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-slate-100 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                                <Calendar className="w-6 h-6" />
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-100 text-base">تحديد / تعديل مواعيد البدء والإغلاق</p>
                                <p className="text-xs text-gray-300 mt-0.5">
                                  {exam.startAt && exam.closeAt ? (
                                    <span>
                                      البداية: <strong className="text-indigo-400">{exam.startAt.replace('T', ' ')}</strong> | النهاية: <strong className="text-purple-400">{exam.closeAt.replace('T', ' ')}</strong>
                                    </span>
                                  ) : (
                                    <span className="text-amber-400 font-bold">لم يتم تحديد المواعيد بعد - اضغط هنا لتحديدها عبر البوب أب</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <span className="px-4 py-2 text-slate-100 rounded-xl text-xs font-bold shadow-sm group-hover:bg-indigo-700 transition flex items-center gap-1 self-start sm:self-center">
                              فتح نافذة المواعيد ✨
                            </span>
                          </button>
                        </div>

                        {/* مؤشر حساب المدة التلقائي بشكل احترافي */}
                        <div className="transition-all duration-300">
                          {calculatedDuration > 0 ? (
                            <div className="flex items-center gap-3 p-3 bg-emerald-950/20 border border-emerald-800 rounded-xl text-emerald-300">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                              <div className="text-sm">
                                <span className="font-bold">مدة الاختبار التلقائية: {calculatedDuration} دقيقة</span>
                                <span className="text-xs opacity-90 block">
                                  ({Math.floor(calculatedDuration / 60)} ساعة و {calculatedDuration % 60} دقيقة)
                                </span>
                              </div>
                            </div>
                          ) : exam.startAt && exam.closeAt && new Date(exam.startAt) >= new Date(exam.closeAt) ? (
                            <div className="flex items-center gap-3 p-3 bg-rose-950/20 border border-rose-800 rounded-xl text-rose-300">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0" />
                              <span className="text-sm font-bold">⚠️ خطأ: موعد الإغلاق يجب أن يكون بعد موعد البدء.</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 p-3 bg-amber-950/20 border border-amber-800 rounded-xl text-amber-300">
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-bounce flex-shrink-0" />
                              <span className="text-sm font-semibold">تنبيه: سيتم حساب مدة الامتحان تلقائياً عند تحديد مواعيد البدء والإغلاق.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* إحصائيات سريعة للتحقق */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-linear-to-br from-indigo-500 to-indigo-600 text-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-xs opacity-80 font-medium">إجمالي الدرجات</p>
                        <p className="text-2xl font-black mt-1">{totalMarks} درجة</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-slate-800/20 flex items-center justify-center">
                        <Award className="w-5 h-5 text-slate-100" />
                      </div>
                    </div>

                    <div className="bg-linear-to-br from-emerald-500 to-teal-600 text-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-xs opacity-80 font-medium">الأسئلة المضافة</p>
                        <p className="text-2xl font-black mt-1">{exam.questions?.length || 0} سؤال</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-slate-800/20 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-slate-100" />
                      </div>
                    </div>

                    <div className="bg-linear-to-br from-purple-500 to-pink-600 text-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-xs opacity-80 font-medium">الحالة الحالية</p>
                        <p className="text-xl font-bold mt-1.5">
                          {exam.status === 'published' ? 'منشور للطلاب' : exam.status === 'archived' ? 'مؤرشف' : 'مسودة مؤقتة'}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-slate-800/20 flex items-center justify-center">
                        <PlayCircle className="w-5 h-5 text-slate-100" />
                      </div>
                    </div>
                  </div>

                   {/* شريط إجراءات الحالة */}
                  <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 flex flex-col gap-4">
                    {/* ✅ تحذير ظاهر لو الامتحان بدون مواعيد */}
                    {(!exam.startAt || !exam.closeAt) && (
                      <div className="flex items-start gap-3 p-3 bg-amber-950/30 border border-amber-700 rounded-xl">
                        <span className="text-amber-400 text-lg flex-shrink-0">⚠️</span>
                        <div>
                          <p className="font-bold text-amber-200 text-sm">تنبيه: لم تُحدَّد مواعيد الامتحان</p>
                          <p className="text-xs text-amber-300 mt-0.5">لن يتمكن الطلاب من الدخول إلى الامتحان حتى تُحدِّد موعدَي البداية والإغلاق.</p>
                        </div>
                      </div>
                    )}
                    {(exam.closeAt && new Date(exam.closeAt) <= new Date()) && (
                      <div className="flex items-start gap-3 p-3 bg-rose-950/30 border border-rose-700 rounded-xl">
                        <span className="text-rose-400 text-lg flex-shrink-0">🔴</span>
                        <div>
                          <p className="font-bold text-rose-200 text-sm">تنبيه: موعد إغلاق الامتحان في الماضي</p>
                          <p className="text-xs text-rose-300 mt-0.5">الامتحان انتهى وقته. لن يتمكن أي طالب من دخوله حتى لو كان منشوراً.</p>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-400">حالة النشر:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${exam.status === 'published' ? 'bg-emerald-950 text-emerald-300' :
                        exam.status === 'archived' ? 'bg-rose-950 text-rose-300' :
                          'bg-amber-950 text-amber-300'
                        }`}>
                        {exam.status === 'published' ? 'نشط الآن' : exam.status === 'archived' ? 'مؤرشف ومحجوب' : 'قيد التجهيز'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => updateExamStatus('published')}
                        disabled={!exam.startAt || !exam.closeAt || !exam.questions?.length}
                        title={!exam.startAt || !exam.closeAt ? 'يجب تحديد مواعيد الامتحان أولاً' : !exam.questions?.length ? 'يجب إضافة أسئلة أولاً' : 'نشر الامتحان'}
                        className="px-5 py-2.5 rounded-xl hover:disabled:bg-gray-400 disabled:cursor-not-allowed text-slate-100 text-sm font-bold shadow-sm hover:shadow transition-all flex items-center gap-2"
                      >
                        <PlayCircle className="w-4 h-4" /> نشر الامتحان
                      </button>
                      <button
                        type="button"
                        onClick={() => updateExamStatus('archived')}
                        className="px-5 py-2.5 rounded-xl hover:bg-gray-600 text-gray-200 text-sm font-bold transition-all flex items-center gap-2 border border-gray-600"
                      >
                        <Archive className="w-4 h-4" /> أرشفة الامتحان
                      </button>
                    </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* رسالة ترحيب عند عدم وجود امتحان */}
      {!exam && !loading && (
        <div className="text-center py-16 bg-gray-800 rounded-2xl shadow-lg border border-gray-700">
          <div className="w-20 h-20 mx-auto mb-4 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
            <Edit3 className="w-10 h-10 text-slate-100" />
          </div>
          <h2 className="text-3xl font-bold text-slate-100 mb-2">مرحباً بك!</h2>
          <p className="text-gray-400">اختر امتحانًا من القائمة أو أنشئ واحدًا جديدًا لبدء الإدارة والتحليل.</p>
        </div>
      )}

      {exam && activeTab === "setup" && (
        <>
          {/* قسم تعيين المجموعة */}
          <div className="bg-linear-to-br from-indigo-950/10 to-purple-950/10 p-6 rounded-2xl border border-indigo-900/60 shadow-sm mb-8">
            <h2 className="text-lg font-bold text-indigo-200 flex items-center gap-2 mb-4">
              <Users className="w-5.5 h-5.5 text-indigo-400" />
              الخطوة الأخيرة: تعيين المجموعة المستهدفة
            </h2>
            <p className="text-sm text-gray-400 mb-4">اختر المجموعة الدراسية التي ترغب في توجيه هذا الاختبار إليها مباشرة.</p>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-600 rounded-xl bg-gray-800 text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition appearance-none"
                >
                  <option value="">-- اختر مجموعة الطلاب --</option>
                  {groups.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <div className="absolute left-3 right-auto top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 font-bold">
                  ▾
                </div>
              </div>
              <button
                type="button"
                onClick={assignExamToGroup}
                disabled={!selectedGroup || isAssigning}
                className="bg-linear-to-r hover:hover:disabled:from-gray-300 disabled:to-gray-400 text-slate-100 px-7 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition duration-200 shadow-sm hover:shadow"
              >
                {isAssigning ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" /> جاري التعيين...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4" /> تعيين الامتحان للمجموعة
                  </>
                )}
              </button>
            </div>
          </div>

          {/* إضافة سؤال جديد */}
          <div className="bg-gray-800 rounded-2xl shadow-sm border border-gray-700 p-6 mb-8">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-5">
              <Plus className="w-6 h-6 text-emerald-400" /> إضافة سؤال جديد للاختبار
            </h2>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-300">نص السؤال</label>
                <textarea
                  dir={dirValue}
                  value={newQuestion.text}
                  onChange={(e) => setNewQuestion(p => ({ ...p, text: e.target.value }))}
                  className={`w-full p-4 border rounded-xl bg-gray-700 text-slate-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none font-medium ${
                    newQuestionDuplicate
                      ? 'border-amber-600 ring-1 ring-amber-300'
                      : 'border-gray-600'
                  }`}
                  rows="3"
                  placeholder={dirValue === "rtl" ? "اكتب نص السؤال الإملائي هنا..." : "Type the question content here..."}
                />
                {newQuestionDuplicate && (
                  <div className="flex items-start gap-2.5 p-3 bg-amber-950/40 border border-amber-700 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-extrabold text-amber-200">⚠️ تنبيه: هذا السؤال مكرر!</p>
                      <p className="text-xs text-amber-300 mt-0.5">
                        موجود بالفعل في {newQuestionDuplicate.type === 'current' ? 'نفس هذا الامتحان' : `امتحان آخر: "${newQuestionDuplicate.examTitle}"`}.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* قسم صورة السؤال الجديد */}
              <div className="space-y-2 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <label className="block text-sm font-semibold text-gray-300 flex items-center gap-1.5">
                  <Image size={16} className="text-indigo-400" /> إدراج صورة للسؤال (اختياري)
                </label>

                {newQuestion.image ? (
                  <div className="relative group inline-block">
                    <img src={newQuestion.image} alt="Question preview" className="max-h-48 rounded-xl object-contain border border-gray-600 shadow-sm bg-gray-900" />
                    <button
                      type="button"
                      onClick={() => setNewQuestion(p => ({ ...p, image: "" }))}
                      className="absolute top-2 right-2 hover:bg-red-700 text-slate-100 p-1.5 rounded-full shadow-md transition"
                      title="حذف الصورة"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      id="new-question-image-file"
                      onChange={(e) => {
                        const file = e.target.files && e.target.files[0];
                        if (!file) return;
                        if (file.size > 3 * 1024 * 1024) {
                          alert("حجم الصورة كبير جداً (الحد الأقصى 3 ميجابايت)");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => setNewQuestion(p => ({ ...p, image: reader.result }));
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="new-question-image-file"
                      className="px-4 py-2 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Upload size={14} /> رفع صورة من الجهاز
                    </label>
                    <span className="text-xs text-gray-400">أو إدخال رابط الصورة:</span>
                    <input
                      type="text"
                      value={newQuestion.image || ''}
                      onChange={(e) => setNewQuestion(p => ({ ...p, image: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1 min-w-[200px] px-3.5 py-2 text-xs bg-gray-700 text-slate-100 border border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-300">درجة هذا السؤال</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={newQuestion.marks}
                      onChange={(e) => setNewQuestion(p => ({ ...p, marks: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="w-full pl-4 pr-10 py-2.5 border border-gray-600 rounded-xl bg-gray-700 text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition font-semibold"
                      placeholder="2"
                    />
                    <span className="absolute left-auto right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold pointer-events-none">درجة</span>
                  </div>
                </div>
              </div>

              {newQuestion.type === 'multiple' && (
                <div className="space-y-3.5 p-5 bg-gray-800 rounded-2xl border border-dashed border-gray-600">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-300">خيارات الإجابة:</span>
                    <span className="text-xs text-gray-400">حدد الدائرة الخضراء لتحديد الإجابة الصحيحة | اسحب الخيار لتغيير ترتيبه</span>
                  </div>

                  <div className="space-y-2">
                    {newQuestion.options.map((opt, i) => (
                      <div
                        key={i}
                        draggable
                        onDragStart={(e) => {
                          setNewDragIdx(i);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          if (newDragOverIdx !== i) setNewDragOverIdx(i);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (newDragIdx !== null && newDragIdx !== i) {
                            const { options: newOptions, correctAnswer: newCorrect } = reorderOptions(newQuestion.options, newQuestion.correctAnswer, newDragIdx, i);
                            setNewQuestion(prev => ({ ...prev, options: newOptions, correctAnswer: newCorrect }));
                          }
                          setNewDragIdx(null);
                          setNewDragOverIdx(null);
                        }}
                        onDragEnd={() => {
                          setNewDragIdx(null);
                          setNewDragOverIdx(null);
                        }}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 cursor-move ${newDragIdx === i ? 'opacity-40 border-indigo-400 bg-indigo-900/30' :
                          newDragOverIdx === i ? 'border-indigo-500 ring-2 ring-indigo-400 bg-indigo-900/20' :
                            newQuestion.correctAnswer === i
                              ? 'bg-emerald-950/20 border-emerald-800 shadow-sm'
                              : 'border-gray-700 bg-gray-800'
                          }`}
                      >
                        <div className="hover:text-indigo-600 cursor-grab active:cursor-grabbing p-1 flex-shrink-0" title="اسحب لإعادة الترتيب">
                          <GripVertical size={18} />
                        </div>

                        <input
                          type="radio"
                          name="new-correct"
                          checked={newQuestion.correctAnswer === i}
                          onChange={() => setNewQuestion(p => ({ ...p, correctAnswer: i }))}
                          className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600 flex-shrink-0"
                        />
                        <input
                          type="text"
                          value={opt}
                          dir={dirValue}
                          onChange={(e) => {
                            const newOpts = [...newQuestion.options];
                            newOpts[i] = e.target.value;
                            setNewQuestion(p => ({ ...p, options: newOpts }));
                          }}
                          className="flex-1 bg-transparent border-0 focus:ring-0 p-0 text-slate-100 placeholder-gray-400 font-medium focus:outline-none"
                          placeholder={`${dirValue === "rtl" ? "اكتب خياراً" : "option"} ${i + 1}`}
                        />

                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <button
                            type="button"
                            disabled={i === 0}
                            onClick={() => {
                              const { options: newOptions, correctAnswer: newCorrect } = reorderOptions(newQuestion.options, newQuestion.correctAnswer, i, i - 1);
                              setNewQuestion(prev => ({ ...prev, options: newOptions, correctAnswer: newCorrect }));
                            }}
                            className="p-1 hover:text-indigo-600 hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            title="تحريك لأعلى"
                          >
                            <ChevronUp size={15} />
                          </button>
                          <button
                            type="button"
                            disabled={i === newQuestion.options.length - 1}
                            onClick={() => {
                              const { options: newOptions, correctAnswer: newCorrect } = reorderOptions(newQuestion.options, newQuestion.correctAnswer, i, i + 1);
                              setNewQuestion(prev => ({ ...prev, options: newOptions, correctAnswer: newCorrect }));
                            }}
                            className="p-1 hover:text-indigo-600 hover:bg-gray-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            title="تحريك لأسفل"
                          >
                            <ChevronDown size={15} />
                          </button>
                        </div>

                        {newQuestion.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setNewQuestion(p => ({ ...p, options: p.options.filter((_, idx) => idx !== i) }))}
                            className="hover:text-red-500 p-1.5 rounded-lg hover:bg-gray-800 transition flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setNewQuestion(p => ({ ...p, options: [...p.options, ""] }))}
                    className="text-sm hover:text-indigo-300 font-bold flex items-center gap-1 mt-2.5 transition"
                  >
                    <Plus className="w-4 h-4" /> إضافة خيار جديد للمقترحات
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={addQuestion}
                className="w-full sm:w-auto bg-linear-to-r hover:from-emerald-600 hover:to-green-700 text-slate-100 px-7 py-3 rounded-xl font-extrabold flex items-center justify-center gap-2 transition transform hover:scale-105 shadow-sm hover:shadow"
              >
                <Plus className="w-5 h-5" /> إضافة السؤال إلى بنك الأسئلة
              </button>
            </div>
          </div>

          {/* شريط الدرجة الموحدة لجميع الأسئلة */}
          <div className="bg-linear-to-r from-purple-950/30 to-indigo-950/30 p-4 rounded-2xl border border-purple-800 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-600 text-slate-100 rounded-xl shadow-sm">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-100 text-sm">تطبيق درجة موحدة لكافة أسئلة الامتحان</h4>
                <p className="text-xs text-gray-400">تغيير درجة جميع الأسئلة الحالية دفعة واحدة من مكان واحد.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="number"
                min="0"
                value={unifiedMarks}
                onChange={(e) => setUnifiedMarks(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-24 px-3 py-2 text-center bg-gray-800 border border-purple-600 rounded-xl font-bold text-slate-100 outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
                placeholder="الدرجة"
              />
              <button
                type="button"
                onClick={applyUnifiedMarks}
                disabled={!exam.questions || exam.questions.length === 0}
                className="px-5 py-2 bg-linear-to-r hover:from-purple-700 hover:to-indigo-700 text-slate-100 font-bold text-xs rounded-xl shadow-sm hover:shadow transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                تطبيق على كافة الأسئلة ({exam.questions?.length || 0})
              </button>
            </div>
          </div>

          {/* قائمة الأسئلة */}
          <div className="bg-gray-800 rounded-2xl shadow-sm border border-gray-700 overflow-hidden">
            <div className="p-5 border-b border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-xl font-bold text-slate-100">
                الأسئلة الحالية <span className="text-indigo-600">({exam.questions?.length || 0})</span>
              </h2>
              {status.type !== 'idle' && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${status.type === 'success' ? 'bg-emerald-100 text-emerald-700' :
                  status.type === 'error' ? 'bg-rose-100 text-rose-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                  {status.type === 'saving' && <Loader className="w-4 h-4 animate-spin" />}
                  {status.type === 'success' && <CheckCircle className="w-4 h-4" />}
                  {status.type === 'error' && <X className="w-4 h-4" />}
                  <span>{status.message}</span>
                </div>
              )}
            </div>

            <div className="divide-y divide-gray-700">
              {exam.questions?.length > 0 ? (
                exam.questions.map((question, index) => (
                  <div key={question.id} className="p-5 hover:bg-gray-700/50 transition">
                    {editingQuestionId === question.id ? (
                      <QuestionEditor
                        dirValue={dirValue}
                        question={question}
                        onSave={saveEditedQuestion}
                        onCancel={() => setEditingQuestionId(null)}
                      />
                    ) : (
                      <QuestionDisplay
                        dirValue={dirValue}
                        question={question}
                        index={index}
                        onEdit={() => setEditingQuestionId(question.id)}
                        onDelete={() => deleteQuestion(question.id)}
                      />
                    )}
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-gray-400">
                  <BookOpen className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">لا توجد أسئلة بعد</p>
                  <p className="text-sm mt-1">ابدأ بإضافة سؤال جديد من الأعلى</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {exam && activeTab === "results" && (
        <div className="space-y-8 animate-fadeIn">
          {resultsLoading ? (
            <div className="text-center py-12">
              <Loader className="animate-spin mx-auto text-indigo-600 mb-3" size={40} />
              <p className="text-gray-400">جاري تحميل نتائج الطلاب...</p>
            </div>
          ) : resultsError ? (
            <div className="bg-red-900/20 text-red-400 p-4 rounded-xl border border-red-800">
              {resultsError}
            </div>
          ) : (
            <>
              {/* بطاقات الإحصائيات العامة */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  icon={<Users />}
                  label="عدد الطلاب المكملين"
                  value={stats.totalStudents}
                  colorClass="text-blue-600"
                />
                <StatCard
                  icon={<TrendingUp />}
                  label="متوسط الدرجات"
                  value={stats.averageScore.toFixed(1)}
                  colorClass="text-green-600"
                />
                <StatCard
                  icon={<Star />}
                  label="أعلى درجة"
                  value={stats.highestScore}
                  colorClass="text-yellow-600"
                />
                <StatCard
                  icon={<TrendingDown />}
                  label="أقل درجة"
                  value={stats.lowestScore}
                  colorClass="text-red-600"
                />
              </div>

              {/* لوحة أداء الأسئلة التفصيلية */}
              <details className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-700">
                <summary className="p-5 text-lg font-bold text-gray-100 cursor-pointer hover:bg-gray-700/50 transition flex items-center justify-between">
                  <span>تحليل أداء أسئلة هذا الامتحان 📊</span>
                  <CheckCircle className="text-green-500" size={24} />
                </summary>
                <div className="p-5 border-t border-gray-700 bg-gray-900/20">
                  <QuestionAnalysisDashboard examId={examId} />
                </div>
              </details>

              {/* بانر زر إضافة الأوائل التلقائي للوحة الشرف */}
              {results.length > 0 && (
                <div className="bg-linear-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 border-2 border-amber-500/20 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                  <div className="flex items-center gap-3.5 text-right">
                    <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-100 shadow-lg shadow-amber-500/30 shrink-0">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                        <span>لوحة الشرف وأوائل الاختبار</span>
                        <Sparkles className="w-4 h-4 text-amber-500" />
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-300 mt-0.5">
                        يمكنك إضافة وتحديث الأوائل تلقائياً في قائمة أوائل الاختبارات بضغطة واحدة وبأعلى دقة!
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenTopStudentsModal}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl font-black text-sm text-slate-100 bg-linear-to-r via-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    <Trophy className="w-4 h-4 text-yellow-200" />
                    <span>إضافة الأوائل تلقائياً لقائمة الأوائل 🏆</span>
                  </button>
                </div>
              )}

              {/* البحث والفلترة */}
              {results.length > 0 && (
                <div className="bg-gray-800 p-4 rounded-xl shadow-md border border-gray-700 flex flex-col md:flex-row gap-4 items-center">
                  <div className="relative flex-grow w-full">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="بحث باسم الطالب..."
                      className="w-full pr-10 p-2.5 border border-gray-600 rounded-xl bg-gray-700 text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter className="text-gray-400" size={18} />
                    <select
                      className="p-2.5 border border-gray-600 rounded-xl bg-gray-700 text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none min-w-[150px] flex-grow transition"
                      value={resultsSelectedGroup}
                      onChange={(e) => setResultsSelectedGroup(e.target.value)}
                    >
                      <option value="all">كل المجموعات</option>
                      {resultsGroups.map((group) => (
                        group !== "all" && <option key={group} value={group}>{group}</option>
                      ))}
                    </select>
                  </div>

                  <div className="text-sm text-gray-400 whitespace-nowrap">
                    نتائج البحث: <strong>{sortedResults.length}</strong>
                  </div>
                </div>
              )}

              {/* قائمة ترتيب أداء الطلاب */}
              <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
                <div className="p-5 border-b border-gray-700 bg-gray-800 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-xl font-bold text-slate-100">
                    ترتيب أداء الطلاب المكملين للامتحان
                  </h3>
                  {results.length > 0 && (
                    <button
                      type="button"
                      onClick={handleOpenTopStudentsModal}
                      className="px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 flex items-center gap-2 transition cursor-pointer"
                    >
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span>تصدير للأوائل 🏆</span>
                    </button>
                  )}
                </div>

                {sortedResults.length === 0 ? (
                  <div className="p-10 text-center text-gray-500">
                    <p className="text-lg">لا توجد نتائج مطابقة لفلترة البحث.</p>
                  </div>
                ) : (
                  <div className="w-full">
                    {/* عرض الجدول للشاشات الكبيرة */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700/50">
                          <tr>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">الترتيب</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">اسم الطالب</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">الدرجة</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">النسبة</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">وقت الانتهاء</th>
                          </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                          {sortedResults.map((result, index) => (
                            <tr
                              key={result.id}
                              className="hover:bg-indigo-900/10 transition duration-150 cursor-pointer"
                              onClick={() =>
                                setSelectedStudent({
                                  ...result,
                                  questionsForReview:
                                    result.shuffledQuestionsAndOptions || exam.questions,
                                })
                              }
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <RankBadge rank={index + 1} />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-base font-semibold text-slate-100">{result.studentName}</div>
                                <div className="text-sm text-gray-400">المجموعة: {result.group}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-base font-bold text-indigo-400">{result.score} / {exam?.totalMarks || "N/A"}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-base font-bold text-green-400">
                                  {exam?.totalMarks
                                    ? ((result.score / exam.totalMarks) * 100).toFixed(1) + "%"
                                    : "N/A"}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                {result.finishedAt
                                  ? result.finishedAt.toLocaleString("ar-EG")
                                  : "غير محدد"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* عرض الكروت للهواتف */}
                    <div className="block lg:hidden space-y-4 p-4">
                      {sortedResults.map((result, index) => (
                        <div
                          key={result.id}
                          className="bg-gray-900 rounded-xl shadow-md p-4 border border-gray-700 hover:shadow-lg transition cursor-pointer"
                          onClick={() =>
                            setSelectedStudent({
                              ...result,
                              questionsForReview:
                                result.shuffledQuestionsAndOptions || exam.questions,
                            })
                          }
                        >
                          <div className="flex items-center justify-between mb-3 border-b border-gray-700 pb-2">
                            <RankBadge rank={index + 1} />
                            <span className="text-xs text-gray-400">
                              {result.finishedAt
                                ? result.finishedAt.toLocaleString("ar-EG")
                                : "غير محدد"}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-100">{result.studentName}</h3>
                          <p className="text-sm text-indigo-400 mb-3">المجموعة: {result.group}</p>
                          <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-700 mt-2">
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-400">الدرجة</span>
                              <span className="text-base font-bold text-indigo-400">{result.score} / {exam?.totalMarks || "N/A"}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-xs text-gray-400">النسبة</span>
                              <span className="text-base font-bold text-green-400">
                                {exam?.totalMarks
                                  ? ((result.score / exam.totalMarks) * 100).toFixed(1) + "%"
                                  : "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ملاحظات الطلاب وتقييمات الصعوبة */}
              {results.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                    <h3 className="text-xl font-bold text-slate-100 mb-4 border-b border-gray-700 pb-2">
                      تقييم صعوبة الامتحان من الطلاب
                    </h3>
                    <div className="w-full h-64 flex items-center justify-center">
                      <Bar
                        data={difficultyChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: { stepSize: 1 }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                    <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center border-b border-gray-700 pb-2">
                      <MessageSquare className="ml-2 text-indigo-600 font-bold" /> ملاحظات الطلاب
                    </h3>
                    <div className="max-h-64 overflow-y-auto space-y-4 pr-2">
                      {feedbackAnalysis.notes.length > 0 ? (
                        feedbackAnalysis.notes.map((item, index) => (
                          <div key={index} className="bg-gray-900/40 p-4 rounded-xl border border-gray-700 shadow-sm transition">
                            <p className="font-bold text-gray-250 mb-1">{item.studentName}:</p>
                            <p className="text-gray-300 text-sm italic leading-relaxed">"{item.note}"</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 italic">لا توجد ملاحظات مكتوبة من الطلاب حتى الآن.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {selectedStudent && (
        <StudentAnswersModal
          studentResult={selectedStudent}
          questions={selectedStudent.questionsForReview}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      {/* النافذة المنبثقة التفاعلية لإعداد مواعيد الامتحان (البداية والنهاية) */}
      {exam && (
        <ExamDateModal
          isOpen={isDateModalOpen}
          onClose={() => setIsDateModalOpen(false)}
          startAt={exam.startAt}
          closeAt={exam.closeAt}
          onSave={(newStart, newClose) => {
            setExam(prev => {
              const updated = { ...prev, startAt: newStart, closeAt: newClose };
              triggerSave(updated);
              return updated;
            });
          }}
        />
      )}

      {/* النافذة المنبثقة لإضافة الأوائل تلقائياً لقائمة أوائل الاختبار */}
      {showTopStudentsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          dir="rtl"
        >
          <div className="bg-gray-900 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-800 overflow-hidden">
            {/* رأس النافذة */}
            <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-linear-to-r from-amber-500/10 via-transparent to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-100 flex items-center justify-center shadow-md shadow-amber-500/30">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">
                    إضافة الأوائل لقائمة أوائل الاختبار
                  </h3>
                  <p className="text-xs text-gray-400">
                    تحديث لوحة الشرف لطلاب هذا الاختبار تلقائياً وبأعلى دقة
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTopStudentsModal(false)}
                className="p-2 hover:text-slate-100 rounded-full hover:bg-gray-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* المحتوى */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-right">
              {publishSuccessMessage && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-bold flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span>{publishSuccessMessage}</span>
                </div>
              )}

              {/* عنوان الاختبار */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-300">
                  عنوان الاختبار في لوحة الشرف:
                </label>
                <input
                  type="text"
                  value={topTestTitle}
                  onChange={(e) => setTopTestTitle(e.target.value)}
                  placeholder="مثال: امتحان الشهر الأول"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-700 bg-gray-800 text-slate-100 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                />
              </div>

              {/* عناصر التحكم */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* المجموعة المستهدفة */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-300">
                    المجموعة المستهدفة:
                  </label>
                  <select
                    value={topTargetGroup}
                    onChange={(e) => setTopTargetGroup(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-700 bg-gray-800 text-slate-100 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="all">كل المجموعات (معالجة كل مجموعة على حدة)</option>
                    {resultsGroups.filter(g => g !== "all").map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {/* عدد الأوائل */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-300">
                    معيار اختيار الأوائل:
                  </label>
                  <select
                    value={topCount}
                    onChange={(e) => setTopCount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-700 bg-gray-800 text-slate-100 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                  >
                    <option value={3}>أعلى 3 طلاب 🥉</option>
                    <option value={5}>أعلى 5 طلاب ⭐</option>
                    <option value={10}>أعلى 10 طلاب 🏆</option>
                    <option value="full">الدرجة الكاملة فقط 💯</option>
                    <option value="all">جميع الطلاب المكملين 👥</option>
                  </select>
                </div>
              </div>

              {/* المعاينة الحية للأوائل */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-300">
                  <span>معاينة الطلاب الذين سيتم إضافتهم:</span>
                  <span className="text-amber-400">
                    إجمالي المؤهلين: {Object.values(previewTopStudents).reduce((a, b) => a + b.length, 0)} طالب
                  </span>
                </div>

                <div className="space-y-4 max-h-56 overflow-y-auto pr-1">
                  {Object.keys(previewTopStudents).length === 0 || Object.values(previewTopStudents).every(list => list.length === 0) ? (
                    <div className="p-6 text-center text-xs text-gray-400 bg-gray-800/40 rounded-2xl">
                      لا يوجد طلاب مطابقين للمعايير المحددة.
                    </div>
                  ) : (
                    Object.entries(previewTopStudents).map(([grp, sList]) => (
                      sList.length > 0 && (
                        <div key={grp} className="bg-gray-800/50 p-3.5 rounded-2xl border border-gray-700/60 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold border-b border-gray-700/50 pb-2">
                            <span className="text-indigo-400 flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5" />
                              مجموعة: {grp}
                            </span>
                            <span className="text-gray-400">
                              {sList.length} طالب
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {sList.map((st, idx) => (
                              <div
                                key={st.id || idx}
                                className="flex items-center justify-between p-2 rounded-xl bg-gray-900 border border-gray-800 text-xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                    idx === 0 ? "text-black" : idx === 1 ? "text-black" : idx === 2 ? "text-slate-100" : "bg-gray-700 text-gray-300"
                                  }`}>
                                    {idx + 1}
                                  </span>
                                  <span className="font-semibold text-gray-200 truncate">
                                    {st.studentName}
                                  </span>
                                </div>
                                <span className="font-bold text-amber-400 shrink-0">
                                  {st.score} درجة
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* الأزرار */}
            <div className="p-5 border-t border-gray-800 bg-gray-900 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowTopStudentsModal(false)}
                className="px-4 py-2.5 text-xs font-bold text-gray-400 hover:bg-gray-800 rounded-xl transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handlePublishTopStudents}
                disabled={isPublishingTop || Object.values(previewTopStudents).every(l => l.length === 0)}
                className="px-6 py-2.5 text-xs font-bold text-slate-100 bg-linear-to-r via-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 rounded-xl shadow-lg shadow-amber-500/25 transition flex items-center gap-2 cursor-pointer"
              >
                {isPublishingTop ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>جاري النشر والحفظ...</span>
                  </>
                ) : (
                  <>
                    <Trophy className="w-4 h-4 text-yellow-200" />
                    <span>تأكيد وحفظ في قائمة الأوائل 🚀</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamSystem;
