(function registerDuel(global) {
  const ELEMENT_CYCLE = ["fire", "air", "earth", "water"];

  function elementAdvantage(attackerEl, defenderEl) {
    if (!attackerEl || !defenderEl) return 0;
    const ai = ELEMENT_CYCLE.indexOf(attackerEl);
    const di = ELEMENT_CYCLE.indexOf(defenderEl);
    if (ai < 0 || di < 0) return 0;
    if ((ai + 1) % 4 === di) return 0.25;
    if ((di + 1) % 4 === ai) return -0.15;
    return 0;
  }

  function buildFighter(card, side) {
    const base = global.TCGIdleData.getCreature(card.baseId);
    return {
      side: side,
      instanceId: card.instanceId || (side + "-" + card.baseId + "-" + Math.random()),
      baseId: card.baseId,
      name: base ? base.name : card.baseId,
      tribe: base ? base.tribe : null,
      element: base ? base.element : null,
      portrait: base ? base.portrait : "",
      stats: Object.assign({}, card.stats),
      hpMax: card.stats.energy,
      hp: card.stats.energy,
      down: false,
    };
  }

  function activeFighter(queue, index) {
    return index >= queue.length ? null : queue[index];
  }

  function computeAttack(attacker, defender) {
    const adv = elementAdvantage(attacker.element, defender.element);
    const raw = attacker.stats.power + 0.5 * attacker.stats.courage + attacker.stats.speed * adv;
    const noise = Math.random() * 20;
    const damage = Math.max(1, Math.round((raw + noise - defender.stats.wisdom) * 0.18));
    return { damage: damage, advantage: adv };
  }

  function buildRewardCards(rewardPool) {
    if (!Array.isArray(rewardPool) || !rewardPool.length) return [];
    const reward = rewardPool[Math.floor(Math.random() * rewardPool.length)];
    if (reward.cardType === "location") {
      return [global.TCGIdleRolling.createLocationCard(reward.baseId, "special-duel", { seen: false })];
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

    const playerQueue = creatureSection.map((id) => {
      const card = global.TCGIdleDeck.findCard(state, id);
      return card ? buildFighter(card, "player") : null;
    }).filter(Boolean);

    const enemyQueue = npc.deck.map((entry) => buildFighter(entry, "enemy"));

    state.duel.status = "running";
    state.duel.current = {
      npcId: npcId,
      tick: 0,
      playerQueue: playerQueue,
      enemyQueue: enemyQueue,
      activePlayer: 0,
      activeEnemy: 0,
      reservedSpecialCharge: Boolean(npc.special),
      difficulty: npc.difficulty,
      log: [{ tick: 0, kind: "setup", text: "Inicio do duelo contra " + npc.name + "." }],
      startedAt: Date.now(),
    };
    state.duel.lastResult = null;
    return { ok: true, npc: npc };
  }

  function tickDuel(state) {
    const ctx = state.duel.current;
    if (!ctx) return { ended: false };

    const attacker = activeFighter(ctx.playerQueue, ctx.activePlayer);
    const defender = activeFighter(ctx.enemyQueue, ctx.activeEnemy);
    if (!attacker || !defender) return finishDuel(state);

    ctx.tick += 1;
    const order = attacker.stats.speed >= defender.stats.speed ? [attacker, defender] : [defender, attacker];

    for (let i = 0; i < order.length; i += 1) {
      const a = order[i];
      const d = order[1 - i];
      if (a.hp <= 0 || d.hp <= 0) continue;
      const atk = computeAttack(a, d);
      d.hp = Math.max(0, d.hp - atk.damage);
      ctx.log.push({
        tick: ctx.tick,
        kind: "attack",
        attackerSide: a.side,
        text: a.name + " ataca " + d.name + " (" + atk.damage + " de dano)" + (atk.advantage > 0 ? " · vantagem elemental" : atk.advantage < 0 ? " · resistencia elemental" : ""),
      });
      if (d.hp <= 0) {
        d.down = true;
        ctx.log.push({ tick: ctx.tick, kind: "ko", side: d.side, text: d.name + " foi destruido quando a Energia zerou." });
        if (d.side === "player") ctx.activePlayer += 1;
        else ctx.activeEnemy += 1;
        break;
      }
    }

    if (ctx.activePlayer >= ctx.playerQueue.length || ctx.activeEnemy >= ctx.enemyQueue.length) {
      return finishDuel(state);
    }
    return { ended: false };
  }

  function finishDuel(state) {
    const ctx = state.duel.current;
    if (!ctx) return { ended: true };
    const npc = global.TCGIdleData.getNpc(ctx.npcId);
    const playerAlive = ctx.playerQueue.some((fighter) => fighter.hp > 0);
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
