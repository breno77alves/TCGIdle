/*
 * Balance simulator — offline.
 * Loads data + duel module via shim and runs N duels to measure:
 *   - player win rate (baseline expected: ~50% since both sides are mid-range)
 *   - average duel length in ticks
 *   - distribution of expedition quality labels
 *
 * Usage: node scripts/balance-sim.js [runs]
 */

const fs = require("fs");
const path = require("path");

global.window = global;
global.localStorage = { getItem: () => null, setItem: () => {} };

const files = [
  "src/data/tribes.js",
  "src/data/creatures.js",
  "src/data/locations.js",
  "src/data/npcs.js",
  "src/systems/rolling.js",
  "src/systems/duel.js",
];

files.forEach((rel) => {
  const full = path.join(__dirname, "..", rel);
  const source = fs.readFileSync(full, "utf8");
  new Function(source).call(global);
});

const Data = global.TCGIdleData;
const Duel = global.TCGIdleDuel;
const Rolling = global.TCGIdleRolling;

function makeStarterPlayer() {
  return {
    deck: {
      slots: Data.starterDeck.map((entry, i) => "starter-" + i),
    },
    collection: {
      cards: Data.starterDeck.map((entry, i) => ({
        instanceId: "starter-" + i,
        baseId: entry.baseId,
        stats: Object.assign({}, entry.stats),
        rolledAt: "",
        source: "starter",
        seen: true,
      })),
    },
    duel: { status: "idle", current: null, lastResult: null },
    progress: { duelsWon: 0, duelsLost: 0, essence: 0 },
  };
}

function simulateDuel() {
  const s = makeStarterPlayer();
  Duel.startDuel(s, "vinsmor");
  let safety = 400;
  while (s.duel.status === "running" && safety > 0) {
    Duel.tickDuel(s);
    safety -= 1;
  }
  return {
    outcome: s.duel.status,
    ticks: s.duel.current.tick,
    playerAlive: s.duel.current.playerQueue.filter((f) => f.hp > 0).length,
    enemyAlive: s.duel.current.enemyQueue.filter((f) => f.hp > 0).length,
  };
}

function simulateExpeditionDrops() {
  const location = Data.locations[0];
  const qualities = { "Excepcional": 0, "Refinado": 0, "Estável": 0, "Rústico": 0, "Pálido": 0 };
  const runs = 4000;
  for (let i = 0; i < runs; i += 1) {
    const pool = location.creaturePool;
    const baseId = pool[Math.floor(Math.random() * pool.length)].creatureId;
    const card = Rolling.rollCard(baseId, "sim");
    qualities[Rolling.rollQualityLabel(card)] += 1;
  }
  return { runs, qualities };
}

const N = Number(process.argv[2] || 2000);

let wins = 0;
let losses = 0;
let totalTicks = 0;
let minTicks = Infinity;
let maxTicks = 0;
const alivePlayerDist = {};
for (let i = 0; i < N; i += 1) {
  const r = simulateDuel();
  if (r.outcome === "won") wins += 1;
  else losses += 1;
  totalTicks += r.ticks;
  if (r.ticks < minTicks) minTicks = r.ticks;
  if (r.ticks > maxTicks) maxTicks = r.ticks;
  alivePlayerDist[r.playerAlive] = (alivePlayerDist[r.playerAlive] || 0) + 1;
}

const winRate = (wins / N) * 100;
const avgTicks = totalTicks / N;
const avgSeconds = (avgTicks * 900) / 1000;

console.log("========== DUELO vs VINSMOR ==========");
console.log("Amostras:               " + N);
console.log("Taxa de vitória:        " + winRate.toFixed(2) + "%  (alvo: ~50%)");
console.log("Duração média:          " + avgTicks.toFixed(1) + " ticks (~" + avgSeconds.toFixed(1) + "s)");
console.log("Duração min/max:        " + minTicks + " / " + maxTicks + " ticks");
console.log("Criaturas vivas (player no fim):");
Object.keys(alivePlayerDist).sort((a, b) => Number(a) - Number(b)).forEach((k) => {
  const pct = ((alivePlayerDist[k] / N) * 100).toFixed(1);
  console.log("  " + k + " criaturas vivas: " + pct + "% das amostras");
});

console.log("\n========== EXPEDIÇÕES ==========");
const exp = simulateExpeditionDrops();
console.log("Amostras:               " + exp.runs);
console.log("Distribuição de qualidade (rolls):");
Object.keys(exp.qualities).forEach((q) => {
  const pct = ((exp.qualities[q] / exp.runs) * 100).toFixed(1);
  console.log("  " + q.padEnd(14) + pct + "%");
});
