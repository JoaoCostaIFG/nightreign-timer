import { useEffect, useState } from "react";

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

export default function NightreignTimerApp() {
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

  return (
  <div className="min-h-screen w-screen bg-[#151136] flex flex-col items-center p-4 overflow-x-hidden">
    {header}
    <div className="w-full max-w-4xl flex items-center justify-center">
      <div className="w-full bg-white shadow-lg rounded-lg border border-gray-200 p-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            {/* Moon Image Placeholder */}
            <div className="flex flex-col items-center justify-center">
              <img
                src="/moon.png"
                alt="Dark Moon"
                className="w-64 h-64 object-contain"
              />
            </div>
            <div className="flex flex-col items-center gap-6">
              <div className="text-center">
                {currentNightLabel && (
                  <p className="text-xl font-medium text-black mt-2">
                    {currentNightLabel}
                  </p>
                )}
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
    </div>
  );
}
