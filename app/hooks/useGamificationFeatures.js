"use client";

import { useState, useEffect } from "react";
import {
  DEFAULT_GAMIFICATION_FEATURES_CONFIG,
  subscribeGamificationFeaturesConfig,
  subscribeActiveSpotlights,
} from "@/app/services/gamificationFeaturesService";

export function useGamificationFeatures() {
  const [config, setConfig] = useState(DEFAULT_GAMIFICATION_FEATURES_CONFIG);
  const [activeSpotlights, setActiveSpotlights] = useState([]);
  const [loading, setLoading] = useState(true);

  // استماع لحظي لإعدادات الميزات
  useEffect(() => {
    const unsubConfig = subscribeGamificationFeaturesConfig((newConfig) => {
      if (newConfig) {
        setConfig(newConfig);
      }
      setLoading(false);
    });

    const unsubSpotlights = subscribeActiveSpotlights((spotlights) => {
      setActiveSpotlights(spotlights || []);
    });

    return () => {
      unsubConfig();
      unsubSpotlights();
    };
  }, []);

  return {
    config,
    spotlightConfig: config.spotlight || DEFAULT_GAMIFICATION_FEATURES_CONFIG.spotlight,
    reactionsRevealConfig: config.reactionsReveal || DEFAULT_GAMIFICATION_FEATURES_CONFIG.reactionsReveal,
    lootBoxesConfig: config.lootBoxes || DEFAULT_GAMIFICATION_FEATURES_CONFIG.lootBoxes,
    codeResubmissionConfig: config.codeResubmission || DEFAULT_GAMIFICATION_FEATURES_CONFIG.codeResubmission,
    activeSpotlights,
    isSpotlightEnabled: config.spotlight?.enabled ?? true,
    isReactionsRevealEnabled: config.reactionsReveal?.enabled ?? true,
    isLootBoxesEnabled: config.lootBoxes?.enabled ?? true,
    isCodeResubmissionEnabled: config.codeResubmission?.enabled ?? true,
    loading,
  };
}
