(function registerCardRender(global) {
  const STAT_META = {
    courage: {
      label: "Coragem",
      short: "CR",
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.4 4.9 13.8C3 12.1 2 10.3 2 8.3 2 5.4 4.1 3.5 6.8 3.5c1.8 0 3.3.8 4.2 2.2.9-1.4 2.4-2.2 4.2-2.2 2.7 0 4.8 1.9 4.8 4.8 0 2-1 3.8-2.9 5.5L12 20.4Z" fill="currentColor"/></svg>',
    },
    power: {
      label: "Potencia",
      short: "PO",
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.2 2 5 13h5.3L9.8 22 19 10.9h-5.2L13.2 2Z" fill="currentColor"/></svg>',
    },
    wisdom: {
      label: "Sabedoria",
      short: "SA",
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5C6.8 5 3.1 8.2 1.6 12c1.5 3.8 5.2 7 10.4 7s8.9-3.2 10.4-7C20.9 8.2 17.2 5 12 5Zm0 11.1A4.1 4.1 0 1 1 12 7.9a4.1 4.1 0 0 1 0 8.2Zm0-2.2a1.9 1.9 0 1 0 0-3.8 1.9 1.9 0 0 0 0 3.8Z" fill="currentColor"/></svg>',
    },
    speed: {
      label: "Velocidade",
      short: "VL",
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12.6c2.1-2.6 4.2-3.9 6.3-3.9 2.4 0 3.3 1.6 5.2 1.6 1.3 0 2.8-.7 4.5-2.1v2.6c-1.8 1.5-3.4 2.2-4.9 2.2-2.3 0-3.3-1.6-5.1-1.6-1.5 0-3 .8-4.5 2.4L3 12.6Zm1.5 4.8c1.6-1.4 3.1-2.1 4.6-2.1 1.8 0 2.8 1.5 5.1 1.5 1.5 0 3.1-.7 4.8-2.2V17c-1.7 1.3-3.3 2-4.7 2-2 0-2.9-1.5-5.2-1.5-1.4 0-2.9.7-4.6 2.1v-2.2Z" fill="currentColor"/></svg>',
    },
    energy: {
      label: "Energia",
      short: "EN",
      icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2c2.8 3 5.6 6.1 5.6 10A5.6 5.6 0 1 1 6.4 12.2c0-1.7.7-3.4 1.9-5l1.7 2.3c-.5.9-.8 1.8-.8 2.8a2.8 2.8 0 1 0 5.6 0c0-1.5-.8-3.1-2.8-5.4Z" fill="currentColor"/></svg>',
    },
  };

  function pctInRange(value, band) {
    if (!Array.isArray(band) || band.length !== 2 || band[1] === band[0]) return 0;
    const pct = (value - band[0]) / (band[1] - band[0]);
    return Math.max(0, Math.min(1, pct));
  }

  function getStatIconMarkup(key) {
    const meta = STAT_META[key];
    if (!meta) return '<span class="stat-short">' + key + "</span>";
    return '<span class="stat-short" title="' + meta.label + '">' + meta.short + "</span>";
  }

  function statRow(doc, key, value, band) {
    const row = doc.createElement("div");
    row.className = "stat-row";
    row.dataset.stat = key;

    const label = doc.createElement("span");
    label.className = "stat-label";
    label.innerHTML = getStatIconMarkup(key) + '<span class="stat-sr">' + ((STAT_META[key] && STAT_META[key].label) || key) + "</span>";

    const valueEl = doc.createElement("span");
    valueEl.className = "stat-value";
    valueEl.textContent = String(value);

    const track = doc.createElement("div");
    track.className = "stat-track";
    const fill = doc.createElement("div");
    fill.className = "stat-fill";
    fill.style.width = (pctInRange(value, band) * 100).toFixed(1) + "%";
    track.appendChild(fill);

    const range = doc.createElement("span");
    range.className = "stat-range";
    range.textContent = Array.isArray(band) ? band[0] + "-" + band[1] : "";

    row.append(label, valueEl, track, range);
    return row;
  }

  function resolveCardBase(card) {
    const data = global.TCGIdleData;
    if (card.cardType === "location") {
      const location = data.getLocation(card.baseId);
      return {
        kind: "location",
        title: location ? location.name : card.baseId,
        subtitle: location ? location.description : "",
        portrait: location ? location.portrait : "",
        badge: location ? location.rarityLabel : "Rota",
        label: "Local",
        tribe: null,
        element: "mapa",
        ranges: null,
        meta: location,
      };
    }
    if (card.cardType === "action") {
      const action = data.getAction(card.baseId);
      return {
        kind: "action",
        title: action ? action.name : card.baseId,
        subtitle: action ? action.description : "",
        portrait: action ? action.portrait : "",
        badge: "Acao",
        label: action ? action.role : "tatico",
        tribe: null,
        element: "acao",
        ranges: null,
        meta: action,
      };
    }
    if (card.cardType === "spell") {
      const spell = data.getSpell(card.baseId);
      return {
        kind: "spell",
        title: spell ? spell.name : card.baseId,
        subtitle: spell ? spell.description : "",
        portrait: spell ? spell.portrait : "",
        badge: "Magia",
        label: spell ? spell.role : "ativo",
        tribe: null,
        element: "magia",
        ranges: null,
        meta: spell,
      };
    }
    if (card.cardType === "equipment") {
      const equipment = data.getEquipment(card.baseId);
      return {
        kind: "equipment",
        title: equipment ? equipment.name : card.baseId,
        subtitle: equipment ? equipment.description : "",
        portrait: equipment ? equipment.portrait : "",
        badge: "Equipamento",
        label: equipment ? equipment.role : "arsenal",
        tribe: null,
        element: "equipamento",
        ranges: null,
        meta: equipment,
      };
    }

    const creature = data.getCreature(card.baseId);
    const tribe = creature ? data.getTribe(creature.tribe) : null;
    return {
      kind: "creature",
      title: creature ? creature.name : card.baseId,
      subtitle: creature ? creature.tagline : "",
      portrait: creature ? creature.portrait : "",
      badge: tribe ? tribe.name : "Criatura",
      label: global.TCGIdleRolling.rollQualityLabel(card),
      tribe: tribe,
      element: creature ? creature.element : "",
      ranges: creature ? creature.ranges : null,
      meta: creature,
    };
  }

  function renderMetaChips(doc, card, info) {
    const wrap = doc.createElement("div");
    wrap.className = "location-highlights";
    if (card.cardType === "location" && info.meta) {
      wrap.innerHTML =
        '<span class="location-chip">Adjacentes: ' + (info.meta.adjacentLocationIds || []).length + "</span>" +
        '<span class="location-chip">Duracao: ' + Math.round(info.meta.durationMs / 1000) + "s</span>";
      return wrap;
    }
    if ((card.cardType === "action" || card.cardType === "spell" || card.cardType === "equipment") && info.meta) {
      wrap.innerHTML =
        '<span class="location-chip">' + info.badge + "</span>" +
        '<span class="location-chip">' + info.label + "</span>";
      return wrap;
    }
    return null;
  }

  function renderCard(doc, card, options) {
    options = options || {};
    const info = resolveCardBase(card);
    const quality = global.TCGIdleRolling.rollQualityLabel(card);

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
      img.alt = info.title;
      img.loading = "lazy";
      portrait.appendChild(img);
    }

    const frameHeader = doc.createElement("header");
    frameHeader.className = "card-frame-header";
    const leftTag = doc.createElement("span");
    leftTag.className = "card-tribe-tag";
    leftTag.textContent = info.badge;
    const rightTag = doc.createElement("span");
    rightTag.className = "card-quality-tag";
    rightTag.textContent = card.cardType === "creature" ? quality : info.label;
    frameHeader.append(leftTag, rightTag);
    frame.append(frameHeader, portrait);

    const body = doc.createElement("div");
    body.className = "card-body";

    const name = doc.createElement("h3");
    name.className = "card-name";
    name.textContent = info.title;

    const subtitle = doc.createElement("p");
    subtitle.className = "card-subtitle";
    subtitle.textContent = info.subtitle;

    const element = doc.createElement("span");
    element.className = "card-element";
    element.dataset.element = info.element;
    element.textContent = card.cardType === "location" ? "local" : card.cardType === "action" ? "acao" : card.cardType === "spell" ? "magia" : info.element;

    body.append(name, subtitle, element);

    if (card.cardType === "creature" && options.stats !== false) {
      const stats = doc.createElement("div");
      stats.className = "card-stats";
      global.TCGIdleRolling.STAT_KEYS.forEach((key) => {
        stats.appendChild(statRow(doc, key, card.stats[key], info.ranges ? info.ranges[key] : null));
      });
      body.appendChild(stats);
    } else {
      const chips = renderMetaChips(doc, card, info);
      if (chips) body.appendChild(chips);
    }

    el.append(frame, body);
    return el;
  }

  global.TCGIdleCardRender = {
    renderCard: renderCard,
    STAT_META: STAT_META,
    getStatIconMarkup: getStatIconMarkup,
  };
})(window);
