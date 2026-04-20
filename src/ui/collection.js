(function registerCollectionView(global) {
  let detailState = { open: false, cardType: "creature", baseId: null };

  function scoreCreatureCard(card) {
    if (!card || !card.stats) return 0;
    return global.TCGIdleRolling.STAT_KEYS.reduce((sum, key) => sum + (card.stats[key] || 0), 0);
  }

  function groupCards(cards) {
    const groups = new Map();
    cards.forEach((card) => {
      const key = card.cardType + ":" + card.baseId;
      if (!groups.has(key)) {
        groups.set(key, { cardType: card.cardType, baseId: card.baseId, copies: [] });
      }
      groups.get(key).copies.push(card);
    });

    return Array.from(groups.values()).map((group) => {
      const copies = group.copies.slice().sort((a, b) => scoreCreatureCard(b) - scoreCreatureCard(a));
      return Object.assign(group, {
        copies: copies,
        display: copies[0],
      });
    });
  }

  function infoForGroup(group) {
    const data = global.TCGIdleData;
    if (group.cardType === "location") {
      const location = data.getLocation(group.baseId);
      return {
        title: location ? location.name : group.baseId,
        subtitle: location ? location.tagline : "",
        accent: "#89d2c0",
      };
    }
    if (group.cardType === "action") {
      const action = data.getAction(group.baseId);
      return {
        title: action ? action.name : group.baseId,
        subtitle: action ? action.tagline : "",
        accent: "#d66a52",
      };
    }
    if (group.cardType === "spell") {
      const spell = data.getSpell(group.baseId);
      return {
        title: spell ? spell.name : group.baseId,
        subtitle: spell ? spell.tagline : "",
        accent: "#8f9af4",
      };
    }
    const creature = data.getCreature(group.baseId);
    const tribe = creature ? data.getTribe(creature.tribe) : null;
    return {
      title: creature ? creature.name : group.baseId,
      subtitle: creature ? creature.tagline : "",
      accent: tribe ? tribe.accent : "#e0b763",
      tribe: tribe,
    };
  }

  function renderGroupShelf(root, ctx, title, eyebrow, flavor, groups, kind) {
    if (!groups.length) return;
    const section = ctx.doc.createElement("section");
    section.className = "tribe-shelf catalog-shelf";
    section.dataset.catalogKind = kind;

    const header = ctx.doc.createElement("div");
    header.className = "tribe-shelf-header";
    header.innerHTML =
      '<div><p class="eyebrow">' + eyebrow + "</p><h4>" + title + '</h4><p class="flavor">' + flavor + "</p></div>" +
      '<span class="tribe-badge">' + groups.length + "</span>";

    const grid = ctx.doc.createElement("div");
    grid.className = "card-grid catalog-grid";
    groups.forEach((group) => {
      const node = global.TCGIdleCardRender.renderCard(ctx.doc, group.display, { variant: "catalog" });
      const info = infoForGroup(group);
      node.classList.add("catalog-entry");
      node.style.setProperty("--catalog-accent", info.accent || "#e0b763");
      node.dataset.selected = String(detailState.cardType === group.cardType && detailState.baseId === group.baseId);

      const badge = ctx.doc.createElement("span");
      badge.className = "catalog-count-badge";
      badge.textContent = "x" + group.copies.length;
      node.appendChild(badge);

      node.addEventListener("click", () => {
        detailState = { open: true, cardType: group.cardType, baseId: group.baseId };
        if (group.display) ctx.onInspectCard(group.display.instanceId);
        ctx.requestRender();
      });
      grid.appendChild(node);
    });

    section.append(header, grid);
    root.appendChild(section);
  }

  function renderDetail(root, ctx, groups) {
    if (!detailState.open) return;
    const group = groups.find((entry) => entry.cardType === detailState.cardType && entry.baseId === detailState.baseId) || groups[0];
    if (!group) return;
    detailState = { open: true, cardType: group.cardType, baseId: group.baseId };

    const info = infoForGroup(group);
    const overlay = ctx.doc.createElement("section");
    overlay.className = "catalog-detail-overlay";
    const panel = ctx.doc.createElement("section");
    panel.className = "catalog-detail";
    panel.innerHTML =
      '<header class="catalog-detail-header"><div><p class="eyebrow">Registro aberto</p><h3>' + info.title + '</h3><p class="flavor">' + info.subtitle + '</p></div>' +
      '<div class="catalog-detail-actions"><div class="catalog-detail-meta"><span>Copias</span><strong>' + group.copies.length + '</strong></div><button type="button" class="icon-button catalog-close-button">Fechar</button></div></header>';

    const list = ctx.doc.createElement("div");
    list.className = "card-grid catalog-detail-grid";
    group.copies.forEach((card) => {
      const node = global.TCGIdleCardRender.renderCard(ctx.doc, card);
      list.appendChild(node);
    });
    panel.appendChild(list);
    panel.querySelector(".catalog-close-button").addEventListener("click", () => {
      detailState = { open: false, cardType: detailState.cardType, baseId: detailState.baseId };
      ctx.requestRender();
    });
    overlay.addEventListener("click", (event) => {
      if (event.target !== overlay) return;
      detailState = { open: false, cardType: detailState.cardType, baseId: detailState.baseId };
      ctx.requestRender();
    });
    overlay.appendChild(panel);
    root.appendChild(overlay);
  }

  function render(state, ctx) {
    const root = ctx.doc.querySelector("#collection-body");
    if (!root) return;
    root.innerHTML = "";

    if (!state.collection.cards.length) {
      const empty = ctx.doc.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "O tomo esta vazio. Inicie uma expedicao para arquivar os primeiros scans.";
      root.appendChild(empty);
      return;
    }

    const groups = groupCards(state.collection.cards);
    const creatureGroups = groups.filter((group) => group.cardType === "creature");
    const locationGroups = groups.filter((group) => group.cardType === "location");
    const actionGroups = groups.filter((group) => group.cardType === "action");
    const spellGroups = groups.filter((group) => group.cardType === "spell");

    const summary = ctx.doc.createElement("header");
    summary.className = "archive-summary";
    summary.innerHTML =
      '<p class="eyebrow">Arquivo de campo</p>' +
      '<h3>Pokedex do tomo</h3>' +
      '<p class="flavor">Cada especie aparece uma vez no catalogo. Ao abrir um registro, voce ve todas as copias que ja escaneou daquela carta.</p>';
    root.appendChild(summary);

    renderGroupShelf(root, ctx, "Criaturas registradas", "Pokedex", "Cada criatura aparece como uma entrada unica do arquivo.", creatureGroups, "creature");
    renderGroupShelf(root, ctx, "Locais registrados", "Mapa", "Locais conhecidos pelo duelista e suas rotas de expansao.", locationGroups, "location");
    renderGroupShelf(root, ctx, "Acoes registradas", "Tatica", "Cartas de acao que compoem a malha automatica do duelo.", actionGroups, "action");
    renderGroupShelf(root, ctx, "Magias registradas", "Itens ativos", "Ferramentas taticas do jogador para uso manual na arena.", spellGroups, "spell");

    renderDetail(root, ctx, groups);
  }

  global.TCGIdleCollectionView = { render: render };
})(window);
