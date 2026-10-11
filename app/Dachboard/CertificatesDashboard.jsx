"use client";
import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/app/services/firebaseConfig";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import Swal from "sweetalert2";
import {
  Award,
  Search,
  Download,
  CheckCircle,
  Loader2,
  AlertCircle,
  ChevronDown,
  Users,
  ToggleLeft,
  ToggleRight,
  Eye,
  Layers,
  Sparkles,
  ExternalLink,

  RotateCcw,
} from "lucide-react";
import { useLatestLecture } from "@/app/context/LatestLectureContext";

const SITE_BASE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : "https://codax-dev.web.app";
const codaxLogo = "/favicon.png";

const padId = (id) => String(id || 0).padStart(5, "0");

const isFullStackStudent = (student) => {
  const sub = (student?.subscriptionType || "").toLowerCase();
  const course = (student?.certCourse || "").toLowerCase();
  const group = (student?.group || "").toLowerCase();
  return (
    student?.certMode === "fullstack" ||
    student?.isFullStack === true ||
    sub.includes("full") ||
    course.includes("full") ||
    group.includes("full")
  );
};

const buildCertificateId = (student) => {
  const sub = (student?.subscriptionType || "").toLowerCase();
  const certCourse = (student?.certCourse || "").toLowerCase();
  const group = (student?.group || "").toLowerCase();
  const isFull = isFullStackStudent(student);
  const isBack =
    sub.includes("back") || certCourse.includes("back") || group.includes("back");
  const prefix = isFull ? "FS" : isBack ? "BE" : "FE";
  return `CODAX-${prefix}-${new Date().getFullYear()}-${padId(student?.id || 0)}`;
};

const buildIssueDate = () => {
  const d = new Date();
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getCertCourseName = (student, groupLectures = 0) => {
  if (isFullStackStudent(student)) {
    return student?.certCourse || "Full-Stack Web Development";
  }
  if (student?.certCourse) {
    if (student.certCourse === "Front-End" || student.certCourse.toLowerCase() === "frontend")
      return "Front-End Development";
    if (student.certCourse === "Back-End" || student.certCourse.toLowerCase() === "backend")
      return "Back-End Development";
    if (
      student.certCourse === "Full-Stack" ||
      student.certCourse === "Full Stack" ||
      student.certCourse.toLowerCase() === "fullstack"
    )
      return "Full-Stack Web Development";
    return student.certCourse;
  }

  const sub = (student?.subscriptionType || "").toLowerCase();
  const group = (student?.group || "").toLowerCase();

  if (sub.includes("front") || group.includes("front")) {
    return "Front-End Development";
  }
  if (sub.includes("back") || group.includes("back")) {
    return "Back-End Development";
  }

  return groupLectures >= 25 ? "Front-End Development" : "Back-End Development";
};

const getCertAttendedLectures = (student) => {
  if (
    student?.certAttendedLectures !== undefined &&
    student?.certAttendedLectures !== null &&
    student?.certAttendedLectures !== ""
  ) {
    return Number(student.certAttendedLectures);
  }
  return typeof student?.attendedLectures === "number"
    ? student.attendedLectures
    : 0;
};

const getCertGroupLectures = (student, groupLectures = 0) => {
  if (
    student?.certGroupLectures !== undefined &&
    student?.certGroupLectures !== null &&
    student?.certGroupLectures !== ""
  ) {
    return Number(student.certGroupLectures);
  }
  return groupLectures;
};

const getCertDuration = (student, groupLectures = 0) => {
  if (student?.certDuration) {
    return student.certDuration;
  }
  if (isFullStackStudent(student)) {
    return "60+ Hours";
  }

  const sub = (student?.subscriptionType || "").toLowerCase();
  const group = (student?.group || "").toLowerCase();
  const course = (student?.certCourse || "").toLowerCase();

  if (sub.includes("front") || group.includes("front") || course.includes("front")) {
    return groupLectures >= 25 ? "60 Hours" : "30 Hours";
  }
  if (sub.includes("back") || group.includes("back") || course.includes("back")) {
    return groupLectures <= 25 ? "30 Hours" : "60 Hours";
  }

  return groupLectures >= 25 ? "60 Hours" : "30 Hours";
};

const getStudentCertName = (s) =>
  s?.certificate?.trim() ||
  s?.englishName?.trim() ||
  s?.nameEn?.trim() ||
  "";

const buildCertificateData = (student, groupLectures = 0) => {
  const gLec = getCertGroupLectures(student, groupLectures);
  const certName = getStudentCertName(student);
  const isFull = isFullStackStudent(student);

  return {
    certificateId: buildCertificateId(student),
    studentName: certName || student.name || "N/A",
    course: getCertCourseName(student, gLec),
    attendedLectures: getCertAttendedLectures(student),
    groupLectures: gLec,
    duration: getCertDuration(student, gLec),
    assessment: "Successfully Passed with Excellence",
    capstoneProject: isFull
      ? "Full-Stack Capstone Project Completed"
      : "Completed",
    issueDate: buildIssueDate(),
    status: "valid",
    isFullStack: isFull,
  };
};

// ─── QR Preview (SVG – for display) ─────────────────────────────────────────
const CodaxQR = ({ value, size = 160 }) => {
  const logoSize = size * 0.27;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <QRCodeSVG
        value={value}
        size={size}
        level="H"
        bgColor="#ffffff"
        fgColor="#0f172a"
        style={{ borderRadius: 8 }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: logoSize,
          height: logoSize,
          borderRadius: "50%",
          overflow: "hidden",
          border: "3px solid #fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
          background: "#fff",
        }}
      >
        <img
          src={codaxLogo}
          alt="CodaX"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    </div>
  );
};

// ─── Hidden Canvas QR (for download) ────────────────────────────────────────
const HiddenCanvasQR = ({ id, value, size = 400 }) => (
  <div
    style={{
      position: "absolute",
      left: -9999,
      top: -9999,
      opacity: 0,
      pointerEvents: "none",
    }}
  >
    <QRCodeCanvas
      id={id}
      value={value}
      size={size}
      level="H"
      bgColor="#ffffff"
      fgColor="#0f172a"
    />
  </div>
);

// ─── Download QR helper ──────────────────────────────────────────────────────
const downloadQRWithLogo = (canvasId, logoSrc, filename) => {
  const qrCanvas = document.getElementById(canvasId);
  if (!qrCanvas) return;

  const size = qrCanvas.width;
  const offscreen = document.createElement("canvas");
  offscreen.width = size;
  offscreen.height = size;
  const ctx = offscreen.getContext("2d");

  // Draw QR
  ctx.drawImage(qrCanvas, 0, 0);

  // Draw logo in center
  const logoSize = size * 0.27;
  const x = (size - logoSize) / 2;
  const y = (size - logoSize) / 2;

  const logoImg = new Image();
  logoImg.crossOrigin = "anonymous";
  logoImg.onload = () => {
    // Draw white circle background
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, logoSize / 2 + 4, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Clip circular logo
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logoImg, x, y, logoSize, logoSize);
    ctx.restore();

    // Download PNG
    const link = document.createElement("a");
    link.download = `${filename}.png`;
    link.href = offscreen.toDataURL("image/png");
    link.click();
  };
  logoImg.src = logoSrc;
};

// ─── Certificate Card ────────────────────────────────────────────────────────
const CertificateCard = ({ student, groupLecturesMap, onToggleFullStack }) => {
  const groupLectures =
    student.totalGroupLectures ||
    groupLecturesMap?.[student.group]?.count ||
    0;
  const certData = buildCertificateData(student, groupLectures);
  const verifyUrl = `${SITE_BASE_URL}/certificate?id=${certData.certificateId}`;
  const certStudentName = getStudentCertName(student);
  const isEligible = certStudentName.length >= 2;
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const canvasId = `cert-canvas-${student.docId || student.id}`;

  const isFull = isFullStackStudent(student);

  // ── Manual Fields Update Handler (Syncs all linked docs) ─────────────────
  const handleUpdateCertField = async (field, value) => {
    setSaving(true);
    try {
      const docIdsToUpdate = student.linkedDocIds || [student.docId];
      await Promise.all(
        docIdsToUpdate.map((dId) =>
          updateDoc(doc(db, "students", dId), { [field]: value })
        )
      );
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
      Swal.fire("خطأ", "حدث خطأ أثناء الحفظ", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle Full-Stack Mode ────────────────────────────────────────────────
  const handleModeToggle = async () => {
    const newMode = isFull ? "separate" : "fullstack";
    const newCourse =
      newMode === "fullstack"
        ? "Full-Stack Web Development"
        : student.groupLectures > 25
        ? "Back-End Development"
        : "Front-End Development";

    setSaving(true);
    try {
      const docIdsToUpdate = student.linkedDocIds || [student.docId];
      await Promise.all(
        docIdsToUpdate.map((dId) =>
          updateDoc(doc(db, "students", dId), {
            certMode: newMode,
            isFullStack: newMode === "fullstack",
            certCourse: newCourse,
            certDuration: newMode === "fullstack" ? "60+ Hours" : "30 Hours",
          })
        )
      );
      Swal.fire({
        icon: "success",
        title:
          newMode === "fullstack"
            ? "تم التحويل لشهادة موحدة Full-Stack! 🌟"
            : "تم التحويل لشهادات مسارات منفصلة 📄",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error toggling Full-Stack mode:", err);
      Swal.fire("خطأ", "فشل تحديث وضع الشهادة", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle Valid / Pending ────────────────────────────────────────────────
  const handleToggleValid = async () => {
    const docIdsToUpdate = student.linkedDocIds || [student.docId];

    if (isEligible) {
      // Revoke
      const result = await Swal.fire({
        title: "إلغاء الشهادة؟",
        text: "هل تريد إلغاء تفعيل الشهادة لهذا الطالب؟",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "نعم، إلغاء",
        cancelButtonText: "لا",
        confirmButtonColor: "#ef4444",
      });
      if (!result.isConfirmed) return;
      setSaving(true);
      try {
        await Promise.all(
          docIdsToUpdate.map((dId) =>
            updateDoc(doc(db, "students", dId), { certificate: "" })
          )
        );
      } catch (e) {
        Swal.fire("خطأ", "حدث خطأ أثناء الحفظ", "error");
      } finally {
        setSaving(false);
      }
    } else {
      // Activate — ask for English name
      const { value: certName } = await Swal.fire({
        title: isFull ? "تفعيل الشهادة الموحدة (Full-Stack)" : "تفعيل الشهادة",
        html: `
          <p style="margin-bottom:10px;font-size:14px;color:#555">اكتب اسم الطالب بالإنجليزية كما سيظهر في الشهادة المعتمدة</p>
          <input id="certName" class="swal2-input" placeholder="e.g. Ahmed Mohamed Ali"
            value="${student.certificate || student.englishName || student.name || ""}"
            style="direction:ltr;font-family:monospace"
          />
        `,
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "تفعيل ✅",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#10b981",
        preConfirm: () => {
          const val = document.getElementById("certName")?.value.trim();
          if (!val || val.length < 3) {
            Swal.showValidationMessage("الاسم يجب أن يكون على الأقل 3 حروف");
            return false;
          }
          return val;
        },
      });
      if (!certName) return;
      setSaving(true);
      try {
        await Promise.all(
          docIdsToUpdate.map((dId) =>
            updateDoc(doc(db, "students", dId), { certificate: certName })
          )
        );
        Swal.fire({
          icon: "success",
          title: "تم التفعيل! 🎉",
          text: `تم تفعيل شهادة ${student.name}`,
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (e) {
        Swal.fire("خطأ", "حدث خطأ أثناء الحفظ", "error");
      } finally {
        setSaving(false);
      }
    }
  };

  // ── Reset Views Count ───────────────────────────────────────────────────
  const handleResetViews = async () => {
    const result = await Swal.fire({
      title: "تصفير عداد الزيارات؟",
      text: `هل أنت متأكد من تصفير عدد الزيارات لشهادة الطالب (${student.name})؟`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "نعم، تصفير 🔄",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#8b5cf6",
    });
    if (!result.isConfirmed) return;

    setSaving(true);
    try {
      const docIdsToUpdate = student.linkedDocIds || [student.docId];
      await Promise.all(
        docIdsToUpdate.map((dId) =>
          updateDoc(doc(db, "students", dId), { viewsCount: 0 })
        )
      );
      Swal.fire({
        icon: "success",
        title: "تم تصفير عدد الزيارات بنجاح! 🔄",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error resetting views count:", err);
      Swal.fire("خطأ", "فشل تصفير عداد الزيارات", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Download QR ───────────────────────────────────────────────────────────
  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      downloadQRWithLogo(canvasId, codaxLogo, `QR-${certData.certificateId}`);
      setDownloading(false);
    }, 100);
  };

  return (
    <div
      className={`relative bg-white dark:bg-gray-900 rounded-3xl shadow-lg border-2 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
        isFull
          ? "border-purple-400 dark:border-purple-500 shadow-purple-500/10"
          : isEligible
          ? "border-green-400 dark:border-green-500"
          : "border-gray-200 dark:border-gray-700"
      }`}
    >
      {/* Hidden canvas for PNG export */}
      <HiddenCanvasQR id={canvasId} value={verifyUrl} size={500} />

      {/* Top gradient bar */}
      <div
        className={`h-2 w-full ${
          isFull
            ? "bg-linear-to-r from-amber-400 via-purple-500 to-indigo-500"
            : isEligible
            ? "bg-linear-to-r from-green-400 via-emerald-500 to-teal-500"
            : "bg-linear-to-r from-gray-300 to-gray-400"
        }`}
      />

      <div className="p-5 space-y-4">
        {/* Header: Name, Status & Full-Stack Switch */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white truncate">
                {student.name}
              </h3>

              {isFull && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-linear-to-r from-purple-500 to-indigo-600 text-white shadow-sm">
                  <Sparkles size={11} />
                  Full-Stack 🌟
                </span>
              )}

              {student.isMultiTrack && !isFull && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                  <Layers size={10} />
                  مسجل (فرونت + باك)
                </span>
              )}
            </div>

            {/* English Name in Cert */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium">الاسم بالشهادة:</span>
              <span
                className={`font-bold font-mono ${
                  certStudentName
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-amber-500"
                }`}
              >
                {certStudentName || "لم يُحدد بعد (غير مفعّلة)"}
              </span>
            </div>

            {/* Enrolled groups */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {student.enrolledGroups ? (
                student.enrolledGroups.map((g, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    مجموعة: {g}
                  </span>
                ))
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  مجموعة: {student.group || "N/A"}
                </span>
              )}
              <span className="text-gray-400 text-xs font-mono">
                ID: {student.id}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="shrink-0 flex flex-col items-end gap-1">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                isEligible
                  ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700"
                  : "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
              }`}
            >
              {isEligible ? (
                <>
                  <CheckCircle size={12} />
                  Valid ✅
                </>
              ) : (
                <>
                  <AlertCircle size={12} />
                  Pending ⏳
                </>
              )}
            </span>
          </div>
        </div>

        {/* Multi-Track / Full-Stack Mode Switcher Button */}
        {(student.isMultiTrack || isFull) && (
          <div className="p-2.5 rounded-2xl bg-linear-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-purple-500" />
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  {isFull
                    ? "الشهادة حالياً: موحدة (Full-Stack)"
                    : "متاح دمج السجلات في شهادة Full-Stack موحدة"}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  {isFull
                    ? "تظهر كشهادة واحدة موحدة برابط و QR واحد فقط"
                    : "يمكنك توحيدها لتجنب تكرار اسم الطالب في القائمة"}
                </p>
              </div>
            </div>

            <button
              onClick={handleModeToggle}
              disabled={saving}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isFull
                  ? "bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                  : "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 hover:bg-indigo-100"
              }`}
            >
              {isFull ? "فصل الشهادات 📄" : "⚡ توحيد لـ Full-Stack"}
            </button>
          </div>
        )}

        {/* Views Count & Reset Button */}
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-800/40">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-400">
              <Eye size={15} />
            </div>
            <span>عدد الزيارات:</span>
            <span className="font-mono text-sm font-black bg-gray-900 px-2.5 py-0.5 rounded-lg border border-purple-200 dark:border-purple-700 text-purple-800 dark:text-purple-200 shadow-xs">
              {student.viewsCount || 0} زيارة
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetViews}
            disabled={saving}
            title="إعادة تعيين (تصفير) عدد الزيارات إلى 0"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-600 hover:text-red-600 bg-white hover:bg-red-50 dark:bg-gray-800 dark:hover:bg-red-950/40 dark:text-gray-300 dark:hover:text-red-400 border border-gray-200 dark:border-gray-700 shadow-xs transition-all active:scale-95 disabled:opacity-50"
          >
            <RotateCcw size={13} className={saving ? "animate-spin" : ""} />
            <span>تصفير العداد</span>
          </button>
        </div>

        {/* QR Code & Verify Link Display */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm shrink-0">
            <CodaxQR value={verifyUrl} size={110} />
          </div>

          <div className="flex-1 min-w-0 space-y-1.5 text-right w-full">
            <p className="text-xs text-gray-400 font-medium">كود الشهادة:</p>
            <p className="text-xs font-black font-mono text-indigo-600 dark:text-indigo-400 break-all">
              {certData.certificateId}
            </p>

            <div className="pt-1 flex items-center gap-2">
              <a
                href={verifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <ExternalLink size={12} />
                معاينة صفحة التحقق
              </a>
            </div>
          </div>
        </div>

        {/* Editable Certificate Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {/* Course Name */}
          <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
            <span className="text-gray-400 block mb-1">اسم الدورة:</span>
            <input
              type="text"
              defaultValue={certData.course}
              onBlur={(e) => handleUpdateCertField("certCourse", e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 font-bold text-gray-800 dark:text-gray-100 outline-none focus:border-indigo-500"
            />
          </div>

          {/* Duration */}
          <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
            <span className="text-gray-400 block mb-1">مدة الدورة:</span>
            <input
              type="text"
              defaultValue={certData.duration}
              onBlur={(e) =>
                handleUpdateCertField("certDuration", e.target.value)
              }
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 font-bold text-gray-800 dark:text-gray-100 outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Actions Bar */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          {/* Toggle Valid */}
          <button
            onClick={handleToggleValid}
            disabled={saving}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              isEligible
                ? "bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            }`}
          >
            {saving ? (
              <Loader2 size={13} className="animate-spin" />
            ) : isEligible ? (
              <>
                <ToggleRight size={15} />
                إلغاء التفعيل
              </>
            ) : (
              <>
                <ToggleLeft size={15} />
                تفعيل الشهادة
              </>
            )}
          </button>

          {/* Download QR */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm shadow-indigo-200 dark:shadow-none"
          >
            {downloading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <>
                <Download size={14} />
                تحميل QR
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Certificates Dashboard ──────────────────────────────────────────────────
export default function CertificatesDashboard() {
  const [rawStudents, setRawStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");
  const [filterTrack, setFilterTrack] = useState("all"); // all | fullstack | frontend | backend
  const [filterStatus, setFilterStatus] = useState("all");
  const [groups, setGroups] = useState([]);
  const { latestLectures } = useLatestLecture();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "students"), (snap) => {
      const data = snap.docs.map((d) => ({ docId: d.id, ...d.data() }));
      setRawStudents(data);
      const groupSet = new Set(data.map((s) => s.group).filter(Boolean));
      setGroups(Array.from(groupSet).sort());
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ── Smart Multi-Track Grouping & Merging ─────────────────────────────────
  const processedStudents = useMemo(() => {
    // تجميع الطلاب حسب رقم الهاتف أو الاسم
    const phoneMap = new Map();
    const nameMap = new Map();

    rawStudents.forEach((st) => {
      const phone = (st.phone || "").trim();
      const name = (st.name || "").trim().toLowerCase();

      if (phone && phone.length >= 7) {
        if (!phoneMap.has(phone)) phoneMap.set(phone, []);
        phoneMap.get(phone).push(st);
      } else if (name) {
        if (!nameMap.has(name)) nameMap.set(name, []);
        nameMap.get(name).push(st);
      }
    });

    const handledDocIds = new Set();
    const resultList = [];

    rawStudents.forEach((st) => {
      if (handledDocIds.has(st.docId)) return;

      const phone = (st.phone || "").trim();
      const name = (st.name || "").trim().toLowerCase();

      const matchingRecords =
        phone && phone.length >= 7
          ? phoneMap.get(phone) || [st]
          : nameMap.get(name) || [st];

      const isMulti = matchingRecords.length > 1;
      const isAnyFullStack = matchingRecords.some(isFullStackStudent);

      // إذا كان مسجلاً في أكثر من مسار ومطلوب شهادة موحدة (أو افتراضياً Full-Stack)
      if (isMulti && (isAnyFullStack || st.certMode !== "separate")) {
        // دمج السجلات في كائن واحد
        const primary = matchingRecords[0];
        const allDocIds = matchingRecords.map((m) => m.docId);
        const enrolledGroups = Array.from(
          new Set(matchingRecords.map((m) => m.group).filter(Boolean))
        );

        let totalGroupLec = 0;
        let totalAttended = 0;
        matchingRecords.forEach((m) => {
          totalGroupLec += Number(m.latestLecture || 0);
          totalAttended += Number(m.attendedLectures || 0);
        });

        // الاسم الإنجليزي من أي سجل متاح
        const certName = matchingRecords
          .map(getStudentCertName)
          .find((n) => n && n.length >= 2);

        resultList.push({
          ...primary,
          certificate: certName || primary.certificate,
          linkedDocIds: allDocIds,
          isMultiTrack: true,
          isFullStack: true,
          certMode: "fullstack",
          enrolledGroups,
          totalGroupLectures: totalGroupLec,
          attendedLectures: totalAttended,
        });

        matchingRecords.forEach((m) => handledDocIds.add(m.docId));
      } else {
        // سجل فردي عادي
        handledDocIds.add(st.docId);
        resultList.push({
          ...st,
          linkedDocIds: [st.docId],
          isMultiTrack: isMulti,
        });
      }
    });

    return resultList;
  }, [rawStudents]);

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return processedStudents.filter((s) => {
      const matchSearch =
        !searchQuery ||
        (s.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        buildCertificateId(s).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.certificate || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchGroup =
        filterGroup === "all" ||
        s.group === filterGroup ||
        (s.enrolledGroups && s.enrolledGroups.includes(filterGroup));

      const isEligible = s.certificate && s.certificate.trim().length >= 2;
      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "valid" && isEligible) ||
        (filterStatus === "pending" && !isEligible);

      const isFull = isFullStackStudent(s);
      const isBack =
        !isFull &&
        ((s.subscriptionType || "").toLowerCase().includes("back") ||
          (s.certCourse || "").toLowerCase().includes("back"));
      const isFront = !isFull && !isBack;

      const matchTrack =
        filterTrack === "all" ||
        (filterTrack === "fullstack" && isFull) ||
        (filterTrack === "frontend" && isFront) ||
        (filterTrack === "backend" && isBack);

      return matchSearch && matchGroup && matchStatus && matchTrack;
    });
  }, [processedStudents, searchQuery, filterGroup, filterStatus, filterTrack]);

  const validCount = processedStudents.filter(
    (s) => s.certificate && s.certificate.trim().length >= 2
  ).length;
  const fullStackCount = processedStudents.filter(isFullStackStudent).length;
  const pendingCount = processedStudents.length - validCount;
  const totalViews = processedStudents.reduce(
    (acc, s) => acc + (Number(s.viewsCount) || 0),
    0
  );

  if (loading) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <p className="text-gray-400 text-sm">جاري تحميل سجلات الشهادات...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-linear-to-r from-indigo-900 via-purple-900 to-slate-900 text-white rounded-3xl p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                <Award size={28} className="text-amber-300" />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                لوحة تحكم الشهادات والشهادة الموحدة (Full-Stack)
              </h1>
            </div>
            <p className="text-indigo-200 text-sm max-w-2xl">
              إدارة واعتماد شهادات التخرج، وتوحيد شهادات خريجي مساري (الفرونت + الباك) في شهادة Full-Stack موحدة برابط و QR واحد بدون تكرار اسم الطالب.
            </p>
          </div>

          {/* Stats Badges */}
          <div className="flex flex-wrap items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15">
            <div className="text-center px-3 border-l border-white/10">
              <span className="block text-2xl font-black text-white">
                {processedStudents.length}
              </span>
              <span className="text-[11px] text-indigo-200">الشهادات</span>
            </div>
            <div className="text-center px-3 border-l border-white/10">
              <span className="block text-2xl font-black text-cyan-400">
                {totalViews}
              </span>
              <span className="text-[11px] text-cyan-200">إجمالي الزيارات 👁️</span>
            </div>
            <div className="text-center px-3 border-l border-white/10">
              <span className="block text-2xl font-black text-purple-400">
                {fullStackCount}
              </span>
              <span className="text-[11px] text-purple-200">Full-Stack 🌟</span>
            </div>
            <div className="text-center px-3 border-l border-white/10">
              <span className="block text-2xl font-black text-green-400">
                {validCount}
              </span>
              <span className="text-[11px] text-green-200">Valid ✅</span>
            </div>
            <div className="text-center px-3">
              <span className="block text-2xl font-black text-amber-400">
                {pendingCount}
              </span>
              <span className="text-[11px] text-amber-200">Pending ⏳</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search
            size={18}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="ابحث باسم الطالب، الاسم بالشهادة، أو رقم الشهادة (CODAX-FS-...)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-2xl text-sm border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Track Filter */}
          <div className="relative flex-1 md:w-44">
            <select
              value={filterTrack}
              onChange={(e) => setFilterTrack(e.target.value)}
              className="w-full appearance-none pr-4 pl-9 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-2xl text-sm border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
            >
              <option value="all">كل المسارات</option>
              <option value="fullstack">Full-Stack موحدة 🌟</option>
              <option value="frontend">Front-End فقط 💻</option>
              <option value="backend">Back-End فقط ⚙️</option>
            </select>
            <ChevronDown
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>

          {/* Group filter */}
          <div className="relative flex-1 md:w-40">
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="w-full appearance-none pr-4 pl-9 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-2xl text-sm border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">كل المجموعات</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  مجموعة: {g}
                </option>
              ))}
            </select>
            <Users
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>

          {/* Status filter */}
          <div className="relative flex-1 md:w-36">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full appearance-none pr-4 pl-9 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-2xl text-sm border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="all">جميع الحالات</option>
              <option value="valid">Valid فقط ✅</option>
              <option value="pending">Pending فقط ⏳</option>
            </select>
            <ChevronDown
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border border-gray-100 dark:border-gray-800">
          <Award size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-1">
            لا توجد نتائج مطابقة للبحث
          </h3>
          <p className="text-gray-400 text-sm">
            جرب تعديل معايير البحث أو الفلاتر المحددة.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((student) => (
            <CertificateCard
              key={student.docId}
              student={student}
              groupLecturesMap={latestLectures}
            />
          ))}
        </div>
      )}
    </div>
  );
}
