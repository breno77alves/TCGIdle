(function registerActions(global) {
  const ACTIONS = [
    {
      id: "golpe-do-zefiro",
      name: "Golpe do Zefiro",
      portrait: "Arte/ArtWork/Action/AgulhasDeVento.png",
      tagline: "Pressao veloz para abrir a primeira troca do combate.",
      description: "A criatura ativa busca prioridade e aumenta a chance de iniciar o intercambio com vantagem.",
      role: "tempo",
      damageProfile: {
        base: 5,
        elemental: [{ element: "air", amount: 7 }],
      },
      checks: [
        { stat: "speed", threshold: 90, success: { flatDamage: 4, log: "o vento responde ao ritmo do atacante" } },
      ],
    },
    {
      id: "investida-fulminante",
      name: "Investida Fulminante",
      portrait: "Arte/ArtWork/Action/InvestidaFulminante.png",
      tagline: "Explosao de pressao no inicio da ofensiva.",
      description: "Foca em atacar cedo para quebrar a estabilidade do oponente.",
      role: "burst",
      damageProfile: {
        base: 8,
        elemental: [{ element: "fire", amount: 9 }],
        true: 2,
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
      description: "Aumenta a consistencia do time em trocas longas e reduz erros de leitura.",
      role: "control",
      damageProfile: {
        base: 4,
        elemental: [{ element: "air", amount: 4 }, { element: "water", amount: 4 }],
        magic: 5,
      },
      checks: [
        { stat: "wisdom", threshold: 90, success: { flatDamage: 6, log: "a leitura perfeita encontra a abertura exata" } },
      ],
    },
    {
      id: "chuva-de-estrelas",
      name: "Chuva de Estrelas",
      portrait: "Arte/ArtWork/Action/ChuvaDeEstrelas.png",
      tagline: "Rajada cosmica para manter dano constante.",
      description: "Distribui pressao ofensiva ao longo do duelo automatico.",
      role: "pressure",
      damageProfile: {
        base: 6,
        cosmic: 5,
        elemental: [{ element: "fire", amount: 4 }, { element: "earth", amount: 4 }],
      },
      checks: [
        { stat: "courage", threshold: 80, success: { flatDamage: 3, log: "a rajada se sustenta por pura coragem" } },
      ],
    },
    {
      id: "impacto-ardente",
      name: "Impacto Ardente",
      portrait: "Arte/ArtWork/Action/ImpactoArdente.png",
      tagline: "Impacto seco com foco em Potencia.",
      description: "Amplifica picos de dano quando a criatura encontra abertura.",
      role: "burst",
      damageProfile: {
        base: 7,
        elemental: [{ element: "fire", amount: 8 }],
      },
      checks: [
        { stat: "power", threshold: 100, success: { flatDamage: 6, log: "o impacto multiplica o pico de Potencia" } },
      ],
    },
    {
      id: "vibora-raivosa",
      name: "Vibora Raivosa",
      portrait: "Arte/ArtWork/Action/ViboraRaivosa.png",
      tagline: "Agressao corrosiva que insiste no atrito.",
      description: "Favorece sequencias de dano em duelos prolongados.",
      role: "pressure",
      damageProfile: {
        base: 5,
        elemental: [{ element: "water", amount: 5 }, { element: "earth", amount: 3 }],
        true: 1,
      },
      checks: [
        { stat: "courage", threshold: 70, success: { flatDamage: 4, log: "a criatura insiste no atrito sem recuar" } },
      ],
    },
    {
      id: "poder-da-natureza",
      name: "Poder da Natureza",
      portrait: "Arte/ArtWork/Action/PoderDaNatureza.png",
      tagline: "Escala segura para criaturas mais resistentes.",
      description: "Empurra a mesa para trocas mais robustas e previsiveis.",
      role: "stability",
      damageProfile: {
        base: 6,
        elemental: [{ element: "earth", amount: 8 }],
      },
      checks: [
        { stat: "energy", threshold: 100, success: { flatDamage: 4, log: "a reserva de Energia sustenta a investida" } },
      ],
    },
    {
      id: "raio-concentrado",
      name: "Raio Concentrado",
      portrait: "Arte/ArtWork/Action/raioconcentrado.png",
      tagline: "Leitura de alvo com finalizacao limpa.",
      description: "Ajuda a concluir abates quando a Energia do alvo cai demais.",
      role: "finisher",
      damageProfile: {
        base: 5,
        elemental: [{ element: "fire", amount: 6 }, { element: "air", amount: 4 }],
        magic: 3,
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
