// Design system and timing primitives for the hero.
//
// Aesthetic: an engraved instrument plate. A serif nameplate sits over
// monospace technical content; surfaces are lit from above; one accent carries
// meaning per scene and everything else falls into a neutral ramp. The type
// scale is deliberate — the old version rendered everything at 8-11px, which
// is why it read as a spreadsheet instead of a designed object.

export const SCENE_SECONDS = 18.0;
export const FADE = 0.9;

export const BEAT = {
  title: 0.3,
  subtitle: 1.2,
  structure: 2.0,
  action: 3.4,
  actionEnd: 12.4,
  caption: 13.0,
  hold: 17.2,
};

// Canvas and rhythm. Everything is a multiple of 4; margins are generous
// because the previous layout crowded all four edges.
export const W = 900;
export const H = 540;
export const M = 56;

export const GRID = {
  labelX: 128,
  contentX: 148,
  contentX1: W - M,
  titleY: 168,
  subtitleY: 189,
  bodyTop: 212,
  bodyBottom: 452,
  captionY: 478,
  takeawayY: 498,
};

export const BAND = { x0: M, x1: W - M, titleY: GRID.titleY };

// A tight, disciplined palette. Two accents may appear together; never three.
export const PALETTE = {
  ink: "#070910",
  surface: "#0d1017",
  raised: "#151a23",
  rule: "#1e242e",
  ruleSoft: "#161b24",
  dim: "#4d5766",
  body: "#97a1af",
  bright: "#e8edf4",
  signal: "#4ade9a",
  signalDeep: "#1f7a52",
  warn: "#f0b429",
  warnDeep: "#8a6417",
  cool: "#7aa2f7",
  coolDeep: "#2c4a86",
};

const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
const SERIF = "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, 'Times New Roman', serif";

export const FONT = { mono: MONO, serif: SERIF };

// Type scale. Each step exists for a reason; there are no in-between sizes.
export const TYPE = {
  display: { size: 46, ls: 11, weight: 400, family: SERIF, fill: PALETTE.bright },
  eyebrow: { size: 10, ls: 5.4, weight: 500, family: MONO, fill: PALETTE.cool },
  lede: { size: 12, ls: 0.2, weight: 400, family: MONO, fill: PALETTE.body },
  sceneTitle: { size: 15, ls: 2.2, weight: 500, family: MONO, fill: PALETTE.bright },
  subtitle: { size: 11, ls: 0.1, weight: 400, family: MONO, fill: PALETTE.body },
  value: { size: 21, ls: 0.4, weight: 700, family: MONO, fill: PALETTE.bright },
  label: { size: 9.5, ls: 1.4, weight: 400, family: MONO, fill: PALETTE.dim },
  datum: { size: 10.5, ls: 0.2, weight: 400, family: MONO, fill: PALETTE.body },
  caption: { size: 10.5, ls: 0.1, weight: 400, family: MONO, fill: PALETTE.dim },
  takeaway: { size: 11.5, ls: 0.1, weight: 500, family: MONO, fill: PALETTE.signal },
};

export const esc = (t) =>
  String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const normalize = (stops, cycle) => {
  const sorted = stops
    .map(([t, v]) => [clamp(Number(t), 0, cycle), v])
    .sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const [t, v] of sorted) {
    if (out.length && Math.abs(out[out.length - 1][0] - t) < 1e-6) out[out.length - 1] = [t, v];
    else out.push([t, v]);
  }
  if (out[0][0] > 0) out.unshift([0, out[0][1]]);
  if (out[out.length - 1][0] < cycle) out.push([cycle, out[out.length - 1][1]]);
  return out;
};

export const makeAnim = (cycle) => (attr, stops, extra) => {
  const norm = normalize(stops, cycle);
  return `<animate attributeName="${attr}" dur="${cycle}s" repeatCount="indefinite" keyTimes="${norm.map((s) => (s[0] / cycle).toFixed(5)).join(";")}" values="${norm.map((s) => s[1]).join(";")}"${extra ? ` ${extra}` : ""}/>`;
};

export const makeContext = (index, cycle) => {
  const anim = makeAnim(cycle);
  const base = index * SCENE_SECONDS;
  const span = SCENE_SECONDS;

  const at = (attr, rest, stops) => {
    const inside = stops.map(([t, v]) => [base + clamp(t, 0, span), v]);
    const last = inside[inside.length - 1][1];
    // Hold the final value to the end of the scene, then snap back on the last
    // frame. Interpolating straight to `rest` would drain every element away
    // the moment it finished appearing.
    return anim(attr, [
      [0, rest], [base, rest], ...inside,
      [base + span - 0.02, last], [base + span, rest], [cycle, rest],
    ]);
  };

  const paced = (i, count) =>
    BEAT.action + ((BEAT.actionEnd - BEAT.action) * i) / Math.max(1, count);

  const reveal = (t, from) => at("opacity", from ?? 0, [[t - 0.3, from ?? 0], [t, 1]]);

  const enter = (body) => `<g opacity="0">
    ${anim("opacity", [
      [0, 0], [base, 0], [base + FADE, 1],
      [base + span - FADE, 1], [base + span, 0], [cycle, 0],
    ])}
    ${body}
  </g>`;

  return { at, enter, anim, base, span, paced, reveal, beat: BEAT };
};

// --- type -------------------------------------------------------------------

export const type = (style, x, y, body, over) => {
  const s = { ...style, ...(over ?? {}) };
  const anchor = s.anchor ? ` text-anchor="${s.anchor}"` : "";
  const slot = s.slot ? ` data-slot="${s.slot}"` : "";
  return `<text${slot} x="${x}" y="${y}" font-family="${s.family}" font-size="${s.size}" letter-spacing="${s.ls}" font-weight="${s.weight}" fill="${s.fill}"${anchor}>${esc(body)}</text>`;
};

export const sceneTitle = (body) => type(TYPE.sceneTitle, M, GRID.titleY, body);
export const subtitle = (body) => type(TYPE.subtitle, M, GRID.subtitleY, body);
export const caption = (body) => type(TYPE.caption, M, GRID.captionY, body);

// The line that turns a diagram into a claim. The plate above states how a
// mechanism behaves; this states what its owner decided to do about it. Without
// it every plate reads like a lecture.
export const takeaway = (body) =>
  type(TYPE.takeaway, M, GRID.takeawayY, `\u2192  ${body}`);

export const rowLabel = (y, body, fill) =>
  type(TYPE.label, GRID.labelX, y + 3.5, body, { anchor: "end", fill: fill ?? PALETTE.dim });

// The one thing the eye should land on in a plate. Value and unit stack
// flush-right against the same edge, so the unit can never push past the
// margin no matter how long the number is.
export const focal = (x, y, value, unit, accent, slot) => `<g>
  ${type(TYPE.value, x, y, value, { anchor: "end", fill: accent, slot })}
  ${unit ? type(TYPE.label, x, y + 17, unit, { anchor: "end", slot }) : ""}
</g>`;

export const readout = (body, accent) =>
  type(TYPE.datum, GRID.contentX1, GRID.titleY - 1, body, { anchor: "end", fill: accent, ls: 1.2 });

// --- surfaces ---------------------------------------------------------------

// A raised surface: vertical gradient body plus a 1px top highlight, which is
// what makes a rectangle read as a lit object rather than a flat fill.
export const plate = (x, y, w, h, rx) => `<g>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx ?? 7}" fill="url(#plateFill)" stroke="${PALETTE.rule}"/>
  <path d="M${x + (rx ?? 7)} ${y + 0.5} H${x + w - (rx ?? 7)}" stroke="#ffffff" stroke-opacity="0.06" stroke-width="1"/>
</g>`;

export const bar = (x, y, w, h, accent, rx) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx ?? 2.5}" fill="${accent}"/>`;

export const track = (x, y, w, h, rx) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx ?? 2.5}" fill="${PALETTE.raised}" stroke="${PALETTE.ruleSoft}"/>`;

export const hairline = (x1, y, x2, stroke, dash) =>
  `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${stroke ?? PALETTE.rule}" stroke-width="1"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;

export const rule = (x1, y1, x2, y2, stroke, width, dash) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width ?? 1}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;

export const dot = (cx, cy, r, fill) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;

export const arrow = (x1, y, x2, stroke) => {
  const dir = x2 > x1 ? -1 : 1;
  return `<g stroke="${stroke}" fill="${stroke}">
    ${rule(x1, y, x2 + dir * 6, y, stroke, 1.2)}
    <path d="M${x2} ${y} L${x2 + dir * 7} ${y - 3.6} L${x2 + dir * 7} ${y + 3.6} Z" stroke="none"/>
  </g>`;
};

export const shuffle = (items, seed) => {
  let state = (seed >>> 0) || 1;
  const next = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};
