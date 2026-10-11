"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig";
import {
  BarChart,
  Users,
  Star,
  RefreshCw,
  Loader,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Award,
  CheckCircle,
  Search,
  Filter 
} from "lucide-react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import StudentAnswersModal from "./StudentAnswersModal"; // تأكد من أن هذا الملف موجود
import QuestionAnalysisDashboard from "./QuestionAnalysisDashboard.JSX";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// ------------------------------------------------------------------
// 1. مكون StatCard مُحسّن
// ------------------------------------------------------------------
const StatCard = ({ icon, label, value, colorClass = "text-indigo-600" }) => (
  <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition duration-300">
    <div className="flex items-center justify-between">
      <div className={`p-3 rounded-full bg-opacity-10 ${colorClass.replace('text-', 'bg-')}`}>
        {React.cloneElement(icon, { className: colorClass, size: 32 })}
      </div>
      <p className="text-2xl font-extrabold text-gray-900">{value}</p>
    </div>
    <p className="mt-3 text-sm font-medium text-gray-500">{label}</p>
  </div>
);

// ------------------------------------------------------------------
// 2. مكون RankBadge مُحسّن
// ------------------------------------------------------------------
const RankBadge = ({ rank }) => {
  let color = "bg-gray-200 text-gray-700";
  let icon = null;

  if (rank === 1) {
    color = "bg-yellow-500 text-slate-100";
    icon = <Award size={16} className="ml-1" />;
  } else if (rank === 2) {
    color = "bg-gray-400 text-slate-100";
  } else if (rank === 3) {
    color = "bg-amber-700 text-slate-100";
  }

  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${color}`}
    >
      {icon}
      {rank}
    </span>
  );
};

// ------------------------------------------------------------------
// 3. المكون الرئيسي ExamResultsDashboard
// ------------------------------------------------------------------
const ExamResultsDashboard = () => {
  const [examId, setExamId] = useState("");
  const [examData, setExamData] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [availableExams, setAvailableExams] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  useEffect(() => {
    const fetchExamsList = async () => {
      setLoading(true);
      try {
        const examsSnapshot = await getDocs(collection(db, "exams"));
        const examsList = examsSnapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title || doc.id,
        }));
        setAvailableExams(examsList);
        if (examsList.length > 0) {
          setExamId(examsList[0].id);
        }
      } catch (err) {
        setError("خطأ في تحميل قائمة الامتحانات.");
      }
      setLoading(false);
      setInitialLoad(false);
    };
    fetchExamsList();
  }, []);

  const fetchResultsAndExam = async () => {
    if (!examId) {
      setError("يرجى اختيار امتحان من القائمة أولاً.");
      return;
    }
    setLoading(true);
    setError(null);
    setResults([]);
    setExamData(null);
    try {
      const examRef = doc(db, "exams", examId);
      const examSnap = await getDoc(examRef);
      if (!examSnap.exists())
        throw new Error("الامتحان بهذا المعرّف غير موجود أو تم حذفه.");

      const currentExamData = examSnap.data();
      setExamData(currentExamData);

      const resultsQuery = query(
        collection(db, "examResults"),
        where("examId", "==", examId),
        where("finishedAt", "!=", null)
      );
      const querySnapshot = await getDocs(resultsQuery);
      const fetchedResults = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        finishedAt: doc.data().finishedAt
          ? doc.data().finishedAt.toDate()
          : null,
      }));
      setResults(fetchedResults);
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء جلب البيانات.");
      setResults([]);
      setExamData(null);
    } finally {
      setLoading(false);
    }
  };

const groups = useMemo(() => {
    const uniqueGroups = [...new Set(results.map((r) => r.group))].filter(Boolean);
    return ["all", ...uniqueGroups];
  }, [results]);

  // 3. تعديل منطق useMemo ليشمل الفلترة
  const { sortedResults, stats, feedbackAnalysis } = useMemo(() => {
    const baseData = {
      sortedResults: [],
      stats: { totalStudents: 0, averageScore: 0, highestScore: 0, lowestScore: 0 },
      feedbackAnalysis: { difficultyVotes: { easy: 0, medium: 0, hard: 0 }, notes: [] },
    };

    if (results.length === 0) return baseData;

    // --- منطق الفلترة ---
    let filtered = results.filter((result) => {
      const matchesName = result.studentName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGroup = selectedGroup === "all" || result.group === selectedGroup;
      return matchesName && matchesGroup;
    });

    // الترتيب (حسب الدرجة ثم الوقت)
    const sorted = [...filtered].sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return a.finishedAt - b.finishedAt;
    });

    // حساب الإحصائيات بناءً على النتائج المفلترة (أو الأصلية حسب رغبتك - هنا جعلتها بناءً على المفلتر)
    const totalStudents = filtered.length;
    const totalScore = filtered.reduce((sum, r) => sum + r.score, 0);
    const averageScore = totalStudents > 0 ? totalScore / totalStudents : 0;
    const highestScore = filtered.length > 0 ? Math.max(...filtered.map((r) => r.score)) : 0;
    const lowestScore = filtered.length > 0 ? Math.min(...filtered.map((r) => r.score)) : 0;

    // ... (منطق feedbackAnalysis يظل كما هو أو يتم فلترته أيضاً)
    const difficultyVotes = { easy: 0, medium: 0, hard: 0 };
    const notes = [];
    filtered.forEach((result) => {
      if (result.feedback) {
        if (result.feedback.difficulty) difficultyVotes[result.feedback.difficulty]++;
        if (result.feedback.notes) notes.push({ studentName: result.studentName, note: result.feedback.notes });
      }
    });

    return {
      sortedResults: sorted,
      stats: { totalStudents, averageScore, highestScore, lowestScore },
      feedbackAnalysis: { difficultyVotes, notes },
    };
  }, [results, searchTerm, selectedGroup]);



  const handleFetchClick = (e) => {
    e.preventDefault();
    fetchResultsAndExam();
  };

  const difficultyChartData = {
    labels: ["سهل", "متوسط", "صعب"],
    datasets: [
      {
        label: "عدد الطلاب",
        data: [
          feedbackAnalysis.difficultyVotes.easy,
          feedbackAnalysis.difficultyVotes.medium,
          feedbackAnalysis.difficultyVotes.hard,
        ],
        backgroundColor: [
          "rgba(75, 192, 192, 0.8)", // Teal for Easy
          "rgba(255, 206, 86, 0.8)", // Yellow for Medium
          "rgba(255, 99, 132, 0.8)", // Red for Hard
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(255, 99, 132, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 bg-gray-50 min-h-screen" dir="rtl">
      {/* ------------------------------------------------------------------
          Header Section (Improved)
      ------------------------------------------------------------------ */}
      <div className="bg-slate-800 p-6 sm:p-8 rounded-2xl mb-8 shadow-2xl border-t-4 border-indigo-600">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2 flex items-center">
          <BarChart className="ml-3 text-indigo-600" size={36} />
          لوحة تحليلات نتائج الامتحانات
        </h1>
        <p className="text-gray-600 text-lg">
          عرض وتحليل شامل لأداء الطلاب وتقييماتهم للامتحانات المكتملة.
        </p>
      </div>


      {/* ------------------------------------------------------------------
          Exam Selection Form (Improved)
      ------------------------------------------------------------------ */}
      <form
        onSubmit={handleFetchClick}
        className="bg-slate-800 p-6 rounded-xl shadow-lg mb-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 border border-gray-200"
      >
        <label htmlFor="examSelect" className="font-bold text-gray-700 text-lg sm:w-1/4">
          اختر الامتحان:
        </label>
        <select
          id="examSelect"
          value={examId}
          onChange={(e) => setExamId(e.target.value)}
          className="flex-grow p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
          disabled={initialLoad || availableExams.length === 0 || loading}
        >
          {initialLoad ? (
            <option>جاري تحميل الامتحانات...</option>
          ) : availableExams.length === 0 ? (
            <option>لا توجد امتحانات متاحة</option>
          ) : (
            <>
              <option value="" hidden>-- اختر امتحانًا --</option>
              {availableExams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title}
                </option>
              ))}
            </>
          )}
        </select>
        <button
          type="submit"
          className="text-slate-100 px-6 py-3 rounded-lg font-semibold hover:flex items-center justify-center gap-2 transition duration-150 disabled:bg-gray-400 disabled:cursor-not-allowed sm:w-auto"
          disabled={loading || !examId}
        >
          {loading ? (
            <Loader className="animate-spin" size={20} />
          ) : (
            <RefreshCw size={20} />
          )}
          <span>{loading ? "جاري الجلب..." : "عرض النتائج"}</span>
        </button>
      </form>

      {error && (
        <div className="bg-red-100 border-r-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* ------------------------------------------------------------------
          Statistics Cards (Improved)
      ------------------------------------------------------------------ */}
      {examData &&(
        <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Users />}
          label="عدد الطلاب المكملين"
          value={stats.totalStudents}
          colorClass="text-blue-600"
        />
        <StatCard
          icon={<TrendingUp />}
          label="متوسط الدرجات"
          value={stats.averageScore.toFixed(1)}
          colorClass="text-green-600"
        />
        <StatCard
          icon={<Star />}
          label="أعلى درجة"
          value={stats.highestScore}
          colorClass="text-yellow-600"
        />
        <StatCard
          icon={<TrendingDown />}
          label="أقل درجة"
          value={stats.lowestScore}
          colorClass="text-red-600"
        />
      </div>
        <details className="bg-slate-800 rounded-xl shadow-lg overflow-hidden my-6 border border-gray-200">
        <summary className="p-5 text-xl font-bold text-gray-800 cursor-pointer hover:bg-gray-50 transition duration-150 flex items-center justify-between">
          تحليل أداء الأسئلة
          <CheckCircle className="text-green-500" size={24} />
        </summary>
        <div className="p-5 border-t border-gray-200">
          <QuestionAnalysisDashboard />
        </div>
      </details>

        {/* ------------------------------------------------------------------
          قسم الفلترة الجديد
      ------------------------------------------------------------------ */}
      {results.length > 0 && (
        <div className="bg-slate-800 p-4 rounded-xl shadow-md mb-6 border border-gray-200 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="بحث باسم الطالب..."
              className="w-full pr-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="text-gray-400" size={18} />
            <select
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none min-w-[150px] flex-grow"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
            >
              <option value="all">كل المجموعات</option>
              {groups.map((group) => (
                group !== "all" && <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>
          
          <div className="text-sm text-gray-500 whitespace-nowrap">
            نتائج البحث: <strong>{sortedResults.length}</strong>
          </div>
        </div>
      )}
      {/* ------------------------------------------------------------------
          Results Table/Cards
      ------------------------------------------------------------------ */}
      <div className="bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="p-4 sm:p-6 border-b bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-800">
            ترتيب الطلاب - امتحان:{" "}
            <span className="text-indigo-600">{examData?.title || examId}</span>
          </h2>
        </div>
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            <Loader className="animate-spin mx-auto mb-3" size={40} />
            <p className="text-lg">جاري تحميل النتائج...</p>
          </div>
        ) : !examData ? (
          <div className="p-10 text-center text-gray-500">
            <p className="text-lg">اختر امتحانًا واضغط على "عرض النتائج" للبدء.</p>
          </div>
        ) : sortedResults.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <p className="text-lg">لم يتم العثور على نتائج مكتملة لهذا الامتحان.</p>
          </div>
        ) : (
          <div className="w-full">
            {/* ✅ عرض الجدول في الشاشات الكبيرة فقط */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                      الترتيب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                      اسم الطالب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                      الدرجة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                      النسبة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                      وقت الانتهاء
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800 divide-y divide-gray-200">
                  {sortedResults.map((result, index) => (
                    <tr
                      key={result.id}
                      className="hover:bg-indigo-50 transition duration-150 cursor-pointer"
                      onClick={() =>
                        setSelectedStudent({
                          ...result,
                          questionsForReview:
                            result.shuffledQuestionsAndOptions || examData.questions,
                        })
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <RankBadge rank={index + 1} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-base font-semibold text-gray-900">
                          {result.studentName}
                        </div>
                        <div className="text-sm text-gray-500">
                          المجموعة: {result.group}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-base font-bold text-indigo-600">
                          {result.score} / {examData?.totalMarks || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-base font-bold text-green-600">
                          {examData?.totalMarks
                            ? ((result.score / examData.totalMarks) * 100).toFixed(1) + "%"
                            : "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.finishedAt
                          ? result.finishedAt.toLocaleString("ar-EG")
                          : "غير محدد"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ✅ عرض كروت للموبايل فقط (Improved) */}
            <div className="block lg:hidden space-y-4 p-4">
              {sortedResults.map((result, index) => (
                <div
                  key={result.id}
                  className="bg-slate-800 rounded-xl shadow-md p-4 border border-gray-200 hover:shadow-lg transition cursor-pointer"
                  onClick={() =>
                    setSelectedStudent({
                      ...result,
                      questionsForReview:
                        result.shuffledQuestionsAndOptions || examData.questions,
                    })
                  }
                >
                  <div className="flex items-center justify-between mb-3 border-b pb-2">
                    <RankBadge rank={index + 1} />
                    <span className="text-xs text-gray-500">
                      {result.finishedAt
                        ? result.finishedAt.toLocaleString("ar-EG")
                        : "غير محدد"}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900">
                    {result.studentName}
                  </h3>
                  <p className="text-sm text-indigo-600 mb-3">المجموعة: {result.group}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-dashed mt-2">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500">الدرجة</span>
                        <span className="text-base font-bold text-indigo-600">
                            {result.score} / {examData?.totalMarks || "N/A"}
                        </span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-500">النسبة</span>
                        <span className="text-base font-bold text-green-600">
                            {examData?.totalMarks
                            ? ((result.score / examData.totalMarks) * 100).toFixed(1) + "%"
                            : "N/A"}
                        </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------
          Feedback and Chart Section (Improved)
      ------------------------------------------------------------------ */}
      {results.length > 0 && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
              تقييم صعوبة الامتحان من الطلاب
            </h3>
            <Bar
              data={difficultyChartData}
              options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                        }
                    }
                }
              }}
            />
          </div>
          <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
              <MessageSquare className="ml-2 text-indigo-600" /> ملاحظات الطلاب
            </h3>
            <div className="max-h-80 overflow-y-auto space-y-4 pr-2">
              {feedbackAnalysis.notes.length > 0 ? (
                feedbackAnalysis.notes.map((item, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                    <p className="font-bold text-gray-800 mb-1">
                      {item.studentName}:
                    </p>
                    <p className="text-gray-700 text-sm italic leading-relaxed">"{item.note}"</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic">لا توجد ملاحظات مكتوبة من الطلاب حتى الآن.</p>
              )}
            </div>
          </div>
        </div>
      )}
        </>
      )}
      {selectedStudent && (
        <StudentAnswersModal
          studentResult={selectedStudent}
          questions={selectedStudent.questionsForReview}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
};

export default ExamResultsDashboard;

