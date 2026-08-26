"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  loginAdmin,
  requestPasswordReset,
  getAuthErrorMessage,
} from "@/app/services/adminAuthService";

export function useLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // معالج تسجيل الدخول
  const handleLogin = useCallback(
    async (e) => {
      if (e) e.preventDefault();
      setError("");

      if (!email.trim() || !password) {
        setError("يرجى إدخال البريد الإلكتروني وكلمة المرور");
        return;
      }

      setLoading(true);
      try {
        const result = await loginAdmin(email, password);
        if (result.role === "sales") {
          router.replace("/sales-dashboard");
        } else {
          router.replace(redirectUrl);
        }
      } catch (err) {
        setError(getAuthErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [email, password, redirectUrl, router]
  );

  // معالج استعادة كلمة المرور
  const handleReset = useCallback(
    async (e) => {
      if (e) e.preventDefault();
      setError("");

      if (!resetEmail.trim()) {
        setError("يرجى إدخال بريدك الإلكتروني");
        return;
      }

      setResetLoading(true);
      try {
        await requestPasswordReset(resetEmail);
        setResetSent(true);
      } catch (err) {
        setError(getAuthErrorMessage(err));
      } finally {
        setResetLoading(false);
      }
    },
    [resetEmail]
  );

  // التبديل إلى نموذج استعادة كلمة المرور
  const openResetMode = useCallback(() => {
    setError("");
    setResetEmail(email);
    setResetSent(false);
    setResetMode(true);
  }, [email]);

  // العودة إلى نموذج تسجيل الدخول
  const closeResetMode = useCallback(() => {
    setError("");
    setResetSent(false);
    setResetMode(false);
  }, []);

  return {
    // Login form state & handlers
    email,
    setEmail,
    password,
    setPassword,
    showPw,
    setShowPw,
    error,
    setError,
    loading,
    handleLogin,

    // Reset form state & handlers
    resetMode,
    resetEmail,
    setResetEmail,
    resetSent,
    resetLoading,
    handleReset,
    openResetMode,
    closeResetMode,
  };
}
