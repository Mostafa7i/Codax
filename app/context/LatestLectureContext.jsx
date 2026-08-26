"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebaseConfig";

const LatestLectureContext = createContext(null);

export const LatestLectureProvider = ({ children }) => {
  const [latestLectures, setLatestLectures] = useState({}); // كل المحاضرات
  const [selectedGroup, setSelectedGroup] = useState(null); // الجروب الحالي

  useEffect(() => {
    const docRef = doc(db, "lectures", "groups");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setLatestLectures(docSnap.data() || {});
      }
    });
    return () => unsubscribe();
  }, []);

  // المحاضرة الخاصة بالجروب الحالي
  const latestLectureForGroup =
    selectedGroup && latestLectures[selectedGroup]?.count
      ? latestLectures[selectedGroup].count
      : 0;

  return (
    <LatestLectureContext.Provider
      value={{
        latestLectures,
        selectedGroup,
        setSelectedGroup,
        latestLectureForGroup,
      }}
    >
      {children}
    </LatestLectureContext.Provider>
  );
};

export const useLatestLecture = () => {
  const context = useContext(LatestLectureContext);
  if (!context) {
    return {
      latestLectures: {},
      selectedGroup: null,
      setSelectedGroup: () => {},
      latestLectureForGroup: 0,
    };
  }
  return context;
};
