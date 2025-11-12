import { assetUrl } from "../lib/utils.js";

function BossNegation({ negations, negation }) {
  const negationIcon = assetUrl(`/${negation}.png`);
  return (
    <span className="text-white">
      <img
        src={negationIcon}
        title={negation}
        className="w-8 h-8 object-contain inline-block mr-1"
      />
      <span>{negations[negation]}%</span>
    </span>
  )
}

function BossNegations({ negations }) {
  return (
    <>
      <div className="grid grid-cols-1">
        <span className="text-lg font-semibold text-white text-center">Negations:</span>
        <span className="text-lg font-semibold text-gray-300 text-center">(higher numbers prevent more damage)</span>
      </div>
      <div className="grid grid-cols-4 gap-1">
        <BossNegation negations={negations} negation="standard" />
        <BossNegation negations={negations} negation="slash" />
        <BossNegation negations={negations} negation="strike" />
        <BossNegation negations={negations} negation="pierce" />
        <BossNegation negations={negations} negation="magic" />
        <BossNegation negations={negations} negation="fire" />
        <BossNegation negations={negations} negation="lightning" />
        <BossNegation negations={negations} negation="holy" />
      </div>
    </>
  )
}

function BossResistance({ resistances, resistance }) {
  const resIcon = assetUrl(`/${resistance}.png`);
  const resVal = resistances[resistance]
  const resValText = (resVal != -1) ? resVal : "Immune"
  return (
    <span className="text-white">
      <img
        src={resIcon}
        title={resistance}
        className="w-8 h-8 object-contain inline-block mr-1"
      />
      <span>{resValText}</span>
    </span>
  )
}

function BossResistances({ resistances }) {
  return (
    <>
      <div className="grid grid-cols-1">
        <span className="text-lg font-semibold text-white text-center">Resistances:</span>
        <span className="text-lg font-semibold text-gray-300 text-center">(higher numbers are harder to trigger)</span>
      </div>
      <div className="grid grid-cols-3 gap-1">
        <BossResistance resistances={resistances} resistance="poison" />
        <BossResistance resistances={resistances} resistance="scarletRot" />
        <BossResistance resistances={resistances} resistance="bloodLoss" />
        <BossResistance resistances={resistances} resistance="frostbite" />
        <BossResistance resistances={resistances} resistance="sleep" />
        <BossResistance resistances={resistances} resistance="madness" />
      </div>
    </>
  )
}

import { ExternalLink } from "lucide-react";

export default function BossCard({ boss }) {
  if (!boss) {
    return (
      <div className="flex flex-col items-center justify-center w-48 min-w-[12rem] max-w-[14rem] bg-gray-800 rounded-lg shadow p-4 mr-6 md:mr-6 mb-4 md:mb-0">
        <span className="text-gray-500 text-2xl mb-2">?</span>
        <span className="text-gray-400 font-medium">No Boss Tracked</span>
      </div>
    );
  }
  // Weakness icon path: `/[weakness]-icon.png`
  const weaknessIcon = boss.weakness
    ? assetUrl(`/` + boss.weakness.toLowerCase().replace(/\s+/g, "-") + ".png")
    : null;
  return (
    <div className="flex flex-col items-center justify-center mb-4 md:mb-0 md:mr-10 w-full md:w-auto">
      <img
        src={assetUrl(boss.icon)}
        alt={boss.name}
        className="w-[13.75rem] h-[13.75rem] object-contain mb-4"
        style={{ display: "block" }}
      />
      <div className="flex flex-col md:flex-row items-center justify-center mb-2">
        <span className="text-2xl font-bold text-white">{boss.name}</span>
        {boss.wikiUrl && (
          <a
            href={boss.wikiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-blue-600 text-white rounded px-3 py-1 mt-2 md:mt-0 md:ml-2 hover:bg-blue-700 transition text-sm"
          >
            Wiki
            <ExternalLink className="w-4 h-4 ml-1" />
          </a>
        )}
      </div>
      {boss.weakness && (
        <div className="flex items-center mt-2">
          <span className="text-lg font-semibold text-white mr-2">Weakness:</span>
          <img
            src={weaknessIcon}
            alt={boss.weakness + " icon"}
            className="w-8 h-8 object-contain inline-block"
            style={{ marginRight: "0.25rem" }}
          />
          <span className="text-lg text-white capitalize ml-1">{boss.weakness}</span>
        </div>
      )}
      {boss.res.map((resItem, index) => {
        const partName = Object.keys(resItem)[0];
        const partData = resItem[partName];
        const showPartName = partName !== "all";

        return (
          <div key={index} className="mt-4">
            {showPartName && <h3 className="text-xl font-semibold text-center mb-2 text-white">{partName}</h3>}
            <BossNegations negations={partData.negations} />
            <BossResistances resistances={partData.resistances} />
          </div>
        );
      })}
    </div>
  );
}
