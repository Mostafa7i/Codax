"use client";
import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/app/services/firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  DollarSign,
  CheckCircle,
  Edit3,
  Save,
  X,
  Search,
  TrendingUp,
  RefreshCw,
  Award,
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertTriangle,
  UserPlus,
  UserCheck,
  Copy,
  Check,
  Reply,
  Send,
} from "lucide-react";

// ── helpers ────────────────────────────────────────────────────────────
const fmtDate = (ts) => {
  if (!ts) return "-";
  const d = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
};
const fmtMoney = (n) =>
  new Intl.NumberFormat("ar-EG").format(n || 0) + " ج.م";

const normalize = (s) => (s || "").trim().replace(/\s+/g, " ").toLowerCase();

// ── Rep Card ───────────────────────────────────────────────────────────
const RepCard = ({ rep, referrals, onSaveAmount, onSavePaidOut, onDelete, allStudents, onAssignStudent }) => {
  const [expanded, setExpanded] = useState(false);
  const [editAmount, setEditAmount] = useState(false);
  const [editPaid, setEditPaid] = useState(false);
  const [amountVal, setAmountVal] = useState(rep.amountPerReferral ?? 0);
  const [paidVal, setPaidVal] = useState(rep.paidOut ?? 0);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // ── Manual Assignment ──
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSearch, setAssignSearch] = useState("");
  const [assigning, setAssigning] = useState(null); // student id being assigned
  const [copied, setCopied] = useState(false);

  const handleCopyCashNumber = (e) => {
    e.stopPropagation();
    if (!rep.vodafoneCash) return;
    navigator.clipboard.writeText(rep.vodafoneCash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const paidStudents = referrals.filter((s) => s.paymentStatus === "تم الدفع").length;
  const totalDue = referrals.length * (rep.amountPerReferral || 0);
  const remaining = totalDue - (rep.paidOut || 0);

  const handleSaveAmount = async () => {
    setSaving(true);
    await onSaveAmount(rep.uid, Number(amountVal));
    setEditAmount(false);
    setSaving(false);
  };

  const handleSavePaid = async () => {
    setSaving(true);
    await onSavePaidOut(rep.uid, Number(paidVal));
    setEditPaid(false);
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(rep.uid);
    setDeleting(false);
    setConfirmDelete(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${remaining > 0 ? "rgba(245,158,11,0.25)" : "rgba(34,197,94,0.2)"}`,
      }}
    >
      {/* ── Header row ── */}
      <div
        className="flex items-center justify-between gap-3 p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded((p) => !p)}
      >
        {/* Avatar + name */}
        <div className="flex items-center gap-3">
          {rep.photoURL ? (
            <img src={rep.photoURL} alt="" className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0"
              style={{ background: "rgba(99,102,241,0.2)", color: "#818cf8" }}
            >
              {(rep.name || "S")[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-bold text-white text-sm">{rep.name || "—"}</p>
            <p className="text-gray-500 text-xs truncate max-w-[160px]">{rep.email}</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <span
            className="text-xs px-2.5 py-1 rounded-full font-bold"
            style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.3)" }}
          >
            {referrals.length} ترشيح
          </span>
          <span
            className="text-xs px-2.5 py-1 rounded-full font-bold"
            style={{
              background: remaining > 0 ? "rgba(245,158,11,0.12)" : "rgba(34,197,94,0.12)",
              color: remaining > 0 ? "#f59e0b" : "#22c55e",
              border: `1px solid ${remaining > 0 ? "rgba(245,158,11,0.3)" : "rgba(34,197,94,0.3)"}`,
            }}
          >
            {remaining > 0 ? "⏳ " + fmtMoney(remaining) : "✅ محصّل الكل"}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
      </div>

      {/* ── Expanded body ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden", borderTop: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="p-4 space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "إجمالي المسجلين", val: referrals.length, color: "#6366f1" },
                  { label: "دفعوا الكورس", val: paidStudents, color: "#22c55e" },
                  { label: "إجمالي المستحق", val: fmtMoney(totalDue), color: "#f59e0b" },
                  { label: "تم صرفه", val: fmtMoney(rep.paidOut || 0), color: "#a855f7" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl p-3 flex flex-col gap-1"
                    style={{ background: `${s.color}10`, border: `1px solid ${s.color}25` }}
                  >
                    <span className="text-lg font-extrabold" style={{ color: s.color }}>{s.val}</span>
                    <span className="text-xs text-gray-500">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Amount per referral editor */}
              <div
                className="rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap"
                style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.2)" }}
              >
                <div className="flex items-center gap-2 text-sm text-indigo-300">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-semibold">مبلغ الترشيح (لكل طالب)</span>
                </div>
                {editAmount ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={amountVal}
                      onChange={(e) => setAmountVal(e.target.value)}
                      className="w-28 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(99,102,241,0.5)" }}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveAmount}
                      disabled={saving}
                      className="p-1.5 rounded-lg text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
                      style={{ background: "rgba(34,197,94,0.15)" }}
                    >
                      {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => { setEditAmount(false); setAmountVal(rep.amountPerReferral ?? 0); }}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                      style={{ background: "rgba(239,68,68,0.1)" }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-base">{fmtMoney(rep.amountPerReferral || 0)}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditAmount(true); }}
                      className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-300 transition-colors"
                      style={{ background: "rgba(99,102,241,0.15)" }}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Paid out editor */}
              <div
                className="rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap"
                style={{
                  background: "rgba(34,197,94,0.06)",
                  border: `1px solid ${remaining > 0 ? "rgba(245,158,11,0.25)" : "rgba(34,197,94,0.25)"}`,
                }}
              >
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-semibold">المبلغ المصروف (تم الدفع فعلاً)</span>
                </div>
                {editPaid ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max={totalDue}
                      value={paidVal}
                      onChange={(e) => setPaidVal(e.target.value)}
                      className="w-32 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(34,197,94,0.5)" }}
                      autoFocus
                    />
                    <button
                      onClick={handleSavePaid}
                      disabled={saving}
                      className="p-1.5 rounded-lg text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
                      style={{ background: "rgba(34,197,94,0.15)" }}
                    >
                      {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => { setEditPaid(false); setPaidVal(rep.paidOut ?? 0); }}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                      style={{ background: "rgba(239,68,68,0.1)" }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">{fmtMoney(rep.paidOut || 0)}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditPaid(true); }}
                      className="p-1.5 rounded-lg text-green-400 hover:text-green-300 transition-colors"
                      style={{ background: "rgba(34,197,94,0.15)" }}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Vodafone Cash Payout Number */}
              <div
                className="rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap"
                style={{
                  background: "rgba(239,68,68,0.04)",
                  border: rep.vodafoneCash ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(245,158,11,0.25)",
                }}
              >
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="text-base">📱</span>
                  <span className="font-semibold text-gray-400">رقم فودافون كاش:</span>
                  {rep.vodafoneCash ? (
                    <span className="text-red-400 font-mono font-bold text-base tracking-wider" dir="ltr">{rep.vodafoneCash}</span>
                  ) : (
                    <span className="text-amber-500 font-semibold text-xs">لم يتم إدخال رقم بعد ⚠️</span>
                  )}
                </div>
                {rep.vodafoneCash && (
                  <button
                    onClick={handleCopyCashNumber}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                    style={{ background: "rgba(99,102,241,0.15)" }}
                  >
                    {copied ? (
                      <><Check className="w-3.5 h-3.5 text-green-400" /> تم النسخ</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> نسخ الرقم</>
                    )}
                  </button>
                )}
              </div>

              {/* ── Manual Student Assignment ── */}
              <div
                className="rounded-xl overflow-hidden"
                style={{ background: "rgba(6,182,212,0.05)", border: "1px solid rgba(6,182,212,0.2)" }}
              >
                {/* Header */}
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-cyan-400 font-semibold hover:bg-white/[0.02] transition-colors"
                  onClick={() => setAssignOpen((p) => !p)}
                >
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    <span>إضافة طالب يدوياً</span>
                  </div>
                  {assignOpen
                    ? <ChevronUp className="w-4 h-4 text-gray-500" />
                    : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </button>

                <AnimatePresence>
                  {assignOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden", borderTop: "1px solid rgba(6,182,212,0.15)" }}
                    >
                      <div className="p-3 space-y-2">
                        {/* Search */}
                        <div className="relative">
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                          <input
                            type="text"
                            placeholder="ابحث باسم الطالب..."
                            value={assignSearch}
                            onChange={(e) => setAssignSearch(e.target.value)}
                            className="w-full rounded-lg pr-9 pl-3 py-2 text-xs text-white outline-none"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                          />
                        </div>

                        {/* Students list */}
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {(() => {
                            const referralIds = new Set(referrals.map((r) => r.id));
                            const q = assignSearch.toLowerCase();
                            const candidates = allStudents.filter((s) => {
                              if (referralIds.has(s.id)) return false; // already in this rep
                              if (!q) return true;
                              return (
                                (s.arabicName || "").toLowerCase().includes(q) ||
                                (s.email || "").toLowerCase().includes(q)
                              );
                            });
                            if (candidates.length === 0)
                              return (
                                <p className="text-center text-gray-600 text-xs py-4">
                                  {assignSearch ? "لا توجد نتائج" : "جميع الطلاب مضافون بالفعل"}
                                </p>
                              );
                            return candidates.slice(0, 30).map((s) => (
                              <div
                                key={s.id}
                                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs"
                                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                              >
                                <div className="flex flex-col">
                                  <span className="text-gray-200 font-medium">{s.arabicName || s.email}</span>
                                  {s.referredBy && (
                                    <span className="text-amber-500 text-[10px]">مضاف لـ: {s.referredBy}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => onAssignStudent(s.id, rep.name, s)}
                                  disabled={assigning === s.id}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all disabled:opacity-50 flex-shrink-0"
                                  style={{
                                    background: "rgba(6,182,212,0.15)",
                                    border: "1px solid rgba(6,182,212,0.3)",
                                    color: "#22d3ee",
                                  }}
                                >
                                  {assigning === s.id
                                    ? <RefreshCw className="w-3 h-3 animate-spin" />
                                    : <><UserCheck className="w-3 h-3" /> إضافة</>}
                                </button>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Delete Section */}
              <div
                className="rounded-xl p-4"
                style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                {!confirmDelete ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <Trash2 className="w-4 h-4" />
                      <span className="font-semibold">حذف حساب السيليز</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 hover:text-red-300 transition-all"
                      style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> حذف
                    </button>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-2 text-amber-400">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <p className="text-xs font-semibold">
                        هل أنت متأكد من حذف حساب <span className="text-white">{rep.name}</span>؟ لا يمكن التراجع عن هذا الإجراء.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", boxShadow: "0 2px 8px rgba(239,68,68,0.4)" }}
                      >
                        {deleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        {deleting ? "جاري الحذف..." : "تأكيد الحذف"}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="px-4 py-2 rounded-lg text-xs font-bold text-gray-400 hover:text-white transition-colors"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                      >
                        إلغاء
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Referrals mini-list */}
              {referrals.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> الطلاب المسجلين عن طريقه
                  </p>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {referrals.map((s, i) => {
                      const paid = s.paymentStatus === "تم الدفع";
                      const rejected = s.paymentStatus?.startsWith("رفض");
                      const hasCustomReason = s.paymentStatus?.startsWith("رفض:");
                      const customReason = hasCustomReason ? s.paymentStatus.replace("رفض: ", "") : null;

                      // color & label for payment
                      let payColor, payLabel;
                      if (paid) { payColor = "#22c55e"; payLabel = "✅ دفع"; }
                      else if (hasCustomReason) { payColor = "#a855f7"; payLabel = "❍️ رفض"; }
                      else if (s.paymentStatus === "رفض لسبب اخر") { payColor = "#6b7280"; payLabel = "❌ رفض"; }
                      else if (s.paymentStatus === "المواعيد غير مناسبة") { payColor = "#f59e0b"; payLabel = "⏳ مواعيد"; }
                      else { payColor = "#ef4444"; payLabel = "⛔ لم يدفع"; }

                      return (
                        <div
                          key={s.id}
                          className="flex flex-col gap-1 px-3 py-2 rounded-lg text-xs"
                          style={{
                            background: s.contacted ? "rgba(34,197,94,0.04)" : "rgba(255,255,255,0.03)",
                            border: s.contacted
                              ? "1px solid rgba(34,197,94,0.15)"
                              : rejected
                              ? `1px solid ${payColor}25`
                              : "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          {/* Row 1: name + track + date */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">{i + 1}.</span>
                              <span className="text-gray-200 font-medium">{s.arabicName}</span>
                              <span
                                className="px-1.5 py-0.5 rounded-full font-semibold text-[10px]"
                                style={{
                                  background: s.track === "frontend" ? "rgba(249,115,22,0.15)" : "rgba(59,130,246,0.15)",
                                  color: s.track === "frontend" ? "#f97316" : "#3b82f6",
                                }}
                              >
                                {s.track === "frontend" ? "FE" : "BE"}
                              </span>
                            </div>
                            <span className="text-gray-600 text-[10px]">{fmtDate(s.registrationDate)}</span>
                          </div>

                          {/* Row 2: contact + payment status */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Contacted badge */}
                            <span
                              className="px-2 py-0.5 rounded-full font-bold text-[10px]"
                              style={{
                                background: s.contacted ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.1)",
                                color: s.contacted ? "#22c55e" : "#ef4444",
                                border: `1px solid ${s.contacted ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.2)"}`,
                              }}
                            >
                              {s.contacted ? "✅ تم التواصل" : "⚡ لم يُتواصل"}
                            </span>

                            {/* Payment badge */}
                            <span
                              className="px-2 py-0.5 rounded-full font-bold text-[10px]"
                              style={{
                                background: `${payColor}18`,
                                color: payColor,
                                border: `1px solid ${payColor}33`,
                              }}
                            >
                              {payLabel}
                            </span>

                            {/* Phone link */}
                            {s.phone && (
                              <a
                                href={`https://wa.me/${s.phone.replace(/\D/g, "").replace(/^0/, "20")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-green-400 hover:text-green-300 transition-colors underline"
                              >
                                📱 {s.phone}
                              </a>
                            )}
                          </div>

                          {/* Custom rejection reason */}
                          {hasCustomReason && (
                            <div
                              className="text-[10px] text-purple-300 italic px-1"
                              style={{ borderRight: "2px solid rgba(168,85,247,0.5)", paddingRight: 6 }}
                            >
                              ✍️ سبب الرفض: {customReason}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Complaint Card ─────────────────────────────────────────────────────
const ComplaintCard = ({ c, dateVal, onResolve, onDelete, onReply }) => {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState(c.adminReply || "");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    await onReply(c.id, replyText);
    setSending(false);
    setShowReply(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: c.resolved ? "rgba(255,255,255,0.02)" : "rgba(236,72,153,0.04)",
        border: c.resolved ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(236,72,153,0.18)",
      }}
    >
      {/* ── Top row ── */}
      <div className="p-5 flex flex-col md:flex-row justify-between gap-4">
        <div className="space-y-2 flex-1">
          {/* meta */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-sm">{c.repName}</span>
            <span className="text-xs text-gray-500">• {c.repEmail}</span>
            <span className="text-[10px] text-gray-600">• {fmtDate(dateVal)}</span>
            {c.resolved ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                ✓ تم الحل
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                ⏳ قيد المراجعة
              </span>
            )}
            {c.adminReply && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                💬 تم الرد
              </span>
            )}
          </div>

          {/* complaint text */}
          <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
            {c.text}
          </p>

          {/* existing reply */}
          {c.adminReply && (
            <div
              className="mt-2 px-3 py-2.5 rounded-xl text-xs text-green-300 leading-relaxed whitespace-pre-wrap"
              style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)", borderRight: "3px solid rgba(34,197,94,0.5)" }}
            >
              <span className="font-bold text-green-400 block mb-1 text-[10px]">↩ رد الأدمن:</span>
              {c.adminReply}
            </div>
          )}
        </div>

        {/* actions */}
        <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-start pt-1">
          {/* Reply toggle */}
          <button
            onClick={() => { setShowReply((p) => !p); setReplyText(c.adminReply || ""); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
            style={{
              background: showReply ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.35)",
              color: "#818cf8",
            }}
          >
            <Reply className="w-3.5 h-3.5" />
            {c.adminReply ? "تعديل الرد" : "رد"}
          </button>

          {/* Resolve toggle */}
          {!c.resolved ? (
            <button
              onClick={() => onResolve(c.id, true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", boxShadow: "0 2px 8px rgba(34,197,94,0.3)" }}
            >
              ✓ محلول
            </button>
          ) : (
            <button
              onClick={() => onResolve(c.id, false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              إعادة فتح
            </button>
          )}

          {/* Delete */}
          <button
            onClick={() => onDelete(c.id)}
            className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            title="حذف الشكوى"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Reply textarea (expandable) ── */}
      <AnimatePresence>
        {showReply && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden", borderTop: "1px solid rgba(99,102,241,0.15)" }}
          >
            <div className="p-4 space-y-3" style={{ background: "rgba(99,102,241,0.05)" }}>
              <p className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                <Reply className="w-3.5 h-3.5" />
                اكتب ردك على شكوى <span className="text-white">{c.repName}</span>
              </p>
              <textarea
                rows={3}
                autoFocus
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="اكتب ردك هنا... سيظهر للمندوب في لوحة التحكم الخاصة به"
                className="w-full rounded-xl p-3 text-xs text-white outline-none resize-none placeholder-gray-600"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(99,102,241,0.3)" }}
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowReply(false)}
                  className="px-4 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending || !replyText.trim()}
                  className="flex items-center gap-1.5 px-5 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", boxShadow: "0 2px 10px rgba(99,102,241,0.4)" }}
                >
                  {sending
                    ? <><RefreshCw className="w-3 h-3 animate-spin" /> جاري الإرسال...</>
                    : <><Send className="w-3 h-3" /> إرسال الرد</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────
const SalesAdminControl = () => {
  const [reps, setReps] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  
  // التبويب النشط: "reps" أو "complaints"
  const [activeTab, setActiveTab] = useState("reps");

  const fetchAll = async () => {
    try {
      // جلب المندوبين
      const rSnap = await getDocs(collection(db, "salesReps"));
      const repsList = rSnap.docs.map((d) => ({ uid: d.id, ...d.data() }));
      setReps(repsList);

      // جلب الطلاب الجدد
      const sSnap = await getDocs(collection(db, "NewStudents"));
      setAllStudents(sSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      // جلب الشكاوى
      const cSnap = await getDocs(query(collection(db, "salesComplaints"), orderBy("createdAt", "desc")));
      setComplaints(cSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  // ── map referrals per rep ──
  const repReferrals = useMemo(() => {
    const map = {};
    reps.forEach((rep) => {
      const repName = normalize(rep.name);
      const firstName = repName.split(" ")[0];
      map[rep.uid] = allStudents.filter((s) => {
        const refBy = normalize(s.referredBy || "");
        return (
          refBy &&
          repName &&
          (refBy.includes(repName) ||
            repName.includes(refBy) ||
            (firstName && firstName.length >= 3 && refBy.includes(firstName)))
        );
      });
    });
    return map;
  }, [reps, allStudents]);

  // ── global stats ──
  const totalReferrals = useMemo(
    () => Object.values(repReferrals).reduce((s, arr) => s + arr.length, 0),
    [repReferrals]
  );
  const totalDue = useMemo(
    () => reps.reduce((s, r) => s + (repReferrals[r.uid]?.length || 0) * (r.amountPerReferral || 0), 0),
    [reps, repReferrals]
  );
  const totalPaid = useMemo(
    () => reps.reduce((s, r) => s + (r.paidOut || 0), 0),
    [reps]
  );

  // ── Firestore updates ──
  const handleSaveAmount = async (uid, amount) => {
    await updateDoc(doc(db, "salesReps", uid), { amountPerReferral: amount });
    setReps((prev) =>
      prev.map((r) => (r.uid === uid ? { ...r, amountPerReferral: amount } : r))
    );
  };

  const handleSavePaidOut = async (uid, paidOut) => {
    await updateDoc(doc(db, "salesReps", uid), { paidOut });
    setReps((prev) =>
      prev.map((r) => (r.uid === uid ? { ...r, paidOut } : r))
    );
  };

  const handleDeleteRep = async (uid) => {
    try {
      await deleteDoc(doc(db, "salesReps", uid));
      setReps((prev) => prev.filter((r) => r.uid !== uid));
    } catch (e) {
      console.error("خطأ في الحذف:", e);
    }
  };

  // إضافة طالب يدوياً لحساب سيليز
  const handleAssignStudent = async (studentId, repName, student) => {
    try {
      await updateDoc(doc(db, "NewStudents", studentId), { referredBy: repName });
      // تحديث الحالة محلياً
      setAllStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, referredBy: repName } : s))
      );
    } catch (e) {
      console.error("خطأ في التعيين:", e);
    }
  };

  // حل شكوى
  const handleResolveComplaint = async (id, resolvedState) => {
    try {
      await updateDoc(doc(db, "salesComplaints", id), { resolved: resolvedState });
      setComplaints((prev) =>
        prev.map((c) => (c.id === id ? { ...c, resolved: resolvedState } : c))
      );
    } catch (e) {
      console.error("خطأ في حل الشكوى:", e);
    }
  };

  // حذف شكوى
  const handleDeleteComplaint = async (id) => {
    try {
      await deleteDoc(doc(db, "salesComplaints", id));
      setComplaints((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error("خطأ في حذف الشكوى:", e);
    }
  };

  // الرد على شكوى
  const handleReplyComplaint = async (id, replyText) => {
    try {
      await updateDoc(doc(db, "salesComplaints", id), {
        adminReply: replyText.trim(),
        repliedAt: serverTimestamp(),
        resolved: true,
      });
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, adminReply: replyText.trim(), resolved: true } : c
        )
      );
    } catch (e) {
      console.error("خطأ في إرسال الرد:", e);
    }
  };

  // ── filtered list ──
  const filteredReps = useMemo(() => {
    if (!search.trim()) return reps;
    const q = search.toLowerCase();
    return reps.filter(
      (r) =>
        (r.name || "").toLowerCase().includes(q) ||
        (r.email || "").toLowerCase().includes(q)
    );
  }, [reps, search]);

  const unresolvedCount = useMemo(
    () => complaints.filter((c) => !c.resolved).length,
    [complaints]
  );

  if (loading) {
    return (
      <div
        className="min-h-[60vh] flex items-center justify-center"
        style={{ background: "linear-gradient(135deg,#0a0a1a,#0d0d23)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400 text-sm">جاري تحميل البيانات...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-8 px-4 sm:px-6 lg:px-8"
      style={{ background: "linear-gradient(135deg,#0a0a1a 0%,#0d0d23 50%,#0a0f1a 100%)" }}
      dir="rtl"
    >
      {/* ── Page Header ── */}
      <div className="text-center mb-8">
        <h1
          className="text-3xl font-extrabold mb-1"
          style={{ background: "linear-gradient(90deg,#6366f1,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
        >
          💼 إدارة السيليز والشكاوى
        </h1>
        <p className="text-gray-500 text-sm">تحكم في مندوبي المبيعات، المبالغ والمستحقات وشكاوى العمل</p>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => setActiveTab("reps")}
          className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={{
            background: activeTab === "reps" ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.02)",
            border: activeTab === "reps" ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.05)",
            color: activeTab === "reps" ? "#818cf8" : "#9ca3af",
          }}
        >
          👤 حسابات ومستحقات السيليز ({reps.length})
        </button>
        <button
          onClick={() => setActiveTab("complaints")}
          className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all relative"
          style={{
            background: activeTab === "complaints" ? "rgba(236,72,153,0.2)" : "rgba(255,255,255,0.02)",
            border: activeTab === "complaints" ? "1px solid rgba(236,72,153,0.4)" : "1px solid rgba(255,255,255,0.05)",
            color: activeTab === "complaints" ? "#f472b6" : "#9ca3af",
          }}
        >
          💬 الشكاوى والاستفسارات ({complaints.length})
          {unresolvedCount > 0 && (
            <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
              {unresolvedCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab: Reps */}
      {activeTab === "reps" && (
        <>
          {/* ── Global Stats ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: "مندوبي المبيعات", val: reps.length, color: "#6366f1", icon: "👥" },
              { label: "إجمالي الترشيحات", val: totalReferrals, color: "#22c55e", icon: "📋" },
              { label: "إجمالي المستحق", val: fmtMoney(totalDue), color: "#f59e0b", icon: "💰" },
              { label: "إجمالي المصروف", val: fmtMoney(totalPaid), color: "#a855f7", icon: "✅" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl p-4 flex flex-col gap-2"
                style={{ background: `${s.color}10`, border: `1px solid ${s.color}25` }}
              >
                <span className="text-2xl">{s.icon}</span>
                <span className="text-xl font-extrabold" style={{ color: s.color }}>{s.val}</span>
                <span className="text-xs text-gray-500">{s.label}</span>
              </div>
            ))}
          </div>

          {/* ── Search + Refresh ── */}
          <div className="flex gap-3 mb-5 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input
                type="text"
                placeholder="ابحث عن مندوب..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl pr-9 pl-3 py-2.5 text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50"
              style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#818cf8" }}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              تحديث
            </button>
          </div>

          {/* ── Reps List ── */}
          {filteredReps.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center gap-3">
              <div className="text-5xl opacity-20">👤</div>
              <p className="text-gray-500">لا يوجد مندوبي مبيعات مسجلين بعد</p>
              <p className="text-gray-600 text-xs">سيظهرون هنا بعد تسجيل الدخول من صفحة /sales-register</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReps.map((rep) => (
                <RepCard
                  key={rep.uid}
                  rep={rep}
                  referrals={repReferrals[rep.uid] || []}
                  onSaveAmount={handleSaveAmount}
                  onSavePaidOut={handleSavePaidOut}
                  onDelete={handleDeleteRep}
                  allStudents={allStudents}
                  onAssignStudent={handleAssignStudent}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab: Complaints */}
      {activeTab === "complaints" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-200">الشكاوى والاستفسارات المقدمة</h2>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 disabled:opacity-50"
              style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#818cf8" }}
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
              تحديث
            </button>
          </div>

          {complaints.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center gap-3">
              <div className="text-5xl opacity-20">💬</div>
              <p className="text-gray-500">لا توجد أي شكاوى أو استفسارات حالياً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {complaints.map((c) => {
                const dateVal = c.createdAt?.toDate ? c.createdAt.toDate().toISOString() : c.createdAt;
                return (
                  <ComplaintCard
                    key={c.id}
                    c={c}
                    dateVal={dateVal}
                    onResolve={handleResolveComplaint}
                    onDelete={handleDeleteComplaint}
                    onReply={handleReplyComplaint}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(SalesAdminControl);
