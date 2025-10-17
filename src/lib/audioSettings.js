// --- AUDIO CUE CONFIG ---
export const DEFAULT_AUDIO_SETTINGS = {
  mode: "default", // "default" or "custom"
  voice: "Ranni", // Only used in default mode
  enabled: true,
  volume: 1,
  timeCues: [
    { type: "percent", value: 50 }, // 50% remaining
    { type: "seconds", value: 60 }, // 1 minute left
  ],
  useAudioFiles: {
    noontideStart: true,
    nightStart: true,
    timeRemaining: false,
  },
};

// --- SETTINGS MIGRATION ---
function migrateAudioSettings(settings) {
  // If mode is missing, migrate to new structure
  if (!settings.mode) {
    return {
      ...DEFAULT_AUDIO_SETTINGS,
      ...settings,
      mode: "custom",
      voice: "Ranni",
      useAudioFiles: {
        noontideStart: !!settings.useAudioFiles?.noontideStart,
        nightStart: !!settings.useAudioFiles?.nightStart,
        timeRemaining: !!settings.useAudioFiles?.timeRemaining,
      },
    };
  }
  return settings;
}

export function getStoredAudioSettings() {
  try {
    const stored = localStorage.getItem("audioCueSettings");
    const parsed = stored ? JSON.parse(stored) : DEFAULT_AUDIO_SETTINGS;
    return migrateAudioSettings(parsed);
  } catch {
    return DEFAULT_AUDIO_SETTINGS;
  }
}

export function setStoredAudioSettings(settings) {
  localStorage.setItem("audioCueSettings", JSON.stringify(settings));
}
