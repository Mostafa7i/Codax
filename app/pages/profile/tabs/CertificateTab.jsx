import React from "react";
import { motion } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import {
  BadgeCheck,
  Award,
  ShieldCheck,
  X,
  BookOpen,
  Clock,
  CalendarCheck,
  Download,
} from "lucide-react";
import {
  CERT_BASE_URL,
  buildStudentCertId,
  buildCertIssueDate,
  StudentCodaxQR,
  downloadCertQR,
} from "../components/CertQR";

export default function CertificateTab({
  studentData,
  newStudentData,
  studentId,
  latestLecture,
  state,
  groupStatuses,
}) {
  let activeGroupLectures = latestLecture || 0;
  if (
    studentData?.certGroupLectures !== undefined &&
    studentData?.certGroupLectures !== null &&
    studentData?.certGroupLectures !== ""
  ) {
    activeGroupLectures = Number(studentData.certGroupLectures);
  }

  const subType = (studentData?.subscriptionType || "").toLowerCase();
  const groupName = (studentData?.group || newStudentData?.group || "").toLowerCase();
  const rawCourse = (studentData?.certCourse || "").toLowerCase();

  const isFullStack =
    studentData?.isFullStack ||
    studentData?.certMode === "fullstack" ||
    subType.includes("full") ||
    rawCourse.includes("full") ||
    groupName.includes("full");

  const isFront =
    rawCourse.includes("front") ||
    subType.includes("front") ||
    groupName.includes("front");

  const isBack =
    rawCourse.includes("back") ||
    subType.includes("back") ||
    groupName.includes("back");

  let activeDuration = studentData?.certDuration;
  if (!activeDuration) {
    if (isFullStack) {
      activeDuration = "60+ Hours";
    } else if (isFront) {
      activeDuration = activeGroupLectures >= 25 ? "60 Hours" : "30 Hours";
    } else if (isBack) {
      activeDuration = activeGroupLectures <= 25 ? "30 Hours" : "60 Hours";
    } else {
      activeDuration = activeGroupLectures >= 25 ? "60 Hours" : "30 Hours";
    }
  }

  let activeCertCourse = studentData?.certCourse;
  if (!activeCertCourse) {
    if (isFullStack) {
      activeCertCourse = "Full-Stack Web Development";
    } else if (isFront) {
      activeCertCourse = "Front-End Development";
    } else if (isBack) {
      activeCertCourse = "Back-End Development";
    } else {
      activeCertCourse =
        activeGroupLectures >= 25
          ? "Front-End Development"
          : "Back-End Development";
    }
  } else {
    if (activeCertCourse === "Front-End" || activeCertCourse.toLowerCase() === "frontend")
      activeCertCourse = "Front-End Development";
    if (activeCertCourse === "Back-End" || activeCertCourse.toLowerCase() === "backend")
      activeCertCourse = "Back-End Development";
    if (
      activeCertCourse === "Full-Stack" ||
      activeCertCourse === "Full Stack" ||
      activeCertCourse.toLowerCase() === "fullstack"
    )
      activeCertCourse = "Full-Stack Web Development";
  }

  const certId = buildStudentCertId(studentData);
  const verifyUrl = `${CERT_BASE_URL}/certificate?id=${certId}`;
  const canvasId = `cert-canvas-${studentId}`;
  const certEnglishName = (
    studentData?.certificate ||
    studentData?.englishName ||
    newStudentData?.englishName ||
    studentData?.nameEn ||
    newStudentData?.certificate ||
    ""
  ).trim();
  const hasName = certEnglishName.length >= 2;
  const absences = activeGroupLectures - (studentData?.attendedLectures || 0);
  const co = Math.round(state.combinedScore || 0);
  const currentTotalPrice = Number(
    newStudentData?.totalPrice ?? studentData?.totalPrice ?? 0
  );
  const currentPaidAmount = Number(
    newStudentData?.paidAmount ?? studentData?.paidAmount ?? 0
  );
  const calcRemaining =
    currentTotalPrice > 0
      ? currentTotalPrice - currentPaidAmount
      : Number(newStudentData?.remainingAmount ?? studentData?.remainingAmount ?? 0);
  const isFeesPaid =
    currentTotalPrice > 0
      ? currentPaidAmount >= currentTotalPrice
      : calcRemaining <= 0;

  const currentGroup = studentData?.group || newStudentData?.group || "";
  const isGroupEnded =
    groupStatuses && groupStatuses[currentGroup] !== undefined
      ? groupStatuses[currentGroup] === false
      : false;

  // 5 conditions
  const conditions = [
    { label: "اسم إنجليزي مسجّل", ok: hasName },
    { label: `نسبة الإنجاز ≥ 60%`, ok: co >= 60 },
    { label: `الغياب ≤ 12 محاضرة`, ok: absences <= 12 },
    { label: "رسوم مكتملة (سداد كامل المستحقات)", ok: isFeesPaid },
    { label: "المجموعة منتهية ومكتملة", ok: isGroupEnded },
  ];
  const metCount = conditions.filter((c) => c.ok).length;
  const isEligible = metCount === conditions.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-5"
    >
      {/* ── Header Banner ──────────────────────────────────── */}
      <div
        className={`relative overflow-hidden rounded-3xl p-6 ${
          isEligible
            ? "bg-linear-to-br from-emerald-500 via-green-500 to-teal-600"
            : "bg-linear-to-br from-gray-600 via-slate-600 to-gray-700"
        } text-slate-100 shadow-xl`}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(148,163,184,0.35) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-600/40 shadow-lg shrink-0">
            <img src="/favicon.png" alt="CodaX" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {isEligible ? (
                <>
                  <BadgeCheck size={18} className="text-slate-100" />
                  <span className="font-extrabold text-lg">الشهادة موثّقة ✓</span>
                </>
              ) : (
                <>
                  <Award size={18} className="text-slate-100/70" />
                  <span className="font-extrabold text-lg text-slate-100/90">
                    الشهادة غير مفعّلة بعد
                  </span>
                </>
              )}
            </div>
            <p className="text-slate-100/75 text-sm">
              {isEligible
                ? `مبروك ${studentData?.name}! تم اجتياز دورة CodaX بنجاح`
                : "استيفِ الشروط لتفعيل شهادتك"}
            </p>
          </div>
          {/* Progress ring */}
          <div className="shrink-0 relative w-14 h-14">
            <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
              <circle
                cx="22"
                cy="22"
                r="18"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="4"
              />
              <circle
                cx="22"
                cy="22"
                r="18"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="4"
                strokeDasharray={`${(metCount / conditions.length) * 113} 113`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold">
              {metCount}/{conditions.length}
            </span>
          </div>
        </div>
      </div>

      {/* ── Conditions checklist + QR ──────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Conditions */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <ShieldCheck size={16} className="text-indigo-500" />
            شروط استحقاق الشهادة
          </h3>
          {conditions.map((cond, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium ${
                cond.ok
                  ? "bg-green-900/20 text-green-300"
                  : "bg-red-900/20 text-red-400"
              }`}
            >
              {cond.ok ? (
                <ShieldCheck size={16} className="text-green-500 shrink-0" />
              ) : (
                <X size={16} className="text-red-400 shrink-0" />
              )}
              {cond.label}
            </div>
          ))}

          {/* Certificate metadata rows */}
          <div className="pt-3 border-t border-gray-700 space-y-2">
            {[
              { icon: Award, label: "رقم الشهادة", value: certId },
              { icon: BookOpen, label: "الكورس", value: activeCertCourse },
              { icon: Clock, label: "المدة", value: activeDuration },
              { icon: BadgeCheck, label: "التقييم", value: "Successfully Passed" },
              { icon: CalendarCheck, label: "تاريخ الإصدار", value: buildCertIssueDate() },
            ].map(({ icon: Icon, label, value }, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs py-1.5 border-b border-gray-700/40 last:border-0"
              >
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Icon size={12} />
                  <span>{label}</span>
                </div>
                <span className="font-bold text-gray-200 font-mono text-right max-w-[55%] truncate">
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Certificate name */}
          {hasName && (
            <div className="mt-3 bg-indigo-900/20 border border-indigo-800 rounded-xl p-3">
              <p className="text-xs text-indigo-400 font-medium mb-0.5">
                الاسم في الشهادة
              </p>
              <p className="font-extrabold text-indigo-200 text-sm tracking-wide">
                {certEnglishName}
              </p>
            </div>
          )}
        </div>

        {/* QR panel */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-5 shadow-sm flex flex-col items-center gap-4">
          <h3 className="font-bold text-slate-100 text-sm self-start flex items-center gap-2">
            <Download size={16} className="text-indigo-500" />
            QR Code التحقق
          </h3>

          {/* QR display */}
          <div
            className={`p-4 rounded-2xl border-2 ${
              isEligible
                ? "border-green-700 bg-green-900/10"
                : "border-gray-700 bg-gray-900/30 opacity-70"
            }`}
          >
            <StudentCodaxQR value={verifyUrl} size={180} />
          </div>

          {/* Hidden canvas for download */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: "-9999px",
              opacity: 0,
              pointerEvents: "none",
              zIndex: -1,
            }}
          >
            <QRCodeCanvas
              id={canvasId}
              value={verifyUrl}
              size={500}
              level="H"
              bgColor="#ffffff"
              fgColor="#0f172a"
            />
          </div>

          <p className="text-xs text-gray-500 text-center font-mono break-all px-2">
            {verifyUrl}
          </p>

          {/* Action buttons */}
          <div className="flex gap-2 w-full">
            <button
              onClick={() => downloadCertQR(canvasId, `QR-${certId}`)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-900/40 text-indigo-400 border border-indigo-800 transition-all"
            >
              <Download size={14} />
              تحميل QR
            </button>

            <button
              onClick={() => window.open(verifyUrl, "_blank")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-900/40 text-emerald-400 border border-emerald-800 transition-all"
            >
              <BadgeCheck size={14} />
              صفحة التحقق
            </button>
          </div>

          {!isEligible && (
            <p className="text-xs text-amber-400 text-center bg-amber-900/20 border border-amber-800 rounded-xl p-3">
              ⚠️ الـ QR موجود لكن صفحة التحقق ستظهر "غير مفعّلة" حتى يتم استيفاء الشروط
            </p>
          )}
        </div>
      </div>

      {/* ── Tips & info ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            icon: "🎯",
            title: "احصل على الشهادة",
            desc: "أكمل جميع الشروط وستُصدر شهادتك فوراً",
          },
          {
            icon: "🔍",
            title: "التحقق الفوري",
            desc: "أي شخص يمسح الـ QR يرى تأكيداً رسمياً بصحة شهادتك",
          },
          {
            icon: "📤",
            title: "شارك إنجازك",
            desc: "حمّل الـ QR وشاركه على LinkedIn أو CV الخاص بك",
          },
        ].map((tip, i) => (
          <div
            key={i}
            className="bg-gray-800 rounded-2xl border border-gray-700 p-4 shadow-sm"
          >
            <div className="text-2xl mb-2">{tip.icon}</div>
            <h4 className="font-bold text-slate-100 text-sm mb-1">
              {tip.title}
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              {tip.desc}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
