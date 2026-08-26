"use client";
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from "react";

const InternetStatusContext = createContext(null);

export const InternetStatusProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionQuality, setConnectionQuality] = useState("good"); // 'good' | 'moderate' | 'poor' | 'offline'
  const [lastOnlineTime, setLastOnlineTime] = useState(() => Date.now());
  const [reconnectionAttempts, setReconnectionAttempts] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showReconnectedBanner, setShowReconnectedBanner] = useState(false);

  const reconnectionTimerRef = useRef(null);
  const connectionTestRef = useRef(null);
  const bannerTimerRef = useRef(null);
  const maxReconnectionAttempts = 5;

  // فحص جودة الاتصال
  const checkConnectionQuality = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOnline(false);
      setConnectionQuality("offline");
      return false;
    }

    try {
      const startTime = performance.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(`/favicon.png?_ping=${Date.now()}`, {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      setIsOnline(true);
      if (responseTime < 500) {
        setConnectionQuality("good");
      } else if (responseTime < 2000) {
        setConnectionQuality("moderate");
      } else {
        setConnectionQuality("poor");
      }

      return true;
    } catch {
      // إذا فشل البينج ولكن المتصفح متصل لا نوقف الموقع بل نعتبر الإشارة ضعيفة
      if (typeof navigator !== "undefined" && navigator.onLine) {
        setIsOnline(true);
        setConnectionQuality("poor");
        return true;
      }
      setIsOnline(false);
      setConnectionQuality("offline");
      return false;
    }
  }, []);

  // معالج استعادة الاتصال
  const handleOnline = useCallback(async () => {
    setIsReconnecting(true);

    const isReallyOnline = await checkConnectionQuality();

    if (isReallyOnline) {
      setIsOnline(true);
      setLastOnlineTime(Date.now());
      setReconnectionAttempts(0);
      setIsReconnecting(false);

      setShowReconnectedBanner(true);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = setTimeout(() => {
        setShowReconnectedBanner(false);
      }, 4000);
    } else {
      setReconnectionAttempts((prev) => prev + 1);
      if (reconnectionAttempts < maxReconnectionAttempts) {
        if (reconnectionTimerRef.current) clearTimeout(reconnectionTimerRef.current);
        const delay = Math.min(1000 * Math.pow(1.5, reconnectionAttempts), 15000);
        reconnectionTimerRef.current = setTimeout(() => {
          handleOnline();
        }, delay);
      } else {
        setIsReconnecting(false);
      }
    }
  }, [checkConnectionQuality, reconnectionAttempts]);

  // معالج انقطاع الاتصال
  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setConnectionQuality("offline");
    setIsReconnecting(false);
    setShowReconnectedBanner(false);

    if (reconnectionTimerRef.current) {
      clearTimeout(reconnectionTimerRef.current);
    }
  }, []);

  // إعادة محاولة الاتصال يدوياً
  const retryConnection = useCallback(async () => {
    setIsReconnecting(true);
    setReconnectionAttempts(0);

    const isConnected = await checkConnectionQuality();

    if (isConnected) {
      setIsOnline(true);
      setLastOnlineTime(Date.now());
      setIsReconnecting(false);
      setShowReconnectedBanner(true);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = setTimeout(() => {
        setShowReconnectedBanner(false);
      }, 4000);
    } else {
      setIsReconnecting(false);
    }
  }, [checkConnectionQuality]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // المزامنة مع حالة المتصفح المبدئية
    setIsOnline(navigator.onLine);

    // فحص دوري كل 20 ثانية
    connectionTestRef.current = setInterval(() => {
      if (navigator.onLine) {
        checkConnectionQuality();
      }
    }, 20000);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (reconnectionTimerRef.current) clearTimeout(reconnectionTimerRef.current);
      if (connectionTestRef.current) clearInterval(connectionTestRef.current);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, [handleOnline, handleOffline, checkConnectionQuality]);

  const value = {
    isOnline,
    connectionQuality,
    isReconnecting,
    reconnectionAttempts,
    maxReconnectionAttempts,
    retryConnection,
    lastOnlineTime,
    showReconnectedBanner,
    setShowReconnectedBanner,
  };

  return (
    <InternetStatusContext.Provider value={value}>
      {children}
    </InternetStatusContext.Provider>
  );
};

export const useInternetStatus = () => {
  const context = useContext(InternetStatusContext);
  if (!context) {
    throw new Error("useInternetStatus must be used within an InternetStatusProvider");
  }
  return context;
};

export default InternetStatusContext;
