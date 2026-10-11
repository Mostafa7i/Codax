import React, { useState, useEffect, useCallback } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  increment,
  arrayUnion,
} from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  FileText,
  ArrowRightLeft,
  RefreshCw,
  Bell,
  TrendingUp,
  Info,
  ChevronDown,
  ChevronUp,
  Search,
  History,
} from "lucide-react";


/* ──────────────────────────────────────────────────────────── */
/*  Helpers                                                      */
/* ──────────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  pending: {
    label: "قيد الانتظار",
    icon: Clock,
    bg: "bg-amber-900/30",
    border: "border-amber-700",
    text: "text-amber-400",
    dot: "bg-amber-400",
  },
  approved: {
    label: "تمت الموافقة ✅",
    icon: CheckCircle2,
    bg: "bg-emerald-900/30",
    border: "border-emerald-700",
    text: "text-emerald-400",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "مرفوض ❌",
    icon: XCircle,
    bg: "bg-red-900/30",
    border: "border-red-700",
    text: "text-red-400",
    dot: "bg-red-400",
  },
};

const fmt = (ts) => {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("ar-EG", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const RESERVE_TO_POINTS = 5;

/* ──────────────────────────────────────────────────────────── */
/*  Section wrapper                                              */
/* ──────────────────────────────────────────────────────────── */
function Section({ title, icon: Icon, gradient = "from-indigo-500 to-purple-600", children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-gray-800 rounded-2xl shadow-md border border-gray-700 overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-linear-to-br ${gradient} flex items-center justify-center shrink-0`}>
            <Icon className="w-4 h-4 text-slate-100" />
          </div>
          <span className="font-bold text-slate-100 text-sm">{title}</span>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Feedback banner                                              */
/* ──────────────────────────────────────────────────────────── */
function FeedbackBanner({ feedback }) {
  return (
    <AnimatePresence>
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={`flex items-center gap-3 p-3.5 rounded-2xl border text-sm font-medium ${
            feedback.type === "success"
              ? "bg-emerald-900/20 border-emerald-300 text-emerald-300"
              : "bg-red-900/20 border-red-300 text-red-300"
          }`}
        >
          {feedback.type === "success"
            ? <CheckCircle2 className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />}
          {feedback.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Main Component                                               */
/* ──────────────────────────────────────────────────────────── */
export default function PointsRequestTab({ studentId, studentDocId, studentName }) {
  /* ---- state ---- */
  const [studentData, setStudentData] = useState(null);
  const [requests, setRequests]       = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  /* request-from-admin form */
  const [reqPoints, setReqPoints]   = useState("");
  const [reqReason, setReqReason]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reqFeedback, setReqFeedback] = useState(null);

  /* transfer form */
  const [transferSearch, setTransferSearch]         = useState("");
  const [transferResults, setTransferResults]       = useState([]);
  const [selectedRecipient, setSelectedRecipient]   = useState(null);
  const [transferPts, setTransferPts]               = useState("");
  const [transferring, setTransferring]             = useState(false);
  const [transferFeedback, setTransferFeedback]     = useState(null);
  const [allStudents, setAllStudents]               = useState([]);

  /* convert reserve */
  const [convertQty, setConvertQty]       = useState(1);
  const [converting, setConverting]       = useState(false);
  const [convertFeedback, setConvertFeedback] = useState(null);

  /* ─────────────────── real-time: student doc ─────────────────── */
  useEffect(() => {
    if (!studentId) return;
    const q = query(collection(db, "students"), where("id", "==", Number(studentId)));
    return onSnapshot(q, (snap) => {
      if (!snap.empty) setStudentData(snap.docs[0].data());
      setLoadingData(false);
    });
  }, [studentId]);

  /* ─────────────────── real-time: requests ─────────────────── */
  useEffect(() => {
    if (!studentId) return;
    const q = query(
      collection(db, "pointsRequests"),
      where("studentId", "==", Number(studentId)),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snap) => setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [studentId]);

  /* ─────────────────── real-time: notifications ─────────────────── */
  useEffect(() => {
    if (!studentId) return;
    const q = query(
      collection(db, "notifications"),
      where("studentId", "==", Number(studentId)),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snap) =>
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, [studentId]);

  /* ─────────────────── all students for transfer search ─────────────────── */
  useEffect(() => {
    getDocs(collection(db, "students")).then((snap) =>
      setAllStudents(snap.docs.map((d) => ({ firestoreId: d.id, ...d.data() })))
    );
  }, []);

  /* search students */
  useEffect(() => {
    if (!transferSearch.trim()) { setTransferResults([]); return; }
    const term = transferSearch.toLowerCase();
    setTransferResults(
      allStudents
        .filter((s) => s.id !== Number(studentId) && s.name?.toLowerCase().includes(term))
        .slice(0, 6)
    );
  }, [transferSearch, allStudents, studentId]);

  /* ── helpers ── */
  const showFeedback = (setter, type, message, ms = 4500) => {
    setter({ type, message });
    setTimeout(() => setter(null), ms);
  };

  const getStudentFirestoreId = useCallback(async () => {
    if (studentDocId) return studentDocId;
    const snap = await getDocs(query(collection(db, "students"), where("id", "==", Number(studentId))));
    if (snap.empty) throw new Error("الطالب غير موجود");
    return snap.docs[0].id;
  }, [studentId, studentDocId]);

  const score     = studentData?.score || 0;
  const reserve   = studentData?.reserveAttendance || 0;
  const hasPending = requests.some((r) => r.status === "pending");
  const approvedTotal = requests.filter((r) => r.status === "approved")
    .reduce((a, r) => a + (r.requestedPoints || 0), 0);

  /* ─────────────────── Submit request ─────────────────── */
  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    const pts = parseInt(reqPoints, 10);
    if (!pts || pts <= 0 || pts > 100)
      return showFeedback(setReqFeedback, "error", "أدخل عدد نقاط صحيح (1 – 500)");
    if (!reqReason.trim() || reqReason.trim().length < 10)
      return showFeedback(setReqFeedback, "error", "اشرح السبب بشكل أوضح (10 أحرف على الأقل)");
    if (hasPending)
      return showFeedback(setReqFeedback, "error", "لديك طلب معلق بالفعل، انتظر حتى تتم مراجعته");

    setSubmitting(true);
    try {
      await addDoc(collection(db, "pointsRequests"), {
        studentId: Number(studentId),
        studentDocId: studentDocId || null,
        studentName: studentName || "غير معروف",
        studentGroup: studentData?.group || "غير معروف",
        requestedPoints: pts,
        reason: reqReason.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
        reviewedAt: null,
        adminNote: "",
      });
      showFeedback(setReqFeedback, "success", "✅ تم إرسال طلبك! انتظر الموافقة.");
      setReqPoints(""); setReqReason("");
    } catch (err) {
      showFeedback(setReqFeedback, "error", "حدث خطأ أثناء الإرسال، حاول مجدداً");
    } finally {
      setSubmitting(false);
    }
  };

  /* ─────────────────── Transfer points ─────────────────── */
  const handleTransfer = async () => {
    const pts = Number(transferPts);
    if (!selectedRecipient) return showFeedback(setTransferFeedback, "error", "اختر الطالب المستلم أولاً");
    if (!pts || pts <= 0) return showFeedback(setTransferFeedback, "error", "أدخل عدد نقاط صحيح");
    if (pts > score) return showFeedback(setTransferFeedback, "error", `رصيدك غير كافٍ (${score} نقطة فقط)`);

    setTransferring(true);
    try {
      const myId = await getStudentFirestoreId();

      // get recipient firestore id
      const snap = await getDocs(query(collection(db, "students"), where("id", "==", selectedRecipient.id)));
      if (snap.empty) throw new Error("الطالب المستلم غير موجود");
      const recipientFirestoreId = snap.docs[0].id;
      const recipientData = snap.docs[0].data();

      await updateDoc(doc(db, "students", myId), { score: increment(-pts) });
      await updateDoc(doc(db, "students", recipientFirestoreId), { score: increment(pts) });

      // notifications
      await addDoc(collection(db, "notifications"), {
        studentId: selectedRecipient.id,
        recipientId: selectedRecipient.id,
        message: `📩 استلمت ${pts} نقطة من ${studentName}`,
        points: pts, type: "transfer",
        createdAt: serverTimestamp(), timestamp: new Date(),
      });
      await addDoc(collection(db, "notifications"), {
        studentId: Number(studentId),
        recipientId: Number(studentId),
        message: `📤 أرسلت ${pts} نقطة إلى ${recipientData.name}`,
        points: pts, type: "transfer",
        createdAt: serverTimestamp(), timestamp: new Date(),
      });

      showFeedback(setTransferFeedback, "success", `✅ تم تحويل ${pts} نقطة إلى ${recipientData.name}`);
      setTransferPts(""); setSelectedRecipient(null); setTransferSearch(""); setTransferResults([]);
    } catch (err) {
      showFeedback(setTransferFeedback, "error", err.message || "حدث خطأ أثناء التحويل");
    } finally {
      setTransferring(false);
    }
  };

  /* ─────────────────── Convert reserve → points ─────────────────── */
  const handleConvert = async () => {
    if (convertQty <= 0) return showFeedback(setConvertFeedback, "error", "أدخل كمية صحيحة");
    if (convertQty > reserve) return showFeedback(setConvertFeedback, "error", `حضورك الاحتياطي غير كافٍ (${reserve} فقط)`);

    setConverting(true);
    try {
      const myId = await getStudentFirestoreId();
      const ptsgained = convertQty * RESERVE_TO_POINTS;
      await updateDoc(doc(db, "students", myId), {
        reserveAttendance: increment(-convertQty),
        score: increment(ptsgained),
        buyingHistory: arrayUnion({
          type: "convertReserve", quantity: convertQty,
          pointsGained: ptsgained, date: new Date().toISOString(),
        }),
      });
      showFeedback(setConvertFeedback, "success", `✅ تم تحويل ${convertQty} حضور → +${ptsgained} نقطة`);
      setConvertQty(1);
    } catch (err) {
      showFeedback(setConvertFeedback, "error", err.message || "حدث خطأ أثناء التحويل");
    } finally {
      setConverting(false);
    }
  };

  /* ─────────────────── render ─────────────────── */
  if (loadingData) return (
    <div className="flex justify-center items-center py-20">
      <Loader2 className="w-10 h-10 animate-spin text-yellow-500" />
    </div>
  );

  return (
    <div className="space-y-4 pb-8" dir="rtl">

      {/* ══════════════════════════════════════
          HERO — current balance card
      ══════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden shadow-xl"
      >
        <div className="absolute inset-0 bg-linear-to-br from-yellow-400 via-orange-500 to-pink-500" />
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 70% 30%, rgba(148,163,184,0.35) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        />
        <div className="relative p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* score */}
            <div>
              <p className="text-slate-100/80 text-sm font-medium mb-1">رصيدك الحالي</p>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-black text-slate-100">{score}</span>
                <span className="text-slate-100/80 text-lg mb-1">نقطة</span>
              </div>
              <p className="text-slate-100/70 text-xs mt-1">
                حصلت على {approvedTotal} نقطة من الإدارة إجمالاً
              </p>
            </div>
            {/* icon */}
            <div className="w-20 h-20 rounded-full bg-slate-800/20 backdrop-blur flex items-center justify-center">
              <Coins className="w-10 h-10 text-slate-100" />
            </div>
          </div>

          {/* mini stats row */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="bg-slate-800/15 backdrop-blur rounded-xl p-3 text-center">
              <p className="text-slate-100 text-xs opacity-80">حضور احتياطي</p>
              <p className="text-slate-100 font-bold text-xl">{reserve}</p>
            </div>
            <div className="bg-slate-800/15 backdrop-blur rounded-xl p-3 text-center">
              <p className="text-slate-100 text-xs opacity-80">طلبات مقبولة</p>
              <p className="text-slate-100 font-bold text-xl">
                {requests.filter((r) => r.status === "approved").length}
              </p>
            </div>
            <div className="bg-slate-800/15 backdrop-blur rounded-xl p-3 text-center">
              <p className="text-slate-100 text-xs opacity-80">طلبات إجمالية</p>
              <p className="text-slate-100 font-bold text-xl">{requests.length}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════
          HOW TO EARN POINTS — tips
      ══════════════════════════════════════ */}
      <Section title="كيف تكسب نقاطاً؟" icon={TrendingUp} gradient="from-blue-500 to-cyan-500" defaultOpen={false}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {[
            { icon: "🎯", label: "إنهاء المهام", desc: "تسليم التاسك في الوقت المحدد" },
            { icon: "📅", label: "الحضور المنتظم", desc: "حضور المحاضرات يرفع تقييمك" },
            { icon: "⭐", label: "التصويت", desc: "استخدام أصوات التقييم للزملاء" },
            { icon: "🤝", label: "تحويل من زميل", desc: "زميل يحول لك نقاطه" },
            { icon: "🔄", label: "تحويل الاحتياطي", desc: `كل حضور احتياطي = ${RESERVE_TO_POINTS} نقاط` },
            { icon: "📩", label: "طلب من الإدارة", desc: "تقديم طلب بسبب مقنع" },
          ].map(({ icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3 bg-blue-900/20 rounded-xl p-3">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-semibold text-sm text-slate-100">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ══════════════════════════════════════
          REQUEST FROM ADMIN
      ══════════════════════════════════════ */}
      <Section title="طلب نقاط من الإدارة" icon={FileText} gradient="from-yellow-400 to-orange-500">
        <FeedbackBanner feedback={reqFeedback} />
        <form onSubmit={handleSubmitRequest} className="space-y-3 mt-3">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              عدد النقاط المطلوبة (1 – 100)
            </label>
            <div className="relative">
              <Coins className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500" />
              <input
                type="number" min="1" max="100"
                value={reqPoints} onChange={(e) => setReqPoints(e.target.value)}
                placeholder="مثال: 50"
                disabled={submitting || hasPending}
                className="w-full pr-9 pl-4 py-2.5 border-2 border-gray-600 rounded-xl bg-gray-900 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition disabled:opacity-60"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              سبب الطلب
            </label>
            <textarea rows={3} value={reqReason} onChange={(e) => setReqReason(e.target.value)}
              placeholder="اشرح سبب طلبك بالتفصيل (10 أحرف على الأقل)..."
              disabled={submitting || hasPending}
              className="w-full px-4 py-2.5 border-2 border-gray-600 rounded-xl bg-gray-900 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none transition disabled:opacity-60"
            />
            <p className="text-xs text-gray-400 mt-0.5 text-left">{reqReason.length}/500</p>
          </div>

          {hasPending && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-900/20 p-3 rounded-xl text-xs">
              <Clock className="w-4 h-4 shrink-0" />
              لديك طلب معلق بالفعل. انتظر حتى تتم مراجعته قبل تقديم طلب جديد.
            </div>
          )}

          <button type="submit" disabled={submitting || hasPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-linear-to-r hover:from-yellow-500 hover:to-orange-600 text-slate-100 font-bold rounded-xl shadow disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? "جاري الإرسال..." : "إرسال الطلب"}
          </button>
        </form>
      </Section>

      {/* ══════════════════════════════════════
          TRANSFER POINTS
      ══════════════════════════════════════ */}
      <Section title="تحويل النقاط لزميل" icon={ArrowRightLeft} gradient="from-indigo-500 to-violet-600" defaultOpen={false}>
        <FeedbackBanner feedback={transferFeedback} />

        {/* recipient search */}
        <div className="mt-3 space-y-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" value={transferSearch}
              onChange={(e) => {
                setTransferSearch(e.target.value);
                if (selectedRecipient) setSelectedRecipient(null);
              }}
              placeholder="ابحث عن الطالب بالاسم..."
              className="w-full pr-9 pl-4 py-2.5 border-2 border-gray-600 rounded-xl bg-gray-900 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>

          {/* dropdown results */}
          {transferResults.length > 0 && !selectedRecipient && (
            <div className="border border-gray-700 rounded-xl overflow-hidden shadow-sm">
              {transferResults.map((s) => (
                <button key={s.id}
                  onClick={() => { setSelectedRecipient(s); setTransferSearch(s.name); setTransferResults([]); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-900/20 transition text-right text-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-slate-100 text-xs font-bold shrink-0">
                    {s.name?.[0]}
                  </div>
                  <div>
                    <p className="font-medium text-slate-100">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.group} · {s.score || 0} نقطة</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* selected recipient badge */}
          {selectedRecipient && (
            <div className="flex items-center justify-between bg-indigo-900/20 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-slate-100 text-xs font-bold">
                  {selectedRecipient.name?.[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-indigo-300">{selectedRecipient.name}</p>
                  <p className="text-xs text-gray-400">{selectedRecipient.group}</p>
                </div>
              </div>
              <button onClick={() => { setSelectedRecipient(null); setTransferSearch(""); }}
                className="text-xs hover:text-red-600">تغيير</button>
            </div>
          )}

          {/* amount */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              عدد النقاط للتحويل (رصيدك: {score})
            </label>
            <input type="number" min="1" max={score}
              value={transferPts} onChange={(e) => setTransferPts(e.target.value)}
              placeholder="عدد النقاط"
              className="w-full px-4 py-2.5 border-2 border-gray-600 rounded-xl bg-gray-900 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
            {transferPts && Number(transferPts) > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                رصيدك بعد التحويل: <span className="font-bold text-indigo-600">{score - Number(transferPts)} نقطة</span>
              </p>
            )}
          </div>

          <button onClick={handleTransfer} disabled={transferring || !selectedRecipient || !transferPts}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-linear-to-r hover:from-indigo-600 hover:to-violet-700 text-slate-100 font-bold rounded-xl shadow disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm"
          >
            {transferring ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
            {transferring ? "جاري التحويل..." : "تحويل النقاط"}
          </button>
        </div>
      </Section>

      {/* ══════════════════════════════════════
          CONVERT RESERVE → POINTS
      ══════════════════════════════════════ */}
      <Section title="تحويل الحضور الاحتياطي إلى نقاط" icon={RefreshCw} gradient="from-orange-400 to-rose-500" defaultOpen={false}>
        <FeedbackBanner feedback={convertFeedback} />
        <div className="mt-3 space-y-3">
          {/* info row */}
          <div className="flex items-center justify-between bg-orange-900/20 rounded-xl px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-orange-400">
              <Info className="w-4 h-4" />
              <span>كل حضور = <strong>{RESERVE_TO_POINTS} نقاط</strong></span>
            </div>
            <span className="text-gray-300">
              احتياطيك: <strong>{reserve}</strong>
            </span>
          </div>

          {/* qty selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              عدد الحضور للتحويل
            </label>
            <div className="flex items-center gap-2">
              <button onClick={() => setConvertQty((p) => Math.max(1, p - 1))}
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-gray-200 hover:bg-gray-600 transition">
                −
              </button>
              <input type="number" min="1" max={reserve} value={convertQty}
                onChange={(e) => setConvertQty(Math.min(reserve, Math.max(1, Number(e.target.value) || 1)))}
                className="flex-1 text-center py-2.5 border-2 border-gray-600 rounded-xl bg-gray-900 text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button onClick={() => setConvertQty((p) => Math.min(reserve, p + 1))}
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-gray-200 hover:bg-gray-600 transition">
                +
              </button>
            </div>
          </div>

          {/* preview */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-green-900/20 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">ستحصل على</p>
              <p className="text-xl font-black text-green-600">+{convertQty * RESERVE_TO_POINTS}</p>
              <p className="text-xs text-green-500">نقطة</p>
            </div>
            <div className="bg-red-900/20 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">احتياطيك سيصبح</p>
              <p className="text-xl font-black text-red-500">{Math.max(0, reserve - convertQty)}</p>
              <p className="text-xs text-red-400">حضور</p>
            </div>
          </div>

          <button onClick={handleConvert} disabled={converting || convertQty > reserve || reserve === 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-linear-to-r hover:from-orange-500 hover:to-rose-600 text-slate-100 font-bold rounded-xl shadow disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm"
          >
            {converting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {converting ? "جاري التحويل..." : "تحويل الآن"}
          </button>
        </div>
      </Section>

      {/* ══════════════════════════════════════
          NOTIFICATIONS
      ══════════════════════════════════════ */}
      <Section title={`إشعارات النقاط (${notifications.length})`} icon={Bell} gradient="from-violet-500 to-fuchsia-600" defaultOpen={false}>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-gray-400">
            <Bell className="w-10 h-10 mb-2 opacity-20" />
            <p className="text-sm">لا توجد إشعارات حتى الآن</p>
          </div>
        ) : (
          <div className="space-y-2 mt-2 max-h-64 overflow-y-auto pr-1">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3 bg-gray-700/50 rounded-xl p-3">
                <span className="text-lg shrink-0">
                  {n.type === "pointsRequestApproved" ? "✅" :
                   n.type === "pointsRequestRejected" ? "❌" :
                   n.type === "transfer" ? "🔄" : "📢"}
                </span>
                <div>
                  <p className="text-sm text-gray-200">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmt(n.createdAt || n.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ══════════════════════════════════════
          REQUESTS HISTORY
      ══════════════════════════════════════ */}
      <Section title={`سجل طلبات النقاط (${requests.length})`} icon={History} gradient="from-slate-500 to-gray-600" defaultOpen={false}>
        {requests.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-gray-400">
            <History className="w-10 h-10 mb-2 opacity-20" />
            <p className="text-sm">لا توجد طلبات سابقة</p>
          </div>
        ) : (
          <div className="space-y-2 mt-2">
            {requests.map((req) => {
              const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              return (
                <div key={req.id} className="rounded-xl border border-gray-700 p-3 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-base text-slate-100">+{req.requestedPoints} نقطة</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    <span className="font-medium text-gray-300">السبب: </span>{req.reason}
                  </p>
                  {req.adminNote && (
                    <p className="text-xs text-indigo-400">
                      <span className="font-medium">ملاحظة الأدمن: </span>{req.adminNote}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">{fmt(req.createdAt)}</p>
                </div>
              );
            })}
          </div>
        )}
      </Section>

    </div>
  );
}
