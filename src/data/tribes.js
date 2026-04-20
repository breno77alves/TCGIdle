(function registerTribes(global) {
  const TRIBES = [
    {
      id: "solari",
      name: "Solari",
      focus: "courage",
      accent: "#F2A93B",
      accentSoft: "rgba(242, 169, 59, 0.18)",
      tagline: "Guardiões da luz viva",
      lore: "Ordens de cavaleiros que convertem convicção em calor irradiado.",
    },
    {
      id: "umbrae",
      name: "Umbrae",
      focus: "power",
      accent: "#6B4FA8",
      accentSoft: "rgba(107, 79, 168, 0.22)",
      tagline: "Colossos das trincheiras sem sol",
      lore: "Criaturas forjadas na pressão das câmaras profundas, movidas por força bruta.",
    },
    {
      id: "nomads",
      name: "Nomads",
      focus: "speed",
      accent: "#4FC3D0",
      accentSoft: "rgba(79, 195, 208, 0.18)",
      tagline: "Errantes do vento cortante",
      lore: "Viajantes que transformam rotas antigas em vantagem tática.",
    },
    {
      id: "hivekin",
      name: "Hivekin",
      focus: "wisdom",
      accent: "#6EA84E",
      accentSoft: "rgba(110, 168, 78, 0.18)",
      tagline: "Mente coletiva da colmeia",
      lore: "Sociedades eussociais que calculam rotas de combate em coro.",
    },
  ];

  function getTribe(id) {
    return TRIBES.find((tribe) => tribe.id === id) || null;
  }

  global.TCGIdleData = global.TCGIdleData || {};
  global.TCGIdleData.tribes = TRIBES;
  global.TCGIdleData.getTribe = getTribe;
})(window);
