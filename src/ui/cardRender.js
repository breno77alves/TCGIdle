(function registerCardRender(global) {
  const STAT_META = {
    courage: { label: "Coragem", short: "CR" },
    power: { label: "Potencia", short: "PO" },
    wisdom: { label: "Sabedoria", short: "SA" },
    speed: { label: "Velocidade", short: "VL" },
    energy: { label: "Energia", short: "EN" },
  };

  function resolveCardBase(card) {
    const data = global.TCGIdleData;
    if (card.cardType === "location") {
      const location = data.getLocation(card.baseId);
      return {
        kind: "location",
        title: location ? location.name : card.baseId,
        portrait: location ? location.portrait : "",
        meta: location,
      };
    }
    if (card.cardType === "action") {
      const action = data.getAction(card.baseId);
      return {
        kind: "action",
        title: action ? action.name : card.baseId,
        portrait: action ? action.portrait : "",
        meta: action,
      };
    }
    if (card.cardType === "spell") {
      const spell = data.getSpell(card.baseId);
      return {
        kind: "spell",
        title: spell ? spell.name : card.baseId,
        portrait: spell ? spell.portrait : "",
        meta: spell,
      };
    }
    if (card.cardType === "equipment") {
      const equipment = data.getEquipment(card.baseId);
      return {
        kind: "equipment",
        title: equipment ? equipment.name : card.baseId,
        portrait: equipment ? equipment.portrait : "",
        meta: equipment,
      };
    }

    const creature = data.getCreature(card.baseId);
    const tribe = creature ? data.getTribe(creature.tribe) : null;
    return {
      kind: "creature",
      title: creature ? creature.name : card.baseId,
      portrait: creature ? creature.portrait : "",
      tribe: tribe,
      meta: creature,
    };
  }

  function normalizeDamageProfile(meta) {
    const profile = meta && meta.damageProfile ? meta.damageProfile : meta || {};
    const elemental = [];
    const rawElemental = profile.elemental || meta && meta.elementalDamage || [];
    if (Array.isArray(rawElemental)) {
      rawElemental.forEach((entry) => {
        if (!entry || !entry.element) return;
        const amount = Number.isFinite(entry.amount) ? entry.amount : (Number.isFinite(entry.damage) ? entry.damage : 0);
        if (amount <= 0) return;
        elemental.push({ element: entry.element, amount: amount });
      });
    }
    return {
      base: Number.isFinite(profile.base) ? profile.base : (Number.isFinite(meta && meta.baseDamage) ? meta.baseDamage : 0),
      cosmic: Number.isFinite(profile.cosmic) ? profile.cosmic : (Number.isFinite(meta && meta.cosmicDamage) ? meta.cosmicDamage : 0),
      magic: Number.isFinite(profile.magic) ? profile.magic : (Number.isFinite(meta && meta.magicDamage) ? meta.magicDamage : 0),
      true: Number.isFinite(profile.true) ? profile.true : (Number.isFinite(meta && meta.trueDamage) ? meta.trueDamage : 0),
      elemental: elemental,
    };
  }

  function getElementLabel(element) {
    const labels = {
      fire: "Elem Fogo",
      water: "Elem Agua",
      earth: "Elem Terra",
      air: "Elem Ar",
    };
    return labels[element] || ("Elem " + element);
  }

  function getDamageEntries(meta, options) {
    const settings = Object.assign({ includeBase: true }, options);
    const profile = normalizeDamageProfile(meta);
    const entries = [];
    if (settings.includeBase && profile.base > 0) entries.push({ tone: "base", label: "Base", value: profile.base });
    if (profile.cosmic > 0) entries.push({ tone: "cosmic", label: "Cosmico", value: profile.cosmic });
    profile.elemental.forEach((entry) => {
      entries.push({ tone: "elemental", label: getElementLabel(entry.element), value: entry.amount });
    });
    if (profile.magic > 0) entries.push({ tone: "magic", label: "Magico", value: profile.magic });
    if (profile.true > 0) entries.push({ tone: "true", label: "Verdadeiro", value: profile.true });
    return entries;
  }

  function describeScaleEntry(entry) {
    const statMeta = STAT_META[entry.stat];
    const statLabel = statMeta ? statMeta.short : entry.stat;
    const percent = Math.round((entry.ratio || 0) * 100);
    return "+" + percent + "% de " + statLabel;
  }

  function describeModifier(effect) {
    if (!effect) return "";
    const parts = [];
    if (effect.source) parts.push(effect.source + ":");
    if (effect.flatDamage) parts.push("+" + effect.flatDamage + " dano");
    if (effect.flatMitigation) parts.push("+" + effect.flatMitigation + " mitigacao");
    if (effect.thresholdBonus) parts.push("+" + effect.thresholdBonus + " em checks");
    if (effect.bonusEnergy) parts.push("+" + effect.bonusEnergy + " Energia inicial");
    if (Array.isArray(effect.statScale) && effect.statScale.length) {
      parts.push(effect.statScale.map(describeScaleEntry).join(", "));
    }
    if (effect.lane === "frontline") parts.push("na frontline");
    if (effect.lane === "backline") parts.push("na backline");
    return parts.join(" ");
  }

  function describeActionChecks(meta) {
    if (!meta || !Array.isArray(meta.checks) || !meta.checks.length) return "";
    return meta.checks.map((check) => {
      const statMeta = STAT_META[check.stat];
      const statLabel = statMeta ? statMeta.short : check.stat;
      const success = check.success && check.success.flatDamage ? "+" + check.success.flatDamage + " dano" : "efeito adicional";
      return "Check " + statLabel + " " + (check.threshold || 0) + ": " + success;
    }).join(" ");
  }

  function getEffectText(card, info) {
    if (info.meta && typeof info.meta.description === "string" && info.meta.description) {
      return info.meta.description;
    }
    if (card.cardType === "creature" && info.meta && Array.isArray(info.meta.passives) && info.meta.passives.length) {
      return info.meta.passives.map(describeModifier).filter(Boolean).join(" ");
    }
    if (card.cardType === "action") {
      return describeActionChecks(info.meta);
    }
    return "";
  }

  function getTokenLabel(card, info) {
    if (card.cardType === "creature") {
      const tokenCount = info.meta && Number.isFinite(info.meta.tokenCount) ? info.meta.tokenCount : 0;
      return "Tokens " + tokenCount;
    }
    if (card.cardType === "spell") {
      const tokenCost = info.meta && Number.isFinite(info.meta.tokenCost) ? info.meta.tokenCost : 0;
      return "Custo " + tokenCost + " token" + (tokenCost === 1 ? "" : "s");
    }
    return "";
  }

  function renderDamageStack(doc, entries, options) {
    const settings = Object.assign({ compact: false, limit: 99, emptyLabel: "Sem dano extra" }, options);
    const wrap = doc.createElement("div");
    wrap.className = "damage-stack";
    if (settings.compact) wrap.classList.add("damage-stack-compact");

    const visible = entries.slice(0, settings.limit);
    visible.forEach((entry) => {
      const row = doc.createElement("div");
      row.className = "damage-chip";
      row.dataset.tone = entry.tone;
      row.innerHTML = "<span>" + entry.label + "</span><strong>" + entry.value + "</strong>";
      wrap.appendChild(row);
    });

    if (!visible.length) {
      const empty = doc.createElement("div");
      empty.className = "damage-chip";
      empty.dataset.tone = "empty";
      empty.innerHTML = "<span>" + settings.emptyLabel + "</span>";
      wrap.appendChild(empty);
    } else if (entries.length > visible.length) {
      const extra = doc.createElement("div");
      extra.className = "damage-chip";
      extra.dataset.tone = "meta";
      extra.innerHTML = "<span>+" + (entries.length - visible.length) + "</span>";
      wrap.appendChild(extra);
    }
    return wrap;
  }

  function renderCompactStats(doc, card) {
    const wrap = doc.createElement("div");
    wrap.className = "card-stat-column";
    global.TCGIdleRolling.STAT_KEYS.forEach((key) => {
      const meta = STAT_META[key];
      const row = doc.createElement("div");
      row.className = "card-stat-line";
      if (key === "energy") row.dataset.stat = "energy";
      row.innerHTML = "<span>" + meta.short + "</span><strong>" + card.stats[key] + "</strong>";
      wrap.appendChild(row);
    });
    return wrap;
  }

  function getCardDisplayModel(card) {
    const info = resolveCardBase(card);
    return {
      title: info.title,
      effectText: getEffectText(card, info),
      tokenLabel: getTokenLabel(card, info),
      damageEntries: getDamageEntries(info.meta, { includeBase: true }),
      info: info,
    };
  }

  function renderCard(doc, card, options) {
    options = options || {};
    const model = getCardDisplayModel(card);
    const info = model.info;

    const el = doc.createElement("article");
    el.className = "card-token";
    el.dataset.instanceId = card.instanceId;
    el.dataset.cardType = card.cardType || "creature";
    if (info.tribe) {
      el.dataset.tribe = info.tribe.id;
      el.style.setProperty("--tribe-accent", info.tribe.accent);
      el.style.setProperty("--tribe-soft", info.tribe.accentSoft);
    } else if (card.cardType === "action") {
      el.style.setProperty("--tribe-accent", "#d66a52");
      el.style.setProperty("--tribe-soft", "rgba(214, 106, 82, 0.2)");
    } else if (card.cardType === "spell") {
      el.style.setProperty("--tribe-accent", "#8f9af4");
      el.style.setProperty("--tribe-soft", "rgba(143, 154, 244, 0.2)");
    } else {
      el.style.setProperty("--tribe-accent", "#8DD4C4");
      el.style.setProperty("--tribe-soft", "rgba(72, 141, 141, 0.24)");
    }
    if (options.variant) {
      el.dataset.variant = options.variant;
    }
    if (!card.seen) {
      el.dataset.unseen = "true";
    }

    const frame = doc.createElement("div");
    frame.className = "card-frame";
    const portrait = doc.createElement("div");
    portrait.className = "card-portrait";
    if (info.portrait) {
      const img = doc.createElement("img");
      img.src = info.portrait;
      img.alt = model.title;
      img.loading = "lazy";
      portrait.appendChild(img);
    }
    frame.appendChild(portrait);

    const body = doc.createElement("div");
    body.className = "card-body";

    const name = doc.createElement("h3");
    name.className = "card-name";
    name.textContent = model.title;
    body.appendChild(name);

    const layout = doc.createElement("div");
    layout.className = "card-layout";
    layout.dataset.kind = card.cardType || "creature";

    if (card.cardType === "creature") {
      const left = doc.createElement("aside");
      left.className = "card-side-panel";
      left.appendChild(renderDamageStack(doc, model.damageEntries));

      const center = doc.createElement("div");
      center.className = "card-main-copy";
      center.innerHTML = '<p class="card-effect-text">' + (model.effectText || "Sem efeito adicional.") + "</p>";

      const right = renderCompactStats(doc, card);
      layout.append(left, center, right);
      body.appendChild(layout);

      const footer = doc.createElement("div");
      footer.className = "card-footer-strip";
      footer.innerHTML = '<span class="card-token-pill">' + model.tokenLabel + "</span>";
      body.appendChild(footer);
    } else if (card.cardType === "action") {
      const left = doc.createElement("aside");
      left.className = "card-side-panel";
      left.appendChild(renderDamageStack(doc, model.damageEntries));

      const center = doc.createElement("div");
      center.className = "card-main-copy";
      center.innerHTML = '<p class="card-effect-text">' + (model.effectText || "Sem efeito adicional.") + "</p>";
      layout.append(left, center);
      body.appendChild(layout);
    } else if (card.cardType === "spell") {
      const left = doc.createElement("aside");
      left.className = "card-side-panel";
      const cost = doc.createElement("div");
      cost.className = "card-token-cost";
      cost.textContent = model.tokenLabel;
      left.appendChild(cost);

      const center = doc.createElement("div");
      center.className = "card-main-copy";
      center.innerHTML = '<p class="card-effect-text">' + (model.effectText || "Sem efeito adicional.") + "</p>";
      layout.append(left, center);
      body.appendChild(layout);
    } else {
      const centerOnly = doc.createElement("div");
      centerOnly.className = "card-main-copy card-main-copy-wide";
      centerOnly.innerHTML = '<p class="card-effect-text">' + (model.effectText || "Sem efeito adicional.") + "</p>";
      layout.append(centerOnly);
      body.appendChild(layout);
    }

    el.append(frame, body);
    return el;
  }

  global.TCGIdleCardRender = {
    renderCard: renderCard,
    STAT_META: STAT_META,
    getDamageEntries: getDamageEntries,
    renderDamageStack: renderDamageStack,
    renderCompactStats: renderCompactStats,
    getCardDisplayModel: getCardDisplayModel,
  };
})(window);
