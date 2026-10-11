"use client";
import React, { useEffect, useRef, useState , useMemo } from "react";
import { db } from "@/app/services/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useGroupContext } from "@/app/context/GroupContextProvider";
import { 
  Calendar, ExternalLink, Github, 
  AlertCircle, Users, Clock, Eye, Copy, Check, X, Link2 
} from "lucide-react";

// دالة لتوليد لون خلفية ثابت بناءً على الاسم للافتار
const getAvatarColor = (name) => {
  const colors = [
    "from-indigo-500 to-purple-500",
    "from-blue-500 to-teal-500",
    "from-emerald-500 to-green-500",
    "from-orange-500 to-amber-500",
    "from-rose-500 to-pink-500",
    "from-violet-500 to-fuchsia-500"
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const StudentsLinksList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState("");
  const { availableGroups, groupStatuses } = useGroupContext();
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [copiedLink, setCopiedLink] = useState(null);

  const modalRef = useRef(null);

  useEffect(() => {
    if (showModal && modalRef.current) {
      modalRef.current.scrollTop = 0;
    }
  }, [showModal]);

  // تحديث حالة قراءة الروابط الجديدة للطلاب
  useEffect(() => {
    const markAllAsRead = async () => {
      try {
        const q = query(collection(db, "students"), where("read", "==", false));
        const newStudentSnap = await getDocs(q);
        const promises = [];
        newStudentSnap.forEach((docu) => {
          promises.push(updateDoc(doc(db, "students", docu.id), { read: true }));
        });
        await Promise.all(promises);
      } catch (e) {
        console.error("Error marking all as read:", e);
      }
    };
    markAllAsRead();
  }, []);

  useEffect(() => {
    if (!groupStatuses) return;
    const activeGroups = Object.keys(groupStatuses).filter(
      (g) => groupStatuses[g] === true
    );
    if (activeGroups.length === 0) return;
    if (!selectedGroup) {
      setSelectedGroup(activeGroups[0]);
    }
  }, [groupStatuses]);

  useEffect(() => {
    const fetchStudentsWithLinks = async () => {
      setLoading(true);
      setError(null);
      try {
        const studentsRef = collection(db, "students");
        const q = query(
          studentsRef,
          where("group", "==", selectedGroup),
          where("linksHistory", "!=", [])
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setStudents([]);
          setLoading(false);
          return;
        }

        const studentsList = await Promise.all(
          querySnapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const linksHistory = data.linksHistory || [];

            const latestUpload =
              linksHistory.length > 0
                ? Math.max(
                    ...linksHistory.map((link) => link.uploadedAt?.seconds || 0)
                  )
                : null;

            return {
              id: docSnap.id,
              name: data.name || "غير متوفر",
              currentLink: data.studentLink || "",
              linksHistory: linksHistory
                .map((link) => ({
                  url: link.url,
                  title: link.title || "",
                  uploadedAt: link.uploadedAt
                    ? new Date(link.uploadedAt.seconds * 1000)
                    : null,
                }))
                .sort(
                  (a, b) =>
                    (b.uploadedAt?.getTime() || 0) -
                    (a.uploadedAt?.getTime() || 0)
                ),
              uploadedAt: latestUpload ? new Date(latestUpload * 1000) : null,
            };
          })
        );

        studentsList.sort(
          (a, b) =>
            (b.uploadedAt?.getTime() || 0) - (a.uploadedAt?.getTime() || 0)
        );
        setStudents(studentsList);

        await Promise.all(
          studentsList.map(async (student) => {
            if (!student.uploadedAt) {
              await updateDoc(doc(db, "students", student.id), {
                uploadedAt: serverTimestamp(),
              });
            }
          })
        );
      } catch (error) {
        console.error("❌ خطأ في جلب بيانات الطلاب:", error);
        setError("حدث خطأ أثناء تحميل البيانات.");
      } finally {
        setLoading(false);
      }
    };

    if (selectedGroup) {
      fetchStudentsWithLinks();
    }
  }, [selectedGroup]);

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(url);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const totalLinksCount = useMemo(() => {
    return students.reduce((sum, s) => sum + (s.linksHistory?.length || 0), 0);
  }, [students]);

  return (
    <div className="w-full text-right" dir="rtl">
      {/* رأس الصفحة والمجموعات */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              روابط GitHub للطلاب
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              متابعة الروابط والمشاريع المرفوعة من الطلاب
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">المجموعة:</span>
            <div className="relative">
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="pr-4 pl-8 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm appearance-none cursor-pointer min-w-36 transition-all"
              >
                <option value="" hidden>اختر مجموعة</option>
                {availableGroups.map((group) => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
              <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {selectedGroup && (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              groupStatuses[selectedGroup] 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                groupStatuses[selectedGroup] ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              }`} />
              <span>{groupStatuses[selectedGroup] ? "مفتوحة" : "مغلقة"}</span>
            </div>
          )}
        </div>
      </div>

      {/* ملخص الإحصائيات السريعة */}
      {selectedGroup && students.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-linear-to-br from-violet-500/5 to-indigo-500/5 dark:from-violet-500/10 dark:to-indigo-500/10 rounded-2xl border border-violet-500/10 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">الطلاب الذين رفعوا</p>
              <h4 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{students.length}</h4>
            </div>
            <Users className="w-8 h-8 text-violet-500 opacity-60" />
          </div>
          <div className="p-4 bg-linear-to-br from-blue-500/5 to-teal-500/5 dark:from-blue-500/10 dark:to-teal-500/10 rounded-2xl border border-blue-500/10 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">إجمالي الروابط</p>
              <h4 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{totalLinksCount}</h4>
            </div>
            <Link2 className="w-8 h-8 text-blue-500 opacity-60" />
          </div>
        </div>
      )}

      {/* المحتوى الرئيسي */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">⏳ جاري تحميل البيانات...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : students.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-800/10">
          <Github className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-60" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">
            {selectedGroup ? "لا يوجد طلاب قاموا برفع روابط في هذه المجموعة بعد ❌" : "يرجى تحديد مجموعة من القائمة بالأعلى."}
          </p>
        </div>
      ) : (
        <>
          {/* عرض الكروت للموبايل */}
          <div className="block sm:hidden space-y-3">
            {students.map((student) => {
              const initials = student.name.split(" ").slice(0, 2).map(n => n[0]).join("");
              return (
                <div
                  key={student.id}
                  onClick={() => {
                    setSelectedStudent(student);
                    setShowModal(true);
                  }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-linear-to-tr ${getAvatarColor(student.name)} text-white flex items-center justify-center font-bold text-sm shadow-inner`}>
                      {initials}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-white group-hover:text-violet-600 transition-colors">
                        {student.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        آخر رفع: {student.uploadedAt ? student.uploadedAt.toLocaleDateString("ar-EG") : "غير محدد"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 text-xs font-bold rounded-full">
                      {student.linksHistory?.length || 0} روابط
                    </span>
                    <Eye className="w-4 h-4 text-gray-400 group-hover:text-violet-500 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* جدول للشاشات الكبيرة */}
          <div className="hidden sm:block overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-200 font-bold">
                  <th className="p-4 text-sm">👤 الطالب</th>
                  <th className="p-4 text-sm text-center">📊 عدد الروابط</th>
                  <th className="p-4 text-sm">📅 آخر تحديث</th>
                  <th className="p-4 text-sm text-center">الروابط السريعة</th>
                  <th className="p-4 text-sm text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {students.map((student) => {
                  const initials = student.name.split(" ").slice(0, 2).map(n => n[0]).join("");
                  const latestLink = student.linksHistory?.[0];
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-violet-500/[0.01] dark:hover:bg-violet-500/[0.02] transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full bg-linear-to-tr ${getAvatarColor(student.name)} text-white flex items-center justify-center font-bold text-sm shadow-inner shrink-0`}>
                            {initials}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800 dark:text-white">
                              {student.name}
                            </h4>
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              رقم المعرف: {student.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-1 bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 text-xs font-bold rounded-full">
                          {student.linksHistory?.length || 0} روابط مضافة
                        </span>
                      </td>
                      <td className="p-4">
                        {student.uploadedAt ? (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span>
                              {student.uploadedAt.toLocaleString("ar-EG", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {latestLink ? (
                          <div className="flex items-center justify-center gap-2">
                            <a
                              href={latestLink.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors max-w-44 truncate"
                              title={latestLink.title || latestLink.url}
                            >
                              <Github className="w-3.5 h-3.5 text-gray-500 dark:text-gray-300" />
                              <span className="truncate">{latestLink.title || "عرض المستودع"}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 text-center block">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowModal(true);
                          }}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-violet-600/10"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          عرض السجل
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* مودال تفاصيل سجل الروابط */}
      {showModal && selectedStudent && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setShowModal(false)}
        >
          <div 
            ref={modalRef}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-xl w-full max-h-[80vh] flex flex-col overflow-hidden transform transition-all border border-gray-100 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-linear-to-tr ${getAvatarColor(selectedStudent.name)} text-white flex items-center justify-center font-bold text-sm shadow-inner`}>
                  {selectedStudent.name.split(" ").slice(0, 2).map(n => n[0]).join("")}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    سجل روابط {selectedStudent.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    إجمالي الروابط: {selectedStudent.linksHistory?.length || 0}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30 dark:bg-gray-900/10">
              {selectedStudent.linksHistory && selectedStudent.linksHistory.length > 0 ? (
                <div className="relative border-r-2 border-gray-200 dark:border-gray-700 pr-5 mr-3 space-y-6 py-2">
                  {selectedStudent.linksHistory.map((link, index) => (
                    <div key={index} className="relative">
                      {/* Timeline Dot */}
                      <span className="absolute -right-[27px] top-1.5 flex items-center justify-center w-3 h-3 rounded-full bg-violet-600 ring-4 ring-white dark:ring-gray-800" />
                      
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700/80 shadow-sm">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
                            الرابط #{selectedStudent.linksHistory.length - index}
                          </span>
                          <span className="text-[11px] text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {link.uploadedAt ? link.uploadedAt.toLocaleString("ar-EG", {
                              dateStyle: "medium",
                              timeStyle: "short"
                            }) : "تاريخ غير متوفر"}
                          </span>
                        </div>
                        
                        <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">
                          {link.title || "بدون عنوان"}
                        </h4>

                        <div className="flex items-center justify-between gap-4 border-t border-gray-50 dark:border-gray-700/50 pt-3">
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[240px]" dir="ltr">
                            {link.url}
                          </p>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleCopyLink(link.url)}
                              className={`p-2 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                                copiedLink === link.url
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300"
                              }`}
                              title="نسخ الرابط"
                            >
                              {copiedLink === link.url ? (
                                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>

                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors flex items-center justify-center"
                              title="زيارة الرابط"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                  لا يوجد سجل روابط متاح لهذا الطالب.
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(StudentsLinksList);
