'use client';
import { createContext, useContext, useEffect, useState, useCallback } from "react";

const ThemeContext = createContext();

// تطبيق الثيم فوراً قبل أي شيء
const applyInitialTheme = () => {
  if (typeof window === "undefined") return;

  try {
    const savedDark = localStorage.getItem("dark");
    const shouldBeDark = savedDark === "active" || savedDark === null;

    const elements = [
      document.documentElement,
      document.getElementById("home"),
      document.getElementById("main"),
      document.body,
    ].filter(Boolean);

    elements.forEach((el) => {
      if (shouldBeDark) {
        el.classList.add("dark");
      } else {
        el.classList.remove("dark");
      }
    });

    // احفظ القيمة الافتراضية إذا كانت أول مرة
    if (savedDark === null) {
      localStorage.setItem("dark", "active");
      localStorage.setItem("isCodaxMode", "true");
    }
  } catch (error) {
    console.warn("Could not apply initial theme:", error);
  }
};

// نفّذ فورًا
applyInitialTheme();

export const ThemeProvider = ({ children }) => {
  const [isCodaxMode, setIsCodaxMode] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const saved = localStorage.getItem("isCodaxMode");
      return saved === "true" || saved === null;
    } catch {
      return true;
    }
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const saved = localStorage.getItem("dark");
      return saved === "active" || saved === null;
    } catch {
      return true;
    }
  });

  const applyTheme = useCallback((dark) => {
    const elements = [
      document.documentElement,
      document.getElementById("home"),
      document.getElementById("main"),
      document.body,
    ].filter(Boolean);

    elements.forEach((el) => {
      if (dark) {
        el.classList.add("dark");
      } else {
        el.classList.remove("dark");
      }
    });
  }, []);

  const toggleTheme = useCallback(() => {
    const newDarkMode = !isDarkMode;

    setIsDarkMode(newDarkMode);
    setIsCodaxMode(newDarkMode);
    applyTheme(newDarkMode);

    try {
      localStorage.setItem("dark", newDarkMode ? "active" : "inactive");
      localStorage.setItem("isCodaxMode", newDarkMode ? "true" : "false");
    } catch (error) {
      console.warn("Failed to save theme:", error);
    }
  }, [isDarkMode, applyTheme]);

  useEffect(() => {
    applyTheme(isDarkMode);
  }, [isDarkMode, applyTheme]);

  return (
    <ThemeContext.Provider
      value={{
        isCodaxMode,
        isDarkMode,
        toggleTheme,
        setIsDarkMode: (dark) => {
          setIsDarkMode(dark);
          setIsCodaxMode(dark);
          applyTheme(dark);
          try {
            localStorage.setItem("dark", dark ? "active" : "inactive");
            localStorage.setItem("isCodaxMode", dark ? "true" : "false");
          } catch (error) {
            console.warn("Failed to save theme:", error);
          }
        },
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};