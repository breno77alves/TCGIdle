(function registerDeckView(global) {
  let pickerState = { open: false, section: null, slotIndex: null, query: "", subtype: "all", availability: "all" };

  const SECTION_META = {
    creatures: { title: "Criaturas", eyebrow: "Linha titular", size: 6, description: "Base do duelo automatico. Maximo de 2 copias por especie." },
    locations: { title: "Locais", eyebrow: "Terrenos", size: 6, description: "Secao geografica do deck. Locais ocupam espacos proprios e nao controlam expedicoes." },
    actions: { title: "Acoes", eyebrow: "Fluxo automatico", size: 20, description: "Cartas taticas que representam o repertorio usado pelas criaturas na arena." },
    spells: { title: "Magias", eyebrow: "Itens ativos", size: 6, description: "Ferramentas do duelista para intervencoes ativas durante a batalha." },
  };

  function openPicker(section, slotIndex, ctx) {
    pickerState = { open: true, section: section, slotIndex: slotIndex, query: "", subtype: "all", availability: "all" };
    ctx.requestRender();
  }

  function renderThumb(doc, image, alt, className) {
    const wrap = doc.createElement("div");
    wrap.className = className;
    if (image) {
      const img = doc.createElement("img");
      img.src = image;
      img.alt = alt;
      img.loading = "lazy";
      wrap.appendChild(img);
    }
    return wrap;
  }

  function getCardImage(card) {
    if (!card) return "";
    if (card.cardType === "creature") {
      const base = global.TCGIdleData.getCreature(card.baseId);
      return base ? base.portrait : "";
    }
    if (card.cardType === "location") {
      const base = global.TCGIdleData.getLocation(card.baseId);
      return base ? base.portrait : "";
    }
    if (card.cardType === "action") {
      const base = global.TCGIdleData.getAction(card.baseId);
      return base ? base.portrait : "";
    }
    const spell = global.TCGIdleData.getSpell(card.baseId);
    return spell ? spell.portrait : "";
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
    const spell = global.TCGIdleData.getSpell(card.baseId);
    return spell ? spell.role : "Magia";
  }

  function renderSlotStats(card) {
    if (!card || card.cardType !== "creature") return "";
    return '<div class="slot-stats">' +
      "<span>CR <b>" + card.stats.courage + "</b></span>" +
      "<span>PO <b>" + card.stats.power + "</b></span>" +
      "<span>SA <b>" + card.stats.wisdom + "</b></span>" +
      "<span>VL <b>" + card.stats.speed + "</b></span>" +
      '<span class="slot-energy">EN <b>' + card.stats.energy + "</b></span>" +
      "</div>";
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
      const slot = ctx.doc.createElement("button");
      slot.type = "button";
      slot.className = "deck-slot";
      slot.dataset.section = sectionName;
      slot.dataset.filled = String(Boolean(card));

      if (card) {
        slot.appendChild(renderThumb(ctx.doc, getCardImage(card), getCardTitle(card), "deck-slot-portrait"));
        const copy = ctx.doc.createElement("div");
        copy.className = "deck-slot-copy";
        copy.innerHTML =
          '<span class="slot-number">' + meta.title + " " + (index + 1) + "</span>" +
          "<strong>" + getCardTitle(card) + "</strong>" +
          '<span class="slot-tribe">' + getCardSubtitle(card) + "</span>" +
          renderSlotStats(card);
        slot.appendChild(copy);
      } else {
        slot.innerHTML =
          '<span class="slot-number">' + meta.title + " " + (index + 1) + "</span>" +
          "<strong>Vazio</strong>" +
          '<span class="slot-tribe">Toque para designar</span>';
      }

      slot.addEventListener("click", () => openPicker(sectionName, index, ctx));
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
      option.appendChild(renderThumb(ctx.doc, getCardImage(card), getCardTitle(card), "picker-option-portrait"));

      const copy = ctx.doc.createElement("div");
      copy.className = "picker-option-copy";
      copy.innerHTML =
        "<strong>" + getCardTitle(card) + "</strong>" +
        "<span>" + getCardSubtitle(card) + "</span>" +
        (card.cardType === "creature" ? renderSlotStats(card).replace('slot-stats', 'slot-stats picker-option-stats') : "") +
        (check.ok ? "" : "<em>" + check.reason + "</em>");
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
