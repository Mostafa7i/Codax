"use client";
import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle,
  XCircle,
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
  Code2,
  Database,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { verifyCertificate } from "@/app/services/certificateService";

const SITE_BASE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : "https://codax-dev.web.app";

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
          src="/favicon.png"
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
export default function CertificateClient() {
  const searchParams = useSearchParams();
  const certificateId = searchParams?.get("id");
  const [status, setStatus] = useState("loading"); // loading | valid | invalid | error
  const [certData, setCertData] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const performVerification = async () => {
      if (!certificateId) {
        if (isMounted) setStatus("invalid");
        return;
      }

      try {
        const result = await verifyCertificate(certificateId);
        if (!isMounted) return;

        if (result.status === "valid" && result.data) {
          setCertData(result.data);
          setStatus("valid");
        } else {
          setStatus("invalid");
        }
      } catch (err) {
        console.error("Verification error:", err);
        if (isMounted) setStatus("error");
      }
    };

    performVerification();

    return () => {
      isMounted = false;
    };
  }, [certificateId]);

  const verifyUrl = `${SITE_BASE_URL}/certificate?id=${certificateId}`;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-slate-900 via-indigo-950 to-purple-950 p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-indigo-400 shadow-xl bg-white p-1">
            <img
              src="/favicon.png"
              alt="CodaX"
              className="w-full h-full object-contain"
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-slate-900 via-red-950 to-gray-950 p-6">
        <div className="bg-gray-900/80 border border-red-500/40 backdrop-blur-sm rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-6 shadow-xl border-2 border-red-400/30 bg-white p-1">
            <img
              src="/favicon.png"
              alt="CodaX"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-400/50 flex items-center justify-center mx-auto mb-5">
            <XCircle size={34} className="text-red-400" />
          </div>

          <h1 className="text-2xl font-extrabold text-white mb-2">
            شهادة غير موجودة أو غير معتمدة
          </h1>
          <p className="text-gray-400 text-sm mb-1">رقم الشهادة:</p>
          <p className="text-red-400 font-mono text-sm mb-5 break-all">
            {certificateId || "—"}
          </p>

          <div className="bg-red-950/40 border border-red-500/20 rounded-xl p-4 text-sm text-red-300 mb-6 leading-relaxed">
            هذه الشهادة غير موجودة في سجلات CodaX أو لم يتم استيفاء شروط الإصدار
            بعد.
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
      className="min-h-screen bg-linear-to-br from-slate-900 via-indigo-950 to-purple-950 flex items-center justify-center p-4 py-12"
      dir="rtl"
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-24 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-24 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-xl">
        <div className="bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          {/* Top gradient header */}
          <div
            className={`p-6 text-center relative ${
              certData.isFullStack
                ? "bg-linear-to-r from-amber-500 via-purple-600 to-indigo-600"
                : "bg-linear-to-r from-green-500 via-emerald-500 to-teal-500"
            }`}
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle, white 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />

            <div className="relative">
              <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-3 shadow-xl border-3 border-white/30 bg-white p-1">
                <img
                  src="/favicon.png"
                  alt="CodaX"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5">
                  <BadgeCheck size={16} className="text-white" />
                  <span className="text-white font-bold text-sm tracking-wide">
                    {certData.isFullStack
                      ? "FULL-STACK CERTIFIED GRADUATE"
                      : "VERIFIED CERTIFICATE"}
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
                  {certData.isFullStack
                    ? "شهادة موحدة معتمدة (Full-Stack) ✓"
                    : "الشهادة موثقة ✓"}
                </h1>
              </div>
              <p className="text-white/90 text-sm mt-1">
                تم التحقق والتوثيق بنجاح من السجلات الرسمية لأكاديمية CodaX
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-1">تُمنح هذه الشهادة لـ</p>
              <h2 className="text-2xl font-extrabold text-white">
                {certData.studentName}
              </h2>
              <p className="text-indigo-300 text-sm mt-1">
                لإتمامه/ها بنجاح واحتراف دورة
              </p>
              <div className="inline-block mt-2 px-4 py-1.5 bg-linear-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-500/40 rounded-full">
                <span className="text-indigo-200 font-bold text-sm">
                  {certData.course}
                </span>
              </div>
            </div>

            {/* Special Full-Stack Track Badges */}
            {certData.isFullStack && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-linear-to-r from-indigo-950/40 to-purple-950/40 rounded-2xl border border-indigo-500/20">
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-900/60 border border-indigo-500/30 text-right">
                  <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <Code2 size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Front-End Track</p>
                    <p className="text-[10px] text-gray-400">React, Next.js, UI</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-900/60 border border-purple-500/30 text-right">
                  <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                    <Database size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Back-End Track</p>
                    <p className="text-[10px] text-gray-400">Node, APIs, Database</p>
                  </div>
                </div>
              </div>
            )}

            {/* General Certificate Details */}
            <div className="bg-gray-800/60 rounded-2xl p-4 border border-white/5 space-y-0.5">
              <h3 className="text-xs font-bold text-gray-400 mb-2 pb-1 border-b border-gray-700/50">
                بيانات الشهادة والدورة
              </h3>
              <InfoRow
                icon={Hash}
                label="رقم الشهادة المعتمد"
                value={certData.certificateId}
                valueClass="text-indigo-400 font-mono"
              />
              <InfoRow
                icon={Eye}
                label="عدد الزوار (المشاهدات)"
                value={`${certData.viewsCount ?? 1} زيارة`}
                valueClass="text-purple-400 font-bold"
              />
              <InfoRow
                icon={CalendarCheck}
                label="مرات الحضور المعتمدة"
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
                label="مدة الدورة المعتمدة"
                value={certData.duration}
              />
              <InfoRow
                icon={Shield}
                label="التقييم العام"
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
                    مشاريع التخرج وروابط GitHub
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
                            className="text-gray-400 group-hover:text-indigo-400 shrink-0"
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
                          className="text-gray-500 group-hover:text-indigo-400 shrink-0 mr-2"
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
                className="text-green-400 shrink-0 mt-0.5"
              />
              <p className="text-green-300/80 text-xs leading-relaxed">
                هذه الشهادة صادرة رسمياً من أكاديمية CodaX ومسجلة في قاعدة البيانات
                الرسمية لتوثيق خريجي البرمجة.
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

        <p className="text-center text-gray-600 text-xs mt-4">
          © {new Date().getFullYear()} CodaX Academy — All Rights Reserved
        </p>
      </div>
    </div>
  );
}
