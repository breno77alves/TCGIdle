(function registerDeckRules(global) {
  const SECTION_CONFIG = {
    creatures: { cardType: "creature", size: 6, maxCopiesByBaseId: 2 },
    locations: { cardType: "location", size: 6, maxCopiesByBaseId: 6 },
    actions: { cardType: "action", size: 20, maxCopiesByBaseId: 4 },
    spells: { cardType: "spell", size: 6, maxCopiesByBaseId: 2 },
    equipment: { cardType: "equipment", size: 6, maxCopiesByBaseId: 1 },
  };

  function findCard(state, instanceId) {
    return state.collection.cards.find((card) => card.instanceId === instanceId) || null;
  }

  function getCreatureSlots(state) {
    return (state.deck && state.deck.creatureSlots) || [];
  }

  function getSection(state, sectionName) {
    if (sectionName === "creatures") {
      return getCreatureSlots(state).map((slot) => slot && slot.instanceId ? slot.instanceId : null);
    }
    if (sectionName === "equipment") {
      return getCreatureSlots(state).map((slot) => slot && slot.equipmentId ? slot.equipmentId : null);
    }
    return (state.deck.sections && state.deck.sections[sectionName]) || [];
  }

  function getCreatureSlot(state, slotIndex) {
    return getCreatureSlots(state)[slotIndex] || {
      instanceId: null,
      lane: slotIndex < 3 ? "frontline" : "backline",
      equipmentId: null,
    };
  }

  function getCardsByType(state, cardType) {
    return state.collection.cards.filter((card) => card.cardType === cardType);
  }

  function countCopiesInSection(state, sectionName, baseId) {
    let count = 0;
    getSection(state, sectionName).forEach((instanceId) => {
      const card = instanceId ? findCard(state, instanceId) : null;
      if (card && card.baseId === baseId) count += 1;
    });
    return count;
  }

  function canPlaceInSection(state, sectionName, instanceId, slotIndex) {
    const config = SECTION_CONFIG[sectionName];
    if (!config) return { ok: false, reason: "Secao desconhecida." };

    const card = findCard(state, instanceId);
    if (!card) return { ok: false, reason: "Carta nao encontrada na colecao." };
    if (card.cardType !== config.cardType) {
      return { ok: false, reason: "Essa secao aceita apenas cartas de " + config.cardType + "." };
    }
    if (sectionName === "equipment" && !getCreatureSlot(state, slotIndex).instanceId) {
      return { ok: false, reason: "Equipe uma criatura nesse espaco antes de vincular um equipamento." };
    }

    const section = getSection(state, sectionName);
    const currentInSlot = section[slotIndex];
    if (currentInSlot === instanceId) {
      return { ok: true };
    }
    if (section.includes(instanceId)) {
      return { ok: false, reason: "Essa carta ja esta equipada nessa secao." };
    }

    const replacingBaseId = currentInSlot ? (findCard(state, currentInSlot) || {}).baseId : null;
    const copies = countCopiesInSection(state, sectionName, card.baseId);
    const effectiveCopies = replacingBaseId === card.baseId ? copies - 1 : copies;
    if (effectiveCopies >= config.maxCopiesByBaseId) {
      return { ok: false, reason: "Limite de copias atingido nessa secao." };
    }
    return { ok: true };
  }

  function setCardInSection(state, sectionName, slotIndex, instanceId) {
    const check = canPlaceInSection(state, sectionName, instanceId, slotIndex);
    if (!check.ok) return check;
    if (sectionName === "creatures") {
      const current = getCreatureSlot(state, slotIndex);
      state.deck.creatureSlots[slotIndex] = {
        instanceId: instanceId,
        lane: current.lane === "backline" ? "backline" : "frontline",
        equipmentId: current.equipmentId || null,
      };
      return { ok: true };
    }
    if (sectionName === "equipment") {
      const current = getCreatureSlot(state, slotIndex);
      state.deck.creatureSlots[slotIndex] = {
        instanceId: current.instanceId || null,
        lane: current.lane === "backline" ? "backline" : "frontline",
        equipmentId: instanceId,
      };
      return { ok: true };
    }
    state.deck.sections[sectionName][slotIndex] = instanceId;
    return { ok: true };
  }

  function clearSectionSlot(state, sectionName, slotIndex) {
    if (!SECTION_CONFIG[sectionName]) return { ok: false, reason: "Secao desconhecida." };
    if (sectionName === "creatures") {
      const current = getCreatureSlot(state, slotIndex);
      state.deck.creatureSlots[slotIndex] = {
        instanceId: null,
        lane: current.lane === "backline" ? "backline" : "frontline",
        equipmentId: null,
      };
      return { ok: true };
    }
    if (sectionName === "equipment") {
      const current = getCreatureSlot(state, slotIndex);
      state.deck.creatureSlots[slotIndex] = {
        instanceId: current.instanceId || null,
        lane: current.lane === "backline" ? "backline" : "frontline",
        equipmentId: null,
      };
      return { ok: true };
    }
    state.deck.sections[sectionName][slotIndex] = null;
    return { ok: true };
  }

  function setCreatureLane(state, slotIndex, lane) {
    const nextLane = lane === "backline" ? "backline" : "frontline";
    const current = getCreatureSlot(state, slotIndex);
    state.deck.creatureSlots[slotIndex] = {
      instanceId: current.instanceId || null,
      lane: nextLane,
      equipmentId: current.equipmentId || null,
    };
    return { ok: true };
  }

  function hasLocationCard(state, locationId) {
    return state.collection.cards.some((card) => card.cardType === "location" && card.baseId === locationId);
  }

  function isDeckReady(state) {
    return getSection(state, "creatures").filter(Boolean).length === SECTION_CONFIG.creatures.size;
  }

  global.TCGIdleDeck = {
    SECTION_CONFIG: SECTION_CONFIG,
    findCard: findCard,
    getSection: getSection,
    getCreatureSlots: getCreatureSlots,
    getCreatureSlot: getCreatureSlot,
    getCardsByType: getCardsByType,
    countCopiesInSection: countCopiesInSection,
    canPlaceInSection: canPlaceInSection,
    setCardInSection: setCardInSection,
    clearSectionSlot: clearSectionSlot,
    setCreatureLane: setCreatureLane,
    hasLocationCard: hasLocationCard,
    isDeckReady: isDeckReady,
  };
})(window);
