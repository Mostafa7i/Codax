'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  memo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  Trophy,
  CheckSquare,
  Award,
  ClipboardCheck,
  Users,
  ChevronDown,
  Loader2,
  RefreshCw,
  AlertCircle,
  X,
  Search,
} from "lucide-react";
import { useGroupContext } from "@/app/context/GroupContextProvider";
import { useGroupData } from "@/app/hooks/allHooks";
import PremiumNav from "@/app/components/PremiumNav";
import MainContent from "../MainContent";
import TasksDedline from "../pageContent/TasksDedline";
import StRankingTask from "../pageContent/StRankingTask";
import StTesting from "../pageContent/StTesting";

const Particles = dynamic(() => import("@/app/components/Particles"), {
  ssr: false,
  loading: () => null,
});

// ═══════════════════════════════════════════
// Small UI pieces
// ═══════════════════════════════════════════
const LoadingSpinner = memo(function LoadingSpinner({
  size = "w-5 h-5",
  className = "text-indigo-400",
}) {
  return <Loader2 className={`${size} ${className} animate-spin`} />;
});

const ContentSkeleton = memo(function ContentSkeleton() {
  return (
    <div className="space-y-6 p-4 max-w-6xl mx-auto">
      <div className="h-10 bg-slate-800/50 border border-slate-700/40 rounded-2xl w-2/3 mx-auto animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-44 bg-slate-800/40 border border-slate-700/40 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    </div>
  );
});

const GroupCard = memo(function GroupCard({ group, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(group)}
      className={`relative p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all duration-200 active:scale-95 ${
        isSelected
          ? "bg-gradient-to-br from-indigo-600 to-indigo-700 border-indigo-400/50 text-white shadow-lg shadow-indigo-500/20 font-bold"
          : "bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-indigo-500/10 hover:border-indigo-500/30"
      }`}
    >
      <div
        className={`p-2 rounded-xl ${
          isSelected ? "bg-white/20 text-white" : "bg-indigo-500/10 text-indigo-400"
        }`}
      >
        <Users className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      <span className="text-xs font-bold">مجموعة {group}</span>
      {isSelected && (
        <span className="absolute top-2 right-2 bg-white text-indigo-600 rounded-full p-0.5 shadow-sm">
          <CheckSquare className="w-3.5 h-3.5" />
        </span>
      )}
    </button>
  );
});

// ── Group picker body (shared mobile/desktop) ──
const GroupPickerBody = memo(function GroupPickerBody({
  sortedGroups,
  filteredGroups,
  selectedGroup,
  isLoadingGroups,
  searchQuery,
  setSearchQuery,
  onSelect,
  onClose,
}) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <span className="text-base sm:text-lg font-extrabold text-white">
          اختر مجموعتك الدراسية
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 active:scale-90 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {sortedGroups.length > 6 && (
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="ابحث عن رقم أو اسم المجموعة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-slate-200 placeholder:text-slate-500"
          />
        </div>
      )}

      {isLoadingGroups ? (
        <div className="p-8 flex items-center justify-center gap-2 text-slate-400">
          <LoadingSpinner size="w-6 h-6" />
          <span className="text-sm">جاري تحميل المجموعات...</span>
        </div>
      ) : filteredGroups.length > 0 ? (
        <div className="space-y-3">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
            المجموعات المتاحة ({filteredGroups.length})
          </div>
          <div
            className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[50vh] md:max-h-[350px] overflow-y-auto pr-1"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#334155 transparent" }}
          >
            {filteredGroups.map((group) => (
              <GroupCard
                key={group}
                group={group}
                isSelected={selectedGroup === group}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-sm text-slate-500">
          لا توجد نتائج تطابق بحثك
        </div>
      )}
    </>
  );
});

// ═══════════════════════════════════════════
// Page
// ═══════════════════════════════════════════
export default function Page() {
  const { groups, selectedGroup, setSelectedGroup, isLoadingGroups } =
    useGroupContext();
  const {
    groupData,
    isLoadingData,
    error,
    setError,
    retryGroupData,
    fetchGroupData,
  } = useGroupData(selectedGroup);

  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isNavigationLoading, setIsNavigationLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const sortedGroups = useMemo(() => {
    return [...(groups || [])].sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return String(a).localeCompare(String(b), undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
  }, [groups]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return sortedGroups;
    return sortedGroups.filter((g) =>
      String(g).toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }, [sortedGroups, searchQuery]);

  const closeSelector = useCallback(() => {
    setShowGroupSelector(false);
    setSearchQuery("");
  }, []);

  const handleGroupSelect = useCallback(
    async (group) => {
      if (group === selectedGroup) {
        closeSelector();
        return;
      }

      setIsNavigationLoading(true);
      setSelectedGroup(group);
      closeSelector();
      if (setError) setError(null);

      try {
        if (fetchGroupData) await fetchGroupData(group);
      } catch (e) {
        console.error(e);
      } finally {
        setIsNavigationLoading(false);
      }
    },
    [selectedGroup, setSelectedGroup, setError, fetchGroupData, closeSelector]
  );

  const navigationItems = useMemo(
    () => [
      { id: "main", label: "أوائل الطلاب", icon: <Trophy className="w-4 h-4" /> },
      { id: "reqTask", label: "المهام", icon: <CheckSquare className="w-4 h-4" /> },
      { id: "tasks", label: "أوائل التاسك", icon: <Award className="w-4 h-4" /> },
      {
        id: "test",
        label: "أوائل الاختبار",
        icon: <ClipboardCheck className="w-4 h-4" />,
      },
    ],
    []
  );

  const handleNavigation = useCallback((_, index) => {
    setActiveIndex(index);
  }, []);

  // ESC to close
  useEffect(() => {
    if (!showGroupSelector) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeSelector();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showGroupSelector, closeSelector]);

  const groupButtonText = useMemo(() => {
    if (isLoadingGroups) return "جاري تحميل المجموعات...";
    if (isNavigationLoading) return "جاري التحميل...";
    if (selectedGroup) return `المجموعة: ${selectedGroup}`;
    return "اختر المجموعة";
  }, [isLoadingGroups, selectedGroup, isNavigationLoading]);

  const renderTabContent = () => {
    if (isLoadingData && !groupData) return <ContentSkeleton />;

    switch (activeIndex) {
      case 0:
        return (
          <MainContent groupData={groupData} selectedGroup={selectedGroup} />
        );
      case 1:
        return (
          <TasksDedline groupData={groupData} selectedGroup={selectedGroup} />
        );
      case 2:
        return (
          <StRankingTask groupData={groupData} selectedGroup={selectedGroup} />
        );
      case 3:
        return (
          <StTesting groupData={groupData} selectedGroup={selectedGroup} />
        );
      default:
        return (
          <MainContent groupData={groupData} selectedGroup={selectedGroup} />
        );
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#060912] text-slate-200 relative overflow-x-hidden px-2 py-4 sm:p-4 md:p-6"
    >
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <Particles
          particleColors={["#6366f1", "#8b5cf6", "#06b6d4"]}
          particleCount={70}
          particleSpread={8}
          speed={0.05}
          particleBaseSize={55}
          moveParticlesOnHover={false}
          alphaParticles={true}
          disableRotation={false}
        />
      </div>

      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute -top-40 -right-40 w-[480px] h-[480px] rounded-full opacity-[0.07]"
          style={{
            background: "radial-gradient(circle, #6366f1, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full opacity-[0.06]"
          style={{
            background: "radial-gradient(circle, #8b5cf6, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-full mx-auto">
        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/25 rounded-2xl max-w-md mx-auto"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
                <button
                  type="button"
                  onClick={retryGroupData}
                  className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm font-bold active:scale-95 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  إعادة
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Group selector trigger */}
        <div className="flex justify-center mb-8">
          <button
            type="button"
            onClick={() => setShowGroupSelector((p) => !p)}
            disabled={isLoadingGroups || isNavigationLoading}
            aria-expanded={showGroupSelector}
            className="flex items-center justify-between gap-3 px-6 py-3.5 rounded-2xl font-bold border border-indigo-500/35 bg-indigo-500/10 text-slate-200 hover:bg-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[260px] shadow-lg shadow-indigo-500/10 active:scale-[0.98]"
          >
            <div className="flex items-center gap-2.5">
              {isNavigationLoading ? (
                <LoadingSpinner />
              ) : (
                <Users className="w-5 h-5 text-indigo-400" />
              )}
              <span className="text-sm md:text-base">{groupButtonText}</span>
            </div>
            {!isLoadingGroups && !isNavigationLoading && (
              <ChevronDown
                className={`w-5 h-5 text-indigo-400 transition-transform duration-300 ${
                  showGroupSelector ? "rotate-180" : ""
                }`}
              />
            )}
          </button>
        </div>

        {/* Group selector modal */}
        <AnimatePresence>
          {showGroupSelector && (
            <>
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeSelector}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              />

              {/* Mobile: bottom sheet */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 260 }}
                className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] bg-[#0b0f19] border-t border-slate-800 rounded-t-3xl p-5 shadow-2xl md:hidden flex flex-col"
                dir="rtl"
              >
                <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4 shrink-0" />
                <GroupPickerBody
                  sortedGroups={sortedGroups}
                  filteredGroups={filteredGroups}
                  selectedGroup={selectedGroup}
                  isLoadingGroups={isLoadingGroups}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  onSelect={handleGroupSelect}
                  onClose={closeSelector}
                />
              </motion.div>

              {/* Desktop: centered modal */}
              <div className="fixed inset-0 z-50 hidden md:flex items-center justify-center p-4 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 12 }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => e.stopPropagation()}
                  className="pointer-events-auto w-full max-w-[500px] bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col"
                  dir="rtl"
                >
                  <GroupPickerBody
                    sortedGroups={sortedGroups}
                    filteredGroups={filteredGroups}
                    selectedGroup={selectedGroup}
                    isLoadingGroups={isLoadingGroups}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onSelect={handleGroupSelect}
                    onClose={closeSelector}
                  />
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>

        {/* Full-page loading when switching group */}
        <AnimatePresence>
          {isNavigationLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60]"
            >
              <div className="bg-slate-900 border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center gap-4">
                  <LoadingSpinner size="w-8 h-8" />
                  <span className="text-lg font-bold text-slate-200">
                    جاري تحميل بيانات المجموعة...
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        {selectedGroup && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex justify-center"
          >
            <PremiumNav
              items={navigationItems}
              onSelect={handleNavigation}
              activeIndex={activeIndex}
            />
          </motion.div>
        )}

        {/* Content */}
        <main className="min-h-[400px]">
          {selectedGroup ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedGroup}-${activeIndex}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22 }}
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Users className="w-10 h-10 text-indigo-400" />
              </div>
              <p className="text-xl font-bold text-white mb-2">
                اختر مجموعتك الدراسية أولاً
              </p>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                اضغط على الزر أعلاه لاختيار مجموعتك واستعراض لوحة الشرف
                والمهام والاختبارات
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}