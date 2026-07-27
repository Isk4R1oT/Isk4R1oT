// Composes assets/hero.svg from the scene library.
//
// A run picks N scenes out of the pool, shuffled by HERO_SEED, and lays them
// into one SMIL loop. The daily workflow passes a changing seed, so the opening
// scene differs day to day — the randomness has to live at build time, because
// an <img>-embedded SVG on GitHub never runs script.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { SCENES as INFERENCE } from "./lib/scenes.mjs";
import { SCENES as AGENTS } from "./lib/scenes-agents.mjs";

// Two plate sets: the serving stack, and the agent runtime around it.
const SETS = { inference: INFERENCE, agents: AGENTS };
const setName = process.env.HERO_SET ?? "inference";
const SCENES = SETS[setName];
if (!SCENES) throw new Error(`HERO_SET must be one of ${Object.keys(SETS).join(", ")}, got ${setName}`);
import {
  GRID as G, H, M, PALETTE as P, SCENE_SECONDS, TYPE, W,
  makeAnim, makeContext, shuffle, type,
} from "./lib/svg.mjs";

const seed = Number(process.env.HERO_SEED ?? 1);
const wanted = Number(process.env.HERO_SCENES ?? SCENES.length);
if (!Number.isFinite(seed)) throw new Error(`HERO_SEED must be a number, got ${process.env.HERO_SEED}`);
if (!Number.isInteger(wanted) || wanted < 1 || wanted > SCENES.length) {
  throw new Error(`HERO_SCENES must be an integer in 1..${SCENES.length}, got ${process.env.HERO_SCENES}`);
}

// HERO_ONLY renders a single named plate on its own, which is how the
// <details> gallery in the README gets one file per plate.
const only = process.env.HERO_ONLY;
if (only && !SCENES.some((s) => s.id === only)) {
  throw new Error(`HERO_ONLY="${only}" is not in set "${setName}": ${SCENES.map((s) => s.id).join(", ")}`);
}
const programme = only
  ? SCENES.filter((s) => s.id === only)
  : shuffle(SCENES, seed).slice(0, wanted);
const CYCLE = programme.length * SCENE_SECONDS;
const anim = makeAnim(CYCLE);

// Each plate carries its own provenance stamp. A drawing that illustrates a
// mechanism and a drawing that reports a real run must never look alike.
const STAMP = {
  schematic: { text: "SCHEMATIC · NOT A BENCHMARK", fill: "#2b3340" },
  measured: { text: "MEASURED · MY RUN", fill: P.signalDeep },
  unverified: { text: "UNVERIFIED · AWAITING NUMBERS", fill: P.warnDeep },
};

const scenes = programme
  .map((scene, index) => {
    const ctx = makeContext(index, CYCLE);
    const stamp = STAMP[scene.provenance] ?? STAMP.schematic;
    const body = `${scene.render(ctx)}
    ${type(TYPE.label, W - M, 526, stamp.text, { anchor: "end", fill: stamp.fill })}`;
    return ctx.enter(body);
  })
  .join("\n    ");

// Engraved index marks: which plate of the set is showing.
const ticks = programme
  .map((_, i) => {
    const x = M + i * 11;
    return `<rect x="${x}" y="519" width="2" height="7" rx="1" fill="${P.dim}" opacity="0.3">
      ${anim("opacity", [
        [0, 0.3], [i * SCENE_SECONDS, 0.3], [i * SCENE_SECONDS + 0.35, 1],
        [(i + 1) * SCENE_SECONDS - 0.35, 1], [(i + 1) * SCENE_SECONDS, 0.3], [CYCLE, 0.3],
      ])}
    </rect>`;
  })
  .join("\n    ");

const meta = [
  ["STACK", "SGLang · vLLM · Rust"],
  ["FOCUS", "AI infra, end to end"],
  ["BASE", "GMT+5 · remote"],
]
  .map(([k, v], i) => `${type(TYPE.label, 636, 56 + i * 22, k)}
      ${type(TYPE.datum, 704, 56 + i * 22, v, { fill: P.body })}`)
  .join("\n      ");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Iskariot — AI Systems Engineer. Animated schematics of the serving and agent stack.">
  <title>Iskariot — AI Systems Engineer</title>
  <desc>Animated schematic plates: ${programme.map((s) => s.id).join(", ")}. Illustrations of how these mechanisms behave — not benchmark results.</desc>

  <defs>
    <linearGradient id="plateFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${P.raised}"/>
      <stop offset="1" stop-color="#0f131a"/>
    </linearGradient>
    <linearGradient id="gSignal" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${P.signalDeep}"/><stop offset="1" stop-color="${P.signal}"/>
    </linearGradient>
    <linearGradient id="gCool" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${P.coolDeep}"/><stop offset="1" stop-color="${P.cool}"/>
    </linearGradient>
    <linearGradient id="gWarn" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${P.warnDeep}"/><stop offset="1" stop-color="${P.warn}"/>
    </linearGradient>
    <radialGradient id="atmos" cx="0.34" cy="0.02" r="0.85">
      <stop offset="0" stop-color="${P.cool}" stop-opacity="0.10"/>
      <stop offset="1" stop-color="${P.ink}" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow" x="-60%" y="-160%" width="220%" height="420%">
      <feGaussianBlur stdDeviation="3.4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="12" fill="${P.ink}" stroke="${P.rule}"/>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="12" fill="url(#atmos)"/>
  <path d="M13 1.5 H${W - 13}" stroke="#ffffff" stroke-opacity="0.07"/>

  <g>
    ${type(TYPE.eyebrow, M + 2, 40, "AI SYSTEMS ENGINEER")}
    ${type(TYPE.display, M, 88, "ISKARIOT")}
    ${type(TYPE.lede, M + 2, 114, "inference · agent runtimes · evals · tracing · the product on top")}

    <g>
      <rect x="620" y="30" width="224" height="80" rx="7" fill="url(#plateFill)" stroke="${P.rule}"/>
      <path d="M627 30.5 H837" stroke="#ffffff" stroke-opacity="0.05"/>
      ${meta}
    </g>

    <line x1="${M}" y1="136" x2="${W - M}" y2="136" stroke="${P.rule}"/>

    ${scenes}

    <line x1="${M}" y1="506" x2="${W - M}" y2="506" stroke="${P.ruleSoft}"/>
    ${ticks}
  </g>
</svg>
`;

const target = only
  ? `assets/plates/${only}.svg`
  : setName === "inference" ? "assets/hero.svg" : `assets/hero-${setName}.svg`;
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, svg, "utf8");
console.log(`wrote ${target} (${svg.length} bytes)`);
console.log(`set=${setName} seed=${seed} cycle=${CYCLE}s programme: ${programme.map((s) => s.id).join(" → ")}`);
