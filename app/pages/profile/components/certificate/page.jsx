"use client";
import React, { useState, useEffect } from "react";
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
import { QRCodeSVG } from "qrcode.react";
import codaxLogo from "@/public/favicon.png";
import {
  CheckCircle,
  XCircle,
  Award,
  Clock,
  BookOpen,
  Calendar,
  Shield,
  Hash,
  Loader2,
  ExternalLink,
  BadgeCheck,
  Globe,
  Github,
  CalendarCheck,
  BookCheck,
  Eye,
} from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SITE_BASE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : "https://codax-dev.web.app";

const parseCertificateId = (certId) => {
  // Format: CODAX-FE-2026-00127
  const match = certId?.match(/^CODAX-(FE|BE)-(\d{4})-(\d+)$/i);
  if (!match) return null;
  return {
    type: match[1].toUpperCase(),
    year: match[2],
    studentId: parseInt(match[3], 10),
  };
};

const buildIssueDate = () => {
  const d = new Date();
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// ─── QR with Logo ────────────────────────────────────────────────────────────

const CodaxQR = ({ value, size = 140 }) => {
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

// ─── Detail Row ───────────────────────────────────────────────────────────────

const InfoRow = ({ icon: Icon, label, value, highlight, valueClass }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
      <Icon size={15} className="text-indigo-400" />
      <span>{label}</span>
    </div>
    <span
      className={`text-sm font-bold ${
        valueClass
          ? valueClass
          : highlight
            ? "text-green-600 dark:text-green-400"
            : "text-gray-800 dark:text-gray-100"
      }`}
    >
      {value}
    </span>
  </div>
);

// ─── Certificate Verification Page ───────────────────────────────────────────

export default function page() {
  const { certificateId } = useParams();
  const [status, setStatus] = useState("loading"); // loading | valid | invalid | error
  const [certData, setCertData] = useState(null);

  useEffect(() => {
    const verify = async () => {
      if (!certificateId) {
        setStatus("invalid");
        return;
      }

      const parsed = parseCertificateId(certificateId);
      if (!parsed) {
        setStatus("invalid");
        return;
      }

      try {
        const q = query(
          collection(db, "students"),
          where("id", "==", parsed.studentId),
        );
        const snap = await getDocs(q);

        if (snap.empty) {
          setStatus("invalid");
          return;
        }

        const studentDoc = snap.docs[0];
        const studentRef = studentDoc.ref;
        const student = studentDoc.data();

        // Course details will be set after fetching groupCount

        // Fetch group data
        let groupCount = student.latestLecture || 0;
        let groupEnded = false;
        try {
          const groupLecSnap = await getDoc(doc(db, "lectures", "groups"));
          if (
            groupLecSnap.exists() &&
            student.group &&
            groupLecSnap.data()?.[student.group]
          ) {
            const gData = groupLecSnap.data()[student.group];
            groupCount = gData.count || groupCount;
            groupEnded = gData.status === false;
          }
        } catch (e) {
          console.error("Error fetching group lectures:", e);
        }

        const certName = (
          student.certificate ||
          student.englishName ||
          student.nameEn ||
          ""
        ).trim();
        const hasName = certName.length >= 2;
        const totalP = Number(student.totalPrice || 0);
        const paidP = Number(student.paidAmount || 0);
        const isFeesPaid =
          totalP > 0
            ? paidP >= totalP
            : Number(student.remainingAmount ?? 0) <= 0;

        // Determine eligibility
        const isEligible = hasName && isFeesPaid && groupEnded;

        if (!isEligible) {
          setStatus("invalid");
          return;
        }

        // Increment visitor view count
        const currentViews = Number(student.viewsCount || 0);
        const sessionKey = `visited_cert_${certificateId}`;
        let updatedViews = currentViews;

        if (!sessionStorage.getItem(sessionKey)) {
          sessionStorage.setItem(sessionKey, "true");
          updatedViews = currentViews + 1;
          updateDoc(studentRef, { viewsCount: increment(1) }).catch((err) =>
            console.error("Error incrementing view count:", err),
          );
        }

        // Override groupLectures if admin set manual value
        if (
          student.certGroupLectures !== undefined &&
          student.certGroupLectures !== null &&
          student.certGroupLectures !== ""
        ) {
          groupCount = Number(student.certGroupLectures);
        }

        // Attended lectures
        let attendedLectures =
          typeof student.attendedLectures === "number"
            ? student.attendedLectures
            : 0;
        if (
          student.certAttendedLectures !== undefined &&
          student.certAttendedLectures !== null &&
          student.certAttendedLectures !== ""
        ) {
          attendedLectures = Number(student.certAttendedLectures);
        }

        const subType = (student.subscriptionType || "").toLowerCase();
        const groupName = (student.group || "").toLowerCase();
        const rawCourse = (student.certCourse || "").toLowerCase();

        const isFull =
          student.isFullStack ||
          student.certMode === "fullstack" ||
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

        // Duration
        let duration = student.certDuration;
        if (!duration) {
          if (isFull) {
            duration = "60+ Hours";
          } else if (isFront) {
            duration = groupCount >= 25 ? "60 Hours" : "30 Hours";
          } else if (isBack) {
            duration = groupCount <= 25 ? "30 Hours" : "60 Hours";
          } else {
            duration = groupCount >= 25 ? "60 Hours" : "30 Hours";
          }
        }

        // Course
        let course = student.certCourse;
        if (!course) {
          if (isFull) {
            course = "Full-Stack Web Development";
          } else if (isFront) {
            course = "Front-End Development";
          } else if (isBack) {
            course = "Back-End Development";
          } else {
            course =
              groupCount >= 25 ? "Front-End Development" : "Back-End Development";
          }
        } else {
          if (course === "Front-End" || course.toLowerCase() === "frontend")
            course = "Front-End Development";
          if (course === "Back-End" || course.toLowerCase() === "backend")
            course = "Back-End Development";
          if (
            course === "Full-Stack" ||
            course === "Full Stack" ||
            course.toLowerCase() === "fullstack"
          )
            course = "Full-Stack Web Development";
        }

        const githubLinks = (student.linksHistory || []).filter(
          (l) => l && l.url,
        );

        setCertData({
          certificateId,
          studentName: student.certificate || student.name,
          group: student.group || "غير محدد",
          attendedLectures,
          groupLectures: groupCount,
          githubLinks,
          showGithubButton: student.showGithubButton !== false,
          duration,
          course,
          viewsCount: updatedViews,
          assessment: "Successfully Passed",
          capstoneProject: "Completed",
          issueDate: buildIssueDate(),
          status: "valid",
        });
        setStatus("valid");
      } catch (err) {
        console.error("Verification error:", err);
        setStatus("error");
      }
    };

    verify();
  }, [certificateId]);

  const verifyUrl = `${SITE_BASE_URL}/certificate?id=${certificateId}`;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-indigo-400 shadow-xl">
            <img
              src={codaxLogo}
              alt="CodaX"
              className="w-full h-full object-cover"
            />
          </div>
          <Loader2 size={36} className="text-indigo-400 animate-spin" />
          <p className="text-indigo-200 text-lg font-medium">
            جاري التحقق من الشهادة...
          </p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-slate-900 via-gray-900 to-gray-950 p-6">
        <div className="bg-red-950/30 border border-red-500/40 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <XCircle size={52} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-300 mb-2">
            خطأ في الاتصال
          </h2>
          <p className="text-gray-400 text-sm">
            حدث خطأ أثناء التحقق، يرجى المحاولة مرة أخرى.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Globe size={15} />
            الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  // ── Invalid ───────────────────────────────────────────────────────────────
  if (status === "invalid") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-red-950 to-gray-950 p-6">
        <div className="bg-gray-900/80 border border-red-500/40 backdrop-blur-sm rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          {/* Logo */}
          <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-6 shadow-xl border-2 border-red-400/30">
            <img
              src={codaxLogo}
              alt="CodaX"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-400/50 flex items-center justify-center mx-auto mb-5">
            <XCircle size={34} className="text-red-400" />
          </div>

          <h1 className="text-2xl font-extrabold text-white mb-2">
            شهادة غير موجودة
          </h1>
          <p className="text-gray-400 text-sm mb-1">رقم الشهادة:</p>
          <p className="text-red-400 font-mono text-sm mb-5 break-all">
            {certificateId || "—"}
          </p>

          <div className="bg-red-950/40 border border-red-500/20 rounded-xl p-4 text-sm text-red-300 mb-6">
            هذه الشهادة غير موجودة في سجلات CodaX أو لم يتم استيفاء شروط
            الإصدار.
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all shadow-lg"
          >
            <Globe size={16} />
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  // ── Valid Certificate ─────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 flex items-center justify-center p-4 py-12"
      dir="rtl"
    >
      {/* Background decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-24 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-24 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-xl">
        {/* Card */}
        <div className="bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          {/* Top gradient header */}
          <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-6 text-center relative">
            {/* Dots pattern */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle, white 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />

            <div className="relative">
              {/* Logo */}
              <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-3 shadow-xl border-3 border-white/30">
                <img
                  src={codaxLogo}
                  alt="CodaX"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Valid badge & Visitor counter */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5">
                  <BadgeCheck size={16} className="text-white" />
                  <span className="text-white font-bold text-sm tracking-wide">
                    VERIFIED CERTIFICATE
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 bg-black/30 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5 text-white text-xs font-bold shadow-inner">
                  <Eye size={14} className="text-purple-300" />
                  <span>{certData.viewsCount ?? 1} زيارة</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2">
                <CheckCircle size={28} className="text-white drop-shadow" />
                <h1 className="text-2xl font-extrabold text-white drop-shadow">
                  الشهادة موثقة ✓
                </h1>
              </div>
              <p className="text-white/80 text-sm mt-1">
                تم التحقق بنجاح من سجلات CodaX
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Student name highlight */}
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-1">تُمنح هذه الشهادة لـ</p>
              <h2 className="text-2xl font-extrabold text-white">
                {certData.studentName}
              </h2>
              <p className="text-indigo-300 text-sm mt-1">
                لإتمامه/ها بنجاح دورة
              </p>
              <div className="inline-block mt-2 px-4 py-1.5 bg-indigo-600/30 border border-indigo-500/40 rounded-full">
                <span className="text-indigo-300 font-bold text-sm">
                  {certData.course}
                </span>
              </div>
            </div>

            {/* General Certificate Details */}
            <div className="bg-gray-800/60 rounded-2xl p-4 border border-white/5 space-y-0.5">
              <h3 className="text-xs font-bold text-gray-400 mb-2 pb-1 border-b border-gray-700/50">
                بيانات الشهادة والدورة
              </h3>
              <InfoRow
                icon={Hash}
                label="رقم الشهادة"
                value={certData.certificateId}
              />
              <InfoRow
                icon={Eye}
                label="عدد الزوار (المشاهدات)"
                value={`${certData.viewsCount ?? 1} زيارة`}
                valueClass="text-purple-400 font-bold"
              />
              <InfoRow
                icon={CalendarCheck}
                label="مرات الحضور"
                value={`${certData.attendedLectures} محاضرة`}
                valueClass="text-emerald-400"
              />
              <InfoRow
                icon={BookCheck}
                label="عدد المحاضرات الإجمالي"
                value={`${certData.groupLectures} محاضرة`}
                valueClass="text-sky-400"
              />
              <InfoRow
                icon={Clock}
                label="مدة الدورة"
                value={certData.duration}
              />
              <InfoRow
                icon={Shield}
                label="التقييم"
                value={certData.assessment}
                highlight
              />
              <InfoRow
                icon={BookOpen}
                label="المشروع الختامي"
                value={certData.capstoneProject}
                highlight
              />
              <InfoRow
                icon={Calendar}
                label="تاريخ الإصدار"
                value={certData.issueDate}
              />
            </div>

            {/* GitHub Links Section */}
            {certData.showGithubButton && (
              <div className="bg-gray-800/60 rounded-2xl p-4 border border-white/5">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700/50">
                  <Github size={18} className="text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">
                    روابط GitHub والمشاريع
                  </h3>
                </div>

                {certData.githubLinks && certData.githubLinks.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {certData.githubLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={isValidUrl(link.url) ? link.url : "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-xl bg-gray-900/60 hover:bg-indigo-950/40 border border-gray-700/50 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Github
                            size={16}
                            className="text-gray-400 group-hover:text-indigo-400 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-200 group-hover:text-indigo-300 truncate">
                              {link.title || `مشروع ${idx + 1}`}
                            </p>
                            <p className="text-[10px] text-gray-500 font-mono truncate dir-ltr text-left">
                              {link.url}
                            </p>
                          </div>
                        </div>
                        <ExternalLink
                          size={14}
                          className="text-gray-500 group-hover:text-indigo-400 flex-shrink-0 mr-2"
                        />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-xs flex items-center justify-center gap-2">
                    <Github size={16} className="text-gray-600" />
                    لا توجد روابط GitHub مرفوعة حالياً
                  </div>
                )}
              </div>
            )}

            {/* QR Code */}
            <div className="flex flex-col items-center bg-white rounded-2xl p-5 border border-gray-100">
              <CodaxQR value={verifyUrl} size={150} />
              <p className="text-gray-400 text-xs text-center mt-3 font-mono break-all">
                {verifyUrl}
              </p>
            </div>

            {/* Footer note */}
            <div className="flex items-start gap-2.5 bg-green-950/40 border border-green-500/20 rounded-xl p-4">
              <CheckCircle
                size={17}
                className="text-green-400 flex-shrink-0 mt-0.5"
              />
              <p className="text-green-300/80 text-xs leading-relaxed">
                هذه الشهادة صادرة رسمياً من أكاديمية CodaX وتم التحقق من صحتها
                في قاعدة البيانات الرسمية. يمكن الاعتماد عليها كوثيقة تدريبية
                معتمدة.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-400 transition-colors"
            >
              <Globe size={14} />
              codax-dev.web.app
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>

        {/* CodaX branding below card */}
        <p className="text-center text-gray-600 text-xs mt-4">
          © {new Date().getFullYear()} CodaX Academy — All Rights Reserved
        </p>
      </div>
    </div>
  );
}
