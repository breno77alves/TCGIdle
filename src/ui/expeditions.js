(function registerExpeditionsView(global) {
  let viewState = { mode: "overview", selectedLocationId: null };

  function formatDuration(ms) {
    const seconds = Math.max(0, Math.ceil(ms / 1000));
    if (seconds >= 60) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return m + "m " + (s < 10 ? "0" : "") + s + "s";
    }
    return seconds + "s";
  }

  function ownedLocations(state) {
    return global.TCGIdleData.locations.filter((location) => global.TCGIdleDeck.hasLocationCard(state, location.id));
  }

  function currentLocation(state) {
    const owned = ownedLocations(state);
    if (!owned.length) return null;
    if (!viewState.selectedLocationId || !global.TCGIdleDeck.hasLocationCard(state, viewState.selectedLocationId)) {
      viewState.selectedLocationId = owned[0].id;
    }
    return global.TCGIdleData.getLocation(viewState.selectedLocationId);
  }

  function sampleNames(pool, key, resolver) {
    if (!Array.isArray(pool) || !pool.length) return [];
    return pool.slice(0, 3).map((entry) => resolver(entry[key])).filter(Boolean);
  }

  function renderPotentialDrops(doc, location) {
    const wrap = doc.createElement("section");
    wrap.className = "drop-summary";

    const creatureNames = sampleNames(location.creaturePool, "creatureId", global.TCGIdleData.getCreature).map((entry) => entry.name);
    const actionNames = sampleNames(location.actionPool, "actionId", global.TCGIdleData.getAction).map((entry) => entry.name);
    const spellNames = sampleNames(location.spellPool, "spellId", global.TCGIdleData.getSpell).map((entry) => entry.name);

    function addRow(title, names, total) {
      const row = doc.createElement("div");
      row.className = "drop-summary-row";
      const suffix = total > names.length ? " +" + (total - names.length) : "";
      row.innerHTML =
        "<strong>" + title + "</strong>" +
        "<span>" + (names.length ? names.join(" · ") + suffix : "Sem registros") + "</span>";
      wrap.appendChild(row);
    }

    addRow("Criaturas", creatureNames, (location.creaturePool || []).length);
    addRow("Acoes", actionNames, (location.actionPool || []).length);
    addRow("Magias", spellNames, (location.spellPool || []).length);
    return wrap;
  }

  function renderFullDropDisclosure(doc, state, location) {
    const details = doc.createElement("details");
    details.className = "info-disclosure";

    const summary = doc.createElement("summary");
    summary.innerHTML = "<strong>Tabela completa de drops</strong><span>Abra para ver tudo sem poluir a tela principal.</span>";
    details.appendChild(summary);

    const body = doc.createElement("div");
    body.className = "info-disclosure-body";

    function appendGroup(title, pool, key, resolver) {
      const section = doc.createElement("section");
      section.className = "drop-table-group";
      section.innerHTML = '<p class="eyebrow">' + title + "</p>";
      const list = doc.createElement("div");
      list.className = "chip-flow";
      (pool || []).map((entry) => resolver(entry[key])).filter(Boolean).forEach((item) => {
        const chip = doc.createElement("span");
        chip.className = "data-chip";
        chip.textContent = item.name;
        list.appendChild(chip);
      });
      section.appendChild(list);
      body.appendChild(section);
    }

    appendGroup("Criaturas possiveis", location.creaturePool, "creatureId", global.TCGIdleData.getCreature);
    appendGroup("Acoes possiveis", location.actionPool, "actionId", global.TCGIdleData.getAction);
    appendGroup("Magias possiveis", location.spellPool, "spellId", global.TCGIdleData.getSpell);

    const adjacent = doc.createElement("section");
    adjacent.className = "drop-table-group";
    adjacent.innerHTML = '<p class="eyebrow">Rotas adjacentes</p>';
    const adjacentList = doc.createElement("div");
    adjacentList.className = "chip-flow";
    (location.adjacentLocationIds || []).forEach((locationId) => {
      const target = global.TCGIdleData.getLocation(locationId);
      const chip = doc.createElement("span");
      chip.className = "data-chip";
      chip.dataset.owned = String(global.TCGIdleDeck.hasLocationCard(state, locationId));
      chip.textContent = target ? target.name : locationId;
      adjacentList.appendChild(chip);
    });
    adjacent.appendChild(adjacentList);
    body.appendChild(adjacent);

    details.appendChild(body);
    return details;
  }

  function renderToggle(doc, ctx) {
    const toggle = doc.createElement("div");
    toggle.className = "expedition-view-toggle";
    ["overview", "map"].forEach((mode) => {
      const button = doc.createElement("button");
      button.type = "button";
      button.className = "ghost-button expedition-toggle-button";
      if (viewState.mode === mode) button.classList.add("is-active");
      button.textContent = mode === "overview" ? "Visao atual" : "Mapa";
      button.addEventListener("click", () => {
        viewState.mode = mode;
        ctx.requestRender();
      });
      toggle.appendChild(button);
    });
    return toggle;
  }

  function renderLocationSelector(doc, state, selectedId, onSelect) {
    const strip = doc.createElement("div");
    strip.className = "expedition-location-strip";
    ownedLocations(state).forEach((location) => {
      const btn = doc.createElement("button");
      btn.type = "button";
      btn.className = "expedition-location-chip";
      btn.dataset.selected = String(location.id === selectedId);
      btn.textContent = location.name;
      btn.addEventListener("click", () => onSelect(location.id));
      strip.appendChild(btn);
    });
    return strip;
  }

  function renderMap(doc, state, selectedId, onSelect) {
    const container = doc.createElement("section");
    container.className = "expedition-map";

    const svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "expedition-map-lines");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");

    const seen = new Set();
    global.TCGIdleData.locations.forEach((location) => {
      (location.adjacentLocationIds || []).forEach((adjacentId) => {
        const adjacent = global.TCGIdleData.getLocation(adjacentId);
        if (!adjacent) return;
        const edgeKey = [location.id, adjacentId].sort().join(":");
        if (seen.has(edgeKey)) return;
        seen.add(edgeKey);
        const line = doc.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", String(location.mapNode.x));
        line.setAttribute("y1", String(location.mapNode.y));
        line.setAttribute("x2", String(adjacent.mapNode.x));
        line.setAttribute("y2", String(adjacent.mapNode.y));
        svg.appendChild(line);
      });
    });
    container.appendChild(svg);

    global.TCGIdleData.locations.forEach((location) => {
      const owned = global.TCGIdleDeck.hasLocationCard(state, location.id);
      const node = doc.createElement("button");
      node.type = "button";
      node.className = "expedition-map-node";
      node.dataset.owned = String(owned);
      node.dataset.selected = String(location.id === selectedId);
      node.style.left = location.mapNode.x + "%";
      node.style.top = location.mapNode.y + "%";
      node.innerHTML = "<strong>" + location.name + "</strong><span>" + location.rarityLabel + "</span>";
      if (owned) {
        node.addEventListener("click", () => onSelect(location.id));
      } else {
        node.disabled = true;
      }
      container.appendChild(node);
    });

    return container;
  }

  function renderSelectedLocation(root, ctx, state, location) {
    const active = state.expeditions.active;
    const pending = state.expeditions.pendingReward;

    const hero = ctx.doc.createElement("section");
    hero.className = "expedition-hero";
    hero.innerHTML =
      '<div class="compass-emblem" aria-hidden="true"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="40" cy="40" r="24" fill="none" stroke="currentColor" stroke-width="1"/><path d="M40 8 L46 40 L40 72 L34 40 Z" fill="currentColor" opacity="0.85"/><path d="M8 40 L40 34 L72 40 L40 46 Z" fill="currentColor" opacity="0.35"/></svg></div>' +
      '<div><p class="eyebrow">Rota selecionada</p><h3>' + location.name + '</h3><p class="flavor">' + location.description + "</p></div>";
    root.appendChild(hero);

    const statusCard = ctx.doc.createElement("section");
    statusCard.className = "expedition-status";

    if (pending) {
      statusCard.dataset.state = "reward";
      statusCard.innerHTML = '<div class="status-head"><p class="eyebrow">Retorno</p><h4>Scans pendentes</h4></div>';
      const body = ctx.doc.createElement("div");
      body.className = "reward-grid";
      pending.drops.forEach((card) => body.appendChild(global.TCGIdleCardRender.renderCard(ctx.doc, card)));
      const claim = ctx.doc.createElement("button");
      claim.type = "button";
      claim.className = "action-button action-button-primary";
      claim.textContent = "Arquivar " + pending.drops.length + (pending.drops.length === 1 ? " scan" : " scans");
      claim.addEventListener("click", ctx.onClaimReward);
      statusCard.append(body, claim);
    } else if (active) {
      statusCard.dataset.state = "running";
      const finishAt = active.startedAt + active.durationMs;
      const remaining = Math.max(0, finishAt - Date.now());
      const pct = Math.max(0, Math.min(1, 1 - remaining / active.durationMs));
      statusCard.innerHTML =
        '<div class="status-head"><p class="eyebrow">Em campo</p><h4>Escaneando em ' + location.name + "</h4></div>" +
        '<div class="timer-line"><span id="expedition-remaining">' + formatDuration(remaining) + '</span><span class="timer-label">tempo restante</span></div>' +
        '<div class="timer-track"><div class="timer-fill" id="expedition-progress" style="width:' + (pct * 100).toFixed(1) + '%"></div></div>' +
        '<p class="flavor">A expedicao depende apenas do jogador e do local ja conhecido. O deck nao precisa ser equipado para explorar.</p>';
    } else {
      statusCard.dataset.state = "idle";
      statusCard.innerHTML =
        '<div class="status-head"><p class="eyebrow">Varredura preparada</p><h4>Entrar em expedicao</h4></div>' +
        '<p class="flavor">Duracao fixa: ' + formatDuration(location.durationMs) + ". Retorno entre " + location.dropCountRange[0] + " e " + location.dropCountRange[1] + ' scans, com baixa chance de descobrir um local adjacente.</p>';

      statusCard.appendChild(renderPotentialDrops(ctx.doc, location));
      statusCard.appendChild(renderFullDropDisclosure(ctx.doc, state, location));

      const start = ctx.doc.createElement("button");
      start.type = "button";
      start.className = "action-button action-button-primary";
      start.textContent = "Iniciar expedicao de scan";
      start.addEventListener("click", () => ctx.onStartExpedition(location.id));
      statusCard.appendChild(start);
    }

    root.appendChild(statusCard);
  }

  function render(state, ctx) {
    const root = ctx.doc.querySelector("#expeditions-body");
    if (!root) return;
    root.innerHTML = "";

    const location = currentLocation(state);
    if (!location) {
      root.appendChild(Object.assign(ctx.doc.createElement("p"), {
        className: "empty-state",
        textContent: "Nenhum local conhecido. Descubra um local para iniciar suas expedicoes.",
      }));
      return;
    }

    const toolbar = ctx.doc.createElement("div");
    toolbar.className = "expedition-toolbar";
    toolbar.appendChild(renderToggle(ctx.doc, ctx));
    toolbar.appendChild(renderLocationSelector(ctx.doc, state, location.id, (nextId) => {
      viewState.selectedLocationId = nextId;
      ctx.requestRender();
    }));
    root.appendChild(toolbar);

    if (viewState.mode === "map") {
      root.appendChild(renderMap(ctx.doc, state, location.id, (nextId) => {
        viewState.selectedLocationId = nextId;
        ctx.requestRender();
      }));
    }

    renderSelectedLocation(root, ctx, state, location);

    const stats = ctx.doc.createElement("section");
    stats.className = "expedition-stats";
    stats.innerHTML =
      '<article><p class="stat-number">' + (state.expeditions.completedCount || 0) + '</p><p class="stat-caption">Expedicoes concluidas</p></article>' +
      '<article><p class="stat-number">' + ownedLocations(state).length + '</p><p class="stat-caption">Locais conhecidos</p></article>';
    root.appendChild(stats);
  }

  function tick(state, ctx) {
    const active = state.expeditions.active;
    if (!active) return;
    const finishAt = active.startedAt + active.durationMs;
    const remaining = Math.max(0, finishAt - Date.now());
    const pct = Math.max(0, Math.min(1, 1 - remaining / active.durationMs));
    const remainingEl = ctx.doc.querySelector("#expedition-remaining");
    const progressEl = ctx.doc.querySelector("#expedition-progress");
    if (remainingEl) remainingEl.textContent = formatDuration(remaining);
    if (progressEl) progressEl.style.width = (pct * 100).toFixed(1) + "%";
  }

  global.TCGIdleExpeditionView = { render: render, tick: tick };
})(window);
