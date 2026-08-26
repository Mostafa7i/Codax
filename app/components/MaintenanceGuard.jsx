"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebaseConfig";
import MaintenancePage from "./MaintenancePage";

export default function MaintenanceGuard({ children }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [maintenance, setMaintenance] = useState({
    enabled: false,
    message: "",
    estimatedTime: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);

    // الاستماع لحالة الصيانة في الوقت الفعلي
    const unsub = onSnapshot(
      doc(db, "configV", "maintenance"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setMaintenance({
            enabled: data.enabled === true,
            message: data.message || "",
            estimatedTime: data.estimatedTime || "",
          });
        } else {
          setMaintenance({ enabled: false, message: "", estimatedTime: "" });
        }
        setLoading(false);
      },
      (err) => {
        setMaintenance({ enabled: false, message: "", estimatedTime: "" });
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  if (!mounted) {
    return children;
  }

  // السماح بصفحات تسجيل الدخول ولوحة التحكم لتجاوز الصيانة
  const isAdminOrAuthRoute =
    pathname?.startsWith("/auth/Login") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/Dachboard");

  if (!loading && maintenance.enabled && !isAdminOrAuthRoute) {
    return (
      <MaintenancePage
        message={maintenance.message}
        estimatedTime={maintenance.estimatedTime}
      />
    );
  }

  return children;
}
