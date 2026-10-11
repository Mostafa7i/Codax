"use client";

import React, { useMemo, useState, useCallback, memo, useEffect } from "react";
import {
  Star,
  Github,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Clock,
} from "lucide-react";
import CircularProgress from "./CircularProgress";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { db } from "@/app/services/firebaseConfig";
import {
  collection,
  doc,
  updateDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import StudentGithubLinksPopup from "../profile/components/StudentGithubLinksPopup";
import {
  getAvatarBorder,
  getAvatarBadge,
  getEffectiveActiveBorder,
} from "@/app/utils/avatarDecorations";
import { getBoostBadgeText } from "@/app/components/scoringConfig";
import AvatarFrame from "@/app/utils/AvatarFrame";
import { useStudentAuth } from "@/app/context/StudentAuthContext";
import { useStudentActions } from "@/app/hooks/useStudentActions";
import { useLatestLecture } from "@/app/context/LatestLectureContext copy";
import Swal from "sweetalert2";

const DEFAULT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236366f1'><circle cx='12' cy='8' r='4'/><path d='M4 20c0-4 3.6-7 8-7s8 3 8 7'/></svg>`;

/* ثيم موحّد لكل كارت Top 3 */
const RANK_THEME = {
  1: {
    label: "البطل",
    shell:
      "bg-linear-to-br from-yellow-500/[0.01] via-slate-900/40 to-amber-900/20",
    panel: "bg-yellow-500/[0.06] border-yellow-500/20",
    ring: "ring-yellow-400/90",
    glow: "shadow-[0_0_20px_-4px_rgba(250,204,21,0.45)]",
    badge: "from-yellow-300 to-amber-500 text-black",
    btn: "from-yellow-400 to-amber-500 text-black shadow-yellow-500/30",
    mark: "text-yellow-400/[0.06]",
    accent: "bg-yellow-400",
  },
  2: {
    label: "الوصيف",
    shell:
      "bg-linear-to-br from-slate-300/[0.03] via-slate-900/40 to-slate-700/15",
    panel: "bg-slate-400/[0.06] border-slate-400/20",
    ring: "ring-slate-300/80",
    glow: "shadow-[0_0_16px_-4px_rgba(203,213,225,0.35)]",
    badge: "from-slate-200 to-slate-400 text-black",
    btn: "from-slate-300 to-slate-400 text-black shadow-slate-400/25",
    mark: "text-slate-300/[0.06]",
    accent: "bg-slate-300",
  },
  3: {
    label: "الثالث",
    shell:
      "bg-linear-to-br from-amber-700/[0.04] via-slate-900/40 to-orange-900/15",
    panel: "bg-amber-600/[0.07] border-amber-600/20",
    ring: "ring-amber-600/80",
    glow: "shadow-[0_0_16px_-4px_rgba(217,119,6,0.35)]",
    badge: "from-amber-600 to-orange-800 text-white",
    btn: "from-amber-600 to-orange-800 text-white shadow-orange-800/25",
    mark: "text-amber-600/[0.07]",
    accent: "bg-amber-600",
  },
};

const getScoreIcon = (s) => {
  if (s >= 99) return "🔱👑🔱";
  if (s >= 95) return "🌟🌟🌟🌟";
  if (s >= 85) return "⭐⭐⭐⭐";
  if (s >= 75) return "⭐⭐⭐";
  if (s >= 65) return "⭐⭐";
  if (s >= 50) return "🥬";
  return null;
};


const getColor = (v, type = "text") => {
  if (v >= 85) {
    return type === "bg" ? "bg-emerald-500" : "text-emerald-400";
  }

  if (v >= 75) {
    return type === "bg" ? "bg-yellow-400" : "text-yellow-400";
  }

  if (v >= 60) {
    return type === "bg" ? "bg-orange-400" : "text-orange-400";
  }
  if (v >= 50) {
    return type === "bg" ? "bg-red-400" : "text-red-400";
  }

  return type === "bg" ? "bg-red-500" : "text-red-500";
};

const SegmentedBar = memo(function SegmentedBar({ value = 0 }) {
  return (
    <div className="flex gap-0.5 h-1.5 w-full rounded-full overflow-hidden">
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm ${
            value > i * 10 ? getColor(value, "bg") : "bg-slate-700/60"
          }`}
        />
      ))}
    </div>
  );
});

const SolidBar = memo(function SolidBar({ value = 0 }) {
  const safe = Math.min(100, Math.max(0, value));

  return (
    <div className="h-1.5 w-full rounded-full bg-slate-700/60 overflow-hidden">
      <div
        className={`h-full rounded-full ${getColor(safe, "bg")}`}
        style={{ width: `${safe}%` }}
      />
    </div>
  );
});

const PerfRow = memo(function PerfRow({ label, value, type }) {
  const isTask = type === "task";

  if (isTask && value === null) {
    return (
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>{label}</span>
        <span>لا توجد مهام</span>
      </div>
    );
  }

  const safe = Math.min(100, Math.max(0, value || 0));

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-slate-400">{label}</span>

        <span className={`font-bold tabular-nums ${getColor(safe, "text")}`}>
          {Math.round(safe)}%
        </span>
      </div>

      {isTask ? (
        <SegmentedBar value={safe} />
      ) : (
        <SolidBar value={safe} />
      )}
    </div>
  );
});


const ActiveTime = memo(function ActiveTime({ student }) {
  if (!student?.showTime) return null;
  const fmt = (ts) => {
    if (!ts) return "لم يسجل نشاط";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return formatDistanceToNow(d, { addSuffix: true, locale: ar });
  };
  return (
    <span className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
      <Clock className="w-3 h-3 shrink-0" />
      {fmt(student.lastActivity)}
    </span>
  );
});

const GitHubButton = memo(function GitHubButton({ student }) {
  const [open, setOpen] = useState(false);
  if (!student?.showGithubButton) return null;
  return (
    <div className="bg-slate-800 p-2 rounded-full hover:animate-bounce">
      <button
        onClick={() => setOpen(true)}
        className="cursor-pointer items-center   flex justify-center rounded text-slate-400 hover:text-indigo-300 hover:border-indigo-500/30 transition-colors"
      >
        <Github className="w-4 h-4 " />
      </button>
      {open && (
        <StudentGithubLinksPopup
          studentId={student.id}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
});

const RankBadge = memo(function RankBadge({ rank }) {
  return (
    <>
      {rank === 1 || rank === 2 || rank === 3 ? (
        <div className="bg-linear-to-br from-yellow-300 via-yellow-400 to-yellow-100 text-black rounded-full w-5 h-5 right-0 top-10.5 shadow-[0_0_16px_-4px_rgba(203,213,225,0.35)] text-center text-[12px] font-bold font-mono tabular-nums">
          {" "}
          {rank}
        </div>
      ) : (
        <div className=" bg-linear-to-br from-slate-500 via-slate-400 to-yellow-100 text-black rounded-full w-5 right-0 top-10.5 shadow-[0_0_16px_-4px_rgba(203,213,225,0.35)] text-center text-[12px] font-bold font-mono tabular-nums">
          {rank}
        </div>
      )}
    </>
  );
});

/* ════════════════════════════════════════════
   Main Component
════════════════════════════════════════════ */
const StudentCardContent = ({
  student = {},
  allStudents = [],
  openPasswordModal,
  openImageModal,
  totalLecturesForGroup,
  cardConfig = {},
  studentGroup,
}) => {
  const [loading, setLoading] = useState(false);
  const { authenticatedStudentId } = useStudentAuth() || {};

  // التحقق مما إذا كان الكارت يخص الطالب المسجل دخوله حالياً
  const isSelfCard = Boolean(
    authenticatedStudentId &&
    String(student?.id || student?.internalId) ===
      String(authenticatedStudentId),
  );

  // إدارة الـ States المحلية للـ Likes & Dislikes
  const [likesCount, setLikesCount] = useState(student?.likesCount || 0);
  const [isLikedByMe, setIsLikedByMe] = useState(student?.isLikedByMe || false);

  const [dislikesCount, setDislikesCount] = useState(
    student?.dislikesCount || 0,
  );
  const [isDislikedByMe, setIsDislikedByMe] = useState(
    student?.isDislikedByMe || false,
  );

  // تحديث الـ State عند تغير الـ Props
  useEffect(() => {
    setLikesCount(student?.likesCount || 0);
    setIsLikedByMe(student?.isLikedByMe || false);
    setDislikesCount(student?.dislikesCount || 0);
    setIsDislikedByMe(student?.isDislikedByMe || false);
  }, [
    student?.likesCount,
    student?.isLikedByMe,
    student?.dislikesCount,
    student?.isDislikedByMe,
  ]);

  const latestLectureContext = useLatestLecture() || {};
  const latestLectures = latestLectureContext.latestLectures;

  const currentGroup = studentGroup || student?.group || student?.groupName;

  const {
    handleLike,
    handleDislike,
    loading: actionLoading,
  } = useStudentActions(authenticatedStudentId, currentGroup, latestLectures) ||
  {};

  const theme = RANK_THEME[student?.rank] || null;
  const isTop3 = Boolean(theme);
  const isFirst = student?.rank === 1;

  const pointsRank = useMemo(() => {
    if (!allStudents.length) return 1;
    const sorted = [...allStudents].sort(
      (a, b) => (b.extraPoints || 0) - (a.extraPoints || 0),
    );
    return sorted.findIndex((s) => s.id === student?.id) + 1;
  }, [allStudents, student?.id]);

  const totalSpent = useMemo(
    () =>
      (student?.buyingHistory || []).reduce(
        (t, p) => t + (p.totalCost || 0),
        0,
      ),
    [student?.buyingHistory],
  );

  
  const scoreIcon =
    student?.showScoreIcons &&
    typeof totalLecturesForGroup === "number" &&
    student?.attendedLectures > 5
      ? getScoreIcon(student?.combinedScore || 0)
      : null;

  const extraPtsBonus = useMemo(() => {
    return getBoostBadgeText(student?.extraPoints || 0);
  }, [student?.extraPoints]);

  const handleImageClick = useCallback(() => {
    openImageModal?.(student?.profilePic || DEFAULT_AVATAR);
  }, [openImageModal, student?.profilePic]);

  const handleImageError = useCallback((e) => {
    e.target.src = DEFAULT_AVATAR;
  }, []);

  const handleDetailsClick = useCallback(async () => {
    if (!student) return;
    setLoading(true);
    try {
      let studentRef;
      if (student.docId) {
        studentRef = doc(db, "students", student.docId);
      } else if (student.id) {
        const q = query(
          collection(db, "students"),
          where("id", "==", Number(student.id)),
        );
        const snap = await getDocs(q);
        if (snap.empty) return;
        studentRef = doc(db, "students", snap.docs[0].id);
      } else return;

      await updateDoc(studentRef, { lastActivity: serverTimestamp() });
      openPasswordModal?.(student);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [openPasswordModal, student]);

  const panelClass = theme
    ? theme.panel
    : "bg-slate-800/20 border-slate-700/40";

  return (
    <div
      className={`relative flex flex-col gap-3 rounded-xl ${
        theme ? theme.shell : ""
      }`}
      dir="rtl"
    >
      {/* Watermark */}
      {theme && (
        <span
          aria-hidden
          className={`pointer-events-none absolute top-1 left-2 text-[5.5rem] font-black leading-none select-none ${theme.mark} ${
            cardConfig?.isPerfectStudent
              ? "animate-ping decoration-2"
              : isFirst
                ? "animate-pulse"
                : ""
          }`}
        >
          {student.rank}
        </span>
      )}

      {/* Header */}
      <div className="relative flex items-center gap-5 z-10">
        <button
          type="button"
          onClick={handleImageClick}
          className="relative shrink-0 group focus:outline-none z-20 cursor-pointer"
        >
          {(() => {
            const effectiveBorderId = getEffectiveActiveBorder(student);
            const customBorder =
              effectiveBorderId && effectiveBorderId !== "default"
                ? getAvatarBorder(effectiveBorderId)
                : null;
            const borderClasses =
              customBorder && customBorder.id !== "default"
                ? `${customBorder.ringClass} ${customBorder.glowClass || ""} ${
                    customBorder.animationClass || customBorder.pulseClass || ""
                  }`
                : theme
                  ? `${theme.ring} ${theme.glow}`
                  : "ring-slate-600/50";

            return (
              <AvatarFrame
                frameStyle={customBorder?.frameStyle}
                size={56}
                className={`ring-2 ring-offset-2 ring-offset-slate-900 group-hover:scale-105 transition-transform duration-200 ${borderClasses}`}
              >
                <img
                  loading="lazy"
                  decoding="async"
                  src={student?.profilePic || DEFAULT_AVATAR}
                  alt={student?.name || "Student"}
                  onError={handleImageError}
                  className="w-full h-full rounded-full object-cover"
                />
              </AvatarFrame>
            );
          })()}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between">
            <div className="flex items-center gap-1 flex-wrap">
              <p
                className="font-bold  text-white text-sm truncate leading-snug"
                title={student?.name}
              >
                {student?.name}
              </p>
              {(() => {
                const activeBadgeObj = student?.activeBadge
                  ? getAvatarBadge(student.activeBadge)
                  : null;
                if (!activeBadgeObj) return null;
                return (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${activeBadgeObj.badgeClass}`}
                    title={activeBadgeObj.description}
                  >
                    {activeBadgeObj.emoji} {activeBadgeObj.name}
                  </span>
                );
              })()}
            </div>
            <RankBadge rank={student?.rank} className="z-50" />
          </div>
          {student?.showBio !== false && student?.bio && (
            <p
              className="text-slate-500 text-[10px] truncate"
              title={student.bio}
            >
              {student.bio}
            </p>
          )}
          <ActiveTime student={student} />
        </div>
      </div>

      {/* Stats */}
      <div className="relative grid grid-cols-2 gap-2 z-1">
        <div
          className={`flex flex-col items-center justify-center rounded-2xl  ${panelClass}`}
        >
          <div className="relative">
            <CircularProgress studentCir={student} />

            {cardConfig?.isPerfectStudent && (
              <>
                <div className="absolute -inset-2.5 rounded-full animate-spin [animation-duration:2s]">
                  <div className="w-full h-full rounded-full border-4 border-transparent border-t-lime-500 border-b-lime-500" />
                </div>
                <div className="absolute -inset-2 rounded-full animate-spin [animation-direction:reverse] [animation-duration:1.5s]">
                  <div className="w-full h-full rounded-full border-4 border-transparent border-l-green-500 border-r-green-500/80" />
                </div>
                <div className="absolute -inset-1 rounded-full animate-pulse bg-lime-400/20 blur-md pointer-events-none" />
              </>
            )}
            {isFirst && student?.combinedScore >= 95 && (
              <>
                <div className="absolute -inset-2 rounded-full animate-spin [animation-direction:reverse] [animation-duration:1.5s]">
                  <div className="w-full h-full rounded-full border-4 border-transparent border-r-green-500/80" />
                </div>
                <div className="absolute -inset-1 rounded-full animate-pulse bg-lime-400/20 blur-md pointer-events-none" />
              </>
            )}
          </div>
          <div>
            {scoreIcon && (
              <span className="text-xs leading-none">{scoreIcon}</span>
            )}
          </div>
        </div>

        <div
          className={`p-3 rounded-2xl flex flex-col justify-between  ${
            pointsRank == 1 
              ? "bg-indigo-500/10 border-indigo-500/25 animate-pulse"
              : panelClass
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">النقاط</span>
            <span className="text-xs">🏅</span>
          </div>

          <div
            className={`text-2xl font-black tabular-nums leading-none mt-1 ${
              totalLecturesForGroup > 5 && (student?.extraPoints || 0) === 0
                ? "text-red-400"
                : "text-indigo-300"
            }`}
          >
            {student?.extraPoints || 0}
            {extraPtsBonus && (
              <span className="text-[10px] text-emerald-400 font-bold mr-1">
                {extraPtsBonus}
              </span>
            )}
          </div>

          {totalSpent > 0 && (
            <span className="text-[10px] text-red-400/90 mt-0.5">
              −{totalSpent} مصروف
            </span>
          )}

          <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-white/10">
            <span className="text-[10px] text-slate-500">ترتيب النقاط</span>
            <span className="flex items-center gap-0.5 text-[11px] font-bold text-purple-300">
              <span className="font-mono tabular-nums">{pointsRank}</span>
              <Star className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div
        className={`relative space-y-2.5 p-2 rounded-2xl  z-1 `}
      >
        <PerfRow
          label="متوسط الدرجات"
          value={student?.taskPercentage}
          type="task"
        />
        <PerfRow
          label="نسبة الحضور"
          value={student?.attendancePercentage}
          type="attendance"
        />
      </div>
      {/* Footer */}
      <div className="relative grid grid-cols-3 w-full align-content-between h-7 gap-2 z-1">
        {/* Column 1: Reactions */}
        <div
          className={`col-start-1 flex columns-1 justify-between px-3 items-center gap-2 rounded-xl text-xs py-1 transition-all ${
            isSelfCard
              ? "bg-slate-800/40 border border-slate-700/50 select-none opacity-90"
              : ""
          }`}
        >
          {/* Like Button */}
          <button
            type="button"
            disabled={isSelfCard}
            onClick={async () => {
              if (isSelfCard) return;

              if (!authenticatedStudentId) {
                Swal.fire({
                  icon: "info",
                  title: "تنبيه",
                  text: "يرجى تسجيل الدخول أولاً للتمكن من التفاعل",
                  confirmButtonText: "حسناً",
                });
                return;
              }

              if (isLikedByMe) {
                setLikesCount((prev) => Math.max(0, prev - 1));
                setIsLikedByMe(false);
              } else {
                setLikesCount((prev) => prev + 1);
                setIsLikedByMe(true);
              }

              try {
                await handleLike?.(student?.id || student?.internalId);
              } catch (error) {
                setLikesCount(student?.likesCount || 0);
                setIsLikedByMe(student?.isLikedByMe || false);
              }
            }}
            className={`flex items-center justify-center gap-1 transition-all duration-150 ${
              isSelfCard
                ? "cursor-default text-blue-400/80"
                : "cursor-pointer hover:text-blue-500 active:scale-125"
            } ${
              isLikedByMe
                ? "text-blue-500 font-bold"
                : likesCount > 0
                  ? "text-blue-400"
                  : "text-slate-500"
            }`}
            title={isSelfCard ? "تفاعلاتك المستلمة" : "إعجاب"}
          >
            <ThumbsUp
              className={`w-3.5 h-3.5 transition-transform ${
                isLikedByMe ? "fill-blue-500 scale-110" : ""
              }`}
            />
            <span className="tabular-nums font-semibold">{likesCount}</span>
          </button>

          <span className="text-slate-600/60 select-none">|</span>

          {/* Dislike Button */}
          <button
            type="button"
            disabled={isSelfCard}
            onClick={async () => {
              if (isSelfCard) return;

              if (!authenticatedStudentId) {
                Swal.fire({
                  icon: "info",
                  title: "تنبيه",
                  text: "يرجى تسجيل الدخول أولاً للتمكن من التفاعل",
                  confirmButtonText: "حسناً",
                });
                return;
              }

              if (isDislikedByMe) {
                setDislikesCount((prev) => Math.max(0, prev - 1));
                setIsDislikedByMe(false);
              } else {
                setDislikesCount((prev) => prev + 1);
                setIsDislikedByMe(true);
              }

              try {
                await handleDislike?.(student?.id || student?.internalId);
              } catch (error) {
                setDislikesCount(student?.dislikesCount || 0);
                setIsDislikedByMe(student?.isDislikedByMe || false);
              }
            }}
            className={`flex items-center justify-center gap-1 transition-all duration-150 ${
              isSelfCard
                ? "cursor-default text-red-400/80"
                : "cursor-pointer hover:text-red-400 active:scale-125"
            } ${
              isDislikedByMe
                ? "text-red-500 font-bold"
                : dislikesCount > 0
                  ? "text-red-400"
                  : "text-slate-500"
            }`}
            title={isSelfCard ? "تفاعلاتك المستلمة" : "لم يعجبني"}
          >
            <ThumbsDown
              className={`w-3.5 h-3.5 transition-transform ${
                isDislikedByMe ? "fill-red-500 scale-110" : ""
              }`}
            />
            <span className="tabular-nums font-semibold">{dislikesCount}</span>
          </button>
        </div>

        {/* Column 2: GitHub Button */}
        <div className="col-start-2 items-center justify-center  flex">
          <GitHubButton student={student} />
        </div>

        {/* Column 3: Profile or Login Button */}
        <div className="col-start-3">
          {authenticatedStudentId ? (
            isSelfCard && (
              <button
                onClick={handleDetailsClick}
                disabled={loading}
                className="w-full h-full p-2 cursor-pointer rounded-xl text-xs font-bold disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-all active:scale-[0.97] shadow-md hover:brightness-110 bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
                ) : (
                  <div className="flex gap-1 text-nowrap">
                    <ExternalLink className="w-3.5 h-3.5" />
                    عرض البروفايل
                  </div>
                )}
              </button>
            )
          ) : (
            <button
              onClick={handleDetailsClick}
              disabled={loading}
              className={`w-full h-full py-2 rounded-xl text-xs font-bold disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-all active:scale-[0.97] shadow-md hover:brightness-110 bg-linear-to-l ${
                theme
                  ? theme.btn
                  : "from-indigo-500 to-purple-600 text-white shadow-indigo-500/20"
              }`}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
              ) : (
                <>
                  <ExternalLink className="w-3.5 h-3.5" />
                  دخول
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(StudentCardContent);
