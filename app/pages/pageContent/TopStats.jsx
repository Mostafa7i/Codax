import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

import { useTopStats } from "@/app/hooks/allHooks";

import {
  X,
  ThumbsUp,
  ThumbsDown,
  Star,
  ClipboardList,
  Flag,
  TrendingDown,
  ChevronDown,
  BarChart3,
  UserRoundIcon,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| Card Definitions
|--------------------------------------------------------------------------
*/

const CARD_DEFS = [
  {
    key: "mostLiked",
    icon: ThumbsUp,
    label: "الأكثر إعجاباً",
    gradient: "from-emerald-500 to-teal-600",
    glow: "shadow-emerald-500/20",
    getValue: (student) =>
      student.likedBy?.length || 0,
    unit: "إعجاب",
  },

  {
    key: "mostDisliked",
    icon: ThumbsDown,
    label: "الأكثر Dislike",
    gradient: "from-red-500 to-rose-600",
    glow: "shadow-red-500/20",
    getValue: (student) =>
      student.dislikedBy?.length || 0,
    unit: "dislike",
  },

  {
    key: "highestScore",
    icon: Star,
    label: "أعلى نقاط إضافية",
    gradient: "from-yellow-500 to-orange-500",
    glow: "shadow-yellow-500/20",
    getValue: (student) =>
      student.score || 0,
    unit: "نقطة",
  },

  {
    key: "highestTaskGrades",
    icon: ClipboardList,
    label: "أعلى درجات مهام",
    gradient: "from-indigo-500 to-purple-600",
    glow: "shadow-indigo-500/20",
    getValue: (student) =>
      student.totalTaskScore || 0,
    unit: "درجة",
  },

  {
    key: "highestReserveUsage",
    icon: Flag,
    label: "الأكثر استخداماً للاحتياطي",
    gradient: "from-orange-500 to-amber-600",
    glow: "shadow-orange-500/20",
    getValue: (student) =>
      student.reserveUsageCount || 0,
    unit: "مرة",
  },

  {
    key: "higheAbsencest",
    icon: TrendingDown,
    label: "الأكثر غياباً",
    gradient: "from-slate-500 to-slate-600",
    glow: "shadow-slate-500/20",

    getValue: (student, extra) => {
      const latestLecture =
        extra?.latestLecture || 0;

      const totalLectures =
        latestLecture -
        (student.startLecture || 1) +
        1;

      return (
        totalLectures -
        (student.attendedLectures || 0)
      );
    },

    unit: "غياب",
  },
];

/*
|--------------------------------------------------------------------------
| Stat Card
|--------------------------------------------------------------------------
*/

const StatCard = ({
  def,
  student,
  displayValue,
  index,
}) => {
  const Icon = def.icon;

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: index * 0.06,
        type: "spring",
        stiffness: 260,
        damping: 22,
      }}
      className={`
        flex items-center gap-4
        p-4 rounded-2xl
        bg-white dark:bg-white/5
        border border-slate-100
        dark:border-white/10
        shadow-lg
        ${def.glow}
        hover:scale-[1.02]
        transition-transform
        duration-200
      `}
    >
      {/* Icon */}

      <div
        className={`
          shrink-0
          w-11 h-11
          rounded-xl
          flex items-center
          justify-center
          bg-linear-to-br
          ${def.gradient}
          shadow-md
        `}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>

      {/* Avatar */}

      <div className="shrink-0">
        {student.profilePic ? (
          <img
            src={student.profilePic}
            alt={student.name || "Student"}
            className="
              w-12 h-12
              rounded-full
              object-cover
              ring-2
              ring-white/20
            "
          />
        ) : (
          <div
            className="
              w-12 h-12
              rounded-full
              bg-slate-200
              dark:bg-slate-700
              flex items-center
              justify-center
            "
          >
            <UserRoundIcon
              className="
                w-6 h-6
                text-slate-500
                dark:text-slate-300
              "
            />
          </div>
        )}
      </div>

      {/* Student Info */}

      <div
        className="
          flex-1
          text-right
          min-w-0
        "
      >
        <p
          className="
            text-xs
            font-semibold
            text-slate-400
            dark:text-slate-500
            mb-0.5
            truncate
          "
        >
          {def.label}
        </p>

        <p
          className="
            font-bold
            text-slate-800
            dark:text-slate-100
            text-sm
            truncate
          "
        >
          {student.name}
        </p>

        <p
          className="
            text-xs
            text-slate-400
            truncate
          "
        >
          {student.group}
        </p>
      </div>

      {/* Value */}

      <div className="shrink-0 text-center">
        <p
          className={`
            text-2xl
            font-black
            bg-linear-to-br
            ${def.gradient}
            bg-clip-text
            text-transparent
          `}
        >
          {displayValue}
        </p>

        <p className="text-xs text-slate-400">
          {def.unit}
        </p>
      </div>
    </motion.div>
  );
};

/*
|--------------------------------------------------------------------------
| Main Component
|--------------------------------------------------------------------------
*/

const TopStats = ({ onClose }) => {
  /*
   * المجموعة أصبحت State محلية
   * ولا يوجد LatestLectureContext
   */

  const [selectedGroup, setSelectedGroup] =
    React.useState("");

  /*
   * البيانات تأتي من الـHook
   */

  const {
    stats,
    latestLectures,
    latestLectureForGroup,
    loading,
    error,
  } = useTopStats(selectedGroup);

  /*
   * بناء الـCards
   */

  const cards = stats
    ? CARD_DEFS
        .map((def) => {
          const student = stats[def.key];

          if (!student) {
            return null;
          }

          const raw = def.getValue(
            student,
            {
              latestLecture:
                latestLectureForGroup,
            }
          );

          if (!raw || raw <= 0) {
            return null;
          }

          return {
            def,
            student,
            displayValue: String(raw),
          };
        })
        .filter(Boolean)
    : [];

  /*
   * Portal
   */

  return createPortal(
    <AnimatePresence>
      {/* Backdrop */}

      <motion.div
        key="backdrop"
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        exit={{
          opacity: 0,
        }}
        onClick={onClose}
        className="
          fixed
          inset-0
          bg-black/50
          backdrop-blur-sm
          z-200
        "
      />

      {/* Panel */}

      <motion.div
        key="panel"
        dir="rtl"
        initial={{
          opacity: 0,
          scale: 0.95,
          y: 20,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.95,
          y: 20,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 28,
        }}
        className="
          fixed
          inset-4
          md:inset-8
          lg:inset-16
          z-201
          bg-slate-50
          dark:bg-[#0d1117]
          border
          border-slate-200
          dark:border-white/10
          rounded-3xl
          shadow-2xl
          flex
          flex-col
          overflow-hidden
        "
      >
        {/* Header */}

        <div
          className="
            px-4
            py-5
            border-b
            border-slate-100
            dark:border-white/10
            bg-white
            dark:bg-white/5
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              gap-3
            "
          >
            {/* Icon */}

            <div
              className="
                w-10
                h-10
                rounded-xl
                bg-linear-to-br
                from-indigo-500
                to-purple-600
                flex
                items-center
                justify-center
                shadow-lg
                shadow-indigo-500/30
              "
            >
              <BarChart3 className="w-5 h-5 text-white" />
            </div>

            {/* Group Selector */}

            <div className="relative">
              <select
                value={selectedGroup}
                onChange={(event) =>
                  setSelectedGroup(
                    event.target.value
                  )
                }
                className="
                  appearance-none
                  pl-8
                  pr-4
                  py-2
                  rounded-xl
                  text-sm
                  font-semibold
                  bg-slate-100
                  dark:bg-white/10
                  border
                  border-slate-200
                  dark:border-white/10
                  text-slate-700
                  dark:text-slate-200
                  focus:outline-none
                  focus:ring-2
                  focus:ring-indigo-500/50
                  cursor-pointer
                  transition-all
                "
              >
                <option value="">
                  كل المجموعات
                </option>

                {Object.keys(
                  latestLectures
                ).map((group) => (
                  <option
                    key={group}
                    value={group}
                  >
                    {group}
                  </option>
                ))}
              </select>

              <ChevronDown
                className="
                  absolute
                  left-2
                  top-1/2
                  -translate-y-1/2
                  w-4
                  h-4
                  text-slate-400
                  pointer-events-none
                "
              />
            </div>

            {/* Close */}

            <button
              onClick={onClose}
              className="
                w-9
                h-9
                rounded-xl
                flex
                items-center
                justify-center
                bg-slate-100
                dark:bg-white/10
                border
                border-slate-200
                dark:border-white/10
                text-slate-500
                dark:text-slate-400
                hover:bg-red-50
                dark:hover:bg-red-500/20
                hover:text-red-500
                dark:hover:text-red-400
                transition-all
              "
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}

        <div
          className="
            flex-1
            overflow-y-auto
            p-5
          "
          style={{
            scrollbarWidth: "thin",
            scrollbarColor:
              "#334155 transparent",
          }}
        >
          {/* Error */}

          {error ? (
            <div
              className="
                flex
                flex-col
                items-center
                justify-center
                h-full
                py-20
                gap-4
              "
            >
              <p className="text-red-500 font-medium">
                {error}
              </p>
            </div>
          ) : loading ? (
            /* Loading */

            <div
              className="
                flex
                flex-col
                items-center
                justify-center
                h-full
                gap-4
                py-20
              "
            >
              <div
                className="
                  relative
                  w-14
                  h-14
                "
              >
                <div
                  className="
                    absolute
                    inset-0
                    rounded-full
                    border-4
                    border-indigo-500/20
                  "
                />

                <div
                  className="
                    absolute
                    inset-0
                    rounded-full
                    border-4
                    border-transparent
                    border-t-indigo-500
                    animate-spin
                  "
                />
              </div>

              <p
                className="
                  text-slate-400
                  font-medium
                "
              >
                جاري تحميل الإحصائيات...
              </p>
            </div>
          ) : !stats ||
            cards.length === 0 ? (
            /* No Data */

            <div
              className="
                flex
                flex-col
                items-center
                justify-center
                h-full
                py-20
                gap-4
              "
            >
              <div
                className="
                  w-20
                  h-20
                  rounded-full
                  bg-slate-100
                  dark:bg-white/5
                  flex
                  items-center
                  justify-center
                "
              >
                <BarChart3
                  className="
                    w-10
                    h-10
                    text-slate-300
                    dark:text-slate-600
                  "
                />
              </div>

              <p
                className="
                  text-slate-400
                  font-medium
                "
              >
                لا توجد بيانات لهذه المجموعة
              </p>
            </div>
          ) : (
            /* Cards */

            <div
              className="
                grid
                grid-cols-1
                md:grid-cols-2
                gap-3
              "
            >
              {cards.map(
                (
                  {
                    def,
                    student,
                    displayValue,
                  },
                  index
                ) => (
                  <StatCard
                    key={def.key}
                    def={def}
                    student={student}
                    displayValue={
                      displayValue
                    }
                    index={index}
                  />
                )
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>,

    document.body
  );
};

export default React.memo(TopStats);