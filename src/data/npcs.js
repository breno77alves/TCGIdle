(function registerNpcs(global) {
  function starterStats(baseId) {
    const starterDeck = (global.TCGIdleData && global.TCGIdleData.starterDeck) || [];
    const match = starterDeck.find((entry) => entry.baseId === baseId);
    return match ? Object.assign({}, match.stats) : { courage: 60, power: 60, wisdom: 60, speed: 60, energy: 90 };
  }

  function scaleStats(baseId, multiplier, flatEnergy) {
    const base = starterStats(baseId);
    return {
      courage: Math.round(base.courage * multiplier),
      power: Math.round(base.power * multiplier),
      wisdom: Math.round(base.wisdom * multiplier),
      speed: Math.round(base.speed * multiplier),
      energy: Math.round(base.energy * multiplier) + (flatEnergy || 0),
    };
  }

  function buildDeck(baseIds, multiplier, flatEnergy) {
    return baseIds.map((baseId) => ({
      baseId: baseId,
      stats: scaleStats(baseId, multiplier, flatEnergy),
    }));
  }

  const NPCS = [
    {
      id: "vinsmor-aprendiz",
      name: "Vinsmor, o Tutor de Rota",
      portrait: "Arte/ArtWork/Champion/VinsmorTheSummoner.png",
      tagline: "Duelo introdutorio para consolidar a leitura da sua formacao.",
      zone: "limiar-de-aurin",
      difficulty: 1,
      special: false,
      deck: buildDeck(["belmon", "hirum", "kirr", "samish", "belmon", "kirr"], 0.9, -4),
      rewards: {
        essence: 2,
      },
    },
    {
      id: "vinsmor",
      name: "Vinsmor, o Convocador",
      portrait: "Arte/ArtWork/Champion/VinsmorTheSummoner.png",
      tagline: "Convocador veterano que pune erros de ritmo no Limiar.",
      zone: "limiar-de-aurin",
      difficulty: 1,
      special: false,
      deck: buildDeck(["belmon", "hirum", "grimodari", "ygar", "kirr", "samish"], 1, 0),
      rewards: {
        essence: 3,
      },
    },
    {
      id: "talren",
      name: "Talren, a Cartografa de Ynmar",
      portrait: "Arte/ArtWork/Champion/Mereditha.png",
      tagline: "Especialista em pressao de velocidade e controle de leitura.",
      zone: "passagem-de-ynmar",
      difficulty: 2,
      special: false,
      deck: buildDeck(["hirum", "kirr", "samish", "hirum", "kirr", "belmon"], 1.1, 8),
      rewards: {
        essence: 5,
      },
    },
    {
      id: "serka",
      name: "Serka, Mare de Mifnar",
      portrait: "Arte/ArtWork/Champion/Mistif.png",
      tagline: "Controla trocas longas e pressiona quem subestima Energia.",
      zone: "praia-de-mifnar",
      difficulty: 2,
      special: false,
      deck: buildDeck(["samish", "ygar", "belmon", "samish", "grimodari", "hirum"], 1.14, 10),
      rewards: {
        essence: 5,
      },
    },
    {
      id: "orvath",
      name: "Orvath, Regente da Colonia",
      portrait: "Arte/ArtWork/Champion/ZartorianTheSummoner.png",
      tagline: "Linha pesada com dano sustentado e pouca margem para erro.",
      zone: "colonia-de-reinos",
      difficulty: 3,
      special: false,
      deck: buildDeck(["grimodari", "ygar", "belmon", "grimodari", "samish", "kirr"], 1.24, 14),
      rewards: {
        essence: 8,
      },
    },
    {
      id: "nyra",
      name: "Nyra, Eco do Cosmos",
      portrait: "Arte/ArtWork/Champion/VizAndTurn.png",
      tagline: "Confronto de elite com picos de dano e resiliencia muito altos.",
      zone: "profundeza-do-cosmos",
      difficulty: 4,
      special: false,
      deck: buildDeck(["grimodari", "ygar", "kirr", "samish", "belmon", "hirum"], 1.34, 18),
      rewards: {
        essence: 11,
      },
    },
    {
      id: "limiar-exaltado",
      name: "Prova Especial do Limiar",
      portrait: "Arte/ArtWork/Champion/KeerlTheSummon.png",
      tagline: "Duelo especial de dificuldade 1 que premia um scan raro.",
      zone: "limiar-de-aurin",
      difficulty: 1,
      special: true,
      deck: buildDeck(["belmon", "kirr", "hirum", "samish", "belmon", "kirr"], 1.06, 6),
      rewards: {
        essence: 6,
        rewardPool: [
          { cardType: "location", baseId: "passagem-de-ynmar" },
          { cardType: "creature", baseId: "kirr" },
        ],
      },
    },
    {
      id: "mare-rara",
      name: "Prova Especial da Mare",
      portrait: "Arte/ArtWork/Champion/MintTheDuck.png",
      tagline: "Duelo especial de dificuldade 2 com leitura agressiva de velocidade.",
      zone: "praia-de-mifnar",
      difficulty: 2,
      special: true,
      deck: buildDeck(["samish", "hirum", "kirr", "ygar", "samish", "belmon"], 1.2, 12),
      rewards: {
        essence: 9,
        rewardPool: [
          { cardType: "location", baseId: "colonia-de-reinos" },
          { cardType: "creature", baseId: "samish" },
        ],
      },
    },
    {
      id: "trono-da-colonia",
      name: "Prova Especial da Colonia",
      portrait: "Arte/ArtWork/Champion/Tribaltar.png",
      tagline: "Duelo especial de dificuldade 3 para scans de dominio.",
      zone: "colonia-de-reinos",
      difficulty: 3,
      special: true,
      deck: buildDeck(["grimodari", "ygar", "belmon", "grimodari", "samish", "ygar"], 1.3, 18),
      rewards: {
        essence: 13,
        rewardPool: [
          { cardType: "location", baseId: "profundeza-do-cosmos" },
          { cardType: "creature", baseId: "grimodari" },
        ],
      },
    },
    {
      id: "nucleo-cosmico",
      name: "Prova Especial do Cosmos",
      portrait: "Arte/ArtWork/Champion/UnstoppableVizurn.png",
      tagline: "Duelo especial maximo com recompensa de elite.",
      zone: "profundeza-do-cosmos",
      difficulty: 4,
      special: true,
      deck: buildDeck(["grimodari", "ygar", "kirr", "samish", "belmon", "hirum"], 1.42, 22),
      rewards: {
        essence: 18,
        rewardPool: [
          { cardType: "creature", baseId: "ygar" },
          { cardType: "creature", baseId: "grimodari" },
        ],
      },
    },
  ];

  function getNpc(id) {
    return NPCS.find((npc) => npc.id === id) || null;
  }

  global.TCGIdleData = global.TCGIdleData || {};
  global.TCGIdleData.npcs = NPCS;
  global.TCGIdleData.getNpc = getNpc;
})(window);
