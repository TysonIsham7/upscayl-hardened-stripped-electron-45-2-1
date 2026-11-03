type FeatureFlags = {
  APP_STORE_BUILD: boolean;
  /**
   * Upstream checks GitHub releases for upscayl/upscayl and would replace
   * this Electron 45 build with an official package. Leave this off unless
   * you publish updates for this fork and point electron-builder at them.
   */
  ENABLE_AUTO_UPDATE: boolean;
};

export const FEATURE_FLAGS: FeatureFlags = {
  APP_STORE_BUILD: false,
  ENABLE_AUTO_UPDATE: false,
};
