//الواجه اللي بتظهر للطالب قبل الدخول وبعد الانتهاء
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";

import { collection, query, where, onSnapshot , getDoc, doc, setDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig";
import { Loader, XCircle, Lock, Calendar, Play, BookOpen, CheckCircle, Clock, Send, Smile, Meh, Frown } from "lucide-react";
import ActiveExam from "./ActiveExam";

// --- [الحل] إضافة دالة shuffleArray المفقودة هنا ---
const shuffleArray = (array) => {
  if (!Array.isArray(array)) return [];
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// --- مكونات الواجهة المساعدة (مدمجة هنا لسهولة النسخ) ---

const StatusScreen = ({ icon, title, message, extraContent = null }) => (
  <div className="min-h-[70vh] flex items-center justify-center p-4" dir="rtl">
    <div className="w-full max-w-lg text-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-8 sm:p-10 rounded-3xl shadow-xl">
      <div className="text-purple-500 flex justify-center mb-4">{icon}</div>
      <h1 className="text-2xl sm:text-3xl font-black text-gray-800 dark:text-white mb-2 leading-tight">{title}</h1>
      <p className="text-sm sm:text-base text-gray-600 dark:text-slate-300 leading-relaxed">{message}</p>
      {extraContent}
    </div>
  </div>
);

const CountdownUnit = ({ value, label, gradient, glowColor }) => (
  <div className="flex flex-col items-center flex-1 min-w-0">
    <div className={`relative w-full aspect-square max-w-[70px] sm:max-w-[85px] md:max-w-[95px] rounded-2xl flex flex-col items-center justify-center shadow-xl border border-white/20 backdrop-blur-md ${gradient} ${glowColor}`}>
      <span className="text-xl sm:text-3xl md:text-4xl font-black text-white font-mono tabular-nums leading-none">
        {String(value).padStart(2, '0')}
      </span>
      <div className="absolute top-1 left-1.5 right-1.5 h-px bg-white/30 rounded-full" />
    </div>
    <span className="mt-1.5 text-[10px] sm:text-xs font-bold text-slate-300 dark:text-slate-400 tracking-wider">
      {label}
    </span>
  </div>
);

// ✅ قيم particles محسوبة مرة واحدة خارج الـ component لمنع إعادة الحساب عند كل render
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  width: (((i * 7) % 4) + 2),
  height: (((i * 13) % 4) + 2),
  top: ((i * 17) % 100),
  left: ((i * 23) % 100),
  duration: (((i * 11) % 3) + 2),
  delay: ((i * 3) % 2),
}));

const CountdownScreen = ({ startTime, exam, onExamOpen }) => {
  // ✅ حوّل الـ Date object لرقم ثابت لتجنب إعادة إنشاء الـ interval عند كل re-render
  const startTimeMs = startTime instanceof Date ? startTime.getTime() : Number(startTime);

  const [timeRemaining, setTimeRemaining] = useState(() => Math.max(0, startTimeMs - Date.now()));

  useEffect(() => {
    // ✅ تحديث فوري عند التركيب
    const getRemaining = () => Math.max(0, startTimeMs - Date.now());
    setTimeRemaining(getRemaining());

    const timer = setInterval(() => {
      const remaining = getRemaining();
      setTimeRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        if (onExamOpen) onExamOpen();
      }
    }, 1000);
    return () => clearInterval(timer);
    // ✅ نستخدم startTimeMs (رقم ثابت) كـ dependency وليس startTime (object يتغير)
  }, [startTimeMs]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalSeconds = Math.max(0, Math.floor(timeRemaining / 1000));
  const days    = Math.floor(totalSeconds / 86400);
  const hours   = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const isImminent = timeRemaining < 5 * 60 * 1000; // أقل من 5 دقائق

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-3 sm:p-6" dir="rtl">
      {/* خلفية نجوم ثابتة */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-indigo-400/20 dark:bg-white/10 animate-pulse"
            style={{
              width: `${p.width}px`,
              height: `${p.height}px`,
              top: `${p.top}%`,
              left: `${p.left}%`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-lg mx-auto">
        {/* البطاقة الرئيسية */}
        <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-2xl border backdrop-blur-2xl transition-all ${
          isImminent 
            ? 'bg-gradient-to-b from-amber-950/80 via-slate-900/90 to-slate-950 border-amber-500/40 shadow-amber-500/10' 
            : 'bg-gradient-to-b from-slate-900/90 via-indigo-950/80 to-slate-950 border-indigo-500/30 shadow-indigo-500/10'
        }`}>
          
          {/* لمسة الإضاءة العلوية */}
          <div className={`absolute top-0 right-1/2 translate-x-1/2 w-48 h-1 rounded-full ${
            isImminent ? 'bg-amber-400 shadow-[0_0_20px_#f59e0b]' : 'bg-indigo-400 shadow-[0_0_20px_#6366f1]'
          }`} />

          {/* أيقونة وحالة */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className={`relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl mb-3 shadow-xl ${
              isImminent ? 'bg-amber-500/20 border-2 border-amber-400/60 shadow-amber-500/20' : 'bg-indigo-500/20 border-2 border-indigo-400/60 shadow-indigo-500/20'
            }`}>
              <Clock className={`w-8 h-8 sm:w-10 sm:h-10 ${isImminent ? 'text-amber-400 animate-bounce' : 'text-indigo-400 animate-pulse'}`} />
            </div>

            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black mb-2 ${
              isImminent ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
            }`}>
              <span className="w-2 h-2 rounded-full bg-current animate-ping" />
              <span>{isImminent ? '🔥 الموعد قُرب جداً!' : 'العد التنازلي للاختبار'}</span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight">
              {isImminent ? 'استعد.. الاختبار على وشك الفتح!' : 'الاختبار لم يبدأ بعد'}
            </h1>

            {exam?.title && (
              <div className="mt-2.5 px-4 py-1.5 rounded-xl bg-white/10 border border-white/15 max-w-full">
                <p className="text-indigo-200 font-bold text-sm sm:text-base truncate">
                  📝 {exam.title}
                </p>
              </div>
            )}

            <p className="text-slate-400 text-xs sm:text-sm mt-3">
              سيُفتح الاختبار تلقائيًا عند انتهاء العد التنازلي
            </p>
          </div>

          {/* وحدات العد التنازلي - متجاوبة 100% بدون أي overflow */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-3 mb-6 dir-ltr">
            {days > 0 && (
              <>
                <CountdownUnit 
                  value={days} 
                  label="يوم" 
                  gradient="bg-gradient-to-b from-purple-600 to-indigo-700" 
                  glowColor="shadow-purple-900/40" 
                />
                <span className="text-white/40 text-xl sm:text-3xl font-black self-center mb-5">:</span>
              </>
            )}
            <CountdownUnit 
              value={hours} 
              label="ساعة" 
              gradient="bg-gradient-to-b from-blue-600 to-indigo-700" 
              glowColor="shadow-blue-900/40" 
            />
            <span className="text-white/40 text-xl sm:text-3xl font-black self-center mb-5">:</span>
            <CountdownUnit 
              value={minutes} 
              label="دقيقة" 
              gradient={isImminent ? "bg-gradient-to-b from-amber-500 to-orange-600" : "bg-gradient-to-b from-indigo-600 to-purple-700"} 
              glowColor={isImminent ? "shadow-amber-900/40" : "shadow-indigo-900/40"} 
            />
            <span className="text-white/40 text-xl sm:text-3xl font-black self-center mb-5">:</span>
            <CountdownUnit 
              value={seconds} 
              label="ثانية" 
              gradient={isImminent ? "bg-gradient-to-b from-rose-600 to-red-700" : "bg-gradient-to-b from-purple-600 to-pink-700"} 
              glowColor={isImminent ? "shadow-red-900/40" : "shadow-pink-900/40"} 
            />
          </div>

          {/* موعد البدء */}
          {startTime && (
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 text-xs sm:text-sm text-slate-300 flex items-center justify-center gap-2 text-center shadow-inner">
              <Calendar className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span>موعد البدء: <span className="text-white font-extrabold">
                {startTime.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}
                {' — '}
                {startTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
              </span></span>
            </div>
          )}

          {/* شريط التقدم عند الاقتراب */}
          {isImminent && (
            <div className="mt-4 space-y-1">
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-full transition-all duration-1000 shadow-[0_0_12px_#f59e0b]"
                  style={{ width: `${Math.min(100, Math.max(0, 100 - (timeRemaining / (5 * 60 * 1000)) * 100))}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


const ReadyScreen = ({ exam, student, onStart }) => {
    const [timeLeft, setTimeLeft] = useState(0);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    useEffect(() => {
        const closeTime = exam.closeAt?.toDate ? exam.closeAt.toDate() : new Date(exam.closeAt);
        
        const updateTimer = () => {
            const now = new Date();
            const remaining = Math.max(0, closeTime.getTime() - now.getTime());
            setTimeLeft(Math.floor(remaining / 1000));
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [exam.closeAt]);

    return (
        <div className="max-w-xl mx-auto p-4 sm:p-6 min-h-[80vh] flex items-center justify-center" dir="rtl">
            <div className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 sm:p-8 rounded-2xl shadow-xl mb-6">
                    <BookOpen className="mx-auto mb-3" size={44} />
                    <h1 className="text-2xl sm:text-3xl font-black mb-1 leading-tight">{exam?.title}</h1>
                    <p className="text-base sm:text-lg opacity-90 font-medium">مرحباً بك يا {student?.name}</p>
                </div>
                
                <div className="space-y-4 mb-6">
                    <h2 className="text-lg sm:text-xl font-extrabold text-gray-800 dark:text-white">بيانات ودليل الاختبار</h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* الوقت المتبقي للإغلاق النهائي */}
                        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 p-4 rounded-2xl">
                            <Clock className="mx-auto mb-1.5 text-rose-500 w-6 h-6" />
                            <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-0.5">متبقي على إغلاق الامتحان</p>
                            <p className="text-2xl font-mono font-black text-rose-600 dark:text-rose-400">
                                {formatTime(timeLeft)}
                            </p>
                        </div>

                        {/* مدة الإجابة المتاحة */}
                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-800 p-4 rounded-2xl">
                            <Clock className="mx-auto mb-1.5 text-blue-500 w-6 h-6" />
                            <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-0.5">مدة الإجابة المتاحة</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                                {timeLeft > 0
                                    ? `${Math.floor(timeLeft / 60)} دقيقة${timeLeft % 60 > 0 ? ` و ${timeLeft % 60} ثانية` : ""}`
                                    : "انتهى الوقت"}
                            </p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/60 p-3.5 rounded-2xl">
                            <CheckCircle className="mx-auto mb-1 text-emerald-500 w-5 h-5" />
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">عدد الأسئلة</p>
                            <p className="text-lg font-black text-gray-900 dark:text-white mt-0.5">{exam?.questions?.length}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/60 p-3.5 rounded-2xl">
                            <BookOpen className="mx-auto mb-1 text-purple-500 w-5 h-5" />
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">إجمالي الدرجات</p>
                            <p className="text-lg font-black text-gray-900 dark:text-white mt-0.5">{exam?.totalMarks}</p>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={onStart} 
                    disabled={timeLeft <= 0}
                    className={`w-full py-4 rounded-2xl text-lg sm:text-xl font-black flex items-center justify-center gap-2 transform transition-all shadow-xl ${
                        timeLeft <= 0 
                        ? 'bg-gray-400 cursor-not-allowed text-white' 
                        : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white shadow-emerald-600/30'
                    }`}
                >
                    <Play className="w-6 h-6 fill-current" /> {timeLeft <= 0 ? "انتهى وقت الاختبار" : "ابدأ الاختبار الآن"}
                </button>
            </div>
        </div>
    );
};


const FeedbackScreen = ({ student, exam, onFinish }) => {
    const [feedbackNotes, setFeedbackNotes] = useState("");
    const [sendAsAnonymous, setSendAsAnonymous] = useState(false);
    const [difficultyVote, setDifficultyVote] = useState(null);

    const submitFeedbackAndFinish = async () => {
        try {
            const resultRef = doc(db, "examResults", `${student.id}_${exam.id}`);
            await updateDoc(resultRef, {
                feedback: { notes: feedbackNotes, difficulty: difficultyVote, Anonymous: sendAsAnonymous },
            });
            onFinish();
        } catch (err) { console.error("Error submitting feedback:", err); }
    };
    
    const DifficultyButton = ({ label, icon, selected, onClick, color }) => {
        const colorClasses = { green: "border-green-500 text-green-600 bg-green-100", yellow: "border-yellow-500 text-yellow-600 bg-yellow-50", red: "border-red-500 text-red-600 bg-red-100" };
        const selectedClasses = selected ? colorClasses[color] : "border-gray-300 bg-white";
        return <button onClick={onClick} className={`flex-1 flex flex-col items-center justify-center p-2 border-2 rounded-lg transition-all ${selectedClasses} hover:shadow-md`}>{icon}<span className="mt-1 font-semibold">{label}</span></button>;
    };

    return (
        <div className="max-w-2xl mx-auto p-4 bg-white dark:bg-gray-900 rounded-lg min-h-screen flex items-center" dir="rtl">
            <div className="w-full">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4 sm:p-8 rounded-lg mb-6 text-center">
                    <h1 className="sm:text-3xl font-bold mb-2">خطوة أخيرة!</h1>
                    <p  className="sm:text-xl">لقد أكملت جميع الأسئلة. يرجى تزويدنا برأيك قبل عرض النتيجة.</p>
                </div>
                <div className="rounded-lg space-y-6">
 <div>
                        <label className="block sm:text-lg font-medium mb-1 dark:text-white">ما هو تقييمك لمستوى صعوبة الاختبار؟</label>
                        <p className="mb-2 text-xs text-gray-500">بناءً على اختيارك سيتحدد صعوبة الاختبار القادم</p>
                        <div className="flex justify-center gap-2">
                            <DifficultyButton label="سهل" icon={<Smile />} selected={difficultyVote === "easy"} onClick={() => setDifficultyVote("easy")} color="green" />
                            <DifficultyButton label="متوسط" icon={<Meh />} selected={difficultyVote === "medium"} onClick={() => setDifficultyVote("medium")} color="yellow" />
                            <DifficultyButton label="صعب" icon={<Frown />} selected={difficultyVote === "hard"} onClick={() => setDifficultyVote("hard")} color="red" />
                        </div>
                    </div>
                    <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border">
                        <label htmlFor="feedbackNotes" className="block text-lg font-semibold mb-3">هل لديك أي ملاحظات؟ (اختياري)</label>
                        <textarea id="feedbackNotes" value={feedbackNotes} onChange={(e) => setFeedbackNotes(e.target.value)} className="w-full p-3 border rounded-lg" rows="4" placeholder="اكتب ملاحظاتك هنا..." />
                        <div className="mt-4 flex items-center justify-between bg-gray-100 p-3 rounded-lg border">
                            <label htmlFor="anonymous" className="flex items-center gap-3 cursor-pointer"><input type="checkbox" id="anonymous" checked={sendAsAnonymous} onChange={(e) => setSendAsAnonymous(e.target.checked)} className="w-5 h-5" /><span>الإرسال كمجهول</span></label>
                            {sendAsAnonymous && <span className="text-sm text-gray-500 italic">لن يتم إظهار اسمك</span>}
                        </div>
                    </div>
                    <button onClick={submitFeedbackAndFinish} disabled={!difficultyVote} className="w-full bg-blue-600 text-white px-8 py-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-gray-400">
                        <Send className="ml-2" /> تسليم وعرض النتيجة
                    </button>
                </div>
            </div>
        </div>
    );
};

const ExamResult = ({ exam, result }) => {
    const questions = result.shuffledQuestionsAndOptions || [];
    const answers = result.answers || {};

    const score = result.score ?? 0;
    const percentage = exam.totalMarks > 0 ? (score / exam.totalMarks) * 100 : 0;

    return (
        <div className="max-w-4xl mx-auto p-6 bg-gray-50/10 border dark:border-gray-700 rounded-md dark:bg-gray-900/10 min-h-screen" dir="rtl">
            <div className="text-center mb-8">
                <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-8 rounded-2xl shadow-lg">
                    <CheckCircle className="mx-auto mb-4" size={64} />
                    <h1 className="text-3xl font-bold mb-2">انتهى الاختبار!</h1>
                </div>
            </div>
            <div className="bg-white/40 dark:bg-gray-800/10 p-6 rounded-2xl shadow-md mb-6">
                <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">النتيجة النهائية</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg"><p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{score}</p><p className="text-sm text-gray-600 dark:text-gray-400">من {exam.totalMarks}</p></div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg"><p className="text-3xl font-bold text-green-600 dark:text-green-400">{percentage.toFixed(1)}%</p><p className="text-sm text-gray-600 dark:text-gray-400">النسبة</p></div>
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg"><p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{Object.keys(answers).length} / {questions.length}</p><p className="text-sm text-gray-600 dark:text-gray-400">الأسئلة المجابة</p></div>
                </div>
            </div>
            <div className="bg-white/30 dark:bg-gray-800/30 rounded-2xl shadow-md">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700"><h3 className="text-xl font-bold text-gray-800 dark:text-white">مراجعة الإجابات</h3></div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {questions.map((q, i) => {
                        const studentAnswerIndex = answers[q.id];
                        const isCorrect = studentAnswerIndex === q.correctAnswer;
                        return (
                            <div key={q.id} className="p-4">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-medium text-gray-800 dark:text-gray-200">السؤال {i + 1}: {q.text}</h4>
                                    {studentAnswerIndex !== undefined ? (isCorrect ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />) : <XCircle className="text-gray-400" />}
                                </div>
                                {q.image && (
                                    <img src={q.image} alt="صورة السؤال" className="max-h-48 max-w-full rounded-xl object-contain border border-gray-200 dark:border-gray-700 my-2 shadow-sm" />
                                )}
                                <p className={`mt-2 text-sm ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>إجابتك: {studentAnswerIndex !== undefined ? q.options[studentAnswerIndex] : "لم تجب"}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};


// --- المكون الرئيسي ---
const StudentPanel = () => {
  const params = useParams();
  const studentId = params?.id || params?.studentId;
  const [state, setState] = useState({
    loading: true,
    error: null,
    student: null,
    exam: null,
    examResult: null,
    examStatus: 'loading',
  });

  const parseDate = (dateValue) => {
    if (!dateValue) return null;
    if (dateValue.toDate) return dateValue.toDate();
    return new Date(dateValue);
  };

  const finishExamHelper = async (finalAnswers, currentStudent, currentExam, currentResult) => {
    if (!currentStudent || !currentExam || !currentResult) return;

    let score = 0;
    (currentResult.shuffledQuestionsAndOptions || []).forEach(q => {
      if (finalAnswers[q.id] !== undefined && finalAnswers[q.id] === q.correctAnswer) {
        score += q.marks || 0;
      }
    });

    try {
      const resultRef = doc(db, "examResults", `${currentStudent.id}_${currentExam.id}`);
      await updateDoc(resultRef, {
        finishedAt: Timestamp.now(),
        score,
        answers: finalAnswers,
      });

      const studentDocId = currentStudent.docId || String(currentStudent.id);
      const studentRef = doc(db, "students", studentDocId);
      const studentSnap = await getDoc(studentRef);

      if (studentSnap.exists()) {
        const studentData = studentSnap.data();
        const currentTasks = studentData.tasks || [];
        const taskName = `اختبار: ${currentExam.title || "بدون عنوان"}`;
        
        const hasTask = currentTasks.some(t => t.name === taskName);
        if (!hasTask) {
          const percentageScore = currentExam.totalMarks > 0 ? Math.round((score / currentExam.totalMarks) * 100) : 0;
          const nextTaskId = currentTasks.length > 0 ? Math.max(...currentTasks.map(t => t.id || 0)) + 1 : 1;
          
          const newTask = {
            id: nextTaskId,
            name: taskName,
            score: percentageScore,
            submitted: true,
            submittedAt: new Date().toISOString(),
            notes: `تم توليد هذا التاسك تلقائياً عند إتمام الاختبار. الدرجة الفعلية: ${score} من ${currentExam.totalMarks}`,
          };

          await updateDoc(studentRef, {
            tasks: [...currentTasks, newTask]
          });
        }
      }
    } catch (err) {
      console.error("Error finishing exam flow:", err);
    }
  };

  const finishExamFlow = useCallback(async (finalAnswers) => {
    await finishExamHelper(finalAnswers, state.student, state.exam, state.examResult);
  }, [state.student, state.exam, state.examResult]);

  useEffect(() => {
    if (!studentId) {
      setState(s => ({ ...s, error: "معرّف الطالب غير موجود.", loading: false }));
      return;
    }

    const studentQuery = query(collection(db, "students"), where("id", "==", Number(studentId)));

    const unsubscribe = onSnapshot(studentQuery, async (studentSnapshot) => {
      if (studentSnapshot.empty) {
        setState(s => ({ ...s, error: "الطالب غير موجود.", loading: false }));
        return;
      }
      
      const studentDoc = studentSnapshot.docs[0];
      const studentData = studentDoc.data();
      const examId = studentData.currentExamId;
      if (!examId) {
        setState(s => ({ ...s, student: { ...studentData, docId: studentDoc.id }, error: "لم يتم تعيين أي امتحان لك.", loading: false }));
        return;
      }

      const examRef = doc(db, "exams", examId);
      const resultRef = doc(db, "examResults", `${studentData.id}_${examId}`);

      const [examSnap, resultSnap] = await Promise.all([getDoc(examRef), getDoc(resultRef)]);

      if (!examSnap.exists() || ['archived', 'draft'].includes(examSnap.data().status)) {
        setState(s => ({ ...s, student: { ...studentData, docId: studentDoc.id }, error: "لا يوجد اختبار متاح في الوقت الحالي.", loading: false }));
        return;
      }

      const rawExamData = examSnap.data();
      if (rawExamData.status === 'published' && (!rawExamData.startAt || !rawExamData.closeAt)) {
        setState(s => ({ ...s, student: { ...studentData, docId: studentDoc.id }, error: "الاختبار غير مكتمل الإعداد. يرجى التواصل مع المشرف.", loading: false }));
        return;
      }
      
      const examData = { ...examSnap.data(), id: examSnap.id };
      const resultData = resultSnap.exists() ? resultSnap.data() : null;

      const now = new Date();
      const startTime = parseDate(examData.startAt);
      const closeTime = parseDate(examData.closeAt);

      let newStatus = 'loading';
      if (resultData?.finishedAt) {
        if (resultData.feedback?.difficulty) {
            newStatus = 'finished';
        } else {
            newStatus = 'feedback';
        }
      } else if (closeTime && now > closeTime) {
        if (resultData && !resultData.finishedAt) {
          await finishExamHelper(resultData.answers || {}, { ...studentData, docId: studentDoc.id }, examData, resultData);
          newStatus = 'feedback';
        } else {
          newStatus = 'closed';
        }
      } else if (startTime && now < startTime) {
        newStatus = 'not_started';
      } else if (!startTime || !closeTime) {
        setState(s => ({ ...s, student: { ...studentData, docId: studentDoc.id }, error: "الاختبار غير مكتمل الإعداد (لم تُحدَّد المواعيد). يرجى التواصل مع المشرف.", loading: false }));
        return;
      } else if (resultData?.startedAt) {
        newStatus = 'active';
      } else {
        newStatus = 'ready';
      }
      
      setState({ student: { ...studentData, docId: studentDoc.id }, exam: examData, examResult: resultData, loading: false, error: null, examStatus: newStatus });

    }, (err) => {
      console.error("Error in snapshot listener:", err);
      setState(s => ({ ...s, error: "حدث خطأ في الاتصال.", loading: false }));
    });

    return () => unsubscribe();
  }, [studentId]);

  const startExam = async () => {
    const { student, exam } = state;
    if (!exam || !student) return;

    try {
      const shuffledQuestions = shuffleArray(exam.questions);
      const shuffledQuestionsAndOptions = shuffledQuestions.map(q => {
        if (q.type !== 'multiple' || !q.options) return q;
        const correctAnswerText = q.options[q.correctAnswer];
        const shuffledOptions = shuffleArray(q.options);
        const newCorrectAnswerIndex = shuffledOptions.findIndex(opt => opt === correctAnswerText);
        return { ...q, options: shuffledOptions, correctAnswer: newCorrectAnswerIndex };
      });

      const resultRef = doc(db, "examResults", `${student.id}_${exam.id}`);
      const newResultData = {
        studentId: student.id, studentName: student.name, group: student.group, examId: exam.id,
        startedAt: Timestamp.now(), finishedAt: null, answers: {}, score: null,
        shuffledQuestionsAndOptions: shuffledQuestionsAndOptions,
      };
      await setDoc(resultRef, newResultData, { merge: true });

      setState(s => ({ ...s, examResult: newResultData, examStatus: 'active' }));
    } catch (err) {
      console.error("Error starting exam:", err);
      setState(s => ({ ...s, error: "حدث خطأ أثناء بدء الاختبار." }));
    }
  };

  const handleFinishFeedback = () => {
    setState(s => ({ ...s, examStatus: 'finished' }));
  };

  // --- عرض الواجهات بناءً على الحالة ---
  if (state.loading) return <div className="flex justify-center items-center min-h-screen"><Loader className="animate-spin" /></div>;
  if (state.error) return <StatusScreen icon={<XCircle />} title="خطأ" message={state.error} />;

  switch (state.examStatus) {
    case 'not_started':
      // ✅ إصلاح: تمرير onExamOpen لتحديث الحالة بدلاً من window.location.reload()
      return <CountdownScreen
        startTime={parseDate(state.exam.startAt)}
        exam={state.exam}
        onExamOpen={() => setState(s => ({ ...s, examStatus: 'ready' }))}
      />;
    case 'closed':
      if (state.examResult?.finishedAt) {
        return <ExamResult exam={state.exam} result={state.examResult} />;
      }
      return <StatusScreen icon={<Lock />} title="الاختبار مغلق" message="انتهى الوقت المخصص لهذا الاختبار." />;
    case 'feedback':
      return <FeedbackScreen student={state.student} exam={state.exam} result={state.examResult} onFinish={handleFinishFeedback} />;
    case 'finished':
      return <ExamResult exam={state.exam} result={state.examResult} />;
    case 'active':
      return <ActiveExam student={state.student} exam={state.exam} result={state.examResult} onFinish={finishExamFlow} />;
    case 'ready':
      return <ReadyScreen exam={state.exam} student={state.student} onStart={startExam} />;
    default:
      return <StatusScreen icon={<Loader />} title="جاري التحميل" message="يتم تحديد حالة الاختبار..." />;
  }
};

export default StudentPanel;

