'use client';
import React, { useState, useRef } from "react";
import { Camera, Check, X, Loader2, AlertCircle, UploadCloud } from "lucide-react";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { uploadAndUpdateProfilePic } from "@/app/services/fetch";

const defaultAvatar = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236366f1'><circle cx='12' cy='8' r='4'/><path d='M4 20c0-4 3.6-7 8-7s8 3 8 7'/></svg>`;

const UploadProfilePic = ({ studentId, currentProfilePic, onUploadSuccess }) => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const processFile = (file) => {
    if (!file) return;

    if (!file.type.match("image.*")) {
      setError("الملف المحدد ليس صورة صالحة");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setError("حجم الصورة يجب أن يكون أقل من 3 ميجابايت");
      return;
    }

    setError(null);
    setImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e) => {
    processFile(e.target.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!uploading) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (uploading) return;
    processFile(e.dataTransfer.files[0]);
  };

  const triggerFileInput = () => {
    if (!uploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleCancel = () => {
    setImage(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!image) {
      setError("يجب اختيار صورة أولاً");
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // كل منطق الرفع والتحديث بقى في الدالة المنفصلة
      const imageUrl = await uploadAndUpdateProfilePic(studentId, image);

      if (typeof onUploadSuccess === "function") {
        onUploadSuccess(imageUrl);
      }

      setImage(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await Swal.fire({
        icon: "success",
        title: "تم تحديث الصورة الشخصية!",
        text: "تم حفظ الصورة الجديدة بنجاح في ملفك الشخصي.",
        timer: 2000,
        showConfirmButton: false,
        background: "rgba(15, 23, 42, 0.95)",
        color: "#fff",
      });

      // تحديث الصفحة عشان الهيدر يتحدث
      window.location.reload();
    } catch (err) {
      console.error("حدث خطأ أثناء الرفع:", err);
      setError(err.message || "حدث خطأ غير متوقع أثناء الرفع");

      Swal.fire({
        icon: "error",
        title: "فشل تحديث الصورة",
        text: err.message || "حدث خطأ غير متوقع أثناء رفع الصورة.",
        background: "rgba(15, 23, 42, 0.95)",
        color: "#fff",
      });
    } finally {
      setUploading(false);
    }
  };

  const hasPhoto =
    currentProfilePic &&
    currentProfilePic !== "/assets/person.webp" &&
    currentProfilePic !== "/assets/personremovebg-preview.png" &&
    currentProfilePic !== defaultAvatar;

  const activeProfilePic = preview || currentProfilePic || defaultAvatar;

  return (
    <div className="w-full flex flex-col items-center space-y-4">
      {/* Title */}
      {!hasPhoto && (
        <h4 className="font-bold text-gray-700 dark:text-gray-300 text-sm tracking-wide">
          تحديث صورة الحساب
        </h4>
      )}

      {/* Avatar */}
      <div
        onClick={triggerFileInput}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative w-28 h-28 rounded-full cursor-pointer select-none group transition-all duration-500 ease-out ${
          isDragging
            ? "scale-105 ring-4 ring-indigo-500 ring-offset-4 dark:ring-offset-gray-900 border-dashed"
            : "ring-2 ring-indigo-500/30 dark:ring-indigo-400/20 hover:ring-indigo-500 dark:hover:ring-indigo-400 hover:shadow-lg hover:shadow-indigo-500/10 hover:scale-[1.02]"
        }`}
      >
        <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 dark:bg-gray-900 border-2 border-white dark:border-gray-800">
          <img
            src={activeProfilePic}
            alt="Profile Avatar"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              e.target.src = defaultAvatar;
            }}
          />
        </div>

        {!uploading && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-all duration-300 ease-out">
            <Camera
              size={22}
              className="text-white/90 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300"
            />
            <span className="text-[10px] text-white/90 font-bold mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              تغيير الصورة
            </span>
          </div>
        )}

        {isDragging && (
          <div className="absolute inset-0 bg-indigo-600/70 backdrop-blur-[2px] rounded-full flex flex-col items-center justify-center text-white animate-pulse">
            <UploadCloud size={28} className="text-white" />
            <span className="text-[9px] font-bold mt-1">أفلت الصورة هنا</span>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-[1px] rounded-full flex flex-col items-center justify-center text-white">
            <Loader2 size={24} className="text-indigo-400 animate-spin" />
            <span className="text-[10px] font-bold mt-1.5 text-indigo-200 animate-pulse">
              جاري الرفع...
            </span>
          </div>
        )}

        {preview && !uploading && (
          <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow-md animate-bounce ring-2 ring-white dark:ring-gray-800">
            <Check size={12} strokeWidth={3} />
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg, image/png"
        onChange={handleImageChange}
        className="hidden"
        disabled={uploading}
      />

      {/* Hints */}
      <div className="text-center">
        {!preview ? (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
            اسحب صورتك وأفلتها هنا أو انقر للتصفح
          </p>
        ) : (
          <p className="text-[11px] text-emerald-500 dark:text-emerald-400 font-bold animate-pulse">
            تم اختيار صورة جديدة! اضغط حفظ للتأكيد
          </p>
        )}
        <p className="text-[9px] text-gray-400 dark:text-gray-600 mt-0.5">
          مسموح بصيغ JPG, PNG حتى 3 ميجابايت
        </p>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 justify-center"
          >
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <AnimatePresence>
        {preview && !uploading && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: 10 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: 10 }}
            className="flex items-center gap-2 w-full pt-1 overflow-hidden"
          >
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-linear-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-indigo-500/25 active:scale-95 transition-all duration-200"
            >
              <Check size={14} />
              <span>حفظ الصورة</span>
            </button>
            <button
              onClick={handleCancel}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 border border-gray-200 dark:border-gray-700 hover:border-red-500 dark:hover:border-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/15 text-gray-500 dark:text-gray-400 rounded-xl text-xs font-bold active:scale-95 transition-all duration-200"
            >
              <X size={14} />
              <span>إلغاء</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(UploadProfilePic);