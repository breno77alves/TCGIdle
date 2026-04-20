(function registerDeckView(global) {
  let pickerState = { open: false, section: null, slotIndex: null, query: "", subtype: "all", availability: "all" };

  const SECTION_META = {
    creatures: { title: "Criaturas", eyebrow: "Linha titular", size: 6, description: "Cada criatura pode ser posicionada na linha de frente ou retaguarda." },
    locations: { title: "Locais", eyebrow: "Terrenos", size: 6, description: "Secao geografica do deck. Locais ocupam espacos proprios e nao controlam expedicoes." },
    actions: { title: "Acoes", eyebrow: "Fluxo automatico", size: 20, description: "Cartas taticas que representam o repertorio usado pelas criaturas na arena." },
    spells: { title: "Magias", eyebrow: "Itens ativos", size: 6, description: "Ferramentas do duelista para intervencoes ativas durante a batalha." },
    equipment: { title: "Equipamento", eyebrow: "Vinculo", size: 6, description: "Cada criatura pode receber um equipamento proprio." },
  };

  function openPicker(section, slotIndex, ctx) {
    pickerState = { open: true, section: section, slotIndex: slotIndex, query: "", subtype: "all", availability: "all" };
    ctx.requestRender();
  }

  function getCardTitle(card) {
    if (!card) return "Vazio";
    if (card.cardType === "creature") {
      const base = global.TCGIdleData.getCreature(card.baseId);
      return base ? base.name : card.baseId;
    }
    if (card.cardType === "location") {
      const base = global.TCGIdleData.getLocation(card.baseId);
      return base ? base.name : card.baseId;
    }
    if (card.cardType === "action") {
      const base = global.TCGIdleData.getAction(card.baseId);
      return base ? base.name : card.baseId;
    }
    if (card.cardType === "equipment") {
      const base = global.TCGIdleData.getEquipment(card.baseId);
      return base ? base.name : card.baseId;
    }
    const spell = global.TCGIdleData.getSpell(card.baseId);
    return spell ? spell.name : card.baseId;
  }

  function getCardSubtitle(card) {
    if (!card) return "Toque para designar";
    if (card.cardType === "creature") {
      const base = global.TCGIdleData.getCreature(card.baseId);
      const tribe = base ? global.TCGIdleData.getTribe(base.tribe) : null;
      return tribe ? tribe.name : "Criatura";
    }
    if (card.cardType === "location") {
      const base = global.TCGIdleData.getLocation(card.baseId);
      return base ? base.tagline : "Local";
    }
    if (card.cardType === "action") {
      const base = global.TCGIdleData.getAction(card.baseId);
      return base ? base.role : "Acao";
    }
    if (card.cardType === "equipment") {
      const base = global.TCGIdleData.getEquipment(card.baseId);
      return base ? base.role : "Equipamento";
    }
    const spell = global.TCGIdleData.getSpell(card.baseId);
    return spell ? spell.role : "Magia";
  }

  function renderDeckEffectSummary(doc, card) {
    const model = global.TCGIdleCardRender.getCardDisplayModel(card);
    if (!model.effectText) return null;
    const text = doc.createElement("p");
    text.className = "deck-effect-summary";
    text.textContent = model.effectText;
    return text;
  }

  function renderEquipmentAttachment(doc, state, slotIndex, ctx) {
    const creatureSlot = global.TCGIdleDeck.getCreatureSlot(state, slotIndex);
    const equipmentCard = creatureSlot.equipmentId ? global.TCGIdleDeck.findCard(state, creatureSlot.equipmentId) : null;
    const wrap = doc.createElement("div");
    wrap.className = "deck-equipment-attachment";

    const label = doc.createElement("span");
    label.className = "deck-equipment-label";
    label.textContent = equipmentCard ? "Equipado: " + getCardTitle(equipmentCard) : "Sem equipamento";
    wrap.appendChild(label);

    if (equipmentCard) {
      const effect = renderDeckEffectSummary(doc, equipmentCard);
      if (effect) {
        effect.classList.add("deck-equipment-effect");
        wrap.appendChild(effect);
      }
    }

    const controls = doc.createElement("div");
    controls.className = "deck-equipment-actions";

    const assign = doc.createElement("button");
    assign.type = "button";
    assign.className = "mini-action";
    assign.textContent = equipmentCard ? "Trocar equipamento" : "Equipar";
    assign.disabled = !creatureSlot.instanceId;
    assign.addEventListener("click", (event) => {
      event.stopPropagation();
      openPicker("equipment", slotIndex, ctx);
    });
    controls.appendChild(assign);

    if (equipmentCard) {
      const clear = doc.createElement("button");
      clear.type = "button";
      clear.className = "mini-action mini-action-danger";
      clear.textContent = "Remover";
      clear.addEventListener("click", (event) => {
        event.stopPropagation();
        ctx.onClearDeckCard("equipment", slotIndex);
      });
      controls.appendChild(clear);
    }

    wrap.appendChild(controls);
    return wrap;
  }

  function bindSurfaceAction(node, action) {
    node.tabIndex = 0;
    node.setAttribute("role", "button");
    node.addEventListener("click", action);
    node.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      action(event);
    });
  }

  function getSubtypeLabel(card) {
    if (!card) return "";
    if (card.cardType === "creature") {
      const base = global.TCGIdleData.getCreature(card.baseId);
      const tribe = base ? global.TCGIdleData.getTribe(base.tribe) : null;
      return tribe ? tribe.name : "Criatura";
    }
    if (card.cardType === "location") {
      const base = global.TCGIdleData.getLocation(card.baseId);
      return base ? base.rarityLabel : "Local";
    }
    if (card.cardType === "action") {
      const base = global.TCGIdleData.getAction(card.baseId);
      return base ? base.role : "Acao";
    }
    if (card.cardType === "equipment") {
      const base = global.TCGIdleData.getEquipment(card.baseId);
      return base ? base.role : "Equipamento";
    }
    const spell = global.TCGIdleData.getSpell(card.baseId);
    return spell ? spell.role : "Magia";
  }

  function getPickerFilterOptions(cards) {
    const unique = new Set();
    cards.forEach((card) => {
      const label = getSubtypeLabel(card);
      if (label) unique.add(label);
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }

  function matchesPickerFilters(card, section, state) {
    const query = pickerState.query.trim().toLowerCase();
    const check = global.TCGIdleDeck.canPlaceInSection(state, section, card.instanceId, pickerState.slotIndex);
    const haystack = [getCardTitle(card), getCardSubtitle(card), getSubtypeLabel(card)].join(" ").toLowerCase();

    if (query && haystack.indexOf(query) === -1) return false;
    if (pickerState.subtype !== "all" && getSubtypeLabel(card) !== pickerState.subtype) return false;
    if (pickerState.availability === "available" && !check.ok) return false;
    if (pickerState.availability === "blocked" && check.ok) return false;
    return true;
  }

  function renderSection(root, state, ctx, sectionName) {
    const meta = SECTION_META[sectionName];
    const sectionCards = global.TCGIdleDeck.getSection(state, sectionName);
    const filled = sectionCards.filter(Boolean).length;

    const wrap = ctx.doc.createElement("section");
    wrap.className = "deck-section";
    wrap.dataset.section = sectionName;

    const header = ctx.doc.createElement("header");
    header.className = "deck-section-header";
    header.innerHTML =
      '<div><p class="eyebrow">' + meta.eyebrow + "</p><h4>" + meta.title + '</h4><p class="flavor">' + meta.description + "</p></div>" +
      '<div class="deck-section-count"><span>' + filled + " / " + meta.size + "</span></div>";
    wrap.appendChild(header);

    const board = ctx.doc.createElement("div");
    board.className = "deck-board deck-board-" + sectionName;
    sectionCards.forEach((instanceId, index) => {
      const card = instanceId ? global.TCGIdleDeck.findCard(state, instanceId) : null;
      const creatureSlot = sectionName === "creatures" ? global.TCGIdleDeck.getCreatureSlot(state, index) : null;
      const slot = ctx.doc.createElement("article");
      slot.className = "deck-slot-shell";
      slot.dataset.section = sectionName;
      slot.dataset.filled = String(Boolean(card));

      const slotHeader = ctx.doc.createElement("div");
      slotHeader.className = "deck-slot-header";
      slotHeader.innerHTML =
        '<span class="slot-number">' + meta.title + " " + (index + 1) + "</span>" +
        '<span class="slot-tribe">' + (card ? getCardSubtitle(card) : "Espaco livre") + "</span>";
      slot.appendChild(slotHeader);

      if (card) {
        const surface = global.TCGIdleCardRender.renderCard(ctx.doc, card);
        surface.classList.add("deck-slot-card");
        bindSurfaceAction(surface, () => openPicker(sectionName, index, ctx));
        slot.appendChild(surface);
      } else {
        const empty = ctx.doc.createElement("div");
        empty.className = "deck-empty-slot";
        empty.innerHTML =
          "<strong>Vazio</strong>" +
          "<span>Toque para designar uma carta neste espaco.</span>";
        bindSurfaceAction(empty, () => openPicker(sectionName, index, ctx));
        slot.appendChild(empty);
      }

      const controls = ctx.doc.createElement("div");
      controls.className = "deck-slot-controls";

      const assign = ctx.doc.createElement("button");
      assign.type = "button";
      assign.className = "mini-action";
      assign.textContent = card ? "Trocar carta" : "Designar carta";
      assign.addEventListener("click", () => openPicker(sectionName, index, ctx));
      controls.appendChild(assign);

      if (card) {
        const clear = ctx.doc.createElement("button");
        clear.type = "button";
        clear.className = "mini-action mini-action-danger";
        clear.textContent = "Remover";
        clear.addEventListener("click", () => ctx.onClearDeckCard(sectionName, index));
        controls.appendChild(clear);
      }

      slot.appendChild(controls);

      if (creatureSlot) {
        const laneToggle = ctx.doc.createElement("div");
        laneToggle.className = "lane-toggle";
        ["frontline", "backline"].forEach((lane) => {
          const laneButton = ctx.doc.createElement("button");
          laneButton.type = "button";
          laneButton.className = "lane-button";
          if (creatureSlot.lane === lane) laneButton.dataset.active = "true";
          laneButton.textContent = lane === "frontline" ? "Frontline" : "Backline";
          laneButton.addEventListener("click", () => ctx.onSetCreatureLane(index, lane));
          laneToggle.appendChild(laneButton);
        });
        slot.appendChild(laneToggle);
        slot.appendChild(renderEquipmentAttachment(ctx.doc, state, index, ctx));
      }
      board.appendChild(slot);
    });

    wrap.appendChild(board);
    root.appendChild(wrap);
  }

  function renderPicker(state, ctx) {
    const section = pickerState.section;
    const meta = SECTION_META[section];
    const cardType = global.TCGIdleDeck.SECTION_CONFIG[section].cardType;
    const cards = global.TCGIdleDeck.getCardsByType(state, cardType);
    const overlay = ctx.doc.createElement("section");
    overlay.className = "deck-picker-overlay";
    const picker = ctx.doc.createElement("section");
    picker.className = "deck-picker";

    const header = ctx.doc.createElement("header");
    header.className = "deck-picker-header";
    header.innerHTML = '<div><p class="eyebrow">' + meta.title + " " + (pickerState.slotIndex + 1) + "</p><h4>Escolha uma carta da colecao</h4></div>";
    const close = ctx.doc.createElement("button");
    close.type = "button";
    close.className = "icon-button";
    close.textContent = "Fechar";
    close.addEventListener("click", () => {
      pickerState = { open: false, section: null, slotIndex: null, query: "", subtype: "all", availability: "all" };
      ctx.requestRender();
    });
    header.appendChild(close);
    picker.appendChild(header);

    const controls = ctx.doc.createElement("div");
    controls.className = "picker-controls";

    const search = ctx.doc.createElement("label");
    search.className = "picker-search";
    const searchLabel = ctx.doc.createElement("span");
    searchLabel.textContent = "Buscar";
    const searchInput = ctx.doc.createElement("input");
    searchInput.type = "search";
    searchInput.placeholder = "Nome, funcao ou subtipo";
    searchInput.value = pickerState.query;
    searchInput.addEventListener("input", (event) => {
      pickerState.query = event.target.value;
      ctx.requestRender();
    });
    search.append(searchLabel, searchInput);
    controls.appendChild(search);

    const subtypeFilter = ctx.doc.createElement("label");
    subtypeFilter.className = "picker-filter";
    subtypeFilter.innerHTML =
      "<span>Filtro</span><select>" +
      ['<option value="all">Todos os subtipos</option>'].concat(
        getPickerFilterOptions(cards).map((label) => '<option value="' + label + '"' + (pickerState.subtype === label ? " selected" : "") + ">" + label + "</option>")
      ).join("") +
      "</select>";
    subtypeFilter.querySelector("select").addEventListener("change", (event) => {
      pickerState.subtype = event.target.value;
      ctx.requestRender();
    });
    controls.appendChild(subtypeFilter);

    const availabilityFilter = ctx.doc.createElement("label");
    availabilityFilter.className = "picker-filter";
    availabilityFilter.innerHTML =
      '<span>Status</span><select>' +
      '<option value="all"' + (pickerState.availability === "all" ? " selected" : "") + '>Todas</option>' +
      '<option value="available"' + (pickerState.availability === "available" ? " selected" : "") + '>Equipaveis</option>' +
      '<option value="blocked"' + (pickerState.availability === "blocked" ? " selected" : "") + '>Bloqueadas</option>' +
      "</select>";
    availabilityFilter.querySelector("select").addEventListener("change", (event) => {
      pickerState.availability = event.target.value;
      ctx.requestRender();
    });
    controls.appendChild(availabilityFilter);

    picker.appendChild(controls);

    const filteredCards = cards.filter((card) => matchesPickerFilters(card, section, state));
    const counter = ctx.doc.createElement("p");
    counter.className = "picker-results-count";
    counter.textContent = filteredCards.length + " carta(s) encontrada(s)";
    picker.appendChild(counter);

    const grid = ctx.doc.createElement("div");
    grid.className = "deck-picker-grid";

    filteredCards.forEach((card) => {
      const check = global.TCGIdleDeck.canPlaceInSection(state, section, card.instanceId, pickerState.slotIndex);
      const option = ctx.doc.createElement("button");
      option.type = "button";
      option.className = "picker-option";
      option.dataset.disabled = String(!check.ok);
      option.disabled = !check.ok;
      option.appendChild(global.TCGIdleCardRender.renderCard(ctx.doc, card, { variant: "mini" }));

      const copy = ctx.doc.createElement("div");
      copy.className = "picker-option-meta";
      copy.innerHTML = "<span>" + getCardSubtitle(card) + "</span>";
      if (!check.ok) {
        const reason = ctx.doc.createElement("em");
        reason.textContent = check.reason;
        copy.appendChild(reason);
      }
      option.appendChild(copy);

      if (check.ok) {
        option.addEventListener("click", () => {
          const slotIndex = pickerState.slotIndex;
          pickerState = { open: false, section: null, slotIndex: null, query: "", subtype: "all", availability: "all" };
          ctx.onAssignDeckCard(section, slotIndex, card.instanceId);
        });
      }
      grid.appendChild(option);
    });

    if (filteredCards.length) {
      picker.appendChild(grid);
    } else {
      const empty = ctx.doc.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "Nenhuma carta corresponde aos filtros atuais.";
      picker.appendChild(empty);
    }

    const clearBtn = ctx.doc.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "action-button action-button-secondary";
    clearBtn.textContent = "Esvaziar espaco";
    clearBtn.addEventListener("click", () => {
      const sectionName = pickerState.section;
      const index = pickerState.slotIndex;
      pickerState = { open: false, section: null, slotIndex: null, query: "", subtype: "all", availability: "all" };
      ctx.onClearDeckCard(sectionName, index);
    });

    overlay.addEventListener("click", (event) => {
      if (event.target !== overlay) return;
      pickerState = { open: false, section: null, slotIndex: null, query: "", subtype: "all", availability: "all" };
      ctx.requestRender();
    });
    picker.appendChild(clearBtn);
    overlay.appendChild(picker);
    return overlay;
  }

  function render(state, ctx) {
    const root = ctx.doc.querySelector("#deck-body");
    if (!root) return;
    root.innerHTML = "";

    const header = ctx.doc.createElement("header");
    header.className = "deck-header";
    header.innerHTML =
      '<div><p class="eyebrow">Sala de Guerra</p><h3>Deck por secoes</h3><p class="flavor">Seu loadout agora separa criaturas, locais, acoes e magias em pilhas proprias para leitura e expansao mais clara.</p></div>' +
      '<div class="deck-meter"><span>' + global.TCGIdleDeck.getSection(state, "creatures").filter(Boolean).length + ' / 6</span><em>' + (global.TCGIdleDeck.isDeckReady(state) ? "Linha principal pronta" : "Linha principal incompleta") + "</em></div>";
    root.appendChild(header);

    renderSection(root, state, ctx, "creatures");
    renderSection(root, state, ctx, "locations");
    renderSection(root, state, ctx, "actions");
    renderSection(root, state, ctx, "spells");

    if (pickerState.open) {
      root.appendChild(renderPicker(state, ctx));
    }
  }

  function reset() {
    pickerState = { open: false, section: null, slotIndex: null, query: "", subtype: "all", availability: "all" };
  }

  global.TCGIdleDeckView = { render: render, reset: reset };
})(window);
