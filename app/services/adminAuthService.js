import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

/**
 * دالة ترجمة أخطاء Firebase Auth إلى رسائل عربية واضحة ومفهومة
 */
export const getAuthErrorMessage = (err) => {
  const code = err?.code || "";
  const msgs = {
    "auth/invalid-credential": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    "auth/user-not-found": "لا يوجد حساب مسجل بهذا البريد الإلكتروني",
    "auth/wrong-password": "كلمة المرور غير صحيحة",
    "auth/invalid-email": "صيغة البريد الإلكتروني غير صحيحة",
    "auth/user-disabled": "تم تعطيل هذا الحساب من قبل الإدارة",
    "auth/too-many-requests":
      "تم تعليق محاولات الدخول مؤقتاً بسبب كثرة المحاولات الخاطئة. يرجى الانتظار قليلاً أو استعادة كلمة المرور",
    "auth/network-request-failed": "تعذر الاتصال، يرجى التحقق من اتصالك بالإنترنت",
    "auth/internal-error": "حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً",
  };

  return msgs[code] || err?.message || "حدث خطأ أثناء المصادقة، يرجى المحاولة مرة أخرى";
};

/**
 * ضبط كوكي الجلسة لـ Next.js Middleware
 */
export const setAdminSessionCookie = (role = "admin") => {
  if (typeof document !== "undefined") {
    const maxAge = 60 * 60 * 24 * 7; // 7 أيام
    document.cookie = `codax-admin-session=${role}; path=/; max-age=${maxAge}; SameSite=Lax`;
  }
};

/**
 * مسح كوكي الجلسة عند تسجيل الخروج
 */
export const clearAdminSessionCookie = () => {
  if (typeof document !== "undefined") {
    document.cookie =
      "codax-admin-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
    document.cookie =
      "__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
  }
};

/**
 * خدمة تسجيل دخول الأدمن مع التحقق من الصلاحيات وتعيين الكوكي
 */
export const loginAdmin = async (email, password) => {
  if (!email?.trim() || !password) {
    throw new Error("يرجى إدخال البريد الإلكتروني وكلمة المرور");
  }

  // 1. مصادقة Firebase Auth
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );
  const user = userCredential.user;

  // 2. التحقق من جدول admins في Firestore
  const adminsQuery = query(
    collection(db, "admins"),
    where("email", "==", user.email?.toLowerCase())
  );
  const adminSnap = await getDocs(adminsQuery);

  if (!adminSnap.empty) {
    setAdminSessionCookie("admin");
    return { success: true, role: "admin", user };
  }

  // 3. التحقق هل هو سيليز في جدول salesReps
  try {
    const salesSnap = await getDoc(doc(db, "salesReps", user.uid));
    if (salesSnap.exists()) {
      setAdminSessionCookie("sales");
      return { success: true, role: "sales", user };
    }
  } catch (salesErr) {
    console.warn("Sales check warning:", salesErr);
  }

  // 4. ليس أدمن ولا سيليز -> رفض وتسجيل خروج فوري
  clearAdminSessionCookie();
  await signOut(auth);
  throw new Error("عذراً، هذا الحساب ليس لديه صلاحيات الوصول إلى لوحة الإدارة.");
};

/**
 * خدمة إرسال رابط استعادة كلمة المرور
 */
export const requestPasswordReset = async (email) => {
  if (!email?.trim()) {
    throw new Error("يرجى إدخال البريد الإلكتروني");
  }

  await sendPasswordResetEmail(auth, email.trim());
  return { success: true };
};

/**
 * خدمة تسجيل الخروج
 */
export const logoutAdmin = async () => {
  clearAdminSessionCookie();
  await signOut(auth);
};
