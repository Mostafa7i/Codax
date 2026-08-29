"use client";
import React, { useEffect, useRef } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig";
import { checkAndNotifyRankChanges } from "@/app/services/rankingService";

/**
 * RankingsWatcher:
 * يستمع لحظياً للتعديلات على الطلاب في Firestore
 * وعند حدوث أي تغيير في الدرجات أو النقاط، يقوم بحساب الترتيب الجديد
 * وإرسال الإشعار للمجموعة بدون تعقيد
 */
export default function RankingsWatcher() {
  const isFirstLoadRef = useRef(true);
  const debounceTimerRef = useRef({});
  const isProcessingRef = useRef({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    let unsubscribe = null;

    try {
      const studentsRef = collection(db, "students");
      const q = query(studentsRef);

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const allStudentsByGroup = new Map();

          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            const groupName = data?.group ? String(data.group).trim() : null;
            if (groupName) {
              if (!allStudentsByGroup.has(groupName)) {
                allStudentsByGroup.set(groupName, []);
              }
              allStudentsByGroup.get(groupName).push({
                id:
                  data.id !== undefined && data.id !== null
                    ? data.id
                    : docSnap.id,
                docId: docSnap.id,
                ...data,
              });
            }
          });

          // أول تحميل: حفظ الترتيب الأولي كمرجع أساسي بهدوء
          if (isFirstLoadRef.current) {
            isFirstLoadRef.current = false;
            allStudentsByGroup.forEach((groupStudents, groupName) => {
              checkAndNotifyRankChanges(
                groupName,
                groupStudents,
                null,
                true,
              ).catch((err) =>
                console.warn(
                  `[RankingsWatcher] Baseline sync for ${groupName}:`,
                  err,
                ),
              );
            });
            return;
          }

          // عند تعديل أي طالب
          const affectedGroups = new Set();
          snapshot.docChanges().forEach((change) => {
            if (change.type === "modified" || change.type === "added") {
              const group = change.doc.data()?.group;
              if (group) affectedGroups.add(String(group).trim());
            }
          });

          affectedGroups.forEach((groupName) => {
            if (isProcessingRef.current[groupName]) return;

            if (debounceTimerRef.current[groupName]) {
              clearTimeout(debounceTimerRef.current[groupName]);
            }

            debounceTimerRef.current[groupName] = setTimeout(async () => {
              const studentsOfGroup = allStudentsByGroup.get(groupName) || [];
              if (studentsOfGroup.length === 0) return;

              isProcessingRef.current[groupName] = true;
              try {
                const res = await checkAndNotifyRankChanges(
                  groupName,
                  studentsOfGroup,
                  null,
                  false,
                );
                console.log(`[RankingsWatcher] Result for ${groupName}:`, res.status);
              } catch (err) {
                console.error(
                  `[RankingsWatcher] Error checking ranks for ${groupName}:`,
                  err,
                );
              } finally {
                isProcessingRef.current[groupName] = false;
              }
            }, 1500);
          });
        },
        (error) => {
          console.warn("[RankingsWatcher] onSnapshot warning:", error);
        },
      );
    } catch (err) {
      console.error("[RankingsWatcher] Setup error:", err);
    }

    return () => {
      if (unsubscribe) unsubscribe();
      Object.values(debounceTimerRef.current).forEach((timer) =>
        clearTimeout(timer),
      );
    };
  }, []);

  return null;
}
