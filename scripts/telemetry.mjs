// Renders assets/telemetry.svg from the live GitHub contribution calendar.
// Self-hosted: no third-party card service, no rate limits, no broken images.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const API = "https://api.github.com/graphql";

const QUERY = `
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount } }
      }
    }
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC) {
      totalCount
      nodes { primaryLanguage { name color } }
    }
  }
}`;

const fetchProfile = async (login, token) => {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      authorization: `bearer ${token}`,
      "content-type": "application/json",
      "user-agent": "isk4r1ot-profile-telemetry",
    },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });
  if (!res.ok) {
    throw new Error(`GitHub GraphQL HTTP ${res.status}: ${await res.text()}`);
  }
  const payload = await res.json();
  if (payload.errors) {
    throw new Error(`GitHub GraphQL errors: ${JSON.stringify(payload.errors)}`);
  }
  return payload.data.user;
};

const toDays = (calendar) =>
  calendar.weeks.flatMap((week) =>
    week.contributionDays.map((day) => ({ date: day.date, count: day.contributionCount })),
  );

const weeklyTotals = (calendar) =>
  calendar.weeks.map((week) =>
    week.contributionDays.reduce((sum, day) => sum + day.contributionCount, 0),
  );

// Counted per repository, not per byte: a Rust systems tool and a large
// TypeScript app are one project each, which is what a portfolio shows.
const topLanguages = (repositories, limit) => {
  const totals = new Map();
  for (const repo of repositories.nodes) {
    if (!repo.primaryLanguage) continue;
    const current = totals.get(repo.primaryLanguage.name);
    totals.set(repo.primaryLanguage.name, {
      count: (current ? current.count : 0) + 1,
      color: repo.primaryLanguage.color,
    });
  }
  const ranked = [...totals.entries()]
    .map(([name, value]) => ({ name, count: value.count, color: value.color }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  const sum = ranked.reduce((acc, lang) => acc + lang.count, 0);
  if (sum === 0) {
    throw new Error("No primary languages returned for public repositories");
  }
  return ranked.map((lang) => ({ ...lang, share: lang.count / sum }));
};

const esc = (text) =>
  String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const renderBars = (totals, x0, x1, yBase, height) => {
  const peak = Math.max(...totals);
  if (peak === 0) throw new Error("Contribution calendar is empty");
  const slot = (x1 - x0) / totals.length;
  const width = Math.max(2, slot - 2.2);
  return totals
    .map((value, index) => {
      const h = Math.max(1.5, (value / peak) * height);
      const x = (x0 + index * slot).toFixed(1);
      const y = (yBase - h).toFixed(1);
      const delay = (0.35 + index * 0.018).toFixed(3);
      const shade = value === 0 ? "#21262d" : value >= peak * 0.6 ? "#3fb950" : "#238636";
      // Base attributes hold the FINAL state, so the chart is still correct
      // if a renderer ignores SMIL. The animation only replays the growth.
      return `<rect x="${x}" y="${y}" width="${width.toFixed(1)}" height="${h.toFixed(1)}" rx="1" fill="${shade}">
        <animate attributeName="height" values="0;${h.toFixed(1)}" dur="0.55s" begin="${delay}s" fill="freeze"/>
        <animate attributeName="y" values="${yBase};${y}" dur="0.55s" begin="${delay}s" fill="freeze"/>
      </rect>`;
    })
    .join("\n      ");
};

const renderLanguageBar = (languages, x0, x1, y, height) => {
  const span = x1 - x0;
  let cursor = x0;
  const segments = languages
    .map((lang) => {
      const width = lang.share * span;
      const rect = `<rect x="${cursor.toFixed(1)}" y="${y}" width="${width.toFixed(1)}" height="${height}" fill="${lang.color ?? "#8b949e"}" opacity="0.85"/>`;
      cursor += width;
      return rect;
    })
    .join("\n      ");
  const legend = languages
    .map((lang, index) => {
      const lx = x0 + index * 132;
      return `<circle cx="${lx + 4}" cy="${y + height + 16}" r="3.6" fill="${lang.color ?? "#8b949e"}"/>
      <text x="${lx + 14}" y="${y + height + 19.5}" font-size="10.5" fill="#8b949e">${esc(lang.name)} <tspan fill="#484f58">×${esc(lang.count)}</tspan></text>`;
    })
    .join("\n      ");
  return `${segments}\n      ${legend}`;
};

const readout = (x, y, label, value, accent) => `
    <text x="${x}" y="${y}" font-size="9.5" letter-spacing="1.6" fill="#484f58">${esc(label)}</text>
    <text x="${x}" y="${y + 26}" font-size="25" font-weight="700" fill="${accent}">${esc(value)}</text>`;

const buildSvg = (user) => {
  const calendar = user.contributionsCollection.contributionCalendar;
  const days = toDays(calendar);
  const totals = weeklyTotals(calendar);
  const languages = topLanguages(user.repositories, 5);

  const peakDay = days.reduce((best, day) => (day.count > best.count ? day : best), days[0]);
  const peakWeek = Math.max(...totals);
  const from = days[0].date;
  const to = days[days.length - 1].date;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="290" viewBox="0 0 900 290" role="img" aria-label="Contribution telemetry">
  <title>Contribution telemetry — ${esc(calendar.totalContributions)} contributions, ${esc(from)} to ${esc(to)}</title>
  <defs>
    <pattern id="tgrid" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M30 0 L0 0 0 30" fill="none" stroke="#161b22" stroke-width="1"/>
    </pattern>
  </defs>
  <rect x="0.5" y="0.5" width="899" height="289" rx="10" fill="#0d1117" stroke="#30363d"/>
  <rect x="1" y="1" width="898" height="288" rx="10" fill="url(#tgrid)" opacity="0.9"/>

  <g font-family="ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace">
    <text x="44" y="42" font-size="11" letter-spacing="2.4" fill="#8b949e">CONTRIBUTION TELEMETRY</text>
    <text x="856" y="42" text-anchor="end" font-size="10" letter-spacing="1.2" fill="#484f58">${esc(from)} → ${esc(to)}</text>
    <line x1="44" y1="54" x2="856" y2="54" stroke="#21262d"/>

    <!-- weekly contribution bars -->
    <g>
      ${renderBars(totals, 44, 612, 178, 96)}
    </g>
    <line x1="44" y1="178" x2="612" y2="178" stroke="#30363d"/>
    <text x="44" y="196" font-size="9" letter-spacing="1.4" fill="#484f58">52 WEEKS</text>
    <text x="612" y="196" text-anchor="end" font-size="9" letter-spacing="1.4" fill="#484f58">PEAK ${esc(Math.max(...totals))}/wk</text>

    <!-- readouts -->
    <line x1="648" y1="70" x2="648" y2="196" stroke="#21262d"/>
    ${readout(676, 84, "CONTRIBUTIONS", calendar.totalContributions, "#3fb950")}
    ${readout(676, 140, "PUBLIC REPOS", user.repositories.totalCount, "#58a6ff")}
    ${readout(790, 84, "BEST DAY", peakDay.count, "#d29922")}
    ${readout(790, 140, "PEAK WEEK", peakWeek, "#e6edf3")}

    <!-- language distribution -->
    <text x="44" y="228" font-size="9.5" letter-spacing="1.8" fill="#484f58">SHIPPED IN PUBLIC — BY PRIMARY LANGUAGE</text>
    <g>
      ${renderLanguageBar(languages, 44, 856, 236, 10)}
    </g>
  </g>
</svg>
`;
};

const main = async () => {
  const login = process.env.PROFILE_LOGIN;
  const token = process.env.GITHUB_TOKEN;
  if (!login) throw new Error("PROFILE_LOGIN is required");
  if (!token) throw new Error("GITHUB_TOKEN is required");

  const user = await fetchProfile(login, token);
  const svg = buildSvg(user);
  const target = "assets/telemetry.svg";
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, svg, "utf8");
  console.log(`wrote ${target} (${svg.length} bytes)`);
};

await main();
