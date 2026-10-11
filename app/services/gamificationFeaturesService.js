"use client";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  arrayUnion,
  addDoc,
  collection,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  getDocs,
  deleteDoc,
  runTransaction,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

// ── الإعدادات الافتراضية للميزات الاقتصادية الأربع ──
export const DEFAULT_GAMIFICATION_FEATURES_CONFIG = {
  // 1. تسليط الضوء على البروفايل (Spotlight / Star of the Day)
  spotlight: {
    enabled: true,
    cost: 80,
    durationHours: 24,
    maxActive: 3,
    title: "نجم اليوم ⭐",
  },

  // 2. كشف المتفاعلين على البروفايل (Who Liked / Disliked Me)
  reactionsReveal: {
    enabled: true,
    costNormal: 30,
    costGoldenCard: 15, // خصم 50% لحاملي الكارت الذهبي
    durationHours: 48,
  },

  // 3. صناديق المفاجآت الغامضة (Mystery Loot Boxes)
  lootBoxes: {
    enabled: true,
    boxes: [
      {
        id: "bronze",
        name: "الصندوق البرونزي",
        cost: 25,
        icon: "🥉",
        color: "from-amber-700 via-amber-800 to-amber-950",
        borderClass: "border-amber-600/50",
        glowClass: "shadow-[0_0_20px_rgba(180,83,9,0.35)]",
        description: "نقاط مكافأة، رصيد حضور احتياطي، وفرص مميزة.",
        prizes: [
          {
            label: "+15 نقطة",
            type: "points",
            value: 15,
            icon: "🪙",
            weight: 35,
          },
          {
            label: "+30 نقطة",
            type: "points",
            value: 30,
            icon: "💰",
            weight: 25,
          },
          {
            label: "+1 حضور احتياطي 🛡️",
            type: "reserve",
            value: 1,
            icon: "🛡️",
            weight: 20,
          },
          {
            label: "+50 نقطة",
            type: "points",
            value: 50,
            icon: "💎",
            weight: 12,
          },
          {
            label: "Blue Card 🟦",
            type: "blue_card",
            value: 1,
            icon: "🟦",
            weight: 8,
          },
        ],
      },
      {
        id: "silver",
        name: "الصندوق الفضي",
        cost: 50,
        icon: "🥈",
        color: "from-slate-400 via-slate-600 to-slate-900",
        borderClass: "border-slate-400/50",
        glowClass: "shadow-[0_0_25px_rgba(148,163,184,0.35)]",
        description: "بطاقات Blue Card، حضور احتياطي مضاعف، وجوائز نقاط كبرى.",
        prizes: [
          {
            label: "+40 نقطة",
            type: "points",
            value: 40,
            icon: "💰",
            weight: 30,
          },
          {
            label: "+70 نقطة",
            type: "points",
            value: 70,
            icon: "💎",
            weight: 20,
          },
          {
            label: "+2 حضور احتياطي 🛡️",
            type: "reserve",
            value: 2,
            icon: "🛡️",
            weight: 18,
          },
          {
            label: "1 Blue Card 🟦",
            type: "blue_card",
            value: 1,
            icon: "🟦",
            weight: 17,
          },
          {
            label: "2 Blue Cards 🟦",
            type: "blue_card",
            value: 2,
            icon: "🟦",
            weight: 10,
          },
          {
            label: "Green Card 🟩",
            type: "green_card",
            value: 1,
            icon: "🟩",
            weight: 5,
          },
        ],
      },
      {
        id: "legendary",
        name: "الصندوق الأسطوري",
        cost: 100,
        icon: "👑",
        color: "from-amber-400 via-yellow-600 to-amber-950",
        borderClass: "border-yellow-400/70",
        glowClass: "shadow-[0_0_35px_rgba(234,179,8,0.5)]",
        description: "أعلى فرصة للحصول على Green Cards دائمة ونقاط خرافية.",
        prizes: [
          {
            label: "+90 نقطة",
            type: "points",
            value: 90,
            icon: "💎",
            weight: 25,
          },
          {
            label: "+150 نقطة",
            type: "points",
            value: 150,
            icon: "👑",
            weight: 20,
          },
          {
            label: "+3 حضور احتياطي 🛡️",
            type: "reserve",
            value: 3,
            icon: "🛡️",
            weight: 15,
          },
          {
            label: "2 Blue Cards 🟦",
            type: "blue_card",
            value: 2,
            icon: "🟦",
            weight: 18,
          },
          {
            label: "1 Green Card 🟩",
            type: "green_card",
            value: 1,
            icon: "🟩",
            weight: 15,
          },
          {
            label: "2 Green Cards 🟩",
            type: "green_card",
            value: 2,
            icon: "🟩",
            weight: 7,
          },
        ],
      },
    ],
  },

  // 4. طلب مراجعة التاسك (Task Review Request / Resubmission)
  codeResubmission: {
    enabled: true,
    cost: 10,
    maxEligibleScore: 100, // متاح لجميع المهام المقيمة
    maxAttemptsPerTask: 1, // الحد الأقصى لمرات طلب المراجعة لنفس التاسك: مرة واحدة فقط
  },
};

const FEATURES_CONFIG_DOC = "gamificationFeatures";

/**
 * جلب إعدادات الميزات الاقتصادية من Firestore
 */
export async function getGamificationFeaturesConfig() {
  try {
    const ref = doc(db, "settings", FEATURES_CONFIG_DOC);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      return {
        ...DEFAULT_GAMIFICATION_FEATURES_CONFIG,
        ...data,
        spotlight: {
          ...DEFAULT_GAMIFICATION_FEATURES_CONFIG.spotlight,
          ...(data.spotlight || {}),
        },
        reactionsReveal: {
          ...DEFAULT_GAMIFICATION_FEATURES_CONFIG.reactionsReveal,
          ...(data.reactionsReveal || {}),
        },
        lootBoxes: {
          ...DEFAULT_GAMIFICATION_FEATURES_CONFIG.lootBoxes,
          ...(data.lootBoxes || {}),
          boxes:
            Array.isArray(data.lootBoxes?.boxes) &&
            data.lootBoxes.boxes.length > 0
              ? data.lootBoxes.boxes
              : DEFAULT_GAMIFICATION_FEATURES_CONFIG.lootBoxes.boxes,
        },
        codeResubmission: {
          ...DEFAULT_GAMIFICATION_FEATURES_CONFIG.codeResubmission,
          ...(data.codeResubmission || {}),
          cost:
            data.codeResubmission?.cost !== undefined &&
            data.codeResubmission?.cost !== 40
              ? Number(data.codeResubmission.cost)
              : 10,
        },
      };
    }
    return DEFAULT_GAMIFICATION_FEATURES_CONFIG;
  } catch (err) {
    console.error("Error getting gamification features config:", err);
    return DEFAULT_GAMIFICATION_FEATURES_CONFIG;
  }
}

/**
 * حفظ إعدادات الميزات الاقتصادية في Firestore
 */
export async function saveGamificationFeaturesConfig(config) {
  const ref = doc(db, "settings", FEATURES_CONFIG_DOC);
  await setDoc(ref, {
    ...config,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * اشتراك لحظي بإعدادات الميزات الاقتصادية
 */
export function subscribeGamificationFeaturesConfig(onUpdate) {
  const ref = doc(db, "settings", FEATURES_CONFIG_DOC);
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        onUpdate({
          ...DEFAULT_GAMIFICATION_FEATURES_CONFIG,
          ...data,
          spotlight: {
            ...DEFAULT_GAMIFICATION_FEATURES_CONFIG.spotlight,
            ...(data.spotlight || {}),
          },
          reactionsReveal: {
            ...DEFAULT_GAMIFICATION_FEATURES_CONFIG.reactionsReveal,
            ...(data.reactionsReveal || {}),
          },
          lootBoxes: {
            ...DEFAULT_GAMIFICATION_FEATURES_CONFIG.lootBoxes,
            ...(data.lootBoxes || {}),
            boxes:
              Array.isArray(data.lootBoxes?.boxes) &&
              data.lootBoxes.boxes.length > 0
                ? data.lootBoxes.boxes
                : DEFAULT_GAMIFICATION_FEATURES_CONFIG.lootBoxes.boxes,
          },
          codeResubmission: {
            ...DEFAULT_GAMIFICATION_FEATURES_CONFIG.codeResubmission,
            ...(data.codeResubmission || {}),
            cost:
              data.codeResubmission?.cost !== undefined &&
              data.codeResubmission?.cost !== 40
                ? Number(data.codeResubmission.cost)
                : 10,
          },
        });
      } else {
        onUpdate(DEFAULT_GAMIFICATION_FEATURES_CONFIG);
      }
    },
    (err) => {
      console.error("Error subscribing to gamification features config:", err);
      onUpdate(DEFAULT_GAMIFICATION_FEATURES_CONFIG);
    },
  );
}

/**
 * استعادة الإعدادات الافتراضية — يمسح وثيقة Firestore ليُعيد استخدام الافتراضي
 */
export async function resetGamificationFeaturesConfigToDefault() {
  const ref = doc(db, "settings", FEATURES_CONFIG_DOC);
  await setDoc(ref, {
    ...DEFAULT_GAMIFICATION_FEATURES_CONFIG,
    updatedAt: new Date().toISOString(),
  });
}

// ────────────────────────────────────────────────
// 1. تسليط الضوء على البروفايل (Spotlight / Star of the Day)
// ────────────────────────────────────────────────

/**
 * حجز تسليط الضوء على حساب الطالب
 */
export async function purchaseSpotlight({
  studentDocId,
  studentId,
  studentName,
  profilePic,
  activeBorder,
  activeBadge,
  group,
  message,
  cost,
  durationHours = 24,
}) {
  const studentRef = doc(db, "students", studentDocId);

  return runTransaction(db, async (transaction) => {
    const studentSnap = await transaction.get(studentRef);
    if (!studentSnap.exists()) throw new Error("الطالب غير موجود");

    const currentScore = Number(studentSnap.data().score) || 0;
    if (currentScore < cost) {
      throw new Error(
        `رصيد نقاطك غير كافٍ. تحتاج إلى ${cost} نقطة، ورصيدك الحالي ${currentScore} نقطة.`,
      );
    }

    const expiresAt = new Date(
      Date.now() + durationHours * 60 * 60 * 1000,
    ).toISOString();

    // 1. خصم النقاط من وثيقة الطالب
    transaction.update(studentRef, {
      score: increment(-cost),
      spotlightExpiresAt: expiresAt,
    });

    // 2. إنشاء وثيقة في مجموعة spotlights
    const spotlightRef = doc(collection(db, "spotlights"));
    transaction.set(spotlightRef, {
      studentDocId,
      studentId: String(studentId),
      studentName: studentName || "طالب متميز",
      profilePic: profilePic || "",
      activeBorder: activeBorder || "default",
      activeBadge: activeBadge || null,
      group: group || "",
      message: message || "أنا نجم اليوم على منصة CodaX! 🚀",
      cost,
      durationHours,
      expiresAt,
      createdAt: serverTimestamp(),
    });

    // 3. تسجيل العملية في سجل الأنشطة
    const activityRef = doc(collection(db, "gamificationActivity"));
    transaction.set(activityRef, {
      type: "spotlight_purchase",
      studentId: studentDocId,
      studentName: studentName || "طالب",
      itemType: "spotlight",
      cost,
      durationHours,
      message: message || "",
      createdAt: serverTimestamp(),
    });

    return { expiresAt };
  });
}

/**
 * تسليط الضوء على حساب أي طالب إدارياً (من قبل الأدمن) بدون خصم أي نقاط
 */
export async function adminAssignSpotlight({
  studentDocId,
  studentId,
  studentName,
  profilePic,
  activeBorder,
  activeBadge,
  group,
  message,
  durationHours = 24,
}) {
  const studentRef = doc(db, "students", studentDocId);

  const expiresAt = new Date(
    Date.now() + Number(durationHours) * 60 * 60 * 1000
  ).toISOString();

  // 1. تحديث وثيقة الطالب
  await updateDoc(studentRef, {
    spotlightExpiresAt: expiresAt,
  });

  // 2. إنشاء وثيقة في مجموعة spotlights
  const spotlightRef = doc(collection(db, "spotlights"));
  await setDoc(spotlightRef, {
    studentDocId,
    studentId: String(studentId),
    studentName: studentName || "طالب متميز",
    profilePic: profilePic || "",
    activeBorder: activeBorder || "default",
    activeBadge: activeBadge || null,
    group: group || "",
    message:
      message ||
      "نجم مميز تم اختياره وتكريمه من قبل إدارة المنصة! 🌟👑",
    cost: 0,
    grantedByAdmin: true,
    durationHours: Number(durationHours),
    expiresAt,
    createdAt: serverTimestamp(),
  });

  // 3. تسجيل العملية في سجل الأنشطة
  await addDoc(collection(db, "gamificationActivity"), {
    type: "admin_spotlight_grant",
    studentId: studentDocId,
    studentName: studentName || "طالب",
    itemType: "spotlight",
    cost: 0,
    durationHours: Number(durationHours),
    message: message || "تكريم إداري",
    grantedBy: "admin",
    createdAt: serverTimestamp(),
  });

  return { id: spotlightRef.id, expiresAt };
}

/**
 * إلغاء/حذف تسليط الضوء إدارياً وحذفه من البانر
 */
export async function adminRemoveSpotlight(
  spotlightId,
  studentDocId,
  studentName
) {
  if (spotlightId) {
    await deleteDoc(doc(db, "spotlights", spotlightId));
  }

  if (studentDocId) {
    try {
      const studentRef = doc(db, "students", studentDocId);
      await updateDoc(studentRef, {
        spotlightExpiresAt: new Date(0).toISOString(),
      });
    } catch (e) {
      console.warn("Could not update student doc on spotlight removal:", e);
    }
  }

  await addDoc(collection(db, "gamificationActivity"), {
    type: "admin_spotlight_remove",
    studentId: studentDocId || "",
    studentName: studentName || "طالب",
    itemType: "spotlight",
    action: "removed_by_admin",
    createdAt: serverTimestamp(),
  });
}

/**
 * الاستماع الفوري للطلاب المميزين النشطين في Spotlight
 */
export function subscribeActiveSpotlights(onUpdate) {
  const q = query(
    collection(db, "spotlights"),
    where("expiresAt", ">", new Date().toISOString()),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      // ترتيب حسب الأحدث
      list.sort((a, b) => new Date(b.expiresAt) - new Date(a.expiresAt));
      onUpdate(list);
    },
    (err) => {
      console.warn("Spotlights listener warning:", err);
      onUpdate([]);
    },
  );
}

// ────────────────────────────────────────────────
// 2. كشف المتفاعلين على البروفايل (Who Liked / Disliked Me)
// ────────────────────────────────────────────────

/**
 * شراء تصريح كشف المتفاعلين
 */
export async function purchaseReactionsReveal({
  studentDocId,
  studentName,
  cost,
  durationHours = 48,
  isGoldenCard = false,
}) {
  const studentRef = doc(db, "students", studentDocId);

  return runTransaction(db, async (transaction) => {
    const studentSnap = await transaction.get(studentRef);
    if (!studentSnap.exists()) throw new Error("الطالب غير موجود");

    const currentScore = Number(studentSnap.data().score) || 0;
    if (currentScore < cost) {
      throw new Error(
        `رصيد نقاطك غير كافٍ. تحتاج إلى ${cost} نقطة، ورصيدك الحالي ${currentScore} نقطة.`,
      );
    }

    const expiresAt = new Date(
      Date.now() + durationHours * 60 * 60 * 1000,
    ).toISOString();

    transaction.update(studentRef, {
      score: increment(-cost),
      reactionsRevealExpiresAt: expiresAt,
    });

    const activityRef = doc(collection(db, "gamificationActivity"));
    transaction.set(activityRef, {
      type: "reactions_reveal_purchase",
      studentId: studentDocId,
      studentName: studentName || "طالب",
      itemType: "reactions_reveal",
      cost,
      durationHours,
      isGoldenCard,
      createdAt: serverTimestamp(),
    });

    return { expiresAt };
  });
}

/**
 * جلب قائمة الطلاب الذين تفاعلوا مع هذا الطالب بالأسماء
 */
export async function fetchReactionsDetails(studentDocId, studentNumericId) {
  try {
    const studentRef = doc(db, "students", studentDocId);
    const snap = await getDoc(studentRef);
    if (!snap.exists()) return { likes: [], dislikes: [] };

    const data = snap.data();
    const likedBy = data.likedBy || [];
    const dislikedBy = data.dislikedBy || [];

    // جمع كل الـ IDs لجلب أسماء الطلاب دفعة واحدة
    const likerIds = [
      ...new Set([
        ...likedBy.map((l) => l.likerId),
        ...dislikedBy.map((d) => d.dislikerId),
      ]),
    ].filter(Boolean);

    const namesMap = {};
    if (likerIds.length > 0) {
      // جلب الطلاب بالـ ID
      const studentsQuery = query(
        collection(db, "students"),
        where("id", "in", likerIds.slice(0, 30)),
      );
      const snapStudents = await getDocs(studentsQuery);
      snapStudents.forEach((d) => {
        const sData = d.data();
        if (sData.id !== undefined) {
          namesMap[sData.id] = {
            name: sData.name || "طالب",
            profilePic: sData.profilePic || "",
            group: sData.group || "",
          };
        }
      });
    }

    const likes = likedBy
      .map((l) => ({
        likerId: l.likerId,
        likerName: namesMap[l.likerId]?.name || `طالب #${l.likerId}`,
        profilePic: namesMap[l.likerId]?.profilePic || "",
        group: namesMap[l.likerId]?.group || "",
        timestamp: l.timestamp,
      }))
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    const dislikes = dislikedBy
      .map((d) => ({
        dislikerId: d.dislikerId,
        dislikerName: namesMap[d.dislikerId]?.name || `طالب #${d.dislikerId}`,
        profilePic: namesMap[d.dislikerId]?.profilePic || "",
        group: namesMap[d.dislikerId]?.group || "",
        timestamp: d.timestamp,
      }))
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    return { likes, dislikes };
  } catch (err) {
    console.error("Error fetching reactions details:", err);
    return { likes: [], dislikes: [] };
  }
}

// ────────────────────────────────────────────────
// 3. صناديق المفاجآت الغامضة (Mystery Loot Boxes)
// ────────────────────────────────────────────────

/**
 * فتح صندوق حظ عشوائي
 */
export async function openLootBox({ studentDocId, studentName, boxConfig }) {
  if (!boxConfig || !boxConfig.prizes || boxConfig.prizes.length === 0) {
    throw new Error("بيانات الصندوق غير مكتملة");
  }

  const studentRef = doc(db, "students", studentDocId);

  // اختيار الجائزة عشوائياً وفق الأوزان
  const totalWeight = boxConfig.prizes.reduce(
    (sum, p) => sum + (Number(p.weight) || 1),
    0,
  );
  let random = Math.random() * totalWeight;
  let wonPrize = boxConfig.prizes[0];

  for (const prize of boxConfig.prizes) {
    random -= Number(prize.weight) || 1;
    if (random <= 0) {
      wonPrize = prize;
      break;
    }
  }

  const cost = Number(boxConfig.cost) || 0;

  return runTransaction(db, async (transaction) => {
    const studentSnap = await transaction.get(studentRef);
    if (!studentSnap.exists()) throw new Error("الطالب غير موجود");

    const currentScore = Number(studentSnap.data().score) || 0;
    if (currentScore < cost) {
      throw new Error(
        `رصيد نقاطك غير كافٍ. تحتاج إلى ${cost} نقطة، ورصيدك الحالي ${currentScore} نقطة.`,
      );
    }

    const updates = {
      score: increment(-cost),
    };

    // تطبيق الجائزة المكتسبة
    if (wonPrize.type === "points") {
      updates.score = increment(-cost + (Number(wonPrize.value) || 0));
    } else if (wonPrize.type === "reserve") {
      updates.reserveAttendance = increment(Number(wonPrize.value) || 1);
    } else if (wonPrize.type === "blue_card") {
      updates.blueCards = increment(Number(wonPrize.value) || 1);
    } else if (wonPrize.type === "green_card") {
      updates.greenCards = increment(Number(wonPrize.value) || 1);
    } else if (wonPrize.type === "border") {
      updates.unlockedBorders = arrayUnion(wonPrize.value);
      updates.activeBorder = wonPrize.value;
    } else if (wonPrize.type === "badge") {
      updates.unlockedBadges = arrayUnion(wonPrize.value);
    }

    transaction.update(studentRef, updates);

    // تسجيل في سجل الأنشطة
    const activityRef = doc(collection(db, "gamificationActivity"));
    transaction.set(activityRef, {
      type: "loot_box_opened",
      studentId: studentDocId,
      studentName: studentName || "طالب",
      boxId: boxConfig.id,
      boxName: boxConfig.name,
      boxCost: cost,
      prizeLabel: wonPrize.label,
      prizeType: wonPrize.type,
      prizeValue: wonPrize.value ?? null,
      prizeIcon: wonPrize.icon || "🎁",
      createdAt: serverTimestamp(),
    });

    return { wonPrize, cost };
  });
}

// ────────────────────────────────────────────────
// 4. طلب مراجعة التاسك (Task Review Request)
// ────────────────────────────────────────────────

/**
 * طلب مراجعة المهمة لمرة واحدة بالنقاط
 * - خصم 10 نقاط
 * - تصفير الدرجة إلى 0 وتحويل الحالة إلى "جاري المراجعة"
 * - وسم المهمة لمنع تكرار الطلب لنفس التاسك
 */
export async function requestTaskReview({
  studentDocId,
  studentId,
  studentName,
  taskId,
  taskIndex,
  taskName,
  cost = 10,
}) {
  const studentRef = doc(db, "students", studentDocId);

  return runTransaction(db, async (transaction) => {
    const studentSnap = await transaction.get(studentRef);
    if (!studentSnap.exists())
      throw new Error("الطالب غير موجود في قاعدة البيانات");

    const data = studentSnap.data();
    const currentScore = Number(data.score) || 0;
    const requiredCost =
      Number(cost) && Number(cost) !== 40 ? Number(cost) : 10;

    if (currentScore < requiredCost) {
      throw new Error(
        `رصيد نقاطك غير كافٍ. تحتاج إلى ${requiredCost} نقاط لطلب مراجعة التاسك، ورصيدك الحالي ${currentScore} نقطة.`,
      );
    }

    const tasks = Array.isArray(data.tasks) ? [...data.tasks] : [];

    // البحث عن المهمة بدقة عبر ID أو الاسم أو الـ Index
    let targetIndex = -1;
    if (taskId !== undefined && taskId !== null) {
      targetIndex = tasks.findIndex((t) => String(t.id) === String(taskId));
    }
    if (targetIndex === -1 && taskName) {
      targetIndex = tasks.findIndex(
        (t) => t.name === taskName || t.title === taskName,
      );
    }
    if (targetIndex === -1 && taskIndex !== undefined && tasks[taskIndex]) {
      targetIndex = taskIndex;
    }

    if (targetIndex === -1 || !tasks[targetIndex]) {
      throw new Error("لم يتم العثور على المهمة المحددة");
    }

    const targetTask = { ...tasks[targetIndex] };
    const currentAttempts =
      Number(targetTask.reviewCount || targetTask.resubmitCount) || 0;

    if (targetTask.reviewRequested === true || currentAttempts >= 1) {
      throw new Error(
        "لقد قمت بطلب مراجعة هذه المهمة مسبقاً، الحد الأقصى هو مرة واحدة فقط لكل مهمة.",
      );
    }

    const previousScore =
      targetTask.score !== undefined && targetTask.score !== null
        ? Number(targetTask.score)
        : 0;

    // 1. تصفير الدرجة وتحويل الحالة إلى جاري المراجعة فوراً
    targetTask.score = 0;
    targetTask.isGraded = false;
    targetTask.reviewRequested = true;
    targetTask.reviewCount = currentAttempts + 1;
    targetTask.resubmitCount = currentAttempts + 1;
    targetTask.previousScore = previousScore;
    targetTask.reviewRequestedAt = new Date().toISOString();

    tasks[targetIndex] = targetTask;

    // 2. خصم النقاط وتحديث مصفوفة المهام
    transaction.update(studentRef, {
      score: increment(-requiredCost),
      tasks,
    });

    // 3. تسجيل العملية في سجل أنشطة التلعيب
    const activityRef = doc(collection(db, "gamificationActivity"));
    transaction.set(activityRef, {
      type: "task_review_request",
      studentId: studentDocId,
      studentNumericId: studentId || "",
      studentName: studentName || data.name || "طالب",
      taskName:
        taskName || targetTask.name || targetTask.title || "مهمة تدريبية",
      taskId: targetTask.id ?? null,
      taskIndex: targetIndex,
      cost: requiredCost,
      previousScore,
      createdAt: serverTimestamp(),
    });

    return { success: true, updatedTask: targetTask };
  });
}

// التوافق مع أي استدعاءات قديمة
export const requestTaskResubmission = requestTaskReview;
