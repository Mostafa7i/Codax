"use client";
import React, { useState, useCallback } from "react";
import Link from "next/link";

/* ─────────────────────────────────────────────
   LoadingLink
   بديل لـ <Link> مع حالة تحميل واضحة عند الضغط.
   
   الاستخدام:
     <LoadingLink href="/pages/main" className="...">
       دخول
     </LoadingLink>

   Props إضافية:
   - spinnerColor: لون الـ spinner (default: "white")
   - loadingText: نص يظهر أثناء التحميل
───────────────────────────────────────────── */
export default function LoadingLink({
  href,
  children,
  className = "",
  spinnerColor = "currentColor",
  loadingText,
  onClick,
  ...rest
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(
    (e) => {
      if (isLoading) {
        e.preventDefault();
        return;
      }
      setIsLoading(true);
      onClick?.(e);

      // Reset بعد 5 ثوانٍ كـ fallback لو حصل مشكلة
      const timer = setTimeout(() => setIsLoading(false), 5000);
      return () => clearTimeout(timer);
    },
    [isLoading, onClick]
  );

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={`relative overflow-hidden ${isLoading ? "pointer-events-none" : ""} ${className}`}
      aria-busy={isLoading}
      {...rest}
    >
      {/* Ripple effect عند الضغط */}
      {isLoading && (
        <span
          className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px] rounded-[inherit] z-10"
          aria-hidden="true"
        >
          <svg
            className="animate-spin"
            style={{ width: 20, height: 20 }}
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-30"
              cx="12" cy="12" r="10"
              stroke={spinnerColor}
              strokeWidth="3"
            />
            <path
              className="opacity-90"
              fill={spinnerColor}
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          {loadingText && (
            <span className="mr-2 text-sm font-semibold" style={{ color: spinnerColor }}>
              {loadingText}
            </span>
          )}
        </span>
      )}

      {/* المحتوى الأصلي — يصبح شبه شفاف أثناء التحميل */}
      <span
        className="flex items-center justify-center gap-2 w-full h-full transition-opacity duration-200"
        style={{ opacity: isLoading ? 0.4 : 1 }}
      >
        {children}
      </span>
    </Link>
  );
}
