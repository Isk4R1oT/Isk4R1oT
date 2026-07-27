// The plate set.
//
// Rule that governs every plate: the focal number is an AHA, not a definition,
// and the caption is a counterintuitive claim, not a restatement of the title.
// A plate that only says "X is when Y happens" does not belong here.
//
// Provenance is declared per plate. SCHEMATIC plates illustrate a mechanism.
// MEASURED plates carry numbers from real runs and read them from
// data/measured.json — an unfilled value renders as "pending" and downgrades
// the stamp to UNVERIFIED, so a fabricated number can never ship as measured.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  GRID as G, PALETTE as P, TYPE, arrow, caption, dot, focal, rowLabel,
  rule, sceneTitle, subtitle, takeaway, track, type,
} from "./svg.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const measured = JSON.parse(readFileSync(join(here, "..", "data", "measured.json"), "utf8"));

const SENTINEL = "__FILL_ME__";
export const pending = (v) => v === undefined || v === null || v === SENTINEL;
const show = (v) => (pending(v) ? "pending" : v);
const shade = (v) => (pending(v) ? P.dim : undefined);

const X = G.contentX;
const X1 = G.contentX1;

// Shared plot frame for the chart-shaped plates.
const PLOT = { x0: 56, x1: 844, top: 240, base: 438 };

// No x-axis caption: the tick labels sit on that same baseline and every plate
// that tried to carry both ended up with the two colliding.
const axes = (ctx, yLabel) => `<g opacity="0">${ctx.reveal(ctx.beat.structure)}
  ${rule(PLOT.x0, PLOT.base, PLOT.x1, PLOT.base, P.rule, 1)}
  ${rule(PLOT.x0, PLOT.top, PLOT.x0, PLOT.base, P.rule, 1)}
  ${type(TYPE.label, PLOT.x0, PLOT.top - 8, yLabel)}
</g>`;

// ------------------------------------------------------------- 1. roofline

const roofline = (ctx) => {
  const b = ctx.beat;
  const a100 = { ridgeX: 372, roofY: 356, label: "201" };
  const h100 = { ridgeX: 556, roofY: 278, label: "295" };
  const originY = 434;
  const path = `M${PLOT.x0} ${originY} L${h100.ridgeX} ${h100.roofY} L${PLOT.x1} ${h100.roofY}`;

  const roof = (r, color, width, t) => `<g opacity="0">${ctx.reveal(t)}
    <path d="M${PLOT.x0} ${originY} L${r.ridgeX} ${r.roofY} L${PLOT.x1} ${r.roofY}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round"/>
    ${rule(r.ridgeX, r.roofY, r.ridgeX, PLOT.base, color, 1, "4 4")}
    ${type(TYPE.label, r.ridgeX, PLOT.base + 18, r.label, { anchor: "middle", fill: color })}
  </g>`;

  const batches = ["b 1", "b 8", "b 32", "b 96", "b 256"];
  const ticker = batches.map((v, i) => {
    const s = ctx.paced(i * 1.2, 6.4);
    return `<g opacity="0">
      ${ctx.at("opacity", 0, [[s - 0.12, 0], [s, 1], [s + 1.15, 1], [s + 1.25, 0]])}
      ${type(TYPE.datum, PLOT.x1, PLOT.base + 18, v, { anchor: "end", fill: P.signal, slot: "batch" })}
    </g>`;
  }).join("");

  return `${sceneTitle("THE ROOFLINE")}
    <g opacity="0">${ctx.reveal(b.subtitle)}${subtitle("arithmetic intensity decides the regime — and the batch decides the intensity")}</g>
    <g opacity="0">${ctx.reveal(b.action + 5.2)}${focal(X1, G.titleY + 3, "201 → 295", "ridge point, A100 → H100", P.signal)}</g>
    ${axes(ctx, "attainable flop/s   ·   x: arithmetic intensity")}
    ${roof(a100, P.dim, 1.6, b.structure + 0.3)}
    ${roof(h100, P.cool, 2.2, b.structure + 0.8)}
    ${ticker}
    <circle r="5.5" cx="${PLOT.x0}" cy="${originY}" fill="${P.signal}" opacity="0" filter="url(#glow)">
      ${ctx.at("opacity", 0, [[b.action - 0.2, 0], [b.action, 1]])}
      ${ctx.at("cx", PLOT.x0, [[b.action, PLOT.x0], [b.action + 4.9, h100.ridgeX], [b.actionEnd, PLOT.x1 - 40]])}
      ${ctx.at("cy", originY, [[b.action, originY], [b.action + 4.9, h100.roofY], [b.actionEnd, h100.roofY]])}
    </circle>
    <g opacity="0">${ctx.reveal(b.actionEnd - 0.8)}
      ${type(TYPE.label, PLOT.x1, h100.roofY - 12, "the roof ignores model size", { anchor: "end", fill: P.cool })}
    </g>
    <g opacity="0">${ctx.reveal(b.caption)}${caption("the regime is set by batch size, not by model size — this is where intuition fails first")}</g>
    <g opacity="0">${ctx.reveal(b.caption + 0.45)}${takeaway("every sizing conversation I open starts at the ridge point, not at the parameter count")}</g>`;
};

// -------------------------------------------------- 2. the mostly-dark core

const tensorCoreDark = (ctx) => {
  const b = ctx.beat;
  const cols = 16, rows = 6, cw = 49, ch = 20, x0 = 56, y0 = 250;
  const litCol = 6;

  const cells = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const isDecode = c === litCol;
      // Dark lanes light up one by one once speculation gives them work.
      const fillT = ctx.paced(2.6 + (c / cols) * 3.4, 6.4);
      const stops = isDecode
        ? [[b.action, 0.1], [b.action + 0.6, 1]]
        : [[b.action, 0.07], [fillT, 0.07], [fillT + 0.3, 0.92]];
      cells.push(`<rect x="${x0 + c * cw}" y="${y0 + r * (ch + 7)}" width="${cw - 8}" height="${ch}" rx="2.5" fill="${isDecode ? P.signal : P.signalDeep}" opacity="0.07">
        ${ctx.at("opacity", 0.07, stops)}
      </rect>`);
    }
  }

  const gauge = [["1 / 16", b.action + 0.6], ["4 / 16", b.action + 4.9], ["11 / 16", b.action + 7.0], ["16 / 16", b.action + 8.7]]
    .map(([v, s], i, arr) => {
      const end = i === arr.length - 1 ? b.hold : arr[i + 1][1];
      return `<g opacity="0">
        ${ctx.at("opacity", 0, [[s - 0.1, 0], [s, 1], [end - 0.1, 1], [end, 0]])}
        ${focal(X1, G.titleY + 3, v, "tensor-core lanes lit", i === arr.length - 1 ? P.signal : P.warn, "lanes")}
      </g>`;
    }).join("");

  return `${sceneTitle("A TENSOR CORE, MOSTLY DARK")}
    <g opacity="0">${ctx.reveal(b.subtitle)}${subtitle("decode is matrix–vector: one lane works, the rest of the silicon idles")}</g>
    ${gauge}
    ${cells.join("\n    ")}
    <g opacity="0">${ctx.reveal(b.action + 1.8)}
      ${type(TYPE.label, x0, y0 - 12, "decode · one column busy", { fill: P.warn })}
    </g>
    <g opacity="0">${ctx.reveal(b.action + 6.7)}
      ${type(TYPE.label, PLOT.x1, y0 - 12, "speculation fills the dark lanes", { anchor: "end", fill: P.signal })}
    </g>
    <g opacity="0">${ctx.reveal(b.caption)}${caption("speculative decoding is nearly free because the hardware was already idle — not because the draft model is small")}</g>
    <g opacity="0">${ctx.reveal(b.caption + 0.45)}${takeaway("so I reach for speculation before I reach for a bigger card")}</g>`;
};

// ----------------------------------------------------------------- 3. knee

const knee = (ctx) => {
  const b = ctx.beat;
  const pts = [
    { batch: "8", v: 0.08 }, { batch: "16", v: 0.11 }, { batch: "32", v: 0.15 },
    { batch: "64", v: 0.19 }, { batch: "128", v: 0.94 },
  ];
  const step = (PLOT.x1 - PLOT.x0 - 40) / (pts.length - 1);
  const px = (i) => PLOT.x0 + 20 + i * step;
  const py = (v) => PLOT.base - v * (PLOT.base - PLOT.top);

  const segs = pts.slice(1).map((p, i) => {
    const t = ctx.paced(i * 1.4, 6.4);
    return `<g opacity="0">${ctx.reveal(t)}
      ${rule(px(i), py(pts[i].v), px(i + 1), py(p.v), i === pts.length - 2 ? P.warn : P.signal, i === pts.length - 2 ? 2.6 : 2)}
    </g>`;
  }).join("");

  const nodes = pts.map((p, i) => {
    const t = i === 0 ? b.structure + 0.4 : ctx.paced((i - 1) * 1.4, 6.4);
    return `<g opacity="0">${ctx.reveal(t)}
      ${dot(px(i), py(p.v), i === pts.length - 1 ? 5 : 3.4, i === pts.length - 1 ? P.warn : P.signal)}
      ${type(TYPE.label, px(i), PLOT.base + 18, p.batch, { anchor: "middle" })}
    </g>`;
  }).join("");

  const ghost = `<g opacity="0">${ctx.reveal(ctx.paced(4.4, 6.4))}
    ${rule(px(3), py(pts[3].v), px(4), py(0.23), P.dim, 1.6, "5 4")}
    ${type(TYPE.label, px(4) - 8, py(0.23) + 16, "where linear extrapolation put it", { anchor: "end", fill: P.dim })}
  </g>`;

  return `${sceneTitle("THE KNEE")}
    <g opacity="0">${ctx.reveal(b.subtitle)}${subtitle("time-to-first-token barely moves from 32 to 64, then falls apart at 128")}</g>
    <g opacity="0">${ctx.reveal(ctx.paced(5.6, 6.4))}${focal(X1, G.titleY + 3, "128", "the batch that broke it", P.warn)}</g>
    ${axes(ctx, "ttft   ·   x: batch size")}
    ${ghost}
    ${segs}
    ${nodes}
    <g opacity="0">${ctx.reveal(b.caption)}${caption("the performance space is not a flat sheet — nothing you measured below the knee predicts what is above it")}</g>
    <g opacity="0">${ctx.reveal(b.caption + 0.45)}${takeaway("I benchmark at the batch sizes I will actually serve, and never interpolate between them")}</g>`;
};

// ------------------------------------------------------------- 4. boundary

const boundary = (ctx) => {
  const b = ctx.beat;
  const curve = [0.04, 0.10, 0.42, 0.86, 1.0, 0.92, 0.61, 0.28, 0.09, 0.03];
  const step = (PLOT.x1 - PLOT.x0) / (curve.length - 1);
  const px = (i) => PLOT.x0 + i * step;
  const py = (v) => PLOT.base - v * (PLOT.base - PLOT.top - 14);
  const path = curve.map((v, i) => `${i ? "L" : "M"}${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(" ");

  const zone = (x, w, label, t) => `<g opacity="0">${ctx.reveal(t)}
    <rect x="${x}" y="${PLOT.top}" width="${w}" height="${PLOT.base - PLOT.top}" fill="${P.warn}" opacity="0.07"/>
    ${type(TYPE.label, x + w / 2, PLOT.top + 16, label, { anchor: "middle", fill: P.warn })}
  </g>`;

  return `${sceneTitle("THE BOUNDARY")}
    <g opacity="0">${ctx.reveal(b.subtitle)}${subtitle("disaggregating prefill from decode pays in the middle of the curve — and only there")}</g>
    <g opacity="0">${ctx.reveal(ctx.paced(4.2, 6.4))}${focal(X1, G.titleY + 3, "2×", "and only mid-curve", P.signal)}</g>
    ${axes(ctx, "tok/s per gpu   ·   x: input length and load")}
    <path d="${path}" fill="none" stroke="${P.signal}" stroke-width="2.6" stroke-linejoin="round" stroke-dasharray="900" stroke-dashoffset="900" filter="url(#glow)">
      ${ctx.at("stroke-dashoffset", 900, [[b.action, 900], [ctx.paced(4.0, 6.4), 0]])}
    </path>
    ${zone(PLOT.x0, step * 1.6, "no gain", ctx.paced(4.6, 6.4))}
    ${zone(PLOT.x1 - step * 1.9, step * 1.9, "no gain", ctx.paced(5.2, 6.4))}
    <g opacity="0">${ctx.reveal(b.caption)}${caption("on short inputs you never leave decode; at the extremes the aggregated engine catches up")}</g>
    <g opacity="0">${ctx.reveal(b.caption + 0.45)}${takeaway("I shipped disaggregation only after the traffic profile sat inside the hump")}</g>`;
};

// ------------------------------------------------- 5. self-filling cache

const selfFillingCache = (ctx) => {
  const b = ctx.beat;
  const nodes = [0, 1, 2, 3];
  const hot = 1;
  const nx = (i) => 56 + i * 82;

  const workers = nodes.map((i) => {
    const overload = i === hot;
    const y = 292;
    const qGrow = ctx.paced(0.6, 6.4);
    const qDrain = ctx.paced(3.2, 6.4);
    return `<g>
      <rect x="${nx(i)}" y="${y}" width="58" height="34" rx="5" fill="url(#plateFill)" stroke="${P.rule}"/>
      <rect x="${nx(i)}" y="${y}" width="58" height="34" rx="5" fill="${P.warn}" opacity="0">
        ${overload ? ctx.at("opacity", 0, [[qGrow, 0], [qGrow + 0.8, 0.5], [qDrain, 0.5], [qDrain + 0.8, 0.08]]) : ""}
      </rect>
      ${type(TYPE.label, nx(i) + 29, y + 21, `n${i + 1}`, { anchor: "middle", fill: P.body })}
      <rect x="${nx(i)}" y="${y + 42}" width="58" height="7" rx="3" fill="${P.raised}"/>
      <rect x="${nx(i)}" y="${y + 42}" height="7" rx="3" fill="${overload ? P.warn : P.signal}" width="6">
        ${ctx.at("width", 6, overload
          ? [[qGrow, 6], [qGrow + 0.9, 58], [qDrain, 58], [qDrain + 0.9, 22]]
          : [[qGrow, 6], [qGrow + 0.9, 10], [qDrain, 10], [qDrain + 0.9, 24]])}
      </rect>
    </g>`;
  }).join("");

  const hitPts = [0.30, 0.52, 0.66, 0.75, 0.80, 0.835, 0.855, 0.865];
  const hx = (i) => 448 + i * 52;
  const hy = (v) => 436 - v * 160;
  const hitPath = hitPts.map((v, i) => `${i ? "L" : "M"}${hx(i)} ${hy(v).toFixed(1)}`).join(" ");

  return `${sceneTitle("THE CACHE THAT FILLS ITSELF")}
    <g opacity="0">${ctx.reveal(b.subtitle)}${subtitle("prefix-match routing alone queues the hottest node")}</g>
    <g opacity="0">${ctx.reveal(ctx.paced(5.4, 6.4))}${focal(X1, G.titleY + 3, "→ 0.87", "hit rate vs cluster size", P.signal)}</g>
    <g opacity="0">${ctx.reveal(b.structure)}${type(TYPE.label, 56, 268, "greedy prefix routing", { fill: P.warn })}</g>
    ${workers}
    <g opacity="0">${ctx.reveal(ctx.paced(3.4, 6.4))}
      ${type(TYPE.label, 56, 400, "rebalanced on prefix ∧ load", { fill: P.signal })}
    </g>
    <g opacity="0">${ctx.reveal(b.structure)}
      ${rule(408, PLOT.top - 4, 408, PLOT.base, P.ruleSoft, 1)}
      ${type(TYPE.label, 448, 268, "hit rate vs cluster size", {})}
    </g>
    <path d="${hitPath}" fill="none" stroke="${P.signal}" stroke-width="2.4" stroke-linejoin="round" stroke-dasharray="400" stroke-dashoffset="400">
      ${ctx.at("stroke-dashoffset", 400, [[ctx.paced(2.0, 6.4), 400], [ctx.paced(5.4, 6.4), 0]])}
    </path>
    <g opacity="0">${ctx.reveal(ctx.paced(5.6, 6.4))}
      ${rule(448, hy(0.885), 812, hy(0.885), P.dim, 1, "4 4")}
      ${type(TYPE.label, 812, hy(0.885) - 6, "asymptote", { anchor: "end" })}
    </g>
    <g opacity="0">${ctx.reveal(b.caption)}${caption("the bigger the cluster, the less prefill it ever has to do again — the cache compounds")}</g>
    <g opacity="0">${ctx.reveal(b.caption + 0.45)}${takeaway("routing on prefix alone was my own bug — the fix scored prefix against queue depth")}</g>`;
};

// ------------------------------------------------ 6. moe dispatch / combine

const moeDispatch = (ctx) => {
  const b = ctx.beat;
  const m = measured.moeServe;
  const experts = [0, 1, 2, 3];
  const ex = 452, ey = (i) => 250 + i * 46;

  const fan = experts.map((i) => {
    const t = ctx.paced(i * 0.4, 6.4);
    const chosen = i === 0 || i === 2;
    return `<g opacity="0">${ctx.reveal(t)}
      <path d="M300 342 C372 342, 382 ${ey(i) + 10}, ${ex} ${ey(i) + 10}" fill="none" stroke="${chosen ? P.signal : P.rule}" stroke-width="${chosen ? 2 : 1.1}"/>
      <rect x="${ex}" y="${ey(i)}" width="86" height="21" rx="4" fill="${chosen ? P.signalDeep : P.raised}" stroke="${chosen ? P.signal : P.rule}"/>
      ${type(TYPE.label, ex + 43, ey(i) + 14, `expert ${i + 1}`, { anchor: "middle", fill: chosen ? P.bright : P.dim })}
    </g>`;
  }).join("");

  const fork = m.conventions.map((c, i) => {
    const t = ctx.paced(3.2 + i * 0.9, 6.4);
    const accent = c.correct ? P.signal : P.warn;
    const boxY = 300 + i * 76;
    return `<g opacity="0">${ctx.reveal(t)}
      <rect x="600" y="${boxY}" width="244" height="38" rx="5" fill="url(#plateFill)" stroke="${accent}" stroke-opacity="0.55"/>
      ${type(TYPE.datum, 614, boxY + 18, c.name, { fill: accent })}
      ${type(TYPE.label, 614, boxY + 30, c.models)}
      ${type(TYPE.label, 830, boxY + 18, c.correct ? "match" : "silent wrong", { anchor: "end", fill: accent })}
    </g>`;
  }).join("");

  return `${sceneTitle("EXPERT ROUTING · DISPATCH / COMBINE")}
    <g opacity="0">${ctx.reveal(b.subtitle)}${subtitle("the router convention differs by model — and getting it backwards fails silently")}</g>
    <g opacity="0">${ctx.reveal(ctx.paced(5.6, 6.4))}${focal(X1, G.titleY + 3, show(m.oracle), "logits vs hf transformers", pending(m.oracle) ? P.dim : P.signal)}</g>
    <g opacity="0">${ctx.reveal(b.structure)}
      ${type(TYPE.label, 224, 268, "tokens", {})}
      ${[0, 1, 2, 3, 4].map((i) => dot(238 + i * 14, 342, 4, P.cool)).join("")}
      ${arrow(300, 342, 360, P.rule)}
    </g>
    ${fan}
    <g opacity="0">${ctx.reveal(ctx.paced(2.6, 6.4))}
      ${type(TYPE.label, ex + 43, ey(3) + 34, "grouped GEMM → combine", { anchor: "middle", fill: P.body })}
    </g>
    ${fork}
    <g opacity="0">${ctx.reveal(b.caption)}${caption("same shapes, same tests passing, different logits — softmax-then-topk is not topk-then-softmax")}</g>
    <g opacity="0">${ctx.reveal(b.caption + 0.45)}${takeaway("so token-exact parity with HF is my acceptance gate, not a smoke test")}</g>`;
};

// ------------------------------------------------------- 7. grouped GEMM

const groupedGemm = (ctx) => {
  const b = ctx.beat;
  const m = measured.groupedGemm;
  const steps = m.steps;
  const heights = [0.22, 0.42, 0.61, 0.78, 0.90];
  const bw = 136, gap = 27;
  const x0 = 56;
  const py = (v) => PLOT.base - v * (PLOT.base - PLOT.top - 10);

  const bars = steps.map((label, i) => {
    const t = ctx.paced(i * 1.2, 6.4);
    const h = PLOT.base - py(heights[i]);
    const last = i === steps.length - 1;
    return `<g opacity="0">${ctx.reveal(t)}
      <rect x="${x0 + i * (bw + gap)}" y="${py(heights[i]).toFixed(1)}" width="${bw}" height="${h.toFixed(1)}" rx="3" fill="${last ? P.signal : P.signalDeep}"/>
      ${type(TYPE.label, x0 + i * (bw + gap) + bw / 2, PLOT.base + 18, label, { anchor: "middle", fill: last ? P.signal : P.dim })}
    </g>`;
  }).join("");

  return `${sceneTitle("A HAND-WRITTEN KERNEL vs cuBLAS")}
    <g opacity="0">${ctx.reveal(b.subtitle)}${subtitle("measured against the vendor library at every optimisation step")}</g>
    <g opacity="0">${ctx.reveal(ctx.paced(5.0, 6.4))}${focal(X1, G.titleY + 3, show(m.finalPercent), "of cuBLAS grouped", pending(m.finalPercent) ? P.dim : P.signal)}</g>
    ${axes(ctx, "% of cuBLAS   ·   x: optimisation step")}
    ${bars}
    <g opacity="0">${ctx.reveal(ctx.paced(5.4, 6.4))}
      ${rule(x0, py(0.955), 800, py(0.955), P.warn, 1, "5 4")}
      ${type(TYPE.label, 800, py(0.955) - 7, "cuBLAS", { anchor: "end", fill: P.warn })}
    </g>
    <g opacity="0">${ctx.reveal(b.caption)}${caption(m.note)}</g>
    <g opacity="0">${ctx.reveal(b.caption + 0.45)}${takeaway("I stopped where the next percent cost more than renting another GPU")}</g>`;
};

// ------------------------------------------------------- 8. determinism

const determinism = (ctx) => {
  const b = ctx.beat;
  const m = measured.determinism;
  const runs = [
    { id: "run 01", drift: 0 }, { id: "run 02", drift: 0 },
    { id: "run 07", drift: -8 }, { id: "run 14", drift: 0 },
    { id: "run 23", drift: 8 }, { id: "run 32", drift: 0 },
  ];
  const steps = 12, x0 = X + 16, span = 664, at = 6;
  const dx = span / (steps - 1);
  const tOf = (i) => ctx.paced(i * 0.9, 11.5);

  const body = runs.map((run, ri) => {
    const y = 236 + ri * 34;
    const segs = Array.from({ length: steps - 1 }, (_, i) => {
      const off = run.drift && i + 1 >= at;
      const y1 = run.drift && i >= at ? y + run.drift : y;
      return `<line x1="${(x0 + i * dx).toFixed(1)}" y1="${y1}" x2="${(x0 + (i + 1) * dx).toFixed(1)}" y2="${off ? y + run.drift : y}" stroke="${off ? P.warn : P.signalDeep}" stroke-width="${off ? 2 : 1.4}" opacity="0">
        ${ctx.at("opacity", 0, [[tOf(i + 1) - 0.3, 0], [tOf(i + 1), 1]])}
      </line>`;
    }).join("");
    const nodes = Array.from({ length: steps }, (_, i) => {
      const off = run.drift && i >= at;
      return `<circle cx="${(x0 + i * dx).toFixed(1)}" cy="${off ? y + run.drift : y}" r="${i === at && run.drift ? 4.6 : 3.2}" fill="${off ? P.warn : P.signal}" opacity="0">
        ${ctx.at("opacity", 0, [[tOf(i) - 0.2, 0], [tOf(i), 1]])}
      </circle>`;
    }).join("");
    return `<g><g opacity="0">${ctx.reveal(b.structure)}${rowLabel(y, run.id)}</g>${segs}${nodes}</g>`;
  }).join("");

  const mx = (x0 + at * dx).toFixed(1);
  return `${sceneTitle("SAME SEED · STILL DIVERGES")}
    <g opacity="0">${ctx.reveal(b.subtitle)}${subtitle("temperature 0, one seed, 32 runs — the batch they landed in is the only thing that differed")}</g>
    <g opacity="0">${ctx.reveal(tOf(at) + 0.6)}${focal(X1, G.titleY + 3, show(m.bitwiseResult), "bitwise identical", pending(m.bitwiseResult) ? P.dim : P.warn)}</g>
    ${body}
    <line x1="${mx}" y1="214" x2="${mx}" y2="432" stroke="${P.warn}" stroke-width="1" stroke-dasharray="4 4" opacity="0">
      ${ctx.at("opacity", 0, [[tOf(at), 0], [tOf(at) + 0.4, 0.8]])}
    </line>
    <g opacity="0">${ctx.reveal(tOf(at) + 0.5)}
      <path d="M${Number(mx) - 6} 206 L${Number(mx) + 6} 206 L${mx} 214 Z" fill="${P.warn}"/>
      ${type(TYPE.label, Number(mx) + 12, 442, "reduction order changed", { fill: P.warn })}
      ${type(TYPE.label, Number(mx) - 12, 442, "identical", { anchor: "end" })}
    </g>
    <g opacity="0">${ctx.reveal(b.caption)}${caption("batch composition changes the order of floating-point reductions — the seed was never the problem")}</g>
    <g opacity="0">${ctx.reveal(b.caption + 0.45)}${takeaway("I stopped chasing seeds and started pinning batch composition in the harness")}</g>`;
};

// ------------------------------------------------------- 9. super weight

const superWeight = (ctx) => {
  const b = ctx.beat;
  const cols = 26, rows = 7, cw = 30, chh = 19, x0 = 56, y0 = 244;
  const outliers = new Set([14, 63, 108, 141, 176]);
  const superIdx = 92;

  const cells = [];
  for (let i = 0; i < cols * rows; i++) {
    const c = i % cols, r = Math.floor(i / cols);
    const isOut = outliers.has(i);
    const isSuper = i === superIdx;
    const base = isOut ? 0.85 : 0.1 + ((i * 37) % 13) / 90;
    let stops = [[b.structure, base]];
    if (isOut) stops = [[b.structure, base], [ctx.paced(1.0, 6.4), base], [ctx.paced(1.4, 6.4), 1]];
    if (isSuper) stops = [[b.structure, base], [ctx.paced(3.4, 6.4), base], [ctx.paced(3.8, 6.4), 1], [ctx.paced(5.0, 6.4), 1], [ctx.paced(5.3, 6.4), 0.06]];
    cells.push(`<rect x="${x0 + c * cw}" y="${y0 + r * (chh + 5)}" width="${cw - 5}" height="${chh}" rx="2" fill="${isSuper ? P.warn : isOut ? P.cool : P.signalDeep}" opacity="${base}">
      ${ctx.at("opacity", base, stops)}
    </rect>`);
  }

  const accY = 434;
  return `${sceneTitle("THE WEIGHT YOU CANNOT TOUCH")}
    <g opacity="0">${ctx.reveal(b.subtitle)}${subtitle("super weights are not magnitude outliers — the standard heuristic walks straight past them")}</g>
    <g opacity="0">${ctx.reveal(ctx.paced(5.4, 6.4))}${focal(X1, G.titleY + 3, "1", "weight → accuracy cliff", P.warn)}</g>
    ${cells.join("\n    ")}
    <g opacity="0">
      ${ctx.at("opacity", 0, [[ctx.paced(1.3, 6.4), 0], [ctx.paced(1.6, 6.4), 1], [ctx.paced(3.5, 6.4), 1], [ctx.paced(3.8, 6.4), 0]])}
      ${type(TYPE.label, x0, y0 - 12, "naive pass: keep the large ones in high precision", { fill: P.cool, slot: "verdict" })}
    </g>
    <g opacity="0">${ctx.reveal(ctx.paced(4.0, 6.4))}
      ${type(TYPE.label, x0, y0 - 12, "but this one is small — and load-bearing", { fill: P.warn, slot: "verdict" })}
    </g>
    <g opacity="0">${ctx.reveal(b.structure)}${rowLabel(accY, "accuracy", P.body)}${track(X, accY - 8, 696, 12)}</g>
    <rect x="${X}" y="${accY - 8}" height="12" rx="2.5" fill="url(#gSignal)" width="0">
      ${ctx.at("width", 0, [[b.structure, 0], [b.structure + 0.6, 672], [ctx.paced(5.2, 6.4), 672], [ctx.paced(5.6, 6.4), 62]])}
    </rect>
    <g opacity="0">${ctx.reveal(b.caption)}${caption("zero one small number in an early down-projection and the model stops working — magnitude was never the right filter")}</g>
    <g opacity="0">${ctx.reveal(b.caption + 0.45)}${takeaway("my quantization gate is measured drift on a frozen set, never a magnitude heuristic")}</g>`;
};

// -------------------------------------- 10. attention becomes memory-bound

const attentionCrossover = (ctx) => {
  const b = ctx.beat;
  const n = 10;
  const ffn = [0.78, 0.72, 0.64, 0.55, 0.46, 0.38, 0.31, 0.25, 0.20, 0.16];
  const attn = [0.14, 0.20, 0.29, 0.40, 0.52, 0.63, 0.72, 0.79, 0.85, 0.89];
  const step = (PLOT.x1 - PLOT.x0) / (n - 1);
  const px = (i) => PLOT.x0 + i * step;
  const py = (v) => PLOT.base - v * (PLOT.base - PLOT.top - 12);
  const area = (arr) =>
    `M${PLOT.x0} ${PLOT.base} ` + arr.map((v, i) => `L${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(" ") + ` L${PLOT.x1} ${PLOT.base} Z`;

  const cross = 4.4;
  const crossX = PLOT.x0 + cross * step;

  return `${sceneTitle("WHEN ATTENTION GOES MEMORY-BOUND")}
    <g opacity="0">${ctx.reveal(b.subtitle)}${subtitle("prefill is compute-bound only while the context is short")}</g>
    <g opacity="0">${ctx.reveal(ctx.paced(4.6, 6.4))}${focal(X1, G.titleY + 3, "the crossover", "context length", P.warn)}</g>
    ${axes(ctx, "share of time   ·   x: context length")}
    <g opacity="0">${ctx.reveal(b.action)}
      <path d="${area(ffn)}" fill="${P.coolDeep}" opacity="0.55"/>
      ${type(TYPE.label, PLOT.x0 + 14, PLOT.base - 16, "ffn · compute", { fill: P.cool })}
    </g>
    <g opacity="0">${ctx.reveal(ctx.paced(1.6, 6.4))}
      <path d="${area(attn)}" fill="${P.warnDeep}" opacity="0.5"/>
      ${type(TYPE.label, PLOT.x1 - 14, PLOT.base - 16, "attention · kv bandwidth", { anchor: "end", fill: P.warn })}
    </g>
    <g opacity="0">${ctx.reveal(ctx.paced(4.2, 6.4))}
      ${rule(crossX, PLOT.top, crossX, PLOT.base, P.bright, 1, "4 4")}
      ${type(TYPE.label, crossX + 8, PLOT.top + 14, "regime flips here", { fill: P.bright })}
    </g>
    <g opacity="0">${ctx.reveal(b.caption)}${caption("past the crossover, reading the KV cache costs more than the matrix multiplies do — prefill turns into a bandwidth problem")}</g>
    <g opacity="0">${ctx.reveal(b.caption + 0.45)}${takeaway("KV offload earns its complexity only past this point — before it, it is just moving parts")}</g>`;
};

// ------------------------------------------------------- 11. cold start

const coldStart = (ctx) => {
  const b = ctx.beat;
  const x0 = X, x1 = 830, y = 366, amp = 92;
  const pts = [0.26, 0.32, 0.50, 0.78, 0.94, 0.72, 0.49, 0.34, 0.26, 0.18, 0.09, 0.03];
  const path = pts.map((v, i) =>
    `${i ? "L" : "M"}${(x0 + (i * (x1 - x0)) / (pts.length - 1)).toFixed(1)} ${(y - v * amp).toFixed(1)}`).join(" ");

  const counts = [1, 2, 4, 4, 2, 0];
  const pods = Array.from({ length: 4 }, (_, i) => {
    const stops = counts.map((c, k) => [ctx.paced(k * 1.1, 6.4), c > i ? 1 : 0.1]);
    return `<rect x="${(X + i * 34).toFixed(1)}" y="406" width="27" height="25" rx="4" fill="${P.cool}" opacity="0.1">
      ${ctx.at("opacity", 0.1, stops)}
    </rect>`;
  }).join("");

  return `${sceneTitle("COLD START IS A MEMORY PROBLEM")}
    <g opacity="0">${ctx.reveal(b.subtitle)}${subtitle("scale-to-zero is impossible without a sub-minute cold start — and it hides in p99, not the mean")}</g>
    <g opacity="0">${ctx.reveal(ctx.paced(5.0, 6.4))}${focal(X1, G.titleY + 3, "½ TB", "to move into VRAM", P.warn)}</g>
    <g opacity="0">${ctx.reveal(b.structure)}
      ${rule(x0, y - amp * 0.84, x1, y - amp * 0.84, P.warn, 1, "5 4")}
      ${type(TYPE.label, x1, y - amp * 0.84 - 8, "p95 slo", { anchor: "end", fill: P.warn })}
    </g>
    <path d="${path}" fill="none" stroke="${P.warn}" stroke-width="2.4" stroke-linejoin="round" stroke-dasharray="800" stroke-dashoffset="800" filter="url(#glow)">
      ${ctx.at("stroke-dashoffset", 800, [[b.action, 800], [b.actionEnd, 0]])}
    </path>
    <g opacity="0">${ctx.reveal(b.structure)}${rowLabel(420, "replicas", P.bright)}</g>
    ${pods}
    <g opacity="0">${ctx.reveal(b.actionEnd - 0.8)}
      ${type(TYPE.datum, X + 150, 423, "the bottleneck is not scheduling — it is moving weights", { fill: P.signal })}
    </g>
    <g opacity="0">${ctx.reveal(b.caption)}${caption("a memory constraint wearing a latency costume — averages will never show it to you")}</g>
    <g opacity="0">${ctx.reveal(b.caption + 0.45)}${takeaway("scale-to-zero went live only once weight load fit inside the p99 budget")}</g>`;
};

export const SCENES = [
  { id: "roofline", provenance: "schematic", render: roofline },
  { id: "tensor-core-dark", provenance: "schematic", render: tensorCoreDark },
  { id: "knee", provenance: "schematic", render: knee },
  { id: "boundary", provenance: "schematic", render: boundary },
  { id: "self-filling-cache", provenance: "schematic", render: selfFillingCache },
  { id: "moe-dispatch", provenance: pending(measured.moeServe.oracle) ? "unverified" : "measured", render: moeDispatch },
  { id: "grouped-gemm", provenance: pending(measured.groupedGemm.finalPercent) ? "unverified" : "measured", render: groupedGemm },
  { id: "determinism", provenance: pending(measured.determinism.bitwiseResult) ? "unverified" : "measured", render: determinism },
  { id: "super-weight", provenance: "schematic", render: superWeight },
  { id: "attention-crossover", provenance: "schematic", render: attentionCrossover },
  { id: "cold-start", provenance: "schematic", render: coldStart },
];
