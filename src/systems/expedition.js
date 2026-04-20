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

  function pickCategory(pool) {
    if (!Array.isArray(pool) || !pool.length) return null;
    const total = pool.reduce((sum, entry) => sum + (entry.weight || 1), 0);
    let draw = Math.random() * total;
    for (let i = 0; i < pool.length; i += 1) {
      draw -= pool[i].weight || 1;
      if (draw <= 0) return pool[i].type;
    }
    return pool[pool.length - 1].type;
  }

  function pickUndiscoveredAdjacentLocation(state, location, excludedIds) {
    const ids = Array.isArray(location.adjacentLocationIds) ? location.adjacentLocationIds : [];
    const blocked = new Set(Array.isArray(excludedIds) ? excludedIds : []);
    const candidates = ids.filter((locationId) => !global.TCGIdleDeck.hasLocationCard(state, locationId) && !blocked.has(locationId));
    if (!candidates.length) {
      return null;
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  function pickEquipmentBaseId(location) {
    if (Array.isArray(location.equipmentPool) && location.equipmentPool.length) {
      return pickEntry(location.equipmentPool, "equipmentId");
    }
    const starter = (global.TCGIdleData.starterEquipmentDeck || []).slice();
    if (!starter.length) return null;
    return starter[Math.floor(Math.random() * starter.length)];
  }

  function buildChoiceGroups(drops) {
    const guaranteedDrops = [];
    const grouped = {};
    drops.forEach((card) => {
      if (!card) return;
      if (card.cardType === "action") {
        guaranteedDrops.push(card);
        return;
      }
      grouped[card.cardType] = grouped[card.cardType] || [];
      grouped[card.cardType].push(card);
    });

    const choiceGroups = Object.keys(grouped).map((cardType) => ({
      id: "reward-" + cardType,
      cardType: cardType,
      options: grouped[cardType],
      selectedInstanceId: grouped[cardType].length === 1 ? grouped[cardType][0].instanceId : null,
    }));

    return {
      guaranteedDrops: guaranteedDrops,
      choiceGroups: choiceGroups,
    };
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
    const count = rolling.rollInRange(1, 3);
    const drops = [];
    const seenLocations = [];
    const categoryPool = [{ type: "creature", weight: 58 }];
    if (Array.isArray(location.actionPool) && location.actionPool.length) categoryPool.push({ type: "action", weight: 20 });
    if (Array.isArray(location.spellPool) && location.spellPool.length) categoryPool.push({ type: "spell", weight: 10 });
    if ((global.TCGIdleData.starterEquipmentDeck || []).length) categoryPool.push({ type: "equipment", weight: 8 });
    if (pickUndiscoveredAdjacentLocation(state, location, seenLocations)) categoryPool.push({ type: "location", weight: 4 });

    for (let i = 0; i < count; i += 1) {
      const category = pickCategory(categoryPool);
      if (category === "action") {
        const actionId = pickEntry(location.actionPool, "actionId");
        if (actionId) drops.push(rolling.createActionCard(actionId, "expedition", { seen: false }));
        continue;
      }
      if (category === "spell") {
        const spellId = pickEntry(location.spellPool, "spellId");
        if (spellId) drops.push(rolling.createSpellCard(spellId, "expedition", { seen: false }));
        continue;
      }
      if (category === "equipment") {
        const equipmentId = pickEquipmentBaseId(location);
        if (equipmentId) drops.push(rolling.createEquipmentCard(equipmentId, "expedition", { seen: false }));
        continue;
      }
      if (category === "location") {
        const discoveredLocationId = pickUndiscoveredAdjacentLocation(state, location, seenLocations);
        if (discoveredLocationId) {
          seenLocations.push(discoveredLocationId);
          drops.push(rolling.createLocationCard(discoveredLocationId, "adjacent-discovery", { seen: false }));
          continue;
        }
      }

      const baseId = pickFromPool(location.creaturePool);
      const creatureCard = rolling.rollCard(baseId, "expedition");
      if (creatureCard) {
        drops.push(creatureCard);
      }
    }
    const rewardData = buildChoiceGroups(drops);

    state.expeditions.active = null;
    state.expeditions.pendingReward = {
      locationId: active.locationId,
      guaranteedDrops: rewardData.guaranteedDrops,
      choiceGroups: rewardData.choiceGroups,
    };
    state.expeditions.completedCount = (state.expeditions.completedCount || 0) + 1;
    return { ok: true, guaranteedDrops: rewardData.guaranteedDrops, choiceGroups: rewardData.choiceGroups };
  }

  function selectRewardOption(state, groupId, instanceId) {
    const reward = state.expeditions.pendingReward;
    if (!reward) return { ok: false, reason: "Nenhuma recompensa pendente." };
    const group = (reward.choiceGroups || []).find((entry) => entry.id === groupId);
    if (!group) return { ok: false, reason: "Grupo de escolha nao encontrado." };
    if (!group.options.some((card) => card.instanceId === instanceId)) {
      return { ok: false, reason: "Opcao invalida." };
    }
    group.selectedInstanceId = instanceId;
    return { ok: true };
  }

  function claimReward(state) {
    const reward = state.expeditions.pendingReward;
    if (!reward) {
      return { ok: false };
    }

    let locationDrops = 0;
    const claimedDrops = (reward.guaranteedDrops || []).slice();
    for (let i = 0; i < (reward.choiceGroups || []).length; i += 1) {
      const group = reward.choiceGroups[i];
      const selectedCard = group.options.length === 1
        ? group.options[0]
        : group.options.find((card) => card.instanceId === group.selectedInstanceId);
      if (!selectedCard) {
        return { ok: false, reason: "Escolha uma carta de " + group.cardType + " antes de arquivar." };
      }
      claimedDrops.push(selectedCard);
    }

    claimedDrops.forEach((card) => {
      state.collection.cards.push(card);
      if (card.cardType === "location") {
        locationDrops += 1;
      }
    });
    state.progress.locationDiscoveries = (state.progress.locationDiscoveries || 0) + locationDrops;
    state.expeditions.pendingReward = null;
    return { ok: true, claimedDrops: claimedDrops };
  }

  function cancelExpedition(state) {
    state.expeditions.active = null;
    state.expeditions.pendingReward = null;
  }

  global.TCGIdleExpedition = {
    startExpedition: startExpedition,
    isExpeditionReady: isExpeditionReady,
    completeExpedition: completeExpedition,
    selectRewardOption: selectRewardOption,
    claimReward: claimReward,
    cancelExpedition: cancelExpedition,
  };
})(window);
