"use client";
import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "@/app/services/firebaseConfig";
import {
  Shield, UserPlus, Trash2, Search, CheckCircle2, XCircle, Loader2, AlertCircle, Key
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminsControl() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  // نموذج إنشاء أدمن جديد
  const [newAdmin, setNewAdmin] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });

  // جلب الأدمنز من Firestore
  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "admins"));
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setAdmins(list);
    } catch (err) {
      showMessage("فشل جلب قائمة الأدمنز", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  // إنشاء أدمن جديد + تسجيله في Auth + إضافته في Firestore
  const handleCreateAdmin = async (e) => {
    e.preventDefault();

    const { email, password, confirmPassword } = newAdmin;

    if (!email || !password) return showMessage("الإيميل وكلمة المرور مطلوبين", "error");
    if (password !== confirmPassword) return showMessage("كلمة المرور غير متطابقة", "error");
    if (password.length < 6) return showMessage("كلمة المرور لازم تكون 6 أحرف على الأقل", "error");

    setCreating(true);
    try {
      // 1. إنشاء المستخدم في Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 2. إضافته كأدمن في Firestore
      await setDoc(doc(db, "admins", uid), {
        email: email.toLowerCase(),
        uid,
        createdAt: new Date(),
        createdBy: auth.currentUser?.email || "system"
      });

      showMessage(`تم إنشاء الأدمن ${email} بنجاح!`, "success");
      setNewAdmin({ email: "", password: "", confirmPassword: "" });
      fetchAdmins();
    } catch (error) {
      const messages = {
        "auth/email-already-in-use": "الإيميل ده مستخدم بالفعل",
        "auth/weak-password": "كلمة المرور ضعيفة جدًا",
        "auth/invalid-email": "الإيميل غير صالح"
      };
      showMessage(messages[error.code] || "فشل إنشاء الأدمن", "error");
    } finally {
      setCreating(false);
    }
  };

  // حذف أدمن (من Firestore فقط، مش من Auth لأنه ممكن يكون مستخدم عادي)
  const handleRemoveAdmin = async (uid, email) => {
    if (!confirm(`هل أنت متأكد من إزالة صلاحيات الأدمن من ${email}؟`)) return;

    setDeleting(uid);
    try {
      await deleteDoc(doc(db, "admins", uid));
      showMessage(`تم إزالة صلاحيات الأدمن من ${email}`, "success");
      fetchAdmins();
    } catch (error) {
      showMessage("فشل إزالة الصلاحيات", "error");
    } finally {
      setDeleting("");
    }
  };

  const filteredAdmins = admins.filter(a =>
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 lg:p-8">
      <div className="max-w-5xl mx-auto">

        {/* رسالة النجاح/الخطأ */}
        <AnimatePresence>
          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-6 p-4 rounded-2xl flex items-center gap-3 shadow-lg border ${
                message.type === "success"
                  ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 text-emerald-800 dark:text-emerald-300"
                  : "bg-red-100 dark:bg-red-900/30 border-red-300 text-red-800 dark:text-red-300"
              }`}
            >
              {message.type === "success" ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
              <span className="font-medium">{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* العنوان */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-3 flex items-center justify-center gap-3">
            <Shield className="w-10 h-10 text-indigo-600" />
            إدارة الأدمنز
          </h1>
          <p className="text-gray-600 dark:text-gray-400">إنشاء أدمن جديد أو إزالة صلاحيات</p>
        </motion.div>

        {/* نموذج إنشاء أدمن جديد */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 mb-8 border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-3">
            <UserPlus className="w-7 h-7 text-green-600" />
            إنشاء أدمن جديد
          </h2>

          <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="email"
              placeholder="الإيميل (example@gmail.com)"
              value={newAdmin.email}
              onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
              className="px-5 py-4 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
              required
              disabled={creating}
            />
            <input
              type="password"
              placeholder="كلمة المرور (6 أحرف على الأقل)"
              value={newAdmin.password}
              onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
              className="px-5 py-4 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
              required
              minLength="6"
              disabled={creating}
            />
            <input
              type="password"
              placeholder="تأكيد كلمة المرور"
              value={newAdmin.confirmPassword}
              onChange={(e) => setNewAdmin({ ...newAdmin, confirmPassword: e.target.value })}
              className="px-5 py-4 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
              required
              disabled={creating}
            />
            <button
              type="submit"
              disabled={creating}
              className="md:col-span-3 px-8 py-4 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg disabled:opacity-60 transition-all flex items-center justify-center gap-3"
            >
              {creating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Key className="w-6 h-6" />}
              {creating ? "جاري الإنشاء..." : "إنشاء أدمن جديد"}
            </button>
          </form>
        </motion.div>

        {/* البحث */}
        <div className="mb-6 relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="ابحث بالإيميل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-5 py-4 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:ring-4 focus:ring-indigo-500/30"
          />
        </div>

        {/* قائمة الأدمنز */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
              <Shield className="w-7 h-7 text-indigo-600" />
              الأدمنز الحاليين ({filteredAdmins.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center"><Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" /></div>
          ) : filteredAdmins.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">لا يوجد أدمنز حاليًا</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAdmins.map((admin) => (
                <motion.div
                  key={admin.uid}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {admin.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-lg text-gray-800 dark:text-white">{admin.email}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        تم الإنشاء: {admin.createdAt?.toDate?.()?.toLocaleDateString?.("ar-EG") || "غير معروف"}
                      </p>
                    </div>
                  </div>

                 {admin.rol === "superAdmin" ? (
                 null
                 ) : ( <button
                    onClick={() => handleRemoveAdmin(admin.uid, admin.email)}
                    disabled={deleting === admin.uid}
                    className="p-3 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all group"
                  >
                    {deleting === admin.uid ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    )}
                  </button>)}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}