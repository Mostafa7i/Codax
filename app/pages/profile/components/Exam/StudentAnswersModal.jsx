// StudentAnswersModal.js
import React from "react";
import { X, CheckCircle, XCircle } from "lucide-react";

// [الحل] تم تغيير props: الآن نستخدم `questions` بدلاً من `exam`
const StudentAnswersModal = ({ studentResult, questions, onClose }) => {
  // التأكد من وجود البيانات اللازمة قبل العرض
  if (!studentResult || !questions) {
    return null;
  }

  // حساب إجمالي الدرجات من مصفوفة الأسئلة الممررة
  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* رأس النافذة */}
        <div className="p-6 border-b sticky top-0 bg-slate-800 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                مراجعة إجابات: {studentResult.studentName}
              </h2>
              <p className="text-gray-600">
                الدرجة:{" "}
                <span className="font-bold text-indigo-600">
                  {studentResult.score} / {totalMarks}
                </span>
              </p>
              {/* عرض معلومات التغذية الراجعة */}
              {studentResult.feedback && (
                <div className="mt-2 text-sm text-gray-500 space-y-1">
                  <p>
                    تقييم الصعوبة:{" "}
                    <span className="font-semibold text-gray-700">
                      {studentResult.feedback.difficulty || "لم يحدد"}
                    </span>
                  </p>
                  <p>
                    ملاحظات:{" "}
                    <span className="font-semibold text-gray-700">
                      {studentResult.feedback.notes || "لا توجد"}
                    </span>
                  </p>
                   <p>
                    الهوية:{" "}
                    <span className="font-semibold text-gray-700">
                      {studentResult.feedback.Anonymous ? "تم الإرسال كمجهول" : "False"}
                    </span>
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* جسم النافذة القابل للتمرير */}
        <div className="p-6 overflow-y-auto">
          <div className="divide-y divide-gray-200">
            {questions.map((question, index) => {
              const studentAnswer = studentResult.answers[question.id];
              const isCorrect =
                question.type === "multiple"
                  ? studentAnswer === question.correctAnswer
                  : studentAnswer &&
                    String(studentAnswer).trim().toLowerCase() ===
                      String(question.correctAnswer).trim().toLowerCase();

              return (
                <div key={question.id} className="py-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-lg text-gray-800 leading-relaxed">
                      السؤال {index + 1}: {question.text}
                    </h4>
                    <div className="flex-shrink-0 ml-4">
                      {isCorrect ? (
                        <CheckCircle className="text-green-500" />
                      ) : (
                        <XCircle className="text-red-500" />
                      )}
                    </div>
                  </div>

                  {question.image && (
                    <img src={question.image} alt="صورة السؤال" className="max-h-48 max-w-full rounded-xl object-contain border border-gray-200 my-2 shadow-sm" />
                  )}

                  {question.type === "multiple" ? (
                    <div className="space-y-2 mt-2">
                      <p className="text-sm text-gray-500">إجابتك:</p>
                      <p
                        className={`font-medium p-2 rounded w-full ${
                          isCorrect
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {studentAnswer !== undefined
                          ? question.options[studentAnswer]
                          : "لم تتم الإجابة"}
                      </p>
                      {!isCorrect && studentAnswer !== undefined && (
                        <>
                          <p className="text-sm text-gray-500">الإجابة الصحيحة:</p>
                          <p className="font-medium p-2 rounded bg-gray-200 text-gray-800 w-full">
                            {question.options[question.correctAnswer]}
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 mt-2">
                      <p className="text-sm text-gray-500">إجابتك:</p>
                      <p className="font-medium p-2 rounded w-full bg-blue-50 text-blue-800">
                        {studentAnswer || "لم تتم الإجابة"}
                      </p>
                      <p className="text-sm text-gray-500">الإجابة النموذجية:</p>
                      <p className="font-medium p-2 rounded bg-gray-200 text-gray-800 w-full">
                        {question.correctAnswer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAnswersModal;
