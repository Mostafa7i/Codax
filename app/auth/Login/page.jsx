"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/app/services/firebaseConfig";
import {
  loginAdmin,
  requestPasswordReset,
  getAuthErrorMessage,
} from "@/app/services/adminAuthService";
import {
  Mail,
  Lock,
  LogIn,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  ArrowRight,
} from "lucide-react";
import Swal from "sweetalert2";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  const redirectTo = searchParams?.get("redirect") || null;
  const reason = searchParams?.get("reason") || null;

  // إذا كان المستخدم مسجل كأدمن بالفعل، نوجهه مباشرة
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user?.email) {
        try {
          const q = query(
            collection(db, "admins"),
            where("email", "==", user.email.toLowerCase())
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            router.replace(redirectTo ? decodeURIComponent(redirectTo) : "/admin");
            return;
          }
        } catch (e) {
          console.error("Auth check error:", e);
        }
      }
      setCheckingAuth(false);
    });

    if (reason === "unauthorized") {
      setError("ليس لديك صلاحية للوصول إلى لوحة التحكم. يرجى تسجيل الدخول بحساب مسؤول.");
    }

    return () => unsub();
  }, [router, redirectTo, reason]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    setLoading(true);
    try {
      const result = await loginAdmin(email, password);

      if (result.success) {
        const destination = redirectTo
          ? decodeURIComponent(redirectTo)
          : result.role === "sales"
          ? "/sales-dashboard"
          : "/admin";

        router.replace(destination);
      }
    } catch (err) {
      console.error("Login error:", err);
      const friendlyMsg = getAuthErrorMessage(err);
      setError(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const { value: enteredEmail } = await Swal.fire({
      title: "استعادة كلمة المرور",
      text: "أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطاً لتعيين كلمة مرور جديدة:",
      input: "email",
      inputValue: email,
      inputPlaceholder: "admin@example.com",
      showCancelButton: true,
      confirmButtonText: "إرسال الرابط",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#4f46e5",
      background: "#0f172a",
      color: "#f8fafc",
      customClass: {
        popup: "rounded-2xl border border-slate-700",
      },
      inputValidator: (value) => {
        if (!value || !value.includes("@")) {
          return "يرجى كتابة بريد إلكتروني صالح!";
        }
      },
    });

    if (!enteredEmail) return;

    try {
      await requestPasswordReset(enteredEmail);
      Swal.fire({
        icon: "success",
        title: "تم الإرسال!",
        text: `تم إرسال رابط استعادة كلمة المرور إلى ${enteredEmail}. يرجى فحص صندوق الوارد أو البريد غير الهام (Spam).`,
        confirmButtonText: "حسناً",
        confirmButtonColor: "#4f46e5",
        background: "#0f172a",
        color: "#f8fafc",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "خطأ",
        text: getAuthErrorMessage(err),
        confirmButtonText: "حسناً",
        confirmButtonColor: "#ef4444",
        background: "#0f172a",
        color: "#f8fafc",
      });
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060912]">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#060912] via-[#0b1021] to-[#060912] px-4 py-12 relative overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[140px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl shadow-black/60 relative">
          
          {/* Header & Logo */}
          <div className="text-center mb-8">
            <div className="relative inline-flex items-center justify-center mb-4">
              <div className="w-20 h-20 rounded-2xl bg-linear-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-xl shadow-indigo-500/25">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center p-3">
                  <img
                    src="/favicon.png"
                    alt="CodaX Logo"
                    className="w-full h-full object-contain drop-shadow"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  <ShieldCheck className="w-9 h-9 text-indigo-400 hidden only:block" />
                </div>
              </div>
              <span className="absolute -bottom-2 bg-indigo-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-400/40 shadow-sm uppercase tracking-wider">
                Admin
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
              تسجيل دخول الإدارة
            </h1>
            <p className="text-slate-400 text-xs mt-1.5 font-medium">
              لوحة التحكم والإشراف على منصة CodaX
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-3.5 mb-6 text-xs leading-relaxed animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="flex-1">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="admin-email"
                className="block text-slate-300 text-xs font-semibold mb-1.5"
              >
                البريد الإلكتروني للإدارة
              </label>
              <div className="relative">
                <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  id="admin-email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@codax.com"
                  autoComplete="email"
                  className="w-full bg-slate-950/60 border border-slate-800 text-white placeholder-slate-600 rounded-xl pr-10 pl-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-left"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="admin-password"
                  className="block text-slate-300 text-xs font-semibold"
                >
                  كلمة المرور
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="admin-password"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-slate-950/60 border border-slate-800 text-white placeholder-slate-600 rounded-xl pr-10 pl-11 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-left"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                  title={showPassword ? "إخفاء" : "إظهار"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="admin-login-submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-linear-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.01] active:scale-[0.99] text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جارٍ التحقق والدخول...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>دخول إلى لوحة التحكم</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Back Link */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 transition-colors font-medium"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة إلى الصفحة الرئيسية للمنصة</span>
            </Link>
          </div>
        </div>

        {/* Security watermark */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 mt-4">
          <KeyRound className="w-3 h-3 text-indigo-400" />
          <span>منطقة مخصصة لإدارة ومسؤولي منصة CodaX فقط</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#060912]">
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
