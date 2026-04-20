(function registerCreatures(global) {
  const CREATURES = [
    {
      id: "belmon",
      name: "Belmon",
      tribe: "solari",
      combatTags: ["frontline", "guardian"],
      portrait: "Arte/ArtWork/Champion/Belmon.png",
      passives: [{ trigger: "onDefend", lane: "frontline", flatMitigation: 5, source: "Juramento Inquebravel" }],
      tokenCount: 2,
      damageProfile: {
        base: 5,
        true: 5,
      },
      tagline: "Cavaleiro solar de juramento inquebrável.",
      ranges: {
        courage: [85, 125],
        power: [55, 80],
        wisdom: [40, 65],
        speed: [45, 70],
        energy: [85, 115],
      },
    },
    {
      id: "hirum",
      name: "Hirum",
      tribe: "solari",
      combatTags: ["frontline", "skirmisher"],
      portrait: "Arte/ArtWork/Champion/Hirum.png",
      passives: [{ trigger: "onAttack", statScale: [{ stat: "speed", ratio: 0.05 }], source: "Passo do Sentinela" }],
      tokenCount: 1,
      damageProfile: {
        base: 5,
        elemental: 5,
      },
      tagline: "Sentinela das colinas ao amanhecer.",
      ranges: {
        courage: [80, 120],
        power: [50, 75],
        wisdom: [45, 70],
        speed: [55, 85],
        energy: [80, 110],
      },
    },
    {
      id: "grimodari",
      name: "Grimodari",
      tribe: "umbrae",
      combatTags: ["frontline", "bruiser"],
      portrait: "Arte/ArtWork/Champion/Grimodari.png",
      passives: [{ trigger: "onAttack", statScale: [{ stat: "power", ratio: 0.06 }], source: "Pressao de Aco" }],
      tokenCount: 1,
      damageProfile: {
        base: 5,
        elemental: 5,
      },
      tagline: "Colosso de ferro negro forjado em câmaras profundas.",
      ranges: {
        courage: [45, 70],
        power: [95, 135],
        wisdom: [55, 80],
        speed: [30, 55],
        energy: [95, 125],
      },
    },
    {
      id: "ygar",
      name: "Ygar",
      tribe: "umbrae",
      combatTags: ["frontline", "berserker"],
      portrait: "Arte/ArtWork/Champion/Ygar.png",
      passives: [{ trigger: "onAttack", flatDamage: 5, source: "Fornalha Interna" }],
      tokenCount: 2,
      damageProfile: {
        base: 5,
        elemental: 5,
        true: 5,
      },
      tagline: "Bruto que canaliza fornalhas subterrâneas.",
      ranges: {
        courage: [50, 75],
        power: [90, 125],
        wisdom: [45, 70],
        speed: [40, 65],
        energy: [90, 120],
      },
    },
    {
      id: "kirr",
      name: "Kirr",
      tribe: "nomads",
      combatTags: ["backline", "assassin"],
      portrait: "Arte/ArtWork/Champion/Kirr.png",
      passives: [{ trigger: "onAttack", lane: "backline", statScale: [{ stat: "speed", ratio: 0.07 }], source: "Mapa de Vento" }],
      tokenCount: 1,
      damageProfile: {
        base: 5,
        elemental: 5,
        cosmic: 5,
      },
      tagline: "Batedor que lê o vento como mapa.",
      ranges: {
        courage: [55, 80],
        power: [45, 70],
        wisdom: [55, 80],
        speed: [95, 135],
        energy: [60, 90],
      },
    },
    {
      id: "samish",
      name: "Samish",
      tribe: "hivekin",
      combatTags: ["backline", "support"],
      portrait: "Arte/ArtWork/Champion/Samish.png",
      passives: [{ trigger: "onAttack", lane: "backline", statScale: [{ stat: "wisdom", ratio: 0.08 }], source: "Memoria Coletiva" }],
      tokenCount: 3,
      damageProfile: {
        base: 5,
        elemental: 5,
        magic: 5,
      },
      tagline: "Arquivista da colmeia, memória coletiva da tribo.",
      ranges: {
        courage: [40, 65],
        power: [55, 80],
        wisdom: [90, 125],
        speed: [50, 75],
        energy: [75, 105],
      },
    },
  ];

  const STARTER_DECK = [
    {
      baseId: "belmon",
      stats: { courage: 105, power: 65, wisdom: 50, speed: 55, energy: 100 },
    },
    {
      baseId: "hirum",
      stats: { courage: 100, power: 60, wisdom: 55, speed: 70, energy: 95 },
    },
    {
      baseId: "grimodari",
      stats: { courage: 55, power: 115, wisdom: 65, speed: 40, energy: 110 },
    },
    {
      baseId: "ygar",
      stats: { courage: 60, power: 105, wisdom: 55, speed: 50, energy: 105 },
    },
    {
      baseId: "kirr",
      stats: { courage: 65, power: 55, wisdom: 65, speed: 115, energy: 75 },
    },
    {
      baseId: "samish",
      stats: { courage: 50, power: 65, wisdom: 105, speed: 60, energy: 90 },
    },
  ];

  function getCreature(id) {
    return CREATURES.find((creature) => creature.id === id) || null;
  }

  global.TCGIdleData = global.TCGIdleData || {};
  global.TCGIdleData.creatures = CREATURES;
  global.TCGIdleData.starterDeck = STARTER_DECK;
  global.TCGIdleData.getCreature = getCreature;
})(window);
