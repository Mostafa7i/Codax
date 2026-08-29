import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { getTopStudents } from "../components/calculations.jsx";
import { fetchGroupSpecificTotalLectures } from "./groupService";

/**
 * تحويل رقم المركز إلى اسم عربي منسق
 */
export function getArabicRankName(rank) {
  const map = {
    1: "الأول 🥇",
    2: "الثاني 🥈",
    3: "الثالث 🥉",
    4: "الرابع",
    5: "الخامس",
    6: "السادس",
    7: "السابع",
    8: "الثامن",
    9: "التاسع",
    10: "العاشر",
    11: "الحادي عشر",
    12: "الثاني عشر",
    13: "الثالث عشر",
    14: "الرابع عشر",
    15: "الخامس عشر",
    16: "السادس عشر",
    17: "السابع عشر",
    18: "الثامن عشر",
    19: "التاسع عشر",
    20: "العشرون",
  };
  return map[rank] ? `المركز ${map[rank]}` : `المركز (${rank})`;
}

/**
 * مطابقة الطالب مع سجله السابق في قاعدة البيانات
 */
export function findPreviousRank(student, prevRanks) {
  if (!Array.isArray(prevRanks) || prevRanks.length === 0) return null;

  const sId =
    student.id !== undefined && student.id !== null && student.id !== ""
      ? String(student.id).trim()
      : null;
  const sDocId = student.docId ? String(student.docId).trim() : null;
  const sName = student.name ? String(student.name).trim().toLowerCase() : null;

  const match = prevRanks.find((r) => {
    const rId =
      r.id !== undefined && r.id !== null && r.id !== ""
        ? String(r.id).trim()
        : r.studentId !== undefined &&
            r.studentId !== null &&
            r.studentId !== ""
          ? String(r.studentId).trim()
          : null;
    const rDocId = r.docId ? String(r.docId).trim() : null;
    const rName = r.name ? String(r.name).trim().toLowerCase() : null;

    if (sDocId && rDocId && sDocId === rDocId) return true;
    if (sId && rId && sId === rId) return true;
    if (sName && rName && sName === rName) return true;

    return false;
  });

  return match && typeof match.rank === "number" ? match.rank : null;
}

/**
 * جلب الترتيب المخزن سابقاً لمجموعة من Firestore
 */
export async function getStoredGroupRankings(groupName) {
  if (!groupName) return null;
  try {
    const docRef = doc(db, "groupRankings", groupName);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    console.error(`Error fetching stored rankings for ${groupName}:`, error);
    return null;
  }
}

/**
 * حفظ الترتيب الحالي لمجموعة في Firestore
 */
export async function saveGroupRankings(groupName, rankedStudents) {
  if (!groupName || !Array.isArray(rankedStudents)) return;

  const sanitizedRanks = rankedStudents.map((s) => ({
    studentId: s.id ?? null,
    docId: s.docId ?? null,
    name: s.name || "طالب",
    rank: s.rank,
    combinedScore: s.combinedScore ?? 0,
    extraPoints: s.extraPoints ?? s.score ?? 0,
    taskPercentage: s.taskPercentage ?? null,
    attendancePercentage: s.attendancePercentage ?? 0,
  }));

  try {
    const docRef = doc(db, "groupRankings", groupName);
    await setDoc(
      docRef,
      {
        groupName,
        updatedAt: new Date().toISOString(),
        ranks: sanitizedRanks,
        totalStudents: sanitizedRanks.length,
      },
      { merge: true },
    );
  } catch (error) {
    console.error(`Error saving rankings for ${groupName}:`, error);
  }
}

/**
 * حساب الترتيب الحالي للطلاب في المجموعة
 */
export async function calculateCurrentGroupRankings(
  groupName,
  studentsData = null,
  totalLectures = null,
) {
  if (!groupName) return [];

  let students = studentsData;
  if (!students) {
    const q = query(
      collection(db, "students"),
      where("group", "==", groupName),
    );
    const snap = await getDocs(q);
    students = snap.docs.map((d) => ({
      docId: d.id,
      ...d.data(),
    }));
  }

  if (!students || students.length === 0) return [];

  let lecturesCount = totalLectures;
  if (lecturesCount === null || lecturesCount === undefined) {
    lecturesCount = await fetchGroupSpecificTotalLectures(groupName);
  }

  return getTopStudents(students, lecturesCount, "combined");
}

/**
 * صياغة نص الإشعار الاحترافي بالعربية عند تغير الترتيب
 */
export function formatRankChangeNotification(
  groupName,
  promotions = [],
  demotions = [],
) {
  const lines = [`🏆 تحديث جديد في ترتيب أوائل مجموعة ${groupName}!`, ""];

  if (promotions.length > 0) {
    lines.push("🚀 الطلاب المتقدمين في المراكز:");
    promotions.forEach((p) => {
      const oldRankText = getArabicRankName(p.oldRank);
      const newRankText = getArabicRankName(p.newRank);
      const diffText = p.diff > 0 ? `(+${p.diff})` : "";
      lines.push(
        `🟢 ⬆️ ${diffText} ${p.name} ➔ ${newRankText} (سابقاً ${oldRankText})`,
      );
    });
    lines.push("");
  }

  if (demotions.length > 0) {
    lines.push("⚠️ الطلاب المتراجعين في المراكز:");
    demotions.forEach((d) => {
      const oldRankText = getArabicRankName(d.oldRank);
      const newRankText = getArabicRankName(d.newRank);
      const diffText = d.diff > 0 ? `(-${d.diff})` : "";
      lines.push(
        `🔴 ⬇️ ${diffText} ${d.name} ➔ ${newRankText} (سابقاً ${oldRankText})`,
      );
    });
    lines.push("");
  }

  lines.push("واصلوا التألق والمنافسة! 💪✨");

  return lines.join("\n");
}

// ذاكرة مؤقتة محلية لمنع تكرار نفس الإشعار خلال ثوانٍ معدودة
const recentNotificationsCache = new Map();

/**
 * فحص وتوثيق أي تغير في الترتيب وإرسال الإشعار للمجموعة وحفظ الترتيب الجديد
 */
export async function checkAndNotifyRankChanges(
  groupName,
  currentStudents = null,
  totalLectures = null,
  isInitialSave = false,
) {
  if (!groupName) return { status: "no_group" };

  try {
    // 1. حساب الترتيب الحالي
    const newRankedStudents = await calculateCurrentGroupRankings(
      groupName,
      currentStudents,
      totalLectures,
    );

    if (!newRankedStudents || newRankedStudents.length === 0) {
      return { status: "no_students" };
    }

    // 2. إذا كان أول تحميل: حفظ الترتيب الأولي كمرجع أساسي بهدوء
    if (isInitialSave) {
      await saveGroupRankings(groupName, newRankedStudents);
      return {
        status: "initialized",
        message: `تم حفظ ترتيب طلاب مجموعة ${groupName} الحالي كمرجع أساسي.`,
        ranksCount: newRankedStudents.length,
      };
    }

    // 3. جلب الترتيب السابق المخزن
    const storedData = await getStoredGroupRankings(groupName);

    if (
      !storedData ||
      !Array.isArray(storedData.ranks) ||
      storedData.ranks.length === 0
    ) {
      await saveGroupRankings(groupName, newRankedStudents);
      return {
        status: "initialized",
        ranksCount: newRankedStudents.length,
      };
    }

    // 4. مقارنة كل طالب واكتشاف الصعود والهبوط
    const promotions = [];
    const demotions = [];

    newRankedStudents.forEach((student) => {
      const oldRank = findPreviousRank(student, storedData.ranks);
      if (oldRank !== null && typeof oldRank === "number") {
        if (student.rank < oldRank) {
          promotions.push({
            name: student.name,
            id: student.id,
            docId: student.docId,
            oldRank,
            newRank: student.rank,
            diff: oldRank - student.rank,
          });
        } else if (student.rank > oldRank) {
          demotions.push({
            name: student.name,
            id: student.id,
            docId: student.docId,
            oldRank,
            newRank: student.rank,
            diff: student.rank - oldRank,
          });
        }
      }
    });

    // 5. إذا وُجد تغيير فعلي في المراكز:
    if (promotions.length > 0 || demotions.length > 0) {
      promotions.sort((a, b) => a.newRank - b.newRank);
      demotions.sort((a, b) => a.newRank - b.newRank);

      const notifMessage = formatRankChangeNotification(
        groupName,
        promotions,
        demotions,
      );
      const notifTitle = `🏆 تحديث جديد في ترتيب أوائل مجموعة ${groupName}`;

      // بصمة التغيير لمنع التكرار
      const pStr = promotions
        .map((p) => `${p.id || p.docId}:${p.oldRank}->${p.newRank}`)
        .sort()
        .join("|");
      const dStr = demotions
        .map((d) => `${d.id || d.docId}:${d.oldRank}->${d.newRank}`)
        .sort()
        .join("|");
      const changeSignature = `${groupName}__P[${pStr}]__D[${dStr}]`;
      const now = Date.now();

      // فحص الكاش المحلي (إذا نفس الإشعار أُرسل خلال آخر دقيقة نتجاهل)
      const lastSentTime = recentNotificationsCache.get(changeSignature) || 0;
      if (now - lastSentTime < 60000) {
        console.log(`[rankingService] Duplicate skipped via local cache for ${groupName}`);
        await saveGroupRankings(groupName, newRankedStudents);
        return { status: "skipped_duplicate" };
      }

      // تسجيل البصمة فوراً في الكاش وحفظ الترتيب
      recentNotificationsCache.set(changeSignature, now);
      await saveGroupRankings(groupName, newRankedStudents);

      // إرسال الإشعار لـ notificationsGroups
      await addDoc(collection(db, "notificationsGroups"), {
        title: notifTitle,
        message: notifMessage,
        group: groupName,
        type: "rank",
        createdAt: serverTimestamp(),
        createdAtMs: now,
        signature: changeSignature,
        read: false,
      });

      console.log(`✅ Rank notification sent for group ${groupName}`);

      return {
        status: "updated_and_notified",
        promotions,
        demotions,
        message: notifMessage,
        ranksCount: newRankedStudents.length,
      };
    }

    // لم تتغير المراكز لكن نحدث الترتيب المخزن
    await saveGroupRankings(groupName, newRankedStudents);
    return {
      status: "no_rank_changes",
      ranksCount: newRankedStudents.length,
    };
  } catch (error) {
    console.error(`Error checking rank changes for group ${groupName}:`, error);
    return {
      status: "error",
      error: error.message,
    };
  }
}

/**
 * مزامنة جميع المجموعات
 */
export async function syncAllGroupsRankings(
  groupNames = null,
  forceSave = false,
) {
  let groups = groupNames;
  if (!groups || groups.length === 0) {
    const snap = await getDocs(collection(db, "students"));
    const set = new Set();
    snap.docs.forEach((d) => {
      const g = d.data().group;
      if (g) set.add(g);
    });
    groups = Array.from(set);
  }

  const results = {};
  for (const group of groups) {
    results[group] = await checkAndNotifyRankChanges(
      group,
      null,
      null,
      forceSave,
    );
  }

  return results;
}
