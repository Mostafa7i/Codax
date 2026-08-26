"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { rtdb } from "@/app/services/firebaseConfig";
import { ref, onValue, set, serverTimestamp, onDisconnect, remove } from "firebase/database";
import { v4 as uuidv4 } from 'uuid';

// دالة للحصول على معلومات الجهاز والمتصفح
const getDeviceInfo = () => {
  if (typeof window === "undefined") {
    return { deviceType: "Desktop", browser: "Unknown", os: "Unknown" };
  }
  const ua = navigator.userAgent;
  let deviceType = 'Desktop';
  let browser = 'Unknown';
  let os = 'Unknown';

  // تحديد نوع الجهاز
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    deviceType = 'Tablet';
  } else if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) {
    deviceType = 'Mobile';
  }

  // تحديد المتصفح
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  else if (ua.includes('Opera')) browser = 'Opera';

  // تحديد نظام التشغيل
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS')) os = 'iOS';

  return { deviceType, browser, os };
};

// دالة للحصول على أو إنشاء معرف فريد للزائر
const getVisitorId = () => {
  if (typeof window === "undefined") return "server-visitor";
  let visitorId = sessionStorage.getItem('visitorId');
  if (!visitorId) {
    visitorId = uuidv4();
    sessionStorage.setItem('visitorId', visitorId);
  }
  return visitorId;
};

// دالة لتنسيق الوقت
const formatTime = (timestamp) => {
  if (!timestamp) return 'غير محدد';
  const date = new Date(timestamp);
  return date.toLocaleString('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// دالة لحساب مدة الاتصال
const calculateConnectionDuration = (joinTime) => {
  if (!joinTime) return 'غير محدد';
  
  const now = Date.now();
  const duration = now - joinTime;
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}ساعة ${minutes % 60}دقيقة`;
  } else if (minutes > 0) {
    return `${minutes}دقيقة ${seconds % 60}ثانية`;
  } else {
    return `${seconds}ثانية`;
  }
};

const AdminDashboard = () => {
  const [onlineVisitorsCount, setOnlineVisitorsCount] = useState(0);
  const [activeVisitors, setActiveVisitors] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const visitorIdRef = useRef(getVisitorId());
  const heartbeatIntervalRef = useRef(null);
  const connectionCheckRef = useRef(null);
  const cleanupTimeoutRef = useRef(null);

  // دالة تنظيف الزوار غير النشطين
  const cleanupInactiveVisitors = useCallback(async () => {
    try {
      const onlineVisitorsRef = ref(rtdb, "onlineVisitors");
      const snapshot = await new Promise((resolve, reject) => {
        onValue(onlineVisitorsRef, resolve, { onlyOnce: true });
        setTimeout(() => reject(new Error('Timeout')), 5000);
      });

      const visitorsData = snapshot.val();
      if (!visitorsData) return;

      const now = Date.now();
      const inactiveThreshold = 2 * 60 * 1000; // 2 دقيقة

      // إزالة الزوار غير النشطين
      const promises = Object.entries(visitorsData).map(async ([visitorId, data]) => {
        const lastSeen = data.lastSeen || data.joinTime || 0;
        if (now - lastSeen > inactiveThreshold) {
          console.log(`إزالة زائر غير نشط: ${visitorId}`);
          await remove(ref(rtdb, `onlineVisitors/${visitorId}`));
        }
      });

      await Promise.all(promises);
    } catch (error) {
      console.error('خطأ في تنظيف الزوار غير النشطين:', error);
    }
  }, []);

  // دالة تحديث حالة الزائر
  const updateVisitorStatus = useCallback(async () => {
    try {
      const visitorId = visitorIdRef.current;
      const myVisitorRef = ref(rtdb, `onlineVisitors/${visitorId}`);
      const deviceInfo = getDeviceInfo();
      
      const visitorData = {
        online: true,
        lastSeen: Date.now(),
        joinTime: Date.now(),
        deviceInfo,
        page: window.location.pathname,
        userAgent: navigator.userAgent.substring(0, 100), // اقتطاع لتوفير المساحة
        ip: 'معرف الـ IP غير متاح', // يمكن الحصول عليه من خدمة خارجية
        sessionId: visitorId,
        timestamp: serverTimestamp()
      };

      await set(myVisitorRef, visitorData);
      
      // إعداد onDisconnect
      await onDisconnect(myVisitorRef).remove();
      
      setIsConnected(true);
      setConnectionError(null);
    } catch (error) {
      console.error('خطأ في تحديث حالة الزائر:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    }
  }, []);

  // دالة heartbeat لتحديث آخر نشاط
  const sendHeartbeat = useCallback(async () => {
    try {
      const visitorId = visitorIdRef.current;
      const heartbeatRef = ref(rtdb, `onlineVisitors/${visitorId}/lastSeen`);
      await set(heartbeatRef, Date.now());
    } catch (error) {
      console.error('خطأ في إرسال heartbeat:', error);
      setConnectionError(error.message);
    }
  }, []);

  // التأثير الرئيسي لإدارة حالة الزائر
  useEffect(() => {
    let mounted = true;
    
    const initializeVisitor = async () => {
      if (!mounted) return;
      
      // تحديث حالة الزائر
      await updateVisitorStatus();
      
      // بدء heartbeat كل 15 ثانية
      heartbeatIntervalRef.current = setInterval(() => {
        if (mounted) sendHeartbeat();
      }, 15000);

      // تنظيف الزوار غير النشطين كل دقيقة
      cleanupTimeoutRef.current = setInterval(() => {
        if (mounted) cleanupInactiveVisitors();
      }, 60000);

      // فحص الاتصال كل 30 ثانية
      connectionCheckRef.current = setInterval(() => {
        if (mounted && !isConnected) {
          updateVisitorStatus();
        }
      }, 30000);
    };

    initializeVisitor();

    return () => {
      mounted = false;
      
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (cleanupTimeoutRef.current) {
        clearInterval(cleanupTimeoutRef.current);
      }
      if (connectionCheckRef.current) {
        clearInterval(connectionCheckRef.current);
      }
    };
  }, [updateVisitorStatus, sendHeartbeat, cleanupInactiveVisitors, isConnected]);

  // الاستماع لتغييرات الزوار النشطين
  useEffect(() => {
    const onlineVisitorsRef = ref(rtdb, "onlineVisitors");
    
    const unsubscribe = onValue(
      onlineVisitorsRef, 
      (snapshot) => {
        try {
          const visitorsData = snapshot.val();
          setLastUpdate(new Date());
          
          if (visitorsData) {
            const visitorsList = Object.entries(visitorsData)
              .map(([key, data]) => ({
                id: key,
                ...data,
                connectionDuration: calculateConnectionDuration(data.joinTime)
              }))
              .sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0)); // ترتيب حسب آخر نشاط

            setActiveVisitors(visitorsList);
            setOnlineVisitorsCount(visitorsList.length);
          } else {
            setActiveVisitors([]);
            setOnlineVisitorsCount(0);
          }
        } catch (error) {
          console.error('خطأ في معالجة بيانات الزوار:', error);
          setConnectionError(error.message);
        }
      },
      (error) => {
        console.error('خطأ في الاستماع للزوار:', error);
        setConnectionError(error.message);
        setIsConnected(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // معالج إغلاق الصفحة
  useEffect(() => {
    const handleBeforeUnload = async () => {
      try {
        const visitorId = visitorIdRef.current;
        const myVisitorRef = ref(rtdb, `onlineVisitors/${visitorId}`);
        await remove(myVisitorRef);
      } catch (error) {
        console.error('خطأ في إزالة الزائر عند الإغلاق:', error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // الصفحة مخفية - توقف عن إرسال heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
      } else {
        // الصفحة ظاهرة - استكمل heartbeat
        sendHeartbeat();
        heartbeatIntervalRef.current = setInterval(sendHeartbeat, 15000);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sendHeartbeat]);

  return (
    <div className="p-2  my-10 text-xs bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b p-4 mb-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-gray-800 dark:text-white">
              لوحة التحكم - الزوار المتصلون
            </h1>
            
            {/* مؤشر حالة الاتصال */}
            <div className="flex items-center space-x-3">
              <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} ${isConnected ? 'animate-pulse' : ''}`}></div>
                <span className="text-sm font-medium">
                  {isConnected ? 'متصل' : 'غير متصل'}
                </span>
              </div>
              
              {lastUpdate && (
                <span className="text-xs text-gray-500">
                  آخر تحديث: {formatTime(lastUpdate)}
                </span>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* رسالة الخطأ */}
      {connectionError && (
        <div className="container mx-auto mb-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-2 py-3 rounded">
            <strong>خطأ في الاتصال:</strong> {connectionError}
          </div>
        </div>
      )}

      {/* إحصائيات سريعة */}
      <div className="container mx-auto mb-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
              الزوار النشطون
            </h3>
            <div className="text-2xl font-bold text-green-600">
              {onlineVisitorsCount}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
              أجهزة محمولة
            </h3>
            <div className="text-2xl font-bold text-blue-600">
              {activeVisitors.filter(v => v.deviceInfo?.deviceType === 'Mobile').length}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
              أجهزة سطح المكتب
            </h3>
            <div className="text-2xl font-bold text-purple-600">
              {activeVisitors.filter(v => v.deviceInfo?.deviceType === 'Desktop').length}
            </div>
          </div>
        </div>
      </div>

      {/* تفاصيل الزوار */}
      <div className="container mx-auto px-2">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xs font-semibold text-gray-800 dark:text-white">
              تفاصيل الزوار النشطين ({onlineVisitorsCount})
            </h2>
          </div>

          <div className="overflow-x-auto">
            {activeVisitors.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      معرف الجلسة
                    </th>
                    <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      الجهاز
                    </th>
                    <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      المتصفح
                    </th>
                    <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      آخر نشاط
                    </th>
                    <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      مدة الاتصال
                    </th>
                    <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      الصفحة
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {activeVisitors.map((visitor, index) => (
                    <tr key={visitor.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                      <td className="px-2 py-3">
                        <div className="text-sm font-mono text-gray-900 dark:text-gray-100">
                          {visitor.id.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {visitor.deviceInfo?.deviceType || 'غير محدد'}
                          </span>
                          <span className="mr-2 text-xs text-gray-500">
                            ({visitor.deviceInfo?.os})
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {visitor.deviceInfo?.browser || 'غير محدد'}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {formatTime(visitor.lastSeen)}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {visitor.connectionDuration}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {visitor.page || '/'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <div className="text-6xl mb-4">👥</div>
                <p className="text-lg">لا يوجد زوار نشطون حاليًا</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AdminDashboard);