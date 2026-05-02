/**
 * NK Celje first team — generated from data/scouting.db.
 *
 * To refresh after a scout run:
 *   1. cd ../nkcelje-scout && python scripts/collect_celje.py --per-match
 *   2. cd ../nkcelje && npm run db:players
 *   3. git add src/data/players.generated.ts data/scouting.db && git commit && git push
 *
 * Source pipeline: Sofascore API + transfermarkt-api → SQLite (data/scouting.db)
 *                  → scripts/build-players.ts → players.generated.ts
 *
 * No fictional values: every field is sourced from the API responses.
 * Where data is unavailable (e.g. pace — Sofascore has no direct sprint metric),
 * the field is set to 0.
 */
export { PLAYERS, getPlayerById } from "./players.generated";
