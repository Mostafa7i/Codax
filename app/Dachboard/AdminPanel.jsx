"use client";
import React, { useState, useEffect } from 'react';
import { db } from '@/app/services/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import TopTaskStudentsManager from './TopTaskStudentsManager';
import TopTestStudentsManager from './TopTestStudentsManager';
import TasksManager from './TasksManager';
import { useGroupContext } from '@/app/context/GroupContextProvider';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const { groupStatuses } = useGroupContext();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const snap = await getDocs(collection(db, "students"));
        const groupSet = new Set();
        snap.docs.forEach(d => d.data().group && groupSet.add(d.data().group));
        const groupList = Array.from(groupSet);
        setGroups(groupList);
        if (groupList.length > 0) setSelectedGroup(groupList[0]);
      } catch (err) {
        console.error("Failed to fetch groups:", err);
      } finally {
        setIsLoadingGroups(false);
      }
    };
    fetchGroups();
  }, []);

  useEffect(() => {
    if (!groupStatuses) return;
    const activeGroups = Object.keys(groupStatuses).filter(
      (g) => groupStatuses[g] === true
    );
    if (activeGroups.length === 0) return;
    if (!selectedGroup) {
      setSelectedGroup(activeGroups[0]);
    }
  }, [groupStatuses]);

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold text-center mb-10 text-purple-600 font-sans">لوحة الإدارة</h1>
      <div className="mb-8">
        <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} className="w-full p-4 text-xl text-center border-2 border-purple-400 rounded-2xl bg-white dark:bg-gray-800 dark:text-white">
          {isLoadingGroups ? <option>جاري التحميل...</option> : groups.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <div className="tabs flex flex-wrap justify-center gap-3 mb-8 border-b-2 border-gray-300">
        {['tasks', 'topTaskStudents', 'topTestStudents'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 px-6  font-bold transition ${activeTab === tab ? 'text-purple-600 border-b-4 border-purple-600' : 'text-gray-500'}`}>
            {tab === 'tasks' ? 'المهام' : tab === 'topTaskStudents' ? 'أوائل التاسك' : 'أوائل الاختبار'}
          </button>
        ))}
      </div>
      <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl  shadow-xl p-6">
        {activeTab === 'tasks' && <TasksManager selectedGroup={selectedGroup} />}
        {activeTab === 'topTaskStudents' && <TopTaskStudentsManager selectedGroup={selectedGroup} />}
        {activeTab === 'topTestStudents' && <TopTestStudentsManager selectedGroup={selectedGroup} />}
      </div>
    </div>
  );
};

export default React.memo(AdminPanel);
