'use client';
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
} from "../../services/firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Sparkles, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

// ── Particle orbs background ──────────────────────────────────────────
const Orbs = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    <motion.div
      animate={{ x: [0, 70, 0], y: [0, -50, 0] }}
      transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -top-72 -right-72 w-[800px] h-[800px] rounded-full"
      style={{ background: "radial-gradient(circle, rgba(99,102,241,0.18), transparent 70%)" }}
    />
    <motion.div
      animate={{ x: [0, -60, 0], y: [0, 70, 0] }}
      transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -bottom-72 -left-72 w-[700px] h-[700px] rounded-full"
      style={{ background: "radial-gradient(circle, rgba(139,92,246,0.14), transparent 70%)" }}
    />
    <motion.div
      animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-1/2 left-1/4 w-[400px] h-[400px] rounded-full"
      style={{ background: "radial-gradient(circle, rgba(6,182,212,0.08), transparent 70%)" }}
    />
  </div>
);

// ── Google SVG Icon ───────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" className="shrink-0">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// ── Main Component ─────────────────────────────────────────────────────
export default function page() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  // ─── تحقق من الجلسة المحفوظة عند تحميل الصفحة فقط ───────────────────
  useEffect(() => {
    let mounted = true;
    // isSigningIn: نمنع الـ listener من التدخل أثناء عملية Google Auth
    let isSigningIn = false;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!mounted || isSigningIn) return; // تجاهل أثناء التسجيل النشط

      if (user) {
        try {
          const ref = doc(db, "salesReps", user.uid);
          const snap = await getDoc(ref);
          if (!mounted) return;
          if (snap.exists()) {
            router.replace("/sales-dashboard");
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }
      if (mounted) setChecking(false);
    });

    // نحفظ مرجع للـ flag بحيث handleGoogleAuth يقدر يعدّله
    window.__salesIsSigningIn = (val) => { isSigningIn = val; };

    return () => {
      mounted = false;
      delete window.__salesIsSigningIn;
      unsub();
    };
  }, [router]);

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError("");

    // أخبر الـ listener إنه يوقف التدخل
    if (window.__salesIsSigningIn) window.__salesIsSigningIn(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // تحقق أو أنشئ حساب السيليز
      const ref = doc(db, "salesReps", user.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        await setDoc(ref, {
          uid: user.uid,
          name: user.displayName || "",
          email: user.email || "",
          photoURL: user.photoURL || "",
          createdAt: serverTimestamp(),
          amountPerReferral: 400,
          totalEarned: 0,
          paidOut: 0,
          active: true,
        });
      }

      // الـ doc موجود الآن → انقل للوحة التحكم
      router.replace("/sales-dashboard");
    } catch (err) {
      console.error(err);
      if (window.__salesIsSigningIn) window.__salesIsSigningIn(false);
      if (err.code === "auth/popup-closed-by-user") {
        setError("تم إغلاق نافذة Google. حاول مرة أخرى.");
      } else {
        setError("حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070b14]">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-white overflow-hidden relative flex items-center justify-center px-4 py-12">
      <Orbs />

      {/* Grid pattern */}
      <div
        className="fixed inset-0 opacity-[0.015] pointer-events-none z-0"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #6366f1 1px, transparent 0)",
          backgroundSize: "48px 48px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Header badge */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 rounded-full text-sm font-bold shadow-2xl mb-4"
            style={{ boxShadow: "0 0 40px rgba(99,102,241,0.4)" }}
          >
            <Sparkles className="w-5 h-5" />
            نظام السيليز - CodaX
          </motion.div>
          <h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            انضم للعمل كسيلز
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            سجّل الدخول بحساب Google وابدأ في تتبع ترشيحاتك وأرباحك
          </p>
        </div>

        {/* Card */}
        <motion.div
          className="rounded-3xl p-8 relative overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
          }}
        >
          {/* Glow line top */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.6), transparent)" }}
          />

          {/* Features list */}
          <div className="space-y-3 mb-8">
            {[
              { emoji: "📊", text: "شوف عدد من سجّل عن طريقك" },
              { emoji: "💰", text: "تتبع أرباحك ومبلغ كل ترشيح" },
              { emoji: "✅", text: "اعرف هل استلمت مستحقاتك" },
              { emoji: "📈", text: "إحصائيات تفصيلية لأدائك" },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="flex items-center gap-3 text-sm text-gray-300"
              >
                <span className="text-lg">{f.emoji}</span>
                <span>{f.text}</span>
              </motion.div>
            ))}
          </div>

          {/* Divider */}
          <div className="relative flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-600 text-xs">سجّل الدخول بـ</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Google button */}
          <motion.button
            onClick={handleGoogleAuth}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-base transition-all duration-200 relative overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "white",
              boxShadow: loading ? "none" : "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>جاري الاتصال...</span>
              </>
            ) : (
              <>
                <GoogleIcon />
                <span>المتابعة مع Google</span>
              </>
            )}
          </motion.button>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 p-3 rounded-xl text-sm text-red-400 text-center"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}
              >
                ⚠ {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Note */}
          <p className="mt-6 text-center text-xs text-gray-600 leading-relaxed">
            بالتسجيل، حسابك سيتم مراجعته من الأدمن وتحديد المبلغ المستحق لك عن كل ترشيح
          </p>
        </motion.div>

        {/* Back link */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate.push("/")}
            className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-gray-600 hover:text-gray-400 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
            العودة للرئيسية
          </button>
        </div>
      </motion.div>
    </div>
  );
};