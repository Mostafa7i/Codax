import React, { useState, useEffect } from "react";
import { db } from "@/app/services/firebaseConfig";
import Swal from "sweetalert2";
import {
  collection,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  getDoc,
  deleteDoc ,
  addDoc 
} from "firebase/firestore";
const defaultAvatar = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236366f1'><circle cx='12' cy='8' r='4'/><path d='M4 20c0-4 3.6-7 8-7s8 3 8 7'/></svg>`;

import StudentGithubLinksPopup from "../components/StudentGithubLinksPopup";
import { getTopStudents } from "@/app/components/calculations";
import { Github, Filter, Target, Trash2 } from "lucide-react";
import { useLatestLecture } from "@/app/context/LatestLectureContext";

const CircularProgress = ({ student, size = 64 }) => {
  // القيمة الافتراضية 64px
  const score = student.combinedScore || 0;
  const strokeWidth = 4; // سماكة الخط
  const radius = size / 2 - strokeWidth * 2; // نصف القطر الداخلي
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 85
      ? "#10b981"
      : score >= 75
      ? "#f59e0b"
      : score >= 65
      ? "#f97316"
      : "#ef4444";
  const textColor =
    score >= 85
      ? "text-green-500"
      : score >= 75
      ? "text-yellow-500"
      : score >= 65
      ? "text-orange-500"
      : "text-red-500";

  return (
    // استخدم متغير الحجم هنا
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          stroke="#e5e7eb" // لون الخلفية
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke={color} // لون التقدم
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset: offset }}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {/* النص في المنتصف */}
      <div className="absolute">
        <span className={`text-sm font-bold ${textColor}`}>{score}%</span>
      </div>
    </div>
  );
};

const Liks = ({ studentIdV }) => {
  const [students, setStudents] = useState([]);
  const [myReactions, setMyReactions] = useState([]);
  const [currentStudentVotes, setCurrentStudentVotes] = useState({
    remaining: 1,
    maxFree: 2,
    purchased: 0,
    used: 0,
  });
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const { latestLectures } = useLatestLecture();
  const [studentGroup, setStudentGroup] = useState("");
  const latestLecture = latestLectures[studentGroup]?.count || 0;
  const [likedStudents, setLikedStudents] = useState([]);
  const [dislikedStudents, setDislikedStudents] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc");
  const [allStudents, setAllStudents] = useState([]);
  const [popupStudentId, setPopupStudentId] = useState(null);
  const [studentsWithScores, setStudentsWithScores] = useState([]);

  // دالة لتنظيم وتطهير البيانات
  const normalizeData = (data) => {
    return {
      maxFreeVotes: Number(data?.maxFreeVotes) || 2,
      purchasedVotes: Number(data?.purchasedVotes) || 0,
      votedBy: Array.isArray(data?.votedBy) ? data.votedBy : [],
      votes: Number(data?.votes) || 0,
      frozen: Boolean(data?.frozen),
      name: data?.name || "طالب مجهول",
      profilePic: data?.profilePic || defaultAvatar,
      id: Number(data?.id) || 0, // التأكد من وجود الحقل الداخلي id
      likesCount: data.likesCount ?? 0,
      dislikesCount: data.dislikesCount ?? 0,
      group: data?.group || "",
      showGithubButton: Boolean(data?.showGithubButton),
    };
  };

  const [groups, setGroups] = useState(["all"]);
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [loadingGroup, setLoadingGroup] = useState(false);

  const handleGroupChange = (e) => {
    const group = e.target.value;
    setSelectedGroup(group);
    setLoadingGroup(true);

    // شوية وقت وهمي للتحميل (مثلاً 0.7 ثانية)
    setTimeout(() => {
      setLoadingGroup(false);
    }, 700);
  };
  useEffect(() => {
    if (!studentIdV) return;

    const fetchCurrentStudentGroup = async () => {
      const q = query(
        collection(db, "students"),
        where("id", "==", Number(studentIdV))
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        setStudentGroup(doc.data().group || "");
      }
    };

    fetchCurrentStudentGroup();
  }, [studentIdV]);

  //ازالة التفاعل من السجل
  const handleCancelReaction = async (targetName, type, lectureNumber) => {
    const q = query(
      collection(db, "students"),
      where("name", "==", targetName)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const targetDoc = snapshot.docs[0];
    const targetRef = doc(db, "students", targetDoc.id);
    const targetData = targetDoc.data();

    const reactionField = type === "like" ? "likedBy" : "dislikedBy";
    const countField = type === "like" ? "likesCount" : "dislikesCount";

    const updatedReactions = (targetData[reactionField] || []).filter(
      (r) =>
        r.likerId !== Number(studentIdV) || r.lectureNumber !== lectureNumber
    );

    const updatedCount = Math.max((targetData[countField] || 1) - 1, 0);

    await updateDoc(targetRef, {
      [reactionField]: updatedReactions,
      [countField]: updatedCount,
    });

    // تحديث الواجهة
    setMyReactions((prev) =>
      prev.filter(
        (r) =>
          !(
            (
              r.name === targetName &&
              r.type === type &&
              r.lectureNumber === lectureNumber
            ) // ✅ صح
          )
      )
    );

    // تحديث students لو ظاهر عندك
    setStudents((prev) =>
      prev.map((student) =>
        student.name === targetName
          ? {
              ...student,
              [countField]: updatedCount,
              [type === "like" ? "likedBy" : "dislikedBy"]: false,
            }
          : student
      )
    );
  };

  // جلب بيانات الطلاب
  // --- الإصلاح الشامل ---
  // useEffect واحد ليقوم بتحديث كل حالات الطلاب معاً
  // --- استبدل الـ useEffect الرئيسي بهذا الكود المصحح ---
  useEffect(() => {
    const q = collection(db, "students");
    const lecturesDocRef = doc(db, "lectures", "groups");

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const lecturesDoc = await getDoc(lecturesDocRef);
      const lecturesData = lecturesDoc.exists() ? lecturesDoc.data() : {};
      const myId = Number(studentIdV);

      const newReactions = []; // مصفوفة جديدة لتجميع تفاعلاتي

      const processedStudents = snapshot.docs.map((doc) => {
        const data = doc.data(); // البيانات الخام من Firestore
        const group = data.group || "";
        const totalLectures = lecturesData[group].count || 0;

        // حساب الدرجة
        const scores = getTopStudents([data], totalLectures, "combined");
        const combinedScore = scores.length > 0 ? scores[0].combinedScore : 0;

        // --- الإصلاح هنا: نقرأ likedBy و dislikedBy قبل normalizeData ---
        const likedBy = data.likedBy || [];
        const dislikedBy = data.dislikedBy || [];
        // نملأ سجل التفاعلات بالبيانات الخام
        likedBy.forEach((entry) => {
          if (entry.likerId === myId) {
            newReactions.push({
              type: "like",
              name: data.name,
              lectureNumber: Number(entry.lectureNumber) || 0,
            });
          }
        });
        dislikedBy.forEach((entry) => {
          if (entry.dislikerId === myId) {
            newReactions.push({
              type: "dislike",
              name: data.name,
              lectureNumber: Number(entry.lectureNumber) || 0,
            });
          }
        });
        // --- نهاية الإصلاح ---

        // التحقق من التفاعل الحالي
        const currentLecture =
          latestLectures && latestLectures[studentGroup]
            ? latestLectures[studentGroup].count
            : 0;
        const isLikedByMe = likedBy.some(
          (e) =>
            e.likerId === myId &&
            Number(e.lectureNumber) === Number(currentLecture)
        );
        const isDislikedByMe = dislikedBy.some(
          (e) =>
            e.dislikerId === myId &&
            Number(e.lectureNumber) === Number(currentLecture)
        );

        return {
          id: doc.id,
          internalId: data.id,
          ...normalizeData(data), // الآن يمكننا عمل normalize
          combinedScore,
          isLikedByMe,
          isDislikedByMe,
          // نمرر المصفوفات الكاملة هنا ليستخدمها handleCancelReaction
          likedBy: likedBy,
          dislikedBy: dislikedBy,
        };
      });

      // تحديث كل الحالات معاً
      setMyReactions(newReactions.sort((a, b) => b.lecture - a.lecture)); // تحديث السجل
      setAllStudents(processedStudents);
      setStudentsWithScores(processedStudents);
      setStudents(sortStudents(processedStudents, sortOrder));

      // استخراج المجموعات
      const uniqueGroups = Array.from(
        new Set(processedStudents.map((s) => s.group).filter(Boolean))
      );
      setGroups(["all", ...uniqueGroups]);
    });

    return () => unsubscribe();
  }, [sortOrder, latestLecture, studentIdV]);

  useEffect(() => {
    if (selectedGroup === "all") {
      setStudents(sortStudents(allStudents, sortOrder));
    } else {
      const filtered = allStudents.filter(
        (student) => student.group === selectedGroup
      );
      setStudents(sortStudents(filtered, sortOrder));
    }
  }, [selectedGroup, allStudents, sortOrder]);

  // جلب بيانات الطالب الحالي
  useEffect(() => {
    if (!studentIdV) return;

    const fetchCurrentStudent = async () => {
      const q = query(
        collection(db, "students"),
        where("id", "==", Number(studentIdV))
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = normalizeData(doc.data());

        // استخراج أرقام الطلاب المصوّت لهم
        const votedForIds = (data.votedBy || [])
          .map((v) => v.split("_")[2])
          .filter((id) => !!id);

        // استخراج الطلاب اللي عملهم Like أو Dislike
        const liked = [];
        const disliked = [];

        const studentsSnapshot = await getDocs(collection(db, "students"));
        studentsSnapshot.forEach((studentDoc) => {
          const sData = studentDoc.data();
          const sid = sData.id;
          const likedBy = sData.likedBy || [];
          const dislikedBy = sData.dislikedBy || [];

          if (likedBy.includes(Number(studentIdV))) liked.push(sid);
          if (dislikedBy.includes(Number(studentIdV))) disliked.push(sid);
        });

        setLikedStudents(liked);
        setDislikedStudents(disliked);

        // جلب أسماء الطلاب المصوّت لهم
        if (votedForIds.length > 0) {
          const studentsRef = collection(db, "students");
          const q2 = query(
            studentsRef,
            where("id", "in", votedForIds.map(Number))
          );
          const votedForSnapshot = await getDocs(q2);
          let votedForNames = []
          votedForNames = votedForSnapshot.docs.map((doc) => {
            const d = doc.data();
            return d.name || `طالب ID: ${d.id}`;
          });
        }

        const remaining =
          data.maxFreeVotes + data.purchasedVotes - data.votedBy.length;

        setCurrentStudentVotes({
          remaining,
          maxFree: data.maxFreeVotes,
          purchased: data.purchasedVotes,
          used: data.votedBy.length,
        });
      }
    };

    const unsubscribe = onSnapshot(
      query(collection(db, "students"), where("id", "==", Number(studentIdV))),
      () => fetchCurrentStudent()
    );

    return () => unsubscribe();
  }, [studentIdV]);

  const handleLike = async (targetStudentId) => {
    const likerId = Number(studentIdV);
    if (likerId === targetStudentId) return; // لا يمكن عمل لايك لنفسه

    const currentLecture = latestLectures[studentGroup].count || 0;
    // جلب الطالب المستهدف
    const qTarget = query(
      collection(db, "students"),
      where("id", "==", targetStudentId)
    );
    const snapshotTarget = await getDocs(qTarget);
    if (snapshotTarget.empty) return;
    const targetDoc = snapshotTarget.docs[0];
    const targetRef = doc(db, "students", targetDoc.id);
    const targetData = targetDoc.data();
    const likedBy = targetData.likedBy || [];

    // جلب الطالب اللي عمل اللايك
    const qLiker = query(
      collection(db, "students"),
      where("id", "==", likerId)
    );
    const snapshotLiker = await getDocs(qLiker);
    if (snapshotLiker.empty) return;
    const likerDoc = snapshotLiker.docs[0];
    const likerRef = doc(db, "students", likerDoc.id);
    const likerData = likerDoc.data();

    let updatedLikedBy = [...likedBy];
    let updatedLikesCount = targetData.likesCount || 0;

    const alreadyLikedIndex = likedBy.findIndex(
      (entry) =>
        entry.likerId === likerId && entry.lectureNumber === currentLecture
    );

    // سجل النقاط والرسائل لكل طالب لكل محاضرة
    let updatedScore = likerData.score || 0;
    let lastLecturePoint = likerData.lastLecturePoint || 0;
    let likeMessageShown = likerData.likeMessageShown || {}; // key = "targetId_lecture"
    let showMessage = null;
    const messageKey = `${targetStudentId}_${currentLecture}`;

    if (alreadyLikedIndex !== -1) {
      // إزالة اللايك
      updatedLikedBy.splice(alreadyLikedIndex, 1);
      updatedLikesCount = Math.max(0, updatedLikesCount - 1);

      // خصم النقطة مرة واحدة فقط إذا كانت مُعطاة في نفس المحاضرة
      if (lastLecturePoint === currentLecture) {
        updatedScore = Math.max(0, updatedScore - 1);
        lastLecturePoint = 0;

        // عرض الرسالة
        showMessage = `شلت اللايك ونقاطك قلت -1 وأصبحت ${updatedScore}`;
      }

      // إزالة المفتاح من likeMessageShown دائمًا
      if (likeMessageShown[messageKey]) {
        delete likeMessageShown[messageKey];
      }

        const qLikeRecord = query(
          collection(db, "likesStudents"),
          where("likerId", "==", likerId),
          where("targetId", "==", targetStudentId),
          where("lectureNumber", "==", currentLecture)
        );
          const likeSnapshot = await getDocs(qLikeRecord);
        likeSnapshot.forEach(doc => deleteDoc(doc.ref));

    } else {
      // إضافة اللايك
      updatedLikedBy.push({ likerId, lectureNumber: currentLecture });
      updatedLikesCount += 1;

      // منح النقطة فقط إذا لم يحصل على نقطة في هذه المحاضرة
      if (lastLecturePoint < currentLecture && !likeMessageShown[messageKey]) {
        updatedScore += 1;
        lastLecturePoint = currentLecture;
        showMessage = `نقاطك زادت +1 وأصبحت ${updatedScore}`;
        likeMessageShown[messageKey] = true;
      }

      
      await addDoc(collection(db, "likesStudents"), {
        likerName: likerData.name,   
        likerId: likerId,
        targetName: targetData.name,
        targetId: targetStudentId,
        lectureNumber: currentLecture,
        timestamp: new Date().toISOString(),
        read: false
      });
    }


    // تحديث بيانات الطالب المستهدف
    await updateDoc(targetRef, {
      likedBy: updatedLikedBy,
      likesCount: updatedLikesCount,
    });

    // تحديث بيانات الطالب اللي عمل اللايك
    await updateDoc(likerRef, {
      score: updatedScore,
      lastLecturePoint: lastLecturePoint,
      likeMessageShown: likeMessageShown,
    });


    

    // عرض الرسالة إذا كانت موجودة
    if (showMessage) {
      Swal.fire({
        icon: alreadyLikedIndex !== -1 ? "warning" : "success",
        title:
          alreadyLikedIndex !== -1 ? "تم إزالة اللايك" : "تمت إضافة النقطة! 🎉",
        text: showMessage,
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
        toast: true,
      });
    }
  };

const handleDislike = async (targetStudentId) => {
  const dislikerId = Number(studentIdV);

  if (dislikerId === targetStudentId) {
    Swal.fire({
      icon: "warning",
      title: "تنبيه",
      text: "لا يمكنك عمل Dislike لنفسك.",
      confirmButtonText: "تمام",
    });
    return;
  }

  const currentLecture = latestLectures[studentGroup].count || 0;

  // الطالب المستهدف
  const qTarget = query(
    collection(db, "students"),
    where("id", "==", targetStudentId)
  );
  const snapshotTarget = await getDocs(qTarget);
  if (snapshotTarget.empty) return;

  const targetDoc = snapshotTarget.docs[0];
  const targetRef = doc(db, "students", targetDoc.id);
  const targetData = targetDoc.data();
  const dislikedBy = targetData.dislikedBy || [];

  // الطالب اللي عمل الديسلايك
  const qDisliker = query(
    collection(db, "students"),
    where("id", "==", dislikerId)
  );
  const snapshotDisliker = await getDocs(qDisliker);
  if (snapshotDisliker.empty) return;

  const dislikerDoc = snapshotDisliker.docs[0];
  const dislikerData = dislikerDoc.data();

  // فحص وجود dislike سابق
  const alreadyDislikedIndex = dislikedBy.findIndex(
    (entry) =>
      entry.dislikerId === dislikerId &&
      entry.lectureNumber === currentLecture
  );

  let updatedDislikedBy = [...dislikedBy];
  let updatedDislikesCount = targetData.dislikesCount || 0;

  if (alreadyDislikedIndex !== -1) {
    // إزالة الديسلايك
    updatedDislikedBy.splice(alreadyDislikedIndex, 1);
    updatedDislikesCount = Math.max(0, updatedDislikesCount - 1);

    // حذف سجل الديسلايك من dislikesStudents
    const qDislikeRecord = query(
      collection(db, "dislikesStudents"),
      where("dislikerId", "==", dislikerId),
      where("targetId", "==", targetStudentId),
      where("lectureNumber", "==", currentLecture)
    );
    const dislikeSnapshot = await getDocs(qDislikeRecord);
    dislikeSnapshot.forEach((doc) => deleteDoc(doc.ref));

  } else {
    // إضافة ديسلايك
    updatedDislikedBy.push({ dislikerId, lectureNumber: currentLecture });
    updatedDislikesCount += 1;

    // إضافة سجل جديد للديسلايك
    await addDoc(collection(db, "dislikesStudents"), {
      dislikerName: dislikerData.name,
      dislikerId: dislikerId,
      targetName: targetData.name,
      targetId: targetStudentId,
      lectureNumber: currentLecture,
      timestamp: new Date().toISOString(),
      read: false
    });
  }

  // تحديث الطالب المستهدف
  await updateDoc(targetRef, {
    dislikedBy: updatedDislikedBy,
    dislikesCount: updatedDislikesCount,
  });
};

  const sortStudents = (students, order) => {
    return [...students].sort((a, b) =>
      order === "asc" ? a.votes - b.votes : b.votes - a.votes
    );
  };

  const openImageModal = (image) => {
    setSelectedImage(image);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImage("");
  };

  const filteredStudents =
    selectedGroup === "all"
      ? studentsWithScores
      : studentsWithScores.filter((s) => s.group === selectedGroup);

  const sortedStudents = [...filteredStudents].sort(
    (a, b) => (b.likesCount || 0) - (a.likesCount || 0)
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* ── Header ── */}
      <div className="p-5 text-white">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
          >
            ❤️
          </div>
          <div>
            <h1 className="text-2xl font-black text-white leading-tight">نظام الإعجابات</h1>
            <p className="text-white/60 text-sm">ادعم زملائك وشارك تقديرك لأعمالهم</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* How it works */}
          <div
            className="rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-purple-300" />
              <h3 className="text-sm font-bold text-white">كيف يعمل النظام</h3>
            </div>
            <ul className="space-y-1 text-xs text-white/60">
              <li>• ادعم زملائك إذا أعجبك أداؤهم 👍</li>
              <li>• يمكنك التفاعل مجدداً مع كل محاضرة جديدة</li>
              <li>• احصل على نقاط إضافية عند الحصول على إعجابات ✨</li>
            </ul>
          </div>

          {/* Group filter */}
          <div
            className="rounded-2xl p-4 flex flex-col gap-2"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Filter className="w-4 h-4 text-blue-300" />
              <h3 className="text-sm font-bold text-white">تصفية المجموعات</h3>
            </div>
            <select
              className="w-full px-3 py-2 rounded-xl text-sm text-white font-medium outline-none cursor-pointer"
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
              value={selectedGroup}
              onChange={handleGroupChange}
            >
              {groups.map((group) => (
                <option
                  key={group}
                  value={group}
                  style={{ background: "#312e81", color: "#fff" }}
                >
                  {group === "all" ? "🌐 الكل" : `المجموعة ${group}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── My Reactions Log ── */}
      <div className="px-4 pb-2">
        <details className="group">
          <summary
            className="cursor-pointer select-none flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white/70 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <span>📜</span>
            <span>سجل تفاعلاتك</span>
            <span
              className="mr-auto text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: "rgba(99,102,241,0.3)", color: "#c7d2fe" }}
            >
              {myReactions.length}
            </span>
          </summary>

          <div className="mt-2 max-h-64 overflow-y-auto space-y-1.5 px-1">
            {myReactions.length === 0 ? (
              <p className="text-center text-white/30 text-sm py-4">لا توجد تفاعلات بعد</p>
            ) : (
              [...myReactions]
                .sort((a, b) => b.lectureNumber - a.lectureNumber)
                .map((reaction, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs"
                    style={{
                      background:
                        reaction.type === "like"
                          ? "rgba(37,99,235,0.12)"
                          : "rgba(220,38,38,0.12)",
                      border:
                        reaction.type === "like"
                          ? "1px solid rgba(96,165,250,0.25)"
                          : "1px solid rgba(248,113,113,0.25)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span>{reaction.type === "like" ? "👍" : "👎"}</span>
                      <span className="text-white/80 font-medium">{reaction.name}</span>
                      <span className="text-white/30">— م{reaction.lectureNumber}</span>
                    </div>
                    <button
                      onClick={() =>
                        handleCancelReaction(reaction.name, reaction.type, reaction.lectureNumber)
                      }
                      className="text-white/30 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
            )}
          </div>
        </details>
      </div>

      {/* ── Divider ── */}
      <div className="mx-4 my-3 border-t border-white/10" />

      {/* ── Students Grid ── */}
      {loadingGroup ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-400 animate-spin" />
            <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-pink-400 animate-spin" style={{ animationDirection: "reverse" }} />
          </div>
          <span className="text-white/40 text-sm">جاري تحميل الطلاب...</span>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4 max-h-[550px] overflow-y-auto"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}
        >
          {sortedStudents.map((student, index) => {
            const isMe = String(student.internalId) === String(studentIdV);
            const rankEmoji =
              index === 0 ? "👑" : index === 1 ? "🥈" : index === 2 ? "🥉" : null;
            const score = student.combinedScore || 0;
            const scoreColor =
              score >= 85
                ? "#10b981"
                : score >= 75
                ? "#f59e0b"
                : score >= 65
                ? "#f97316"
                : "#ef4444";

            return (
              <div
                key={student.id}
                className="relative flex flex-col items-center text-center rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.03]"
                style={{
                  background: isMe
                    ? "linear-gradient(160deg, rgba(99,102,241,0.3), rgba(168,85,247,0.15))"
                    : "rgba(255,255,255,0.04)",
                  border: isMe
                    ? "1.5px solid rgba(99,102,241,0.55)"
                    : "1.5px solid rgba(255,255,255,0.07)",
                  backdropFilter: "blur(12px)",
                  boxShadow: isMe ? "0 0 20px rgba(99,102,241,0.2)" : "none",
                }}
              >
                {/* Rank badge */}
                {rankEmoji ? (
                  <div className="absolute top-2 right-2 text-base z-10">{rankEmoji}</div>
                ) : (
                  <div className="absolute top-2 right-2 text-[9px] font-bold text-white/25">
                    #{index + 1}
                  </div>
                )}

                {/* "أنت" badge */}
                {isMe && (
                  <div
                    className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full z-10"
                    style={{ background: "rgba(99,102,241,0.5)", color: "#c7d2fe" }}
                  >
                    أنت
                  </div>
                )}

                <div className="pt-6 pb-3 px-3 flex flex-col items-center gap-2 w-full">
                  {/* Avatar + CircularProgress */}
                  <div className="relative w-[72px] h-[72px] flex items-center justify-center">
                    <img
                      src={student.profilePic || defaultAvatar}
                      loading="lazy"
                      alt={student.name}
                      className="w-[58px] h-[58px] rounded-full object-cover cursor-pointer transition-all hover:brightness-110"
                      style={{ boxShadow: `0 0 14px ${scoreColor}66` }}
                      onClick={() => openImageModal(student.profilePic || defaultAvatar)}
                    />
                    <div className="absolute inset-0">
                      <CircularProgress student={student} size={72} />
                    </div>
                  </div>

                  {/* Name */}
                  <p className="text-white font-bold text-xs leading-tight truncate w-full px-1">
                    {student.name}
                  </p>

                  {/* Group */}
                  <span
                    className="text-[9px] px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}
                  >
                    {student.group || "—"}
                  </span>

                  {/* GitHub icon */}
                  <div className="h-4 flex items-center">
                    {student.showGithubButton ? (
                      <div className="relative">
                        <button
                          onClick={() => setPopupStudentId(student.id)}
                          className="text-white/50 hover:text-indigo-300 transition-colors"
                        >
                          <Github size={14} />
                        </button>
                        {popupStudentId === student.id && (
                          <StudentGithubLinksPopup
                            studentId={student.id}
                            onClose={() => setPopupStudentId(null)}
                          />
                        )}
                      </div>
                    ) : (
                      <span className="text-white/15">
                        <Github size={12} />
                      </span>
                    )}
                  </div>

                  {/* Like / Dislike counts */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(37,99,235,0.15)", color: "#60a5fa" }}
                    >
                      👍 {student.likesCount ?? 0}
                    </span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(220,38,38,0.15)", color: "#f87171" }}
                    >
                      👎 {student.dislikesCount ?? 0}
                    </span>
                  </div>

                  {/* Action buttons */}
                  {!isMe ? (
                    <div className="flex gap-2 w-full mt-2 pb-1">
                      {/* Dislike */}
                      <button
                        onClick={() => handleDislike(student.internalId ?? student.id)}
                        title="لم يعجبني"
                        className="flex-1 flex items-center justify-center py-1.5 rounded-xl transition-all duration-200 active:scale-95"
                        style={{
                          background: student.isDislikedByMe
                            ? "rgba(239,68,68,0.25)"
                            : "rgba(255,255,255,0.06)",
                          border: student.isDislikedByMe
                            ? "1px solid rgba(239,68,68,0.55)"
                            : "1px solid rgba(255,255,255,0.1)",
                          color: student.isDislikedByMe ? "#f87171" : "#6b7280",
                          boxShadow: student.isDislikedByMe
                            ? "0 0 10px rgba(239,68,68,0.25)"
                            : "none",
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 14V2" />
                          <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
                        </svg>
                      </button>

                      {/* Like */}
                      <button
                        onClick={() => handleLike(student.internalId ?? student.id)}
                        title="أعجبني"
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl transition-all duration-200 active:scale-95"
                        style={{
                          background: student.isLikedByMe
                            ? "rgba(37,99,235,0.3)"
                            : "rgba(255,255,255,0.06)",
                          border: student.isLikedByMe
                            ? "1px solid rgba(96,165,250,0.6)"
                            : "1px solid rgba(255,255,255,0.1)",
                          color: student.isLikedByMe ? "#93c5fd" : "#6b7280",
                          boxShadow: student.isLikedByMe
                            ? "0 0 12px rgba(59,130,246,0.35)"
                            : "none",
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill={student.isLikedByMe ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M7 10v12" />
                          <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
                        </svg>
                        {student.isLikedByMe && (
                          <span className="text-[9px] font-bold">✓</span>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="pb-1 mt-2">
                      <span
                        className="text-[9px] px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}
                      >
                        ملفك أنت 👤
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* مودال الصورة */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={closeImageModal}
        >
          <div
            className="relative max-w-[95vw] max-h-[95vh] w-auto h-auto p-4 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="Profile"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
              onError={(e) => {
                e.target.src = defaultAvatar;
                e.target.className =
                  "max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-gray-300";
              }}
            />
            <button
              onClick={closeImageModal}
              className="mt-4 bg-white/20 hover:bg-white/30 text-white font-bold px-6 py-2 rounded-full transition-all"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(Liks);
