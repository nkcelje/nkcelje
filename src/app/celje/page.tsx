import Link from "next/link";
import {
  getCeljeOverview,
  getCeljeRoster,
  type RosterPlayer,
  type CeljeOverview,
} from "@/db/queries";
import styles from "./page.module.css";

// No `dynamic` / `revalidate` — Next.js auto-detects this as static
// (no cookies/headers/searchParams used). Dev still re-renders on every request.
export const metadata = {
  title: "ALGORYTHM — NK Celje",
  description: "Обзор клуба и состав сезона.",
};

const POSITION_GROUPS: { key: string; label: string }[] = [
  { key: "G", label: "Goalkeepers" },
  { key: "D", label: "Defenders" },
  { key: "M", label: "Midfielders" },
  { key: "F", label: "Forwards" },
];

export default function CeljePage() {
  const overview = getCeljeOverview();
  const roster = getCeljeRoster();

  if (!overview.sf && roster.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className={styles.page}>
      <Header overview={overview} />
      <KeyStats overview={overview} rosterCount={roster.length} />
      <Roster roster={roster} />
    </div>
  );
}

// ============================================================================
// Header
// ============================================================================
function Header({ overview }: { overview: CeljeOverview }) {
  const { sf, tm, season } = overview;
  const accent = sf?.primaryColor ?? "var(--celje-yellow)";

  return (
    <header className={styles.heroHeader}>
      <div className={styles.heroLeft}>
        {tm?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tm.imageUrl}
            alt={`${sf?.name ?? "Celje"} logo`}
            className={styles.heroLogo}
            style={{ borderColor: accent }}
          />
        ) : (
          <div className={styles.heroLogoFallback} style={{ background: accent }}>
            {sf?.nameCode ?? "CEL"}
          </div>
        )}
      </div>

      <div className={styles.heroBody}>
        <div className={styles.heroSubtle}>
          {tm?.leagueCountryName ?? "Slovenia"} · {tm?.leagueName ?? "PrvaLiga"}
          {tm?.leagueTier ? ` · ${tm.leagueTier}` : ""}
          {season ? ` · ${season.year}` : ""}
        </div>
        <h1 className={styles.heroName}>{sf?.name ?? "NK Celje"}</h1>
        {tm?.officialName && tm.officialName !== sf?.name ? (
          <div className={styles.heroOfficial}>{tm.officialName}</div>
        ) : null}

        <div className={styles.heroMeta}>
          {tm?.foundedOn ? (
            <Meta label="Founded" value={formatFoundedYear(tm.foundedOn)} />
          ) : null}
          {tm?.stadiumName ? (
            <Meta
              label="Stadium"
              value={
                tm.stadiumSeats
                  ? `${tm.stadiumName} · ${tm.stadiumSeats.toLocaleString("ru-RU")}`
                  : tm.stadiumName
              }
            />
          ) : null}
          {tm?.currentMarketValue ? (
            <Meta label="Squad value" value={formatMv(tm.currentMarketValue)} />
          ) : null}
          {overview.elo ? (
            <Meta label="Elo" value={overview.elo.elo.toFixed(0)} accent />
          ) : null}
        </div>
      </div>
    </header>
  );
}

function Meta({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`${styles.meta} ${accent ? styles.metaAccent : ""}`}>
      <div className={styles.metaLabel}>{label}</div>
      <div className={styles.metaValue}>{value}</div>
    </div>
  );
}

// ============================================================================
// Key season stats
// ============================================================================
function KeyStats({ overview, rosterCount }: { overview: CeljeOverview; rosterCount: number }) {
  const { teamStats, tm, season } = overview;
  const gd =
    teamStats?.goalsScored != null && teamStats?.goalsConceded != null
      ? teamStats.goalsScored - teamStats.goalsConceded
      : null;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>
        Сезон {season?.year ?? "—"} — командные показатели
      </h2>
      <div className={styles.statGrid}>
        <Stat label="Матчи" value={teamStats?.matches ?? "—"} />
        <Stat
          label="Голы (за / против)"
          value={
            teamStats
              ? `${teamStats.goalsScored ?? 0} / ${teamStats.goalsConceded ?? 0}`
              : "—"
          }
          accent="good"
        />
        <Stat
          label="Разница"
          value={gd != null ? (gd > 0 ? `+${gd}` : `${gd}`) : "—"}
          accent={gd != null && gd > 0 ? "good" : gd != null && gd < 0 ? "bad" : undefined}
        />
        <Stat label="Сухие матчи" value={teamStats?.cleanSheets ?? "—"} />
        <Stat
          label="Владение"
          value={teamStats?.averageBallPossession ? `${teamStats.averageBallPossession}%` : "—"}
        />
        <Stat
          label="Pass %"
          value={
            teamStats?.accuratePassesPercentage
              ? `${teamStats.accuratePassesPercentage.toFixed(1)}%`
              : "—"
          }
        />
        <Stat
          label="Длинные %"
          value={
            teamStats?.accurateLongBallsPercentage
              ? `${teamStats.accurateLongBallsPercentage.toFixed(1)}%`
              : "—"
          }
        />
        <Stat
          label="Дуэли %"
          value={
            teamStats?.duelsWonPercentage
              ? `${teamStats.duelsWonPercentage.toFixed(1)}%`
              : "—"
          }
        />
        <Stat
          label="Воздух %"
          value={
            teamStats?.aerialDuelsWonPercentage
              ? `${teamStats.aerialDuelsWonPercentage.toFixed(1)}%`
              : "—"
          }
        />
        <Stat label="Дриблинги" value={teamStats?.successfulDribbles ?? "—"} />
        <Stat label="Перехваты" value={teamStats?.interceptions ?? "—"} />
        <Stat
          label="Карточки (ЖК / КК)"
          value={
            teamStats
              ? `${teamStats.yellowCards ?? 0} / ${teamStats.redCards ?? 0}`
              : "—"
          }
        />
        <Stat label="Состав" value={tm?.squadSize ?? rosterCount} />
        <Stat
          label="Средний возраст"
          value={tm?.squadAverageAge ? tm.squadAverageAge.toFixed(1) : "—"}
        />
        <Stat label="Легионеры" value={tm?.squadForeigners ?? "—"} />
        <Stat label="Сборники" value={tm?.squadNationalTeamPlayers ?? "—"} />
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "good" | "bad";
}) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statLabel}>{label}</div>
      <div
        className={`${styles.statValue} ${
          accent === "good" ? styles.statGood : accent === "bad" ? styles.statBad : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

// ============================================================================
// Roster — by position group
// ============================================================================
function Roster({ roster }: { roster: RosterPlayer[] }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>Состав ({roster.length})</h2>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={`${styles.dot} ${styles.dotGood}`} /> играет основу
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.dot} ${styles.dotInjured}`} /> травма
          </span>
        </div>
      </div>

      {POSITION_GROUPS.map(({ key, label }) => {
        const players = roster.filter((p) => p.positionGroup === key);
        if (players.length === 0) return null;
        return (
          <div key={key} className={styles.posGroup}>
            <h3 className={styles.posGroupTitle}>
              {label} <span className={styles.posCount}>{players.length}</span>
            </h3>
            <div className={styles.tableWrap}>
              <table className={styles.rosterTable}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th></th>
                    <th>Игрок</th>
                    <th>Позиция</th>
                    <th>Возраст</th>
                    <th>Рост</th>
                    <th>Нога</th>
                    <th>Матчи</th>
                    <th>Минут</th>
                    <th>Рейтинг</th>
                    <th>Г + П</th>
                    <th>Стоимость</th>
                    <th>Контракт</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p) => (
                    <PlayerRow key={p.playerId} p={p} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function PlayerRow({ p }: { p: RosterPlayer }) {
  const isStarter = (p.matchesStarted ?? 0) >= 10;
  return (
    <tr className={styles.row}>
      <td className={styles.cellNum}>
        {p.jerseyNumber ?? "—"}
        {p.currentInjury ? (
          <span title={p.currentInjury} className={`${styles.dot} ${styles.dotInjured}`} />
        ) : isStarter ? (
          <span title="Игрок основы" className={`${styles.dot} ${styles.dotGood}`} />
        ) : null}
      </td>
      <td className={styles.cellPhoto}>
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.imageUrl} alt="" className={styles.photo} />
        ) : (
          <div className={styles.photoFallback}>{initials(p.name)}</div>
        )}
      </td>
      <td className={styles.cellName}>
        <Link href={`/celje/players/${p.playerId}`} className={styles.nameLink}>
          {p.name}
        </Link>
        {p.citizenship && p.citizenship.length > 0 ? (
          <div className={styles.subtle}>{p.citizenship.join(" · ")}</div>
        ) : null}
      </td>
      <td className={styles.cellPos}>
        {p.tmPositionMain ?? "—"}
        {p.positionsDetailed.length > 0 ? (
          <div className={styles.subtle}>{p.positionsDetailed.join(" / ")}</div>
        ) : null}
      </td>
      <td className={styles.cellNumeric}>{p.age ?? "—"}</td>
      <td className={styles.cellNumeric}>{p.height ? `${p.height}` : "—"}</td>
      <td className={styles.cellPos}>{abbreviateFoot(p.preferredFoot)}</td>
      <td className={styles.cellNumeric}>
        {p.appearances ?? 0}
        <span className={styles.subtle}>
          {p.matchesStarted != null ? ` · ${p.matchesStarted} в осн.` : ""}
        </span>
      </td>
      <td className={styles.cellNumeric}>{p.minutesPlayed ?? 0}</td>
      <td className={styles.cellNumeric}>
        <span className={ratingClass(p.rating)}>
          {p.rating != null ? p.rating.toFixed(2) : "—"}
        </span>
      </td>
      <td className={styles.cellNumeric}>
        {(p.goals ?? 0) + (p.assists ?? 0) > 0 ? (
          <>
            <strong>{p.goalsAssistsSum ?? 0}</strong>
            <span className={styles.subtle}>
              {" "}
              ({p.goals ?? 0}+{p.assists ?? 0})
            </span>
          </>
        ) : (
          "—"
        )}
      </td>
      <td className={styles.cellNumeric}>{p.marketValue ? formatMv(p.marketValue) : "—"}</td>
      <td className={styles.cellPos}>{formatContract(p.contractExpires)}</td>
    </tr>
  );
}

// ============================================================================
// Empty state
// ============================================================================
function EmptyState() {
  return (
    <div className={styles.empty}>
      <h1>NK Celje</h1>
      <p>
        В БД пока нет данных по клубу. Запусти{" "}
        <code>cd nkcelje-scout && python scripts/collect_celje.py</code>, потом обнови страницу.
      </p>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

function formatMv(v: number): string {
  if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `€${(v / 1_000).toFixed(0)}k`;
  return `€${v}`;
}

function abbreviateFoot(f: string | null): string {
  if (!f) return "—";
  const v = f.toLowerCase();
  if (v.startsWith("left") || v === "лев") return "L";
  if (v.startsWith("right") || v === "пра") return "R";
  if (v.startsWith("both")) return "L+R";
  return f;
}

function formatFoundedYear(d: string): string {
  const y = d.slice(0, 4);
  const ageYears = new Date().getFullYear() - parseInt(y);
  return `${y} (${ageYears} лет)`;
}

function formatContract(d: string | null): string {
  if (!d) return "—";
  // Could be ISO date or "Jun 30, 2026"
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toISOString().slice(0, 10);
}

function ratingClass(r: number | null): string {
  if (r == null) return "";
  if (r >= 7.5) return styles.ratingElite;
  if (r >= 7.0) return styles.ratingGood;
  if (r >= 6.5) return styles.ratingMid;
  return styles.ratingPoor;
}
