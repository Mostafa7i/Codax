"use client";
import React, {
  useState,
  useEffect,
  useCallback,
  lazy,
  Suspense,
  useRef,
} from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Users,
  ClipboardList,
  BookOpenText,
  Gift,
  Sparkles,
  Award,
  UserCheck,
  Lock,
} from "lucide-react";

import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig";
import { useGroupContext } from "@/app/context/GroupContextProvider";
import { useStudentAuth } from "@/app/context/StudentAuthContext";
import { useStudentProfile } from "@/app/hooks/useStudentProfile";
import PasswordModal from "../(partsMainPage)/PasswordModal";

// Sub-components
import StudentHeader from "./components/StudentHeader";
import TabNav from "./components/TabNav";
import LuckyWheelModal from "@/app/components/LuckyWheelModal";

// Tabs
import OverviewTab from "./tabs/OverviewTab";
import TasksTab from "./tabs/TasksTab";
import ExamTab from "./tabs/ExamTab";
import GiftTab from "./tabs/GiftTab";
import RegistrationDataTab from "./tabs/RegistrationDataTab";
import CertificateTab from "./tabs/CertificateTab";
import StoreTab from "./tabs/StoreTab";

const PointsRequestTab = lazy(() =>
  import("./components/PointsRequestTab")
    .then((mod) => ({ default: mod.default || mod }))
    .catch(() => ({ default: () => null })),
);

const StudentDetails = () => {
  const searchParams = useSearchParams();
  const studentId = searchParams?.get("id");
  const router = useRouter();
  const pathname = usePathname();

  // ── استدعاء الـ Hook المخصص لإدارة بيانات واشتراكات الطالب ──
  const profile = useStudentProfile(studentId);

  // ── التوثيق والأمان لمنع الدخول بدون كلمة المرور (مع استثناء الأدمن) ──
  const { isStudentAuthorized, authenticateStudent, isAdmin } =
    useStudentAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [enteredAuthPassword, setEnteredAuthPassword] = useState("");
  const [authErrorMessage, setAuthErrorMessage] = useState("");
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [rememberAuthMe, setRememberAuthMe] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  // حماية ضد Brute Force
  const [authAttempts, setAuthAttempts] = useState(0);
  const [authLockedUntil, setAuthLockedUntil] = useState(null);

  const [expandedTask, setExpandedTask] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [openNote, setOpenNote] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showModalAttendance, setShowModalAttendance] = useState(false);
  const [showLuckyWheel, setShowLuckyWheel] = useState(false);

  const { groupStatuses } = useGroupContext();
  const status = groupStatuses ? groupStatuses[profile.studentGroup] : null;

  const sectionRef = useRef(null);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // فحص الصلاحيات عند توفر بيانات الطالب
  useEffect(() => {
    if (isAdmin) {
      setIsAuthorized(true);
      setShowAuthModal(false);
      return;
    }

    if (!profile.studentData) return;

    (async () => {
      const authOk = await isStudentAuthorized(
        profile.studentData.id,
        profile.studentData.password,
      );
      if (authOk) {
        setIsAuthorized(true);
        setShowAuthModal(false);
      } else {
        setIsAuthorized(false);
        setShowAuthModal(true);
      }
    })();
  }, [
    profile.studentData?.id,
    profile.studentData?.password,
    isStudentAuthorized,
    isAdmin,
  ]);

  // تسجيل الدخول عند طلب كلمة المرور في صفحة الطالب
  const handleAuthPasswordSubmit = useCallback(async () => {
    // فحص الـ Lockout (حماية Brute Force)
    if (authLockedUntil && Date.now() < authLockedUntil) {
      const remaining = Math.ceil((authLockedUntil - Date.now()) / 1000);
      setAuthErrorMessage(`تم تجميد المحاولات. انتظر ${remaining} ثانية.`);
      return;
    }

    const trimmedEntered = enteredAuthPassword.trim();
    if (!trimmedEntered) {
      setAuthErrorMessage("يرجى إدخال كلمة المرور.");
      return;
    }

    setIsAuthLoading(true);
    setAuthErrorMessage("");

    try {
      // جلب كلمة المرور مباشرة من Firestore للتأكد من صحتها
      const numId = Number(studentId);
      const q = query(
        collection(db, "students"),
        where("id", "==", !isNaN(numId) ? numId : studentId),
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setAuthErrorMessage("لم يتم العثور على بيانات الطالب.");
        return;
      }

      const freshStudentData = snap.docs[0].data();
      const studentPass = String(freshStudentData?.password || "").trim();

      if (!studentPass) {
        setAuthErrorMessage(
          "لم يتم تعيين كلمة مرور لهذا الطالب بعد. تواصل مع المدرب.",
        );
        return;
      }

      if (trimmedEntered === studentPass) {
        setAuthAttempts(0);
        setAuthLockedUntil(null);
        await authenticateStudent(studentId, trimmedEntered, true);
        setIsAuthorized(true);
        setShowAuthModal(false);
        setAuthErrorMessage("");
      } else {
        const newAttempts = authAttempts + 1;
        setAuthAttempts(newAttempts);
        if (newAttempts >= 5) {
          const lockUntil = Date.now() + 60_000; // 60 ثانية
          setAuthLockedUntil(lockUntil);
          setAuthAttempts(0);
          setAuthErrorMessage(
            "تم تجميد المحاولات لمدة 60 ثانية بسبب كثرة المحاولات الخاطئة.",
          );
        } else {
          setAuthErrorMessage(
            `كلمة المرور غير صحيحة! (${newAttempts}/5 محاولات)`,
          );
        }
      }
    } catch (err) {
      console.error("Auth submit error:", err);
      setAuthErrorMessage("حدث خطأ أثناء التحقق. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsAuthLoading(false);
    }
  }, [
    enteredAuthPassword,
    studentId,
    rememberAuthMe,
    authenticateStudent,
    authAttempts,
    authLockedUntil,
  ]);

  const handleCloseAuthModal = useCallback(() => {
    setShowAuthModal(false);
    router.push("/pages/main");
  }, [router]);

  const handleStore = () => {
    setActiveTab("store");

    requestAnimationFrame(() => {
      sectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  // شاشات التحميل والخطأ
  if (profile.loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500" />
      </div>
    );
  }

  if (profile.error) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-4 text-center">
        <p className="text-red-500 font-bold mb-4">{profile.error}</p>
        <button
          onClick={() => router.push("/pages/main")}
          className="px-6 py-2 bg-indigo-600 text-slate-100 rounded-xl font-medium"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  if (!profile.studentData) {
    return <div className="text-center py-12">لا توجد بيانات.</div>;
  }

  // في حالة عدم التحقق من كلمة المرور
  if (!isAuthorized) {
    return (
      <div
        className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center"
        dir="rtl"
      >
        <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-600 mb-4 border border-indigo-500/20 shadow-inner">
          <Lock className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-100 mb-2">
          هذا الحساب محمي بكلمة مرور
        </h2>
        <p className="text-slate-400 text-sm max-w-md mb-6">
          لا يمكنك استعراض بيانات هذا الطالب إلا بعد إدخال كلمة المرور الصحيحة.
        </p>

        <button
          onClick={() => setShowAuthModal(true)}
          className="px-8 py-3.5 bg-linear-to-r from-indigo-600 to-purple-600 text-slate-100 font-bold rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all"
        >
          أدخل كلمة المرور
        </button>

        <PasswordModal
          showModal={showAuthModal}
          closeModal={handleCloseAuthModal}
          enteredPassword={enteredAuthPassword}
          setEnteredPassword={setEnteredAuthPassword}
          showPassword={showAuthPassword}
          setShowPassword={setShowAuthPassword}
          handlePasswordSubmit={handleAuthPasswordSubmit}
          isLoading={isAuthLoading}
          errorMessage={authErrorMessage}
          rememberMe={rememberAuthMe}
          setRememberMe={setRememberAuthMe}
        />
      </div>
    );
  }

  const { title: rankTitle, colorClass: rankColorClass } = profile.getRankTitle();
  //
  const tabs = [
    { id: "overview", label: "نظرة عامة", icon: Users },
    { id: "registrationData", label: "البيانات الشخصية", icon: UserCheck },
    { id: "tasks", label: "المهام", icon: ClipboardList },
    { id: "Exam", label: "الاختبار", icon: BookOpenText },
    { id: "Gift", label: "الهدايا", icon: Gift },
    { id: "pointsRequest", label: "طلب نقاط", icon: Sparkles },
    { id: "certificate", label: "الشهادة", icon: Award },
  ];

  return (
    <div
      className="min-h-screen bg-linear-to-br  from-gray-900 via-gray-900 to-gray-900 font-(--font-primary)"
      dir="rtl"
    >
      <div className="container mx-auto px-3 py-6 md:py-10 max-w-5xl">
        {/* ── Top Header Section ── */}
        <StudentHeader
          studentData={profile.studentData}
          studentDocId={profile.studentDocId}
          profilePic={profile.profilePic}
          isPerfectStudent={profile.isPerfectStudent}
          state={{
            totalScore: profile.studentData.score || 0,
            average: profile.average,
            combinedScore: profile.combinedScore,
            attendancePercentage: profile.attendancePercentage,
          }}
          onUploadSuccess={profile.handleUploadSuccess}
          onOpenLuckyWheel={() => setShowLuckyWheel(true)}
          onOpenStore={handleStore}
        />

        {/* ── Tabs Navigation ── */}
        <TabNav
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          hasActiveExam={profile.hasActiveExam}
          hasNewQuestion={profile.hasNewQuestion}
          hasStartedQuiz={profile.hasStartedQuiz}
        />

        {/* ── Tab Content ── */}
        <div className="w-full">
          {activeTab === "overview" && (
            <OverviewTab
              studentData={profile.studentData}
              studentId={studentId}
              studentDocId={profile.studentDocId}
              isPerfectStudent={profile.isPerfectStudent}
              state={{
                totalScore: profile.studentData.score || 0,
                average: profile.average,
                attendancePercentage: profile.attendancePercentage,
                combinedScore: profile.combinedScore,
                totalLectures: profile.totalLectures,
              }}
              absences={profile.absences}
              total={profile.total}
              rankTitle={rankTitle}
              rankColorClass={rankColorClass}
              showIcons={profile.showIcons}
              toggleIcons={profile.toggleIcons}
              showTime={profile.showTime}
              toggleActiveTime={profile.toggleActiveTime}
              status={status}
              reserveAttendanceCount={profile.reserveAttendanceCount}
              isProcessingReserve={profile.isProcessingReserve}
              handleUseReserveAttendance={profile.handleUseReserveAttendance}
              showModalAttendance={showModalAttendance}
              setShowModalAttendance={setShowModalAttendance}
              showModal={showModal}
              setShowModal={setShowModal}
              openNote={openNote}
              setOpenNote={setOpenNote}
            />
          )}

          {activeTab === "store" && (
            <div ref={sectionRef}>
              <StoreTab
                studentData={profile.studentData}
                studentDocId={profile.studentDocId}
                onOpenLuckyWheel={() => setShowLuckyWheel(true)}
              />
            </div>
          )}

          {activeTab === "tasks" && (
            <TasksTab
              studentData={profile.studentData}
              studentId={studentId}
              studentDocId={profile.studentDocId}
              showGithubButton={profile.showGithubButton}
              showStatusText={profile.showStatusText}
              toggleGithubButton={profile.toggleGithubButton}
              expandedTask={expandedTask}
              setExpandedTask={setExpandedTask}
            />
          )}

          {activeTab === "Exam" && <ExamTab />}

          {activeTab === "Gift" && (
            <GiftTab
              studentId={studentId}
              studentGroup={profile.studentGroup}
            />
          )}

          {activeTab === "registrationData" && (
            <RegistrationDataTab
              studentData={profile.studentData}
              newStudentData={profile.newStudentData}
              studentId={studentId}
              loadingNewStudent={profile.loadingNewStudent}
              isEditingEnglishName={profile.isEditingEnglishName}
              setIsEditingEnglishName={profile.setIsEditingEnglishName}
              editedEnglishName={profile.editedEnglishName}
              setEditedEnglishName={profile.setEditedEnglishName}
              isSavingEnglishName={profile.isSavingEnglishName}
              handleSaveEnglishName={profile.handleSaveEnglishName}
              isEditingCollege={profile.isEditingCollege}
              setIsEditingCollege={profile.setIsEditingCollege}
              editedCollege={profile.editedCollege}
              setEditedCollege={profile.setEditedCollege}
              isSavingCollege={profile.isSavingCollege}
              handleSaveCollege={profile.handleSaveCollege}
              isEditingCity={profile.isEditingCity}
              setIsEditingCity={profile.setIsEditingCity}
              editedCity={profile.editedCity}
              setEditedCity={profile.setEditedCity}
              isSavingCity={profile.isSavingCity}
              handleSaveCity={profile.handleSaveCity}
              isChangingStudyMethod={profile.isChangingStudyMethod}
              handleChangeStudyMethod={profile.handleChangeStudyMethod}
              localPassword={profile.localPassword}
              setLocalPassword={profile.setLocalPassword}
              showLocalPassword={profile.showLocalPassword}
              setShowLocalPassword={profile.setShowLocalPassword}
              isSavingPassword={profile.isSavingPassword}
              handleLocalPasswordSave={profile.handleLocalPasswordSave}
            />
          )}

          {activeTab === "pointsRequest" && (
            <Suspense
              fallback={
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
                </div>
              }
            >
              <PointsRequestTab
                studentId={studentId}
                studentDocId={profile.studentDocId}
                studentName={profile.studentData?.name}
              />
            </Suspense>
          )}

          {activeTab === "certificate" && (
            <CertificateTab
              studentData={profile.studentData}
              newStudentData={profile.newStudentData}
              studentId={studentId}
              latestLecture={profile.latestLecture}
              state={{
                totalScore: profile.studentData.score || 0,
                average: profile.average,
                attendancePercentage: profile.attendancePercentage,
                combinedScore: profile.combinedScore,
              }}
              groupStatuses={groupStatuses}
            />
          )}
        </div>

        {/* ── Lucky Wheel Modal ── */}
        <LuckyWheelModal
          open={showLuckyWheel}
          onClose={() => setShowLuckyWheel(false)}
          studentDocId={profile.studentDocId}
          studentName={profile.studentData?.name || "طالب"}
          studentScore={profile.studentData?.score || 0}
          reserveAttendanceCount={profile.reserveAttendanceCount}
          lastSpinTimestamp={profile.studentData?.lastSpinTimestamp}
          paidSpinsCount={profile.studentData?.wheelPaidSpins || 0}
          bonusSpinCount={profile.studentData?.wheelBonusSpins || 0}
          greenCardsCount={profile.studentData?.greenCards || 0}
          blueCardsCount={profile.studentData?.blueCards || 0}
          studentGroup={profile.studentGroup || ""}
          onSpinSuccess={() => {}}
        />
      </div>
    </div>
  );
};

export default React.memo(StudentDetails);
