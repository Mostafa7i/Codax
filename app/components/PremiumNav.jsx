"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronRight, ChevronLeft } from "lucide-react";

export default function PremiumNav({
  items = [],
  onSelect,
  activeIndex = 0,
  className = "",
}) {
  const scrollRef = useRef(null);
  const activeRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const [canScroll, setCanScroll] = useState(false);

  // Check scroll state
  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollWidth > el.clientWidth + 2;
    setCanScroll(hasOverflow);
    setShowLeft(el.scrollLeft > 8);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      ro.disconnect();
    };
  }, [checkScroll]);

  // Scroll to active tab whenever activeIndex changes
  useEffect(() => {
    const el = scrollRef.current;
    const active = activeRef.current;
    if (!el || !active) return;
    const containerLeft = el.getBoundingClientRect().left;
    const itemLeft = active.getBoundingClientRect().left;
    const itemWidth = active.offsetWidth;
    const containerWidth = el.clientWidth;
    const targetScroll =
      el.scrollLeft + itemLeft - containerLeft - containerWidth / 2 + itemWidth / 2;
    el.scrollTo({ left: targetScroll, behavior: "smooth" });
    setTimeout(checkScroll, 350);
  }, [activeIndex, checkScroll]);

  const scrollBy = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 120, behavior: "smooth" });
  };

  return (
    <div className={`relative flex flex-col items-center gap-2 ${className}`}>
      {/* Nav strip */}
      <div className="relative w-full max-w-[95vw] sm:max-w-xl">
        {/* Left gradient fade + arrow (RTL: left = next) */}
        <motion.div
          animate={{ opacity: showLeft ? 1 : 0, pointerEvents: showLeft ? "auto" : "none" }}
          transition={{ duration: 0.2 }}
          className="absolute right-0 top-0 bottom-0 z-10 flex items-center pr-1 bg-gradient-to-l from-white dark:from-slate-900 to-transparent"
        >
          <button
            onClick={() => scrollBy(-1)}
            className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all active:scale-90"
            aria-label="السابق"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Right gradient fade + arrow (RTL: right = prev) */}
        <motion.div
          animate={{ opacity: showRight ? 1 : 0, pointerEvents: showRight ? "auto" : "none" }}
          transition={{ duration: 0.2 }}
          className="absolute left-0 top-0 bottom-0 z-10 flex items-center pl-1 bg-gradient-to-r from-white dark:from-slate-900 to-transparent"
        >
          <button
            onClick={() => scrollBy(1)}
            className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all active:scale-90"
            aria-label="التالي"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Scrollable pill container */}
        <nav
          ref={scrollRef}
          className="relative flex items-center p-1.5 bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-indigo-500/5 overflow-x-auto"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
          dir="rtl"
        >
          <div className="flex items-center gap-1 min-w-max mx-auto">
            {items.map((item, index) => {
              const isActive = activeIndex === index;
              return (
                <button
                  key={item.to || index}
                  ref={isActive ? activeRef : null}
                  onClick={() => onSelect?.(item, index)}
                  type="button"
                  className={`relative flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 select-none outline-none whitespace-nowrap ${
                    isActive
                      ? "text-white shadow-md shadow-indigo-500/25"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/50"
                  }`}
                >
                  {/* Active pill background */}
                  {isActive && (
                    <motion.div
                      layoutId="premium-nav-active-pill"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 rounded-xl -z-0"
                    />
                  )}

                  <span className={`relative z-10 flex items-center gap-1.5 ${isActive ? "text-white" : ""}`}>
                    {item.icon && <span className="shrink-0">{item.icon}</span>}
                    <span className="tracking-wide">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          isActive
                            ? "bg-white/25 text-white"
                            : "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Dot indicators — only visible when overflow exists */}
      {canScroll && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1.5"
        >
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => onSelect?.(items[index], index)}
              className={`rounded-full transition-all duration-300 ${
                activeIndex === index
                  ? "w-4 h-1.5 bg-indigo-500"
                  : "w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 hover:bg-indigo-300 dark:hover:bg-indigo-700"
              }`}
              aria-label={items[index].label}
            />
          ))}
        </motion.div>
      )}


    </div>
  );
}
