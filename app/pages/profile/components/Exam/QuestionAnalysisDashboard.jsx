"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Loader, RefreshCw, XCircle, CheckCircle, BarChart2 } from "lucide-react";

// تسجيل مكونات Chart.js (مهم)
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const QuestionAnalysisDashboard = ({ examId: propExamId }) => {
  const [examId, setExamId] = useState(propExamId || "");
  const [availableExams, setAvailableExams] = useState([]);
  const [results, setResults] = useState([]);
  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (propExamId) {
      setExamId(propExamId);
    }
  }, [propExamId]);

  // جلب قائمة الامتحانات المتاحة
  useEffect(() => {
    if (propExamId) return;
    const fetchExamsList = async () => {
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
    };
    fetchExamsList();
  }, [propExamId]);

  // دالة لجلب البيانات عند الضغط على الزر أو تلقائياً
  const fetchAnalysisData = useCallback(async () => {
    if (!examId) return;
    setLoading(true);
    setError(null);
    setResults([]);
    setExamData(null);

    try {
      const examRef = doc(db, "exams", examId);
      const examSnap = await getDoc(examRef);
      if (!examSnap.exists()) {
        throw new Error("الامتحان المحدد غير موجود.");
      }
      const currentExamData = examSnap.data();
      setExamData(currentExamData);

      const resultsQuery = query(
        collection(db, "examResults"),
        where("examId", "==", examId),
        where("finishedAt", "!=", null)
      );
      const querySnapshot = await getDocs(resultsQuery);
      const fetchedResults = querySnapshot.docs.map((doc) => doc.data());
      setResults(fetchedResults);
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء جلب البيانات.");
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    if (examId) {
      fetchAnalysisData();
    }
  }, [examId, fetchAnalysisData]);

  // [القلب النابض] useMemo لحساب كل التحليلات المطلوبة
  const analysisData = useMemo(() => {
    if (!examData || results.length === 0) {
      return null;
    }

    const totalStudents = results.length;

    const detailedAnalysis = examData.questions.map((question) => {
      // نستخدم نسخة الأسئلة الأصلية كمرجع للإجابات الصحيحة
      const originalQuestion = examData.questions.find(q => q.id === question.id);
      if (!originalQuestion) return null;

      let correctCount = 0;
      const optionsCount = Array(originalQuestion.options?.length).fill(0);

      results.forEach((result) => {
        // نجد السؤال المقابل في نسخة الطالب المخلوطة
        const studentQuestionVersion = result.shuffledQuestionsAndOptions?.find(q => q.id === question.id);
        if (!studentQuestionVersion) return; // إذا لم يجد الطالب هذا السؤال

        const studentAnswerIndex = result.answers[question.id];
        if (studentAnswerIndex === undefined) return;

        // التحقق من صحة الإجابة
        if (studentAnswerIndex === studentQuestionVersion.correctAnswer) {
          correctCount++;
        }

        // زيادة عداد الخيار الذي اختاره الطالب
        const chosenOptionText = studentQuestionVersion.options[studentAnswerIndex];
        const originalOptionIndex = originalQuestion.options.findIndex(opt => opt === chosenOptionText);
        if (originalOptionIndex !== -1) {
          optionsCount[originalOptionIndex]++;
        }
      });

      const correctPercentage = (correctCount / totalStudents) * 100;
      
      const chartData = {
        labels: originalQuestion.options,
        datasets: [{
          label: 'نسبة الطلاب',
          data: optionsCount.map(count => (count / totalStudents) * 100),
          backgroundColor: originalQuestion.options.map((_, index) => 
            index === originalQuestion.correctAnswer ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)'
          ),
          borderColor: originalQuestion.options.map((_, index) => 
            index === originalQuestion.correctAnswer ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)'
          ),
          borderWidth: 1,
        }],
      };

      return {
        id: question.id,
        text: question.text,
        type: question.type,
        correctPercentage,
        chartData,
      };
    }).filter(Boolean); // إزالة أي أسئلة لم يتم العثور عليها

    // البحث عن أصعب وأسهل سؤال
    const hardestQuestion = [...detailedAnalysis].sort((a, b) => a.correctPercentage - b.correctPercentage)[0];
    const easiestQuestion = [...detailedAnalysis].sort((a, b) => b.correctPercentage - a.correctPercentage)[0];

    return { detailedAnalysis, hardestQuestion, easiestQuestion, totalStudents };
  }, [examData, results]);

  return (
    <div className={propExamId ? "" : "max-w-7xl mx-auto p-6 bg-gray-100 min-h-screen"} dir="rtl">
      {!propExamId && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h1 className="sm:text-3xl font-bold text-gray-800 mb-4 flex items-center">
            <BarChart2 className="ml-3 text-indigo-500" size={32} />
            لوحة تحليل جودة الأسئلة
          </h1>
          <form onSubmit={(e) => { e.preventDefault(); fetchAnalysisData(); }} className="flex flex-wrap justify-center items-center gap-4">
            <select
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              className="flex-grow p-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- اختر امتحانًا لتحليله --</option>
              {availableExams.map((exam) => (
                <option key={exam.id} value={exam.id}>{exam.title}</option>
              ))}
            </select>
            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:bg-gray-400" disabled={loading || !examId}>
              {loading ? <Loader className="animate-spin" size={20} /> : <RefreshCw size={20} />}
              <span>{loading ? "جاري التحليل..." : "عرض التحليل"}</span>
            </button>
          </form>
        </div>
      )}

      {error && <div className="bg-red-100 text-red-700 p-4 mb-6 rounded-md"><p>{error}</p></div>}

      {loading && <div className="text-center p-10"><Loader className="animate-spin mx-auto" size={40} /></div>}

      {analysisData && (
        <>
          {/* بطاقات الإحصائيات الرئيسية */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <HighlightCard
              icon={<XCircle className="text-red-500" />}
              title="أصعب سؤال (الأكثر خطأً)"
              question={analysisData.hardestQuestion}
              totalStudents={analysisData.totalStudents}
            />
            <HighlightCard
              icon={<CheckCircle className="text-green-500" />}
              title="أسهل سؤال (الأكثر صحةً)"
              question={analysisData.easiestQuestion}
              totalStudents={analysisData.totalStudents}
            />
          </div>

          {/* قائمة الأسئلة مع الرسوم البيانية */}
          <div className="space-y-6">
            {analysisData.detailedAnalysis.map((item, index) => (
              <div key={item.id} className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-sm sm:text-lg font-bold text-gray-800 mb-1">السؤال {index + 1}: {item.text}</h3>
                <p className="text-xs sm:text-sm font-semibold text-blue-600 mb-4">نسبة الإجابات الصحيحة: {item.correctPercentage.toFixed(1)}%</p>
                
                {item.type === 'multiple' && (
                  <div className="h-64 ">
                    <Bar 
                      data={item.chartData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        indexAxis: 'y', // جعل الرسم البياني أفقيًا لتسهيل القراءة
                        plugins: { 
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              label: (context) => `${context.raw.toFixed(1)}%`
                            }
                          }
                        },
                        scales: {
                          x: { max: 100, ticks: { callback: (value) => `${value}%` } }
                        }
                      }} 
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// مكون مساعد لعرض البطاقات العلوية
const HighlightCard = ({ icon, title, question }) => {
  if (!question) return null;
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center mb-2">
        {icon}
        <h2 className="text-xl font-bold text-gray-800 mr-3">{title}</h2>
      </div>
      <p className="text-gray-600  mb-2 truncate">{question.text}</p>
      <div className="text-center bg-gray-100 p-2 rounded-md">
        <span className="font-bold text-2xl text-indigo-600">{question.correctPercentage.toFixed(1)}%</span>
        <p className="text-sm text-gray-500">نسبة الإجابات الصحيحة</p>
      </div>
    </div>
  );
};

export default QuestionAnalysisDashboard;
