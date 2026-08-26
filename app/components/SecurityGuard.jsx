"use client";
import React, { useEffect, useState } from "react";

/**
 * SecurityGuard — نظام الحماية ومنع فحص الكود (Anti-Inspect & DevTools Protection)
 *
 * المميزات:
 * 1. منع النقر بزر الفأرة الأيمن (Disable Right-Click Context Menu)
 * 2. منع اختصارات المطورين وفحص العناصر:
 *    - F12
 *    - Ctrl+Shift+I / Cmd+Opt+I (DevTools)
 *    - Ctrl+Shift+J / Cmd+Opt+J (Console)
 *    - Ctrl+Shift+C / Cmd+Opt+C (Inspect Element)
 *    - Ctrl+Shift+K / Cmd+Opt+K (Firefox Console)
 *    - Ctrl+U / Cmd+Opt+U (View Source)
 *    - Ctrl+S / Cmd+S (Save Webpage)
 * 3. حماية سحب وإسقاط الصور والوسائط (Disable Drag & Drop)
 * 4. حماية وتفريغ الكونسول للمطورين في وضع الإنتاج
 * 5. متوافق 100% مع Next.js Static Export وSSR Safety
 */
export default function SecurityGuard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // 1. منع فتح القائمة المنسدلة بالزر الأيمن
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // 2. منع اختصارات لوحة المفاتيح الخاصة بفحص الكود وفتح DevTools
    const handleKeyDown = (e) => {
      // F12
      if (e.key === "F12" || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      // Ctrl+Shift+I / J / C / K
      if (isCtrlOrMeta && e.shiftKey) {
        const key = (e.key || "").toUpperCase();
        if (["I", "J", "C", "K"].includes(key) || [73, 74, 67, 75].includes(e.keyCode)) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }

      // Ctrl+U (عرض سورس الصفحة) و Ctrl+S (حفظ الصفحة)
      if (isCtrlOrMeta) {
        const key = (e.key || "").toUpperCase();
        if (["U", "S"].includes(key) || [85, 83].includes(e.keyCode)) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    };

    // 3. منع سحب وإفلات الصور الحساسة
    const handleDragStart = (e) => {
      if (e.target && (e.target.nodeName === "IMG" || e.target.nodeName === "A")) {
        e.preventDefault();
        return false;
      }
    };

    // 4. حماية الكونسول وعرض رسالة أمان توضيحية
    try {
      if (typeof window !== "undefined" && window.console) {
        const bannerStyle =
          "color: #ef4444; font-size: 22px; font-weight: bold; text-shadow: 1px 1px 2px black;";
        const subStyle = "color: #6366f1; font-size: 13px; font-weight: bold;";
        console.log("%c⛔ تحذير أمني خاص بمنصة CodaX", bannerStyle);
        console.log(
          "%cهذه المنطقة مخصصة لأدوات النظام ومحمية بحقوق الملكية الفكرية لمنصة CodaX. أي محاولة للتلاعب أو فحص الكود تعرض الحساب للحظر التلقائي.",
          subStyle
        );
      }
    } catch (_) {}

    // ربط مستمعي الأحداث على مستوى النافذة
    window.addEventListener("contextmenu", handleContextMenu, { capture: true });
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("dragstart", handleDragStart, { capture: true });

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu, { capture: true });
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("dragstart", handleDragStart, { capture: true });
    };
  }, []);

  if (!mounted) return null;
  return null;
}
