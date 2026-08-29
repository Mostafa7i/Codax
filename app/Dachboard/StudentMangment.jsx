"use client";
import React, { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  CheckCircle,
  Users,
  Plus,
  Trash2,
  Settings,
  BookOpen,
  DollarSign,
  TrendingUp,
  XCircle,
  Move,
  BarChart3,
  Coins,
  HandCoins,
  CreditCard,
  Award,
  Trophy,
  Sparkles,
  GraduationCap,
  Zap,
  RefreshCw,
  Layers,
} from "lucide-react";
import ReserveConversionDashboard from "./ReserveConversionDashboard";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig";
import TasksManager from "./TasksManager";
import TopTaskStudentsManager from "./TopTaskStudentsManager";
import TopTestStudentsManager from "./TopTestStudentsManager";
import GroupSubmissions from "./GroupSubmissions";

export default function StudentMangment({
  students = [],
  groupName = "",
  availableGroups = [],
  groupLectures = {},
  selectedGroup = "",
  financialSummary = {},
  expandedSections = {},
  loading = false,
  isUpdateSuccess = false,
  handleAddGroup = () => {},
  handleAddStudent = () => {},
  handleDeleteStudent = () => {},
  handleMoveStudent = () => {},
  handleAddTaskToGroup = () => {},
  handleDeleteTaskFromGroup = () => {},
  handleUpdateLecture = () => {},
  setGroupLectures = () => {},
  handleGroupChange = () => {},
  setGroupName = () => {},
  toggleSection = () => {},
}) {
  const [groupActiveTab, setGroupActiveTab] = useState("controls");

  const tabs = [
    { id: "controls", label: "التحكم", icon: Settings, color: "blue" },
    { id: "tasks", label: "المهام", icon: BookOpen, color: "violet" },
    {
      id: "submissions",
      label: "التسليمات",
      icon: BarChart3,
      color: "emerald",
    },
    { id: "topTask", label: "أوائل التاسك", icon: Award, color: "amber" },
    { id: "topTest", label: "أوائل الاختبار", icon: Trophy, color: "rose" },
  ];

  const tabColorMap = {
    blue: "text-blue-600 dark:text-blue-400",
    violet: "text-violet-600 dark:text-violet-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    rose: "text-rose-600 dark:text-rose-400",
  };

  const SectionHeader = ({
    onClick,
    isExpanded,
    icon: Icon,
    title,
    iconColor = "text-blue-600",
    accent = "blue",
  }) => {
    const accentMap = {
      blue: "from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10",
      green:
        "from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/20 dark:to-emerald-600/10",
      purple:
        "from-violet-500/10 to-violet-600/5 dark:from-violet-500/20 dark:to-violet-600/10",
    };
    return (
      <button
        onClick={onClick}
        className={`w-full flex items-center justify-between px-5 py-4 transition-all ${
          isExpanded
            ? "bg-linear-to-r " + accentMap[accent]
            : "hover:bg-gray-50/80 dark:hover:bg-gray-700/30"
        }`}
      >
        <span className="flex items-center gap-3 font-bold text-gray-800 dark:text-gray-100">
          <span className="p-2 rounded-xl bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600">
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </span>
          {title}
        </span>
        <span
          className={`p-1.5 rounded-lg transition-all ${isExpanded ? "bg-white dark:bg-gray-700 shadow-sm" : ""}`}
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          )}
        </span>
      </button>
    );
  };

  const ActionButton = ({
    onClick,
    disabled,
    icon: Icon,
    label,
    gradient,
    size = "normal",
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${gradient} text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
        size === "full" ? "w-full py-3 px-5" : "py-3 px-4"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="text-sm">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen dark:bg-transparent" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-4 pb-8">
        {/* HERO HEADER */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 shadow-2xl shadow-blue-500/30 p-6">
          <div className="absolute top-0 left-0 w-48 h-48 bg-white/5 rounded-full -translate-x-16 -translate-y-16 blur-2xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-400/20 rounded-full translate-x-20 translate-y-20 blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-white/15 backdrop-blur-sm border border-white/25 rounded-2xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-blue-200" />
                  <span className="text-blue-200 text-xs font-semibold tracking-widest uppercase">
                    لوحة الإدارة
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
                  مركز إدارة الطلاب
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5">
                <Users className="w-3.5 h-3.5 text-blue-200" />
                <span className="text-sm text-white font-semibold">
                  {students.length} طالب
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-200" />
                <span className="text-sm text-white font-semibold">
                  {availableGroups.length} مجموعة
                </span>
              </div>
              {selectedGroup && (
                <div className="flex items-center gap-2 bg-emerald-400/20 border border-emerald-300/30 rounded-full px-4 py-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="text-sm text-emerald-200 font-semibold">
                    {selectedGroup} — نشطة
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="اسم المجموعة الجديدة..."
                className="flex-1 bg-white/10 backdrop-blur-sm border border-white/25 rounded-2xl px-5 py-3.5 text-white placeholder-blue-200/70 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/15 transition-all text-sm font-medium"
              />
              <button
                onClick={handleAddGroup}
                disabled={loading}
                className="bg-white text-blue-700 font-bold px-6 py-3.5 rounded-2xl hover:bg-blue-50 active:scale-95 transition-all shadow-lg shadow-black/20 disabled:opacity-60 flex items-center justify-center gap-2 text-sm shrink-0"
              >
                <Plus className="w-4 h-4" />
                {loading ? "جاري الإضافة..." : "إنشاء مجموعة"}
              </button>
            </div>
          </div>
        </div>

        {/* GROUPS GRID */}
        <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">
              المجموعات النشطة
            </h3>
            <span className="mr-auto bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {availableGroups.length}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {availableGroups.map((group) => {
              const groupData = groupLectures[group];
              const status = groupData?.status ?? false;
              const isSelected = selectedGroup === group;

              const toggleStatus = async () => {
                try {
                  const lecturesRef = doc(db, "lectures", "groups");
                  await updateDoc(lecturesRef, {
                    [`${group}.status`]: !status,
                  });
                  setGroupLectures((prev) => ({
                    ...prev,
                    [group]: { ...prev[group], status: !status },
                  }));
                } catch (err) {
                  console.error("Error updating status:", err);
                }
              };

              return (
                <div
                  key={group}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleGroupChange(group)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleGroupChange(group);
                    }
                  }}
                  className={`relative rounded-2xl border-2 transition-all duration-200 cursor-pointer select-none overflow-hidden ${
                    isSelected
                      ? "border-blue-500 bg-linear-to-br from-blue-50 to-blue-100/80 dark:from-blue-900/40 dark:to-blue-800/30 shadow-lg shadow-blue-500/20"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/60 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md"
                  } ${!status && "opacity-55"}`}
                >
                  {isSelected && (
                    <div className="absolute inset-0 bg-linear-to-br from-blue-400/5 to-blue-600/10 pointer-events-none" />
                  )}
                  <div className="p-3 relative z-10">
                    <div className="flex items-start justify-between mb-2 gap-1">
                      <span
                        className={`font-bold text-sm leading-tight ${
                          isSelected
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-gray-800 dark:text-gray-100"
                        }`}
                      >
                        {group}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStatus();
                        }}
                        className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all hover:scale-105 ${
                          status
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                            : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {status ? "نشطة" : "منتهية"}
                      </button>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                        <BookOpen className="w-3 h-3" />
                        <span>{groupData?.count ?? 0} محاضرة</span>
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                          <Users className="w-3 h-3" />
                          <span>{students.length} طالب</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-blue-500 to-blue-600" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* MANAGEMENT SECTION */}
        <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 overflow-hidden">
          <SectionHeader
            onClick={() => toggleSection("mangementGroup")}
            isExpanded={expandedSections.mangementGroup}
            icon={Settings}
            title="إدارة المجموعة"
            iconColor="text-blue-600 dark:text-blue-400"
            accent="blue"
          />
          {expandedSections.mangementGroup && (
            <div className="border-t border-gray-100 dark:border-gray-700/60">
              {/* Tab Navigation */}
              <div className="flex gap-1 p-3 bg-gray-50/80 dark:bg-gray-900/30 overflow-x-auto">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  const isActive = groupActiveTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setGroupActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all shrink-0 ${
                        isActive
                          ? "bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 " +
                            tabColorMap[tab.color]
                          : "text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/50 hover:text-gray-700 dark:hover:text-gray-200"
                      }`}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div className="p-4">
                {groupActiveTab === "controls" && (
                  <div className="space-y-3">
                    <div className="bg-gray-50 dark:bg-gray-900/40 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/40">
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        إدارة الطلاب
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <ActionButton
                          onClick={handleAddStudent}
                          icon={Plus}
                          label="إضافة طالب"
                          gradient="bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                          size="full"
                        />
                        <ActionButton
                          onClick={handleDeleteStudent}
                          icon={Trash2}
                          label="حذف طالب"
                          gradient="bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                          size="full"
                        />
                        <ActionButton
                          onClick={handleMoveStudent}
                          icon={Move}
                          label="نقل طالب"
                          gradient="bg-linear-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700"
                          size="full"
                        />
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900/40 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/40">
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        إدارة المهام
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <ActionButton
                          onClick={handleAddTaskToGroup}
                          icon={Plus}
                          label="إضافة تاسك للمجموعة"
                          gradient="bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                          size="full"
                        />
                        <ActionButton
                          onClick={handleDeleteTaskFromGroup}
                          icon={Trash2}
                          label="حذف تاسك من المجموعة"
                          gradient="bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                          size="full"
                        />
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900/40 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/40">
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5" />
                        تحديث المحاضرات
                      </p>
                      <button
                        onClick={handleUpdateLecture}
                        className="w-full bg-linear-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold py-3 px-5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 text-sm"
                      >
                        <BookOpen className="w-4 h-4" />
                        تحديث عدد المحاضرات
                        <span className="bg-white/20 border border-white/20 rounded-lg px-2.5 py-0.5 text-xs font-bold">
                          {groupLectures[selectedGroup]?.count || 0}
                        </span>
                      </button>
                      {isUpdateSuccess && (
                        <div className="mt-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40 p-3 rounded-xl">
                          <CheckCircle className="w-4 h-4 shrink-0" />
                          <span className="text-sm font-semibold">
                            تم تحديث عدد المحاضرات بنجاح!
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {groupActiveTab === "tasks" && (
                  <div className="bg-gray-50 dark:bg-gray-900/40 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700/40">
                    <TasksManager selectedGroup={selectedGroup} />
                  </div>
                )}

                {groupActiveTab === "submissions" && (
                  <div className="bg-gray-50 dark:bg-gray-900/40 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700/40">
                    <GroupSubmissions selectedGroup={selectedGroup} />
                  </div>
                )}

                {groupActiveTab === "topTask" && (
                  <div className="bg-gray-50 dark:bg-gray-900/40 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/40">
                    <TopTaskStudentsManager selectedGroup={selectedGroup} />
                  </div>
                )}

                {groupActiveTab === "topTest" && (
                  <div className="bg-gray-50 dark:bg-gray-900/40 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/40">
                    <TopTestStudentsManager selectedGroup={selectedGroup} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* FINANCIAL SUMMARY */}
        <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 overflow-hidden">
          <SectionHeader
            onClick={() => toggleSection("reportMony")}
            isExpanded={expandedSections.reportMony}
            icon={HandCoins}
            title="التقرير المالي"
            iconColor="text-emerald-600 dark:text-emerald-400"
            accent="green"
          />
          {expandedSections.reportMony && (
            <div className="border-t border-gray-100 dark:border-gray-700/60 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative overflow-hidden rounded-2xl p-5 bg-linear-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-8 -translate-y-8" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-white/15 rounded-xl">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <TrendingUp className="w-4 h-4 text-blue-200" />
                    </div>
                    <p className="text-blue-100 text-xs font-semibold mb-1.5">
                      إجمالي الاشتراكات
                    </p>
                    <p className="text-white text-2xl font-black leading-none">
                      {financialSummary?.totalRevenue
                        ? String(financialSummary.totalRevenue)
                        : "0"}
                      <span className="text-sm font-semibold text-blue-200 mr-1">
                        ج.م
                      </span>
                    </p>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl p-5 bg-linear-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-8 -translate-y-8" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-white/15 rounded-xl">
                        <Coins className="w-5 h-5 text-white" />
                      </div>
                      <CheckCircle className="w-4 h-4 text-emerald-200" />
                    </div>
                    <p className="text-emerald-100 text-xs font-semibold mb-1.5">
                      إجمالي المدفوع
                    </p>
                    <p className="text-white text-2xl font-black leading-none">
                      {financialSummary?.totalPaid
                        ? String(financialSummary.totalPaid)
                        : "0"}
                      <span className="text-sm font-semibold text-emerald-200 mr-1">
                        ج.م
                      </span>
                    </p>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl p-5 bg-linear-to-br from-rose-500 to-rose-700 shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/30 transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-8 -translate-y-8" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-white/15 rounded-xl">
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <XCircle className="w-4 h-4 text-rose-200" />
                    </div>
                    <p className="text-rose-100 text-xs font-semibold mb-1.5">
                      إجمالي المتبقي
                    </p>
                    <p className="text-white text-2xl font-black leading-none">
                      {financialSummary?.totalRemaining
                        ? String(financialSummary.totalRemaining)
                        : "0"}
                      <span className="text-sm font-semibold text-rose-200 mr-1">
                        ج.م
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* COLLAPSIBLE SECTIONS */}
        <div className="space-y-3">
          <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 overflow-hidden">
            <SectionHeader
              onClick={() => toggleSection("report")}
              isExpanded={expandedSections.report}
              icon={BarChart3}
              title="تقرير عمليات الاستبدال"
              iconColor="text-violet-600 dark:text-violet-400"
              accent="purple"
            />
            {expandedSections.report && (
              <div className="border-t border-gray-100 dark:border-gray-700/60 p-4 bg-gray-50/50 dark:bg-gray-900/20">
                <ReserveConversionDashboard />
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 overflow-hidden">
            <SectionHeader
              onClick={() => toggleSection("reserve")}
              isExpanded={expandedSections.reserve}
              icon={BookOpen}
              title="المحاضرات الاحتياطية"
              iconColor="text-emerald-600 dark:text-emerald-400"
              accent="green"
            />
            {expandedSections.reserve && (
              <div className="border-t border-gray-100 dark:border-gray-700/60 p-4 bg-gray-50/50 dark:bg-gray-900/20">
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-700/30 rounded-xl p-3 mb-4 flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                    سيتم تطبيق التغيير على جميع طلاب المجموعة المحددة
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => updateReserveForAll(1)}
                    disabled={loading}
                    className="bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    +1 لكل الطلاب
                  </button>
                  <button
                    onClick={() => updateReserveForAll(-1)}
                    disabled={loading}
                    className="bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    -1 لكل الطلاب
                  </button>
                  <button
                    onClick={() => updateReserveForAll(0)}
                    disabled={loading}
                    className="bg-linear-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    <XCircle className="w-4 h-4" />
                    تصفير للكل
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
