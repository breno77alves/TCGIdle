# AGENTS.md — TCG Idle Product Build

This repository contains a browser-based idle card game inspired by the long-session progression clarity of Melvor Idle and the visual readability, card-centric presentation, and collectible excitement of polished trading card games.

The implementation target is **HTML + CSS + JavaScript only**, with **no build step**, **no framework**, and **no backend** in the current product scope. The game must feel polished, intentional, responsive, and commercially presentable from the moment `index.html` opens.

This file is written specifically for **Claude Code + Codex inside VS Code**.

---

## Product Vision

Build a polished single-player browser card game where the player:

- runs expeditions to obtain creatures and materials
- collects stat-rolled cards with visible min/max ranges
- builds a deck within card-copy rules
- runs automated duels against NPCs
- uses active tactical coaching tools to influence battle outcomes
- progresses through zones, masters, duplicate conversion, rerolls, and idle economy systems

The game should read as a finished product directionally, even while content quantity is still growing.

---

## Non-Negotiable Rules

### 1. No framework, no build step
Do not introduce React, Vue, TypeScript, npm, Vite, webpack, or any build tooling unless explicitly instructed later.

### 2. Product quality over placeholder energy
Do not describe the game as a prototype in code comments, UI copy, commit descriptions, or planning output.
Every screen should feel intentional, clear, and polished.

### 3. Preserve architectural clarity
Respect the planned separation:
- `data/`
- `systems/`
- `ui/`
- `styles/`

Do not mix heavy gameplay rules inside rendering code unless the feature is extremely small and isolated.

### 4. Visible responsiveness is mandatory
Every important interaction must provide clear feedback:
- hover
- pressed
- disabled
- loading
- cooldown
- completion
- success/failure
- empty state
- progression update

### 5. Preserve save/load integrity
Every new system must consider `localStorage` persistence and default-safe loading.
Never silently break existing save data if it can be avoided.

### 6. Prefer simple durable systems
Choose the simplest structure that can scale to more cards, more zones, more NPCs, and more UI panels.
Avoid abstraction for its own sake.

### 7. Respect product fantasy
The game should feel like a polished browser collectible card product with:
- clean panel hierarchy
- strong card presentation
- readable stats
- deliberate color language
- card art that remains legible at small size
- low visual noise

### 8. Avoid direct IP copying
The game may take inspiration from high-level collectible card game conventions, but content must remain original.
Do not clone Pokémon, Chaotic, or any existing franchise names, creatures, lore, symbols, or card layouts.

---

## Expected Repository Structure

```txt
index.html
styles/
  main.css
  cards.css
  duel.css
src/
  main.js
  state.js
  data/
  systems/
  ui/
assets/
  icons/
  card-art/
  card-frames/
  ui/
```

---

## Product Quality Standard

When implementing anything, optimize for all of the following:

- immediate comprehension on first open
- strong visual hierarchy
- polished button and panel states
- minimal friction in the core loop
- clear progression visibility
- strong card readability
- maintainable data formats
- deterministic save behavior
- easy manual testing in browser

---

## Agent Routing Guidance

Use specialized agents when the task clearly matches one of these responsibilities.

- `system-architect` for structure and sequencing
- `gameplay-builder` for implementation
- `ui-product-designer` for polished interface execution
- `combat-balance-designer` for battle and tuning
- `idle-economy-designer` for pacing and progression loops
- `content-and-card-generator` for creatures, attacks, zones, and flavor
- `visual-pipeline-director` for icon, portrait, frame, and card-layout pipelines
- `qa-bug-hunter` for testing and issue discovery
- `refactor-guardian` for cleanup without behavioral drift

---

## Preferred Work Order

1. Plan the smallest complete product-facing slice.
2. Implement only that slice.
3. Validate manually in browser.
4. Check persistence impact.
5. Polish visible states.
6. Run QA review.
7. Refactor only after stability.

---

## Output Style for Agents

When producing implementation guidance, prefer:

1. what will change
2. files affected
3. key logic decisions
4. code or diffs
5. manual test steps
6. notable risks

Keep answers operational and concrete.
