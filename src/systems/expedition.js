(function registerExpedition(global) {
  function pickFromPool(pool) {
    const total = pool.reduce((sum, entry) => sum + (entry.weight || 1), 0);
    let draw = Math.random() * total;
    for (let i = 0; i < pool.length; i += 1) {
      draw -= pool[i].weight || 1;
      if (draw <= 0) {
        return pool[i].creatureId;
      }
    }
    return pool[pool.length - 1].creatureId;
  }

  function pickEntry(pool, idKey) {
    if (!Array.isArray(pool) || !pool.length) return null;
    const total = pool.reduce((sum, entry) => sum + (entry.weight || 1), 0);
    let draw = Math.random() * total;
    for (let i = 0; i < pool.length; i += 1) {
      draw -= pool[i].weight || 1;
      if (draw <= 0) {
        return pool[i][idKey];
      }
    }
    return pool[pool.length - 1][idKey];
  }

  function pickUndiscoveredAdjacentLocation(state, location) {
    const ids = Array.isArray(location.adjacentLocationIds) ? location.adjacentLocationIds : [];
    const candidates = ids.filter((locationId) => !global.TCGIdleDeck.hasLocationCard(state, locationId));
    if (!candidates.length) {
      return null;
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  function startExpedition(state, locationId) {
    const location = global.TCGIdleData.getLocation(locationId);
    if (!location) {
      return { ok: false, reason: "Zona desconhecida." };
    }
    if (state.expeditions.active) {
      return { ok: false, reason: "Ja existe expedicao em andamento." };
    }
    if (state.expeditions.pendingReward) {
      return { ok: false, reason: "Reivindique a recompensa pendente antes." };
    }
    if (!global.TCGIdleDeck.hasLocationCard(state, locationId)) {
      return { ok: false, reason: "Voce precisa primeiro obter o scan desse local." };
    }

    state.expeditions.active = {
      locationId: locationId,
      startedAt: Date.now(),
      durationMs: location.durationMs,
    };
    return { ok: true };
  }

  function isExpeditionReady(state, now) {
    const active = state.expeditions.active;
    if (!active) return false;
    const finishAt = active.startedAt + active.durationMs;
    return (now || Date.now()) >= finishAt;
  }

  function completeExpedition(state) {
    const active = state.expeditions.active;
    if (!active) {
      return { ok: false, reason: "Nenhuma expedicao em andamento." };
    }
    const location = global.TCGIdleData.getLocation(active.locationId);
    if (!location) {
      state.expeditions.active = null;
      return { ok: false, reason: "Zona nao encontrada." };
    }

    const rolling = global.TCGIdleRolling;
    const [minDrops, maxDrops] = location.dropCountRange;
    const count = rolling.rollInRange(minDrops, maxDrops);
    const drops = [];

    for (let i = 0; i < count; i += 1) {
      const baseId = pickFromPool(location.creaturePool);
      const card = rolling.rollCard(baseId, "expedition");
      if (card) {
        drops.push(card);
      }
    }

    if (Math.random() <= 0.4) {
      const actionId = pickEntry(location.actionPool, "actionId");
      if (actionId) {
        drops.push(rolling.createActionCard(actionId, "expedition", { seen: false }));
      }
    }

    if (Math.random() <= 0.28) {
      const spellId = pickEntry(location.spellPool, "spellId");
      if (spellId) {
        drops.push(rolling.createSpellCard(spellId, "expedition", { seen: false }));
      }
    }

    const discoveredLocationId = Math.random() <= (location.discoveryChance || 0)
      ? pickUndiscoveredAdjacentLocation(state, location)
      : null;
    if (discoveredLocationId) {
      drops.push(rolling.createLocationCard(discoveredLocationId, "adjacent-discovery", { seen: false }));
    }

    state.expeditions.active = null;
    state.expeditions.pendingReward = {
      locationId: active.locationId,
      drops: drops,
    };
    state.expeditions.completedCount = (state.expeditions.completedCount || 0) + 1;
    return { ok: true, drops: drops };
  }

  function claimReward(state) {
    const reward = state.expeditions.pendingReward;
    if (!reward) {
      return { ok: false };
    }

    let locationDrops = 0;
    reward.drops.forEach((card) => {
      state.collection.cards.push(card);
      if (card.cardType === "location") {
        locationDrops += 1;
      }
    });
    state.progress.locationDiscoveries = (state.progress.locationDiscoveries || 0) + locationDrops;
    state.expeditions.pendingReward = null;
    return { ok: true, drops: reward.drops };
  }

  function cancelExpedition(state) {
    state.expeditions.active = null;
    state.expeditions.pendingReward = null;
  }

  global.TCGIdleExpedition = {
    startExpedition: startExpedition,
    isExpeditionReady: isExpeditionReady,
    completeExpedition: completeExpedition,
    claimReward: claimReward,
    cancelExpedition: cancelExpedition,
  };
})(window);
