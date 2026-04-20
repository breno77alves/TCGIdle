(function bootstrapState(global) {
  const STORAGE_KEY = "tcg-idle-save";
  const SAVE_VERSION = 7;
  const STARTER_LOCATION_COPIES = 6;

  function makeInstance(prefix, index) {
    return prefix + "-" + index + "-" + Math.random().toString(36).slice(2, 8);
  }

  function createStarterCard(baseId, cardType, index, extra) {
    return Object.assign({
      instanceId: makeInstance("starter-" + cardType, index),
      cardType: cardType,
      baseId: baseId,
      stats: cardType === "creature" ? Object.assign({}, extra && extra.stats) : null,
      rolledAt: new Date().toISOString(),
      source: "starter",
      seen: true,
    }, extra && extra.meta ? extra.meta : {});
  }

  function normalizeDifficultyMap(candidate, fallback) {
    const safe = candidate && typeof candidate === "object" ? candidate : {};
    const result = Object.assign({}, fallback);
    Object.keys(result).forEach((key) => {
      result[key] = Number.isFinite(safe[key]) ? safe[key] : fallback[key];
    });
    return result;
  }

  function firstCardId(cards, cardType) {
    const match = cards.find((card) => card.cardType === cardType);
    return match ? match.instanceId : null;
  }

  function createDefaultState() {
    const data = global.TCGIdleData || {};
    const creatureCards = (data.starterDeck || []).map((entry, index) => createStarterCard(entry.baseId, "creature", index, { stats: entry.stats }));
    const starterLocations = Array.isArray(data.starterLocationCards) ? data.starterLocationCards.slice() : [];
    while (starterLocations.length && starterLocations.length < STARTER_LOCATION_COPIES) {
      starterLocations.push(starterLocations[0]);
    }
    const locationCards = starterLocations.map((baseId, index) => createStarterCard(baseId, "location", index));
    const actionCards = (data.starterActionDeck || []).map((baseId, index) => createStarterCard(baseId, "action", index));
    const spellCards = (data.starterSpellDeck || []).map((baseId, index) => createStarterCard(baseId, "spell", index));
    const equipmentCards = (data.starterEquipmentDeck || []).map((baseId, index) => createStarterCard(baseId, "equipment", index));
    const cards = creatureCards.concat(locationCards, actionCards, spellCards, equipmentCards);

    return {
      saveVersion: SAVE_VERSION,
      ui: {
        currentTab: "collection",
        inspectingInstanceId: null,
      },
      meta: {
        bootCount: 0,
        lastOpenedAt: null,
        lastSavedAt: null,
        lastAction: "Tomo do Limiar aberto pela primeira vez",
      },
      collection: {
        cards: cards,
      },
      deck: {
        creatureSlots: creatureCards.slice(0, 6).map((card, index) => ({
          instanceId: card.instanceId,
          lane: index < 3 ? "frontline" : "backline",
          equipmentId: equipmentCards[index] ? equipmentCards[index].instanceId : null,
        })),
        sections: {
          locations: locationCards.slice(0, 6).map((card) => card.instanceId),
          actions: actionCards.slice(0, 20).map((card) => card.instanceId),
          spells: spellCards.slice(0, 6).map((card) => card.instanceId),
        },
      },
      expeditions: {
        active: null,
        pendingReward: null,
        completedCount: 0,
      },
      duel: {
        status: "idle",
        current: null,
        lastResult: null,
      },
      progress: {
        duelsWon: 0,
        duelsLost: 0,
        essence: 0,
        locationDiscoveries: 0,
        duelStreaks: { 1: 0, 2: 0, 3: 0, 4: 0 },
        specialDuelCharges: { 1: 0, 2: 0, 3: 0, 4: 0 },
      },
    };
  }

  function sanitizeStats(candidate) {
    const safe = candidate && typeof candidate === "object" ? candidate : {};
    const pick = (key) => (Number.isFinite(safe[key]) ? safe[key] : 0);
    return {
      courage: pick("courage"),
      power: pick("power"),
      wisdom: pick("wisdom"),
      speed: pick("speed"),
      energy: pick("energy"),
    };
  }

  function sanitizeCard(candidate) {
    if (!candidate || typeof candidate !== "object") return null;
    if (typeof candidate.baseId !== "string" || typeof candidate.instanceId !== "string") return null;

    const allowedTypes = new Set(["creature", "location", "action", "spell", "equipment"]);
    const cardType = allowedTypes.has(candidate.cardType) ? candidate.cardType : "creature";

    return {
      instanceId: candidate.instanceId,
      cardType: cardType,
      baseId: candidate.baseId,
      stats: cardType === "creature" ? sanitizeStats(candidate.stats) : null,
      rolledAt: typeof candidate.rolledAt === "string" ? candidate.rolledAt : new Date().toISOString(),
      source: typeof candidate.source === "string" ? candidate.source : "starter",
      seen: Boolean(candidate.seen),
    };
  }

  function sanitizeActiveExpedition(candidate) {
    if (!candidate || typeof candidate !== "object") return null;
    if (typeof candidate.locationId !== "string") return null;
    return {
      locationId: candidate.locationId,
      startedAt: Number.isFinite(candidate.startedAt) ? candidate.startedAt : Date.now(),
      durationMs: Number.isFinite(candidate.durationMs) ? candidate.durationMs : 30000,
    };
  }

  function sanitizePendingReward(candidate) {
    if (!candidate || typeof candidate !== "object") {
      return null;
    }
    const legacyDrops = Array.isArray(candidate.drops) ? candidate.drops.map(sanitizeCard).filter(Boolean) : null;
    const guaranteedDrops = Array.isArray(candidate.guaranteedDrops)
      ? candidate.guaranteedDrops.map(sanitizeCard).filter(Boolean)
      : (legacyDrops || []);
    const choiceGroups = Array.isArray(candidate.choiceGroups)
      ? candidate.choiceGroups.map((group, index) => {
        if (!group || typeof group !== "object" || !Array.isArray(group.options)) return null;
        const safeOptions = group.options.map(sanitizeCard).filter(Boolean);
        if (!safeOptions.length) return null;
        const selectedInstanceId = typeof group.selectedInstanceId === "string"
          && safeOptions.some((card) => card.instanceId === group.selectedInstanceId)
          ? group.selectedInstanceId
          : (safeOptions.length === 1 ? safeOptions[0].instanceId : null);
        return {
          id: typeof group.id === "string" ? group.id : "reward-group-" + index,
          cardType: typeof group.cardType === "string" ? group.cardType : safeOptions[0].cardType,
          options: safeOptions,
          selectedInstanceId: selectedInstanceId,
        };
      }).filter(Boolean)
      : [];
    return {
      locationId: typeof candidate.locationId === "string" ? candidate.locationId : null,
      guaranteedDrops: guaranteedDrops,
      choiceGroups: choiceGroups,
    };
  }

  function ensureStarterTypes(cards, defaults) {
    const needed = ["location", "action", "spell", "equipment"];
    let next = cards.slice();
    needed.forEach((cardType) => {
      if (!next.some((card) => card.cardType === cardType)) {
        next = next.concat(defaults.collection.cards.filter((card) => card.cardType === cardType));
      }
    });
    return next;
  }

  function sanitizeSection(section, validIds, fallback, exactLength) {
    const source = Array.isArray(section) ? section.slice(0, exactLength) : fallback.slice(0, exactLength);
    const next = [];
    for (let i = 0; i < exactLength; i += 1) {
      const id = source[i];
      next.push(typeof id === "string" && validIds.has(id) ? id : null);
    }
    return next;
  }

  function sanitizeCreatureSlots(candidate, validIds, fallback, equipmentIds) {
    const source = Array.isArray(candidate) && candidate.length ? candidate : (Array.isArray(fallback) ? fallback : []);
    const next = [];
    for (let i = 0; i < 6; i += 1) {
      const entry = source[i];
      if (entry && typeof entry === "object") {
        next.push({
          instanceId: typeof entry.instanceId === "string" && validIds.has(entry.instanceId) ? entry.instanceId : null,
          lane: entry.lane === "backline" ? "backline" : "frontline",
          equipmentId: typeof entry.equipmentId === "string" && equipmentIds.has(entry.equipmentId) ? entry.equipmentId : null,
        });
        continue;
      }
      const legacyId = typeof entry === "string" && validIds.has(entry) ? entry : null;
      next.push({
        instanceId: legacyId,
        lane: i < 3 ? "frontline" : "backline",
        equipmentId: null,
      });
    }
    return next;
  }

  function sanitizeDeck(candidate, cards, defaults) {
    const safe = candidate && typeof candidate === "object" ? candidate : {};
    const sections = safe.sections && typeof safe.sections === "object" ? safe.sections : {};

    const validByType = {
      creature: new Set(cards.filter((card) => card.cardType === "creature").map((card) => card.instanceId)),
      location: new Set(cards.filter((card) => card.cardType === "location").map((card) => card.instanceId)),
      action: new Set(cards.filter((card) => card.cardType === "action").map((card) => card.instanceId)),
      spell: new Set(cards.filter((card) => card.cardType === "spell").map((card) => card.instanceId)),
      equipment: new Set(cards.filter((card) => card.cardType === "equipment").map((card) => card.instanceId)),
    };

    const creatureSlots = sanitizeCreatureSlots(safe.creatureSlots || (sections.creatures || safe.slots), validByType.creature, defaults.deck.creatureSlots, validByType.equipment);
    const legacyEquipment = sanitizeSection(sections.equipment, validByType.equipment, defaults.deck.creatureSlots.map((slot) => slot.equipmentId || null), 6);
    creatureSlots.forEach((slot, index) => {
      if (!slot.equipmentId) slot.equipmentId = legacyEquipment[index] || null;
      if (!slot.instanceId) slot.equipmentId = null;
    });

    return {
      creatureSlots: creatureSlots,
      sections: {
        locations: sanitizeSection(sections.locations || (safe.locationSlot ? [safe.locationSlot] : null), validByType.location, defaults.deck.sections.locations, 6),
        actions: sanitizeSection(sections.actions, validByType.action, defaults.deck.sections.actions, 20),
        spells: sanitizeSection(sections.spells, validByType.spell, defaults.deck.sections.spells, 6),
      },
    };
  }

  function sanitizeState(candidate) {
    const defaults = createDefaultState();
    const safe = candidate && typeof candidate === "object" ? candidate : {};
    const ui = safe.ui && typeof safe.ui === "object" ? safe.ui : {};
    const meta = safe.meta && typeof safe.meta === "object" ? safe.meta : {};
    const collection = safe.collection && typeof safe.collection === "object" ? safe.collection : {};
    const expeditions = safe.expeditions && typeof safe.expeditions === "object" ? safe.expeditions : {};
    const duel = safe.duel && typeof safe.duel === "object" ? safe.duel : {};
    const progress = safe.progress && typeof safe.progress === "object" ? safe.progress : {};

    let cards = Array.isArray(collection.cards)
      ? collection.cards.map(sanitizeCard).filter(Boolean)
      : defaults.collection.cards;

    cards = ensureStarterTypes(cards, defaults);

    return {
      saveVersion: SAVE_VERSION,
      ui: {
        currentTab: typeof ui.currentTab === "string" ? ui.currentTab : defaults.ui.currentTab,
        inspectingInstanceId: typeof ui.inspectingInstanceId === "string" ? ui.inspectingInstanceId : null,
      },
      meta: {
        bootCount: Number.isFinite(meta.bootCount) ? meta.bootCount : defaults.meta.bootCount,
        lastOpenedAt: typeof meta.lastOpenedAt === "string" ? meta.lastOpenedAt : defaults.meta.lastOpenedAt,
        lastSavedAt: typeof meta.lastSavedAt === "string" ? meta.lastSavedAt : defaults.meta.lastSavedAt,
        lastAction: typeof meta.lastAction === "string" ? meta.lastAction : defaults.meta.lastAction,
      },
      collection: { cards: cards },
      deck: sanitizeDeck(safe.deck, cards, defaults),
      expeditions: {
        active: sanitizeActiveExpedition(expeditions.active),
        pendingReward: sanitizePendingReward(expeditions.pendingReward),
        completedCount: Number.isFinite(expeditions.completedCount) ? expeditions.completedCount : 0,
      },
      duel: {
        status: typeof duel.status === "string" ? duel.status : defaults.duel.status,
        current: duel.current && typeof duel.current === "object" ? duel.current : null,
        lastResult: duel.lastResult && typeof duel.lastResult === "object" ? duel.lastResult : null,
      },
      progress: {
        duelsWon: Number.isFinite(progress.duelsWon) ? progress.duelsWon : 0,
        duelsLost: Number.isFinite(progress.duelsLost) ? progress.duelsLost : 0,
        essence: Number.isFinite(progress.essence) ? progress.essence : 0,
        locationDiscoveries: Number.isFinite(progress.locationDiscoveries) ? progress.locationDiscoveries : 0,
        duelStreaks: normalizeDifficultyMap(progress.duelStreaks, defaults.progress.duelStreaks),
        specialDuelCharges: normalizeDifficultyMap(progress.specialDuelCharges, defaults.progress.specialDuelCharges),
      },
    };
  }

  function migrate(raw) {
    const safe = raw && typeof raw === "object" ? raw : {};
    const version = Number.isFinite(safe.saveVersion) ? safe.saveVersion : 1;
    if (version >= SAVE_VERSION) {
      return safe;
    }

    const fresh = createDefaultState();
    const migrated = Object.assign({}, fresh, {
      ui: Object.assign({}, fresh.ui, safe.ui || {}),
      meta: Object.assign({}, fresh.meta, safe.meta || {}, {
        lastAction: "Save migrado para v4 e alinhado ao novo arsenal do tomo",
      }),
    });

    if (version < 4) {
      migrated.collection = Object.assign({}, fresh.collection, safe.collection || {});
      migrated.deck = Object.assign({}, fresh.deck, safe.deck || {});
      migrated.expeditions = Object.assign({}, fresh.expeditions, safe.expeditions || {});
      migrated.duel = Object.assign({}, fresh.duel, safe.duel || {});
      migrated.progress = Object.assign({}, fresh.progress, safe.progress || {});
    }

    if (version < 5) {
      migrated.meta.lastAction = "Save migrado para v5 com formacao por linha e arsenal de combate expandido";
    }

    if (version < 6) {
      migrated.meta.lastAction = "Save migrado para v6 com equipamentos vinculados por criatura e dano unificado";
    }

    if (version < 7) {
      migrated.meta.lastAction = "Save migrado para v7 com escolhas de expedicao e duelo tatico revisado";
    }

    return migrated;
  }

  function saveState(nextState) {
    const safeState = sanitizeState(nextState);
    safeState.meta.lastSavedAt = new Date().toISOString();
    global.localStorage.setItem(STORAGE_KEY, JSON.stringify(safeState));
    return safeState;
  }

  function loadState() {
    try {
      const raw = global.localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultState();
      return sanitizeState(migrate(JSON.parse(raw)));
    } catch (error) {
      return createDefaultState();
    }
  }

  function resetState() {
    const fresh = createDefaultState();
    global.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return loadState();
  }

  global.TCGIdleState = {
    STORAGE_KEY: STORAGE_KEY,
    SAVE_VERSION: SAVE_VERSION,
    createDefaultState: createDefaultState,
    sanitizeState: sanitizeState,
    saveState: saveState,
    loadState: loadState,
    resetState: resetState,
  };
})(window);
