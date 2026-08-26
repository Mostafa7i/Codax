import React, { useState, useEffect, useRef, useCallback } from "react";
import {  doc, updateDoc } from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig";
import { Loader, CheckCircle, Clock, ArrowLeft, ArrowRight, Send } from "lucide-react";
 import Swal from 'sweetalert2';

const  ActiveExam = ({ student, exam, result, onFinish }) => {
    const [questions] = useState(result.shuffledQuestionsAndOptions || []);
    const [answers, setAnswers] = useState(result.answers || {});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);

    // ✅ إصلاح: useRef لمنع استدعاء onFinish أكثر من مرة
    const hasFinished = useRef(false);
    // ✅ إصلاح: useRef لتتبع أحدث قيمة للإجابات بدون إعادة إنشاء الـ interval
    const answersRef = useRef(answers);

    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    const parseDate = (dateValue) => {
        if (!dateValue) return null;
        if (dateValue.toDate) return dateValue.toDate();
        return new Date(dateValue);
    };

    // ✅ إصلاح: onFinish محمي بـ hasFinished flag
    const safeFinish = useCallback(() => {
        if (hasFinished.current) return;
        hasFinished.current = true;
        onFinish(answersRef.current);
    }, [onFinish]);

    useEffect(() => {
        const closeTime = parseDate(exam.closeAt);
        if (!closeTime) return;

        const updateTimer = () => {
            const remaining = Math.max(0, closeTime.getTime() - Date.now());
            setTimeLeft(Math.floor(remaining / 1000));
            // ✅ إصلاح: فصل answers من dependencies + استخدام safeFinish
            if (remaining <= 0) {
                safeFinish();
            }
        };

        updateTimer();
        // ✅ إصلاح: لا توجد answers في dependencies — يُحسم race condition
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [exam.closeAt, safeFinish]); // ← تم حذف answers من هنا

    const saveAnswer = async (questionId, answer) => {
        const newAnswers = { ...answers, [questionId]: answer };
        setAnswers(newAnswers);
        try {
            const resultRef = doc(db, "examResults", `${student.id}_${exam.id}`);
            await updateDoc(resultRef, { answers: newAnswers });
        } catch (err) { console.error("Error saving answer:", err); }
    };


const handleFinish = () => {
  // 1. البحث عن الأسئلة التي لم يتم الإجابة عليها
  const unansweredIndex = questions.findIndex(q => answers[q.id] === undefined);

  if (unansweredIndex !== -1) {
    // 2. إذا وجد سؤال غير مجاب، نبه الطالب وانقله إليه
    Swal.fire({
      title: "عذراً! يوجد أسئلة ناقصة",
      text: `لم تقم بالإجابة على السؤال رقم ${unansweredIndex + 1}. يرجى الإجابة على جميع الأسئلة قبل التسليم.`,
      icon: "error",
      confirmButtonText: "الذهاب للسؤال",
      confirmButtonColor: "#3085d6",
    }).then(() => {
      // نقل الطالب للسؤال الناقص وعمل Focus عليه
      setCurrentQuestionIndex(unansweredIndex);
    });
    return; // التوقف هنا وعدم إكمال التسليم
  }

  // 3. إذا كانت كل الأسئلة مجابة، تابع عملية التسليم العادية
  Swal.fire({
    title: "هل أنت متأكد؟",
    text: "لقد أجبت على جميع الأسئلة. لن تتمكن من تعديل إجاباتك بعد الإنهاء!",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "نعم، إنهاء الآن",
    cancelButtonText: "إلغاء",
    reverseButtons: true,
    confirmButtonColor: "#10b981", // أخضر للتأكيد
    cancelButtonColor: "#d33",
  }).then((result) => {
    if (result.isConfirmed) {
      // ✅ إصلاح: استخدام safeFinish بدلاً من onFinish مباشرةً
      safeFinish();
      Swal.fire({
        title: "تم الإنهاء",
        text: "تم إرسال إجاباتك بنجاح ✅",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  });
};

    
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return <div className="flex justify-center items-center min-h-screen"><Loader className="animate-spin" /></div>;

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-20 p-4 rounded-b-2xl mb-6 border-b border-gray-200 dark:border-gray-700 shadow-md">
                <div className="flex justify-between items-center">
                    <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white truncate">{exam.title}</h1>
                    <div className={`flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-full transition-colors ${timeLeft <= 60 ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 animate-pulse' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'}`}>
                        <Clock size={16} />
                        <span className="font-mono tracking-wider">{formatTime(timeLeft)}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        <span className="font-bold text-gray-800 dark:text-white">{currentQuestionIndex + 1}</span> / {questions.length}
                    </div>
                </div>
            </div>
            <div className="mb-8 px-2">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${(currentQuestionIndex + 1) / questions.length * 100}%` }}></div>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-6 sm:p-8 mb-8">
                <div className="mb-6">
                    <p className="text-sm text-blue-500 dark:text-blue-400 font-semibold mb-2">السؤال</p>
                    <p className="text-lg sm:text-xl leading-relaxed text-gray-800 dark:text-gray-200" dir="auto">{currentQuestion.text}</p>
                    {currentQuestion.image && (
                        <div className="mt-4">
                            <img
                                src={currentQuestion.image}
                                alt="صورة السؤال"
                                className="max-h-72 max-w-full mx-auto rounded-2xl object-contain border border-gray-200 dark:border-gray-700 shadow-md"
                            />
                        </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">الدرجة: {currentQuestion.marks} نقطة</p>
                </div>
                <div className="space-y-3">
                    {currentQuestion.options.map((opt, i) => (
                        <button key={i} onClick={() => saveAnswer(currentQuestion.id, i)} className={`w-full text-right p-4 border-2 rounded-lg transition-all duration-200 flex items-center justify-between ${answers[currentQuestion.id] === i ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/50 dark:border-blue-500' : 'bg-gray-50 border-gray-200 hover:border-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:hover:border-blue-700'}`}>
                            <span className="font-medium text-gray-700 dark:text-gray-300">{opt}</span>
                            {answers[currentQuestion.id] === i && <CheckCircle size={20} className="text-blue-600" />}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex justify-between items-center">
                <button onClick={() => setCurrentQuestionIndex(p => Math.max(0, p - 1))} disabled={currentQuestionIndex === 0} className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                    <ArrowRight size={18} /> السابق
                </button>
                {currentQuestionIndex === questions.length - 1 ? (
                    <button onClick={handleFinish} className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-lg shadow-green-500/30">
                        <Send size={18} /> إنهاء وتسليم
                    </button>
                ) : (
                    <button onClick={() => setCurrentQuestionIndex(p => Math.min(questions.length - 1, p + 1))} className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                        التالي <ArrowLeft size={18} />
                    </button>
                )}
            </div>
            <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-sm">الانتقال السريع:</h3>
                <div className="flex flex-wrap gap-2">
                    {questions.map((q, index) => (
                        <button key={q.id} onClick={() => setCurrentQuestionIndex(index)} className={`w-10 h-10 rounded-md text-sm font-bold transition-colors ${index === currentQuestionIndex ? 'bg-blue-500 text-white' : (answers[q.id] !== undefined ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-700')}`}>
                            {index + 1}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ActiveExam