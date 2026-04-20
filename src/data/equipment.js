(function registerEquipment(global) {
  const EQUIPMENT = [
    {
      id: "lamina-da-vanguarda",
      name: "Lamina da Vanguarda",
      portrait: "Arte/ArtWork/Equipment/eternalSword.png",
      tagline: "Arma calibrada para as trocas da linha de frente.",
      description: "Reforca ataques de criaturas posicionadas na vanguarda.",
      role: "offense",
      duelModifiers: [
        { trigger: "onAttack", lane: "frontline", flatDamage: 4, source: "Lamina da Vanguarda" },
      ],
    },
    {
      id: "escudo-de-pedra",
      name: "Escudo de Pedra",
      portrait: "Arte/ArtWork/Equipment/EscudoDePedra.png",
      tagline: "Barreira densa para absorver o primeiro impacto.",
      description: "Melhora a mitigacao do usuario contra golpes pesados.",
      role: "guard",
      duelModifiers: [
        { trigger: "onDefend", flatMitigation: 4, source: "Escudo de Pedra" },
      ],
    },
    {
      id: "visordealcance",
      name: "Visor de Alcance",
      portrait: "Arte/ArtWork/Equipment/visordealcance.png",
      tagline: "Leitura precisa para suportes posicionados atras.",
      description: "Favorece checks de Sabedoria e dano de criaturas na retaguarda.",
      role: "support",
      duelModifiers: [
        { trigger: "onAttack", lane: "backline", statScale: [{ stat: "wisdom", ratio: 0.08 }], source: "Visor de Alcance" },
      ],
    },
    {
      id: "propulsor-cinetico",
      name: "Propulsor Cinetico",
      portrait: "Arte/ArtWork/Equipment/PropulsorGravitacional.png",
      tagline: "Arranque instantaneo para unidades velozes.",
      description: "Converte parte da Velocidade em dano e iniciativa.",
      role: "tempo",
      duelModifiers: [
        { trigger: "onAttack", statScale: [{ stat: "speed", ratio: 0.06 }], source: "Propulsor Cinetico" },
      ],
    },
    {
      id: "coroa-da-memoria",
      name: "Coroa da Memoria",
      portrait: "Arte/ArtWork/Equipment/coroadarainha.png",
      tagline: "Catalisador para checks de leitura e mente.",
      description: "Aumenta a margem de sucesso de acoes baseadas em Sabedoria.",
      role: "mind",
      duelModifiers: [
        { trigger: "onCheck", stat: "wisdom", thresholdBonus: 8, source: "Coroa da Memoria" },
      ],
    },
    {
      id: "nucleo-de-reserva",
      name: "Nucleo de Reserva",
      portrait: "Arte/ArtWork/Equipment/modulodeforca.png",
      tagline: "Reserva de energia para criaturas mais frageis.",
      description: "Concede um pequeno reforco de Energia ao entrar no duelo.",
      role: "battery",
      duelModifiers: [
        { trigger: "startOfBattle", bonusEnergy: 12, source: "Nucleo de Reserva" },
      ],
    },
  ];

  const STARTER_EQUIPMENT_DECK = [
    "lamina-da-vanguarda",
    "escudo-de-pedra",
    "visordealcance",
    "propulsor-cinetico",
    "coroa-da-memoria",
    "nucleo-de-reserva",
  ];

  function getEquipment(id) {
    return EQUIPMENT.find((entry) => entry.id === id) || null;
  }

  global.TCGIdleData = global.TCGIdleData || {};
  global.TCGIdleData.equipment = EQUIPMENT;
  global.TCGIdleData.starterEquipmentDeck = STARTER_EQUIPMENT_DECK;
  global.TCGIdleData.getEquipment = getEquipment;
})(window);
