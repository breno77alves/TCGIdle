(function registerSpells(global) {
  const SPELLS = [
    {
      id: "visor-do-futuro",
      name: "Visor do Futuro",
      portrait: "Arte/ArtWork/Spells/VisorDoFuturo.png",
      tagline: "Ferramenta de leitura para o duelista antecipar trocas.",
      description: "Ao pagar 10 tokens, aumenta em 5 a margem dos checks de SA enquanto o efeito estiver ativo.",
      role: "utility",
      tokenCost: 10,
      duelModifiers: [{ trigger: "onCheck", stat: "wisdom", thresholdBonus: 5, source: "Visor do Futuro" }],
    },
    {
      id: "primeiros-socorros",
      name: "Primeiros Socorros",
      portrait: "Arte/ArtWork/Spells/PrimeirosSocorros.png",
      tagline: "Recuperacao emergencial em janelas curtas.",
      description: "Ao pagar 5 tokens, reduz em 5 o dano recebido pela criatura protegida enquanto o efeito durar.",
      role: "support",
      tokenCost: 5,
      duelModifiers: [{ trigger: "onDefend", flatMitigation: 5, source: "Primeiros Socorros" }],
    },
    {
      id: "sensor-de-poder",
      name: "Sensor de Poder",
      portrait: "Arte/ArtWork/Spells/SensorDePoder.png",
      tagline: "Leitura de picos de Potencia e resposta rapida.",
      description: "Ao pagar 10 tokens, converte parte da PO em mais 5 de dano por engajamento ofensivo.",
      role: "utility",
      tokenCost: 10,
      duelModifiers: [{ trigger: "onAttack", statScale: [{ stat: "power", ratio: 0.04 }], source: "Sensor de Poder" }],
    },
    {
      id: "troca-emergencial",
      name: "Troca Emergencial",
      portrait: "Arte/ArtWork/Spells/TrocaEmergencial.png",
      tagline: "Reposicionamento urgente quando a linha quebra.",
      description: "Ao pagar 10 tokens, acrescenta 5 de dano quando sua criatura engajar a partir da backline.",
      role: "tempo",
      tokenCost: 10,
      duelModifiers: [{ trigger: "onAttack", lane: "backline", flatDamage: 5, source: "Troca Emergencial" }],
    },
    {
      id: "sorte-de-iniciante",
      name: "Sorte de Iniciante",
      portrait: "Arte/ArtWork/Spells/SorteDeIniciante.png",
      tagline: "Impulso de alto risco em janelas curtas.",
      description: "Ao pagar 15 tokens, aumenta o dano total causado durante o efeito ativo.",
      role: "swing",
      tokenCost: 15,
      duelModifiers: [{ trigger: "onAttack", percentDamage: 0.08, source: "Sorte de Iniciante" }],
    },
    {
      id: "meditador",
      name: "Meditador",
      portrait: "Arte/ArtWork/Spells/Meditador.png",
      tagline: "Foco do duelista para desacelerar o caos da arena.",
      description: "Ao pagar 5 tokens, reforca a defesa convertendo parte da SA em mitigacao enquanto o efeito durar.",
      role: "support",
      tokenCost: 5,
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
