// Inventory queries used by the /data dashboard page.
// All queries are synchronous (better-sqlite3) and run server-side at request/build time.
import { sql } from "drizzle-orm";
import { db } from "./client";

export type DataSource = "sofascore" | "transfermarkt" | "clubelo" | "mapping" | "cache";

export interface TableInfo {
  name: string;
  source: DataSource;
  description: string;
  rowCount: number;
  columns: string[];
  lastFetchedAt: number | null; // unix seconds, null if not applicable
  sampleRows: Record<string, unknown>[];
}

interface TableSpec {
  name: string;
  source: DataSource;
  description: string;
  fetchedAtColumn?: string;
}

const TABLE_SPECS: TableSpec[] = [
  // Cache layer
  {
    name: "api_cache",
    source: "cache",
    description: "Сырые JSON-ответы всех API. Источник правды.",
    fetchedAtColumn: "fetched_at",
  },
  // Sofascore
  {
    name: "sf_tournaments",
    source: "sofascore",
    description: "Лиги/турниры (Slovenian PrvaLiga, UEFA Conference League, ...).",
  },
  {
    name: "sf_seasons",
    source: "sofascore",
    description: "Сезоны внутри турнира (25/26, 24/25, ...).",
  },
  { name: "sf_teams", source: "sofascore", description: "Клубы (NK Celje, Olimpija, ...)." },
  {
    name: "sf_players",
    source: "sofascore",
    description: "Профили игроков (имя, позиция, рост, dob, MV).",
    fetchedAtColumn: "fetched_at",
  },
  {
    name: "sf_player_season_stats",
    source: "sofascore",
    description: "Сезонные статы игрока (58 полей: голы, ассисты, пасы, дриблинг, дуэли).",
    fetchedAtColumn: "fetched_at",
  },
  {
    name: "sf_player_match_stats",
    source: "sofascore",
    description: "Поматчевые статы игрока (45 полей включая xG, xA, touches, tackles).",
    fetchedAtColumn: "fetched_at",
  },
  {
    name: "sf_events",
    source: "sofascore",
    description: "Матчи (счёт, дата, стадион, судья, есть ли xG-данные).",
    fetchedAtColumn: "fetched_at",
  },
  {
    name: "sf_shots",
    source: "sofascore",
    description: "Все удары с координатами, xG и xGOT.",
    fetchedAtColumn: "fetched_at",
  },
  {
    name: "sf_team_league_stats",
    source: "sofascore",
    description: "Командные сезонные статы (42 поля).",
    fetchedAtColumn: "fetched_at",
  },
  {
    name: "sf_player_attribute_overviews",
    source: "sofascore",
    description: "Радар-чарт: attacking/technical/tactical/defending/creativity (0-100).",
    fetchedAtColumn: "fetched_at",
  },
  {
    name: "sf_player_match_ratings",
    source: "sofascore",
    description: "Поматчевые рейтинги для расчёта Risk_volatility.",
  },
  // Transfermarkt
  {
    name: "tm_players",
    source: "transfermarkt",
    description: "Профиль игрока в TM (рост, нога, контракт, MV).",
    fetchedAtColumn: "fetched_at",
  },
  {
    name: "tm_clubs",
    source: "transfermarkt",
    description: "Профиль клуба (стадион, лига, состав, размер).",
    fetchedAtColumn: "fetched_at",
  },
  {
    name: "tm_market_values",
    source: "transfermarkt",
    description: "История рыночной стоимости игрока.",
  },
  {
    name: "tm_transfers",
    source: "transfermarkt",
    description: "История трансферов с суммами.",
  },
  {
    name: "tm_injuries",
    source: "transfermarkt",
    description: "Травмы (для Risk_injury): дни пропущено, матчей пропущено.",
  },
  {
    name: "tm_achievements",
    source: "transfermarkt",
    description: "Достижения и трофеи игрока.",
  },
  // ClubELO
  {
    name: "elo_team_history",
    source: "clubelo",
    description: "История Elo-рейтинга клуба (для коэффициента K_team).",
  },
  // Mappings
  {
    name: "player_id_map",
    source: "mapping",
    description: "Связка ID игрока между Sofascore и Transfermarkt.",
  },
  {
    name: "team_id_map",
    source: "mapping",
    description: "Связка ID клуба между Sofascore, Transfermarkt и ClubELO.",
  },
];

function getColumns(table: string): string[] {
  const rows = db.all<{ name: string }>(sql.raw(`PRAGMA table_info(${table})`));
  return rows.map((r) => r.name);
}

function getRowCount(table: string): number {
  const r = db.get<{ n: number }>(sql.raw(`SELECT COUNT(*) AS n FROM ${table}`));
  return r?.n ?? 0;
}

function getLastFetched(table: string, fetchedAtColumn?: string): number | null {
  if (!fetchedAtColumn) return null;
  const r = db.get<{ ts: number | null }>(
    sql.raw(`SELECT MAX(${fetchedAtColumn}) AS ts FROM ${table}`),
  );
  return r?.ts ?? null;
}

function getSampleRows(table: string, limit = 3): Record<string, unknown>[] {
  return db.all<Record<string, unknown>>(sql.raw(`SELECT * FROM ${table} LIMIT ${limit}`));
}

export function getInventory(): TableInfo[] {
  return TABLE_SPECS.map((spec) => ({
    name: spec.name,
    source: spec.source,
    description: spec.description,
    rowCount: getRowCount(spec.name),
    columns: getColumns(spec.name),
    lastFetchedAt: getLastFetched(spec.name, spec.fetchedAtColumn),
    sampleRows: getSampleRows(spec.name, 3),
  }));
}

export interface SourceSummary {
  source: DataSource;
  tableCount: number;
  totalRows: number;
  populatedTables: number;
  lastFetchedAt: number | null;
}

export function getSourceSummary(inv: TableInfo[]): SourceSummary[] {
  const map = new Map<DataSource, SourceSummary>();
  for (const t of inv) {
    const cur = map.get(t.source) ?? {
      source: t.source,
      tableCount: 0,
      totalRows: 0,
      populatedTables: 0,
      lastFetchedAt: null as number | null,
    };
    cur.tableCount += 1;
    cur.totalRows += t.rowCount;
    if (t.rowCount > 0) cur.populatedTables += 1;
    if (t.lastFetchedAt !== null) {
      cur.lastFetchedAt =
        cur.lastFetchedAt === null ? t.lastFetchedAt : Math.max(cur.lastFetchedAt, t.lastFetchedAt);
    }
    map.set(t.source, cur);
  }
  const order: DataSource[] = ["sofascore", "transfermarkt", "clubelo", "mapping", "cache"];
  return order.map((s) => map.get(s)).filter(Boolean) as SourceSummary[];
}
