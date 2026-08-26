"use client";
import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/app/services/firebaseConfig";
import {
  collection,
  doc,
  updateDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  where,
  setDoc,
} from "firebase/firestore";
import Swal from "sweetalert2";
import { useGroupContext } from "@/app/context/GroupContextProvider";

/* ─── icons (inline SVG helpers) ─────────────────────────────────────────── */
const Icon = ({ d, size = 16, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d={d} />
  </svg>
);

const Icons = {
  search:
    "M11 17.25a6.25 6.25 0 1 1 0-12.5 6.25 6.25 0 0 1 0 12.5zm5.463-1.037 3.774 3.773",
  filter: "M22 3H2l8 9.46V19l4 2V12.46z",
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.09 5.18 2 2 0 0 1 5.09 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L9.09 10.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm16 2l-8 5-8-5",
  trash:
    "M3 6h18M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m3 0v14c0 1-1 2-2 2H5c-1 0-2-1-2-2V6",
  check: "M20 6 9 17l-5-5",
  clock: "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 5v5l4 2",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z",
  note: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  copy: "M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.5L14.5 2H10a2 2 0 0 0-2 2zM14 2v6h6M10 18H4a2 2 0 0 1-2-2V6",
  sort: "M3 6h18M7 12h10M11 18h2",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  whatsapp: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z",
};

const WAIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
    <path d={Icons.whatsapp} />
  </svg>
);

/* ─── helpers ──────────────────────────────────────────────────────────────── */
const formatDate = (val) => {
  if (!val) return "-";
  const d = val?.seconds ? new Date(val.seconds * 1000) : new Date(val);
  return d.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const daysSince = (val) => {
  if (!val) return 999;
  const d = val?.seconds ? new Date(val.seconds * 1000) : new Date(val);
  return (Date.now() - d) / 86400000;
};

const getStudyMethodText = (m) =>
  ({ online: "أونلاين 🌐", offline: "حضوري 🏫" }[m] || m || "-");

const getTrackBadge = (t) => {
  const map = {
    frontend: { label: "Frontend", color: "#f97316" },
    backend: { label: "Backend", color: "#3b82f6" },
  };
  return map[t] || { label: t || "-", color: "#6b7280" };
};

const getExperienceText = (exp) =>
  ({
    beginner: "مبتدئ",
    intermediate: "متوسط",
    advanced: "متقدم",
    "": "لا",
  }[exp] ?? (exp ? "نعم" : "لا"));

const paymentOptions = [
  { value: "لم يدفع", label: "⛔ لم يدفع", color: "#ef4444" },
  { value: "تم الدفع", label: "✅ تم الدفع", color: "#22c55e" },
  { value: "المواعيد غير مناسبة", label: "⏳ مواعيد غير مناسبة", color: "#f59e0b" },
  { value: "رفض لسبب اخر", label: "❌ رفض لسبب آخر", color: "#6b7280" },
  { value: "رفض بسبب مخصص", label: "✍️ كتابة سبب الرفض", color: "#a855f7" },
];

const getPaymentColor = (status) => {
  if (status?.startsWith("رفض:")) return "#a855f7";
  return paymentOptions.find((o) => o.value === status)?.color || "#6b7280";
};

/* ─── STAT CARD ────────────────────────────────────────────────────────────── */
function StatCard({ label, value, color, icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: `1.5px solid ${active ? color : "rgba(255,255,255,0.08)"}`,
        background: active
          ? `linear-gradient(135deg,${color}22,${color}08)`
          : "rgba(255,255,255,0.03)",
        boxShadow: active ? `0 0 16px ${color}44` : "none",
      }}
      className="flex flex-col items-center justify-center gap-1 rounded-xl p-3 cursor-pointer transition-all duration-200 hover:scale-105 min-w-[90px]"
    >
      <span style={{ color }} className="text-xl">
        {icon}
      </span>
      <span
        style={{ color }}
        className="text-2xl font-bold leading-none"
      >
        {value}
      </span>
      <span className="text-xs text-gray-400 text-center leading-tight">
        {label}
      </span>
    </button>
  );
}

/* ─── STUDENT CARD ─────────────────────────────────────────────────────────── */
function StudentCard({ student, onToggleContacted, onPayment, onDelete, onNote, onAccept, onUpdatePayment }) {
  const [copied, setCopied] = useState(false);
  const [customReason, setCustomReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState(false);
  const track = getTrackBadge(student.track);
  const days = daysSince(student.registrationDate);
  const isNew = days <= 2;
  const isUrgent = !student.contacted && days > 1;

  const copyPhone = () => {
    navigator.clipboard.writeText(student.phone || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };


const formatPhone = (phone) => {
  let p = phone.trim();

  // شيل أي حاجة مش رقم
  p = p.replace(/\D/g, "");

  // لو بدأ بـ 0 → شيلها وحط 20
  if (p.startsWith("0")) {
    return "20" + p.slice(1);
  }

  // لو بالفعل فيه كود مصر
  if (p.startsWith("20")) {
    return p;
  }

  return p;
};
  return (
    <div
      style={{
        border: student.contacted
          ? "1.5px solid rgba(34,197,94,0.3)"
          : isUrgent
          ? "1.5px solid rgba(239,68,68,0.5)"
          : "1.5px solid rgba(255,255,255,0.08)",
        background: student.contacted
          ? "rgba(34,197,94,0.05)"
          : "rgba(255,255,255,0.03)",
      }}
      className="rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-xl"
    >
      {/* Glow strip */}
      <div
        style={{ background: track.color, opacity: 0.15 }}
        className="absolute top-0 right-0 w-1 h-full rounded-l-full"
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <span className="font-bold text-white text-base leading-tight">
            {student.arabicName}
          </span>
          <span className="text-gray-400 text-xs">{student.englishName}</span>
        </div>
        <div className="flex gap-1 flex-wrap justify-end">
          {isNew && (
            <span className="text-xs px-2 py-0.5 rounded-full font-bold animate-pulse"
              style={{ background: "#22c55e22", color: "#22c55e", border: "1px solid #22c55e55" }}>
              ✨ جديد
            </span>
          )}
          {isUrgent && (
            <span className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: "#ef444422", color: "#ef4444", border: "1px solid #ef444455" }}>
              ⚡ لم يُتواصل
            </span>
          )}
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: `${track.color}22`, color: track.color, border: `1px solid ${track.color}44` }}>
            {track.label}
          </span>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <InfoRow label="📱 الهاتف" value={
          <div className="flex items-center gap-1">
            <a href={`tel:${student.phone}`}
              className="text-green-400 hover:text-green-300 transition-colors font-mono text-xs">
              {student.phone}
            </a>
            <button onClick={copyPhone} title="نسخ"
              className="text-gray-500 hover:text-gray-300 transition-colors">
              {copied ? "✅" : <Icon d={Icons.copy} size={12} />}
            </button>
          </div>
        } />
        <InfoRow label="📧 الإيميل" value={
          <a href={`mailto:${student.email}`}
            className="text-blue-400 hover:text-blue-300 transition-colors text-xs truncate max-w-[100px]">
            {student.email || "-"}
          </a>
        } />
        <InfoRow label="🎓 الكلية" value={student.college || "-"} />
        <InfoRow label="🏙️ المدينة" value={student.city || "-"} />
        <InfoRow label="🎂 السن" value={student.age || "-"} />
        <InfoRow label="📚 طريقة" value={getStudyMethodText(student.studyMethod)} />
        <InfoRow label="💡 خبرة" value={getExperienceText(student.hasExperience)} />
        <InfoRow label="👤 رشحه" value={student.referredBy || "-"} />
        <InfoRow label="💰 سعر الكورس" value={student.totalPrice !== undefined ? `${student.totalPrice} ج.م` : "-"} />
        <InfoRow label="💵 المدفوع" value={student.paidAmount !== undefined ? `${student.paidAmount} ج.م` : "-"} />
        <InfoRow label="⏳ المتبقي" value={student.totalPrice !== undefined ? `${student.totalPrice - (student.paidAmount || 0)} ج.م` : "-"} />
        <InfoRow label="👥 المجموعة" value={student.group ? `مجموعة ${student.group}` : "غير مسجل"} />
        <InfoRow
          label="🕐 تسجيل"
          value={
            <span className="text-gray-400 text-xs">
              {formatDate(student.registrationDate)}
            </span>
          }
          full
        />
      </div>

      {/* Note */}
      {student.note && (
        <div className="rounded-lg px-3 py-2 text-xs text-yellow-300 italic"
          style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}>
          📝 {student.note}
        </div>
      )}

      {/* Custom Rejection Reason display */}
      {student.paymentStatus?.startsWith("رفض:") && (
        <div className="rounded-lg px-3 py-2 text-xs text-purple-300 italic"
          style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.25)" }}>
          ✍️ سبب الرفض: {student.paymentStatus.replace("رفض: ", "")}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
        {/* Contacted toggle */}
        <button
          onClick={() => onToggleContacted(student.id, student.contacted || false)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
          style={{
            background: student.contacted ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)",
            border: student.contacted ? "1px solid #22c55e55" : "1px solid rgba(255,255,255,0.1)",
            color: student.contacted ? "#22c55e" : "#9ca3af",
          }}
        >
          {student.contacted ? "✅ تم التواصل" : "☐ تم التواصل"}
        </button>

        {/* WhatsApp */}
        {student.phone && (
          <a
              href={`https://wa.me/${formatPhone(student.phone)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105"
            style={{ background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.3)", color: "#25d366" }}
          >
            <WAIcon /> واتساب
          </a>
        )}

        {/* Accept & Register */}
        <button
          onClick={() => onAccept(student)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 bg-emerald-600/20 border border-emerald-600/30 hover:bg-emerald-600/30 text-emerald-400"
          title="قبول الطالب وتسكينه في مجموعة"
        >
          🎓 قبول وتسجيل
        </button>

        {/* Payment details button */}
        <button
          onClick={() => onUpdatePayment(student)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 bg-yellow-600/20 border border-yellow-600/30 hover:bg-yellow-600/30 text-yellow-450"
          title="تعديل سعر الكورس والمبلغ المدفوع"
        >
          💵 تفاصيل الدفع
        </button>

        {/* Payment */}
        <div className="flex-1 min-w-[130px] flex flex-col gap-1">
          <select
            value={student.paymentStatus?.startsWith("رفض:") ? "رفض بسبب مخصص" : (student.paymentStatus || "لم يدفع")}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "رفض بسبب مخصص") {
                setShowReasonInput(true);
                setCustomReason("");
              } else {
                setShowReasonInput(false);
                onPayment(student.id, val);
              }
            }}
            className="w-full rounded-lg px-2 py-1.5 text-xs font-semibold outline-none cursor-pointer transition-colors"
            style={{
              background: `${getPaymentColor(student.paymentStatus || "لم يدفع")}18`,
              border: `1px solid ${getPaymentColor(student.paymentStatus || "لم يدفع")}44`,
              color: getPaymentColor(student.paymentStatus || "لم يدفع"),
            }}
          >
            {paymentOptions.map((o) => (
              <option key={o.value} value={o.value}
                style={{ background: "#1a1a2e", color: "#fff" }}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Custom Reason Input */}
          {showReasonInput && (
            <div className="flex gap-1 items-center mt-0.5">
              <input
                autoFocus
                type="text"
                placeholder="اكتب سبب الرفض..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customReason.trim()) {
                    onPayment(student.id, `رفض: ${customReason.trim()}`);
                    setShowReasonInput(false);
                  }
                  if (e.key === "Escape") setShowReasonInput(false);
                }}
                className="flex-1 rounded-lg px-2 py-1 text-xs text-white outline-none"
                style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.4)" }}
              />
              <button
                onClick={() => {
                  if (customReason.trim()) {
                    onPayment(student.id, `رفض: ${customReason.trim()}`);
                    setShowReasonInput(false);
                  }
                }}
                className="px-2 py-1 rounded-lg text-xs font-bold text-purple-300 hover:text-white transition-colors flex-shrink-0"
                style={{ background: "rgba(168,85,247,0.2)", border: "1px solid rgba(168,85,247,0.4)" }}
              >
                ✓
              </button>
              <button
                onClick={() => setShowReasonInput(false)}
                className="px-2 py-1 rounded-lg text-xs text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Note btn */}
        <button onClick={() => onNote(student)}
          title="إضافة ملاحظة"
          className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110 text-yellow-400"
          style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)" }}>
          <Icon d={Icons.note} size={14} />
        </button>

        {/* Delete */}
        {!isNew && (
          <button onClick={() => onDelete(student.id)}
            title="حذف"
            className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110 text-red-400"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <Icon d={Icons.trash} size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, full }) {
  return (
    <div className={`flex flex-col gap-0.5 ${full ? "col-span-2" : ""}`}>
      <span className="text-gray-500 text-[10px] font-medium">{label}</span>
      <span className="text-gray-200 text-xs font-medium truncate">
        {value}
      </span>
    </div>
  );
}

/* ─── MAIN COMPONENT ───────────────────────────────────────────────────────── */
const StudentsList = () => {
  const { availableGroups, groupLectures } = useGroupContext();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTrack, setFilterTrack] = useState("");
  const [filterMethod, setFilterMethod] = useState("");
  const [filterContacted, setFilterContacted] = useState(""); // "no" | "yes" | ""
  const [filterPayment, setFilterPayment] = useState("");
  const [filterAge, setFilterAge] = useState(""); // "recent" | "old" | ""
  const [filterGroup, setFilterGroup] = useState(""); // "registered" | "unregistered" | ""
  const [activeTab, setActiveTab] = useState("active"); // "active" | "rejected"
  const [sortBy, setSortBy] = useState("newest"); // newest | oldest | notContacted

  // ── fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const q = query(
          collection(db, "NewStudents"),
          orderBy("registrationDate", "desc")
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => {
          const s = d.data();
          const days = daysSince(s.registrationDate);
          return { id: d.id, ...s, isNew: days <= 2, daysSince: days };
        });
        setStudents(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("حدث خطأ أثناء جلب البيانات");
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  // Mark all as read
  useEffect(() => {
    const markRead = async () => {
      try {
        const q = query(collection(db, "NewStudents"), where("read", "==", false));
        const snap = await getDocs(q);
        const promises = [];
        snap.forEach((d) => {
          promises.push(updateDoc(doc(db, "NewStudents", d.id), { read: true }));
        });
        await Promise.all(promises);
      } catch (e) {
        console.error("Error marking NewStudents as read:", e);
      }
    };
    markRead();
  }, []);

  // ── actions ────────────────────────────────────────────────────────────────
  const toggleContacted = async (id, cur) => {
    try {
      await updateDoc(doc(db, "NewStudents", id), { contacted: !cur });
      setStudents((prev) =>
        prev.map((s) => (s.id === id ? { ...s, contacted: !cur } : s))
      );
    } catch {
      Swal.fire("خطأ!", "حدث خطأ أثناء تحديث حالة التواصل!", "error");
    }
  };

  const updatePaymentStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, "NewStudents", id), { paymentStatus: status });
      setStudents((prev) =>
        prev.map((s) => (s.id === id ? { ...s, paymentStatus: status } : s))
      );
    } catch {
      Swal.fire("خطأ!", "حدث خطأ أثناء تحديث حالة الدفع!", "error");
    }
  };

  const handleDeleteStudent = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: "هل أنت متأكد؟",
      text: "سيتم حذف الطالب نهائياً!",
      icon: "warning",
      background: "#1a1a2e",
      color: "#fff",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#374151",
      confirmButtonText: "نعم، احذف!",
      cancelButtonText: "إلغاء",
    });
    if (!isConfirmed) return;
    try {
      await deleteDoc(doc(db, "NewStudents", id));
      setStudents((prev) => prev.filter((s) => s.id !== id));
      Swal.fire({ title: "تم الحذف!", icon: "success", background: "#1a1a2e", color: "#fff" });
    } catch {
      Swal.fire("خطأ!", "حدث خطأ أثناء الحذف!", "error");
    }
  };

  const handleNote = async (student) => {
    const { value: note } = await Swal.fire({
      title: `📝 ملاحظة - ${student.arabicName}`,
      input: "textarea",
      inputValue: student.note || "",
      inputPlaceholder: "اكتب ملاحظتك هنا...",
      background: "#1a1a2e",
      color: "#fff",
      showCancelButton: true,
      confirmButtonText: "حفظ",
      cancelButtonText: "إلغاء",
      inputAttributes: { style: "background:#0f0f23;color:#fff;border:1px solid #374151;border-radius:8px;padding:10px" },
    });
    if (note === undefined) return;
    try {
      await updateDoc(doc(db, "NewStudents", student.id), { note });
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, note } : s))
      );
    } catch {
      Swal.fire("خطأ!", "حدث خطأ أثناء حفظ الملاحظة!", "error");
    }
  };

  const handleAcceptAndRegister = async (student) => {
    try {
      const phoneClean = student.phone.trim();
      const existingQuery = query(collection(db, "students"), where("id", "==", Number(phoneClean)));
      const existingSnap = await getDocs(existingQuery);
      if (!existingSnap.empty) {
        Swal.fire("تنبيه!", "هذا الطالب مسجل بالفعل في لوحة الطلاب النشطين!", "warning");
        return;
      }

      const groupOptionsHTML = (availableGroups || []).map(g => `<option value="${g}">مجموعة ${g}</option>`).join("") 
        + `<option value="new_group">+ مجموعة جديدة...</option>`;

      const { value: formValues } = await Swal.fire({
        title: `🎓 قبول وتسجيل الطالب: ${student.arabicName}`,
        html: `
          <div class="space-y-4 text-right" dir="rtl" style="color: #fff;">
            <div>
              <label class="block text-xs font-bold text-gray-400 mb-1">اختر المجموعة:</label>
              <select id="swal-group" class="w-full bg-[#0f0f23] border border-[#374151] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-green-500">
                ${groupOptionsHTML}
              </select>
            </div>
            <div id="new-group-container" class="hidden">
              <label class="block text-xs font-bold text-gray-400 mb-1">اسم/رقم المجموعة الجديدة:</label>
              <input id="swal-new-group" type="text" placeholder="مثال: 5" class="w-full bg-[#0f0f23] border border-[#374151] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-green-500">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-400 mb-1">سعر الكورس (ج.م):</label>
              <input id="swal-total-price" type="number" value="${student.totalPrice || ""}" placeholder="مثال: 3000" class="w-full bg-[#0f0f23] border border-[#374151] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-green-500">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-400 mb-1">المبلغ المدفوع الحالي (ج.م):</label>
              <input id="swal-paid-amount" type="number" value="${student.paidAmount || ""}" placeholder="مثال: 500" class="w-full bg-[#0f0f23] border border-[#374151] rounded-lg p-2.5 text-sm text-green-400 font-bold focus:outline-none focus:border-green-500">
            </div>
            <div class="p-2.5 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-1 text-right">
              <label class="block text-xs font-extrabold text-emerald-400 mb-1">➕ إضافة دفعة جديدة (تراكمي):</label>
              <input id="swal-add-amount" type="number" placeholder="اكتب الدفعة الجديدة (مثال: 500)" class="w-full bg-[#0f0f23] border border-emerald-500/50 rounded-lg p-2 text-sm text-white font-bold focus:outline-none focus:border-emerald-400">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-400 mb-1">نوع الاشتراك:</label>
              <select id="swal-sub-type" class="w-full bg-[#0f0f23] border border-[#374151] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-green-500">
                <option value="كامل الكورس">كامل الكورس</option>
                <option value="شهري">شهري</option>
                <option value="محاضرة بمحاضرة">محاضرة بمحاضرة</option>
              </select>
            </div>
          </div>
        `,
        background: "#1a1a2e",
        showCancelButton: true,
        confirmButtonText: "تسجيل وقبول الطالب",
        cancelButtonText: "إلغاء",
        didOpen: () => {
          const groupSelect = document.getElementById("swal-group");
          const newGroupContainer = document.getElementById("new-group-container");
          groupSelect.addEventListener("change", (e) => {
            if (e.target.value === "new_group") {
              newGroupContainer.classList.remove("hidden");
            } else {
              newGroupContainer.classList.add("hidden");
            }
          });
        },
        preConfirm: () => {
          const groupSelect = document.getElementById("swal-group").value;
          const newGroupInput = document.getElementById("swal-new-group").value.trim();
          const totalPrice = Number(document.getElementById("swal-total-price").value) || 0;
          const basePaid = Number(document.getElementById("swal-paid-amount").value) || 0;
          const addAmount = Number(document.getElementById("swal-add-amount").value) || 0;
          const paidAmount = basePaid + addAmount;
          const subscriptionType = document.getElementById("swal-sub-type").value;

          let group = groupSelect;
          if (groupSelect === "new_group") {
            if (!newGroupInput) {
              Swal.showValidationMessage("يرجى إدخال اسم المجموعة الجديدة");
              return false;
            }
            group = newGroupInput;
          }

          return { group, totalPrice, paidAmount, subscriptionType };
        }
      });

      if (!formValues) return;

      Swal.fire({
        title: "جاري تسجيل الطالب...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
        background: "#1a1a2e",
        color: "#fff"
      });

      // Fetch sample tasks for initialTasks
      const groupQuery = query(collection(db, "students"), where("group", "==", formValues.group));
      const groupSnapshot = await getDocs(groupQuery);

      let initialTasks = [];
      if (!groupSnapshot.empty) {
        const sampleStudent = groupSnapshot.docs[0].data();
        const sampleTasks = sampleStudent.tasks || [];
        if (sampleTasks.length > 0) {
          const latestTask = sampleTasks.reduce((latest, current) => {
            return current.id > latest.id ? current : latest;
          });
          initialTasks = [{ ...latestTask, score: 0 }];
        }
      }
      if (initialTasks.length === 0) {
        initialTasks = [{ id: 1, name: "Task - 1", score: 0 }];
      }

      // If the group is new, initialize it in the lectures/groups document
      const groupExists = groupLectures && Object.prototype.hasOwnProperty.call(groupLectures, formValues.group);
      if (!groupExists) {
        const groupRef = doc(db, "lectures", "groups");
        await updateDoc(groupRef, {
          [formValues.group]: {
            count: 1,
            status: true,
          },
        });
      }

      // Add to students
      const studentDocRef = doc(db, "students", phoneClean);
      await setDoc(studentDocRef, {
        name: student.arabicName,
        englishName: student.englishName || "",
        id: Number(phoneClean),
        password: phoneClean.slice(-4),
        group: formValues.group,
        subscriptionType: formValues.subscriptionType,
        totalPrice: formValues.totalPrice,
        paidAmount: formValues.paidAmount,
        remainingAmount: formValues.totalPrice - formValues.paidAmount,
        startLecture: (groupLectures && groupLectures[formValues.group]?.count) || 1,
        attendedLectures: 1,
        reserveAttendance: 1,
        tasks: initialTasks,
        createdAt: new Date().toISOString(),
        track: student.track || "frontend",
        city: student.city || "",
        email: student.email || "",
        college: student.college || "",
        age: student.age || "",
        studyMethod: student.studyMethod || "online",
        hasExperience: student.hasExperience !== undefined ? student.hasExperience : false,
        referredBy: student.referredBy || "",
      });

      // Update NewStudents document
      const newStudentRef = doc(db, "NewStudents", student.id);
      const isFullPayment = formValues.paidAmount > 0 && formValues.paidAmount >= formValues.totalPrice;
      await updateDoc(newStudentRef, {
        totalPrice: formValues.totalPrice,
        paidAmount: formValues.paidAmount,
        paymentStatus: isFullPayment ? "تم الدفع" : (formValues.paidAmount > 0 ? "تم الدفع" : "لم يدفع"),
        group: formValues.group,
        contacted: true
      });

      // Update local state
      setStudents(prev => prev.map(s => s.id === student.id ? {
        ...s,
        totalPrice: formValues.totalPrice,
        paidAmount: formValues.paidAmount,
        paymentStatus: isFullPayment ? "تم الدفع" : (formValues.paidAmount > 0 ? "تم الدفع" : "لم يدفع"),
        group: formValues.group,
        contacted: true
      } : s));

      Swal.fire({
        title: "نجاح!",
        text: `تم تسجيل وقبول الطالب ${student.arabicName} بنجاح في مجموعة ${formValues.group}`,
        icon: "success",
        background: "#1a1a2e",
        color: "#fff"
      });

    } catch (err) {
      console.error("Error accepting student:", err);
      Swal.fire("خطأ!", "حدث خطأ أثناء قبول وتسجيل الطالب.", "error");
    }
  };

  const handleUpdatePaymentDetails = async (student) => {
    const basePaid = Number(student.paidAmount) || 0;
    const { value: formValues } = await Swal.fire({
      title: `💰 تفاصيل دفع الطالب: ${student.arabicName}`,
      html: `
        <div class="space-y-4 text-right" dir="rtl" style="color: #fff;">
          <div>
            <label class="block text-xs font-bold text-gray-400 mb-1">سعر الكورس (ج.م):</label>
            <input id="swal-total-price" type="number" value="${student.totalPrice || ""}" placeholder="مثال: 3000" class="w-full bg-[#0f0f23] border border-[#374151] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-green-500 font-bold">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-400 mb-1">إجمالي المدفوع الحالي (ج.م):</label>
            <input id="swal-paid-amount" type="number" value="${basePaid}" placeholder="مثال: 1500" class="w-full bg-[#0f0f23] border border-[#374151] rounded-lg p-2.5 text-sm text-green-400 font-bold focus:outline-none focus:border-green-500">
          </div>
          <div class="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2 text-right">
            <label class="block text-xs font-extrabold text-emerald-400 mb-1">➕ إضافة مبلغ دفعة جديدة (تراكمي):</label>
            <input id="swal-add-amount" type="number" placeholder="اكتب الدفعة الجديدة هنا (مثال: 500)" class="w-full bg-[#0f0f23] border border-emerald-500/50 rounded-lg p-2.5 text-sm text-white font-bold focus:outline-none focus:border-emerald-400">
            <div id="swal-calc-preview" class="text-xs text-emerald-300 hidden pt-1 border-t border-emerald-800/60 mt-1">
              المدفوع القديم: <strong>${basePaid} ج.م</strong> + 
              الدفعة الجديدة: <strong id="swal-add-val" class="text-emerald-400">0</strong> ج.م = 
              الإجمالي الجديد: <strong id="swal-new-total" class="text-white font-black text-sm">0</strong> ج.م
            </div>
          </div>
        </div>
      `,
      background: "#1a1a2e",
      showCancelButton: true,
      confirmButtonText: "حفظ البيانات",
      cancelButtonText: "إلغاء",
      didOpen: () => {
        const addInput = document.getElementById("swal-add-amount");
        const paidInput = document.getElementById("swal-paid-amount");
        const preview = document.getElementById("swal-calc-preview");
        const addValEl = document.getElementById("swal-add-val");
        const newTotalEl = document.getElementById("swal-new-total");

        const updateCalc = () => {
          const addVal = Number(addInput.value) || 0;
          const currentPaidVal = Number(paidInput.value) || 0;
          if (addVal > 0) {
            preview.classList.remove("hidden");
            addValEl.textContent = addVal.toLocaleString();
            newTotalEl.textContent = (currentPaidVal + addVal).toLocaleString();
          } else {
            preview.classList.add("hidden");
          }
        };

        addInput.addEventListener("input", updateCalc);
        paidInput.addEventListener("input", updateCalc);
      },
      preConfirm: () => {
        const totalPrice = Number(document.getElementById("swal-total-price").value) || 0;
        const basePaidVal = Number(document.getElementById("swal-paid-amount").value) || 0;
        const addAmount = Number(document.getElementById("swal-add-amount").value) || 0;
        const paidAmount = basePaidVal + addAmount;
        return { totalPrice, paidAmount };
      }
    });

    if (!formValues) return;

    try {
      const newStudentRef = doc(db, "NewStudents", student.id);
      const isFullPayment = formValues.paidAmount > 0 && formValues.paidAmount >= formValues.totalPrice;
      const status = isFullPayment ? "تم الدفع" : (formValues.paidAmount > 0 ? "تم الدفع" : "لم يدفع");
      
      await updateDoc(newStudentRef, {
        totalPrice: formValues.totalPrice,
        paidAmount: formValues.paidAmount,
        paymentStatus: status,
      });

      // Update local state
      setStudents(prev => prev.map(s => s.id === student.id ? {
        ...s,
        totalPrice: formValues.totalPrice,
        paidAmount: formValues.paidAmount,
        paymentStatus: status,
      } : s));

      // If the student is already registered in 'students' collection (with the same phone number), update them there too!
      const phoneClean = student.phone.trim();
      const existingQuery = query(collection(db, "students"), where("id", "==", Number(phoneClean)));
      const existingSnap = await getDocs(existingQuery);
      if (!existingSnap.empty) {
        const studentRef = existingSnap.docs[0].ref;
        await updateDoc(studentRef, {
          totalPrice: formValues.totalPrice,
          paidAmount: formValues.paidAmount,
          remainingAmount: formValues.totalPrice - formValues.paidAmount,
        });
      }

      Swal.fire({
        title: "تم الحفظ!",
        text: "تم تحديث سعر الكورس والمدفوع بنجاح",
        icon: "success",
        background: "#1a1a2e",
        color: "#fff"
      });
    } catch (err) {
      console.error(err);
      Swal.fire("خطأ!", "حدث خطأ أثناء حفظ تفاصيل الدفع", "error");
    }
  };

  // ── split active vs rejected ────────────────────────────────────────────────
  const { activeStudents, rejectedStudents } = useMemo(() => {
    const rejected = students.filter((s) => String(s.paymentStatus || "").startsWith("رفض"));
    const active = students.filter((s) => !String(s.paymentStatus || "").startsWith("رفض"));
    return { activeStudents: active, rejectedStudents: rejected };
  }, [students]);

  // ── stats (only active students) ────────────────────────────────────────────
  const stats = useMemo(() => {
    const today = activeStudents.filter((s) => s.daysSince <= 1).length;
    const week = activeStudents.filter((s) => s.daysSince <= 7).length;
    const notContacted = activeStudents.filter((s) => !s.contacted).length;
    const paid = activeStudents.filter((s) => s.paymentStatus === "تم الدفع").length;
    const online = activeStudents.filter((s) => s.studyMethod === "online").length;
    const offline = activeStudents.filter((s) => s.studyMethod === "offline").length;
    const frontend = activeStudents.filter((s) => s.track === "frontend").length;
    const backend = activeStudents.filter((s) => s.track === "backend").length;
    const registered = activeStudents.filter((s) => s.group).length;
    const unregistered = activeStudents.filter((s) => !s.group).length;
    return { total: activeStudents.length, today, week, notContacted, paid, online, offline, frontend, backend, registered, unregistered };
  }, [activeStudents]);

  // ── filtered & sorted (active only) ─────────────────────────────────────
  const filtered = useMemo(() => {
    let list = activeStudents.filter((s) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !q ||
        s.arabicName?.toLowerCase().includes(q) ||
        s.englishName?.toLowerCase().includes(q) ||
        s.phone?.includes(q) ||
        s.referredBy?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.college?.toLowerCase().includes(q);

      const matchTrack = !filterTrack || s.track === filterTrack;
      const matchMethod = !filterMethod || s.studyMethod === filterMethod;
      const matchContacted =
        filterContacted === ""
          ? true
          : filterContacted === "no"
          ? !s.contacted
          : !!s.contacted;
      const matchPayment = !filterPayment || s.paymentStatus === filterPayment;
      const matchAge =
        filterAge === ""
          ? true
          : filterAge === "recent"
          ? s.daysSince <= 7
          : s.daysSince > 7;
      const matchGroup =
        filterGroup === ""
          ? true
          : filterGroup === "registered"
          ? !!s.group
          : !s.group;

      return matchSearch && matchTrack && matchMethod && matchContacted && matchPayment && matchAge && matchGroup;
    });

    // sort
    if (sortBy === "newest") list = [...list].sort((a, b) => a.daysSince - b.daysSince);
    else if (sortBy === "oldest") list = [...list].sort((a, b) => b.daysSince - a.daysSince);
    else if (sortBy === "notContacted")
      list = [...list].sort((a, b) => (a.contacted ? 1 : -1) - (b.contacted ? 1 : -1));

    return list;
  }, [students, searchTerm, filterTrack, filterMethod, filterContacted, filterPayment, filterAge, filterGroup, sortBy]);

  const resetFilters = () => {
    setSearchTerm("");
    setFilterTrack("");
    setFilterMethod("");
    setFilterContacted("");
    setFilterPayment("");
    setFilterAge("");
    setFilterGroup("");
    setSortBy("newest");
  };

  const hasActiveFilter =
    searchTerm || filterTrack || filterMethod || filterContacted || filterPayment || filterAge || filterGroup;

  // ── loading / error ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a1a" }}
        className="flex flex-col items-center justify-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-green-500 animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" style={{ animationDirection: "reverse" }} />
        </div>
        <p className="text-gray-400 text-sm animate-pulse">جاري تحميل بيانات الطلاب...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a1a" }}
        className="flex items-center justify-center">
        <div className="rounded-2xl p-6 text-red-400 text-center"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          ⚠️ {error}
        </div>
      </div>
    );
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div
      style={{ minHeight: "100vh", background: "linear-gradient(135deg,#0a0a1a 0%,#0d0d23 50%,#0a0f1a 100%)" }}
      className="py-8 px-4 sm:px-6 lg:px-8"
      dir="rtl"
    >
      {/* ── Header ── */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-extrabold mb-1"
          style={{ background: "linear-gradient(90deg,#22c55e,#3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          🎓 الطلاب الجدد
        </h1>
        <p className="text-gray-500 text-sm">إدارة ومتابعة طلبات الانضمام لكورس CodaX</p>
      </div>

      {/* ── Tabs ── */}
      <div className="flex justify-center gap-3 mb-6">
        <button
          onClick={() => { setActiveTab("active"); resetFilters(); }}
          className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
          style={{
            background: activeTab === "active" ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.04)",
            border: activeTab === "active" ? "1.5px solid rgba(34,197,94,0.5)" : "1.5px solid rgba(255,255,255,0.08)",
            color: activeTab === "active" ? "#22c55e" : "#6b7280",
            boxShadow: activeTab === "active" ? "0 0 16px rgba(34,197,94,0.2)" : "none",
          }}
        >
          ✅ الطلاب النشطون
          <span className="mr-2 px-2 py-0.5 rounded-full text-xs font-black"
            style={{ background: "rgba(34,197,94,0.2)", color: "#22c55e" }}>
            {activeStudents.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("rejected")}
          className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
          style={{
            background: activeTab === "rejected" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.04)",
            border: activeTab === "rejected" ? "1.5px solid rgba(239,68,68,0.5)" : "1.5px solid rgba(255,255,255,0.08)",
            color: activeTab === "rejected" ? "#ef4444" : "#6b7280",
            boxShadow: activeTab === "rejected" ? "0 0 16px rgba(239,68,68,0.2)" : "none",
          }}
        >
          ❌ مرفوضون
          {rejectedStudents.length > 0 && (
            <span className="mr-2 px-2 py-0.5 rounded-full text-xs font-black"
              style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444" }}>
              {rejectedStudents.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Stats (active tab only) ── */}
      {activeTab === "active" && (
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        <StatCard label="إجمالي الطلاب" value={stats.total} color="#a855f7" icon="📋"
          active={!filterContacted && !filterTrack && !filterMethod && !filterAge && !filterPayment && !filterGroup}
          onClick={resetFilters} />
        <StatCard label="اليوم" value={stats.today} color="#22c55e" icon="🌟"
          active={filterAge === "today"}
          onClick={() => { resetFilters(); setFilterAge("recent"); setSortBy("newest"); }} />
        <StatCard label="آخر 7 أيام" value={stats.week} color="#3b82f6" icon="📅"
          active={filterAge === "recent"}
          onClick={() => { setFilterAge("recent"); }} />
        <StatCard label="لم يُتواصل" value={stats.notContacted} color="#ef4444" icon="⚡"
          active={filterContacted === "no"}
          onClick={() => setFilterContacted((p) => (p === "no" ? "" : "no"))} />
        <StatCard label="تم الدفع" value={stats.paid} color="#f59e0b" icon="💰"
          active={filterPayment === "تم الدفع"}
          onClick={() => setFilterPayment((p) => (p === "تم الدفع" ? "" : "تم الدفع"))} />
        <StatCard label="✅ مسجلين" value={stats.registered} color="#22c55e" icon="🎓"
          active={filterGroup === "registered"}
          onClick={() => setFilterGroup((p) => (p === "registered" ? "" : "registered"))} />
        <StatCard label="⏳ في الانتظار" value={stats.unregistered} color="#f97316" icon="⏳"
          active={filterGroup === "unregistered"}
          onClick={() => setFilterGroup((p) => (p === "unregistered" ? "" : "unregistered"))} />
        <StatCard label="أونلاين" value={stats.online} color="#06b6d4" icon="🌐"
          active={filterMethod === "online"}
          onClick={() => setFilterMethod((p) => (p === "online" ? "" : "online"))} />
        <StatCard label="حضوري" value={stats.offline} color="#f97316" icon="🏫"
          active={filterMethod === "offline"}
          onClick={() => setFilterMethod((p) => (p === "offline" ? "" : "offline"))} />
        <StatCard label="Frontend" value={stats.frontend} color="#f97316" icon="🎨"
          active={filterTrack === "frontend"}
          onClick={() => setFilterTrack((p) => (p === "frontend" ? "" : "frontend"))} />
        <StatCard label="Backend" value={stats.backend} color="#3b82f6" icon="⚙️"
          active={filterTrack === "backend"}
          onClick={() => setFilterTrack((p) => (p === "backend" ? "" : "backend"))} />
      </div>
      )}

      {/* ── Filters Bar ── */}
      <div
        className="rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Icon d={Icons.search} size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="ابحث بالاسم، الهاتف، المدينة، الكلية..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl pr-9 pl-3 py-2 text-sm text-white outline-none placeholder-gray-600"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-xl px-3 py-2 text-sm text-white outline-none cursor-pointer"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <option value="newest" style={{ background: "#1a1a2e" }}>🕐 الأحدث أولاً</option>
          <option value="oldest" style={{ background: "#1a1a2e" }}>📅 الأقدم أولاً</option>
          <option value="notContacted" style={{ background: "#1a1a2e" }}>⚡ غير المتواصل أولاً</option>
        </select>

        {/* Contacted filter */}
        <div className="flex gap-1">
          {[
            { val: "", label: "الكل" },
            { val: "no", label: "⚡ لم يُتواصل" },
            { val: "yes", label: "✅ تم التواصل" },
          ].map((o) => (
            <button
              key={o.val}
              onClick={() => setFilterContacted(o.val)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
              style={{
                background: filterContacted === o.val ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.05)",
                border: filterContacted === o.val ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.1)",
                color: filterContacted === o.val ? "#ef4444" : "#9ca3af",
              }}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* Track filter */}
        <div className="flex gap-1">
          {[
            { val: "", label: "كل المسارات" },
            { val: "frontend", label: "🎨 Frontend" },
            { val: "backend", label: "⚙️ Backend" },
          ].map((o) => (
            <button
              key={o.val}
              onClick={() => setFilterTrack(o.val)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
              style={{
                background: filterTrack === o.val ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.05)",
                border: filterTrack === o.val ? "1px solid rgba(249,115,22,0.5)" : "1px solid rgba(255,255,255,0.1)",
                color: filterTrack === o.val ? "#f97316" : "#9ca3af",
              }}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* Method filter */}
        <div className="flex gap-1">
          {[
            { val: "", label: "كل الطرق" },
            { val: "online", label: "🌐 أونلاين" },
            { val: "offline", label: "🏫 حضوري" },
          ].map((o) => (
            <button
              key={o.val}
              onClick={() => setFilterMethod(o.val)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
              style={{
                background: filterMethod === o.val ? "rgba(6,182,212,0.2)" : "rgba(255,255,255,0.05)",
                border: filterMethod === o.val ? "1px solid rgba(6,182,212,0.5)" : "1px solid rgba(255,255,255,0.1)",
                color: filterMethod === o.val ? "#06b6d4" : "#9ca3af",
              }}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* Payment filter */}
        <select
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value)}
          className="rounded-xl px-3 py-2 text-sm outline-none cursor-pointer"
          style={{
            background: filterPayment ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.05)",
            border: filterPayment ? "1px solid rgba(245,158,11,0.4)" : "1px solid rgba(255,255,255,0.1)",
            color: filterPayment ? "#f59e0b" : "#9ca3af",
          }}
        >
          <option value="" style={{ background: "#1a1a2e", color: "#9ca3af" }}>💳 كل حالات الدفع</option>
          {paymentOptions.map((o) => (
            <option key={o.value} value={o.value} style={{ background: "#1a1a2e", color: "#fff" }}>
              {o.label}
            </option>
          ))}
        </select>

        {/* Reset */}
        {hasActiveFilter && (
          <button
            onClick={resetFilters}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}
          >
            ✕ مسح الفلاتر
          </button>
        )}
      </div>

      {/* ── Results count ── */}
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-gray-500 text-sm">
          عرض <span className="text-white font-bold">{filtered.length}</span> من{" "}
          <span className="text-white font-bold">{students.length}</span> طالب
        </span>
        {filterContacted === "no" && (
          <span className="text-xs px-3 py-1 rounded-full font-semibold animate-pulse"
            style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
            ⚡ يحتاجون تواصل عاجل
          </span>
        )}
      </div>

      {/* ── Cards Grid: Active Tab ── */}
      {activeTab === "active" && (
        filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                onToggleContacted={toggleContacted}
                onPayment={updatePaymentStatus}
                onDelete={handleDeleteStudent}
                onNote={handleNote}
                onAccept={handleAcceptAndRegister}
                onUpdatePayment={handleUpdatePaymentDetails}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="text-6xl opacity-30">🔍</div>
            <p className="text-gray-500 text-lg">لا توجد نتائج مطابقة</p>
            <button onClick={resetFilters}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
              style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#818cf8" }}>
              مسح الفلاتر وعرض الكل
            </button>
          </div>
        )
      )}

      {/* ── Rejected Tab ── */}
      {activeTab === "rejected" && (
        <div>
          {/* Info banner */}
          <div className="mb-5 p-4 rounded-2xl flex items-center gap-3"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <span className="text-2xl">❌</span>
            <div>
              <p className="text-red-400 font-bold text-sm">الطلاب المرفوضون</p>
              <p className="text-gray-500 text-xs mt-0.5">
                هؤلاء الطلاب مستبعدون من الإحصائيات والعمليات الرئيسية. يمكنهم التسجيل مجدداً في أي وقت.
              </p>
            </div>
          </div>

          {rejectedStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="text-6xl opacity-30">✅</div>
              <p className="text-gray-500 text-lg">لا يوجد طلاب مرفوضون</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {rejectedStudents.map((student) => (
                <div key={student.id}
                  className="rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden"
                  style={{ border: "1.5px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.04)" }}>
                  {/* Glow strip */}
                  <div style={{ background: "#ef4444", opacity: 0.15 }}
                    className="absolute top-0 right-0 w-1 h-full rounded-l-full" />

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-base">{student.arabicName}</span>
                      <span className="text-gray-400 text-xs">{student.phone}</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                      style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
                      {student.paymentStatus}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500">
                    📅 {formatDate(student.registrationDate)}
                    {student.note && <p className="mt-1 text-yellow-400">📝 {student.note}</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-1">
                    {/* Restore to active */}
                    <button
                      onClick={() => updatePaymentStatus(student.id, "لم يدفع")}
                      className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
                      style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e" }}
                    >
                      ↩ استعادة
                    </button>
                    {/* Delete permanently */}
                    <button
                      onClick={() => handleDeleteStudent(student.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
                      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}
                    >
                      <Icon d={Icons.trash} size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(StudentsList);
