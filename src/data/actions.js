(function registerActions(global) {
  const ACTIONS = [
    {
      id: "golpe-do-zefiro",
      name: "Golpe do Zefiro",
      portrait: "Arte/ArtWork/Action/AgulhasDeVento.png",
      tagline: "Pressao veloz para abrir a primeira troca do combate.",
      description: "A criatura ativa busca prioridade e aumenta a chance de iniciar o intercambio com vantagem.",
      role: "tempo",
    },
    {
      id: "investida-fulminante",
      name: "Investida Fulminante",
      portrait: "Arte/ArtWork/Action/InvestidaFulminante.png",
      tagline: "Explosao de pressao no inicio da ofensiva.",
      description: "Foca em atacar cedo para quebrar a estabilidade do oponente.",
      role: "burst",
    },
    {
      id: "olhar-atento",
      name: "Olhar Atento",
      portrait: "Arte/ArtWork/Action/OlharAtento.png",
      tagline: "Leitura precisa de brechas e ritmos.",
      description: "Aumenta a consistencia do time em trocas longas e reduz erros de leitura.",
      role: "control",
    },
    {
      id: "chuva-de-estrelas",
      name: "Chuva de Estrelas",
      portrait: "Arte/ArtWork/Action/ChuvaDeEstrelas.png",
      tagline: "Rajada cosmica para manter dano constante.",
      description: "Distribui pressao ofensiva ao longo do duelo automatico.",
      role: "pressure",
    },
    {
      id: "impacto-ardente",
      name: "Impacto Ardente",
      portrait: "Arte/ArtWork/Action/ImpactoArdente.png",
      tagline: "Impacto seco com foco em Potencia.",
      description: "Amplifica picos de dano quando a criatura encontra abertura.",
      role: "burst",
    },
    {
      id: "vibora-raivosa",
      name: "Vibora Raivosa",
      portrait: "Arte/ArtWork/Action/ViboraRaivosa.png",
      tagline: "Agressao corrosiva que insiste no atrito.",
      description: "Favorece sequencias de dano em duelos prolongados.",
      role: "pressure",
    },
    {
      id: "poder-da-natureza",
      name: "Poder da Natureza",
      portrait: "Arte/ArtWork/Action/PoderDaNatureza.png",
      tagline: "Escala segura para criaturas mais resistentes.",
      description: "Empurra a mesa para trocas mais robustas e previsiveis.",
      role: "stability",
    },
    {
      id: "raio-concentrado",
      name: "Raio Concentrado",
      portrait: "Arte/ArtWork/Action/raioconcentrado.png",
      tagline: "Leitura de alvo com finalizacao limpa.",
      description: "Ajuda a concluir abates quando a Energia do alvo cai demais.",
      role: "finisher",
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
