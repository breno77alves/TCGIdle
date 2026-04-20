(function registerDuelView(global) {
  const DIFFICULTY_LABELS = {
    1: "Iniciante",
    2: "Tatico",
    3: "Veterano",
    4: "Lendario",
  };

  function render(state, ctx) {
    const root = ctx.doc.querySelector("#duel-body");
    if (!root) return;
    root.innerHTML = "";

    const deckReady = global.TCGIdleDeck.isDeckReady(state);
    const status = state.duel.status;

    if (status === "idle" || status === "won" || status === "lost") {
      root.appendChild(renderLobby(state, ctx, deckReady));
      return;
    }

    const ctxDuel = state.duel.current;
    if (!ctxDuel) {
      root.appendChild(Object.assign(ctx.doc.createElement("p"), {
        textContent: "Estado do duelo corrompido. Resetando.",
        className: "empty-state",
      }));
      return;
    }

    const npc = global.TCGIdleData.getNpc(ctxDuel.npcId);
    const header = ctx.doc.createElement("header");
    header.className = "duel-header";
    header.innerHTML =
      '<div><p class="eyebrow">Arena</p><h3>' + (npc ? npc.name : "Duelo") + "</h3><p class=\"flavor\">" + (npc ? npc.tagline : "") + "</p></div>" +
      '<div class="duel-scoreboard"><span>Vitorias</span><strong>' + state.progress.duelsWon + "</strong>" +
      "<span>Derrotas</span><strong>" + state.progress.duelsLost + "</strong></div>";
    root.appendChild(header);

    const board = ctx.doc.createElement("section");
    board.className = "duel-board";
    board.append(
      renderQueueColumn(ctx.doc, "Voce", ctxDuel.playerSide, ctxDuel.currentEngagement, "player"),
      renderClash(ctx.doc, ctxDuel, npc),
      renderQueueColumn(ctx.doc, npc ? npc.name : "Oponente", ctxDuel.enemySide, ctxDuel.currentEngagement, "enemy")
    );
    root.appendChild(board);

    const log = ctx.doc.createElement("section");
    log.className = "duel-log";
    log.innerHTML = '<header class="duel-log-header"><p class="eyebrow">Relato</p><h4>Tick ' + ctxDuel.tick + "</h4></header>";
    const logList = ctx.doc.createElement("ol");
    logList.className = "duel-log-list";
    ctxDuel.log.slice(-16).forEach((entry) => {
      const li = ctx.doc.createElement("li");
      li.dataset.kind = entry.kind;
      if (entry.attackerSide) li.dataset.side = entry.attackerSide;
      li.innerHTML = '<span class="log-tick">T' + entry.tick + '</span><span class="log-text">' + entry.text + "</span>";
      logList.appendChild(li);
    });
    log.appendChild(logList);
    root.appendChild(log);
  }

  function renderLobby(state, ctx, deckReady) {
    const wrapper = ctx.doc.createElement("div");
    wrapper.className = "duel-lobby";

    const header = ctx.doc.createElement("header");
    header.className = "duel-header";
    header.innerHTML =
      '<div><p class="eyebrow">Arena</p><h3>Fila de duelos</h3><p class="flavor">A linha de frente segura o primeiro impacto. A retaguarda entra quando a vanguarda cai.</p></div>' +
      '<div class="duel-scoreboard"><span>Vitorias</span><strong>' + state.progress.duelsWon + "</strong>" +
      "<span>Derrotas</span><strong>" + state.progress.duelsLost + "</strong></div>";
    wrapper.appendChild(header);

    if (state.duel.status === "won" || state.duel.status === "lost") {
      const last = state.duel.lastResult;
      const lastNpc = last ? global.TCGIdleData.getNpc(last.npcId) : null;
      const banner = ctx.doc.createElement("div");
      banner.className = "duel-banner " + (state.duel.status === "won" ? "duel-banner-win" : "duel-banner-loss");
      banner.innerHTML =
        '<p class="eyebrow">Ultima jornada</p><h4>' + (state.duel.status === "won" ? "Vitoria selada" : "Derrota registrada") + "</h4>" +
        '<p class="flavor">' + (lastNpc ? lastNpc.name + " · " : "") +
        (last && last.rewardDrops && last.rewardDrops.length ? "Recompensa super rara arquivada no tomo." : "A equipe voltou ao tomo para a proxima tentativa.") + "</p>";
      wrapper.appendChild(banner);
    }

    const groups = {};
    global.TCGIdleData.npcs.forEach((npc) => {
      const key = String(npc.difficulty);
      groups[key] = groups[key] || [];
      groups[key].push(npc);
    });

    Object.keys(groups).sort().forEach((difficultyKey) => {
      const section = ctx.doc.createElement("section");
      section.className = "duel-tier";
      const streak = state.progress.duelStreaks[difficultyKey] || 0;
      const charges = state.progress.specialDuelCharges[difficultyKey] || 0;
      section.innerHTML =
        '<header class="duel-tier-header"><div><p class="eyebrow">Dificuldade ' + difficultyKey + "</p><h4>" + DIFFICULTY_LABELS[difficultyKey] + "</h4></div>" +
        '<div class="duel-tier-meta"><span>Sequencia: <strong>' + streak + '</strong></span><span>Provas especiais: <strong>' + charges + "</strong></span></div></header>";

      const grid = ctx.doc.createElement("div");
      grid.className = "duel-card-grid";
      groups[difficultyKey].forEach((npc) => {
        const card = ctx.doc.createElement("article");
        card.className = "duel-select-card";
        if (npc.special) card.dataset.special = "true";
        card.innerHTML =
          '<div class="duel-select-portrait"><img src="' + npc.portrait + '" alt="' + npc.name + '"></div>' +
          '<div class="duel-select-copy"><p class="eyebrow">' + (npc.special ? "Prova especial" : "Duelo padrao") + '</p><h4>' + npc.name + '</h4><p class="flavor">' + npc.tagline + "</p></div>";

        const button = ctx.doc.createElement("button");
        button.type = "button";
        button.className = "action-button action-button-primary";
        const specialBlocked = npc.special && charges < 1;
        button.disabled = !deckReady || specialBlocked;
        button.textContent = !deckReady
          ? "Preencha o deck"
          : npc.special
            ? (charges > 0 ? "Iniciar prova especial" : "Ganhe 10 seguidos")
            : "Iniciar duelo";
        if (!button.disabled) {
          button.addEventListener("click", () => ctx.onStartDuel(npc.id));
        }
        card.appendChild(button);
        grid.appendChild(card);
      });

      section.appendChild(grid);
      wrapper.appendChild(section);
    });

    return wrapper;
  }

  function renderQueueColumn(doc, title, sideState, engagement, side) {
    const col = doc.createElement("div");
    col.className = "duel-column";
    col.dataset.side = side;
    col.innerHTML = '<header class="duel-column-header"><p class="eyebrow">' + (side === "player" ? "Sua formacao" : "Oponente") + "</p><h4>" + title + "</h4></header>";
    const list = doc.createElement("ol");
    list.className = "duel-queue";

    sideState.fighters.forEach((fighter) => {
      const tribe = global.TCGIdleData.getTribe(fighter.tribe);
      const pct = Math.max(0, fighter.hp / fighter.hpMax);
      const li = doc.createElement("li");
      li.className = "duel-fighter";
      const engagedId = side === "player" ? engagement && engagement.playerId : engagement && engagement.enemyId;
      if (fighter.instanceId === engagedId && fighter.hp > 0) li.dataset.active = "true";
      if (fighter.hp <= 0) li.dataset.down = "true";
      li.dataset.lane = fighter.lane;
      if (tribe) {
        li.style.setProperty("--tribe-accent", tribe.accent);
        li.style.setProperty("--tribe-soft", tribe.accentSoft);
      }
      li.innerHTML =
        '<div class="fighter-line"><strong>' + fighter.name + "</strong><span>" + (tribe ? tribe.name : "") + "</span></div>" +
        '<div class="fighter-meta"><span class="fighter-lane">' + (fighter.lane === "backline" ? "Backline" : "Frontline") + '</span>' +
        (fighter.equipmentBase ? '<span class="fighter-equipment">' + fighter.equipmentBase.name + "</span>" : "") + "</div>" +
        '<div class="hp-track"><div class="hp-fill" style="width:' + (pct * 100).toFixed(1) + '%"></div></div>' +
        '<span class="hp-value">Energia ' + fighter.hp + " / " + fighter.hpMax + "</span>";
      list.appendChild(li);
    });
    col.appendChild(list);
    return col;
  }

  function renderClash(doc, ctxDuel, npc) {
    const el = doc.createElement("div");
    el.className = "duel-clash";
    const engagement = ctxDuel.currentEngagement || {};
    const attacker = ctxDuel.playerSide.fighters.find((fighter) => fighter.instanceId === engagement.playerId);
    const defender = ctxDuel.enemySide.fighters.find((fighter) => fighter.instanceId === engagement.enemyId);
    el.innerHTML =
      '<p class="eyebrow">Tick ' + ctxDuel.tick + "</p>" +
      "<h4>" + (attacker ? attacker.name : "—") + " × " + (defender ? defender.name : "—") + "</h4>" +
      '<p class="flavor">Contra ' + (npc ? npc.name : "oponente") + "</p>" +
      '<div class="clash-actions"><span>' + (engagement.playerAction || "Aguardando") + "</span><span>" + (engagement.enemyAction || "Aguardando") + "</span></div>";
    return el;
  }

  global.TCGIdleDuelView = { render: render };
})(window);
