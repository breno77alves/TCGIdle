(function registerActions(global) {
  const ACTIONS = [
    {
      id: "golpe-do-zefiro",
      name: "Golpe do Zefiro",
      portrait: "Arte/ArtWork/Action/AgulhasDeVento.png",
      tagline: "Pressao veloz para abrir a primeira troca do combate.",
      description: "Aplica 5 de dano base e 10 de dano elemental. Se o atacante passar no check de VL 90, causa mais 5 de dano.",
      role: "tempo",
      damageProfile: {
        base: 5,
        elemental: 10,
      },
      checks: [
        { stat: "speed", threshold: 90, success: { flatDamage: 5, log: "o ritmo do atacante abre mais dano" } },
      ],
    },
    {
      id: "investida-fulminante",
      name: "Investida Fulminante",
      portrait: "Arte/ArtWork/Action/InvestidaFulminante.png",
      tagline: "Explosao de pressao no inicio da ofensiva.",
      description: "Aplica 10 de dano base e 5 de dano verdadeiro. Se o atacante passar no check de PO 95, soma mais 5 de dano.",
      role: "burst",
      damageProfile: {
        base: 10,
        true: 5,
      },
      checks: [
        { stat: "power", threshold: 95, success: { flatDamage: 5, log: "a investida converte Potencia em dano bruto" } },
      ],
    },
    {
      id: "olhar-atento",
      name: "Olhar Atento",
      portrait: "Arte/ArtWork/Action/OlharAtento.png",
      tagline: "Leitura precisa de brechas e ritmos.",
      description: "Aplica 5 de dano base e 5 de dano magico. Se o atacante passar no check de SA 90, soma mais 5 de dano.",
      role: "control",
      damageProfile: {
        base: 5,
        magic: 5,
      },
      checks: [
        { stat: "wisdom", threshold: 90, success: { flatDamage: 5, log: "a leitura perfeita encontra a abertura exata" } },
      ],
    },
    {
      id: "chuva-de-estrelas",
      name: "Chuva de Estrelas",
      portrait: "Arte/ArtWork/Action/ChuvaDeEstrelas.png",
      tagline: "Rajada cosmica para manter dano constante.",
      description: "Aplica 5 de dano base, 5 de dano cosmico e 5 de dano elemental. Se o atacante passar no check de CR 80, soma mais 5 de dano.",
      role: "pressure",
      damageProfile: {
        base: 5,
        cosmic: 5,
        elemental: 5,
      },
      checks: [
        { stat: "courage", threshold: 80, success: { flatDamage: 5, log: "a rajada se sustenta por pura coragem" } },
      ],
    },
    {
      id: "impacto-ardente",
      name: "Impacto Ardente",
      portrait: "Arte/ArtWork/Action/ImpactoArdente.png",
      tagline: "Impacto seco com foco em Potencia.",
      description: "Aplica 10 de dano base. Se o atacante passar no check de PO 100, soma mais 5 de dano.",
      role: "burst",
      damageProfile: {
        base: 10,
      },
      checks: [
        { stat: "power", threshold: 100, success: { flatDamage: 5, log: "o impacto multiplica o pico de Potencia" } },
      ],
    },
    {
      id: "vibora-raivosa",
      name: "Vibora Raivosa",
      portrait: "Arte/ArtWork/Action/ViboraRaivosa.png",
      tagline: "Agressao corrosiva que insiste no atrito.",
      description: "Aplica 5 de dano base, 5 de dano elemental e 5 de dano verdadeiro. Se o atacante passar no check de CR 70, soma mais 5 de dano.",
      role: "pressure",
      damageProfile: {
        base: 5,
        elemental: 5,
        true: 5,
      },
      checks: [
        { stat: "courage", threshold: 70, success: { flatDamage: 5, log: "a criatura insiste no atrito sem recuar" } },
      ],
    },
    {
      id: "poder-da-natureza",
      name: "Poder da Natureza",
      portrait: "Arte/ArtWork/Action/PoderDaNatureza.png",
      tagline: "Escala segura para criaturas mais resistentes.",
      description: "Aplica 5 de dano base e 10 de dano elemental. Se o atacante passar no check de EN 100, soma mais 5 de dano.",
      role: "stability",
      damageProfile: {
        base: 5,
        elemental: 10,
      },
      checks: [
        { stat: "energy", threshold: 100, success: { flatDamage: 5, log: "a reserva de Energia sustenta a investida" } },
      ],
    },
    {
      id: "raio-concentrado",
      name: "Raio Concentrado",
      portrait: "Arte/ArtWork/Action/raioconcentrado.png",
      tagline: "Leitura de alvo com finalizacao limpa.",
      description: "Aplica 5 de dano base e 5 de dano magico. Se o atacante passar no check de SA 75, soma mais 5 de dano.",
      role: "finisher",
      damageProfile: {
        base: 5,
        magic: 5,
      },
      checks: [
        { stat: "wisdom", threshold: 75, success: { flatDamage: 5, log: "a mira se fecha no ponto mais fragil" } },
      ],
    },
  ];

  const STARTER_ACTION_DECK = [
    "golpe-do-zefiro", "golpe-do-zefiro", "investida-fulminante", "olhar-atento", "olhar-atento",
    "chuva-de-estrelas", "impacto-ardente", "vibora-raivosa", "poder-da-natureza", "raio-concentrado",
    "golpe-do-zefiro", "investida-fulminante", "olhar-atento", "chuva-de-estrelas", "impacto-ardente",
    "vibora-raivosa", "poder-da-natureza", "raio-concentrado", "olhar-atento", "golpe-do-zefiro",
  ];

  function getAction(id) {
    return ACTIONS.find((action) => action.id === id) || null;
  }

  global.TCGIdleData = global.TCGIdleData || {};
  global.TCGIdleData.actions = ACTIONS;
  global.TCGIdleData.starterActionDeck = STARTER_ACTION_DECK;
  global.TCGIdleData.getAction = getAction;
})(window);
