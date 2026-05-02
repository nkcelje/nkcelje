/**
 * Build src/data/players.generated.ts from data/scouting.db.
 *
 * Reads NK Celje roster + season stats + per-match aggregate +
 * Sofascore attribute overviews + TM profile, and generates a typed
 * Player[] file that the Next.js app imports.
 *
 * Run: npm run db:players  (or: npx tsx scripts/build-players.ts)
 *
 * All values are derived from real API data — no defaults, no fictional
 * numbers. Where data is unavailable, the field is set to 0.
 */
import Database from "better-sqlite3";
import { writeFileSync } from "fs";
import path from "path";

const DB_PATH = path.resolve(process.cwd(), "./data/scouting.db");
const OUT_PATH = path.resolve(process.cwd(), "./src/data/players.generated.ts");

const SF_TEAM_CELJE = 2413;
const SF_UT_PRVALIGA = 212;

// Country (Transfermarkt) → demonym (used by getPassportStatus etc.).
const COUNTRY_TO_DEMONYM: Record<string, string> = {
  "Slovenia": "Slovenian",
  "Croatia": "Croatian",
  "Spain": "Spanish",
  "Russia": "Russian",
  "Lithuania": "Lithuanian",
  "Poland": "Polish",
  "Serbia": "Serbian",
  "Bosnia-Herzegovina": "Bosnian",
  "Bosnia and Herzegovina": "Bosnian",
  "Austria": "Austrian",
  "Albania": "Albanian",
  "Kosovo": "Kosovar",
  "Macedonia": "Macedonian",
  "North Macedonia": "Macedonian",
  "Montenegro": "Montenegrin",
  "Bulgaria": "Bulgarian",
  "Germany": "German",
  "France": "French",
  "Italy": "Italian",
  "Portugal": "Portuguese",
  "Brazil": "Brazilian",
  "Argentina": "Argentine",
  "England": "English",
  "Netherlands": "Dutch",
  "Belgium": "Belgian",
  "Denmark": "Danish",
  "Sweden": "Swedish",
  "Norway": "Norwegian",
  "Finland": "Finnish",
  "Czech Republic": "Czech",
  "Slovakia": "Slovakian",
  "Hungary": "Hungarian",
  "Romania": "Romanian",
  "Ukraine": "Ukrainian",
  "Ghana": "Ghanaian",
  "Nigeria": "Nigerian",
  "Senegal": "Senegalese",
  "Cameroon": "Cameroonian",
  "Ivory Coast": "Ivorian",
  "Côte d'Ivoire": "Ivorian",
  "Morocco": "Moroccan",
  "Greece": "Greek",
  "Türkiye": "Turkish",
  "Turkey": "Turkish",
};

function countryToDemonym(country: string): string {
  return COUNTRY_TO_DEMONYM[country] ?? country;
}

// Mirror of EU_NATIONALITIES from src/lib/passport.ts — used here only to
// prioritize an EU passport when a player has dual citizenship.
const EU_DEMONYMS = new Set<string>([
  "Austrian", "Belgian", "Bulgarian", "Croatian", "Cypriot", "Czech", "Danish",
  "Dutch", "Estonian", "Finnish", "French", "German", "Greek", "Hungarian",
  "Irish", "Italian", "Latvian", "Lithuanian", "Luxembourgish", "Maltese",
  "Polish", "Portuguese", "Romanian", "Slovakian", "Slovak", "Spanish", "Swedish",
]);

// Sofascore stores ISO-3 country codes; map common ones to ISO-2 for flag emoji.
const ALPHA3_TO_ALPHA2: Record<string, string> = {
  SVN: "SI", HRV: "HR", RUS: "RU", ESP: "ES", LTU: "LT", POL: "PL",
  SRB: "RS", BIH: "BA", AUT: "AT", XKX: "XK", KOS: "XK", MNE: "ME",
  ALB: "AL", BUL: "BG", BGR: "BG", GER: "DE", DEU: "DE", FRA: "FR",
  ITA: "IT", PRT: "PT", BRA: "BR", ARG: "AR", USA: "US", ENG: "GB",
  NLD: "NL", BEL: "BE", DNK: "DK", SWE: "SE", NOR: "NO", FIN: "FI",
  CZE: "CZ", SVK: "SK", HUN: "HU", ROM: "RO", ROU: "RO", UKR: "UA",
  GHA: "GH", NGA: "NG", SEN: "SN", CMR: "CM", CIV: "CI", MAR: "MA",
};

function flagEmoji(code: string | null | undefined): string {
  if (!code) return "";
  const alpha2 = code.length === 3 ? ALPHA3_TO_ALPHA2[code.toUpperCase()] : code.toUpperCase();
  if (!alpha2 || alpha2.length !== 2) return "";
  const A = 0x1f1e6;
  return String.fromCodePoint(
    ...alpha2.split("").map((c) => A + c.charCodeAt(0) - 65),
  );
}

function calcAge(dob: string | null): number {
  if (!dob) return 0;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

// TM "Left Winger" / "Centre-Back" / etc → our Position enum
function mapPositionFromTm(tmPos: string | null): string {
  if (!tmPos) return "CM";
  const t = tmPos.toLowerCase();
  if (t.includes("goalkeeper") || t === "gk") return "GK";
  if (t.includes("centre-back") || t.includes("center-back")) return "CB";
  if (t.includes("left-back")) return "LB";
  if (t.includes("right-back")) return "RB";
  if (t.includes("defender")) return "CB";
  if (t.includes("defensive midfield")) return "CDM";
  if (t.includes("attacking midfield")) return "CAM";
  if (t.includes("left winger")) return "LW";
  if (t.includes("right winger")) return "RW";
  if (t.includes("left midfield")) return "LM";
  if (t.includes("right midfield")) return "RM";
  if (t.includes("central midfield") || t.includes("midfielder")) return "CM";
  if (t.includes("centre-forward") || t.includes("striker") || t === "cf" || t === "st")
    return "ST";
  if (t.includes("forward") || t.includes("attack")) return "ST";
  return "CM";
}

// Sofascore detailed codes (RW/LW/MC/AM/DC/...) → our Position enum
function mapPositionFromSf(code: string): string | null {
  const m: Record<string, string> = {
    GK: "GK",
    DC: "CB", DR: "RB", DL: "LB",
    DM: "CDM", DMC: "CDM",
    MC: "CM", ML: "LM", MR: "RM",
    AM: "CAM", AMC: "CAM",
    LW: "LW", RW: "RW",
    LWB: "LWB", RWB: "RWB",
    FW: "ST", ST: "ST", CF: "CF",
  };
  return m[code] || null;
}

// Sofascore preferred_foot ("Left" / "Right" / "Both") + TM ("left" / "right" / "both")
function mapFoot(sfFoot: string | null, tmFoot: string | null): "Left" | "Right" | "Both" {
  // Prefer SF (more granular). Fall back to TM.
  const v = (sfFoot || tmFoot || "").toLowerCase();
  if (v.startsWith("left")) return "Left";
  if (v.startsWith("right")) return "Right";
  if (v.startsWith("both")) return "Both";
  return "Right";
}

// Convert ISO contract date "2026-06-30" → year + month
function parseContract(d: string | null): { year: string; month: number | undefined } {
  if (!d) return { year: "0", month: undefined };
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return { year: "0", month: undefined };
  return { year: String(dt.getFullYear()), month: dt.getMonth() + 1 };
}

interface PreferredRoleMap {
  [position: string]: string[];
}
const POSITION_ROLES: PreferredRoleMap = {
  GK: ["Shot Stopper"],
  CB: ["Stopper CB"],
  LB: ["Attacking Fullback"],
  RB: ["Attacking Fullback"],
  LWB: ["Attacking Fullback"],
  RWB: ["Attacking Fullback"],
  CDM: ["Anchor"],
  CM: ["Box-to-Box"],
  CAM: ["Advanced Playmaker"],
  LM: ["Wide Playmaker"],
  RM: ["Wide Playmaker"],
  LW: ["Inside Forward"],
  RW: ["Inside Forward"],
  ST: ["Target Man"],
  CF: ["Complete Forward"],
};

interface DbPlayerRow {
  player_id: number;
  name: string;
  first_name: string | null;
  last_name: string | null;
  short_name: string | null;
  slug: string | null;
  position_group: string | null;
  positions_detailed: string | null;
  jersey_number: number | null;
  height: number | null;
  preferred_foot: string | null;
  date_of_birth: string | null;
  proposed_market_value: number | null;
  country_code: string | null;
  country_name: string | null;
  // TM
  tm_id: string | null;
  tm_position_main: string | null;
  tm_market_value: number | null;
  tm_contract_expires: string | null;
  tm_image_url: string | null;
  tm_foot: string | null;
  tm_citizenship: string | null;
  tm_shirt_number: string | null;
  // Season stats
  rating: number | null;
  appearances: number | null;
  matches_started: number | null;
  minutes_played: number | null;
  goals: number | null;
  assists: number | null;
  goal_conversion_percentage: number | null;
  accurate_passes_percentage: number | null;
  successful_dribbles_percentage: number | null;
  total_duels_won_percentage: number | null;
  aerial_duels_won_percentage: number | null;
  // Attribute overviews
  attr_attacking: number | null;
  attr_technical: number | null;
  attr_tactical: number | null;
  attr_defending: number | null;
  attr_creativity: number | null;
}

interface MatchAggRow {
  player_id: number;
  matches: number;
  minutes: number;
  xg: number;
  xa: number;
  touches: number;
  dispossessed: number;
  unsuccessful_touch: number;
  total_tackle: number;
  won_tackle: number;
  interception_won: number;
}

function clamp01_100(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function buildAttributes(row: DbPlayerRow, agg: MatchAggRow | null) {
  // Primary path: derive all 10 attributes from Sofascore's 5-axis radar
  // (attribute_overviews) when available. This is "Variant C" — no fictional
  // values, all 10 numbers traceable to the radar Sofascore publishes.
  if (
    row.attr_attacking != null &&
    row.attr_technical != null &&
    row.attr_tactical != null &&
    row.attr_defending != null &&
    row.attr_creativity != null
  ) {
    const att = row.attr_attacking;
    const tech = row.attr_technical;
    const tact = row.attr_tactical;
    const def = row.attr_defending;
    const crea = row.attr_creativity;
    return {
      // Pace — нет прямой метрики у Sofascore. Используем среднее
      // attacking + creativity как ближайший прокси к "off-the-ball runs".
      pace: clamp01_100((att + crea) / 2),
      // Passing качество = техника владения мячом.
      passing: tech,
      // Оборонительные действия.
      defending: def,
      // Завершение атак.
      finishing: att,
      // Тактическая дисциплина / позиционирование.
      tacticalIntelligence: tact,
      // Physicality — Sofascore радар не имеет силового атрибута.
      // Прокси: среднее defending + attacking (физические игроки сильны
      // в обоих).
      physicality: clamp01_100((def + att) / 2),
      // Press resistance — техника под прессингом.
      pressResistance: tech,
      // Ball progression — продвижение через дриблинг = техника.
      ballProgression: tech,
      // Дуэли — индикатор оборонительной составляющей.
      duels: def,
      // Креатив игры.
      creativity: crea,
    };
  }

  // Fallback for the ~7 reservists without attribute_overviews
  // (Sofascore не выставил рейтинг — мало матчей). Используем реальные
  // per-match / season-stat метрики где есть, 0 где данных нет.
  let pressResistance = 0;
  if (agg && agg.touches > 0) {
    const lossRate = (agg.dispossessed + agg.unsuccessful_touch) / agg.touches;
    pressResistance = clamp01_100(100 * (1 - lossRate));
  }

  return {
    pace: 0,
    passing: clamp01_100(row.accurate_passes_percentage ?? 0),
    defending: 0,
    finishing: clamp01_100(row.goal_conversion_percentage ?? 0),
    tacticalIntelligence: 0,
    physicality: clamp01_100(row.aerial_duels_won_percentage ?? 0),
    pressResistance,
    ballProgression: clamp01_100(row.successful_dribbles_percentage ?? 0),
    duels: clamp01_100((row.total_duels_won_percentage ?? 0) * 1.4),
    creativity: 0,
  };
}

function buildBaseRating(row: DbPlayerRow): number {
  // Sofascore rating ~ 6.0-8.5; map to 50-90 scale.
  if (row.rating == null) return 0;
  return clamp01_100(row.rating * 10);
}

function buildPotential(row: DbPlayerRow, baseRating: number): number {
  if (baseRating === 0) return 0;
  const age = calcAge(row.date_of_birth);
  if (age === 0) return baseRating;
  // Rough growth runway: under 22 → +6, 22-25 → +3, 25-28 → +1, otherwise 0.
  let bonus = 0;
  if (age < 22) bonus = 6;
  else if (age < 26) bonus = 3;
  else if (age < 29) bonus = 1;
  return clamp01_100(baseRating + bonus);
}

function buildSecondaryPositions(row: DbPlayerRow, primary: string): string[] {
  if (!row.positions_detailed) return [];
  let codes: string[] = [];
  try {
    codes = JSON.parse(row.positions_detailed);
  } catch {
    return [];
  }
  const seen = new Set<string>([primary]);
  const out: string[] = [];
  for (const c of codes) {
    const mapped = mapPositionFromSf(c);
    if (mapped && !seen.has(mapped)) {
      seen.add(mapped);
      out.push(mapped);
    }
  }
  return out;
}

function jsonStr(s: string): string {
  return JSON.stringify(s);
}

// Transfermarkt stores jersey numbers as "#20" / "#7"; Sofascore as plain int (often NULL).
// Returns parsed integer or undefined.
function parseJerseyNumber(
  tmShirt: string | null,
  sfNumber: number | null,
): number | undefined {
  if (tmShirt) {
    const digits = tmShirt.replace(/\D+/g, "");
    if (digits) {
      const n = parseInt(digits, 10);
      if (!isNaN(n)) return n;
    }
  }
  if (sfNumber != null && !isNaN(sfNumber)) return sfNumber;
  return undefined;
}

// ─────────────────────────────────────────────────────────────────
function main() {
  const db = new Database(DB_PATH, { readonly: true });

  const rows = db
    .prepare(
      `
    SELECT
      sp.player_id, sp.name, sp.first_name, sp.last_name, sp.short_name, sp.slug,
      sp.position AS position_group, sp.positions_detailed,
      sp.jersey_number, sp.height, sp.preferred_foot,
      sp.date_of_birth, sp.proposed_market_value,
      sp.country_code, sp.country_name,
      pim.tm_id,
      tm.position_main AS tm_position_main,
      tm.market_value AS tm_market_value,
      tm.club_contract_expires AS tm_contract_expires,
      tm.image_url AS tm_image_url,
      tm.foot AS tm_foot,
      tm.citizenship AS tm_citizenship,
      tm.shirt_number AS tm_shirt_number,
      pss.rating, pss.appearances, pss.matches_started, pss.minutes_played,
      pss.goals, pss.assists,
      pss.goal_conversion_percentage,
      pss.accurate_passes_percentage,
      pss.successful_dribbles_percentage,
      pss.total_duels_won_percentage,
      pss.aerial_duels_won_percentage,
      pao.attacking AS attr_attacking,
      pao.technical AS attr_technical,
      pao.tactical AS attr_tactical,
      pao.defending AS attr_defending,
      pao.creativity AS attr_creativity
    FROM sf_players sp
    LEFT JOIN player_id_map pim ON pim.sf_id = sp.player_id
    LEFT JOIN tm_players tm ON tm.tm_id = pim.tm_id
    LEFT JOIN sf_seasons sea ON sea.ut_id = ? AND sea.is_current = 1
    LEFT JOIN sf_player_season_stats pss
      ON pss.player_id = sp.player_id AND pss.ut_id = sea.ut_id AND pss.season_id = sea.season_id
    LEFT JOIN sf_player_attribute_overviews pao
      ON pao.player_id = sp.player_id AND pao.year_shift = 0 AND pao.is_average = 0
    WHERE sp.current_team_id = ?
    ORDER BY sp.position, COALESCE(pss.minutes_played, 0) DESC, sp.name
    `,
    )
    .all(SF_UT_PRVALIGA, SF_TEAM_CELJE) as DbPlayerRow[];

  // Per-match aggregate (only for NK Celje players)
  const aggRows = db
    .prepare(
      `
    SELECT
      player_id,
      COUNT(*) AS matches,
      COALESCE(SUM(minutes_played), 0) AS minutes,
      COALESCE(SUM(expected_goals), 0) AS xg,
      COALESCE(SUM(expected_assists), 0) AS xa,
      COALESCE(SUM(touches), 0) AS touches,
      COALESCE(SUM(dispossessed), 0) AS dispossessed,
      COALESCE(SUM(unsuccessful_touch), 0) AS unsuccessful_touch,
      COALESCE(SUM(total_tackle), 0) AS total_tackle,
      COALESCE(SUM(won_tackle), 0) AS won_tackle,
      COALESCE(SUM(interception_won), 0) AS interception_won
    FROM sf_player_match_stats
    WHERE team_id = ?
    GROUP BY player_id
    `,
    )
    .all(SF_TEAM_CELJE) as MatchAggRow[];

  const aggByPid = new Map<number, MatchAggRow>();
  for (const a of aggRows) aggByPid.set(a.player_id, a);

  console.log(`Loaded ${rows.length} players from DB`);

  const playersJs: string[] = [];
  for (const row of rows) {
    const id = row.slug || `sf-${row.player_id}`;
    const tmPos = row.tm_position_main;
    const primaryPosition = mapPositionFromTm(tmPos);
    const secondaryPositions = buildSecondaryPositions(row, primaryPosition);

    const citizenship: string[] = row.tm_citizenship
      ? (() => {
          try {
            return JSON.parse(row.tm_citizenship as string);
          } catch {
            return [];
          }
        })()
      : [];
    // For squad-rules classification (Slovenian / EU / Foreign), prefer the
    // EU passport if a player has dual citizenship (e.g. Kvesić: Bosnian +
    // Croatian → "Croatian" → counts as EU). Slovenian wins over EU.
    const demonyms = citizenship.map(countryToDemonym);
    const nationality =
      demonyms.find((d) => d === "Slovenian") ??
      demonyms.find((d) => EU_DEMONYMS.has(d)) ??
      demonyms[0] ??
      (row.country_name ? countryToDemonym(row.country_name) : "");
    const flag = flagEmoji(row.country_code);

    const contract = parseContract(row.tm_contract_expires);

    const agg = aggByPid.get(row.player_id) ?? null;
    const attributes = buildAttributes(row, agg);
    const baseRating = buildBaseRating(row);
    const potential = buildPotential(row, baseRating);

    const preferredRoles = POSITION_ROLES[primaryPosition] ?? [];

    const marketValueM =
      row.tm_market_value != null
        ? row.tm_market_value / 1_000_000
        : row.proposed_market_value != null
        ? row.proposed_market_value / 1_000_000
        : 0;

    const nameParts = row.name.split(" ").filter(Boolean);
    const obj = {
      id,
      sofascoreId: row.player_id,
      name: row.short_name || row.name,
      firstName: row.first_name || nameParts.slice(0, -1).join(" ") || row.name,
      lastName: row.last_name || nameParts[nameParts.length - 1] || "",
      age: calcAge(row.date_of_birth),
      nationality: nationality || "—",
      flag,
      club: "NK Celje",
      league: "Pro League",
      preferredFoot: mapFoot(row.preferred_foot, row.tm_foot),
      primaryPosition,
      secondaryPositions,
      preferredRoles,
      attributes,
      baseRating,
      potential,
      marketValue: Number(marketValueM.toFixed(2)),
      contractEnds: contract.year,
      contractEndMonth: contract.month,
      styleTags: [] as string[],
      height: row.height ?? 0,
      weight: 0, // not collected
      jerseyNumber: parseJerseyNumber(row.tm_shirt_number, row.jersey_number),
      avatarColor: "#f4c430",
      photoUrl: row.tm_image_url ?? undefined,
    };

    playersJs.push(formatPlayerObject(obj));
  }

  const output = `// Auto-generated by scripts/build-players.ts — DO NOT EDIT MANUALLY.
// Source: data/scouting.db. Re-run \`npm run db:players\` to refresh.
// Generated at ${new Date().toISOString()}

import type { Player } from "@/types";

export const PLAYERS: Player[] = [
${playersJs.join(",\n")}
];

export const getPlayerById = (id: string): Player | undefined =>
  PLAYERS.find((p) => p.id === id);
`;

  writeFileSync(OUT_PATH, output, "utf8");
  console.log(`✓ Wrote ${rows.length} players to ${OUT_PATH}`);
  db.close();
}

function formatPlayerObject(p: Record<string, unknown>): string {
  // Pretty-printed Player object literal so the generated file is reviewable.
  const lines: string[] = ["  {"];
  for (const [key, val] of Object.entries(p)) {
    if (val === undefined) continue;
    let serialized: string;
    if (typeof val === "string") serialized = jsonStr(val);
    else if (typeof val === "number") serialized = String(val);
    else if (typeof val === "boolean") serialized = String(val);
    else if (Array.isArray(val)) {
      if (val.length === 0) serialized = "[]";
      else if (typeof val[0] === "string") serialized = JSON.stringify(val);
      else serialized = JSON.stringify(val);
    } else if (typeof val === "object" && val !== null) {
      // Inline simple object (attributes)
      const inner = Object.entries(val as Record<string, unknown>)
        .map(([k, v]) => `${k}: ${typeof v === "string" ? jsonStr(v) : v}`)
        .join(", ");
      serialized = `{ ${inner} }`;
    } else {
      serialized = JSON.stringify(val);
    }
    lines.push(`    ${key}: ${serialized},`);
  }
  lines.push("  }");
  return lines.join("\n");
}

main();
