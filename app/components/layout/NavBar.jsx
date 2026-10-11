"use client";

import React, { useState, useEffect } from "react";
import {
  Home,
  LayoutDashboard,
  Menu,
  X,
  Users,
  ExternalLinkIcon,
} from "lucide-react";
import Link from "next/link";
import LoadingLink from "../LoadingLink";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/app/services/firebaseConfig";

import { useGroupContext } from "../../context/GroupContextProvider";
import Notifications from "../Notifications/Notifications";
import Logo from "../../../public/favicon.png";
import { useStudentAuth } from "@/app/context/StudentAuthContext";

export default function NavBar({ currentUser }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { logoutStudent, authenticatedStudentId } = useStudentAuth() || {};
  const { selectedGroup } = useGroupContext();
  const pathname = usePathname();
  // الاستماع لحالة تسجيل دخول الأدمن
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const q = query(
          collection(db, "admins"),
          where("email", "==", user.email?.toLowerCase()),
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setIsAdmin(true);
          return;
        }

        const hasAdminCookie =
          typeof document !== "undefined" &&
          document.cookie.includes("codax-admin-session");
        if (hasAdminCookie) {
          setIsAdmin(true);
          return;
        }

        setIsAdmin(false);
      } catch (err) {
        console.error("Error verifying admin status in NavBar:", err);
        setIsAdmin(false);
      }
    });

    return () => unsub();
  }, []);

  // إغلاق قائمة الموبايل عند تغيير الصفحة
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // إخفاء الـ NavBar في لوحة تحكم الأدمن وصفحات المصادقة
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/auth")) {
    return null;
  }

  const isActive = (path) => {
    if (path === "/") return pathname === "/";
    return pathname?.startsWith(path);
  };

  const isNotificationPage =
    pathname === "/pages/main" ||
    pathname === "/pages/main/ReqTask" ||
    pathname === "/pages/main/tasks" ||
    pathname === "/pages/main/test" ||
    pathname.startsWith("/MainContent/") ||
    pathname === "/pages/main";

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xs  border-b border-indigo-500/15 shadow-[0_10px_35px_rgba(0,0,0,0.5)] transition-all">
      {/* شريط الإضاءة العلوي الرفيع */}
      <div className="h-0.5 w-full bg-linear-to-r from-transparent via-indigo-500  to-transparent opacity-80" />

      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* ─── الشعار (Logo & Branding) ─── */}
          <div className="flex items-center gap-3.5">
            <Link
              href="/"
              className="group relative flex items-center gap-3 p-1.5 rounded-2xl transition-all"
            >
              <div className="relative">
                <div className="absolute -inset-1 rounded-2xl bg-linear-to-r from-indigo-600 to-pink-600 opacity-40 blur-sm group-hover:opacity-80 transition duration-300" />
                <Image
                  src={Logo}
                  width={46}
                  height={46}
                  priority
                  className="relative h-11 w-11 rounded-2xl ring-2 ring-indigo-500/40 p-0.5 bg-slate-900/80 transition-transform duration-300 group-hover:scale-105"
                  alt="CODAX Logo"
                />
              </div>

              <div className="flex flex-col">
                <span className="bg-linear-to-r from-indigo-300 via-purple-200 to-pink-300 bg-clip-text text-2xl font-black tracking-wider text-transparent transition-all group-hover:from-indigo-200 group-hover:to-pink-200">
                  CODAX
                </span>
                <span className="text-[10px] font-bold text-indigo-400/80 -mt-1 tracking-widest uppercase hidden sm:block">
                  Academy
                </span>
              </div>
            </Link>
          </div>

          {/* ─── روابط التنقل للديسكتوب (Desktop Navigation) ─── */}
          <nav className="hidden md:flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-inner">
            {/* رابط الرئيسية */}
            <Link
              href="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                isActive("/") && pathname === "/"
                  ? "bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Home className="w-4 h-4" />
              <span>الرئيسية</span>
            </Link>

            {/* رابط لوحة الطلاب / الدخول */}
            <LoadingLink
              href="/pages/main"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                isActive("/pages/main")
                  ? "bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
              spinnerColor="#a5b4fc"
            >
              <Users className="w-4 h-4" />
              <span>منصة الطلاب</span>
            </LoadingLink>
       

            {/* رابط لوحة تحكم الأدمن (إذا كان أدمن) */}
            {(currentUser || isAdmin) && (
              <Link
                href="/admin"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                  isActive("/admin")
                    ? "bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 border border-amber-500/20"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-amber-400" />
                <span>لوحة التحكم</span>
              </Link>
            )}
          </nav>
          {authenticatedStudentId && (
            <button
              onClick={logoutStudent}
              className="flex items-center justify-center cursor-pointer bg-red-500/80 gap-2 px-2 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 hover:text-white hover:bg-red-800/60"
            >
              <ExternalLinkIcon className="w-3 h-3" />
              <span> خروج</span>
            </button>
          )}
          {/* ─── الجانب الأيسر (الإشعارات وقائمة الموبايل) ─── */}
          <div className="flex items-center gap-3">
            {/* الإشعارات (تظهر فقط عند فتح المجموعات واختيار مجموعة) */}
            {isNotificationPage && selectedGroup && (
              <Notifications studentGroup={selectedGroup} />
            )}

            {/* زر قائمة الموبايل */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2.5 rounded-2xl bg-slate-900/70 border border-slate-700/60 text-slate-300 hover:text-white hover:border-indigo-500/40 hover:bg-indigo-600/20 transition-all active:scale-95 md:hidden"
              aria-label="القائمة"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-indigo-300" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* ─── قائمة الموبايل المنزلقة المتطورة ─── */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden md:hidden border-t border-indigo-500/15 py-4"
            >
              <nav className="flex flex-col gap-2 p-2 rounded-3xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-xl shadow-2xl">
                {/* الرئيسية */}

                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                    isActive("/") && pathname === "/"
                      ? "bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400">
                    <Home className="w-4 h-4" />
                  </div>
                  <span>الصفحة الرئيسية</span>
                </Link>

                {/* منصة الطلاب */}
                <LoadingLink
                  href="/pages/main"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                    isActive("/pages/main")
                      ? "bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                  spinnerColor="#a5b4fc"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <span>منصة الطلاب وأوائل الدفعات</span>
                </LoadingLink>

                {/* لوحة التحكم */}
                {(currentUser || isAdmin) && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
                      isActive("/admin")
                        ? "bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30"
                        : "text-amber-300 hover:bg-amber-500/10 border border-amber-500/20"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                      <LayoutDashboard className="w-4 h-4" />
                    </div>
                    <span>لوحة التحكم الإدارية</span>
                  </Link>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
