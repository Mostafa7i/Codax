"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "@/app/services/firebaseConfig";
import {
  setAdminSessionCookie,
  clearAdminSessionCookie,
} from "@/app/services/adminAuthService";
import {
  BellRing,
  SlidersHorizontal,
  Users,
  BookOpenText,
  Activity,
  Trophy,
  MessageCircleQuestion,
  UserCheck,
  MessageCircleHeart,
  Gift,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  PackageOpen,
  Shield,
  Radio,
  Coins,
  Briefcase,
  FileArchive,
  Banknote,
  Award,
  Home,
} from "lucide-react";
// ── AdminGuard: يفحص Firebase Auth + Firestore admins collection ──────────────
function AdminGuard({ children }) {
  const router = useRouter();
  const [status, setStatus] = useState("loading"); // loading | admin | denied

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        clearAdminSessionCookie();
        setStatus("denied");
        const currentPath =
          typeof window !== "undefined" ? window.location.pathname : "/admin";
        router.replace(`/auth/Login?redirect=${encodeURIComponent(currentPath)}`);
        return;
      }

      try {
        // تحقق من collection admins
        const q = query(
          collection(db, "admins"),
          where("email", "==", user.email?.toLowerCase())
        );
        const snap = await getDocs(q);

        if (!snap.empty) {
          setAdminSessionCookie("admin");
          setStatus("admin");
          return;
        }

        // تحقق هل هو سيليز
        const salesSnap = await getDoc(doc(db, "salesReps", user.uid));
        if (salesSnap.exists()) {
          setAdminSessionCookie("sales");
          router.replace("/sales-dashboard");
        } else {
          clearAdminSessionCookie();
          await signOut(auth);
          router.replace("/auth/Login?reason=unauthorized");
        }
        setStatus("denied");
      } catch (err) {
        console.error("AdminGuard error:", err);
        clearAdminSessionCookie();
        setStatus("denied");
        router.replace("/auth/Login");
      }
    });

    return () => unsub();
  }, [router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-gray-400 text-sm">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (status === "denied") return null;

  return children;
}

// ── DashboardLayout: السايدبار الرئيسي ────────────────────────────────────────
function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // إحصائيات الإشعارات
  const [likesUnread, setLikesUnread] = useState(0);
  const [dislikesUnread, setDislikesUnread] = useState(0);
  const [register, setRegister] = useState(0);
  const [complaintsBox, setComplaintsBox] = useState(0);
  const [pendingPointsRequests, setPendingPointsRequests] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const subs = [];

    const sub = (q, setter) =>
      onSnapshot(q, (snap) => setter(snap.size));

    subs.push(sub(query(collection(db, "likesStudents"), where("read", "==", false)), setLikesUnread));
    subs.push(sub(query(collection(db, "dislikesStudents"), where("read", "==", false)), setDislikesUnread));
    subs.push(sub(query(collection(db, "NewStudents"), where("read", "==", false)), setRegister));
    subs.push(sub(query(collection(db, "messages"), where("read", "==", false)), setComplaintsBox));
    subs.push(sub(query(collection(db, "pointsRequests"), where("status", "==", "pending")), setPendingPointsRequests));

    return () => subs.forEach((u) => u());
  }, []);

  const notificationsCount = likesUnread + dislikesUnread;

  const navigation = useMemo(
    () => [
      { name: "التحكم في الطلاب", href: "/admin/students", icon: SlidersHorizontal, notify: unreadMessages },
      { name: "الطلاب الجدد", href: "/admin/new-students", icon: UserCheck, notify: register },
      { name: "ردود الفعل", href: "/admin/reactions", icon: MessageCircleHeart, notify: notificationsCount },
      { name: "صندوق الشكاوي", href: "/admin/messages", icon: PackageOpen, notify: complaintsBox },
      { name: "الإشعارات", href: "/admin/notifications", icon: BellRing },
      { name: "المهام", href: "/admin/zip-files", icon: FileArchive },
      { name: "الحسابات", href: "/admin/installments", icon: Banknote },
      { name: "طلبات النقاط", href: "/admin/points-requests", icon: Coins, notify: pendingPointsRequests },
      { name: "الحالة اللحظية", href: "/admin/activity", icon: Radio },
      { name: "الامتحانات", href: "/admin/exams", icon: BookOpenText },
      { name: "الكؤوس والنقاط", href: "/admin/trophy", icon: Trophy },
      { name: "إضافة سؤال", href: "/admin/panel", icon: MessageCircleQuestion },
      { name: "إدارة الهدايا", href: "/admin/gifts", icon: Gift },
      { name: "سجل الهدايا", href: "/admin/gifts-log", icon: Gift },
      { name: "روابط الطلاب", href: "/admin/links", icon: Activity },
      { name: "المبيعات", href: "/admin/sales", icon: Briefcase },
      { name: "الشهادات", href: "/admin/certificates", icon: Award },
      { name: "الأدمن", href: "/admin/admins", icon: Shield },
      { name: "الزوار اللحظيين", href: "/admin/visitors", icon: Users },
    ],
    [unreadMessages, notificationsCount, register, complaintsBox, pendingPointsRequests]
  );

  const handleLogout = useCallback(async () => {
    clearAdminSessionCookie();
    await signOut(auth);
    router.replace("/auth/Login");
  }, [router]);

  const sidebarBase = `fixed inset-y-0 right-0 z-50 h-full bg-white dark:bg-gray-950 shadow-2xl border-l border-gray-200 dark:border-gray-800
    transition-all duration-300 flex flex-col lg:static lg:inset-auto lg:translate-x-0`;
  const sidebarWidth = isSidebarCollapsed ? "lg:w-20" : "lg:w-72";
  const sidebarMobile = isMobileMenuOpen ? "translate-x-0 w-72" : "translate-x-full";

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden" dir="rtl">
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile toggle button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed top-4 right-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg lg:hidden"
        aria-label="فتح القائمة"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <aside className={`${sidebarBase} ${sidebarWidth} ${sidebarMobile}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div className={`flex items-center gap-3 ${isSidebarCollapsed && "lg:hidden"}`}>
            <Link title="الرئيسية" href={"/"}><Home  className="w-8 h-8 text-indigo-600" /></Link>
            
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">لوحة التحكم</h1>
          </div>
          <button
            onClick={() => setIsSidebarCollapsed((p) => !p)}
            className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {isSidebarCollapsed ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`group relative flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${active
                    ? "bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }
                  ${isSidebarCollapsed ? "lg:justify-center" : ""}
                `}
              >
                <Icon className={`w-5 h-5 shrink-0 ${active ? "text-white" : "text-gray-500 group-hover:text-indigo-600"}`} />
                <span className={`truncate ${isSidebarCollapsed ? "lg:hidden" : ""}`}>
                  {item.name}
                </span>
                {item.notify > 0 && (
                  <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow">
                    {item.notify > 99 ? "99+" : item.notify}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 shrink-0">
          <div className={`flex items-center gap-3 mb-4 ${isSidebarCollapsed ? "lg:justify-center" : ""}`}>
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
              {auth.currentUser?.email?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div className={`min-w-0 ${isSidebarCollapsed ? "lg:hidden" : ""}`}>
              <p className="font-semibold text-sm truncate text-gray-800 dark:text-white">
                {auth.currentUser?.displayName || "الأدمن"}
              </p>
              <p className="text-xs text-gray-500 truncate">{auth.currentUser?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all
              ${isSidebarCollapsed ? "lg:justify-center" : ""}`}
          >
            <LogOut className="w-5 h-5" />
            <span className={isSidebarCollapsed ? "lg:hidden" : ""}>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">
        {children}
      </main>
    </div>
  );
}

// ── Root Admin Layout ─────────────────────────────────────────────────────────
export default function AdminLayout({ children }) {
  return (
    <AdminGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </AdminGuard>
  );
}
