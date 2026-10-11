import React, { useState, useRef, useEffect } from "react";
import { db } from "@/app/services/firebaseConfig";
import {
  collection, query, where, getDocs,
  doc, updateDoc, deleteField, serverTimestamp,
} from "firebase/firestore";
import {
  Upload, FileArchive, CheckCircle2, AlertCircle,
  X, Clock, Download, Trash2, CloudUpload,
} from "lucide-react";

// ─────────────────────────────────────────────────────────
// ✅ Supabase Storage — مجاني وملفاته Public بدون قيود
// ─────────────────────────────────────────────────────────
const SUPABASE_URL = "https://mgmujpcryjhrwatmdzhw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nbXVqcGNyeWpocndhdG1kemh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NTg3NTYsImV4cCI6MjA5ODEzNDc1Nn0.SMfTlAJPodApF-49pwqy8B9eUpQBOuR41aaiRSuWaYg";
const BUCKET_NAME = "student-zips";

// ─────────────────────────────────────────────────────────

const ZipUploader = ({ studentId, studentDocId }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [existingFile, setExistingFile] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef(null);
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
  // ── جلب الملف المرفوع سابقاً ──
  useEffect(() => {
    const fetchExisting = async () => {
      if (!studentId) return;
      try {
        const q = query(collection(db, "students"), where("id", "==", Number(studentId)));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs[0].data();
          if (data.zipFile) setExistingFile(data.zipFile);
        }
      } catch (err) {
        console.error("خطأ في جلب الملف:", err);
      } finally {
        setLoadingExisting(false);
      }
    };
    fetchExisting();
  }, [studentId]);

  // ── التحقق من الملف ──
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setError(""); setSuccess("");
    if (!selected) return;
    const validExtensions = [".zip", ".rar", ".7z", ".tar", ".gz"];
    const fileExt = selected.name.toLowerCase().slice(selected.name.lastIndexOf("."));
    if (!validExtensions.includes(fileExt)) {
      setError("❌ الملف يجب أن يكون مضغوطاً (.zip, .rar, .7z, .tar, .gz)");
      return;
    }
   if (selected.size > MAX_FILE_SIZE) {
  setError(`❌ حجم الملف يجب ألا يتجاوز ${MAX_FILE_SIZE / 1024 / 1024} ميجابايت`);
  return;
}
    setFile(selected);
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── رفع الملف ──
  const handleUpload = async () => {

  if (file.size > MAX_FILE_SIZE) {
    setError(`❌ الحد الأقصى لحجم الملف هو ${MAX_FILE_SIZE / 1024 / 1024} ميجابايت`);
    return;
  }

  setUploading(true);
  setError("");
  setSuccess("");
  setProgress(0);
    try {
      const q = query(collection(db, "students"), where("id", "==", Number(studentId)));
      const snap = await getDocs(q);
      if (snap.empty) { setError("❌ لم يتم العثور على بيانات الطالب"); setUploading(false); return; }
      const studentDocId = snap.docs[0].id;

      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `student_${studentId}/${Date.now()}_${safeFileName}`;
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filePath}`;

      const publicUrl = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable)
            setProgress(Math.round((event.loaded / event.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status === 200 || xhr.status === 201) {
            resolve(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`);
          } else {
            const errBody = JSON.parse(xhr.responseText || "{}");
            reject(new Error(errBody.error || `HTTP ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error("خطأ في الشبكة"));
        xhr.open("POST", uploadUrl);
        xhr.setRequestHeader("Authorization", `Bearer ${SUPABASE_ANON_KEY}`);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        xhr.setRequestHeader("x-upsert", "true");
        xhr.send(file);
      });

      const studentRef = doc(db, "students", studentDocId);
      const fileInfo = { url: publicUrl, name: file.name, size: file.size, uploadedAt: serverTimestamp(), filePath, provider: "supabase" };
      await updateDoc(studentRef, { zipFile: fileInfo });
      setExistingFile({ ...fileInfo, uploadedAt: { seconds: Date.now() / 1000 } });
      setSuccess("✅ تم رفع الملف بنجاح!");
      setTimeout(() => { setSuccess(""); }, 10000);
      clearFile();
      setProgress(0);
    } catch (err) {
      setError(`❌ ${err.message || "حدث خطأ أثناء الرفع"}`);
    } finally {
      setUploading(false);
    }
  };

  // ── تنزيل الملف ──
  const handleDownload = async (url, fileName) => {
    if (!url) return;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl; a.download = fileName || "file.zip";
      document.body.appendChild(a); a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(blobUrl); }, 100);
    } catch {
      window.open(url, "_blank");
    }
  };

  // ── حذف الملف ──
  const handleDelete = async () => {
    if (!studentId || !existingFile) return;
    setDeleting(true); setError("");
    try {
      if (existingFile.filePath && existingFile.provider === "supabase") {
        await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prefixes: [existingFile.filePath] }),
        }).catch((e) => console.warn("Supabase remove warning:", e));
      }
      const q = query(collection(db, "students"), where("id", "==", Number(studentId)));
      const snap = await getDocs(q);
      if (!snap.empty) {
        await updateDoc(doc(db, "students", snap.docs[0].id), { zipFile: deleteField() });
        setExistingFile(null);
        setSuccess("✅ تم حذف الملف بنجاح!");
        setTimeout(() => { setSuccess(""); }, 6000);
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      setError("❌ حدث خطأ أثناء الحذف.");
    } finally {
      setDeleting(false);
    }
  };

  // ── تنسيق ──
  const formatSize = (b) => {
    if (!b) return "";
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };
  const formatDate = (ts) => {
    if (!ts) return "";
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return d.toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });
  };

  // ─────────────────────────────────────────────────────────
  return (
    <div className="mt-6 rounded-2xl overflow-hidden border border-gray-700 shadow-sm bg-gray-800">

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-linear-to-r from-violet-600 to-indigo-600">
        <div className="w-9 h-9 bg-slate-800/20 rounded-xl flex items-center justify-center shrink-0">
          <FileArchive className="w-5 h-5 text-slate-100" />
        </div>
        <div>
          <h4 className="font-bold text-slate-100 text-sm">رفع تاسك مضغوط</h4>
          <p className="text-violet-200 text-xs">.zip · .rar · .7z · الحد الأقصى {MAX_FILE_SIZE / 1024 / 1024} MB</p>
        </div>
      </div>

      <div className="p-5 space-y-3">

        {/* Loading skeleton */}
        {loadingExisting && <div className="h-16 rounded-xl bg-gray-700 animate-pulse" />}

        {/* ── ملف موجود مسبقاً ── */}
        {!loadingExisting && existingFile && !showDeleteConfirm && (
          <div className="flex flex-wrap justify-between items-center gap-3 p-4 bg-emerald-900/20 border border-emerald-800/40 rounded-xl">
            <div>
              <div className="text-sm flex items-center gap-2 mb-1  font-bold text-slate-100 truncate">
            <div className="w-10 h-10 bg-emerald-900/40 rounded-xl flex items-center justify-center shrink-0">
              <FileArchive className="w-5 h-5 text-emerald-400" />
            </div>
                {existingFile.name || "ملف مرفوع"}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                {existingFile.size && (
                  <span className="bg-gray-700 px-1.5 py-0.5 rounded border border-gray-600 font-medium">
                    {formatSize(existingFile.size)}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formatDate(existingFile.uploadedAt)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleDownload(existingFile.url, existingFile.name)}
                className="flex items-center gap-1.5 px-3 py-2 hover:bg-violet-700 text-slate-100 text-xs font-bold rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> تنزيل
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 hover:text-red-500 hover:rounded-lg border border-gray-600 bg-gray-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── تأكيد الحذف ── */}
        {showDeleteConfirm && (
          <div className="p-2 bg-red-900/20 border border-red-800/40 rounded-xl text-center">
            <div className="w-12 h-12 bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <p className="font-bold text-slate-100 text-sm mb-1">حذف الملف المضغوط؟</p>
            <p className="text-xs text-gray-400 mb-4">لن تتمكن من استرداد الملف بعد الحذف</p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 hover:bg-red-600 disabled:opacity-60 text-slate-100 font-bold rounded-xl text-sm transition-colors"
              >
                {deleting ? "جاري الحذف..." : "نعم، احذف"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)} disabled={deleting}
                className="flex-1 py-2.5 bg-slate-800 text-gray-300 font-bold rounded-xl text-sm border border-gray-600 transition-colors hover:bg-gray-600"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* ── منطقة الرفع (تظهر فقط لو مفيش ملف مرفوع) ── */}
        {!loadingExisting && !existingFile && !showDeleteConfirm && (
          <>
            <input
              ref={fileInputRef} type="file"
              accept=".zip,.rar,.7z,.tar,.gz"
              className="hidden" onChange={handleFileChange} disabled={uploading}
            />

            {/* حالة: لم يُختر ملف بعد */}
            {!file && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full border-2 border-dashed hover:border-violet-500 hover:bg-violet-900/10 rounded-xl py-10 flex flex-col items-center gap-3 transition-all group"
              >
                <div className="w-14 h-14 group-hover:bg-violet-900/30 rounded-2xl flex items-center justify-center transition-colors">
                  <Upload className="w-7 h-7 group-hover:text-violet-500 transition-colors" />
                </div>
                <div>
                  <p className="font-bold text-gray-200 text-sm">اضغط لاختيار الملف</p>
                  <p className="text-xs text-gray-500 mt-0.5">.zip / .rar / .7z / .tar / .gz</p>
                </div>
              </button>
            )}

            {/* حالة: تم اختيار ملف - جاهز للرفع */}
            {file && (
              <div className="border border-violet-800/50 bg-violet-900/10 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-violet-900/40 rounded-xl flex items-center justify-center shrink-0">
                    <FileArchive className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-100 truncate">{file.name}</p>
                    <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
                  </div>
                  <button
                    onClick={clearFile}
                    className="p-1.5 hover:text-red-500 hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* شريط التقدم */}
                {uploading && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                      <span className="flex items-center gap-1">
                        <CloudUpload className="w-3 h-3 animate-pulse" /> جاري الرفع...
                      </span>
                      <span className="font-bold text-violet-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleUpload} disabled={uploading}
                  className="w-full py-2.5 bg-linear-to-r hover:from-violet-700 hover:to-indigo-700 disabled:opacity-60 text-slate-100 font-bold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  {uploading
                    ? <><CloudUpload className="w-4 h-4 animate-pulse" /> جاري الرفع...</>
                    : <><Upload className="w-4 h-4" /> رفع الملف</>
                  }
                </button>
              </div>
            )}
          </>
        )}

        {/* رسائل الحالة */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-800/40 rounded-xl text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-800/40 rounded-xl text-green-400 text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
          </div>
        )}

      </div>
    </div>
  );
};

export default ZipUploader;
