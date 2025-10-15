import { useEffect, useState } from "react";
import NewExpeditionCard from "./components/NewExpeditionCard.jsx";
import TimerCard from "./components/TimerCard.jsx";

// --- AUDIO CUE CONFIG ---
const DEFAULT_AUDIO_SETTINGS = {
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

function getStoredAudioSettings() {
  try {
    const stored = localStorage.getItem("audioCueSettings");
    const parsed = stored ? JSON.parse(stored) : DEFAULT_AUDIO_SETTINGS;
    return migrateAudioSettings(parsed);
  } catch {
    return DEFAULT_AUDIO_SETTINGS;
  }
}

function setStoredAudioSettings(settings) {
  localStorage.setItem("audioCueSettings", JSON.stringify(settings));
}

// --- MAIN APP ---
export default function NightreignTimerApp() {
  // --- Multi-step state ---
  const [mode, setMode] = useState("new-expedition");
  const [selectedBoss, setSelectedBoss] = useState(null);

  // --- AUDIO CUE STATE ---
  const [audioSettings, setAudioSettings] = useState(getStoredAudioSettings());
  useEffect(() => { setStoredAudioSettings(audioSettings); }, [audioSettings]);

  // --- SETTINGS MODAL STATE ---
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen w-screen bg-[#151136] flex flex-col items-center p-4 overflow-x-hidden">
      {/* Card transitions */}
      <div className="w-full flex flex-col items-center justify-center flex-1">
        {mode === "new-expedition" && <NewExpeditionCard setMode={setMode} setSelectedBoss={setSelectedBoss} />}
        {mode === "timer" && (
          <TimerCard
            settingsOpen={settingsOpen}
            setSettingsOpen={setSettingsOpen}
            selectedBoss={selectedBoss}
            setMode={setMode}
            setSelectedBoss={setSelectedBoss}
            audioSettings={audioSettings}
            setAudioSettings={setAudioSettings}
          />
        )}
      </div>
      {/* Footer */}
      <footer className="w-full flex justify-center items-center gap-6 mt-8 p-4 bg-[#0f0d29]">
        <span className="text-white">
          Forked from <a href="https://nightreigntimer.com/" target="_blank" rel="noopener noreferrer" className="underline">nightreigntimer.com</a>
        </span>
        <a
          href="https://github.com/JoaoCostaIFG/nightreign-timer"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View on GitHub"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-8 h-8 hover:scale-110 transition-transform text-white"
          >
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.983 1.029-2.682-.103-.253-.446-1.27.098-2.645 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.91-1.296 2.75-1.026 2.75-1.026.544 1.375.202 2.392.1 2.645.64.7 1.028 1.591 1.028 2.682 0 3.842-2.337 4.687-4.565 4.936.359.309.678.92.678 1.852 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.003 10.003 0 0 0 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
        </a>
      </footer>
    </div>
  );
}
