"use client";

import React, { useState } from "react";
import {
  RefreshCw,
  Sparkles,
  Coins,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import Swal from "sweetalert2";
import { requestTaskReview } from "@/app/services/gamificationFeaturesService";
import { useGamificationFeatures } from "@/app/hooks/useGamificationFeatures";

export default function TaskResubmitAction({
  task,
  taskIndex,
  studentDocId,
  studentId,
  studentName,
  studentScore = 0,
  onResubmitSuccess = () => {},
}) {
  const { codeResubmissionConfig } = useGamificationFeatures();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // إذا كانت الميزة معطلة من لوحة التحكم، لا يتم عرض أي شيء
  if (codeResubmissionConfig?.enabled === false) return null;

  // التحقق من نوع المهمة وحالتها
  const taskTitle = task?.name || task?.title || task?.taskName || "";
  const isExam = Boolean(
    task?.isExam ||
    task?.type === "exam" ||
    /^(اختبار|كويز|امتحان|exam|quiz)/i.test(taskTitle.trim()),
  );
  const isLocked = task?.enabled === false;

  // لا تنطبق على الاختبارات أو المهام المقفولة
  if (isExam || isLocked) return null;

  const rawScore = task?.score;
  const numScore = Number(rawScore);
  const isGraded =
    (rawScore !== null &&
      rawScore !== undefined &&
      rawScore !== "" &&
      !isNaN(numScore) &&
      numScore > 0) ||
    task?.isGraded === true;

  const cost =
    Number(codeResubmissionConfig?.cost) &&
    Number(codeResubmissionConfig.cost) !== 40
      ? Number(codeResubmissionConfig.cost)
      : 10;
  const maxAttempts = Number(codeResubmissionConfig?.maxAttemptsPerTask) || 1;
  const maxEligibleScore =
    Number(codeResubmissionConfig?.maxEligibleScore) || 100;

  const reviewCount = Number(task?.reviewCount || task?.resubmitCount) || 0;
  const alreadyRequested = Boolean(
    task?.reviewRequested || reviewCount >= maxAttempts,
  );

  // إذا كان الطالب قد طلب مراجعة المهمة مسبقاً
  if (alreadyRequested) {
    return (
      <div className="mt-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 text-xs text-slate-300 flex items-center justify-between gap-2 shadow-xs">
        <span className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            تم طلب مراجعة هذه المهمة مسبقاً (الحد الأقصى: مرة واحدة لكل مهمة).
          </span>
        </span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
          المحاولة 1 / 1
        </span>
      </div>
    );
  }

  // إذا لم تُقيّم المهمة بعد
  if (!isGraded) return null;

  // إذا كانت الدرجة أعلى من الحد الأقصى للأهلية
  if (numScore > maxEligibleScore) {
    return null;
  }

  const handleRequestReview = async () => {
    if (studentScore < cost) {
      Swal.fire({
        icon: "warning",
        title: "نقاط غير كافية",
        text: `تحتاج إلى ${cost} نقاط لطلب مراجعة التاسك. رصيدك الحالي هو ${studentScore} نقطة.`,
        confirmButtonText: "حسناً",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    const result = await Swal.fire({
      title: "طلب مراجعة التاسك",
      html: `
        <div class="text-right text-sm space-y-3 dir-rtl text-slate-200">
          <p>هل تريد بالتأكيد طلب مراجعة المهمة: <strong class="text-indigo-400">«${taskTitle}»</strong>؟</p>
          <div class="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-300 space-y-1.5 leading-relaxed">
            <p>• سيتم خصم <strong>${cost} نقاط</strong> من رصيدك فوراً.</p>
            <p>• سيتم <strong>تصفير درجتك الحالية (${numScore}%)</strong> وتتحول حالة المهمة إلى <strong>«جاري المراجعة»</strong> ليقوم المدرب بإعادة تقييمها.</p>
            <p>• هذا الطلب متاح <strong>لمرة واحدة فقط</strong> لكل مهمة.</p>
          </div>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: `نعم، اطلب المراجعة (${cost} نقاط)`,
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#6366f1",
      cancelButtonColor: "#64748b",
      background: "#0f172a",
      color: "#f8fafc",
    });

    if (!result.isConfirmed) return;

    try {
      setIsSubmitting(true);
      await requestTaskReview({
        studentDocId,
        studentId,
        studentName,
        taskId: task?.id,
        taskIndex,
        taskName: taskTitle,
        cost,
      });

      Swal.fire({
        icon: "success",
        title: "تم تقديم طلب المراجعة بنجاح! 🚀",
        html: `
          <div class="text-center text-xs text-slate-300 space-y-1 dir-rtl">
            <p>تم خصم ${cost} نقاط وتصفير درجة المهمة.</p>
            <p>أصبحت حالة المهمة الآن <strong class="text-amber-400 font-bold">«جاري المراجعة»</strong> بانتظار تقييم المدرب الجديد.</p>
          </div>
        `,
        confirmButtonText: "رائع!",
        confirmButtonColor: "#10b981",
        background: "#0f172a",
        color: "#f8fafc",
      });

      onResubmitSuccess();
    } catch (err) {
      console.error("Task review error:", err);
      Swal.fire({
        icon: "error",
        title: "تعذر تقديم طلب المراجعة",
        text: err.message || "حدث خطأ غير متوقع.",
        confirmButtonText: "حسناً",
        confirmButtonColor: "#ef4444",
        background: "#0f172a",
        color: "#f8fafc",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-3 p-3.5 bg-linear-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 rounded-xl border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
      <div className="space-y-0.5 min-w-0">
        <div className="flex items-center gap-1.5 text-xs font-black text-indigo-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>طلب مراجعة التاسك</span>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
            متاح لمرة واحدة فقط
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          درجتك الحالية {numScore}%. يمكنك طلب إعادة مراجعة وتقييم المهمة بتكلفة{" "}
          {cost} نقاط لتصفير الدرجة وتحويلها لـ «جاري المراجعة».
        </p>
      </div>

      <button
        type="button"
        onClick={handleRequestReview}
        disabled={isSubmitting}
        className="shrink-0 w-full sm:w-auto px-4 py-2 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-slate-100 font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
      >
        <RefreshCw
          className={`w-3.5 h-3.5 ${isSubmitting ? "animate-spin" : ""}`}
        />
        <span>طلب مراجعة التاسك ({cost} نقاط)</span>
      </button>
    </div>
  );
}
