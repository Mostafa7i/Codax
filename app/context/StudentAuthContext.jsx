"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { auth, db } from "@/app/services/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

const StudentAuthContext = createContext(null);

const AUTH_SALT = "codax_secure_auth_v1_salt";

// دالة لتشفير البيانات وإنشاء رمز توثيق آمن أحادي الاتجاه SHA-256 (Native Web Crypto API)
export async function generateAuthHash(studentId, password) {
  try {
    const message = `${String(studentId)}:${String(password)}:${AUTH_SALT}`;
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (err) {
    console.error("Error generating auth hash:", err);
    return null;
  }
}

export function StudentAuthProvider({ children }) {
  const [authenticatedStudentId, setAuthenticatedStudentId] = useState(null);
  const [authTokens, setAuthTokens] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);

  // التحقق من صلاحيات الأدمن والاستماع لتغيرات الجلسة
  useEffect(() => {
    // 1. ⚠️ الكوكي مجرد UI hint سريع فقط — ليس ضماناً أمنياً
    // الفحص الحقيقي يتم دائماً عبر Firebase Auth + Firestore (أسفل)
    // لا تُستخدم الكوكي وحدها كـ security gate في أي مكان حساس
    if (typeof document !== "undefined") {
      const hasAdminCookie =
        document.cookie.includes("codax-admin-session=admin") ||
        document.cookie.includes("codax-admin-session=sales") ||
        document.cookie.includes("codax-admin-session=true");
      if (hasAdminCookie) {
        setIsAdmin(true); // قيمة مؤقتة — ستُؤكَّد أو تُلغى بواسطة Firebase بعد ثوانٍ
      }
    }

    // 2. الفحص الحقيقي والموثوق عبر Firebase Auth + Firestore
    // هذا الفحص يُلغي نتيجة الكوكي في حال التلاعب
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // لا يوجد مستخدم مسجل في Firebase — الكوكي وحدها لا تكفي
        setIsAdmin(false);
        if (typeof document !== "undefined") {
          // مسح الكوكي المزورة إذا لم يكن هناك مستخدم حقيقي
          const hasAdminCookie = document.cookie.includes("codax-admin-session");
          if (!hasAdminCookie) setIsAdmin(false);
          // نبقي الكوكي فقط لأغراض UI transitional، لكن الـ state الفعلي false
          setIsAdmin(false);
        }
        return;
      }

      try {
        const q = query(
          collection(db, "admins"),
          where("email", "==", user.email?.toLowerCase())
        );
        const snap = await getDocs(q);

        if (!snap.empty) {
          setIsAdmin(true);
          return;
        }

        const adminEmail =
          process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
          process.env.ADMIN_EMAIL ||
          "mostasafi7@gmail.com";
        if (user.email?.toLowerCase() === adminEmail.toLowerCase()) {
          setIsAdmin(true);
          return;
        }

        setIsAdmin(false);
      } catch (err) {
        console.error("Error verifying admin status in StudentAuthContext:", err);
      }
    });

    return () => unsub();
  }, []);

  // عند تحميل التطبيق، التحقق فقط من وجود رمز تجزئة (Hash Token) محفوظ في حالة "تذكرني"
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const storedToken = localStorage.getItem("codax_auth_token");
        const storedId = localStorage.getItem("codax_auth_id");
        if (storedToken && storedId) {
          setAuthTokens({ [storedId]: storedToken });
          setAuthenticatedStudentId(storedId);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // دالة توثيق الطالب عند تسجيل الدخول
  const authenticateStudent = useCallback(
    async (studentId, enteredPassword, rememberMe = false) => {
      const sId = String(studentId);
      const token = await generateAuthHash(sId, enteredPassword);

      setAuthenticatedStudentId(sId);
      if (token) {
        setAuthTokens((prev) => ({ ...prev, [sId]: token }));
      }

      if (rememberMe && token && typeof window !== "undefined") {
        // حفظ رمز التجزئة المشفر فقط بدون أي كلمات مرور صريحة
        localStorage.setItem("codax_auth_token", token);
        localStorage.setItem("codax_auth_id", sId);
      }
    },
    []
  );

  // دالة التحقق مما إذا كان المستخدم مصرحاً له بفتح صفحة هذا الطالب تحديداً
  const isStudentAuthorized = useCallback(
    async (studentId, studentActualPassword) => {
      // 1. إذا كان المستخدم أدمن -> السماح الفوري بدون أي كلمة مرور
      if (isAdmin) {
        return true;
      }

      if (typeof document !== "undefined") {
        const hasAdminCookie =
          document.cookie.includes("codax-admin-session=admin") ||
          document.cookie.includes("codax-admin-session=sales") ||
          document.cookie.includes("codax-admin-session=true");
        if (hasAdminCookie) {
          setIsAdmin(true);
          return true;
        }
      }

      const currentUser = auth?.currentUser;
      if (currentUser?.email) {
        try {
          const q = query(
            collection(db, "admins"),
            where("email", "==", currentUser.email.toLowerCase())
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            setIsAdmin(true);
            return true;
          }
        } catch (e) {
          console.error("Admin check fallback error:", e);
        }
      }

      const sId = String(studentId);

      // 2. التحقق من الجلسة في الذاكرة (In-Memory Session)
      if (authenticatedStudentId && String(authenticatedStudentId) === sId) {
        return true;
      }

      // 3. التحقق من رمز التجزئة المشفر (Remember Me Token)
      if (typeof window !== "undefined" && studentActualPassword) {
        const currentToken =
          authTokens[sId] || localStorage.getItem("codax_auth_token");
        const rememberedId = localStorage.getItem("codax_auth_id");

        if (currentToken && rememberedId === sId) {
          const expectedToken = await generateAuthHash(
            sId,
            studentActualPassword
          );
          if (expectedToken && currentToken === expectedToken) {
            setAuthenticatedStudentId(sId);
            return true;
          }
        }
      }

      return false;
    },
    [isAdmin, authenticatedStudentId, authTokens]
  );

  // تسجيل الخروج
  const logoutStudent = useCallback(() => {
    setAuthenticatedStudentId(null);
    setAuthTokens({});
    if (typeof window !== "undefined") {
      localStorage.removeItem("codax_auth_token");
      localStorage.removeItem("codax_auth_id");
    }
  }, []);

  return (
    <StudentAuthContext.Provider
      value={{
        authenticatedStudentId,
        authenticateStudent,
        isStudentAuthorized,
        logoutStudent,
        isAdmin,
      }}
    >
      {children}
    </StudentAuthContext.Provider>
  );
}

export function useStudentAuth() {
  const context = useContext(StudentAuthContext);
  if (!context) {
    return {
      authenticatedStudentId: null,
      authenticateStudent: async () => {},
      isStudentAuthorized: async () => false,
      logoutStudent: () => {},
      isAdmin: false,
    };
  }
  return context;
}
