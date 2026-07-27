// Geometry guard for the generated plates.
//
// Every coordinate in this project is placed by hand, and hand-placed
// coordinates drift outside the margins silently — the plate still renders,
// it just runs off the edge. This walks the emitted SVG, works out the
// horizontal extent of every drawable (including the positions it animates
// through) and fails the build on anything outside the content box.

import { readFileSync } from "node:fs";

const W = 900;
const SAFE_LEFT = 44;
const SAFE_RIGHT = 856;

// Monospace advance is ~0.6em; the serif nameplate is looser but only used once.
const advance = (family, size) => (family.includes("serif") ? 0.56 : 0.6) * size;

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\b${name}="([^"]*)"`));
  return m ? m[1] : null;
};
const num = (tag, name, fallback) => {
  const v = attr(tag, name);
  const n = v === null ? NaN : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// Positions an element passes through, not just where it starts.
const animatedValues = (block, name) => {
  const out = [];
  const re = new RegExp(`<animate[^>]*attributeName="${name}"[^>]*values="([^"]*)"`, "g");
  let m;
  while ((m = re.exec(block))) {
    for (const v of m[1].split(";")) {
      const n = Number(v.trim());
      if (Number.isFinite(n)) out.push(n);
    }
  }
  return out;
};

const check = (file, withOverlap) => {
  const svg = readFileSync(file, "utf8");
  const problems = [];
  const note = (kind, left, right, detail) => {
    if (left < SAFE_LEFT - 0.5 || right > SAFE_RIGHT + 0.5) {
      problems.push({ kind, left: Math.round(left), right: Math.round(right), detail });
    }
  };

  // rects, including any x they animate to
  for (const m of svg.matchAll(/<rect\b[^>]*?(?:\/>|>([\s\S]*?)<\/rect>)/g)) {
    const tag = m[0];
    const w = num(tag, "width", 0);
    if (w >= W - 4) continue; // full-bleed panel background
    const xs = [num(tag, "x", 0), ...animatedValues(tag, "x")];
    const widths = [w, ...animatedValues(tag, "width")];
    note("rect", Math.min(...xs), Math.max(...xs) + Math.max(...widths), tag.slice(0, 70));
  }

  for (const m of svg.matchAll(/<circle\b[^>]*?(?:\/>|>([\s\S]*?)<\/circle>)/g)) {
    const tag = m[0];
    const r = num(tag, "r", 0);
    const xs = [num(tag, "cx", 0), ...animatedValues(tag, "cx")];
    note("circle", Math.min(...xs) - r, Math.max(...xs) + r, tag.slice(0, 70));
  }

  for (const m of svg.matchAll(/<line\b[^>]*\/>/g)) {
    const tag = m[0];
    const xs = [num(tag, "x1", 0), num(tag, "x2", 0)];
    note("line", Math.min(...xs), Math.max(...xs), tag.slice(0, 70));
  }

  for (const m of svg.matchAll(/<text\b[^>]*?>([\s\S]*?)<\/text>/g)) {
    const tag = m[0];
    const body = m[1].replace(/<[^>]*>/g, "").trim();
    if (!body) continue;
    const size = num(tag, "font-size", 10);
    const ls = num(tag, "letter-spacing", 0);
    const family = attr(tag, "font-family") ?? "monospace";
    const width = body.length * (advance(family, size) + ls);
    const anchor = attr(tag, "text-anchor") ?? "start";
    const xs = [num(tag, "x", 0), ...animatedValues(tag, "x")];
    for (const x of xs) {
      const left = anchor === "end" ? x - width : anchor === "middle" ? x - width / 2 : x;
      note("text", left, left + width, JSON.stringify(body.slice(0, 46)));
    }
  }

  for (const m of svg.matchAll(/<path\b[^>]*\bd="([^"]*)"/g)) {
    const d = m[1];
    const coords = [...d.matchAll(/[MLCQ]\s*(-?[\d.]+)[ ,](-?[\d.]+)(?:[ ,](-?[\d.]+)[ ,](-?[\d.]+))?(?:[ ,](-?[\d.]+)[ ,](-?[\d.]+))?/g)];
    const xs = coords.flatMap((c) => [c[1], c[3], c[5]].filter(Boolean).map(Number));
    if (!xs.length) continue;
    // The two decorative highlights use an H command and deliberately span the
    // full panel; nothing else in the project does.
    if (/\bH\d/.test(d)) continue;
    note("path", Math.min(...xs), Math.max(...xs), d.slice(0, 60));
  }

  // Two labels sharing a baseline is the defect that kept recurring: it never
  // breaks the margin, it just prints one string on top of another. Only valid
  // on single-plate files — in a hero every plate reuses the same baselines.
  if (!withOverlap) return problems;
  const lines = new Map();
  for (const m of svg.matchAll(/<text\b[^>]*?>([\s\S]*?)<\/text>/g)) {
    const tag = m[0];
    const body = m[1].replace(/<[^>]*>/g, "").trim();
    if (!body) continue;
    const y = Math.round(num(tag, "y", 0));
    const size = num(tag, "font-size", 10);
    const ls = num(tag, "letter-spacing", 0);
    const family = attr(tag, "font-family") ?? "monospace";
    const width = body.length * (advance(family, size) + ls);
    const anchor = attr(tag, "text-anchor") ?? "start";
    const x = num(tag, "x", 0);
    const left = anchor === "end" ? x - width : anchor === "middle" ? x - width / 2 : x;
    for (const key of [y - 1, y, y + 1]) {
      if (!lines.has(key)) lines.set(key, []);
    }
    const slot = attr(tag, "data-slot");
    lines.get(y).push({ left, right: left + width, body, slot });
  }
  for (const [y, items] of lines) {
    const sorted = [...items].sort((a, b) => a.left - b.left);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1], cur = sorted[i];
      if (cur.slot && cur.slot === prev.slot) continue; // same slot, different frame
      if (cur.left < prev.right - 2) {
        problems.push({
          kind: "overlap",
          left: Math.round(cur.left),
          right: Math.round(prev.right),
          detail: `y=${y}  ${JSON.stringify(prev.body.slice(0, 22))} / ${JSON.stringify(cur.body.slice(0, 22))}`,
        });
      }
    }
  }

  return problems;
};

const args = process.argv.slice(2);
const files = args.filter((a) => !a.startsWith("--"));
const withOverlap = !args.includes("--no-overlap");
if (!files.length) throw new Error("usage: node scripts/lint-svg.mjs <file.svg> [...]");

let failed = 0;
for (const file of files) {
  const problems = check(file, withOverlap);
  if (!problems.length) continue;
  failed += problems.length;
  console.error(`\n${file}`);
  for (const p of problems) {
    console.error(`  ${p.kind.padEnd(7)} [${String(p.left).padStart(5)} .. ${String(p.right).padStart(5)}]  ${p.detail}`);
  }
}

if (failed) {
  console.error(`\n${failed} element(s) outside the content box [${SAFE_LEFT}, ${SAFE_RIGHT}]`);
  process.exit(1);
}
console.log(`geometry ok — ${files.length} file(s) inside [${SAFE_LEFT}, ${SAFE_RIGHT}]`);
