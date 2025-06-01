import { useEffect, useState } from "react";

// --- NIGHT PHASE CONFIG ---
const NIGHT_PHASES = [
  {
    name: "First Night",
    initialDelay: 270, // 4.5 minutes
    closeDuration: 180, // 3 minutes
  },
  {
    name: "Second Night",
    initialDelay: 210, // 3.5 minutes
    closeDuration: 180, // 3 minutes
  },
];

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function useNightreignTimer() {
  const [phaseIndex, setPhaseIndex] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [phaseStage, setPhaseStage] = useState("delay");

  useEffect(() => {
    let timer = null;
    if (phaseIndex !== null && !isPaused && phaseStage !== "done") {
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (phaseStage === "delay") {
              setPhaseStage("closing");
              return NIGHT_PHASES[phaseIndex].closeDuration;
            } else if (phaseStage === "closing") {
              setPhaseStage("done");
              setIsPaused(true);
              return 0;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => timer && clearInterval(timer);
  }, [phaseIndex, isPaused, phaseStage]);

  const begin = () => {
    if (phaseIndex === null) {
      setPhaseIndex(0);
      setPhaseStage("delay");
      setTimeRemaining(NIGHT_PHASES[0].initialDelay);
      setIsPaused(false);
    } else if (phaseIndex === 0 && phaseStage === "done") {
      setPhaseIndex(1);
      setPhaseStage("delay");
      setTimeRemaining(NIGHT_PHASES[1].initialDelay);
      setIsPaused(false);
    }
  };

  const reset = () => {
    setPhaseIndex(null);
    setTimeRemaining(0);
    setIsPaused(true);
    setPhaseStage("delay");
  };

  return {
    phaseIndex,
    timeRemaining,
    phaseStage,
    begin,
    reset,
  };
}

export default function NightreignTimerApp() {
  const { phaseIndex, timeRemaining, phaseStage, begin, reset } =
    useNightreignTimer();

  const firstNightTime =
    phaseIndex === 0 ? timeRemaining : phaseIndex === 1 ? 0 : 14 * 60;
  const secondNightTime =
    phaseIndex === 1 ? timeRemaining : phaseIndex === 0 ? 14 * 60 : 0;

  return (
    <div className="min-h-screen w-screen bg-[#151136] flex items-center justify-center p-4 overflow-x-hidden">
      <div className="w-full max-w-4xl flex items-center justify-center">
        <div className="w-full bg-white shadow-lg rounded-lg border border-gray-200 p-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            {/* Moon Image Placeholder */}
            <div className="flex flex-col items-center justify-center">
              <img
                src="/moon.png"
                alt="Dark Moon"
                className="w-48 h-48 object-contain"
              />
            </div>
            <div className="flex flex-col items-center">
              <div className="mb-6 text-center">
                <h2 className="text-xl font-semibold text-black">First Night</h2>
                <p className="text-3xl font-mono mt-1 text-black">{formatTime(firstNightTime)}</p>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-black">Second Night</h2>
                <p className="text-3xl font-mono mt-1 text-black">{formatTime(secondNightTime)}</p>
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-center gap-4">
            {phaseIndex !== 1 || phaseStage !== "done" ? (
              <button
                onClick={begin}
                className="px-6 py-2 rounded bg-black text-white font-semibold shadow hover:bg-gray-800 transition"
              >
                {phaseIndex === null
                  ? "Begin"
                  : phaseIndex === 0 && phaseStage === "done"
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
