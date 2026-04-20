(function registerEquipment(global) {
  const EQUIPMENT = [
    {
      id: "lamina-da-vanguarda",
      name: "Lamina da Vanguarda",
      portrait: "Arte/ArtWork/Equipment/eternalSword.png",
      tagline: "Arma calibrada para as trocas da linha de frente.",
      description: "Enquanto o portador estiver engajado na frontline, causa mais 5 de dano em cada ataque.",
      role: "offense",
      duelModifiers: [
        { trigger: "onAttack", lane: "frontline", flatDamage: 5, source: "Lamina da Vanguarda" },
      ],
    },
    {
      id: "escudo-de-pedra",
      name: "Escudo de Pedra",
      portrait: "Arte/ArtWork/Equipment/EscudoDePedra.png",
      tagline: "Barreira densa para absorver o primeiro impacto.",
      description: "Enquanto o portador estiver engajado, reduz em 5 o dano recebido.",
      role: "guard",
      duelModifiers: [
        { trigger: "onDefend", flatMitigation: 5, source: "Escudo de Pedra" },
      ],
    },
    {
      id: "visordealcance",
      name: "Visor de Alcance",
      portrait: "Arte/ArtWork/Equipment/visordealcance.png",
      tagline: "Leitura precisa para suportes posicionados atras.",
      description: "Enquanto o portador estiver engajado na backline, converte parte da SA em dano adicional.",
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
      description: "Enquanto o portador estiver engajado, converte parte da VL em dano adicional.",
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
      description: "Enquanto o portador estiver engajado, aumenta em 10 a margem dos checks de SA.",
      role: "mind",
      duelModifiers: [
        { trigger: "onCheck", stat: "wisdom", thresholdBonus: 10, source: "Coroa da Memoria" },
      ],
    },
    {
      id: "nucleo-de-reserva",
      name: "Nucleo de Reserva",
      portrait: "Arte/ArtWork/Equipment/modulodeforca.png",
      tagline: "Reserva de energia para criaturas mais frageis.",
      description: "Enquanto o portador estiver engajado, causa mais 5 de dano em cada troca.",
      role: "battery",
      duelModifiers: [
        { trigger: "onAttack", flatDamage: 5, source: "Nucleo de Reserva" },
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
