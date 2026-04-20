(function registerRolling(global) {
  const STAT_KEYS = ["courage", "power", "wisdom", "speed", "energy"];

  function rollInRange(min, max) {
    const lo = Math.round(min);
    const hi = Math.round(max);
    if (hi <= lo) {
      return lo;
    }
    return lo + Math.floor(Math.random() * (hi - lo + 1));
  }

  function rollStats(ranges) {
    const stats = {};
    STAT_KEYS.forEach((key) => {
      const band = ranges && ranges[key];
      if (Array.isArray(band) && band.length === 2) {
        stats[key] = rollInRange(band[0], band[1]);
      } else {
        stats[key] = 50;
      }
    });
    return stats;
  }

  function makeInstanceId(baseId) {
    const rand = Math.random().toString(36).slice(2, 8);
    const time = Date.now().toString(36).slice(-4);
    return baseId + "-" + time + rand;
  }

  function createCreatureCard(baseId, stats, source, options) {
    options = options || {};
    return {
      instanceId: options.instanceId || makeInstanceId(baseId),
      cardType: "creature",
      baseId: baseId,
      stats: Object.assign({}, stats),
      rolledAt: options.rolledAt || new Date().toISOString(),
      source: source || "expedition",
      seen: Boolean(options.seen),
    };
  }

  function createLocationCard(baseId, source, options) {
    options = options || {};
    return {
      instanceId: options.instanceId || makeInstanceId(baseId),
      cardType: "location",
      baseId: baseId,
      stats: null,
      rolledAt: options.rolledAt || new Date().toISOString(),
      source: source || "location-scan",
      seen: Boolean(options.seen),
    };
  }

  function createActionCard(baseId, source, options) {
    options = options || {};
    return {
      instanceId: options.instanceId || makeInstanceId(baseId),
      cardType: "action",
      baseId: baseId,
      stats: null,
      rolledAt: options.rolledAt || new Date().toISOString(),
      source: source || "expedition",
      seen: Boolean(options.seen),
    };
  }

  function createSpellCard(baseId, source, options) {
    options = options || {};
    return {
      instanceId: options.instanceId || makeInstanceId(baseId),
      cardType: "spell",
      baseId: baseId,
      stats: null,
      rolledAt: options.rolledAt || new Date().toISOString(),
      source: source || "expedition",
      seen: Boolean(options.seen),
    };
  }

  function createEquipmentCard(baseId, source, options) {
    options = options || {};
    return {
      instanceId: options.instanceId || makeInstanceId(baseId),
      cardType: "equipment",
      baseId: baseId,
      stats: null,
      rolledAt: options.rolledAt || new Date().toISOString(),
      source: source || "expedition",
      seen: Boolean(options.seen),
    };
  }

  function rollCard(baseId, source) {
    const data = global.TCGIdleData;
    if (!data) {
      return null;
    }
    const base = data.getCreature(baseId);
    if (!base) {
      return null;
    }
    return createCreatureCard(baseId, rollStats(base.ranges), source, { seen: false });
  }

  function rollEliteCard(baseId, source) {
    const data = global.TCGIdleData;
    if (!data) {
      return null;
    }
    const base = data.getCreature(baseId);
    if (!base) {
      return null;
    }

    const stats = {};
    STAT_KEYS.forEach((key) => {
      const band = base.ranges[key];
      if (!Array.isArray(band) || band.length !== 2) {
        stats[key] = 50;
        return;
      }
      const floor = band[0] + (band[1] - band[0]) * 0.78;
      stats[key] = rollInRange(Math.ceil(floor), band[1]);
    });

    return createCreatureCard(baseId, stats, source || "special-duel", { seen: false });
  }

  function rollQualityLabel(card) {
    const data = global.TCGIdleData;
    if (!data || !card) {
      return "Comum";
    }
    if (card.cardType === "location") {
      const location = data.getLocation(card.baseId);
      return location && location.rarityLabel ? location.rarityLabel : "Rota";
    }
    if (card.cardType === "action") {
      const action = data.getAction(card.baseId);
      return action ? "Acao " + action.role : "Acao";
    }
    if (card.cardType === "spell") {
      const spell = data.getSpell(card.baseId);
      return spell ? "Magia " + spell.role : "Magia";
    }
    if (card.cardType === "equipment") {
      const equipment = data.getEquipment(card.baseId);
      return equipment ? "Equipamento " + equipment.role : "Equipamento";
    }

    const base = data.getCreature(card.baseId);
    if (!base) {
      return "Comum";
    }
    let sumPct = 0;
    let count = 0;
    STAT_KEYS.forEach((key) => {
      const band = base.ranges[key];
      if (Array.isArray(band) && band.length === 2 && band[1] > band[0]) {
        const pct = (card.stats[key] - band[0]) / (band[1] - band[0]);
        sumPct += Math.max(0, Math.min(1, pct));
        count += 1;
      }
    });
    if (count === 0) {
      return "Comum";
    }
    const avg = sumPct / count;
    if (avg >= 0.8) return "Excepcional";
    if (avg >= 0.6) return "Refinado";
    if (avg >= 0.4) return "Estavel";
    if (avg >= 0.2) return "Rustico";
    return "Palido";
  }

  global.TCGIdleRolling = {
    STAT_KEYS: STAT_KEYS,
    rollInRange: rollInRange,
    rollStats: rollStats,
    createCreatureCard: createCreatureCard,
    createLocationCard: createLocationCard,
    createActionCard: createActionCard,
    createSpellCard: createSpellCard,
    createEquipmentCard: createEquipmentCard,
    rollCard: rollCard,
    rollEliteCard: rollEliteCard,
    rollQualityLabel: rollQualityLabel,
  };
})(window);
