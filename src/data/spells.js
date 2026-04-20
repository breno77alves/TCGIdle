(function registerSpells(global) {
  const SPELLS = [
    {
      id: "visor-do-futuro",
      name: "Visor do Futuro",
      portrait: "Arte/ArtWork/Spells/VisorDoFuturo.png",
      tagline: "Ferramenta de leitura para o duelista antecipar trocas.",
      description: "Item ativo voltado a leitura tatica e ajustes de momento durante a batalha.",
      role: "utility",
      duelModifiers: [{ trigger: "onCheck", stat: "wisdom", thresholdBonus: 6, source: "Visor do Futuro" }],
    },
    {
      id: "primeiros-socorros",
      name: "Primeiros Socorros",
      portrait: "Arte/ArtWork/Spells/PrimeirosSocorros.png",
      tagline: "Recuperacao emergencial em janelas curtas.",
      description: "Item ativo de suporte para preservar criaturas sob pressao.",
      role: "support",
      duelModifiers: [{ trigger: "onDefend", flatMitigation: 2, source: "Primeiros Socorros" }],
    },
    {
      id: "sensor-de-poder",
      name: "Sensor de Poder",
      portrait: "Arte/ArtWork/Spells/SensorDePoder.png",
      tagline: "Leitura de picos de Potencia e resposta rapida.",
      description: "Ajuda o jogador a sincronizar recursos ativos com o fluxo do duelo.",
      role: "utility",
      duelModifiers: [{ trigger: "onAttack", statScale: [{ stat: "power", ratio: 0.04 }], source: "Sensor de Poder" }],
    },
    {
      id: "troca-emergencial",
      name: "Troca Emergencial",
      portrait: "Arte/ArtWork/Spells/TrocaEmergencial.png",
      tagline: "Reposicionamento urgente quando a linha quebra.",
      description: "Item ativo para momentos de desvantagem tensa.",
      role: "tempo",
      duelModifiers: [{ trigger: "onAttack", lane: "backline", flatDamage: 2, source: "Troca Emergencial" }],
    },
    {
      id: "sorte-de-iniciante",
      name: "Sorte de Iniciante",
      portrait: "Arte/ArtWork/Spells/SorteDeIniciante.png",
      tagline: "Impulso de alto risco em janelas curtas.",
      description: "Aposta tensa que favorece viradas improvaveis.",
      role: "swing",
      duelModifiers: [{ trigger: "onAttack", percentDamage: 0.08, source: "Sorte de Iniciante" }],
    },
    {
      id: "meditador",
      name: "Meditador",
      portrait: "Arte/ArtWork/Spells/Meditador.png",
      tagline: "Foco do duelista para desacelerar o caos da arena.",
      description: "Item ativo para estabilizar o campo e recuperar controle.",
      role: "support",
      duelModifiers: [{ trigger: "onDefend", statScale: [{ stat: "wisdom", ratio: 0.04 }], source: "Meditador" }],
    },
  ];

  const STARTER_SPELL_DECK = [
    "visor-do-futuro",
    "primeiros-socorros",
    "sensor-de-poder",
    "troca-emergencial",
    "sorte-de-iniciante",
    "meditador",
  ];

  function getSpell(id) {
    return SPELLS.find((spell) => spell.id === id) || null;
  }

  global.TCGIdleData = global.TCGIdleData || {};
  global.TCGIdleData.spells = SPELLS;
  global.TCGIdleData.starterSpellDeck = STARTER_SPELL_DECK;
  global.TCGIdleData.getSpell = getSpell;
})(window);
