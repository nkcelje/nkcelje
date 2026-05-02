import { getInventory, getSourceSummary, type DataSource } from "@/db/inventory";
import styles from "./page.module.css";

// No `dynamic` / `revalidate` — Next.js auto-detects this as static
// (no cookies/headers/searchParams used). Dev still re-renders on every request.
// To refresh prod data: re-run scout, commit data/scouting.db, push to git.
export const metadata = {
  title: "ALGORYTHM — Data Inventory",
  description: "Что у нас есть в локальной БД.",
};

const SOURCE_LABEL: Record<DataSource, string> = {
  sofascore: "Sofascore",
  transfermarkt: "Transfermarkt",
  clubelo: "ClubELO",
  mapping: "ID Mapping",
  cache: "Raw API Cache",
};

const SOURCE_DESC: Record<DataSource, string> = {
  sofascore: "api.sofascore.com — матчи, статы, xG, удары, рейтинги",
  transfermarkt: "transfermarkt-api.fly.dev — профили, стоимость, трансферы, травмы",
  clubelo: "api.clubelo.com — Elo-рейтинг клубов",
  mapping: "Связки ID между источниками (sf ↔ tm ↔ elo)",
  cache: "Сырые JSON-ответы всех API — источник правды",
};

function formatTs(ts: number | null): string {
  if (ts === null) return "—";
  const d = new Date(ts * 1000);
  const now = Date.now();
  const ageSec = Math.floor((now - d.getTime()) / 1000);
  if (ageSec < 60) return `${ageSec}s ago`;
  if (ageSec < 3600) return `${Math.floor(ageSec / 60)}m ago`;
  if (ageSec < 86400) return `${Math.floor(ageSec / 3600)}h ago`;
  if (ageSec < 86400 * 7) return `${Math.floor(ageSec / 86400)}d ago`;
  return d.toISOString().slice(0, 10);
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US").replace(/,/g, " ");
}

export default function DataInventoryPage() {
  const inventory = getInventory();
  const summary = getSourceSummary(inventory);

  const totalRows = inventory.reduce((acc, t) => acc + t.rowCount, 0);
  const populatedCount = inventory.filter((t) => t.rowCount > 0).length;
  const renderedAt = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Data Inventory</h1>
        <p className={styles.subtitle}>
          Состояние локальной БД <code>nkcelje/data/scouting.db</code>. Что собрано, из каких
          источников, сколько строк, когда обновлялось. Страница отрендерена{" "}
          <code>{renderedAt}</code>.
        </p>

        <div className={styles.statRow}>
          <Stat label="Всего таблиц" value={`${inventory.length}`} />
          <Stat
            label="Заполнено"
            value={`${populatedCount} / ${inventory.length}`}
            tone={populatedCount === 0 ? "muted" : populatedCount === inventory.length ? "good" : "warn"}
          />
          <Stat label="Всего строк" value={formatNumber(totalRows)} tone={totalRows > 0 ? "good" : "muted"} />
          <Stat label="Источников" value={`${summary.length}`} />
        </div>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>По источникам</h2>
        <div className={styles.sourceGrid}>
          {summary.map((s) => (
            <div key={s.source} className={styles.sourceCard}>
              <div className={styles.sourceHead}>
                <span className={`${styles.badge} ${styles[`badge_${s.source}`]}`}>
                  {SOURCE_LABEL[s.source]}
                </span>
                <span className={styles.sourceCount}>
                  {s.populatedTables} / {s.tableCount}
                </span>
              </div>
              <p className={styles.sourceDesc}>{SOURCE_DESC[s.source]}</p>
              <div className={styles.sourceFooter}>
                <span>
                  <span className={styles.k}>Строк:</span>{" "}
                  <span className={styles.mono}>{formatNumber(s.totalRows)}</span>
                </span>
                <span>
                  <span className={styles.k}>Свежесть:</span>{" "}
                  <span className={styles.mono}>{formatTs(s.lastFetchedAt)}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Таблицы</h2>
        {(["sofascore", "transfermarkt", "clubelo", "mapping", "cache"] as DataSource[]).map((src) => {
          const tables = inventory.filter((t) => t.source === src);
          if (tables.length === 0) return null;
          return (
            <div key={src} className={styles.tableGroup}>
              <h3 className={styles.groupTitle}>
                <span className={`${styles.badge} ${styles[`badge_${src}`]}`}>
                  {SOURCE_LABEL[src]}
                </span>
              </h3>
              <div className={styles.tableGrid}>
                {tables.map((t) => (
                  <details key={t.name} className={styles.tableCard}>
                    <summary className={styles.tableHead}>
                      <div className={styles.tableHeadMain}>
                        <span className={styles.tableName}>{t.name}</span>
                        <span className={styles.tableDesc}>{t.description}</span>
                      </div>
                      <div className={styles.tableMeta}>
                        <span
                          className={`${styles.rowBadge} ${
                            t.rowCount === 0 ? styles.rowBadgeEmpty : styles.rowBadgeFull
                          }`}
                        >
                          {formatNumber(t.rowCount)} rows
                        </span>
                        <span className={styles.tableUpdated}>
                          {t.lastFetchedAt !== null && formatTs(t.lastFetchedAt)}
                        </span>
                      </div>
                    </summary>
                    <div className={styles.tableBody}>
                      <div className={styles.colsBlock}>
                        <div className={styles.k}>Колонки ({t.columns.length}):</div>
                        <div className={styles.cols}>
                          {t.columns.map((c) => (
                            <code key={c} className={styles.col}>
                              {c}
                            </code>
                          ))}
                        </div>
                      </div>
                      {t.sampleRows.length > 0 ? (
                        <div className={styles.sampleBlock}>
                          <div className={styles.k}>Примеры (первые {t.sampleRows.length}):</div>
                          <div className={styles.sampleScroll}>
                            <table className={styles.sampleTable}>
                              <thead>
                                <tr>
                                  {t.columns.slice(0, 12).map((c) => (
                                    <th key={c}>{c}</th>
                                  ))}
                                  {t.columns.length > 12 && <th>…+{t.columns.length - 12}</th>}
                                </tr>
                              </thead>
                              <tbody>
                                {t.sampleRows.map((row, i) => (
                                  <tr key={i}>
                                    {t.columns.slice(0, 12).map((c) => (
                                      <td key={c}>{formatCell(row[c])}</td>
                                    ))}
                                    {t.columns.length > 12 && <td>…</td>}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.empty}>
                          Таблица пустая. Запусти{" "}
                          <code>cd nkcelje-scout && python scripts/collect_celje.py</code>.
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <footer className={styles.footer}>
        <p>
          Страница рендерится статически на этапе <code>next build</code>. Чтобы обновить
          данные на проде — пересобрать БД локально, закоммитить{" "}
          <code>nkcelje/data/scouting.db</code>, push в git, дождаться Vercel-деплоя.
        </p>
      </footer>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "muted" | "good" | "warn";
}) {
  return (
    <div className={`${styles.stat} ${styles[`stat_${tone}`]}`}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
    </div>
  );
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") {
    // Heuristic: large numbers around now/2024 are likely unix timestamps in seconds
    if (v > 1_000_000_000 && v < 2_000_000_000) {
      return new Date(v * 1000).toISOString().slice(0, 10);
    }
    return String(v);
  }
  const s = String(v);
  return s.length > 80 ? s.slice(0, 77) + "…" : s;
}
