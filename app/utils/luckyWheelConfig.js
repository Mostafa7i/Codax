import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/app/services/firebaseConfig";

export const DEFAULT_WHEEL_SECTORS = [
  {
    id: "points_1",
    label: "+1 نقطة",
    icon: "🪙",
    type: "points",
    value: 1,
    color: "#475569",
    textColor: "#ffffff",
    percentage: 64.99,
    enabled: true,
  },
  {
    id: "points_5",
    label: "+5 نقاط",
    icon: "🪙",
    type: "points",
    value: 5,
    color: "#0284c7",
    textColor: "#ffffff",
    percentage: 20,
    enabled: true,
  },
  {
    id: "points_10",
    label: "+10 نقاط",
    icon: "💰",
    type: "points",
    value: 10,
    color: "#d97706",
    textColor: "#ffffff",
    percentage: 7,
    enabled: true,
  },
  {
    id: "points_15",
    label: "+15 نقطة",
    icon: "🌟",
    type: "points",
    value: 15,
    color: "#c026d3",
    textColor: "#ffffff",
    percentage: 4,
    enabled: true,
  },
  {
    id: "reserve_1",
    label: "+1 حضور",
    icon: "🛡️",
    type: "reserve",
    value: 1,
    color: "#059669",
    textColor: "#ffffff",
    percentage: 2.5,
    enabled: true,
  },
  {
    id: "spin_again",
    label: "لفة إضافية",
    icon: "🔄",
    type: "spin_again",
    value: 0,
    color: "#e11d48",
    textColor: "#ffffff",
    percentage: 1,
    enabled: true,
  },
  {
    id: "points_20",
    label: "+20 نقطة",
    icon: "💎",
    type: "points",
    value: 20,
    color: "#7c3aed",
    textColor: "#ffffff",
    percentage: 0.3,
    enabled: true,
  },
  {
    id: "points_40",
    label: "+40 نقطة",
    icon: "👑",
    type: "points",
    value: 40,
    color: "#eab308",
    textColor: "#000000",
    percentage: 0.1,
    enabled: true,
  },
  {
    id: "badge_lucky",
    label: "محظوظ 🍀",
    icon: "🍀",
    type: "badge",
    value: "lucky_one",
    color: "#0d9488",
    textColor: "#ffffff",
    percentage: 0.05,
    enabled: true,
  },
  {
    id: "border_phantom",
    label: "الشبح 👻",
    icon: "👻",
    type: "exclusive_border",
    value: "phantom_glitch",
    color: "#4c1d95",
    textColor: "#e9d5ff",
    percentage: 0.05,
    enabled: true,
  },
  {
    id: "border_celestial_eclipse",
    label: "الكسوف ☄️",
    icon: "☄️",
    type: "exclusive_border",
    value: "celestial_eclipse",
    color: "#1e1b4b",
    textColor: "#e0f2fe",
    percentage: 0.01,
    enabled: true,
  },
];

export const DEFAULT_BLUE_CARD_ITEMS = [
  { borderId: "cosmic_galaxy", durationDays: 3 },
  { borderId: "dragon_emperor", durationDays: 3 },
  { borderId: "aurora_borealis", durationDays: 7 },
  { borderId: "rgb_rainbow", durationDays: 1 },
];

export const DEFAULT_WHEEL_CONFIG = {
  cooldownHours: 24,
  isActive: true,
  sectors: DEFAULT_WHEEL_SECTORS,
  // إطارات عجلة Green Card الخاصة (دائمة). يمكن للأدمن تعديلها من لوحة العجلة.
  greenCardBorderIds: [
    "emerald_crystal",
    "cyber_neon",
    "fire_flame",
    "golden_champion",
  ],
  // إطارات عجلة Blue Card الخاصة (مؤقتة بمدة محددة). يمكن للأدمن اختيار الإطارات وتحديد مدة كل إطار بالأيام.
  blueCardItems: DEFAULT_BLUE_CARD_ITEMS,
};

/**
 * اختيار قطاع عشوائي بناءً على النسب المئوية المحددة
 * @param {Array} sectors مصفوفة القطاعات
 * @returns {number} المؤشر في المصفوفة الكاملة للقطاع الفائز
 */
export function mergeWheelSectors(savedSectors) {
  if (!Array.isArray(savedSectors)) return DEFAULT_WHEEL_SECTORS;

  const savedById = new Map(savedSectors.map((sector) => [sector.id, sector]));
  const mergedDefaults = DEFAULT_WHEEL_SECTORS.map((sector) => ({
    ...sector,
    ...(savedById.get(sector.id) || {}),
  }));
  const customSectors = savedSectors.filter(
    (sector) =>
      !DEFAULT_WHEEL_SECTORS.some(
        (defaultSector) => defaultSector.id === sector.id,
      ),
  );

  return [...mergedDefaults, ...customSectors];
}
export function getWeightedSectorIndex(sectors) {
  if (!sectors || sectors.length === 0) return 0;

  // جمع النسب للقطاعات المفعلة فقط
  const enabledList = sectors
    .map((s, idx) => ({ ...s, originalIndex: idx }))
    .filter((s) => s.enabled !== false && Number(s.percentage) > 0);

  if (enabledList.length === 0) return 0;

  const totalPercentage = enabledList.reduce(
    (sum, s) => sum + Number(s.percentage || 0),
    0,
  );

  let random = Math.random() * totalPercentage;
  for (let i = 0; i < enabledList.length; i++) {
    const p = Number(enabledList[i].percentage || 0);
    random -= p;
    if (random <= 0) {
      return enabledList[i].originalIndex;
    }
  }

  return enabledList[enabledList.length - 1].originalIndex;
}

/**
 * جلب إعدادات عجلة الحظ من Firestore
 */
export async function getLuckyWheelConfig() {
  try {
    const ref = doc(db, "settings", "luckyWheel");
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      return {
        ...DEFAULT_WHEEL_CONFIG,
        ...data,
        sectors:
          Array.isArray(data.sectors) && data.sectors.length > 0
            ? data.sectors
            : DEFAULT_WHEEL_SECTORS,
        greenCardBorderIds: Array.isArray(data.greenCardBorderIds)
          ? data.greenCardBorderIds
          : DEFAULT_WHEEL_CONFIG.greenCardBorderIds,
        blueCardItems: Array.isArray(data.blueCardItems)
          ? data.blueCardItems
          : DEFAULT_WHEEL_CONFIG.blueCardItems,
      };
    }
    return DEFAULT_WHEEL_CONFIG;
  } catch (err) {
    console.error("Error getting lucky wheel config:", err);
    return DEFAULT_WHEEL_CONFIG;
  }
}

/**
 * حفظ إعدادات عجلة الحظ في Firestore
 */
export async function saveLuckyWheelConfig(config) {
  const ref = doc(db, "settings", "luckyWheel");
  await setDoc(ref, {
    ...config,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * الاستماع اللحظي لإعدادات عجلة الحظ
 */
export function subscribeLuckyWheelConfig(onUpdate) {
  const ref = doc(db, "settings", "luckyWheel");
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        onUpdate({
          ...DEFAULT_WHEEL_CONFIG,
          ...data,
          sectors:
            Array.isArray(data.sectors) && data.sectors.length > 0
              ? data.sectors
              : DEFAULT_WHEEL_SECTORS,
          greenCardBorderIds: Array.isArray(data.greenCardBorderIds)
            ? data.greenCardBorderIds
            : DEFAULT_WHEEL_CONFIG.greenCardBorderIds,
          blueCardItems: Array.isArray(data.blueCardItems)
            ? data.blueCardItems
            : DEFAULT_WHEEL_CONFIG.blueCardItems,
        });
      } else {
        onUpdate(DEFAULT_WHEEL_CONFIG);
      }
    },
    (err) => {
      console.error("Error subscribing to lucky wheel config:", err);
      onUpdate(DEFAULT_WHEEL_CONFIG);
    },
  );
}
