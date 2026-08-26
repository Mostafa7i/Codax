import React, { Suspense, lazy } from "react";
import { motion } from "framer-motion";
import { UserCheck, Pencil, ArrowRightLeft, Eye, EyeOff } from "lucide-react";
import DetailRow from "../components/DetailRow";

const Subscription = lazy(() =>
  import("../components/Subscription").then((mod) => ({ default: mod.default || mod })).catch(() => ({ default: () => null }))
);

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
  </div>
);

export default function RegistrationDataTab({
  studentData,
  newStudentData,
  studentId,
  loadingNewStudent,
  // English name editing
  isEditingEnglishName,
  setIsEditingEnglishName,
  editedEnglishName,
  setEditedEnglishName,
  isSavingEnglishName,
  handleSaveEnglishName,
  // College editing
  isEditingCollege,
  setIsEditingCollege,
  editedCollege,
  setEditedCollege,
  isSavingCollege,
  handleSaveCollege,
  // City editing
  isEditingCity,
  setIsEditingCity,
  editedCity,
  setEditedCity,
  isSavingCity,
  handleSaveCity,
  // Study method
  isChangingStudyMethod,
  handleChangeStudyMethod,
  // Password
  localPassword,
  setLocalPassword,
  showLocalPassword,
  setShowLocalPassword,
  isSavingPassword,
  handleLocalPasswordSave,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-6 max-w-4xl mx-auto font-sans"
      dir="rtl"
    >
      {/* Header Summary Card */}
      <div className="bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-right">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2 mb-1">
              <UserCheck className="text-indigo-400 w-7 h-7" />
              بيانات التسجيل الرسمية
            </h2>
            <p className="text-gray-400 text-sm">
              هذه هي البيانات التي قمت بإدخالها أثناء التسجيل في CodaX
            </p>
          </div>
          {newStudentData && (
            <div className="flex gap-2 flex-wrap">
              {newStudentData.contacted ? (
                <span className="text-xs px-3 py-1 rounded-full font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                  ✓ تم التواصل
                </span>
              ) : (
                <span className="text-xs px-3 py-1 rounded-full font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                  ⏳ قيد التواصل
                </span>
              )}
              <span className="text-xs px-3 py-1 rounded-full font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                {newStudentData.track === "frontend" ? "Frontend Track" : "Backend Track"}
              </span>
            </div>
          )}
        </div>
      </div>

      {loadingNewStudent ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
          {/* 1. Personal Information Card */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 pb-2 border-b border-gray-100 dark:border-gray-700/50 flex items-center gap-2">
              <span className="p-1.5 bg-blue-50 dark:bg-blue-900/40 rounded-lg text-blue-500">
                👤
              </span>
              البيانات الشخصية والاتصال
            </h3>

            <div className="space-y-3">
              <DetailRow
                label="الاسم بالكامل (عربي)"
                value={newStudentData?.arabicName || studentData?.name || "-"}
              />

              {/* English Name - Editable */}
              <div className="flex flex-col border-b border-gray-100 dark:border-gray-700/50 py-2.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400 font-semibold">
                    الاسم بالكامل (إنجليزي)
                  </span>
                  {isEditingEnglishName ? (
                    <div className="flex items-center gap-1.5 w-2/3 max-w-[250px]">
                      <input
                        type="text"
                        value={editedEnglishName}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^A-Za-z\s]/g, "");
                          setEditedEnglishName(val);
                        }}
                        className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full text-left"
                        dir="ltr"
                        placeholder="Full English Name"
                      />
                      <button
                        onClick={handleSaveEnglishName}
                        disabled={isSavingEnglishName}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-2 py-1 text-xs font-bold transition disabled:opacity-50 flex-shrink-0"
                      >
                        {isSavingEnglishName ? "حفظ..." : "حفظ"}
                      </button>
                      <button
                        onClick={() => setIsEditingEnglishName(false)}
                        className="bg-gray-500 hover:bg-gray-600 text-white rounded-lg px-2 py-1 text-xs font-bold transition flex-shrink-0"
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-gray-800 dark:text-gray-200 font-bold text-left">
                        {newStudentData?.englishName || studentData?.englishName || "-"}
                      </span>
                      <button
                        onClick={() => {
                          setEditedEnglishName(
                            newStudentData?.englishName || studentData?.englishName || ""
                          );
                          setIsEditingEnglishName(true);
                        }}
                        className="text-indigo-500 hover:text-indigo-600 p-1 transition"
                        title="تعديل الاسم"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <div
                  className="text-[10px] text-amber-500 dark:text-amber-400 font-semibold mt-1 text-left"
                  dir="rtl"
                >
                  ⚠️ هذا الاسم سيُكتب في الشهادة (يُقبل الحروف الإنجليزية فقط).
                </div>
              </div>

              <DetailRow
                label="رقم الموبايل (واتساب)"
                value={
                  newStudentData?.phone ||
                  (studentData?.id ? String(studentData.id) : "-")
                }
              />
              <DetailRow
                label="البريد الإلكتروني"
                value={newStudentData?.email || studentData?.email || "-"}
              />
              <DetailRow
                label="السن"
                value={newStudentData?.age || studentData?.age || "-"}
              />

              {/* College - Editable */}
              <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-gray-700/50 text-sm">
                <span className="text-gray-500 dark:text-gray-400 font-semibold">
                  الكلية / الدراسة
                </span>
                {isEditingCollege ? (
                  <div className="flex items-center gap-1.5 w-2/3 max-w-[250px]">
                    <input
                      type="text"
                      value={editedCollege}
                      onChange={(e) => setEditedCollege(e.target.value)}
                      className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full text-right"
                      placeholder="الكلية / الدراسة"
                    />
                    <button
                      onClick={handleSaveCollege}
                      disabled={isSavingCollege}
                      className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-2 py-1 text-xs font-bold transition disabled:opacity-50 flex-shrink-0"
                    >
                      {isSavingCollege ? "حفظ..." : "حفظ"}
                    </button>
                    <button
                      onClick={() => setIsEditingCollege(false)}
                      className="bg-gray-500 hover:bg-gray-600 text-white rounded-lg px-2 py-1 text-xs font-bold transition flex-shrink-0"
                    >
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-gray-800 dark:text-gray-200 font-bold text-left">
                      {newStudentData?.college || studentData?.college || "-"}
                    </span>
                    <button
                      onClick={() => {
                        setEditedCollege(
                          newStudentData?.college || studentData?.college || ""
                        );
                        setIsEditingCollege(true);
                      }}
                      className="text-indigo-500 hover:text-indigo-600 p-1 transition"
                      title="تعديل الكلية"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* City - Editable */}
              <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-gray-700/50 text-sm">
                <span className="text-gray-500 dark:text-gray-400 font-semibold">
                  محل الإقامة
                </span>
                {isEditingCity ? (
                  <div className="flex items-center gap-1.5 w-2/3 max-w-[250px]">
                    <input
                      type="text"
                      value={editedCity}
                      onChange={(e) => setEditedCity(e.target.value)}
                      className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full text-right"
                      placeholder="محل الإقامة"
                    />
                    <button
                      onClick={handleSaveCity}
                      disabled={isSavingCity}
                      className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-2 py-1 text-xs font-bold transition disabled:opacity-50 flex-shrink-0"
                    >
                      {isSavingCity ? "حفظ..." : "حفظ"}
                    </button>
                    <button
                      onClick={() => setIsEditingCity(false)}
                      className="bg-gray-500 hover:bg-gray-600 text-white rounded-lg px-2 py-1 text-xs font-bold transition flex-shrink-0"
                    >
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-gray-800 dark:text-gray-200 font-bold text-left">
                      {newStudentData?.city || studentData?.city || "-"}
                    </span>
                    <button
                      onClick={() => {
                        setEditedCity(
                          newStudentData?.city || studentData?.city || ""
                        );
                        setIsEditingCity(true);
                      }}
                      className="text-indigo-500 hover:text-indigo-600 p-1 transition"
                      title="تعديل محل الإقامة"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Course & Track Details */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 pb-2 border-b border-gray-100 dark:border-gray-700/50 flex items-center gap-2">
              <span className="p-1.5 bg-purple-50 dark:bg-purple-900/40 rounded-lg text-purple-500">
                📚
              </span>
              تفاصيل الكورس والاشتراك
            </h3>

            <div className="space-y-3">
              <DetailRow
                label="مسار الدراسة (التراك)"
                value={
                  newStudentData?.track === "backend"
                    ? "Backend 💻"
                    : "Frontend 🌐"
                }
              />

              {/* Study Method - interactive toggle */}
              <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-gray-700/50 text-sm">
                <span className="text-gray-500 dark:text-gray-400 font-semibold">
                  طريقة الدراسة
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-800 dark:text-gray-200 font-bold">
                    {(newStudentData?.studyMethod || studentData?.studyMethod) ===
                    "offline"
                      ? "حضوري 🏫"
                      : "أونلاين 🌐"}
                  </span>
                  <button
                    onClick={handleChangeStudyMethod}
                    disabled={isChangingStudyMethod}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition font-bold disabled:opacity-50"
                    title="تغيير طريقة الحضور"
                  >
                    {isChangingStudyMethod ? (
                      <span className="animate-spin inline-block w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full" />
                    ) : (
                      <ArrowRightLeft className="w-3 h-3" />
                    )}
                    تغيير
                  </button>
                </div>
              </div>

              <DetailRow
                label="المعرفة السابقة بالبرمجة"
                value={
                  newStudentData?.hasExperience === "beginner"
                    ? "🌱 بسيطة"
                    : newStudentData?.hasExperience === "intermediate"
                    ? "⚡ متوسطة"
                    : newStudentData?.hasExperience === "advanced"
                    ? "🚀 عالية"
                    : "🚫 لا يوجد"
                }
              />
              <DetailRow
                label="اسم المرشح (Referred By)"
                value={
                  newStudentData?.referredBy ||
                  studentData?.referredBy ||
                  "لا يوجد"
                }
              />
              <DetailRow
                label="المجموعة المسجلة"
                value={
                  newStudentData?.group
                    ? `مجموعة ${newStudentData.group}`
                    : studentData?.group
                    ? `مجموعة ${studentData.group}`
                    : "غير مسجل"
                }
              />
              <DetailRow
                label="تاريخ التسجيل بالمنصة"
                value={
                  newStudentData?.registrationDate
                    ? new Date(
                        newStudentData.registrationDate
                      ).toLocaleDateString("ar-EG", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"
                }
              />
            </div>
            <div className="mx-auto">
              <Suspense fallback={null}>
                <Subscription studentData={studentData} studentId={studentId} />
              </Suspense>
            </div>
          </div>

          {/* 3. Account Settings & Security */}
          <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-xl space-y-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 pb-2 border-b border-gray-100 dark:border-gray-700/50 flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg text-indigo-500">
                ⚙️
              </span>
              إعدادات الحساب والأمان
            </h3>

            <div>
              {/* Password Change Form */}
              <div className="bg-gray-50 dark:bg-gray-900/30 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col space-y-4">
                <h4 className="font-bold text-gray-700 dark:text-gray-300 text-sm">
                  تغيير كلمة المرور
                </h4>

                <div className="space-y-2">
                  <label className="text-xs text-gray-500 dark:text-gray-400 font-semibold block">
                    كلمة المرور الجديدة
                  </label>
                  <div className="relative">
                    <input
                      type={showLocalPassword ? "text" : "password"}
                      value={localPassword}
                      onChange={(e) => setLocalPassword(e.target.value)}
                      placeholder="اكتب كلمة المرور الجديدة"
                      className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right pr-4 pl-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLocalPassword(!showLocalPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                    >
                      {showLocalPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <span className="text-[10px] text-gray-400 block">
                    * يجب أن تكون بين 5 و 10 أحرف.
                  </span>
                </div>

                <button
                  onClick={handleLocalPasswordSave}
                  disabled={isSavingPassword}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-md transition disabled:opacity-50"
                >
                  {isSavingPassword ? "جاري الحفظ..." : "تحديث كلمة المرور"}
                </button>
              </div>
            </div>
          </div>

          {/* 4. Notes & Administrative Remarks */}
          {(newStudentData?.note || studentData?.note) && (
            <div className="md:col-span-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/30 rounded-3xl p-6 shadow-md space-y-2">
              <h4 className="text-yellow-800 dark:text-yellow-400 font-bold text-sm flex items-center gap-1.5">
                <span>📝</span> ملاحظات إدارة CodaX:
              </h4>
              <p className="text-yellow-900 dark:text-yellow-200/90 text-sm leading-relaxed italic">
                {newStudentData?.note || studentData?.note}
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
