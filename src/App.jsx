import { useEffect, useState, useRef } from "react";
import SettingsModal from "./SettingsModal";
import TimelineCircle from "./TimelineCircle";

// --- NIGHT CIRCLE PHASES CONFIG ---
// Each night has these four phases in order.
const NIGHT_CIRCLE_PHASES = [
  { circle: "Noontide", phase: "Free Farm", seconds: 270 },   // 4.5 min
  { circle: "Night", phase: "Circle Closing", seconds: 180 }, // 3 min
  { circle: "Noontide", phase: "Free Farm", seconds: 210 },   // 3.5 min
  { circle: "Night", phase: "Circle Closing", seconds: 180 }, // 3 min
];

const NIGHT_NAMES = ["First Night", "Second Night"];
const TOTAL_NIGHT_TIME = 14 * 60; // 14 minutes

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Add this helper for TTS-friendly time
function formatTimeForSpeech(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0 && secs > 0) return `${mins} minute${mins > 1 ? "s" : ""} ${secs} second${secs > 1 ? "s" : ""}`;
  if (mins > 0) return `${mins} minute${mins > 1 ? "s" : ""}`;
  return `${secs} second${secs !== 1 ? "s" : ""}`;
}

function useNightreignTimer() {
  // nightIndex: null (pre-start), 0 (first night), 1 (second night)
  const [nightIndex, setNightIndex] = useState(null);
  // phaseIndex: 0 to 3 (see NIGHT_CIRCLE_PHASES)
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseTime, setPhaseTime] = useState(0);
  const [totalNightTime, setTotalNightTime] = useState(TOTAL_NIGHT_TIME);
  const [isPaused, setIsPaused] = useState(true);

  // Set phaseTime when phaseIndex or nightIndex changes
  useEffect(() => {
    if (nightIndex !== null) {
      setPhaseTime(NIGHT_CIRCLE_PHASES[phaseIndex].seconds);
    }
  }, [nightIndex, phaseIndex]);

  // Main timer logic
  useEffect(() => {
    let timer = null;
    if (nightIndex !== null && !isPaused && phaseIndex < NIGHT_CIRCLE_PHASES.length) {
      timer = setInterval(() => {
        setPhaseTime((prev) => {
          if (prev <= 1) {
            // End of phase: go to next phase
            if (phaseIndex < NIGHT_CIRCLE_PHASES.length - 1) {
              setPhaseIndex(phaseIndex + 1);
              return NIGHT_CIRCLE_PHASES[phaseIndex + 1].seconds;
            } else {
              // End of all phases in this night
              setIsPaused(true);
              return 0;
            }
          }
          return prev - 1;
        });
        setTotalNightTime((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => timer && clearInterval(timer);
  }, [nightIndex, isPaused, phaseIndex]);

  const begin = () => {
    if (nightIndex === null) {
      setNightIndex(0);
      setPhaseIndex(0);
      setPhaseTime(NIGHT_CIRCLE_PHASES[0].seconds);
      setTotalNightTime(TOTAL_NIGHT_TIME);
      setIsPaused(false);
    } else if (nightIndex === 0 && phaseIndex >= NIGHT_CIRCLE_PHASES.length - 1 && phaseTime <= 0) {
      // Start second night after first completes
      setNightIndex(1);
      setPhaseIndex(0);
      setPhaseTime(NIGHT_CIRCLE_PHASES[0].seconds);
      setTotalNightTime(TOTAL_NIGHT_TIME);
      setIsPaused(false);
    }
  };

  const reset = () => {
    setNightIndex(null);
    setPhaseIndex(0);
    setPhaseTime(0);
    setTotalNightTime(TOTAL_NIGHT_TIME);
    setIsPaused(true);
  };

  // Info for UI
  let currentNightLabel = "";
  let currentCircleLabel = "";
  let currentPhaseLabel = "";
  let displayPhaseTime = 0;
  let displayNightTime = TOTAL_NIGHT_TIME;

  if (nightIndex === null) {
    currentNightLabel = "";
    currentCircleLabel = NIGHT_CIRCLE_PHASES[0].circle;
    currentPhaseLabel = NIGHT_CIRCLE_PHASES[0].phase;
    displayPhaseTime = NIGHT_CIRCLE_PHASES[0].seconds;
  } else {
    currentNightLabel = NIGHT_NAMES[nightIndex];
    currentCircleLabel = NIGHT_CIRCLE_PHASES[phaseIndex].circle;
    currentPhaseLabel = NIGHT_CIRCLE_PHASES[phaseIndex].phase;
    displayPhaseTime = phaseTime;
    displayNightTime = totalNightTime;
  }

  // Hide fields when done
  if (nightIndex !== null && phaseIndex >= NIGHT_CIRCLE_PHASES.length - 1 && phaseTime <= 0) {
    currentNightLabel = "";
    currentCircleLabel = "";
    currentPhaseLabel = "";
    displayPhaseTime = 0;
  }

  return {
    nightIndex,
    phaseIndex,
    begin,
    reset,
    displayNightTime,
    currentNightLabel,
    currentCircleLabel,
    currentPhaseLabel,
    displayPhaseTime,
  };
}

// --- AUDIO CUE CONFIG ---
const DEFAULT_AUDIO_SETTINGS = {
  enabled: false,
  volume: 1,
  timeCues: [
    { type: "percent", value: 50 }, // 50% remaining
    { type: "seconds", value: 60 }, // 1 minute left
  ],
  useAudioFiles: {
    noontideStart: false,
    nightStart: false,
    timeRemaining: false,
  },
};

const AUDIO_CUE_TEXT = {
  noontideStart: "Noontide is here tarnished, Free Farm Starts Now",
  nightStart: "Night is here tarnished, Circle Closing",
  timeRemaining: (time) => `Only ${time} remaining tarnished`,
};

function getStoredAudioSettings() {
  try {
    const stored = localStorage.getItem("audioCueSettings");
    return stored ? JSON.parse(stored) : DEFAULT_AUDIO_SETTINGS;
  } catch {
    return DEFAULT_AUDIO_SETTINGS;
  }
}

function setStoredAudioSettings(settings) {
  localStorage.setItem("audioCueSettings", JSON.stringify(settings));
}

function useAudioCue(settings) {
  const playedCuesRef = useRef({}); // { phaseKey: { cueType: true } }

  // Helper to play TTS or audio file
  function playCue(type, timeText = "") {
    if (!settings.enabled) return;
    let text = "";
    if (type === "noontideStart") text = AUDIO_CUE_TEXT.noontideStart;
    else if (type === "nightStart") text = AUDIO_CUE_TEXT.nightStart;
    else if (type === "timeRemaining") text = AUDIO_CUE_TEXT.timeRemaining(timeText);

    // Audio file logic stub
    if (settings.useAudioFiles[type]) {
      // TODO: Play audio file for this cue
      // Example: new Audio(`/audio/${type}.mp3`).play();
      return;
    }

    // TTS
    if (window.speechSynthesis) {
      const utter = new window.SpeechSynthesisUtterance(text);
      utter.volume = settings.volume;
      window.speechSynthesis.speak(utter);
    }
  }

  // Reset played cues when phase changes
  function resetPhaseCues(phaseKey) {
    playedCuesRef.current[phaseKey] = {};
  }

  // Mark cue as played for this phase
  function markCuePlayed(phaseKey, cueType) {
    if (!playedCuesRef.current[phaseKey]) playedCuesRef.current[phaseKey] = {};
    playedCuesRef.current[phaseKey][cueType] = true;
  }

  // Check if cue was played for this phase
  function wasCuePlayed(phaseKey, cueType) {
    return playedCuesRef.current[phaseKey]?.[cueType];
  }

  return { playCue, resetPhaseCues, markCuePlayed, wasCuePlayed };
}

export default function NightreignTimerApp() {
  // Always keep screen awake on mount
  const wakeLockRef = useRef(null);

  useEffect(() => {
    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          wakeLockRef.current.addEventListener('release', () => {
            // Optionally handle release event
          });
        }
      } catch (err) {
        // console.log("Wake lock error:", err);
      }
    }
    requestWakeLock();

    // Clean up if component unmounts
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, []);

  const header = (
    <div className="w-full flex justify-center mb-6">
      <img
        src="/nightreign-timer-banner.png"
        alt="Nightreign Timer"
        className="w-[250px] md:w-[300px] max-w-full drop-shadow-lg"
        draggable={false}
      />
    </div>
  );
  const {
    nightIndex,
    phaseIndex,
    begin,
    reset,
    displayNightTime,
    currentNightLabel,
    currentCircleLabel,
    currentPhaseLabel,
    displayPhaseTime,
  } = useNightreignTimer();

  // --- AUDIO CUE STATE ---
  const [audioSettings, setAudioSettings] = useState(getStoredAudioSettings());
  useEffect(() => { setStoredAudioSettings(audioSettings); }, [audioSettings]);

  // --- SETTINGS MODAL STATE ---
  const [settingsOpen, setSettingsOpen] = useState(false);

  // --- AUDIO CUE LOGIC ---
  const { playCue, resetPhaseCues, markCuePlayed, wasCuePlayed } = useAudioCue(audioSettings);

  // Track phase key for cue uniqueness
  const phaseKey = `${nightIndex}-${phaseIndex}`;

  // Play phase start cues
  useEffect(() => {
    if (nightIndex === null) return;
    resetPhaseCues(phaseKey);

    if (currentCircleLabel === "Noontide" && currentPhaseLabel === "Free Farm" && !wasCuePlayed(phaseKey, "noontideStart")) {
      playCue("noontideStart");
      markCuePlayed(phaseKey, "noontideStart");
    }
    if (currentCircleLabel === "Night" && currentPhaseLabel === "Circle Closing" && !wasCuePlayed(phaseKey, "nightStart")) {
      playCue("nightStart");
      markCuePlayed(phaseKey, "nightStart");
    }
    // eslint-disable-next-line
  }, [nightIndex, phaseIndex]);

  // Play time remaining cues
  useEffect(() => {
    if (nightIndex === null) return;
    audioSettings.timeCues.forEach((cue) => {
      let shouldPlay = false;
      let cueType = `timeRemaining-${cue.type}-${cue.value}`;
      if (cue.type === "percent") {
        const total = NIGHT_CIRCLE_PHASES[phaseIndex]?.seconds || 1;
        if (displayPhaseTime === Math.floor((cue.value / 100) * total)) shouldPlay = true;
      } else if (cue.type === "seconds") {
        if (displayPhaseTime === cue.value) shouldPlay = true;
      }
      if (shouldPlay && !wasCuePlayed(phaseKey, cueType)) {
        // Use TTS-friendly time string
        playCue("timeRemaining", formatTimeForSpeech(displayPhaseTime));
        markCuePlayed(phaseKey, cueType);
      }
    });
    // eslint-disable-next-line
  }, [displayPhaseTime, nightIndex, phaseIndex, audioSettings.timeCues]);

  return (
    <div className="min-h-screen w-screen bg-[#151136] flex flex-col items-center p-4 overflow-x-hidden">
      {header}
      <div className="w-full max-w-4xl flex items-center justify-center">
        <div className="w-full bg-white shadow-lg rounded-lg border border-gray-200 p-8 relative">
          {/* Gear Icon */}
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-black transition"
            aria-label="Settings"
            onClick={() => setSettingsOpen(true)}
          >
            {/* Standard cogwheel SVG from Heroicons */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.25 2.25c.966 0 1.75.784 1.75 1.75v.5a7.001 7.001 0 0 1 2.25.938l.354-.354a1.75 1.75 0 1 1 2.475 2.475l-.354.354A7.001 7.001 0 0 1 19.5 11h.5a1.75 1.75 0 1 1 0 3.5h-.5a7.001 7.001 0 0 1-.938 2.25l.354.354a1.75 1.75 0 1 1-2.475 2.475l-.354-.354A7.001 7.001 0 0 1 12.75 19.5v.5a1.75 1.75 0 1 1-3.5 0v-.5a7.001 7.001 0 0 1-2.25-.938l-.354.354a1.75 1.75 0 1 1-2.475-2.475l.354-.354A7.001 7.001 0 0 1 4.5 13H4a1.75 1.75 0 1 1 0-3.5h.5a7.001 7.001 0 0 1 .938-2.25l-.354-.354a1.75 1.75 0 1 1 2.475-2.475l.354.354A7.001 7.001 0 0 1 11.25 4.5v-.5c0-.966.784-1.75 1.75-1.75zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
            </svg>
          </button>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-center md:justify-center gap-0">
            {/* Night label above timeline circle */}
            <div className="flex flex-col items-center justify-center">
              {currentNightLabel && (
                <p className="text-xl font-medium text-black mb-2">
                  {currentNightLabel}
                </p>
              )}
              {/* TimelineCircle and timers in the same column */}
              <TimelineCircle
                phases={NIGHT_CIRCLE_PHASES}
                phaseIndex={phaseIndex}
                phaseTime={displayPhaseTime}
                phaseTotal={NIGHT_CIRCLE_PHASES[phaseIndex]?.seconds || 1}
              />
              <div className="flex flex-col items-center gap-3 mt-4">
                <div className="text-center">
                  <h2 className="text-l font-semibold text-black mb-1">
                    Total Night Timer
                  </h2>
                  <p className="text-3xl font-mono text-black">
                    {formatTime(displayNightTime)}
                  </p>
                </div>
                {(currentCircleLabel && currentPhaseLabel) && (
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-black mb-1">
                      {currentCircleLabel} – {currentPhaseLabel}
                    </h3>
                    <p className="text-3xl font-mono text-black">
                      {formatTime(displayPhaseTime)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-center gap-4">
            {(nightIndex !== 1 || phaseIndex < NIGHT_CIRCLE_PHASES.length - 1 || displayPhaseTime > 0) ? (
              <button
                onClick={begin}
                className="px-6 py-2 rounded bg-black text-white font-semibold shadow hover:bg-gray-800 transition"
              >
                {nightIndex === null
                  ? "Begin"
                  : nightIndex === 0 && phaseIndex >= NIGHT_CIRCLE_PHASES.length - 1 && displayPhaseTime <= 0
                  ? "Second Night"
                  : "Running"}
              </button>
            ) : null}
            <button
              onClick={reset}
              className="px-6 py-2 rounded border border-black text-black font-semibold bg-white shadow hover:bg-gray-100 transition"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
      {/* Settings Modal */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={audioSettings}
        setSettings={setAudioSettings}
      />
    </div>
  );
}
