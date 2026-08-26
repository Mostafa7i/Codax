"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { db } from "@/app/services/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import {
  CheckCircle,
  Clock,
  ChevronDown,
  ExternalLink,
  AlertCircle,
  Upload,
  Link as LinkIcon,
  Download,
  Trash2,
  CloudUpload,
  FileArchive,
  CheckCircle2,
  X,
  RefreshCw,
  Sparkles,
  BookOpen,
  Gift,
  Star,
  XCircle,
} from "lucide-react";
import { CircularProgressTask } from "@/app/pages/(partsMainPage)/CircularProgress";
import Swal from "sweetalert2";

const SUPABASE_URL = "https://mgmujpcryjhrwatmdzhw.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nbXVqcGNyeWpocndhdG1kemh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NTg3NTYsImV4cCI6MjA5ODEzNDc1Nn0.SMfTlAJPodApF-49pwqy8B9eUpQBOuR41aaiRSuWaYg";
const BUCKET_NAME = "student-zips";
const MAX_FILE_SIZE = 20 * 1024 * 1024;

export default function TaskItem({
  studentId,
  studentDocId,
  task,
  isExpanded,
  onToggle,
}) {
  const taskTitle =
    task?.name ||
    task?.title ||
    task?.taskName ||
    (task?.id !== undefined && task?.id !== null
      ? `المهمة ${task.id}`
      : "مهمة تدريبية");

  const isExam = Boolean(
    task?.isExam ||
    task?.type === "exam" ||
    /^(اختبار|كويز|امتحان|exam|quiz)/i.test(taskTitle.trim())
  );

  const hasSubmittedContent = Boolean(task?.submittedFile || task?.submittedLink);
  const isSubmitted = Boolean(task?.submitted || hasSubmittedContent);

  const rawScore = task?.score;
  const numScore = Number(rawScore);
  const isGraded =
    (rawScore !== null &&
      rawScore !== undefined &&
      rawScore !== "" &&
      !isNaN(numScore) &&
      numScore > 0) ||
    task?.isGraded === true;

  // نوع التسليم المحدد من الأدمن — لا يمكن للطالب تغييره
  const adminSubmissionType =
    task?.submissionType ||
    task?.allowedSubmission ||
    (task?.submittedLink && !task?.submittedFile ? "link" : "file");

  const [submissionType, setSubmissionType] = useState(
    adminSubmissionType === "link" ? "link" : "file"
  );

  useEffect(() => {
    setSubmissionType(adminSubmissionType === "link" ? "link" : "file");
  }, [adminSubmissionType]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [linkInput, setLinkInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusError, setStatusError] = useState("");
  const [statusSuccess, setStatusSuccess] = useState("");
  const [showReplaceForm, setShowReplaceForm] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const fileInputRef = useRef(null);

  const formatSize = (bytes) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (ts) => {
    if (!ts) return "";
    try {
      const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
      return isNaN(d.getTime())
        ? ""
        : d.toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return "";
    }
  };

  const getStudentRef = useCallback(async () => {
    if (studentDocId) return doc(db, "students", studentDocId);
    if (studentId) {
      const numId = Number(studentId);
      const q = query(
        collection(db, "students"),
        where("id", "==", !isNaN(numId) ? numId : studentId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) return snap.docs[0].ref;
    }
    throw new Error("لم يتم العثور على مستند الطالب في قاعدة البيانات");
  }, [studentDocId, studentId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setStatusError("");
    setStatusSuccess("");
    if (!file) return;
    const validExtensions = [".zip", ".rar", ".7z", ".tar", ".gz"];
    const fileExt = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!validExtensions.includes(fileExt)) {
      setStatusError("الملف يجب أن يكون مضغوطاً (.zip, .rar, .7z, .tar, .gz)");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setStatusError(`الحد الأقصى لحجم الملف هو ${MAX_FILE_SIZE / 1024 / 1024} ميجابايت`);
      return;
    }
    setSelectedFile(file);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadFileSubmission = async () => {
    if (!selectedFile) { setStatusError("يرجى اختيار ملف أولاً"); return; }
    setIsUploading(true);
    setStatusError("");
    setStatusSuccess("");
    setUploadProgress(0);
    try {
      const studentRef = await getStudentRef();
      const studentSnap = await getDoc(studentRef);
      if (!studentSnap.exists()) throw new Error("لم يتم العثور على بيانات الطالب");
      const studentData = studentSnap.data();
      const safeFileName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const taskIdClean = task?.id !== undefined ? task.id : "gen";
      const filePath = `student_${studentId || "user"}/task_${taskIdClean}_${Date.now()}_${safeFileName}`;
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filePath}`;

      const publicUrl = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable)
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 201) {
            resolve(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`);
          } else {
            let errMsg = `HTTP ${xhr.status}`;
            try { const body = JSON.parse(xhr.responseText || "{}"); if (body.error) errMsg = body.error; } catch (_) {}
            reject(new Error(errMsg));
          }
        };
        xhr.onerror = () => reject(new Error("حدث خطأ أثناء نقل الملف عبر الشبكة"));
        xhr.open("POST", uploadUrl);
        xhr.setRequestHeader("Authorization", `Bearer ${SUPABASE_ANON_KEY}`);
        xhr.setRequestHeader("Content-Type", selectedFile.type || "application/octet-stream");
        xhr.setRequestHeader("x-upsert", "true");
        xhr.send(selectedFile);
      });

      const fileInfo = { url: publicUrl, name: selectedFile.name, size: selectedFile.size, uploadedAt: new Date().toISOString(), filePath, provider: "supabase" };
      const existingTasks = Array.isArray(studentData.tasks) ? [...studentData.tasks] : [];
      let found = false;
      const updatedTasks = existingTasks.map((t) => {
        const match = (task.id !== undefined && String(t.id) === String(task.id)) || (task.name && t.name === task.name);
        if (match) { found = true; return { ...t, name: t.name || taskTitle, submitted: true, submittedFile: fileInfo, submittedAt: new Date().toISOString() }; }
        return t;
      });
      if (!found) updatedTasks.push({ id: task?.id || Date.now(), name: taskTitle, score: 0, submitted: true, submittedFile: fileInfo, submittedAt: new Date().toISOString() });
      await updateDoc(studentRef, { tasks: updatedTasks });
      setStatusSuccess("✅ تم رفع وتسليم الملف بنجاح!");
      clearSelectedFile();
      setShowReplaceForm(false);
      setUploadProgress(0);
      Swal.fire({ icon: "success", title: "تم التسليم بنجاح", text: `تم رفع ملف المهمة "${taskTitle}" بنجاح!`, timer: 3000, showConfirmButton: false });
    } catch (err) {
      console.error("Upload error:", err);
      setStatusError(err.message || "حدث خطأ أثناء رفع الملف");
    } finally { setIsUploading(false); }
  };

  const handleSubmitLink = async () => {
    const trimmed = linkInput.trim();
    if (!trimmed) { setStatusError("يرجى إدخال الرابط أولاً"); return; }
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      setStatusError("يجب أن يبدأ الرابط بـ http:// أو https://"); return;
    }
    setIsUploading(true);
    setStatusError("");
    setStatusSuccess("");
    try {
      const studentRef = await getStudentRef();
      const studentSnap = await getDoc(studentRef);
      if (!studentSnap.exists()) throw new Error("لم يتم العثور على بيانات الطالب");
      const studentData = studentSnap.data();
      const existingTasks = Array.isArray(studentData.tasks) ? [...studentData.tasks] : [];
      let found = false;
      const updatedTasks = existingTasks.map((t) => {
        const match = (task.id !== undefined && String(t.id) === String(task.id)) || (task.name && t.name === task.name);
        if (match) { found = true; return { ...t, name: t.name || taskTitle, submitted: true, submittedLink: trimmed, submittedAt: new Date().toISOString() }; }
        return t;
      });
      if (!found) updatedTasks.push({ id: task?.id || Date.now(), name: taskTitle, score: 0, submitted: true, submittedLink: trimmed, submittedAt: new Date().toISOString() });
      const currentLinksHistory = Array.isArray(studentData.linksHistory) ? [...studentData.linksHistory] : [];
      currentLinksHistory.push({ title: taskTitle, url: trimmed, uploadedAt: new Date().toISOString() });
      await updateDoc(studentRef, { tasks: updatedTasks, linksHistory: currentLinksHistory });
      setStatusSuccess("✅ تم تسليم الرابط بنجاح!");
      setLinkInput("");
      setShowReplaceForm(false);
      Swal.fire({ icon: "success", title: "تم تسليم الرابط", text: `تم حفظ رابط المهمة "${taskTitle}" بنجاح!`, timer: 3000, showConfirmButton: false });
    } catch (err) {
      console.error("Submit link error:", err);
      setStatusError(err.message || "حدث خطأ أثناء حفظ الرابط");
    } finally { setIsUploading(false); }
  };

  const handleDeleteSubmission = async () => {
    const result = await Swal.fire({
      title: "تأكيد الحذف", text: `هل تريد بالتأكيد حذف تسليم المهمة "${taskTitle}"؟`,
      icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280", confirmButtonText: "نعم، احذف التسليم", cancelButtonText: "إلغاء",
    });
    if (!result.isConfirmed) return;
    setIsDeleting(true);
    setStatusError("");
    setStatusSuccess("");
    try {
      if (task?.submittedFile?.filePath && task?.submittedFile?.provider === "supabase") {
        await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ prefixes: [task.submittedFile.filePath] }),
        }).catch((e) => console.warn("Supabase remove warning:", e));
      }
      const studentRef = await getStudentRef();
      const studentSnap = await getDoc(studentRef);
      if (studentSnap.exists()) {
        const studentData = studentSnap.data();
        const updatedTasks = (studentData.tasks || []).map((t) => {
          const match = (task.id !== undefined && String(t.id) === String(task.id)) || (task.name && t.name === task.name);
          if (match) return { ...t, submitted: false, submittedFile: null, submittedLink: "", submittedAt: null };
          return t;
        });
        await updateDoc(studentRef, { tasks: updatedTasks });
      }
      setStatusSuccess("تم حذف التسليم بنجاح.");
      setShowReplaceForm(false);
      Swal.fire({ icon: "success", title: "تم الحذف", text: "تم حذف تسليم المهمة بنجاح، يمكنك الآن إعادة التسليم.", timer: 2500, showConfirmButton: false });
    } catch (err) {
      console.error("Delete error:", err);
      setStatusError(err.message || "حدث خطأ أثناء حذف التسليم");
    } finally { setIsDeleting(false); }
  };

  const handleDownload = async (url, fileName) => {
    if (!url) return;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName || "task_file.zip";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(blobUrl); }, 100);
    } catch { window.open(url, "_blank"); }
  };

  // نظام المكافأة: >=95 → 5نقاط | 90-94 → 2نقاط | <90 → لا مكافأة
  const getRewardPoints = (score) => {
    const n = Number(score);
    if (isNaN(n)) return 0;
    if (n >= 95) return 5;
    if (n >= 90) return 2;
    return 0;
  };
  const rewardPoints = isGraded ? getRewardPoints(numScore) : 0;
  const alreadyClaimed = Boolean(task?.rewardClaimed);
  const rewardSystemActive = Boolean(task?.rewardEligible);

  const handleClaimReward = async () => {
    if (alreadyClaimed || rewardPoints === 0 || isClaiming) return;
    setIsClaiming(true);
    try {
      const studentRef = await getStudentRef();
      const studentSnap = await getDoc(studentRef);
      if (!studentSnap.exists()) throw new Error("لم يتم العثور على بيانات الطالب");
      const studentData = studentSnap.data();
      const existingTasks = Array.isArray(studentData.tasks) ? [...studentData.tasks] : [];
      const updatedTasks = existingTasks.map((t) => {
        const match = (task.id !== undefined && String(t.id) === String(task.id)) || (task.name && t.name === task.name);
        if (match) return { ...t, rewardClaimed: true, rewardPoints };
        return t;
      });
      await updateDoc(studentRef, { score: increment(rewardPoints), tasks: updatedTasks });
      await Swal.fire({
        icon: "success",
        title: "🎁 تم استلام المكافأة!",
        html: `<p style="font-size:1.1rem;font-weight:700;">تم استلام مكافئة التاسك</p><p style="color:#6b7280;margin-top:8px;">أُضيفت <b style="color:#7c3aed">${rewardPoints} نقطة</b> إلى رصيدك بنجاح 🌟</p>`,
        timer: 3500,
        showConfirmButton: false,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error("Claim reward error:", err);
      Swal.fire({ icon: "error", title: "خطأ", text: err.message || "حدث خطأ أثناء استلام المكافأة" });
    } finally { setIsClaiming(false); }
  };

  return (
    <div className="bg-white dark:bg-gray-800/90 rounded-2xl border border-gray-100 dark:border-gray-700/80 shadow-sm overflow-hidden transition-all duration-200">
      <div onClick={onToggle} className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-900 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition shrink-0 p-1">
            <ChevronDown size={20} className={`transition-transform duration-200 ${isExpanded ? "rotate-180 text-indigo-600 dark:text-indigo-400" : ""}`} />
          </button>
          <div className="min-w-0">
            <h4 className="font-bold text-sm md:text-base text-gray-900 dark:text-white truncate">{taskTitle}</h4>
            {task?.description && <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1 mt-0.5">{task.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 mr-2">
          {isExam ? (
            isGraded ? (
              <div className="flex items-center gap-2"><CircularProgressTask task={task} /></div>
            ) : (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1 border border-slate-200 dark:border-slate-700">
                <BookOpen size={13} className="text-slate-500" /> لم يدخل
              </span>
            )
          ) : isGraded ? (
            <div className="flex items-center gap-2"><CircularProgressTask task={task} /></div>
          ) : isSubmitted || hasSubmittedContent ? (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center gap-1 border border-amber-200/80 dark:border-amber-800/50 shadow-xs">
              <Clock size={13} className="text-amber-500 animate-pulse" /> جاري المراجعة
            </span>
          ) : (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 flex items-center gap-1 border border-rose-200/80 dark:border-rose-800/40">
              <AlertCircle size={13} className="text-rose-500" /> لم يسلم
            </span>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 md:p-5 border-t border-gray-100 dark:border-gray-700/60 bg-slate-50/50 dark:bg-gray-900/40 space-y-4 text-sm" dir="rtl">
          {task?.description && (
            <div className="bg-white dark:bg-gray-800 p-3.5 rounded-xl border border-gray-100 dark:border-gray-700">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">تفاصيل ومطلوب المهمة:</span>
              <p className="text-gray-700 dark:text-gray-300 text-xs md:text-sm leading-relaxed">{task.description}</p>
            </div>
          )}

          {(task?.notes || task?.feedback) && (
            <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-800/60">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 mb-1">
                <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400" />
                ملاحظات المدرب:
              </span>
              <p className="text-xs md:text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium">{task.notes || task.feedback}</p>
            </div>
          )}

          {/* قسم المكافأة — فقط للمهام التي قيّمها الأدمن بعد تفعيل النظام */}
          {isGraded && rewardSystemActive && (
            <div className={`rounded-xl border p-4 ${alreadyClaimed ? "bg-violet-50/60 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800/50" : rewardPoints > 0 ? "bg-linear-to-br from-amber-50 to-yellow-50/60 dark:from-amber-950/30 dark:to-yellow-950/20 border-amber-200 dark:border-amber-800/50" : "bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700"}`}>
              {alreadyClaimed ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={18} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-violet-700 dark:text-violet-300">تم استلام مكافئة التاسك ✅</p>
                    <p className="text-xs text-violet-500 dark:text-violet-400 mt-0.5">أُضيفت {task?.rewardPoints || rewardPoints} نقطة إلى رصيدك</p>
                  </div>
                </div>
              ) : rewardPoints > 0 ? (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                      <Gift size={18} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                        مكافأة متاحة!
                        <span className="flex items-center gap-0.5">
                          {Array.from({ length: rewardPoints > 2 ? 5 : 2 }).map((_, i) => (
                            <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
                          ))}
                        </span>
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                        درجتك {numScore}% تمنحك <span className="font-black">{rewardPoints} نقطة</span> مكافأة 🎁
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClaimReward}
                    disabled={isClaiming}
                    className="shrink-0 flex items-center gap-2 px-4 py-2 bg-linear-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isClaiming ? <RefreshCw size={13} className="animate-spin" /> : <Gift size={13} />}
                    {isClaiming ? "جاري الاستلام..." : "استلام المكافأة"}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                    <XCircle size={18} className="text-gray-400 dark:text-gray-500" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-500 dark:text-gray-400">ليس هناك مكافأة</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">المكافأة تتطلب درجة 90% أو أعلى</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {isExam ? (
            <div className="bg-linear-to-br from-indigo-50/80 to-purple-50/60 dark:from-indigo-950/30 dark:to-purple-950/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs sm:text-sm">
                  <BookOpen size={16} />
                  <span>اختبار إلكتروني رسمي</span>
                </div>
                {isGraded ? (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">تم التقييم بنجاح</span>
                ) : (
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-gray-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">لم يتم الدخول بعد</span>
                )}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                {isGraded ? "تم رصد تقييم هذا الاختبار تلقائياً فور إنهائه عبر منصة الاختبارات." : "هذا اختبار إلكتروني؛ يتم أداؤه ورصد نتيجته تلقائياً عبر تبويب الاختبارات بدون الحاجة لرفع أي ملفات أو روابط."}
              </p>
            </div>
          ) : (
            <>
              {isSubmitted && !showReplaceForm && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        {task.submittedFile ? <FileArchive size={16} /> : <LinkIcon size={16} />}
                      </div>
                      <div>
                        <h5 className="font-bold text-sm text-gray-800 dark:text-white">{task.submittedFile ? "ملف مضغوط مسلّم" : "رابط مشروع مسلّم"}</h5>
                        {task.submittedAt && (
                          <span className="text-[11px] text-gray-400 flex items-center gap-1"><Clock size={11} /> {formatDate(task.submittedAt)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setShowReplaceForm(true)} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-bold transition">
                        <RefreshCw size={12} /> إعادة التسليم
                      </button>
                      <button type="button" onClick={handleDeleteSubmission} disabled={isDeleting} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800/40 transition disabled:opacity-50" title="حذف التسليم">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {task.submittedFile && (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-gray-700 dark:text-gray-300 truncate">{task.submittedFile.name || "archive.zip"}</p>
                        <span className="text-[11px] text-gray-400">{formatSize(task.submittedFile.size)}</span>
                      </div>
                      <button type="button" onClick={() => handleDownload(task.submittedFile.url, task.submittedFile.name)} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm">
                        <Download size={13} /> تحميل الملف
                      </button>
                    </div>
                  )}
                  {task.submittedLink && (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <a href={task.submittedLink} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-indigo-600 dark:text-indigo-400 hover:underline break-all max-w-[80%]" dir="ltr">{task.submittedLink}</a>
                      <a href={task.submittedLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm">
                        <ExternalLink size={13} /> فتح الرابط
                      </a>
                    </div>
                  )}
                  {!isGraded && (
                    <div className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/30 px-3 py-1.5 rounded-lg border border-amber-200/50 dark:border-amber-800/30 flex items-center gap-1.5">
                      <Clock size={12} className="shrink-0" />
                      <span>تم استلام تسليمك بنجاح وهو قيد المراجعة والتقييم من قِبل المدرب.</span>
                    </div>
                  )}
                </div>
              )}

              {(!isSubmitted || showReplaceForm) && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      <Upload size={16} className="text-indigo-600 dark:text-indigo-400" />
                      {isSubmitted ? "إعادة تسليم المهمة" : "تسليم المهمة"}
                    </h5>
                    {adminSubmissionType === "file" ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold border border-indigo-200/80 dark:border-indigo-800/50">
                        <FileArchive size={14} className="text-indigo-600 dark:text-indigo-400" />
                        <span>مطلوب: ملف مضغوط (.zip, .rar)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold border border-purple-200/80 dark:border-purple-800/50">
                        <LinkIcon size={14} className="text-purple-600 dark:text-purple-400" />
                        <span>مطلوب: رابط خارجي (GitHub / Live Link)</span>
                      </div>
                    )}
                  </div>

                  {submissionType === "file" && (
                    <div className="space-y-3">
                      <input ref={fileInputRef} type="file" accept=".zip,.rar,.7z,.tar,.gz" className="hidden" onChange={handleFileChange} disabled={isUploading} />
                      {!selectedFile ? (
                        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 rounded-xl py-6 flex flex-col items-center justify-center gap-2 transition group">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                            <Upload size={20} />
                          </div>
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">اضغط لاختيار ملف مضغوط (.zip, .rar, .7z)</span>
                          <span className="text-[10px] text-gray-400">الحد الأقصى {MAX_FILE_SIZE / 1024 / 1024} ميجابايت</span>
                        </button>
                      ) : (
                        <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 rounded-xl space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileArchive size={20} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{selectedFile.name}</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">{formatSize(selectedFile.size)}</p>
                              </div>
                            </div>
                            <button type="button" onClick={clearSelectedFile} disabled={isUploading} className="p-1 text-gray-400 hover:text-red-500 transition"><X size={16} /></button>
                          </div>
                          {isUploading && (
                            <div>
                              <div className="flex justify-between text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                                <span>جاري الرفع إلى الخادم...</span><span>{uploadProgress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-indigo-600 h-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                              </div>
                            </div>
                          )}
                          <button type="button" onClick={handleUploadFileSubmission} disabled={isUploading} className="w-full py-2 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60">
                            {isUploading ? <><CloudUpload size={14} className="animate-pulse" />جاري الرفع...</> : <><Upload size={14} />تأكيد رفع وتسليم الملف</>}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {submissionType === "link" && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">رابط المشروع أو كود GitHub:</label>
                        <div className="relative">
                          <input type="url" value={linkInput} onChange={(e) => setLinkInput(e.target.value)} placeholder="https://github.com/username/project" dir="ltr" disabled={isUploading} className="w-full px-3 py-2 pl-9 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                          <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                      </div>
                      <button type="button" onClick={handleSubmitLink} disabled={isUploading || !linkInput.trim()} className="w-full py-2 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60">
                        {isUploading ? <><CloudUpload size={14} className="animate-pulse" />جاري الحفظ...</> : <><CheckCircle size={14} />تأكيد تسليم الرابط</>}
                      </button>
                    </div>
                  )}

                  {statusError && (
                    <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle size={14} className="shrink-0" /><span>{statusError}</span>
                    </div>
                  )}
                  {statusSuccess && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                      <CheckCircle2 size={14} className="shrink-0" /><span>{statusSuccess}</span>
                    </div>
                  )}
                  {showReplaceForm && (
                    <button type="button" onClick={() => setShowReplaceForm(false)} className="w-full py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium">
                      إلغاء والاحتفاظ بالتسليم الحالي
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
