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

// --- AUDIO CUE CONFIG ---
const DEFAULT_AUDIO_SETTINGS = {
  mode: "default", // "default" or "custom"
  voice: "Ranni", // Only used in default mode
  enabled: false,
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

const AUDIO_CUE_TEXT = {
  noontideStart: "Noontide is here tarnished, Free Farm Starts Now",
  nightStart: "Night is here tarnished, Circle Closing",
  timeRemaining: (time) => `Only ${time} remaining tarnished`,
};

const DEFAULT_CUE_INTERVALS = [
  { type: "phase", cue: "noontideStart" },
  { type: "phase", cue: "nightStart" },
  { type: "seconds", value: 180, cue: "3min" },
  { type: "seconds", value: 120, cue: "2min" },
  { type: "seconds", value: 60, cue: "1min" },
];

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

// --- AUDIO CUE MANAGER ---
function useAudioCueManager(settings) {
  const playedCuesRef = useRef({}); // { phaseKey: { cueType: true } }

  // Helper to play TTS or audio file
  function playCue(type, timeText = "", options = {}) {
    if (!settings.enabled) return;
    if (settings.mode === "default") {
      // Play audio file for default cues
      let cueFile = null;
      if (type === "noontideStart" || type === "nightStart") {
        cueFile = `/audio/${settings.voice}/${type}.mp3`;
      } else if (type === "3min" || type === "2min" || type === "1min") {
        cueFile = `/audio/${settings.voice}/${type}.mp3`;
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

// --- TIMER LOGIC ---
function useNightreignTimer() {
  // nightIndex: null (pre-start), 0 (first night), 1 (second night)
  const [nightIndex, setNightIndex] = useState(null);
  // phaseIndex: 0 to 3 (see NIGHT_CIRCLE_PHASES)
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseTime, setPhaseTime] = useState(0);
  const [totalNightTime, setTotalNightTime] = useState(TOTAL_NIGHT_TIME);
  const [isPaused, setIsPaused] = useState(true);

  // Audio settings/state
  const [audioSettings] = useState(getStoredAudioSettings());
  const audioCueManager = useAudioCueManager(audioSettings);

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
          const settings = getStoredAudioSettings();

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
              // 3/2/1 min remaining cues
              [
                { value: 180, cue: "3min" },
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
  }, [nightIndex, isPaused, phaseIndex, audioCueManager]);

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

// --- BOSS DATA (for selection) ---
const BOSS_LIST = [
  { expedition_id: "Tricephalos", weakness: "holy", name: "Gladius, Beast of Night", img: "/gladius-big.png", icon: "/gladius-small.png" },
  { expedition_id: "Gaping Jaw", weakness: "poison", name: "Adel, Baron of Night", img: "/adel-big.png" , icon: "/adel-small.png" },
  { expedition_id: "Fissure in the Fog", weakness: "fire", name: "Caligo, Miasma of Night", img: "/caligo-big.png", icon: "/caligo-small.png"  },
  { expedition_id: "Augur", weakness: "lightning", name: "Maris, Fathom of Night", img: "/maris-big.png", icon: "/maris-small.png"  },
  { expedition_id: "Sentient Pest", weakness: "fire", name: "Gnoster, Wisdom of Night", img: "/gnoster-big.png", icon: "/gnoster-small.png"  },
  { expedition_id: "Equilibrious Beast", weakness: "frenzy", name: "Libra, Creature of Night", img: "/libra-big.png", icon: "/libra-small.png"  },
  { expedition_id: "Darkdrift Knight", weakness: "lightning", name: "Fulghor, Champion of Nightglow", img: "/fulghor-big.png", icon: "/fulghor-small.png"  },
  { expedition_id: "Night Aspect", weakness: "holy", name: "Heolstor the Nightlord", img: "/heolstor-big.png", icon: "/heolstor-small.png"  },
];

// --- CARD ANIMATION HELPERS (simple CSS classes) ---
const CARD_ANIMATION_CLASS = "transition-all duration-500 ease-in-out";

// --- MAIN APP ---
export default function NightreignTimerApp() {
  // --- Multi-step state ---
  // "landing" | "new-expedition" | "timer"
  const [mode, setMode] = useState("landing");
  const [selectedBoss, setSelectedBoss] = useState(null);

  // --- AUDIO CUE STATE ---
  const [audioSettings, setAudioSettings] = useState(getStoredAudioSettings());
  useEffect(() => { setStoredAudioSettings(audioSettings); }, [audioSettings]);

  // --- SETTINGS MODAL STATE ---
  const [settingsOpen, setSettingsOpen] = useState(false);

  // --- Timer state (moved from previous default export) ---
  // ...existing timer logic, unchanged...
  // (move all timer logic here, or extract to a TimerCard component if desired)
  // For brevity, I'll keep it inline for now.

  // --- UI: Landing Page ---
  function LandingCard() {
    return (
      <div className={`flex flex-col items-center justify-center w-full h-[70vh] ${CARD_ANIMATION_CLASS}`}>
        <button
          className="flex items-center gap-4 px-14 py-8 rounded-2xl bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 text-black text-3xl font-extrabold shadow-2xl border-4 border-yellow-900 hover:scale-105 hover:from-yellow-200 hover:to-yellow-600 transition-all duration-200 tracking-wide"
          onClick={() => setMode("new-expedition")}
          aria-label="New Expedition"
          style={{
            fontFamily: "'Cinzel', serif",
            letterSpacing: "0.05em",
            boxShadow: "0 8px 32px 0 rgba(0,0,0,0.25)",
          }}
        >
          <span className="inline-block bg-black text-yellow-300 rounded-full w-10 h-10 flex items-center justify-center mr-3 text-3xl font-extrabold border-2 border-yellow-700 shadow">
            +
          </span>
          New Expedition
        </button>
      </div>
    );
  }

  // --- UI: Boss Selection Card ---
  function NewExpeditionCard() {
    return (
      <div className={`w-full max-w-7xl mx-auto bg-white shadow-2xl rounded-2xl border border-gray-200 p-16 flex flex-col items-center ${CARD_ANIMATION_CLASS}`}>
        <h2 className="text-4xl font-bold mb-12 text-black">New Expedition</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-14 mb-12 w-full">
          {BOSS_LIST.map((boss) => (
            <button
              key={boss.expedition_id}
              className="flex flex-col items-center bg-gray-100 rounded-2xl border-2 border-transparent hover:border-black transition focus:outline-none p-6"
              onClick={() => {
                setSelectedBoss(boss);
                setMode("timer");
              }}
              aria-label={`Select ${boss.expedition_id}`}
              style={{ background: "" }}
            >
              <div className="flex items-center justify-center w-full" style={{ minHeight: "16rem", maxHeight: "22rem" }}>
                <img
                  src={boss.img}
                  alt={boss.name}
                  className="max-w-full max-h-[22rem] object-contain rounded-2xl shadow-2xl bg-black transition-transform duration-200 hover:scale-105"
                  style={{ display: "block" }}
                />
              </div>
              <span className="text-2xl font-semibold text-black mt-4 text-center">{boss.name}</span>
            </button>
          ))}
        </div>
        <button
          className="mt-6 px-10 py-4 rounded bg-gray-300 text-black text-xl font-semibold shadow hover:bg-gray-400 transition"
          onClick={() => {
            setSelectedBoss(null);
            setMode("timer");
          }}
        >
          Don't Track
        </button>
      </div>
    );
  }

  // --- UI: Boss Card (for timer view) ---
  function BossCard({ boss }) {
    if (!boss) {
      return (
        <div className="flex flex-col items-center justify-center w-48 min-w-[12rem] max-w-[14rem] bg-gray-50 rounded-lg shadow p-4 mr-6 md:mr-6 mb-4 md:mb-0">
          <span className="text-gray-400 text-2xl mb-2">?</span>
          <span className="text-gray-500 font-medium">No Boss Tracked</span>
        </div>
      );
    }
    // Weakness icon path: `/[weakness]-icon.png`
    const weaknessIcon = boss.weakness
      ? `/` + boss.weakness.toLowerCase().replace(/\s+/g, "-") + ".png"
      : null;
    return (
      <div className="flex flex-col items-center justify-center mb-4 md:mb-0 md:mr-10 w-full md:w-auto">
        <img
          src={boss.icon}
          alt={boss.name}
          className="w-[12rem] h-[12rem] md:w-[20rem] md:h-[20rem] object-contain rounded-2xl shadow-2xl bg-black mb-4"
          style={{ display: "block" }}
        />
        <span className="text-2xl font-bold text-black text-center mb-2">{boss.name}</span>
        {boss.weakness && (
          <div className="flex items-center mt-2">
            <span className="text-lg font-semibold text-gray-700 mr-2">Weakness:</span>
            <img
              src={weaknessIcon}
              alt={boss.weakness + " icon"}
              className="w-8 h-8 object-contain inline-block"
              style={{ marginRight: "0.25rem" }}
            />
            <span className="text-lg text-gray-800 capitalize ml-1">{boss.weakness}</span>
          </div>
        )}
      </div>
    );
  }

  // --- Timer Card Layout (with boss card) ---
  function TimerCard(props) {
    // ...existing timer state and logic...
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

    // Use settingsOpen and setSettingsOpen from props
    const { settingsOpen, setSettingsOpen } = props;

    // --- After timer ends, show "New Expedition" button only after night 2 is done ---
    const timerDone =
      nightIndex === 1 &&
      phaseIndex >= NIGHT_CIRCLE_PHASES.length - 1 &&
      displayPhaseTime <= 0;

    // --- Button handlers ---
    function handleNewExpedition() {
      setMode("new-expedition");
      setSelectedBoss(null);
      reset();
    }

    return (
      <div className={`w-full max-w-4xl flex flex-col md:flex-row items-center md:items-start justify-center ${CARD_ANIMATION_CLASS}`}>
        <div className="w-full bg-white shadow-lg rounded-lg border border-gray-200 p-8 relative flex flex-col md:flex-row items-center md:items-start">
          {/* Boss Card (left/top on mobile) */}
          <BossCard boss={selectedBoss} />
          {/* Timer UI (right/bottom on mobile) */}
          <div className="flex-1 flex flex-col items-center w-full">
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
            <div className="flex flex-col md:flex-row items-start md:items-center justify-center md:justify-center gap-0 w-full">
              {/* Night label above timeline circle */}
              <div className="flex flex-col items-center justify-center w-full">
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
              {!timerDone ? (
                <>
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
                  <button
                    onClick={reset}
                    className="px-6 py-2 rounded border border-black text-black font-semibold bg-white shadow hover:bg-gray-100 transition"
                  >
                    Reset
                  </button>
                </>
              ) : (
                <button
                  onClick={handleNewExpedition}
                  className="px-8 py-3 rounded bg-black text-white font-bold text-lg shadow hover:bg-gray-800 transition"
                >
                  New Expedition
                </button>
              )}
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
      </div>
    );
  }

  // --- Main Render ---
  const header = (
    <div className="w-full flex justify-center mb-6">
      <img
        src="/nightreign-timer-banner.png"
        alt="Nightreign Timer"
        className="w-[250px] md:w-[300px] max-w-full drop-shadow-lg cursor-pointer"
        draggable={false}
        onClick={() => setMode("landing")}
      />
    </div>
  );

  return (
    <div className="min-h-screen w-screen bg-[#151136] flex flex-col items-center p-4 overflow-x-hidden">
      {header}
      {/* Card transitions */}
      <div className="w-full flex flex-col items-center justify-center flex-1">
        {mode === "landing" && <LandingCard />}
        {mode === "new-expedition" && <NewExpeditionCard />}
        {mode === "timer" && (
          <TimerCard
            settingsOpen={settingsOpen}
            setSettingsOpen={setSettingsOpen}
          />
        )}
      </div>
      {/* Footer */}
      <footer className="w-full flex justify-center items-center gap-6 mt-8 p-4 bg-[#0f0d29]">
        <a
          href="https://discord.gg/3qVv7CGeJF"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Join our Discord"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-8 h-8 hover:scale-110 transition-transform text-white"
          >
            <path d="M20.317 4.369a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.444.864-.608 1.249a18.27 18.27 0 0 0-5.462 0 12.505 12.505 0 0 0-.617-1.249.077.077 0 0 0-.079-.037 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C2.533 9.042 1.8 13.566 2.092 18.057a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.038.077.077 0 0 0 .084-.027c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.105 13.184 13.184 0 0 1-1.872-.9.077.077 0 0 1-.008-.128c.126-.094.252-.192.373-.291a.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.062 0a.073.073 0 0 1 .078.009c.121.099.247.197.373.291a.077.077 0 0 1-.006.128 12.509 12.509 0 0 1-1.873.899.076.076 0 0 0-.04.106c.36.699.772 1.364 1.226 1.993a.076.076 0 0 0 .084.028 19.876 19.876 0 0 0 6.002-3.038.076.076 0 0 0 .031-.056c.334-5.068-.559-9.544-2.349-13.661a.062.062 0 0 0-.031-.028zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.213 0 2.176 1.096 2.157 2.419 0 1.334-.955 2.419-2.157 2.419zm7.96 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.213 0 2.176 1.096 2.157 2.419 0 1.334-.944 2.419-2.157 2.419z" />
          </svg>
        </a>
        <a
          href="https://github.com/bnelz/nightreign-timer"
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

// ...existing code for useNightreignTimer, useAudioCue, etc...
