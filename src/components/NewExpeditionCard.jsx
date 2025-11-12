import { BOSS_LIST } from "../lib/bosses.js";
import { assetUrl } from "../lib/utils.js";
import { CARD_ANIMATION_CLASS } from "../lib/constants.js";

export default function NewExpeditionCard({ setMode, setSelectedBoss }) {
  return (
    <div className={`w-full max-w-4xl mx-auto bg-gray-900 shadow-2xl border border-gray-700 flex flex-col items-center ${CARD_ANIMATION_CLASS}`}>
      <div className="flex flex-col w-full">
        {BOSS_LIST.map((boss, index) => (
          <button
            key={boss.expedition_id}
            className={`relative flex items-center justify-start border border-gray-700 hover:border-white transition focus:outline-none overflow-hidden h-20 group z-0 hover:z-10 ${index > 0 ? 'mt-1' : ''}`}
            onClick={() => {
              setSelectedBoss(boss);
              setMode("timer");
            }}
            aria-label={`Select ${boss.expedition_id}`}
            style={{
              backgroundImage: `url(${assetUrl(boss.img)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 20%',
            }}
          >
            <div className="absolute inset-0 bg-black/60 group-hover:bg-black/50 transition"></div>
            <span className="relative z-10 text-2xl font-bold text-white px-6 text-left">{boss.name}</span>
          </button>
        ))}
      </div>
      <button
        className="w-full py-4 bg-gray-700 text-white text-lg font-semibold hover:bg-gray-600 transition border-t border-gray-700"
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
