// ── Avatar Border Decorations ──
// كل إطار يتضمن: CSS ring classes, glow/shadow effects, أنيميشن,
// وتأثيرات بصرية فريدة (نقش SVG مضمّن كـ pseudo-elements)

export const AVATAR_BORDERS = [
  {
    id: "default",
    name: "الافتراضي",
    nameEn: "Classic",
    price: 0,
    ringClass: "ring-slate-600/50",
    glowClass: "",
    animationClass: "",
    previewGradient: "from-slate-600 to-slate-800",
    previewEmoji: "⚪",
    description: "الإطار الكلاسيكي المعتاد",
    rarity: "common",
  },
  {
    id: "cyber_neon",
    name: "سايبر نيون ⚡",
    nameEn: "Cyber Neon",
    price: 40,
    ringClass: "ring-cyan-400 ring-offset-2 ring-offset-slate-900",
    frameStyle: "cyber",
    glowClass: "shadow-[0_0_22px_rgba(6,182,212,0.85),0_0_44px_rgba(6,182,212,0.3)]",
    animationClass: "animate-pulse",
    previewGradient: "from-cyan-400 via-sky-500 to-blue-600",
    previewEmoji: "⚡",
    description: "توهج نيون مستقبلي مع هالة سماوية مزدوجة متلألئة",
    rarity: "rare",
  },
  {
    id: "fire_flame",
    name: "اللهب المشتعل 🔥",
    nameEn: "Fire Flame",
    price: 60,
    ringClass: "ring-orange-500 ring-offset-2 ring-offset-slate-900",
    frameStyle: "flame",
    glowClass: "shadow-[0_0_18px_rgba(249,115,22,0.9),0_0_40px_rgba(239,68,68,0.4),inset_0_0_15px_rgba(251,146,60,0.2)]",
    animationClass: "",
    previewGradient: "from-red-500 via-orange-500 to-amber-400",
    previewEmoji: "🔥",
    description: "لهب ناري حقيقي بطبقات توهج حمراء وبرتقالية نابضة",
    rarity: "epic",
  },
  {
    id: "emerald_crystal",
    name: "الزمرد المشع 💎",
    nameEn: "Emerald Crystal",
    price: 40,
    ringClass: "ring-emerald-400 ring-offset-2 ring-offset-slate-900",
    frameStyle: "crystal",
    glowClass: "shadow-[0_0_20px_rgba(52,211,153,0.85),0_0_45px_rgba(16,185,129,0.25)]",
    animationClass: "animate-[pulse_2.5s_ease-in-out_infinite]",
    previewGradient: "from-emerald-400 via-teal-500 to-green-600",
    previewEmoji: "💎",
    description: "بريق كريستالي أخضر فخم مع توهج زمردي عميق",
    rarity: "rare",
  },
  {
    id: "golden_champion",
    name: "التاج الذهبي 👑",
    nameEn: "Golden Champion",
    price: 80,
    ringClass: "ring-amber-400 ring-offset-2 ring-offset-slate-900",
    frameStyle: "crown",
    glowClass: "shadow-[0_0_20px_rgba(251,191,36,0.95),0_0_50px_rgba(245,158,11,0.4),0_0_80px_rgba(217,119,6,0.2)]",
    animationClass: "animate-[pulse_2s_ease-in-out_infinite]",
    previewGradient: "from-amber-300 via-yellow-400 to-orange-500",
    previewEmoji: "👑",
    description: "إطار الملوك ذو الهيبة والذهب الخالص بثلاث طبقات توهج",
    rarity: "legendary",
  },

  {
    id: "rgb_rainbow",
    name: "قوس قزح RGB 🌈",
    nameEn: "RGB Rainbow",
    price: 100,
    ringClass: "ring-rose-500 ring-offset-2 ring-offset-slate-900",
    frameStyle: "rainbow",
    glowClass: "shadow-[0_0_20px_rgba(244,63,94,0.7),0_0_40px_rgba(34,197,94,0.4),0_0_60px_rgba(59,130,246,0.3)]",
    animationClass: "",
    previewGradient: "from-red-500 via-emerald-400 to-blue-500",
    previewEmoji: "🌈",
    description: "ألوان RGB حية تدور بتناغم تمنحك تميزاً استثنائياً",
    rarity: "legendary",
  },
    {
    id: "cosmic_galaxy",
    name: "المجرة الكونية 🌌",
    nameEn: "Cosmic Galaxy",
    price: 150,
    ringClass: "ring-fuchsia-500 ring-offset-2 ring-offset-slate-900",
    frameStyle: "galaxy",
    glowClass: "shadow-[0_0_25px_rgba(217,70,239,0.85),0_0_50px_rgba(139,92,246,0.3),0_0_80px_rgba(168,85,247,0.15)]",
    animationClass: "",
    previewGradient: "from-purple-600 via-fuchsia-500 to-indigo-600",
    previewEmoji: "🌌",
    description: "هالة بنفسجية فضائية مبهرة تدور ببطء كمجرة حقيقية",
    rarity: "legendary",
  },
  // ── إطار حصري من عجلة الحظ فقط — غير متوفر في المتجر ──
  {
    id: "phantom_glitch",
    name: "الشبح اطار 👻",
    nameEn: "Phantom Glitch",
    price: -1, // غير قابل للشراء
    ringClass: "ring-violet-500 ring-offset-2 ring-offset-slate-900",
    frameStyle: "glitch",
    glowClass: "shadow-[0_0_15px_rgba(139,92,246,0.9),0_0_35px_rgba(192,38,211,0.5),0_0_60px_rgba(88,28,135,0.3),0_0_100px_rgba(139,92,246,0.15)]",
    animationClass: "animate-[pulse_0.8s_ease-in-out_infinite]",
    previewGradient: "from-violet-600 via-purple-500 to-fuchsia-600",
    previewEmoji: "👻",
    description: "إطار أسطوري حصري لا يُشترى! يُحصل عليه فقط من عجلة الحظ بنسبة ضئيلة جداً",
    rarity: "mythic",
    isExclusive: true,
  },
  {
    id: "celestial_eclipse",
    name: "كسوف الأبدية ☄️",
    nameEn: "Celestial Eclipse",
    price: -1,
    ringClass: "ring-violet-300 ring-offset-2 ring-offset-slate-900",
    frameStyle: "eclipse",
    glowClass: "shadow-[0_0_22px_rgba(56,189,248,.75),0_0_46px_rgba(168,85,247,.5),0_0_80px_rgba(236,72,153,.25)]",
    animationClass: "",
    previewGradient: "from-cyan-300 via-violet-500 to-fuchsia-500",
    previewEmoji: "☄️",
    description: "إطار سماوي نادر للغاية، يدور حوله ضوء الكسوف وأقمار متلألئة. لا يمكن الحصول عليه إلا من عجلة الحظ.",
    rarity: "divine",
    isExclusive: true,
  },
];

// ── Rarity color mapping for visual badges ──
export const RARITY_COLORS = {
  common: { bg: "bg-slate-500/20", text: "text-slate-400", border: "border-slate-500/30", label: "عادي" },
  rare: { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30", label: "نادر" },
  epic: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30", label: "ملحمي" },
  legendary: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30", label: "أسطوري" },
  divine: { bg: "bg-sky-500/20", text: "text-sky-300", border: "border-sky-400/50", label: "سماوي ☄️" },
  mythic: { bg: "bg-fuchsia-500/20", text: "text-fuchsia-300", border: "border-fuchsia-500/40", label: "خرافي 🔮" },
};

export const AVATAR_BADGES = [
  {
    id: "code_ninja",
    name: "Code Ninja",
    emoji: "🥷",
    price: 30,
    badgeClass: "bg-linear-to-r from-slate-700 to-slate-900 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]",
    description: "مبرمج سريع ودقيق ينجز المهام في صمت",
  },
  {
    id: "bug_hunter",
    name: "Bug Hunter",
    emoji: "🐛",
    price: 35,
    badgeClass: "bg-linear-to-r from-rose-950 to-red-900 text-rose-300 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)]",
    description: "صائد الأخطاء البرمجية الخبير",
  },
  {
    id: "fast_learner",
    name: "Fast Learner",
    emoji: "⚡",
    price: 25,
    badgeClass: "bg-linear-to-r from-amber-950 to-yellow-900 text-yellow-300 border border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.3)]",
    description: "سريع البديهة يستوعب الأفكار فوراً",
  },
  {
    id: "night_owl",
    name: "Night Owl",
    emoji: "🦉",
    price: 20,
    badgeClass: "bg-linear-to-r from-indigo-950 to-purple-950 text-indigo-300 border border-indigo-500/40 shadow-[0_0_10px_rgba(99,102,241,0.3)]",
    description: "عاشق البرمجة والمذاكرة في ساعات الليل الهادئة",
  },
  {
    id: "algorithm_master",
    name: "Algorithm Master",
    emoji: "🧠",
    price: 50,
    badgeClass: "bg-linear-to-r from-violet-950 to-purple-900 text-violet-300 border border-violet-500/40 shadow-[0_0_12px_rgba(139,92,246,0.4)]",
    description: "عبقري الخوارزميات وحل المشكلات المعقدة",
  },
  {
    id: "clean_coder",
    name: "Clean Coder",
    emoji: "🧹",
    price: 30,
    badgeClass: "bg-linear-to-r from-emerald-950 to-teal-900 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]",
    description: "كاتب كود نظيف ومرتب وسهل القراءة",
  },
  {
    id: "lucky_one",
    name: "Lucky One",
    emoji: "🍀",
    price: 45,
    badgeClass: "bg-linear-to-r from-green-950 to-emerald-900 text-green-300 border border-green-400/40 shadow-[0_0_12px_rgba(74,222,128,0.4)]",
    description: "المحظوظ الفائز من عجلة الحظ",
  },
];

export function getAvatarBorder(borderId) {
  return AVATAR_BORDERS.find((b) => b.id === borderId) || AVATAR_BORDERS[0];
}

export function getAvatarBadge(badgeId) {
  return AVATAR_BADGES.find((b) => b.id === badgeId) || null;
}

// الإطارات المتاحة في المتجر فقط (بدون الحصرية)
export function getStoreBorders() {
  return AVATAR_BORDERS.filter((b) => !b.isExclusive);
}
