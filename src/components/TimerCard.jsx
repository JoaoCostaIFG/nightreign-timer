import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import SettingsModal from "../SettingsModal";
import TimelineCircle from "../TimelineCircle";
import BossCard from "./BossCard";
import { assetUrl } from "../lib/utils";
import { CARD_ANIMATION_CLASS } from "../lib/constants";

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

const AUDIO_CUE_TEXT = {
  noontideStart: "Noontide is here nightfarer, Free Farm Starts Now",
  nightStart: "Night is here nightfarer, Circle Closing",
  timeRemaining: (time) => `Only ${time} remaining nightfarer`,
};

// --- AUDIO CUE MANAGER ---
function useAudioCueManager(settings) {
  const playedCuesRef = useRef({}); // { phaseKey: { cueType: true } }

  // Helper to play TTS or audio file
  const playCue = useCallback((type, timeText = "") => {
    if (!settings.enabled) return;
    if (settings.mode === "default") {
      // Play audio file for default cues
      let cueFile = null;
      if (type === "noontideStart" || type === "nightStart") {
        cueFile = assetUrl(`/audio/${settings.voice}/${type}.mp3`);
      } else if (type === "3min" || type === "2min" || type === "1min") {
        cueFile = assetUrl(`/audio/${settings.voice}/${type}.mp3`);
      }
      if (cueFile) {
        const audio = new window.Audio(cueFile);
        audio.volume = settings.volume;
        audio.play();
      }
    } else {
      // Custom mode: TTS
      let text = "";
      if (type === "noontideStart") text = AUDIO_CUE_TEXT.noontideStart;
      else if (type === "nightStart") text = AUDIO_CUE_TEXT.nightStart;
      else if (type === "timeRemaining") text = AUDIO_CUE_TEXT.timeRemaining(timeText);

      if (window.speechSynthesis && text) {
        const utter = new window.SpeechSynthesisUtterance(text);
        utter.volume = settings.volume;
        window.speechSynthesis.speak(utter);
      }
    }
  }, [settings]);

  // Reset played cues when phase changes
  const resetPhaseCues = useCallback((phaseKey) => {
    playedCuesRef.current[phaseKey] = {};
  }, []);

  // Mark cue as played for this phase
  const markCuePlayed = useCallback((phaseKey, cueType) => {
    if (!playedCuesRef.current[phaseKey]) playedCuesRef.current[phaseKey] = {};
    playedCuesRef.current[phaseKey][cueType] = true;
  }, []);

  // Check if cue was played for this phase
  const wasCuePlayed = useCallback((phaseKey, cueType) => {
    return playedCuesRef.current[phaseKey]?.[cueType];
  }, []);

  return useMemo(() => ({ playCue, resetPhaseCues, markCuePlayed, wasCuePlayed }),
    [playCue, resetPhaseCues, markCuePlayed, wasCuePlayed]);
}

// --- TIMER LOGIC ---
function useNightreignTimer(audioSettings, audioCueManager) {
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
              audioCueManager.resetPhaseCues(`${nightIndex}-${phaseIndex + 1}`);
              return NIGHT_CIRCLE_PHASES[phaseIndex + 1].seconds;
            } else {
              // End of all phases in this night
              setIsPaused(true);
              return 0;
            }
          }

          const phaseKey = `${nightIndex}-${phaseIndex}`;
          const remainingPercent = (prev / NIGHT_CIRCLE_PHASES[phaseIndex].seconds) * 100;
          const timeForSpeech = formatTimeForSpeech(prev);

          // --- AUDIO CUE LOGIC ---
          const settings = audioSettings;

          if (settings.enabled) {
            if (settings.mode === "default") {
              // Default mode: play mp3 at hardcoded intervals
              // Phase start cues
              if (prev === NIGHT_CIRCLE_PHASES[phaseIndex].seconds) {
                const cueType = NIGHT_CIRCLE_PHASES[phaseIndex].circle === "Noontide" ? "noontideStart" : "nightStart";
                if (!audioCueManager.wasCuePlayed(phaseKey, cueType)) {
                  audioCueManager.playCue(cueType);
                  audioCueManager.markCuePlayed(phaseKey, cueType);
                }
              }
              // 2/1 min remaining cues
              [
                { value: 120, cue: "2min" },
                { value: 60, cue: "1min" },
              ].forEach(({ value, cue }) => {
                if (
                  prev === value &&
                  !audioCueManager.wasCuePlayed(phaseKey, cue)
                ) {
                  audioCueManager.playCue(cue);
                  audioCueManager.markCuePlayed(phaseKey, cue);
                }
              });
            } else {
              // Custom mode: user-configured cues, TTS
              // Phase start cues (if enabled)
              if (prev === NIGHT_CIRCLE_PHASES[phaseIndex].seconds) {
                const cueType = NIGHT_CIRCLE_PHASES[phaseIndex].circle === "Noontide" ? "noontideStart" : "nightStart";
                if (
                  settings.useAudioFiles[cueType] &&
                  !audioCueManager.wasCuePlayed(phaseKey, cueType)
                ) {
                  audioCueManager.playCue(cueType);
                  audioCueManager.markCuePlayed(phaseKey, cueType);
                }
              }
              // User-configured time cues
              settings.timeCues.forEach((cue) => {
                const cueKey = `${cue.type}-${cue.value}`;
                if (
                  (cue.type === "percent" && remainingPercent <= cue.value && !audioCueManager.wasCuePlayed(phaseKey, cueKey)) ||
                  (cue.type === "seconds" && prev <= cue.value && !audioCueManager.wasCuePlayed(phaseKey, cueKey))
                ) {
                  audioCueManager.playCue("timeRemaining", timeForSpeech);
                  audioCueManager.markCuePlayed(phaseKey, cueKey);
                }
              });
            }
          }

          return prev - 1;
        });
        setTotalNightTime((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => timer && clearInterval(timer);
  }, [nightIndex, isPaused, phaseIndex, audioCueManager, audioSettings]);

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
    currentNightLabel = "Ready to Begin";
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

export default function TimerCard({ settingsOpen, setSettingsOpen, selectedBoss, setMode, setSelectedBoss, audioSettings, setAudioSettings }) {
  const audioCueManager = useAudioCueManager(audioSettings);
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
  } = useNightreignTimer(audioSettings, audioCueManager);

  const [wakeLock, setWakeLock] = useState(null);
  const [isWakeLockSupported, setIsWakeLockSupported] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsWakeLockSupported('wakeLock' in navigator);
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (isWakeLockSupported) {
      try {
        const lock = await navigator.wakeLock.request('screen');
        setWakeLock(lock);
        lock.addEventListener('release', () => {
          setWakeLock(null);
        });
      } catch (err) {
        console.error(`${err.name}, ${err.message}`);
      }
    }
  }, [isWakeLockSupported]);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLock) {
      await wakeLock.release();
      setWakeLock(null);
    }
  }, [wakeLock]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [wakeLock, requestWakeLock]);

  const timerDone =
    nightIndex === 1 &&
    phaseIndex >= NIGHT_CIRCLE_PHASES.length - 1 &&
    displayPhaseTime <= 0;

  function handleNewExpedition() {
    setMode("new-expedition");
    setSelectedBoss(null);
    reset();
    releaseWakeLock();
  }

  function handleBegin() {
    begin();
    requestWakeLock();
  }

  function handleReset() {
    reset();
    releaseWakeLock();
  }

  return (
    <div className={`w-full max-w-4xl flex flex-col md:flex-row items-center md:items-start justify-center ${CARD_ANIMATION_CLASS}`}>
      <div className="w-full bg-[#1a1a1a] shadow-lg rounded-lg border border-gray-700 p-8 relative flex flex-col md:flex-row items-center md:items-start">
        <button
          className="absolute top-4 left-4 bg-gray-700 hover:bg-gray-600 text-gray-200 hover:text-white rounded-full p-2 transition"
          aria-label="Back to boss selection"
          onClick={handleNewExpedition}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <BossCard boss={selectedBoss} />
        <div className="flex-1 flex flex-col items-center w-full">
          <button
            className="absolute top-4 right-4 text-gray-300 hover:text-white transition"
            aria-label="Settings"
            onClick={() => setSettingsOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.25 2.25c.966 0 1.75.784 1.75 1.75v.5a7.001 7.001 0 0 1 2.25.938l.354-.354a1.75 1.75 0 1 1 2.475 2.475l-.354.354A7.001 7.001 0 0 1 19.5 11h.5a1.75 1.75 0 1 1 0 3.5h-.5a7.001 7.001 0 0 1-.938 2.25l.354.354a1.75 1.75 0 1 1-2.475 2.475l-.354-.354A7.001 7.001 0 0 1 12.75 19.5v.5a1.75 1.75 0 1 1-3.5 0v-.5a7.001 7.001 0 0 1-2.25-.938l-.354.354a1.75 1.75 0 1 1-2.475-2.475l.354-.354A7.001 7.001 0 0 1 4.5 13H4a1.75 1.75 0 1 1 0-3.5h.5a7.001 7.001 0 0 1 .938-2.25l-.354-.354a1.75 1.75 0 1 1 2.475-2.475l.354.354A7.001 7.001 0 0 1 11.25 4.5v-.5c0-.966.784-1.75 1.75-1.75zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
            </svg>
          </button>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-center md:justify-center gap-0 w-full">
            <div className="flex flex-col items-center justify-center w-full">
              <p className="text-xl font-bold text-gray-100 mb-2">
                {currentNightLabel}
              </p>
              <TimelineCircle
                phases={NIGHT_CIRCLE_PHASES}
                phaseIndex={phaseIndex}
                phaseTime={displayPhaseTime}
                phaseTotal={NIGHT_CIRCLE_PHASES[phaseIndex]?.seconds || 1}
              />
              <div className="flex flex-col items-center gap-3 mt-4">
                <div className="text-center">
                  <h2 className="text-l font-semibold text-gray-200 mb-1">
                    Total Night Timer
                  </h2>
                  <p className="text-3xl font-mono text-gray-100">
                    {formatTime(displayNightTime)}
                  </p>
                </div>
                {(currentCircleLabel && currentPhaseLabel) && (
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200 mb-1">
                      {currentCircleLabel} – {currentPhaseLabel}
                    </h3>
                    <p className="text-3xl font-mono text-gray-100">
                      {formatTime(displayPhaseTime)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-center gap-4">
            {!timerDone ? (
              <>
                <button
                  onClick={handleBegin}
                  className="px-6 py-2 rounded bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-700 transition"
                >
                  {nightIndex === null
                    ? "Begin"
                    : nightIndex === 0 && phaseIndex >= NIGHT_CIRCLE_PHASES.length - 1 && displayPhaseTime <= 0
                      ? "Second Night"
                      : "Running"}
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-2 rounded border-2 border-gray-500 text-gray-100 font-semibold bg-gray-700 shadow-lg hover:bg-gray-600 hover:border-gray-400 transition"
                >
                  Reset
                </button>
              </>
            ) : (
              <button
                onClick={handleNewExpedition}
                className="px-8 py-3 rounded bg-blue-600 text-white font-bold text-lg shadow-lg hover:bg-blue-700 transition"
              >
                New Expedition
              </button>
            )}
          </div>
          {isWakeLockSupported && isMobile && (
            <div className="mt-4">
              <button
                onClick={wakeLock ? releaseWakeLock : requestWakeLock}
                className={`px-4 py-2 rounded text-sm font-medium ${wakeLock ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-100 border border-gray-500'}`}
              >
                {wakeLock ? 'Screen Lock Off' : 'Screen Lock On'}
              </button>
            </div>
          )}
        </div>
        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          settings={audioSettings}
          setSettings={setAudioSettings}
        />
      </div>
    </div>
  );
}
