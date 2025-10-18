import { BOSS_LIST } from "../lib/bosses.js";
import { assetUrl } from "../lib/utils.js";
import { CARD_ANIMATION_CLASS } from "../lib/constants.js";

export default function NewExpeditionCard({ setMode, setSelectedBoss }) {
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
                src={assetUrl(boss.img)}
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
