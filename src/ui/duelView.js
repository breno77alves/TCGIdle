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

    const stage = ctx.doc.createElement("section");
    stage.className = "duel-stage";
    stage.dataset.phase = ctxDuel.phase || "auto";
    stage.appendChild(renderArena(ctx.doc, ctxDuel, npc, ctx));
    stage.appendChild(renderLogPanel(ctx.doc, ctxDuel));
    root.appendChild(stage);
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
        '<p class="flavor">' + (lastNpc ? lastNpc.name + " - " : "") +
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

  function renderArena(doc, ctxDuel, npc, ctx) {
    const arena = doc.createElement("div");
    arena.className = "duel-stage__arena";
    arena.appendChild(renderArenaStatus(doc, ctxDuel, npc));

    const board = doc.createElement("section");
    board.className = "duel-board";
    board.appendChild(renderFormation(doc, ctxDuel.playerSide, ctxDuel, ctx, "player"));
    board.appendChild(renderFocusPanel(doc, ctxDuel, npc, ctx));
    board.appendChild(renderFormation(doc, ctxDuel.enemySide, ctxDuel, ctx, "enemy"));
    arena.appendChild(board);

    arena.appendChild(renderSpellBar(doc, ctxDuel, ctx));
    return arena;
  }

  function renderArenaStatus(doc, ctxDuel, npc) {
    const currentTarget = ctxDuel.enemySide.fighters.find((fighter) => fighter.instanceId === ctxDuel.playerFocusId);
    const wrap = doc.createElement("section");
    wrap.className = "duel-stage__status duel-panel";
    wrap.innerHTML =
      '<div><p class="eyebrow">Leitura tatica</p><h4>' + (npc ? npc.name : "Arena") + '</h4><p class="flavor">' +
      ((ctxDuel.pendingInput && ctxDuel.pendingInput.kind === "spell-target")
        ? "Escolha um alvo para concluir a magia selecionada."
        : "Clique em uma criatura inimiga para ajustar o foco e use as magias no trilho tatico.") +
      "</p></div>" +
      '<div class="duel-stage__resources">' +
      '<div class="duel-resource"><span>Tokens</span><strong>' + ctxDuel.playerSide.tokens + "</strong><em>+" + ctxDuel.playerSide.tokenIncome + "/tick</em></div>" +
      '<div class="duel-resource"><span>Foco</span><strong>' + (currentTarget ? currentTarget.name : "Auto") + "</strong><em>Tick " + ctxDuel.tick + "</em></div>" +
      "</div>";
    return wrap;
  }

  function renderFormation(doc, sideState, ctxDuel, ctx, side) {
    const section = doc.createElement("section");
    section.className = "duel-formation duel-formation-" + side + " duel-panel";
    section.innerHTML = '<header class="duel-formation__header"><p class="eyebrow">' + (side === "player" ? "Sua formacao" : "Linha rival") + "</p><h4>" + (side === "player" ? "Seu lado" : "Oponente") + "</h4></header>";
    const grid = doc.createElement("div");
    grid.className = "duel-formation__grid";

    sideState.fighters.forEach((fighter) => {
      grid.appendChild(renderFighterUnit(doc, fighter, ctxDuel, ctx, side));
    });
    section.appendChild(grid);
    return section;
  }

  function renderFighterUnit(doc, fighter, ctxDuel, ctx, side) {
    const pending = ctxDuel.pendingInput;
    const selectedAsFocus = side === "enemy" && ctxDuel.playerFocusId === fighter.instanceId;
    const activeId = side === "player"
      ? ctxDuel.currentEngagement && ctxDuel.currentEngagement.playerId
      : ctxDuel.currentEngagement && ctxDuel.currentEngagement.enemyId;
    const isTargetable = fighter.hp > 0 && (
      (pending && pending.targetType === "ally" && side === "player") ||
      (pending && pending.targetType === "enemy" && side === "enemy") ||
      (!pending && side === "enemy")
    );

    const button = doc.createElement("button");
    button.type = "button";
    button.className = "duel-unit";
    button.dataset.side = side;
    button.dataset.lane = fighter.lane;
    button.dataset.active = String(fighter.instanceId === activeId && fighter.hp > 0);
    button.dataset.targeted = String(selectedAsFocus);
    button.dataset.targetable = String(isTargetable);
    button.dataset.down = String(fighter.hp <= 0);
    button.disabled = !isTargetable;

    if (isTargetable) {
      button.addEventListener("click", () => ctx.onChooseDuelTarget(fighter.instanceId));
    }

    const card = global.TCGIdleCardRender.renderCard(doc, fighter, { variant: "mini" });
    card.classList.add("duel-unit-card");
    button.appendChild(card);

    const meta = doc.createElement("div");
    meta.className = "duel-unit-meta";
    const tribe = global.TCGIdleData.getTribe(fighter.tribe);
    const pct = fighter.hpMax > 0 ? Math.max(0, fighter.hp / fighter.hpMax) : 0;
    meta.innerHTML =
      '<div class="duel-unit-line"><strong>' + fighter.name + "</strong><span>" + (tribe ? tribe.name : "Criatura") + "</span></div>" +
      '<div class="duel-unit-tags"><span class="fighter-lane">' + (fighter.lane === "backline" ? "Backline" : "Frontline") + '</span>' +
      (fighter.equipmentBase ? '<span class="fighter-equipment">' + fighter.equipmentBase.name + "</span>" : "") +
      "</div>" +
      '<div class="hp-track"><div class="hp-fill" style="width:' + (pct * 100).toFixed(1) + '%"></div></div>' +
      '<span class="hp-value">Energia ' + fighter.hp + " / " + fighter.hpMax + "</span>";
    button.appendChild(meta);
    return button;
  }

  function renderFocusPanel(doc, ctxDuel, npc, ctx) {
    const engagement = ctxDuel.currentEngagement || {};
    const player = ctxDuel.playerSide.fighters.find((fighter) => fighter.instanceId === engagement.playerId);
    const enemy = ctxDuel.enemySide.fighters.find((fighter) => fighter.instanceId === engagement.enemyId);
    const target = ctxDuel.enemySide.fighters.find((fighter) => fighter.instanceId === ctxDuel.playerFocusId);

    const panel = doc.createElement("section");
    panel.className = "duel-focus duel-panel";
    panel.innerHTML =
      '<p class="eyebrow">Centro tatico</p>' +
      "<h4>" + (player ? player.name : "Aguardando") + " vs " + (enemy ? enemy.name : "Aguardando") + "</h4>" +
      '<p class="flavor">Foco atual: ' + (target ? target.name : "automatico") + '. Contra ' + (npc ? npc.name : "oponente") + ".</p>";

    const actions = doc.createElement("div");
    actions.className = "clash-actions";
    actions.innerHTML =
      "<span>" + (engagement.playerAction || "Aguardando") + "</span>" +
      "<span>" + (engagement.enemyAction || "Aguardando") + "</span>";
    panel.appendChild(actions);

    if (ctxDuel.pendingInput) {
      const prompt = doc.createElement("div");
      prompt.className = "duel-targeting-overlay";
      prompt.innerHTML =
        '<p class="eyebrow">Pausa tatica</p><strong>Escolha um alvo para a magia.</strong><span>O duelo fica pausado ate a selecao.</span>';
      const cancel = doc.createElement("button");
      cancel.type = "button";
      cancel.className = "icon-button";
      cancel.textContent = "Cancelar";
      cancel.addEventListener("click", ctx.onCancelPendingSpell);
      prompt.appendChild(cancel);
      panel.appendChild(prompt);
    }

    return panel;
  }

  function renderSpellBar(doc, ctxDuel, ctx) {
    const section = doc.createElement("section");
    section.className = "duel-spellbar duel-panel";
    section.innerHTML = '<header class="duel-spellbar__header"><div><p class="eyebrow">Magias equipadas</p><h4>Itens ativos do duelo</h4></div><span>Tokens: ' + ctxDuel.playerSide.tokens + "</span></header>";

    const row = doc.createElement("div");
    row.className = "duel-spellbar__grid";
    ctxDuel.playerSide.spells.forEach((spellEntry) => {
      const button = doc.createElement("button");
      button.type = "button";
      button.className = "duel-spellbar__item";
      const pending = ctxDuel.pendingInput && ctxDuel.pendingInput.spellInstanceId === spellEntry.instanceId;
      const disabled = spellEntry.cooldownRemaining > 0 || ctxDuel.playerSide.tokens < (spellEntry.base.tokenCost || 0) || Boolean(ctxDuel.pendingInput && !pending);
      button.dataset.state = pending
        ? "selected"
        : spellEntry.cooldownRemaining > 0
          ? "cooldown"
          : disabled
            ? "disabled"
            : "ready";
      button.disabled = disabled;
      button.appendChild(global.TCGIdleCardRender.renderCard(doc, spellEntry, { variant: "mini" }));

      const meta = doc.createElement("div");
      meta.className = "duel-spellbar__meta";
      meta.innerHTML =
        "<strong>" + spellEntry.base.name + "</strong>" +
        "<span>Custo " + spellEntry.base.tokenCost + "</span>" +
        "<em>" + (spellEntry.cooldownRemaining > 0 ? "Recarga " + spellEntry.cooldownRemaining : (pending ? "Selecionando alvo" : "Pronta")) + "</em>";
      button.appendChild(meta);

      if (!button.disabled || pending) {
        button.addEventListener("click", () => ctx.onQueueSpell(spellEntry.instanceId));
      }
      row.appendChild(button);
    });
    section.appendChild(row);
    return section;
  }

  function renderLogPanel(doc, ctxDuel) {
    const log = doc.createElement("aside");
    log.className = "duel-stage__log duel-log duel-panel";
    log.innerHTML = '<header class="duel-log-header"><div><p class="eyebrow">Relato</p><h4>Tick ' + ctxDuel.tick + '</h4></div><span>' + (ctxDuel.phase === "targeting" ? "Pausado" : "Ao vivo") + "</span></header>";
    const logList = doc.createElement("ol");
    logList.className = "duel-log-list";
    ctxDuel.log.slice(-24).forEach((entry) => {
      const li = doc.createElement("li");
      li.dataset.kind = entry.kind;
      if (entry.attackerSide) li.dataset.side = entry.attackerSide;
      li.innerHTML = '<span class="log-tick">T' + entry.tick + '</span><span class="log-text">' + entry.text + "</span>";
      logList.appendChild(li);
    });
    log.appendChild(logList);
    return log;
  }

  global.TCGIdleDuelView = { render: render };
})(window);
