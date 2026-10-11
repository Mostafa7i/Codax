// QuestionAnalysis.js
import React from "react";
import { AlertTriangle } from "lucide-react";

const QuestionAnalysis = ({ analysis }) => {
  if (!analysis || analysis.length === 0) {
    return <p>لا يوجد تحليل متاح.</p>;
  }

  // فرز الأسئلة من الأكثر خطأ إلى الأقل
  const sortedAnalysis = [...analysis].sort(
    (a, b) => b.incorrectCount - a.incorrectCount
  );

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold text-gray-800">تحليل أداء الأسئلة</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {sortedAnalysis.map((item, index) => (
          <div key={item.id} className="p-4">
            <div className="flex justify-between items-center mb-2">
              <p className="font-semibold text-gray-700">
                السؤال {item.index + 1}:{" "}
                <span className="font-normal text-sm">"{item.text}"</span>
              </p>
              {index < 3 && item.incorrectCount > 0 && (
                <span className="flex items-center text-xs bg-red-100 text-red-800 font-bold px-2 py-1 rounded-full">
                  <AlertTriangle size={14} className="ml-1" />
                  الأكثر خطأً
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-green-500 h-full text-slate-100 text-xs flex items-center justify-center"
                  style={{ width: `${item.correctPercentage}%` }}
                >
                  {item.correctPercentage.toFixed(0)}%
                </div>
              </div>
              <div className="text-sm">
                <p>
                  <span className="font-bold text-green-600">
                    {item.correctCount}
                  </span>{" "}
                  إجابات صحيحة
                </p>
                <p>
                  <span className="font-bold text-red-600">
                    {item.incorrectCount}
                  </span>{" "}
                  إجابات خاطئة
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionAnalysis;
