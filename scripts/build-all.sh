#!/usr/bin/env bash
# Renders both heroes plus one standalone SVG per plate for the README gallery.
set -euo pipefail
cd "$(dirname "$0")/.."

node scripts/telemetry.mjs
HERO_SET=inference HERO_SEED="${HERO_SEED:-1}" node scripts/hero.mjs
HERO_SET=agents    HERO_SEED="${HERO_SEED:-1}" node scripts/hero.mjs

mkdir -p assets/plates
for set in inference agents; do
  for id in $(HERO_SET=$set node -e '
    const m = process.env.HERO_SET === "agents" ? "./scripts/lib/scenes-agents.mjs" : "./scripts/lib/scenes.mjs";
    import(m).then(({SCENES}) => console.log(SCENES.map(s => s.id).join(" ")));
  '); do
    HERO_SET=$set HERO_ONLY="$id" node scripts/hero.mjs >/dev/null
  done
done
node scripts/lint-svg.mjs --no-overlap assets/hero.svg assets/hero-agents.svg
node scripts/lint-svg.mjs assets/plates/*.svg
echo "plates: $(ls assets/plates | wc -l | tr -d ' ')"
