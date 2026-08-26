'use client';
import React, { createContext, useState, useEffect, useContext } from "react";
import { db } from "../services/firebaseConfig";
import { collection, getDocs, onSnapshot, doc, getDoc } from "firebase/firestore";

export const GroupContext = createContext();

export const useGroupContext = () => {
  const context = useContext(GroupContext);
  if (!context) {
    // قيمة افتراضية آمنة في حالة استخدام الـ Hook خارج المزود
    return { 
      groups: [], 
      selectedGroup: null, 
      setSelectedGroup: () => {}, 
      isLoadingGroups: true,
      groupStatuses: {},
      availableGroups: [],
      groupLectures: {},
      setGroupLectures: () => {}
    };
  }
  return context;
};

export const GroupContextProvider = ({ children }) => {
  const [groups, setGroups] = useState([]);
  const [groupStatuses, setGroupStatuses] = useState({});
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [groupLectures, setGroupLectures] = useState({});

  const [selectedGroup, setSelectedGroup] = useState(null);

  // استعادة المجموعة المحددة من localStorage بعد التحميل على العميل (لتفادي Hydration Mismatch)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem('selectedGroup');
      if (saved) {
        setSelectedGroup(saved);
      }
    }
  }, []);

  // onSnapshot لجلب المحاضرات
  useEffect(() => {
    try {
      const lecturesRef = doc(db, "lectures", "groups");
      const unsubscribe = onSnapshot(lecturesRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setGroupLectures(data);
          setAvailableGroups(Object.keys(data));
        } else {
          console.warn("Document 'groups' not found in 'lectures' collection");
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.error("Error subscribing to lectures:", e);
    }
  }, []);

  // useEffect لجلب المجموعات وحالاتها
  useEffect(() => {
    const fetchGroupsAndStatuses = async () => {
      setIsLoadingGroups(true);
      try {
        // جلب المجموعات من الطلاب
        const studentsSnapshot = await getDocs(collection(db, "students"));
        const groupsSet = new Set();
        studentsSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data?.group) groupsSet.add(String(data.group).trim());
        });
        const uniqueGroups = Array.from(groupsSet).sort((a, b) => {
          const numA = parseInt(a, 10);
          const numB = parseInt(b, 10);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return String(a).localeCompare(String(b), undefined, { numeric: true });
        });
        setGroups(uniqueGroups);

        const savedGroup = typeof window !== "undefined" ? localStorage.getItem('selectedGroup') : null;

        if (!savedGroup && uniqueGroups.length > 0) {
          setSelectedGroup(uniqueGroups[0]);
          if (typeof window !== "undefined") {
            localStorage.setItem('selectedGroup', uniqueGroups[0]);
          }
        } else if (savedGroup && !uniqueGroups.includes(savedGroup) && uniqueGroups.length > 0) {
          setSelectedGroup(uniqueGroups[0]);
          if (typeof window !== "undefined") {
            localStorage.setItem('selectedGroup', uniqueGroups[0]);
          }
        }

        // جلب حالات المجموعات
        const groupsDocSnap = await getDoc(doc(db, "lectures", "groups"));
        if (groupsDocSnap.exists()) {
          const data = groupsDocSnap.data();
          const statuses = {};
          Object.keys(data).forEach((groupName) => {
            statuses[groupName] = data[groupName]?.status ?? true;
          });
          setGroupStatuses(statuses);
        } else {
          setGroupStatuses({});
        }

      } catch (error) {
        console.error("❌ خطأ أثناء جلب المجموعات:", error.message);
      } finally {
        setIsLoadingGroups(false);
      }
    };

    fetchGroupsAndStatuses();
  }, []);

  const updateSelectedGroup = (group) => {
    if (typeof window !== "undefined") {
      if (group) {
        localStorage.setItem('selectedGroup', group);
      } else {
        localStorage.removeItem('selectedGroup');
      }
    }
    setSelectedGroup(group);
  };

  const contextValue = {
    groups,
    selectedGroup,
    setSelectedGroup: updateSelectedGroup,
    groupStatuses,
    isLoadingGroups,
    availableGroups,
    setGroupLectures,
    groupLectures
  };

  return (
    <GroupContext.Provider value={contextValue}>
      {children}
    </GroupContext.Provider>
  );
};

export default React.memo(GroupContextProvider);
