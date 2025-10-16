export const BOSS_LIST = [
  {
    expedition_id: "Tricephalos", weakness: "holy", name: "Gladius, Beast of Night", img: "/gladius-big.png", icon: "/gladius-small.png",
    wikiUrl: "https://eldenringnightreign.wiki.fextralife.com/Gladius+Beast+of+Night",
    res: [
      {
        "all": {
          negations: {
            standard: 0, slash: 0, strike: 0, pierce: -10, magic: 0, fire: 50, lightning: 0, holy: -35,
          },
          resistances: {
            poison: 542, scarletRot: 252, bloodLoss: 252, frostbite: 542, sleep: 154, madness: -1,
          },
        }
      }
    ],
  },
  {
    expedition_id: "Gaping Jaw", weakness: "poison", name: "Adel, Baron of Night", img: "/adel-big.png", icon: "/adel-small.png",
    wikiUrl: "https://eldenringnightreign.wiki.fextralife.com/Adel+Baron+of+Night",
    res: [
      {
        "all": {
          negations: {
            standard: 0, slash: 0, strike: 0, pierce: 0, magic: 0, fire: 20, lightning: 50, holy: 0,
          },
          resistances: {
            poison: 154, scarletRot: 154, bloodLoss: 542, frostbite: 154, sleep: 154, madness: -1,
          },
        }
      }
    ],
  },
  {
    expedition_id: "Fissure in the Fog", weakness: "fire", name: "Caligo, Miasma of Night", img: "/caligo-big.png", icon: "/caligo-small.png",
    wikiUrl: "https://eldenringnightreign.wiki.fextralife.com/Caligo+Miasma+of+Night",
    res: [
      {
        "all": {
          negations: {
            standard: 0, slash: 15, strike: -15, pierce: 10, magic: 20, fire: -35, lightning: 20, holy: 20,
          },
          resistances: {
            poison: 252, scarletRot: 252, bloodLoss: 252, frostbite: 542, sleep: 542, madness: -1,
          },
        }
      }
    ],
  },
  {
    expedition_id: "Augur", weakness: "lightning", name: "Maris, Fathom of Night", img: "/maris-big.png", icon: "/maris-small.png",
    wikiUrl: "https://eldenringnightreign.wiki.fextralife.com/Maris+Fathom+of+Night",
    res: [
      {
        "all": {
          negations: {
            standard: 0, slash: -15, strike: 20, pierce: 10, magic: 20, fire: 50, lightning: -40, holy: 15,
          },
          resistances: {
            poison: -1, scarletRot: 252, bloodLoss: -1, frostbite: 252, sleep: -1, madness: -1,
          },
        }
      }
    ],
  },
  {
    expedition_id: "Sentient Pest", weakness: "fire", name: "Gnoster, Wisdom of Night", img: "/gnoster-big.png", icon: "/gnoster-small.png",
    wikiUrl: "https://eldenringnightreign.wiki.fextralife.com/Gnoster+Wisdom+of+Night",
    res: [
      {
        "Gnoster (Moth)": {
          negations: {
            standard: -15, slash: -25, strike: -15, pierce: -25, magic: 50, fire: -40, lightning: 10, holy: 10,
          },
          resistances: {
            poison: 542, scarletRot: 154, bloodLoss: 154, frostbite: 154, sleep: 542, madness: -1,
          },
        }
      },
      {
        "Faurtis (Scorpion)": {
          negations: {
            standard: 10, slash: 20, strike: -20, pierce: -10, magic: 10, fire: -35, lightning: 10, holy: 10,
          },
          resistances: {
            poison: 252, scarletRot: 154, bloodLoss: 154, frostbite: 154, sleep: 154, madness: -1,
          },
        }
      }
    ],
  },
  {
    expedition_id: "Equilibrious Beast", weakness: "frenzy", name: "Libra, Creature of Night", img: "/libra-big.png", icon: "/libra-small.png",
    wikiUrl: "https://eldenringnightreign.wiki.fextralife.com/Libra+Creature+of+Night",
    res: [
      {
        "all": {
          negations: {
            standard: 0, slash: -10, strike: 0, pierce: 0, magic: 20, fire: -20, lightning: 0, holy: -35,
          },
          resistances: {
            poison: 154, scarletRot: 154, bloodLoss: 252, frostbite: 252, sleep: -1, madness: 154,
          },
        }
      }
    ],
  },
  {
    expedition_id: "Darkdrift Knight", weakness: "lightning", name: "Fulghor, Champion of Nightglow", img: "/fulghor-big.png", icon: "/fulghor-small.png",
    wikiUrl: "https://eldenringnightreign.wiki.fextralife.com/Fulghor+Champion+of+Nightglow",
    res: [
      {
        "all": {
          negations: {
            standard: 0, slash: 0, strike: 0, pierce: 0, magic: 0, fire: 0, lightning: -20, holy: 30,
          },
          resistances: {
            poison: 154, scarletRot: 154, bloodLoss: 154, frostbite: 154, sleep: 154, madness: -1,
          },
        }
      }
    ],
  },
  {
    expedition_id: "Night Aspect", weakness: "holy", name: "Heolstor the Nightlord", img: "/heolstor-big.png", icon: "/heolstor-small.png",
    wikiUrl: "https://eldenringnightreign.wiki.fextralife.com/Heolstor+the+Nightlord",
    res: [
      {
        "Phase 1": {
          negations: {
            standard: 0, slash: -15, strike: 10, pierce: -10, magic: 0, fire: -20, lightning: 0, holy: -35,
          },
          resistances: {
            poison: -1, scarletRot: 252, bloodLoss: -1, frostbite: -1, sleep: 542, madness: -1,
          },
        }
      },
      {
        "Phase 2": {
          negations: {
            standard: 0, slash: 10, strike: -10, pierce: -15, magic: 0, fire: 0, lightning: -20, holy: -20,
          },
          resistances: {
            poison: -1, scarletRot: 252, bloodLoss: -1, frostbite: -1, sleep: 542, madness: -1,
          },
        }
      }
    ],
  },
];
