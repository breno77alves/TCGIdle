(function bootstrapApp(global, documentRef) {
  const stateApi = global.TCGIdleState;

  const TABS = {
    collection: { title: "Colecao", eyebrow: "Arquivo" },
    deck: { title: "Deck", eyebrow: "Sala de Guerra" },
    expeditions: { title: "Expedicoes", eyebrow: "Diario de Campo" },
    duel: { title: "Duelo", eyebrow: "Arena" },
  };

  let state = null;
  let duelTimer = null;
  let toastTimer = null;
  let resetDialogBound = false;

  function persist(message) {
    if (message) state.meta.lastAction = message;
    state = stateApi.saveState(state);
  }

  function requestRender() {
    render();
  }

  function render() {
    renderShell();
    renderActiveTab();
    renderMeta();
  }

  function renderShell() {
    documentRef.body.dataset.currentTab = state.ui.currentTab;
    const tab = TABS[state.ui.currentTab] || TABS.collection;
    documentRef.querySelectorAll("[data-tab-target]").forEach((btn) => {
      const active = btn.dataset.tabTarget === state.ui.currentTab;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
    documentRef.querySelectorAll("[data-chapter]").forEach((panel) => {
      panel.hidden = panel.dataset.chapter !== state.ui.currentTab;
    });

    const titleEl = documentRef.querySelector("#chapter-title");
    const eyebrowEl = documentRef.querySelector("#chapter-eyebrow");
    if (titleEl) titleEl.textContent = tab.title;
    if (eyebrowEl) eyebrowEl.textContent = tab.eyebrow;
  }

  function renderActiveTab() {
    const ctx = {
      doc: documentRef,
      onStartExpedition: handleStartExpedition,
      onClaimReward: handleClaimReward,
      onAssignDeckCard: handleAssignDeckCard,
      onClearDeckCard: handleClearDeckCard,
      onSetCreatureLane: handleSetCreatureLane,
      onInspectCard: handleInspectCard,
      onStartDuel: handleStartDuel,
      requestRender: requestRender,
    };
    global.TCGIdleCollectionView.render(state, ctx);
    global.TCGIdleDeckView.render(state, ctx);
    global.TCGIdleExpeditionView.render(state, ctx);
    global.TCGIdleDuelView.render(state, ctx);
  }

  function renderMeta() {
    const sessions = documentRef.querySelector("#sessions-value");
    const lastAction = documentRef.querySelector("#last-action");
    if (sessions) sessions.textContent = String(state.meta.bootCount);
    if (lastAction) lastAction.textContent = state.meta.lastAction || "—";
    const essence = documentRef.querySelector("#essence-value");
    if (essence) essence.textContent = String(state.progress.essence);
    const duelsWon = documentRef.querySelector("#duels-value");
    if (duelsWon) duelsWon.textContent = state.progress.duelsWon + " / " + (state.progress.duelsWon + state.progress.duelsLost);
    const collectionCount = documentRef.querySelector("#collection-value");
    if (collectionCount) collectionCount.textContent = String(state.collection.cards.length);
  }

  function showToast(message, tone) {
    const toast = documentRef.querySelector("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.dataset.tone = tone || "default";
    toast.classList.add("is-visible");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  function setTab(tabId) {
    if (!TABS[tabId]) return;
    state.ui.currentTab = tabId;
    persist("Secao aberta: " + TABS[tabId].title);
    global.TCGIdleDeckView.reset();
    render();
  }

  function handleStartExpedition(locationId) {
    const location = global.TCGIdleData.getLocation(locationId);
    const result = global.TCGIdleExpedition.startExpedition(state, locationId);
    if (!result.ok) {
      showToast(result.reason, "warn");
      return;
    }
    persist("Expedicao de scan iniciada em " + (location ? location.name : locationId));
    render();
    showToast("Varredura em andamento", "success");
  }

  function handleClaimReward() {
    const result = global.TCGIdleExpedition.claimReward(state);
    if (!result.ok) return;
    const newLocations = result.drops.filter((card) => card.cardType === "location").length;
    persist("Arquivados " + result.drops.length + " novos scans");
    render();
    showToast(newLocations ? "Novo local revelado no tomo" : "Scans arquivados no tomo", "success");
  }

  function handleAssignDeckCard(sectionName, slotIndex, instanceId) {
    const result = global.TCGIdleDeck.setCardInSection(state, sectionName, slotIndex, instanceId);
    if (!result.ok) {
      showToast(result.reason, "warn");
      return;
    }
    persist("Secao " + sectionName + " atualizada");
    render();
    showToast("Carta equipada em " + sectionName, "success");
  }

  function handleClearDeckCard(sectionName, slotIndex) {
    global.TCGIdleDeck.clearSectionSlot(state, sectionName, slotIndex);
    persist("Espaco removido de " + sectionName);
    render();
  }

  function handleSetCreatureLane(slotIndex, lane) {
    global.TCGIdleDeck.setCreatureLane(state, slotIndex, lane);
    persist("Linha da criatura " + (slotIndex + 1) + " alterada para " + (lane === "backline" ? "retaguarda" : "frente"));
    render();
  }

  function handleInspectCard(instanceId) {
    const card = state.collection.cards.find((entry) => entry.instanceId === instanceId);
    if (!card || card.seen) return;
    card.seen = true;
    state = stateApi.saveState(state);
    render();
  }

  function handleStartDuel(npcId) {
    const npc = global.TCGIdleData.getNpc(npcId);
    const result = global.TCGIdleDuel.startDuel(state, npcId);
    if (!result.ok) {
      showToast(result.reason, "warn");
      return;
    }
    persist("Duelo iniciado contra " + (npc ? npc.name : npcId));
    render();
    showToast(npc && npc.special ? "Prova especial iniciada" : "O duelo comecou", "success");
    startDuelLoop();
  }

  function startDuelLoop() {
    if (duelTimer) clearInterval(duelTimer);
    duelTimer = setInterval(() => {
      if (state.duel.status !== "running") {
        stopDuelLoop();
        return;
      }
      const res = global.TCGIdleDuel.tickDuel(state);
      render();
      if (res.ended) {
        stopDuelLoop();
        const npcName = res.npc ? res.npc.name : "oponente";
        if (res.outcome === "won") {
          let message = "Vitoria contra " + npcName;
          if (res.specialUnlocked) message += " · prova especial desbloqueada";
          if (res.rewardDrops && res.rewardDrops.length) message += " · scan super raro obtido";
          persist(message);
          showToast(res.rewardDrops && res.rewardDrops.length ? "Scan super raro conquistado" : "Vitoria no duelo", "success");
        } else {
          persist("Derrota contra " + npcName);
          showToast("Derrota no duelo", "warn");
        }
      }
    }, 900);
  }

  function stopDuelLoop() {
    if (duelTimer) {
      clearInterval(duelTimer);
      duelTimer = null;
    }
  }

  function globalTick() {
    if (state.expeditions.active && global.TCGIdleExpedition.isExpeditionReady(state)) {
      const result = global.TCGIdleExpedition.completeExpedition(state);
      if (result.ok) {
        const locations = result.drops.filter((card) => card.cardType === "location").length;
        persist("Expedicao concluida · " + result.drops.length + " scan(s) obtido(s)");
        render();
        showToast(locations ? "Rota adjacente detectada" : "Expedicao concluida", "success");
        return;
      }
    }
    if (state.ui.currentTab === "expeditions") {
      global.TCGIdleExpeditionView.tick(state, { doc: documentRef });
    }
  }

  function confirmReset() {
    state = stateApi.resetState();
    stopDuelLoop();
    global.TCGIdleDeckView.reset();
    persist("Tomo reiniciado com conteudo padrao");
    render();
    showToast("Tomo reiniciado", "default");
  }

  function closeResetDialog() {
    const dialog = documentRef.querySelector("#reset-dialog");
    if (!dialog) return;
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }

  function openResetDialog() {
    const dialog = documentRef.querySelector("#reset-dialog");
    if (!dialog) {
      const confirmed = confirm("Resetar a conta apaga colecao, progresso e duelos. Continuar?");
      if (confirmed) confirmReset();
      return;
    }

    if (!resetDialogBound) {
      const cancel = dialog.querySelector("[data-reset-cancel]");
      const confirmButton = dialog.querySelector("[data-reset-confirm]");
      if (cancel) cancel.addEventListener("click", closeResetDialog);
      if (confirmButton) {
        confirmButton.addEventListener("click", () => {
          closeResetDialog();
          confirmReset();
        });
      }
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) closeResetDialog();
      });
      resetDialogBound = true;
    }

    if (dialog.open) return;
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "open");
    }
  }

  function handleResetClick() {
    openResetDialog();
  }

  function bindEvents() {
    documentRef.querySelectorAll("[data-tab-target]").forEach((btn) => {
      btn.addEventListener("click", () => setTab(btn.dataset.tabTarget));
    });
    const reset = documentRef.querySelector("#reset-button");
    if (reset) reset.addEventListener("click", handleResetClick);
  }

  function start() {
    state = stateApi.loadState();
    state.meta.bootCount += 1;
    state.meta.lastOpenedAt = new Date().toISOString();
    if (state.duel.status === "running") {
      global.TCGIdleDuel.refundInterruptedSpecialCharge(state);
      state.duel.status = "idle";
      state.duel.current = null;
    }
    persist();
    bindEvents();
    render();
    setInterval(globalTick, 400);
  }

  documentRef.addEventListener("DOMContentLoaded", start);
})(window, document);
