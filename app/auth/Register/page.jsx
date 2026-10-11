"use client";
import React, { useEffect, useRef, useState, Suspense } from "react";
import { db } from "../../services/firebaseConfig";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  User,
  Phone,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Check,
  Users,
  X,
  Search,
  ChevronDown,
  BriefcaseBusiness,
  GraduationCap,
  ArrowLeft,
  Pointer,
  MessageCircle,
  Home,
} from "lucide-react";
// import GlobalLoader from "../Component/GlobalLoader";
import { useRouter } from "next/navigation";
import Link from "next/link";

const Particles = React.lazy(() => import("@/app/components/Particles"));

// ─── Step indicator ───────────────────────────────────────────────
const steps = [
  { id: 1, label: "البيانات الشخصية", icon: User },
  { id: 2, label: "التراك والدراسة", icon: BookOpen },
  { id: 3, label: "بيانات الاتصال", icon: Phone },
];

const StepIndicator = ({ current }) => (
  <div className="flex items-center justify-center mb-8 gap-0">
    {steps.map((s, i) => {
      const Icon = s.icon;
      const done = current > s.id;
      const active = current === s.id;
      return (
        <React.Fragment key={s.id}>
          <div className="flex flex-col items-center">
            <motion.div
              animate={{
                scale: active ? 1.15 : 1,
                backgroundColor: done
                  ? "#10b981"
                  : active
                    ? "#6366f1"
                    : "#e5e7eb",
              }}
              transition={{ duration: 0.3 }}
              className="w-11 h-11 rounded-full flex items-center justify-center shadow-md"
            >
              {done ? (
                <Check className="w-5 h-5 text-white" />
              ) : (
                <Icon
                  className={`w-5 h-5 ${active ? "text-white" : "text-gray-400"}`}
                />
              )}
            </motion.div>
            <span
              className={`mt-1 text-xs font-bold ${active ? "text-indigo-600 dark:text-indigo-400" : done ? "text-emerald-600" : "text-gray-400"}`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <motion.div
              animate={{ backgroundColor: done ? "#10b981" : "#e5e7eb" }}
              transition={{ duration: 0.4 }}
              className="h-1 w-10 sm:w-16 mx-1 mt-[-18px] rounded-full"
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ─── Floating label input ─────────────────────────────────────────
const FloatInput = ({
  id,
  name,
  type = "text",
  label,
  value,
  onChange,
  error,
  dir = "rtl",
  maxLength,
  min,
  max,
}) => (
  <div className="relative w-full mt-6">
    <input
      type={type}
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      dir={dir}
      maxLength={maxLength}
      placeholder=" "
      min={min}
      max={max}
      className={`peer w-full border ${error ? "border-red-500 focus:ring-red-400" : "border-gray-300 dark:border-gray-600 focus:ring-indigo-400 focus:border-indigo-500"} rounded-xl bg-transparent pt-6 pb-2 px-4 text-base text-gray-800 dark:text-gray-100 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-opacity-40 transition-all duration-200`}
    />
    <label
      htmlFor={id}
      className={`absolute ${dir === "rtl" ? "right-4" : "left-4"} top-1 text-sm font-bold transition-all duration-200 ease-in-out peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-xs bg-white dark:bg-gray-900/0 px-2 rounded-md ${error ? "text-red-500" : "text-gray-500 dark:text-gray-400 peer-focus:text-indigo-600"}`}
    >
      {label}
    </label>
    {error && (
      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
        ⚠ {error}
      </p>
    )}
  </div>
);

// ─── Countries config ─────────────────────────────────────────────
const COUNTRIES = [
  {
    code: "EG",
    dialCode: "+20",
    flag: "🇪🇬",
    name: "مصر",
    placeholder: "01XXXXXXXXX",
    maxLength: 11,
    // 010, 011, 012, 015 + 8 أرقام = 11 رقم بدون كود الدولة
    validate: (n) => /^01[0125]\d{8}$/.test(n),
    hint: "11 رقماً يبدأ بـ 010 أو 011 أو 012 أو 015",
  },
  {
    code: "SA",
    dialCode: "+966",
    flag: "🇸🇦",
    name: "السعودية",
    placeholder: "05XXXXXXXX",
    maxLength: 10,
    // 05X + 7 أرقام = 10 أرقام بدون كود الدولة
    validate: (n) => /^05[0-9]\d{7}$/.test(n),
    hint: "10 أرقام تبدأ بـ 05",
  },
  {
    code: "MA",
    dialCode: "+212",
    flag: "🇲🇦",
    name: "المغرب",
    placeholder: "06XXXXXXXX",
    maxLength: 10,
    // 06X أو 07X + 7 أرقام = 10 أرقام
    validate: (n) => /^0[67]\d{8}$/.test(n),
    hint: "10 أرقام تبدأ بـ 06 أو 07",
  },
  {
    code: "TN",
    dialCode: "+216",
    flag: "🇹🇳",
    name: "تونس",
    placeholder: "XXXXXXXX",
    maxLength: 8,
    // 8 أرقام، تبدأ بـ 2,5,7,9
    validate: (n) => /^[2579]\d{7}$/.test(n),
    hint: "8 أرقام تبدأ بـ 2 أو 5 أو 7 أو 9",
  },
  {
    code: "IQ",
    dialCode: "+964",
    flag: "🇮🇶",
    name: "العراق",
    placeholder: "07XXXXXXXXX",
    maxLength: 11,
    // 07X + 8 أرقام = 11 رقم
    validate: (n) => /^07[3-9]\d{8}$/.test(n),
    hint: "11 رقماً تبدأ بـ 07",
  },
  {
    code: "SY",
    dialCode: "+963",
    flag: "🇸🇾",
    name: "سوريا",
    placeholder: "09XXXXXXXX",
    maxLength: 10,
    // 09X + 7 أرقام = 10 أرقام
    validate: (n) => /^09[1-9]\d{7}$/.test(n),
    hint: "10 أرقام تبدأ بـ 09",
  },
  {
    code: "DZ",
    dialCode: "+213",
    flag: "🇩🇿",
    name: "الجزائر",
    placeholder: "05XXXXXXXX",
    maxLength: 10,
    // 05X أو 06X أو 07X + 7 أرقام = 10 أرقام
    validate: (n) => /^0[5-7]\d{8}$/.test(n),
    hint: "10 أرقام تبدأ بـ 05 أو 06 أو 07",
  },
  {
    code: "US",
    dialCode: "+1",
    flag: "🇺🇸",
    name: "أمريكا",
    placeholder: "XXXXXXXXXX",
    maxLength: 10,
    // 10 أرقام، أول رقم 2–9، ثاني رقم 0–8
    validate: (n) => /^[2-9][0-8][0-9]\d{7}$/.test(n),
    hint: "10 أرقام (كود المنطقة + الرقم)",
  },
  {
    code: "SD",
    dialCode: "+249",
    flag: "🇸🇩",
    name: "السودان",
    placeholder: "09XXXXXXXX",
    maxLength: 10,
    // 09X + 7 أرقام = 10 أرقام
    validate: (n) => /^09[0-9]\d{7}$/.test(n),
    hint: "10 أرقام تبدأ بـ 09",
  },
];

// ─── Phone Input with Country Selector ───────────────────────────
const PhoneInput = ({ value, country, onPhoneChange, onCountryChange, error }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const selected = COUNTRIES.find((c) => c.code === country) || COUNTRIES[0];

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative w-full mt-6" ref={wrapRef}>
      {/* Label */}
      <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-1.5 text-right">
        رقم الموبايل (واتساب) *
      </label>

      {/* Input row */}
      <div
        className={`flex items-center border rounded-xl overflow-hidden transition-all duration-200 ${
          error
            ? "border-red-500 ring-2 ring-red-400/30"
            : "border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-indigo-400/40 focus-within:border-indigo-500"
        }`}
      >
        {/* Country picker button */}
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="flex items-center gap-1.5 px-3 py-3.5 bg-gray-50 dark:bg-gray-800 border-l border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0 min-w-[90px] justify-center"
        >
          <span className="text-xl leading-none">{selected.flag}</span>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{selected.dialCode}</span>
          <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>

        {/* Phone number input */}
        <input
          type="tel"
          value={value}
          onChange={(e) => {
            const num = e.target.value.replace(/[^0-9]/g, "").slice(0, selected.maxLength);
            onPhoneChange(num);
          }}
          placeholder={selected.placeholder}
          dir="ltr"
          className="flex-1 bg-transparent pt-3.5 pb-3.5 px-4 text-base text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none font-mono"
        />
      </div>

      {/* Hint */}
      <p className="mt-1 text-[11px] text-gray-400 text-right">
        {selected.flag} {selected.name}: {selected.hint}
      </p>

      {/* Error */}
      {error && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1 justify-end">
          <span>{error}</span>
          <span>⚠</span>
        </p>
      )}

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-1 w-full rounded-xl shadow-2xl overflow-hidden"
            style={{
              background: "rgba(15,15,30,0.97)",
              border: "1px solid rgba(99,102,241,0.3)",
              backdropFilter: "blur(12px)",
              maxHeight: "260px",
              overflowY: "auto",
            }}
          >
            {COUNTRIES.map((c, i) => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  onCountryChange(c.code);
                  onPhoneChange("");
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-right"
                style={{
                  background:
                    c.code === country
                      ? "rgba(99,102,241,0.25)"
                      : i % 2 === 0
                      ? "rgba(255,255,255,0.02)"
                      : "transparent",
                  color: c.code === country ? "#818cf8" : "#e5e7eb",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(99,102,241,0.18)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background =
                    c.code === country
                      ? "rgba(99,102,241,0.25)"
                      : i % 2 === 0
                      ? "rgba(255,255,255,0.02)"
                      : "transparent")
                }
              >
                <span className="text-2xl leading-none shrink-0">{c.flag}</span>
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <span className="text-sm font-bold truncate">{c.name}</span>
                  <span className="text-xs text-gray-400 font-mono">{c.dialCode} · {c.hint}</span>
                </div>
                {c.code === country && (
                  <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Sales Rep Autocomplete ───────────────────────────────────────────
const SalesAutocomplete = ({ value, onChange }) => {
  const [reps, setReps] = useState([]);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState(value || "");
  const [filtered, setFiltered] = useState([]);
  const wrapRef = useRef(null);

  // جلب أسماء السيليز مرة واحدة
  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDocs(collection(db, "salesReps"));
        const names = snap.docs
          .map((d) => d.data().name)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b, "ar"));
        setReps(names);
      } catch (e) {
        console.error(e);
      }
    };
    fetch();
  }, []);

  // فلترة عند الكتابة
  useEffect(() => {
    const q = input.trim().toLowerCase();
    if (!q) {
      setFiltered(reps); // عرض الكل لما الخانة فارغة
    } else {
      setFiltered(reps.filter((n) => n.toLowerCase().includes(q)));
    }
  }, [input, reps]);

  // إغلاق عند النقر خارج المكوّن
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (name) => {
    setInput(name);
    onChange(name);
    setOpen(false);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    onChange(e.target.value);
    setOpen(true);
  };

  return (
    <div ref={wrapRef} className="relative w-full mt-6">
      {/* Input */}
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder=" "
          dir="rtl"
          maxLength={40}
          className="peer w-full border border-gray-300 dark:border-gray-600 focus:ring-indigo-400 focus:border-indigo-500 rounded-xl bg-transparent pt-6 pb-2 px-4 pr-10 text-base text-gray-800 dark:text-gray-100 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-opacity-40 transition-all duration-200"
        />
        <label className="absolute right-4 top-1 text-sm font-bold transition-all duration-200 ease-in-out peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-xs px-2 rounded-md text-gray-500 dark:text-gray-400 peer-focus:text-indigo-600">
          اسم المرشِّح
        </label>
        {/* chevron toggle */}
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500 transition-colors"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute z-50 top-full mt-1 w-full rounded-xl shadow-2xl overflow-hidden"
            style={{
              background: "rgba(15,15,30,0.97)",
              border: "1px solid rgba(99,102,241,0.3)",
              backdropFilter: "blur(12px)",
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-500">
                لا توجد نتائج مطابقة
              </div>
            ) : (
              filtered.map((name, i) => (
                <motion.button
                  key={name}
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => select(name)}
                  className="w-full text-right px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2"
                  style={{
                    color:
                      input && name.toLowerCase().includes(input.toLowerCase())
                        ? "#818cf8"
                        : "#e5e7eb",
                    background:
                      i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(99,102,241,0.18)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent")
                  }
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background: "rgba(99,102,241,0.2)",
                      color: "#818cf8",
                    }}
                  >
                    {(name[0] || "?").toUpperCase()}
                  </span>
                  {name}
                </motion.button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Referrers Modal ──────────────────────────────────────────────
const ReferrersModal = ({ onClose }) => {
  const [names, setNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDocs(collection(db, "NewStudents"));

        // ── Step 1: normalize (remove spaces + diacritics + lowercase) ──
        const normalize = (str) =>
          str
            .replace(/\s+/g, "")
            .replace(/[\u064B-\u065F]/g, "")
            .toLowerCase();

        // ── Step 2: Levenshtein distance ──
        const levenshtein = (a, b) => {
          const m = a.length,
            n = b.length;
          const dp = Array.from({ length: m + 1 }, (_, i) =>
            Array.from({ length: n + 1 }, (_, j) =>
              i === 0 ? j : j === 0 ? i : 0,
            ),
          );
          for (let i = 1; i <= m; i++)
            for (let j = 1; j <= n; j++)
              dp[i][j] =
                a[i - 1] === b[j - 1]
                  ? dp[i - 1][j - 1]
                  : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
          return dp[m][n];
        };

        // ── Step 3: similarity ratio (0–1) ──
        const similarity = (a, b) => {
          if (!a || !b) return 0;
          const dist = levenshtein(a, b);
          return 1 - dist / Math.max(a.length, b.length);
        };

        // THRESHOLD: names with similarity >= this are merged (0.72 = 72%)
        const THRESHOLD = 0.72;

        // ── Step 4: collect raw entries ──
        const entries = []; // [{ raw, normKey, date }]
        snap.forEach((doc) => {
          const raw = doc.data().referredBy?.trim();
          const date = doc.data().registrationDate;
          if (!raw) return;
          entries.push({ raw, normKey: normalize(raw), date });
        });

        // ── Step 5: cluster with fuzzy matching ──
        // clusters: [{ normKeys: Set, displayNames: {}, count, latestDate }]
        const clusters = [];

        for (const entry of entries) {
          // find the best matching cluster
          let bestCluster = null;
          let bestScore = 0;

          for (const cluster of clusters) {
            // compare against all existing keys in the cluster, pick best score
            for (const existingKey of cluster.normKeys) {
              const score = similarity(entry.normKey, existingKey);
              if (score > bestScore) {
                bestScore = score;
                bestCluster = cluster;
              }
            }
          }

          if (bestCluster && bestScore >= THRESHOLD) {
            // merge into existing cluster
            bestCluster.normKeys.add(entry.normKey);
            bestCluster.displayNames[entry.raw] =
              (bestCluster.displayNames[entry.raw] || 0) + 1;
            bestCluster.count += 1;
            if (entry.date && entry.date > bestCluster.latestDate)
              bestCluster.latestDate = entry.date;
          } else {
            // new cluster
            clusters.push({
              normKeys: new Set([entry.normKey]),
              displayNames: { [entry.raw]: 1 },
              count: 1,
              latestDate: entry.date,
            });
          }
        }

        // ── Step 6: build final list ──
        setNames(
          clusters
            .map((cluster) => {
              const displayName = Object.entries(cluster.displayNames).sort(
                (a, b) => b[1] - a[1],
              )[0][0];
              return {
                name: displayName,
                count: cluster.count,
                latestDate: cluster.latestDate,
              };
            })
            .sort((a, b) => b.count - a.count),
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = names.filter(({ name }) => name.includes(search));

  const formatDate = (iso) => {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-linear-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5" />
            <span className="font-bold text-lg">أسماء المرشِّحين</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ابحث عن اسم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              dir="rtl"
              className="w-full pr-9 pl-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>

        {/* List */}
        <div className="px-4 py-4 max-h-72 overflow-y-auto space-y-2">
          {loading ? (
            <div className="text-center py-8 text-gray-400">
              جاري التحميل...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-400">لا توجد نتائج</div>
          ) : (
            filtered.map(({ name, count, latestDate }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex flex-col items-end">
                    <span
                      className="text-sm font-medium text-gray-800 dark:text-gray-100"
                      dir="rtl"
                    >
                      {name}
                    </span>
                    {formatDate(latestDate) && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                        آخر ترشيح: {formatDate(latestDate)}
                      </span>
                    )}
                  </div>
                </div>
                <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                  {count} ترشيح
                </span>
              </motion.div>
            ))
          )}
        </div>

        <div className="px-4 pb-4">
          <div className="text-center text-xs text-gray-400">
            إجمالي المرشِّحين: {names.length} • إجمالي الترشيحات:{" "}
            {names.reduce((s, r) => s + r.count, 0)}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────
export default function Page() {
  const navigate = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loadingCodax, setLoadingCodax] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showReferrers, setShowReferrers] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [activeTab, setActiveTab] = useState("student");
  const [isPhoneAlreadyRegistered, setIsPhoneAlreadyRegistered] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("EG");

  const [formData, setFormData] = useState({
    arabicName: "",
    englishName: "",
    age: "",
    college: "",
    city: "",
    track: "",
    studyMethod: "",
    phone: "",
    email: "",
    hasExperience: "",
    referredBy: "",
    accepted: false,
  });

  const maxLength = 40;
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  useEffect(() => {
    setTimeout(() => setLoadingCodax(true), 1200);
  }, []);

  if (!loadingCodax)
    return (
      <div className="h-dvh flex justify-center items-center">
        {/* <GlobalLoader /> */}
      </div>
    );

  // ── Validation per step ──
  const validateStep = (step) => {
    const errors = {};
    if (step === 1) {
      if (!formData.arabicName.trim())
        errors.arabicName = "الاسم بالعربي مطلوب";
      if (!formData.englishName.trim())
        errors.englishName = "الاسم بالإنجليزي مطلوب";
      if (formData.age && (formData.age < 16 || formData.age > 60))
        errors.age = "السن يجب أن يكون بين 16 و 60";
    }
    if (step === 2) {
      if (!formData.track) errors.track = "التراك مطلوب";
      if (!formData.studyMethod) errors.studyMethod = "طريقة الدراسة مطلوبة";
    }
    if (step === 3) {
      const phoneClean = formData.phone.trim();
      const countryConfig = COUNTRIES.find((c) => c.code === selectedCountry) || COUNTRIES[0];
      if (!phoneClean) {
        errors.phone = "رقم الهاتف مطلوب";
      } else if (!countryConfig.validate(phoneClean)) {
        errors.phone = `رقم الموبايل غير صحيح — ${countryConfig.flag} ${countryConfig.name}: ${countryConfig.hint}`;
      }
      if (!formData.email) errors.email = "البريد الإلكتروني مطلوب";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        errors.email = "البريد الإلكتروني غير صالح";
      if (!formData.accepted) errors.accepted = "يجب أن توافق على الشروط والأحكام";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "arabicName") {
      setFormData({ ...formData, [name]: value.replace(/[^أ-ي\s]/g, "") });
      return;
    }
    if (name === "englishName") {
      setFormData({ ...formData, [name]: value.replace(/[^A-Za-z\s]/g, "") });
      return;
    }
    if (name === "age") {
      setFormData({
        ...formData,
        [name]: value.replace(/[^0-9]/g, "").slice(0, 2),
      });
      return;
    }
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
    if (fieldErrors[name]) setFieldErrors({ ...fieldErrors, [name]: "" });
  };

  const nextStep = () => {
    if (validateStep(currentStep)) setCurrentStep((s) => Math.min(s + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep((s) => Math.max(s - 1, 1));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsPhoneAlreadyRegistered(false);
    if (!validateStep(1)) {
      setCurrentStep(1);
      setError("يرجى إكمال البيانات الشخصية أولاً");
      return;
    }
    if (!validateStep(2)) {
      setCurrentStep(2);
      setError("يرجى اختيار التراك وطريقة الدراسة أولاً");
      return;
    }
    if (!validateStep(3)) {
      setError("يرجى التأكد من صحة رقم الموبايل والموافقة على الشروط والأحكام");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const arabicName = formData.arabicName.trim();
      const countryConfig = COUNTRIES.find((c) => c.code === selectedCountry) || COUNTRIES[0];
      // الرقم المحلي (بدون كود دولة) — للحفظ كما أدخله المستخدم
      const phoneLocal = formData.phone.trim();
      // الرقم الدولي الكامل — للحفظ في Firestore
      const phoneIntl = countryConfig.dialCode + phoneLocal;
      const track = formData.track;
      const studentsRef = collection(db, "NewStudents");

      // 1. فحص هل الطالب مسجل في نفس التراك (بالرقم الدولي أو المحلي)
      const dupQ = query(
        studentsRef,
        where("phone", "==", phoneIntl),
        where("track", "==", track),
        where("arabicName", "==", arabicName),
      );
      if (!(await getDocs(dupQ)).empty) {
        setError("بياناتك ورقم هاتفك مسجلان بالفعل في هذا التراك!");
        setIsPhoneAlreadyRegistered(true);
        setLoading(false);
        return;
      }

      // 2. فحص هل رقم الهاتف مسجل في قائمة الطلاب الجدد
      const phoneQ = query(studentsRef, where("phone", "==", phoneIntl));
      const phoneSnap = await getDocs(phoneQ);
      if (!phoneSnap.empty) {
        // اسمح بالتسجيل لو كل السجلات برقم الهاتف ده مرفوضة
        const allRejected = phoneSnap.docs.every((d) =>
          String(d.data().paymentStatus || "").startsWith("رفض"),
        );
        if (!allRejected) {
          setError("رقم الهاتف هذا مسجل لدينا بالفعل!");
          setIsPhoneAlreadyRegistered(true);
          setLoading(false);
          return;
        }
      }

      // 3. فحص هل رقم الهاتف مسجل في قائمة الطلاب الفعليين
      try {
        const activeStudentQ = query(
          collection(db, "students"),
          where("id", "==", Number(phoneLocal))
        );
        const activeSnap = await getDocs(activeStudentQ);
        if (!activeSnap.empty) {
          setError("رقم الهاتف هذا مسجل لدينا بالفعل كطالب مفعل في الأكاديمية!");
          setIsPhoneAlreadyRegistered(true);
          setLoading(false);
          return;
        }
      } catch (activeErr) {
        console.warn("Active student check warning:", activeErr);
      }

      await addDoc(studentsRef, {
        ...formData,
        arabicName,
        phone: phoneIntl,
        phoneLocal,
        country: selectedCountry,
        countryDialCode: countryConfig.dialCode,
        registrationDate: new Date().toISOString(),
        read: false,
      });

      // حفظ رمز الجلسة لتأمين وحماية صفحة النجاح
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "codax_reg_success_payload",
          JSON.stringify({
            name: arabicName,
            track: formData.track,
            studyMethod: formData.studyMethod,
            timestamp: Date.now(),
          })
        );
      }

      navigate.push("/auth/Register/RegistrationSuccess");
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء التسجيل. الرجاء المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step content ──
  const renderStep = () => {
    const slide = {
      initial: { opacity: 0, x: 40 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -40 },
    };

    if (currentStep === 1)
      return (
        <motion.div
          key="step1"
          {...slide}
          transition={{ duration: 0.3 }}
          className="space-y-1"
        >
          <FloatInput
            id="arabicName"
            name="arabicName"
            label="الاسم بالعربي ثلاثي *"
            value={formData.arabicName}
            onChange={handleChange}
            error={fieldErrors.arabicName}
            maxLength={maxLength}
          />
          <FloatInput
            id="englishName"
            name="englishName"
            label="الاسم بالإنجليزي *"
            value={formData.englishName}
            onChange={handleChange}
            error={fieldErrors.englishName}
            dir="ltr"
            maxLength={maxLength}
          />
          <FloatInput
            id="age"
            name="age"
            type="number"
            label="السن"
            value={formData.age}
            onChange={handleChange}
            error={fieldErrors.age}
            min="16"
            max="60"
          />
          <FloatInput
            id="college"
            name="college"
            label="الكلية"
            value={formData.college}
            onChange={handleChange}
            maxLength={maxLength}
          />
          <FloatInput
            id="city"
            name="city"
            label="محل الإقامة"
            value={formData.city}
            onChange={handleChange}
            maxLength={maxLength}
          />
        </motion.div>
      );

    if (currentStep === 2)
      return (
        <motion.div
          key="step2"
          {...slide}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {/* Track */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 text-right">
              التراك اللي حابب تتعلمه *
              <button
                type="button"
                onClick={() => setShowAlert(!showAlert)}
                className="mr-2 text-amber-500 hover:text-amber-600 text-base align-middle"
              >
                ⚠️
              </button>
            </label>
            <AnimatePresence>
              {showAlert && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-2 p-3 bg-amber-50 border border-amber-300 rounded-xl text-sm text-amber-800 text-right"
                >
                  لا تختر تراك الباك إند إن لم يكن لديك أساسيات جيدة في الفرونت
                  والجافاسكريبت.
                </motion.div>
              )}
            </AnimatePresence>
            {/* Track Selection */}
            <div>
              <fieldset className="border border-gray-600 rounded-2xl p-4">
                <legend className="block px-4 text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 text-right">
                  اختر التراك *
                </legend>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  {/* Frontend */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, track: "frontend" });
                      setFieldErrors({ ...fieldErrors, track: "" });
                    }}
                    className={`py-3  rounded-xl border-2 font-bold text-sm transition-all duration-200 ${
                      formData.track === "frontend"
                        ? "border-indigo-500 bg-indigo-50 dark:bg-orange-500/70 text-indigo-700 dark:text-indigo-300 scale-105 shadow-md"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300"
                    }`}
                  >
                    💻 Frontend
                  </button>

                  {/* Backend */}
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, track: "backend" });
                      setFieldErrors({ ...fieldErrors, track: "" });
                    }}
                    className={`py-3 rounded-xl border-2 font-bold text-sm transition-all duration-200 ${
                      formData.track === "backend"
                        ? "border-indigo-500 bg-indigo-50 dark:bg-green-500/60 text-indigo-700 dark:text-indigo-300 scale-105 shadow-md"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300"
                    }`}
                  >
                    ⚙️ Backend
                  </button>
                </div>

                {fieldErrors.track && (
                  <p className="mt-1 text-xs text-red-500">
                    ⚠ {fieldErrors.track}
                  </p>
                )}
              </fieldset>
            </div>

            {fieldErrors.track && (
              <p className="mt-1 text-xs text-red-500">⚠ {fieldErrors.track}</p>
            )}
          </div>

          {/* Study method */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 text-right">
              طريقة الدراسة المفضلة *
            </label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              {/* أونلاين - متاح */}
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, studyMethod: "online" });
                  setFieldErrors({ ...fieldErrors, studyMethod: "" });
                }}
                className={`py-3 rounded-xl border-2 font-bold text-sm transition-all duration-200 ${formData.studyMethod === "online" ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 scale-105 shadow-md" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300"}`}
              >
                🌐 أونلاين
              </button>

              {/* حضوري - غير متوفر حالياً */}
              <div className="relative">
                <span
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(239,68,68,0.15)",
                    color: "#ef4444",
                    border: "1px solid rgba(239,68,68,0.35)",
                  }}
                >
                  ⛔ تم اغلاقة
                </span>
                <button
                  type="button"
                  disabled
                  onClick={() => {
                    setFormData({ ...formData, studyMethod: "inPerson" });
                    setFieldErrors({ ...fieldErrors, studyMethod: "" });
                  }}
                  className={`py-3 w-full cursor-not-allowed opacity-40  rounded-xl border-2 font-bold text-sm transition-all duration-200 ${formData.studyMethod === "inPerson" ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 scale-105 shadow-md" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-300"}`}
                >
                  🏫 حضوري
                </button>
              </div>
            </div>
            {fieldErrors.studyMethod && (
              <p className="mt-1 text-xs text-red-500">
                ⚠ {fieldErrors.studyMethod}
              </p>
            )}
          </div>

          {/* Experience */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 text-right">
              هل لديك معرفة سابقة بالبرمجة؟
            </label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              {[
                { val: "", label: "🚫 لا" },
                { val: "beginner", label: "🌱 بسيطة" },
                { val: "intermediate", label: "⚡ متوسطة" },
                { val: "advanced", label: "🚀 عالية" },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, hasExperience: val })
                  }
                  className={`py-2.5 rounded-xl border-2 font-bold text-sm transition-all duration-200 ${formData.hasExperience === val ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 scale-105 shadow-md" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-emerald-300"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      );

    if (currentStep === 3)
      return (
        <motion.div
          key="step3"
          {...slide}
          transition={{ duration: 0.3 }}
          className="space-y-1"
        >
          <PhoneInput
            value={formData.phone}
            country={selectedCountry}
            onPhoneChange={(num) => {
              setFormData((prev) => ({ ...prev, phone: num }));
              setIsPhoneAlreadyRegistered(false);
              if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: "" }));
            }}
            onCountryChange={(code) => {
              setSelectedCountry(code);
              setFormData((prev) => ({ ...prev, phone: "" }));
              if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: "" }));
            }}
            error={fieldErrors.phone || phoneError}
          />
          <FloatInput
            id="email"
            name="email"
            type="email"
            label="البريد الإلكتروني *"
            value={formData.email}
            onChange={handleChange}
            error={fieldErrors.email}
            dir="ltr"
            maxLength={60}
          />

          {/* Referral section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1">
              <button
                type="button"
                onClick={() => setShowReferrers(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <Users className="w-3.5 h-3.5" /> عرض أسماء المرشِّحين
              </button>
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                اسم من رشّحك (اختياري)
              </label>
            </div>
            <SalesAutocomplete
              value={formData.referredBy}
              onChange={(val) =>
                setFormData((prev) => ({ ...prev, referredBy: val }))
              }
            />
          </div>

          {/* Terms & Conditions Checkbox */}
          <div className="pt-4 text-right">
            <label
              htmlFor="accepted"
              className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                fieldErrors.accepted
                  ? "border-red-500 bg-red-500/10 text-red-400"
                  : formData.accepted
                    ? "border-emerald-500/40 bg-emerald-500/10 text-slate-200"
                    : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:border-indigo-400 text-slate-700 dark:text-slate-300"
              }`}
            >
              <input
                type="checkbox"
                id="accepted"
                name="accepted"
                checked={formData.accepted}
                onChange={handleChange}
                className="mt-1 h-5 w-5 rounded-lg border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
              />
              <div className="text-xs sm:text-sm leading-relaxed">
                <span>أوافق على جميع </span>
                <a
                  href="/pages/CodaxRules"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="font-bold text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-500"
                >
                  شروط وأحكام وقوانين منصة CodaX
                </a>
                <span> والالتزام بها بالكامل. *</span>
              </div>
            </label>

            {fieldErrors.accepted && (
              <p className="mt-1.5 text-xs text-red-500 font-bold flex items-center gap-1 justify-end">
                <span>{fieldErrors.accepted}</span>
                <span>⚠</span>
              </p>
            )}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 dark:bg-red-950/40 text-right space-y-3"
            >
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
                <span>⚠</span>
                <span>{error}</span>
              </div>

              {isPhoneAlreadyRegistered && (
                <div className="pt-2 border-t border-red-500/20 text-xs text-slate-300 space-y-2.5">
                  <p className="leading-relaxed text-slate-300">
                    إذا كنت بحاجة لتعديل بياناتك أو الاستفسار عن اشتراكك، يمكنك التواصل مباشرة مع الإدارة عبر الواتساب:
                  </p>
                  <a
                    href={`https://wa.me/201023669672?text=${encodeURIComponent(
                      `مرحباً إدارة CodaX، أواجه مشكلة في التسجيل بكورس CodaX ورقم هاتفي مسجل بالفعل (${formData.phone || ""})`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-linear-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>تواصل مع الإدارة عبر واتساب (01023669672)</span>
                  </a>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      );
  };

  const renderSalesTab = () => (
    <motion.div
      key="sales-tab"
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-5 text-right"
      dir="rtl"
    >
      <div className="rounded-2xl bg-linear-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-5 text-white shadow-lg">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
          <BriefcaseBusiness className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-black">انضم لفريق السيلز</h2>
        <p className="mt-2 text-sm leading-7 text-white/85">
          ساعد الطلاب يختاروا المسار المناسب، وتابع ترشيحاتك وأرباحك من خلال
          حسابك الخاص.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["ترشيحاتك", "تابع كل طالب رشحته"],
          ["أرباح واضحة", "اعرف مستحقاتك بسهولة"],
          ["دعم مستمر", "فريق يساعدك خطوة بخطوة"],
        ].map(([title, description]) => (
          <div
            key={title}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5"
          >
            <p className="text-sm font-black text-indigo-600 dark:text-indigo-300">
              {title}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-indigo-400/20 dark:bg-indigo-500/10">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
          جاهز تبدأ؟
        </p>
       <details>
        <summary className="p-2 focus:text-lime-600 cursor-pointer flex items-center  gap-1.5">اضغط هنا لمعرفة المزيد <span className="animate-pulse"><Pointer/></span>! </summary>
        <summary className="mr-3">قم بترشيح زملائك للكورس.</summary>
        <summary className="mr-3">في حالة التسجيل في الكورس تحصل علي نسبة مالية في حسابك.</summary>
        <summary className="mr-3">يتم تحويل المبلغ عن طريق فودافون كاش.</summary>
       </details>
      </div>
      <button
        type="button"
        onClick={() => navigate.push("/auth/Sales-register")}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-indigo-600 to-purple-600 px-5 py-3.5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-indigo-300/40"
      >
       سجل دخول او انشئ حساب سيلز <ArrowLeft className="h-4 w-4" />
      </button>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] text-slate-800 dark:text-slate-200 overflow-x-hidden relative py-10 px-4">
      {/* Particles */}
      <Suspense fallback={null}>
        <div className="fixed inset-0 pointer-events-none z-0">
          <Particles
            particleColors={["#6366f1", "#8b5cf6", "#06b6d4"]}
            particleCount={180}
            particleSpread={6}
            speed={0.08}
            particleBaseSize={80}
            moveParticlesOnHover={true}
            alphaParticles={true}
            disableRotation={false}
          />
        </div>
      </Suspense>

      {/* Animated orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 60, 0], y: [0, -40, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-60 -right-60 w-[700px] h-[700px] rounded-full opacity-[0.05] dark:opacity-[0.07]"
          style={{
            background: "radial-gradient(circle, #6366f1, transparent 70%)",
          }}
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 60, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-60 -left-60 w-[600px] h-[600px] rounded-full opacity-[0.05] dark:opacity-[0.07]"
          style={{
            background: "radial-gradient(circle, #8b5cf6, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.01] dark:opacity-[0.015]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #6366f1 1px, transparent 0)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Referrers Modal */}
      <AnimatePresence>
        {showReferrers && (
          <ReferrersModal onClose={() => setShowReferrers(false)} />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center w-full gap-3">
            <Link title="الرئيسية" href={"/"}><Home size={30}/></Link>
            <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="inline-flex items-center gap-2 bg-linear-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-l-full text-sm font-bold shadow-xl mb-3"
          >
            <Sparkles className="w-5 h-5" />
            انضم إلى مبرمجي CodaX
          </motion.div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            أكمل الخطوات التالية للتسجيل في الكورس
          </p>
        </div>

        {/* Audience tabs */}
        <div
          className="mb-4 grid grid-cols-2 rounded-2xl border border-slate-200 bg-white/80 p-1.5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5"
          dir="rtl"
          role="tablist"
        >
          {[
            { id: "student", label: "تسجيل طالب", icon: GraduationCap },
            { id: "sales", label: "حساب سيلز", icon: BriefcaseBusiness },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-black transition-all ${activeTab === id ? "bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"}`}
              aria-selected={activeTab === id}
              role="tab"
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl backdrop-blur-sm">
          {activeTab === "student" ? (
            <>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-t-3xl overflow-hidden">
                <motion.div
                  animate={{ width: `${(currentStep / 3) * 100}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-linear-to-r from-indigo-500 to-purple-500 rounded-full"
                />
              </div>

              <div className="p-6 sm:p-8">
                <StepIndicator current={currentStep} />

                <form onSubmit={handleSubmit}>
                  <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>

                  {/* Navigation buttons */}
                  <div className="flex items-center justify-between mt-8 gap-3">
                    {currentStep > 1 ? (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-bold text-sm hover:border-indigo-400 hover:text-indigo-600 transition-all"
                      >
                        <ChevronRight className="w-4 h-4" /> السابق
                      </button>
                    ) : (
                      <div />
                    )}

                    {currentStep < 3 ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-lg hover:shadow-indigo-200 hover:scale-105 transition-all"
                      >
                        التالي <ChevronLeft className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={loading}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl bg-linear-to-r from-emerald-500 to-green-600 text-white font-bold text-sm shadow-lg hover:scale-105 transition-all ${loading ? "opacity-70 cursor-not-allowed" : "hover:shadow-emerald-200"}`}
                      >
                        {loading ? (
                          "جاري التسجيل..."
                        ) : (
                          <>
                            <Check className="w-4 h-4" /> تسجيل في الكورس
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="p-6 sm:p-8">{renderSalesTab()}</div>
          )}
        </div>

        {activeTab === "student" && (
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setShowReferrers(true)}
              className="inline-flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            >
              <Users className="w-4 h-4" /> عرض جميع أسماء المرشِّحين
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
