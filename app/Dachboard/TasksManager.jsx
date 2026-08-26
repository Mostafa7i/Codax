"use client";
import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/app/services/firebaseConfig";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import {
  Plus,
  Save,
  X,
  Trash2,
  Edit,
  Clock,
  CheckCircle,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  History,
  Copy,
  Search,
  Tag,
  FileArchive,
  Link as LinkIcon,
} from "lucide-react";

// ====================================================================
// مكون TaskItem
// ====================================================================
export const TaskItem = ({ task, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const formatDate = (dateString) => {
    if (!dateString) return "غير محدد";
    return new Date(dateString).toLocaleString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div
        className="p-5 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4 className="font-bold text-lg text-gray-800 dark:text-white truncate max-w-[70%]">
          {task.title}
        </h4>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 rounded-lg text-blue-700 dark:text-blue-400"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/50 rounded-lg text-red-700 dark:text-red-400"
          >
            <Trash2 size={18} />
          </button>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-gray-200 dark:border-gray-700">
          {task.description && (
            <p className="text-gray-600 dark:text-gray-300 mt-4">
              {task.description}
            </p>
          )}
          {task.webSite && (
            <a
              href={task.webSite}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-purple-600 hover:underline font-medium"
            >
              {task.webSiteTitle || "زيارة الموقع"}
            </a>
          )}
          {task.imageUrl && (
            <img
              src={task.imageUrl}
              alt="صورة المهمة"
              className="mt-4 rounded-xl max-w-full border"
            />
          )}
          {task.warnings && task.warnings.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl border border-yellow-300 dark:border-yellow-800">
              <p className="font-bold text-yellow-800 dark:text-yellow-300 flex items-center gap-2">
                <AlertCircle size={18} /> التنبيهات
              </p>
              <ul className="mt-2 space-y-1 text-yellow-700 dark:text-yellow-300">
                {task.warnings.map((w, i) => (
                  <li key={i}>• {w}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            الموعد النهائي للمهمة: {formatDate(task.deadline)}
          </div>
        </div>
      )}
    </div>
  );
};

// ====================================================================
// مكون النافذة المنبثقة (Modal)
// ====================================================================
export const DeadlineModal = ({
  isOpen,
  onClose,
  onSave,
  groupName,
  isEditingTime,
}) => {
  const [newDeadline, setNewDeadline] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!newDeadline) {
      alert("الرجاء تحديد موعد نهائي.");
      return;
    }
    setIsUpdating(true);
    await onSave(newDeadline);
    setIsUpdating(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[110]"
      dir="rtl"
    >
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4">
        <h3 className="text-2xl font-bold mb-2 text-purple-600">
          {isEditingTime ? "تعديل الموعد النهائي ⏰" : "حدد موعداً للمهمة ⏰"}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {isEditingTime
            ? `أدخل الموعد الجديد لمجموعة "${groupName}".`
            : `يجب تحديد موعد نهائي للمجموعة لحفظ هذه المهمة.`}
        </p>
        <div className="space-y-4">
          <input
            type="datetime-local"
            value={newDeadline}
            onChange={(e) => setNewDeadline(e.target.value)}
            className="w-full px-6 py-4 border-2 rounded-2xl text-lg focus:ring-4 focus:ring-purple-500"
          />
          <button
            onClick={handleSave}
            disabled={isUpdating || !newDeadline}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-2xl font-bold text-xl hover:shadow-xl disabled:opacity-60 transition flex items-center justify-center gap-3"
          >
            {isUpdating ? <Loader2 className="animate-spin" /> : <Save />}
            {isEditingTime ? "تحديث المؤقت" : "حفظ المؤقت والمهمة"}
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-3 rounded-2xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};

// ====================================================================
// مدير المهام (TasksManager)
// ====================================================================
export default function TasksManager({ selectedGroup }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [currentTask, setCurrentTask] = useState({
    title: "",
    description: "",
    webSite: "",
    webSiteTitle: "",
    warnings: [""],
    deadline: "",
    imageUrl: "",
    submissionType: "file", // "file" | "link"
  });
  const [groupDeadline, setGroupDeadline] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  // --- Previous Tasks Reference ---
  const [allPrevTasks, setAllPrevTasks] = useState([]);
  const [showPrevTasks, setShowPrevTasks] = useState(false);
  const [prevTaskSearch, setPrevTaskSearch] = useState("");
  const [selectedPrevGroup, setSelectedPrevGroup] = useState("all");

  useEffect(() => {
    if (!selectedGroup) return;
    const fetchGroupData = async () => {
      const q = query(
        collection(db, "groups"),
        where("name", "==", selectedGroup),
      );
      const snap = await getDocs(q);
      setGroupDeadline(
        snap.empty ? null : snap.docs[0].data().deadline || null,
      );
    };
    fetchGroupData();
  }, [selectedGroup]);

  useEffect(() => {
    if (!selectedGroup) return;
    const fetchTasks = async () => {
      setIsLoading(true);
      const q = query(
        collection(db, "groupTasks"),
        where("groupName", "==", selectedGroup),
      );
      const snap = await getDocs(q);
      setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setIsLoading(false);
    };
    fetchTasks();
  }, [selectedGroup]);

  // Fetch ALL tasks across ALL groups as reference
  useEffect(() => {
    const fetchAllTasks = async () => {
      try {
        const snap = await getDocs(collection(db, "groupTasks"));
        setAllPrevTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("خطأ في جلب التاسكات السابقة:", err);
      }
    };
    fetchAllTasks();
  }, []);

  const prevGroups = useMemo(() => {
    const s = new Set(allPrevTasks.map((t) => t.groupName).filter(Boolean));
    return Array.from(s);
  }, [allPrevTasks]);

  const filteredPrevTasks = useMemo(() => {
    return allPrevTasks.filter((t) => {
      const matchGroup =
        selectedPrevGroup === "all" || t.groupName === selectedPrevGroup;
      const matchSearch =
        !prevTaskSearch ||
        t.title?.toLowerCase().includes(prevTaskSearch.toLowerCase());
      return matchGroup && matchSearch;
    });
  }, [allPrevTasks, selectedPrevGroup, prevTaskSearch]);

  const copyTaskAsTemplate = (task) => {
    setCurrentTask({
      title: task.title || "",
      description: task.description || "",
      webSite: task.webSite || "",
      webSiteTitle: task.webSiteTitle || "",
      warnings: task.warnings?.length ? task.warnings : [""],
      deadline: "",
      imageUrl: task.imageUrl || "",
      submissionType: task.submissionType || "file",
    });
    setIsEditing(false);
    setEditingTaskId(null);
    setImageFile(null);
    setShowPrevTasks(false);
    window.scrollTo(0, 0);
  };

  const timeLeft = useMemo(() => {
    if (!groupDeadline) return "لم يحدد بعد";
    const diff = new Date(groupDeadline) - new Date();
    if (diff <= 0) return "انتهى الوقت";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${days} يوم, ${hours} س, ${minutes} د`;
  }, [groupDeadline]);

  const completeSavingTask = async (taskData, taskId) => {
    setIsSaving(true);
    try {
      let finalImageUrl = taskData.imageUrl || "";
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("upload_preset", "image_photo");
        const res = await fetch(
          "https://api.cloudinary.com/v1_1/dyqs8bid2/image/upload",
          { method: "POST", body: formData },
        );
        if (!res.ok) throw new Error("فشل رفع الصورة");
        const cloudinaryData = await res.json();
        finalImageUrl = cloudinaryData.secure_url;
      }
      const finalTaskData = { ...taskData, imageUrl: finalImageUrl };
      await setDoc(doc(db, "groupTasks", taskId), finalTaskData, {
        merge: true,
      });
      setTasks((prev) =>
        editingTaskId
          ? prev.map((t) =>
              t.id === editingTaskId ? { id: taskId, ...finalTaskData } : t,
            )
          : [...prev, { id: taskId, ...finalTaskData }],
      );
      setCurrentTask({
        title: "",
        description: "",
        webSite: "",
        webSiteTitle: "",
        warnings: [""],
        deadline: "",
        imageUrl: "",
      });
      setImageFile(null);
      setIsEditing(false);
      setEditingTaskId(null);
      alert("تم حفظ المهمة بنجاح!");
    } catch (err) {
      alert("فشل حفظ المهمة: " + err.message);
    } finally {
      setIsSaving(false);
      setIsModalOpen(false);
    }
  };

  const handleUpdateDeadline = async (newDeadline) => {
    const deadlineISO = new Date(newDeadline).toISOString();
    try {
      const q = query(
        collection(db, "groups"),
        where("name", "==", selectedGroup),
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        await setDoc(doc(db, "groups", selectedGroup), {
          name: selectedGroup,
          deadline: deadlineISO,
          createdAt: serverTimestamp(),
        });
      } else {
        await updateDoc(snap.docs[0].ref, { deadline: deadlineISO });
      }
      setGroupDeadline(deadlineISO);
      alert("تم تحديث المؤقت بنجاح!");
      return true;
    } catch (err) {
      alert("فشل تحديث المؤقت: " + err.message);
      return false;
    }
  };

  const handleSaveClick = async () => {
    if (!currentTask.title.trim()) return alert("العنوان مطلوب");
    setIsEditingTime(!!groupDeadline);
    setIsModalOpen(true);
  };

  const handleSaveFromModal = async (newDeadline) => {
    const success = await handleUpdateDeadline(newDeadline);
    if (success) {
      const taskId = editingTaskId || `task_${Date.now()}`;
      const taskData = {
        groupName: selectedGroup,
        title: currentTask.title,
        description: currentTask.description,
        webSite: currentTask.webSite,
        webSiteTitle: currentTask.webSiteTitle,
        warnings: currentTask.warnings.filter((w) => w.trim()),
        deadline: newDeadline,
        imageUrl: currentTask.imageUrl,
        submissionType: currentTask.submissionType || "file",
        updatedAt: serverTimestamp(),
      };
      if (!editingTaskId) taskData.createdAt = serverTimestamp();
      await completeSavingTask(taskData, taskId);
    }
  };

  const editTask = (task) => {
    setCurrentTask({
      ...task,
      warnings: task.warnings?.length ? task.warnings : [""],
      submissionType: task.submissionType || "file",
    });
    setEditingTaskId(task.id);
    setIsEditing(true);
    window.scrollTo(0, 0);
  };

  const deleteTask = async (id) => {
    if (!confirm("هل أنت متأكد من حذف المهمة؟")) return;

    try {
      await deleteDoc(doc(db, "groupTasks", id));

      const updatedTasks = tasks.filter((t) => t.id !== id);
      setTasks(updatedTasks);
      alert("تم حذف المهمة.");

      if (updatedTasks.length === 0) {
        if (
          confirm(
            "لقد حذفت آخر مهمة في المجموعة. هل تريد حذف المؤقت الخاص بالمجموعة أيضاً؟",
          )
        ) {
          const groupQuery = query(
            collection(db, "groups"),
            where("name", "==", selectedGroup),
          );
          const groupSnap = await getDocs(groupQuery);

          if (!groupSnap.empty) {
            const groupDocRef = groupSnap.docs[0].ref;
            await updateDoc(groupDocRef, {
              deadline: null,
            });
            setGroupDeadline(null);
            alert("تم حذف مؤقت المجموعة.");
          }
        }
      }
    } catch (error) {
      console.error("خطأ أثناء حذف المهمة أو المؤقت: ", error);
      alert("حدث خطأ أثناء الحذف.");
    }
  };

  if (!selectedGroup)
    return (
      <p className="text-center text-xl text-gray-500 py-6">
        اختر مجموعة أولاً
      </p>
    );

  return (
    <div dir="rtl" className="space-y-6 text-right">
      <DeadlineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveFromModal}
        groupName={selectedGroup}
        isEditingTime={isEditingTime}
      />

      {/* ===== Previous Tasks Reference Panel ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
        <button
          onClick={() => setShowPrevTasks((p) => !p)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
        >
          <span className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200 text-sm">
            <History size={18} className="text-purple-500" />
            التاسكات السابقة كمرجع
            <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold px-2 py-0.5 rounded-full">
              {allPrevTasks.length}
            </span>
          </span>
          {showPrevTasks ? (
            <ChevronUp size={16} className="text-gray-500" />
          ) : (
            <ChevronDown size={16} className="text-gray-500" />
          )}
        </button>

        {showPrevTasks && (
          <div className="border-t border-gray-100 dark:border-gray-700 p-4 space-y-3">
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-40">
                <Search
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="ابحث باسم التاسك..."
                  value={prevTaskSearch}
                  onChange={(e) => setPrevTaskSearch(e.target.value)}
                  className="w-full pr-8 pl-3 py-2 text-xs border rounded-xl dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-purple-400 focus:outline-none"
                />
              </div>
              <div className="relative">
                <Tag
                  size={13}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <select
                  value={selectedPrevGroup}
                  onChange={(e) => setSelectedPrevGroup(e.target.value)}
                  className="pr-8 pl-3 py-2 text-xs border rounded-xl dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-purple-400 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="all">كل المجموعات</option>
                  {prevGroups.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tasks list */}
            {filteredPrevTasks.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-6">
                لا توجد نتائج
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
                {filteredPrevTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-gray-800 dark:text-white truncate">
                        {task.title}
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                        <span className="bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded-full">
                          {task.groupName}
                        </span>
                      </p>
                      {task.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      {task.warnings?.filter((w) => w).length > 0 && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                          ⚠️ {task.warnings.filter((w) => w).length} تنبيه
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => copyTaskAsTemplate(task)}
                      title="استخدم كقالب"
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition opacity-0 group-hover:opacity-100"
                    >
                      <Copy size={12} />
                      استخدم
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-2xl shadow-md flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Clock className="w-8 h-8 opacity-90" />
          <div>
            <p className="text-xs opacity-80 font-bold">
              الوقت المتبقي للتسليم
            </p>
            <p className="text-base font-bold mt-0.5">{timeLeft}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsEditingTime(true);
            setIsModalOpen(true);
          }}
          className="bg-white/20 hover:bg-white/30 text-white py-2 px-4 rounded-xl font-bold transition text-xs flex items-center gap-1.5"
        >
          <Edit size={14} />
          تعديل المؤقت
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-bold mb-4 text-purple-600 flex items-center gap-2">
          {isEditing ? <Edit size={22} /> : <Plus size={22} />}
          {isEditing ? "تعديل المهمة" : "إضافة مهمة جديدة"}
        </h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="عنوان المهمة"
            value={currentTask.title}
            onChange={(e) =>
              setCurrentTask({ ...currentTask, title: e.target.value })
            }
            className="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
          <textarea
            rows={3}
            placeholder="الوصف"
            value={currentTask.description}
            onChange={(e) =>
              setCurrentTask({ ...currentTask, description: e.target.value })
            }
            className="w-full px-4 py-2.5 border rounded-xl dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="اسم الموقع"
              value={currentTask.webSiteTitle}
              onChange={(e) =>
                setCurrentTask({ ...currentTask, webSiteTitle: e.target.value })
              }
              className="px-4 py-2.5 border rounded-xl dark:bg-gray-900 dark:text-white dark:border-gray-600"
            />
            <input
              type="url"
              placeholder="رابط الموقع"
              value={currentTask.webSite}
              onChange={(e) =>
                setCurrentTask({ ...currentTask, webSite: e.target.value })
              }
              className="px-4 py-2.5 border rounded-xl dark:bg-gray-900 dark:text-white dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block font-bold mb-2 text-sm text-gray-700 dark:text-gray-300">
              طريقة التسليم المسموحة للطلاب (اختر نوع واحد فقط):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
              <button
                type="button"
                onClick={() =>
                  setCurrentTask({ ...currentTask, submissionType: "file" })
                }
                className={`p-3.5 rounded-xl border-2 flex items-center justify-center gap-2.5 font-bold text-xs sm:text-sm transition ${
                  currentTask.submissionType === "file" ||
                  !currentTask.submissionType
                    ? "border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 shadow-xs"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                }`}
              >
                <FileArchive size={18} />
                <span>ملف مضغوط (.zip, .rar فقط)</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setCurrentTask({ ...currentTask, submissionType: "link" })
                }
                className={`p-3.5 rounded-xl border-2 flex items-center justify-center gap-2.5 font-bold text-xs sm:text-sm transition ${
                  currentTask.submissionType === "link"
                    ? "border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 shadow-xs"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                }`}
              >
                <LinkIcon size={18} />
                <span>رابط خارجي (GitHub / Live Link فقط)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold mb-2 text-sm text-gray-700 dark:text-gray-300">
              صورة المهمة
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />
            {imageFile && (
              <p className="mt-1 text-green-600 text-xs font-bold">
                تم اختيار: {imageFile.name}
              </p>
            )}
          </div>

          <div>
            <label className="block font-bold mb-2 text-sm text-gray-700 dark:text-gray-300">
              التنبيهات
            </label>
            {currentTask.warnings.map((w, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={w}
                  placeholder={`تنبيه ${i + 1}`}
                  onChange={(e) => {
                    const nw = [...currentTask.warnings];
                    nw[i] = e.target.value;
                    setCurrentTask({ ...currentTask, warnings: nw });
                  }}
                  className="flex-1 px-4 py-2.5 border rounded-xl dark:bg-gray-900 dark:text-white dark:border-gray-600"
                />
                {currentTask.warnings.length > 1 && (
                  <button
                    onClick={() => {
                      setCurrentTask({
                        ...currentTask,
                        warnings: currentTask.warnings.filter(
                          (_, idx) => idx !== i,
                        ),
                      });
                    }}
                    className="p-3.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() =>
                setCurrentTask({
                  ...currentTask,
                  warnings: [...currentTask.warnings, ""],
                })
              }
              className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1.5 text-xs mt-1"
            >
              <Plus size={14} /> إضافة تنبيه
            </button>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={handleSaveClick}
              disabled={isSaving}
              className="flex-1 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 rounded-xl font-bold hover:shadow-md disabled:opacity-60 transition flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {isEditing ? "حفظ التغييرات" : "إضافة وحفظ المهمة"}
            </button>
            {isEditing && (
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingTaskId(null);
                  setCurrentTask({
                    title: "",
                    description: "",
                    webSite: "",
                    webSiteTitle: "",
                    warnings: [""],
                    deadline: "",
                    imageUrl: "",
                    submissionType: "file",
                  });
                  setImageFile(null);
                }}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl transition flex items-center gap-2"
              >
                <X size={18} /> إلغاء
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-bold flex items-center gap-2 text-green-600">
          <CheckCircle size={20} /> قائمة المهام ({tasks.length})
        </h3>
        {isLoading ? (
          <div className="text-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-10 border border-dashed rounded-xl bg-gray-50/50 dark:bg-gray-800/10">
            لا توجد مهام بعد لهذه المجموعة
          </p>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onEdit={() => editTask(task)}
                onDelete={() => deleteTask(task.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
