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

    // ...existing audio cue logic...

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
    </div>
  );
}

// ...existing code for useNightreignTimer, useAudioCue, etc...
