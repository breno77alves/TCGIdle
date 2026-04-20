(function registerDuel(global) {
  function randomFrom(list) {
    if (!Array.isArray(list) || !list.length) return null;
    return list[Math.floor(Math.random() * list.length)];
  }

  function cloneModifiers(list) {
    return Array.isArray(list) ? list.map((entry) => Object.assign({}, entry)) : [];
  }

  function roundToFive(value) {
    if (!Number.isFinite(value) || value <= 0) return 0;
    return Math.round(value / 5) * 5;
  }

  function toNumber(value, fallback) {
    return Number.isFinite(value) ? value : (Number.isFinite(fallback) ? fallback : 0);
  }

  function getDefaultCreatureBaseDamage(stats) {
    const power = stats && Number.isFinite(stats.power) ? stats.power : 0;
    const speed = stats && Number.isFinite(stats.speed) ? stats.speed : 0;
    return Math.max(5, roundToFive((power + speed) / 40));
  }

  function normalizeDamageProfile(source, defaultBase) {
    const profile = source && source.damageProfile ? source.damageProfile : source || {};
    const rawElemental = profile.elemental || source && source.elementalDamage || 0;
    let elemental = 0;
    if (Array.isArray(rawElemental)) {
      rawElemental.forEach((entry) => {
        elemental += toNumber(entry && entry.amount, entry && entry.damage);
      });
    } else if (rawElemental && typeof rawElemental === "object") {
      Object.keys(rawElemental).forEach((key) => {
        elemental += toNumber(rawElemental[key], 0);
      });
    } else {
      elemental = toNumber(rawElemental, 0);
    }
    return {
      base: roundToFive(toNumber(profile.base, source && source.baseDamage) || toNumber(defaultBase, 0)),
      cosmic: roundToFive(toNumber(profile.cosmic, source && source.cosmicDamage)),
      elemental: roundToFive(elemental),
      magic: roundToFive(toNumber(profile.magic, source && source.magicDamage)),
      true: roundToFive(toNumber(profile.true, source && source.trueDamage)),
    };
  }

  function emptyDamageBreakdown() {
    return {
      base: 0,
      cosmic: 0,
      elemental: 0,
      magic: 0,
      true: 0,
    };
  }

  function addDamageBreakdown(target, addition) {
    target.base += addition.base || 0;
    target.cosmic += addition.cosmic || 0;
    target.elemental += addition.elemental || 0;
    target.magic += addition.magic || 0;
    target.true += addition.true || 0;
    return target;
  }

  function materializeDamageProfile(profile) {
    const applied = emptyDamageBreakdown();
    applied.base = roundToFive(toNumber(profile && profile.base, 0));
    applied.cosmic = roundToFive(toNumber(profile && profile.cosmic, 0));
    applied.elemental = roundToFive(toNumber(profile && profile.elemental, 0));
    applied.magic = roundToFive(toNumber(profile && profile.magic, 0));
    applied.true = roundToFive(toNumber(profile && profile.true, 0));
    return {
      totals: applied,
    };
  }

  function formatDamageBreakdown(breakdown) {
    const parts = [];
    if (breakdown.base) parts.push("base " + breakdown.base);
    if (breakdown.cosmic) parts.push("cosmico " + breakdown.cosmic);
    if (breakdown.elemental) parts.push("elemental " + breakdown.elemental);
    if (breakdown.magic) parts.push("magico " + breakdown.magic);
    if (breakdown.true) parts.push("verdadeiro " + breakdown.true);
    return parts.join(" + ");
  }

  function buildFighter(card, side, slotIndex, lane, equipmentCard) {
    const base = global.TCGIdleData.getCreature(card.baseId);
    const equipmentBase = equipmentCard ? global.TCGIdleData.getEquipment(equipmentCard.baseId) : null;
    return {
      side: side,
      slotIndex: slotIndex,
      lane: lane === "backline" ? "backline" : "frontline",
      instanceId: card.instanceId || (side + "-" + card.baseId + "-" + Math.random()),
      baseId: card.baseId,
      name: base ? base.name : card.baseId,
      tribe: base ? base.tribe : null,
      damageProfile: normalizeDamageProfile(base, getDefaultCreatureBaseDamage(card.stats)),
      portrait: base ? base.portrait : "",
      stats: Object.assign({}, card.stats),
      hpMax: card.stats.energy,
      hp: card.stats.energy,
      down: false,
      passives: cloneModifiers(base && base.passives),
      combatTags: Array.isArray(base && base.combatTags) ? base.combatTags.slice() : [],
      equipmentCard: equipmentCard || null,
      equipmentBase: equipmentBase,
    };
  }

  function getPlayerSide(state) {
    const creatureSlots = global.TCGIdleDeck.getCreatureSlots(state);
    const equipmentIds = global.TCGIdleDeck.getSection(state, "equipment");
    const fighters = creatureSlots.map((slot, index) => {
      if (!slot || !slot.instanceId) return null;
      const creature = global.TCGIdleDeck.findCard(state, slot.instanceId);
      if (!creature) return null;
      const equipmentCard = equipmentIds[index] ? global.TCGIdleDeck.findCard(state, equipmentIds[index]) : null;
      return buildFighter(creature, "player", index, slot.lane, equipmentCard);
    }).filter(Boolean);

    return {
      side: "player",
      fighters: fighters,
      actions: global.TCGIdleDeck.getSection(state, "actions").map((id) => global.TCGIdleDeck.findCard(state, id)).filter(Boolean).map((card) => global.TCGIdleData.getAction(card.baseId)).filter(Boolean),
      spells: global.TCGIdleDeck.getSection(state, "spells").map((id) => global.TCGIdleDeck.findCard(state, id)).filter(Boolean).map((card) => global.TCGIdleData.getSpell(card.baseId)).filter(Boolean),
      locations: global.TCGIdleDeck.getSection(state, "locations").map((id) => global.TCGIdleDeck.findCard(state, id)).filter(Boolean).map((card) => global.TCGIdleData.getLocation(card.baseId)).filter(Boolean),
    };
  }

  function buildNpcActionDeck(npc) {
    const starter = (global.TCGIdleData.starterActionDeck || []).slice();
    const shift = ((npc && npc.difficulty) || 1) - 1;
    return starter.slice(shift, shift + 8).concat(starter.slice(0, Math.max(0, shift))).slice(0, 8)
      .map((baseId) => global.TCGIdleData.getAction(baseId))
      .filter(Boolean);
  }

  function buildNpcSpellDeck(npc) {
    const starter = (global.TCGIdleData.starterSpellDeck || []).slice();
    const shift = ((npc && npc.difficulty) || 1) - 1;
    return starter.slice(shift, shift + 3).concat(starter.slice(0, shift)).slice(0, 3)
      .map((baseId) => global.TCGIdleData.getSpell(baseId))
      .filter(Boolean);
  }

  function buildNpcEquipmentDeck(npc) {
    const starter = (global.TCGIdleData.starterEquipmentDeck || []).slice();
    const shift = ((npc && npc.difficulty) || 1) - 1;
    return starter.slice(shift, shift + 6).concat(starter.slice(0, shift)).slice(0, 6)
      .map((baseId) => global.TCGIdleData.getEquipment(baseId));
  }

  function getEnemySide(npc) {
    const equipmentDeck = buildNpcEquipmentDeck(npc);
    const fighters = (npc.deck || []).map((entry, index) => {
      const lane = entry.lane || (index < 3 ? "frontline" : "backline");
      const equipmentBase = equipmentDeck[index] || null;
      const equipmentCard = equipmentBase ? { baseId: equipmentBase.id } : null;
      return buildFighter({
        instanceId: "npc-" + npc.id + "-" + index,
        baseId: entry.baseId,
        stats: Object.assign({}, entry.stats),
      }, "enemy", index, lane, equipmentCard);
    });

    const zone = npc.zone ? global.TCGIdleData.getLocation(npc.zone) : null;
    return {
      side: "enemy",
      fighters: fighters,
      actions: buildNpcActionDeck(npc),
      spells: buildNpcSpellDeck(npc),
      locations: zone ? [zone] : [],
    };
  }

  function collectSourceEffects(fighter, sideState) {
    const effects = [];
    effects.push.apply(effects, cloneModifiers(fighter.passives));
    if (fighter.equipmentBase && Array.isArray(fighter.equipmentBase.duelModifiers)) {
      effects.push.apply(effects, cloneModifiers(fighter.equipmentBase.duelModifiers));
    }
    sideState.spells.forEach((spell) => {
      if (Array.isArray(spell.duelModifiers)) effects.push.apply(effects, cloneModifiers(spell.duelModifiers));
    });
    sideState.locations.forEach((location) => {
      if (Array.isArray(location.duelModifiers)) effects.push.apply(effects, cloneModifiers(location.duelModifiers));
    });
    return effects;
  }

  function effectApplies(effect, trigger, ctx) {
    if (!effect || effect.trigger !== trigger) return false;
    if (effect.lane && ctx.actor.lane !== effect.lane) return false;
    if (effect.actionRole && ctx.action && ctx.action.role !== effect.actionRole) return false;
    if (effect.stat && trigger === "onCheck" && ctx.checkStat !== effect.stat) return false;
    return true;
  }

  function scoreEffects(effects, trigger, ctx) {
    const result = {
      flatDamage: 0,
      percentDamage: 0,
      flatMitigation: 0,
      percentMitigation: 0,
      thresholdBonus: 0,
      bonusEnergy: 0,
      logs: [],
    };

    effects.forEach((effect) => {
      if (!effectApplies(effect, trigger, ctx)) return;
      result.flatDamage += effect.flatDamage || 0;
      result.percentDamage += effect.percentDamage || 0;
      result.flatMitigation += effect.flatMitigation || 0;
      result.percentMitigation += effect.percentMitigation || 0;
      result.thresholdBonus += effect.thresholdBonus || 0;
      result.bonusEnergy += effect.bonusEnergy || 0;
      if (Array.isArray(effect.statScale)) {
        effect.statScale.forEach((entry) => {
          result.flatDamage += roundToFive((ctx.actor.stats[entry.stat] || 0) * (entry.ratio || 0));
        });
      }
      if (effect.source) result.logs.push(effect.source);
    });

    return result;
  }

  function applyStartOfBattleEffects(sideState) {
    sideState.fighters.forEach((fighter) => {
      const effects = collectSourceEffects(fighter, sideState);
      const start = scoreEffects(effects, "startOfBattle", { actor: fighter, action: null, target: null });
      if (start.bonusEnergy) {
        fighter.hpMax += start.bonusEnergy;
        fighter.hp += start.bonusEnergy;
      }
    });
  }

  function chooseEngager(sideState) {
    const alive = sideState.fighters.filter((fighter) => fighter.hp > 0);
    if (!alive.length) return null;
    const frontline = alive.filter((fighter) => fighter.lane === "frontline");
    return randomFrom(frontline.length ? frontline : alive);
  }

  function chooseAction(sideState) {
    const action = randomFrom(sideState.actions);
    if (action) return action;
    return {
      id: "impacto-basico",
      name: "Impacto Basico",
      role: "fallback",
      damageProfile: {
        base: 5,
      },
      checks: [],
    };
  }

  function resolveActionCheck(action, attacker, attackerSide, defender, logSink) {
    let bonusDamage = 0;
    (action.checks || []).forEach((check) => {
      const effects = collectSourceEffects(attacker, attackerSide);
      const thresholdBoost = scoreEffects(effects, "onCheck", {
        actor: attacker,
        action: action,
        target: defender,
        checkStat: check.stat,
      }).thresholdBonus;
      const target = (check.threshold || 0) + thresholdBoost;
      const value = attacker.stats[check.stat] || 0;
      const passed = value >= target;
      if (passed && check.success) {
        bonusDamage += check.success.flatDamage || 0;
        if (check.success.log) logSink.push(check.success.log);
      } else if (!passed && check.failure) {
        bonusDamage += check.failure.flatDamage || 0;
        if (check.failure.log) logSink.push(check.failure.log);
      }
    });
    return bonusDamage;
  }

  function computeDamage(attacker, attackerSide, defender, defenderSide, action) {
    const detailLogs = [];
    const attackEffects = scoreEffects(collectSourceEffects(attacker, attackerSide), "onAttack", {
      actor: attacker,
      action: action,
      target: defender,
    });
    const defendEffects = scoreEffects(collectSourceEffects(defender, defenderSide), "onDefend", {
      actor: defender,
      action: action,
      target: attacker,
    });

    const creaturePacket = materializeDamageProfile(attacker.damageProfile);
    const actionPacket = materializeDamageProfile(normalizeDamageProfile(action, 0));
    const preModifier = addDamageBreakdown(emptyDamageBreakdown(), creaturePacket.totals);
    addDamageBreakdown(preModifier, actionPacket.totals);
    preModifier.base = roundToFive(preModifier.base + attackEffects.flatDamage + resolveActionCheck(action, attacker, attackerSide, defender, detailLogs));

    const scaled = {
      base: roundToFive(preModifier.base * (1 + attackEffects.percentDamage)),
      cosmic: roundToFive(preModifier.cosmic * (1 + attackEffects.percentDamage)),
      elemental: roundToFive(preModifier.elemental * (1 + attackEffects.percentDamage)),
      magic: roundToFive(preModifier.magic * (1 + attackEffects.percentDamage)),
      true: roundToFive(preModifier.true),
    };

    const rawDamage = scaled.base + scaled.cosmic + scaled.elemental + scaled.magic + scaled.true;
    const mitigableDamage = scaled.base + scaled.cosmic + scaled.elemental + scaled.magic;
    const wisdomGuard = roundToFive((defender.stats.wisdom || 0) * 0.08);
    const mitigatedBlock = roundToFive((mitigableDamage * (1 - defendEffects.percentMitigation)) - (wisdomGuard + defendEffects.flatMitigation));
    const finalDamage = Math.max(5, Math.max(0, mitigatedBlock) + scaled.true);

    return {
      actionName: action.name,
      rawDamage: rawDamage,
      finalDamage: finalDamage,
      breakdown: scaled,
      creatureDamage: creaturePacket.totals,
      actionDamage: actionPacket.totals,
      attackSources: attackEffects.logs,
      defendSources: defendEffects.logs,
      detailLogs: detailLogs,
    };
  }

  function buildRewardCards(rewardPool) {
    if (!Array.isArray(rewardPool) || !rewardPool.length) return [];
    const reward = rewardPool[Math.floor(Math.random() * rewardPool.length)];
    if (reward.cardType === "location") {
      return [global.TCGIdleRolling.createLocationCard(reward.baseId, "special-duel", { seen: false })];
    }
    if (reward.cardType === "equipment") {
      return [global.TCGIdleRolling.createEquipmentCard(reward.baseId, "special-duel", { seen: false })];
    }
    return [global.TCGIdleRolling.rollEliteCard(reward.baseId, "special-duel")];
  }

  function startDuel(state, npcId) {
    const npc = global.TCGIdleData.getNpc(npcId);
    if (!npc) return { ok: false, reason: "NPC desconhecido." };

    const creatureSection = global.TCGIdleDeck.getSection(state, "creatures");
    if (creatureSection.filter(Boolean).length < 6) {
      return { ok: false, reason: "Preencha os 6 espacos de criaturas antes." };
    }

    if (npc.special) {
      const charges = state.progress.specialDuelCharges[String(npc.difficulty)] || 0;
      if (charges < 1) {
        return { ok: false, reason: "Venca 10 duelos seguidos dessa dificuldade para liberar a prova especial." };
      }
      state.progress.specialDuelCharges[String(npc.difficulty)] = charges - 1;
    }

    const playerSide = getPlayerSide(state);
    const enemySide = getEnemySide(npc);
    applyStartOfBattleEffects(playerSide);
    applyStartOfBattleEffects(enemySide);

    state.duel.status = "running";
    state.duel.current = {
      npcId: npcId,
      tick: 0,
      playerSide: playerSide,
      enemySide: enemySide,
      reservedSpecialCharge: Boolean(npc.special),
      difficulty: npc.difficulty,
      currentEngagement: null,
      log: [{ tick: 0, kind: "setup", text: "Inicio do duelo contra " + npc.name + "." }],
      startedAt: Date.now(),
    };
    state.duel.lastResult = null;
    return { ok: true, npc: npc };
  }

  function fightOnce(ctx, actingSide, defendingSide) {
    const attacker = actingSide.fighter;
    const defender = defendingSide.fighter;
    if (!attacker || !defender || attacker.hp <= 0 || defender.hp <= 0) return;

    const action = chooseAction(actingSide.sideState);
    const attack = computeDamage(attacker, actingSide.sideState, defender, defendingSide.sideState, action);
    defender.hp = Math.max(0, defender.hp - attack.finalDamage);
    ctx.log.push({
      tick: ctx.tick,
      kind: "attack",
      attackerSide: attacker.side,
      text: attacker.name + " usa " + attack.actionName + " em " + defender.name + " (" + attack.finalDamage + " de dano, bruto " + attack.rawDamage + "; " + formatDamageBreakdown(attack.breakdown) + ")",
    });
    attack.detailLogs.forEach((text) => {
      ctx.log.push({ tick: ctx.tick, kind: "detail", attackerSide: attacker.side, text: text + "." });
    });
    if (defender.hp <= 0) {
      defender.down = true;
      ctx.log.push({ tick: ctx.tick, kind: "ko", side: defender.side, text: defender.name + " foi destruido quando a Energia zerou." });
    }
    return action.name;
  }

  function tickDuel(state) {
    const ctx = state.duel.current;
    if (!ctx) return { ended: false };

    const player = chooseEngager(ctx.playerSide);
    const enemy = chooseEngager(ctx.enemySide);
    if (!player || !enemy) return finishDuel(state);

    ctx.tick += 1;
    ctx.currentEngagement = {
      playerId: player.instanceId,
      enemyId: enemy.instanceId,
      playerLane: player.lane,
      enemyLane: enemy.lane,
      playerAction: null,
      enemyAction: null,
    };

    const playerInitiative = player.stats.speed + Math.random() * 8;
    const enemyInitiative = enemy.stats.speed + Math.random() * 8;
    const first = playerInitiative >= enemyInitiative
      ? [{ fighter: player, sideState: ctx.playerSide }, { fighter: enemy, sideState: ctx.enemySide }]
      : [{ fighter: enemy, sideState: ctx.enemySide }, { fighter: player, sideState: ctx.playerSide }];

    first.forEach((acting, index) => {
      const defending = first[1 - index];
      const actionName = fightOnce(ctx, acting, defending);
      if (!actionName) return;
      if (acting.fighter.side === "player") ctx.currentEngagement.playerAction = actionName;
      else ctx.currentEngagement.enemyAction = actionName;
    });

    const playerAlive = ctx.playerSide.fighters.some((fighter) => fighter.hp > 0);
    const enemyAlive = ctx.enemySide.fighters.some((fighter) => fighter.hp > 0);
    if (!playerAlive || !enemyAlive) {
      return finishDuel(state);
    }
    return { ended: false };
  }

  function finishDuel(state) {
    const ctx = state.duel.current;
    if (!ctx) return { ended: true };
    const npc = global.TCGIdleData.getNpc(ctx.npcId);
    const playerAlive = ctx.playerSide.fighters.some((fighter) => fighter.hp > 0);
    const outcome = playerAlive ? "won" : "lost";
    const difficultyKey = String((npc && npc.difficulty) || ctx.difficulty || 1);
    let specialUnlocked = false;
    let rewardDrops = [];

    state.duel.status = outcome;
    if (outcome === "won") {
      state.progress.duelsWon += 1;
      if (npc && npc.rewards) state.progress.essence += npc.rewards.essence || 0;
      if (npc && npc.special) {
        rewardDrops = buildRewardCards(npc.rewards && npc.rewards.rewardPool);
        rewardDrops.forEach((card) => { if (card) state.collection.cards.push(card); });
      } else {
        state.progress.duelStreaks[difficultyKey] = (state.progress.duelStreaks[difficultyKey] || 0) + 1;
        if (state.progress.duelStreaks[difficultyKey] % 10 === 0) {
          state.progress.specialDuelCharges[difficultyKey] = (state.progress.specialDuelCharges[difficultyKey] || 0) + 1;
          specialUnlocked = true;
        }
      }
      ctx.log.push({ tick: ctx.tick, kind: "result", text: "Vitoria conquistada." });
    } else {
      state.progress.duelsLost += 1;
      if (!npc || !npc.special) state.progress.duelStreaks[difficultyKey] = 0;
      ctx.log.push({ tick: ctx.tick, kind: "result", text: npc && npc.special ? "Derrota na prova especial." : "Derrota registrada." });
    }

    state.duel.lastResult = {
      outcome: outcome,
      npcId: ctx.npcId,
      ticks: ctx.tick,
      finishedAt: new Date().toISOString(),
      specialUnlocked: specialUnlocked,
      rewardDrops: rewardDrops,
    };
    return { ended: true, outcome: outcome, npc: npc, specialUnlocked: specialUnlocked, rewardDrops: rewardDrops };
  }

  function refundInterruptedSpecialCharge(state) {
    const current = state.duel.current;
    if (!current || !current.reservedSpecialCharge) return;
    const key = String(current.difficulty || 1);
    state.progress.specialDuelCharges[key] = (state.progress.specialDuelCharges[key] || 0) + 1;
  }

  function resetDuel(state) {
    state.duel.status = "idle";
    state.duel.current = null;
  }

  global.TCGIdleDuel = {
    startDuel: startDuel,
    tickDuel: tickDuel,
    finishDuel: finishDuel,
    refundInterruptedSpecialCharge: refundInterruptedSpecialCharge,
    resetDuel: resetDuel,
  };
})(window);
