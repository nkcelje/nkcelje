import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlayerIds, getPlayerProfile, type PlayerProfile } from "@/db/queries";
import styles from "./page.module.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPlayerIds().map((id) => ({ id: String(id) }));
}

export function generateMetadata({ params }: { params: { id: string } }) {
  const profile = getPlayerProfile(parseInt(params.id, 10));
  return {
    title: profile?.sf?.name
      ? `${profile.sf.name} — ALGORYTHM`
      : "Player — ALGORYTHM",
  };
}

export default function PlayerPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) notFound();
  const profile = getPlayerProfile(id);
  if (!profile) notFound();

  return (
    <div className={styles.page}>
      <Breadcrumbs name={profile.sf.name} />
      <Hero profile={profile} />
      <div className={styles.grid2}>
        <KeyMetrics profile={profile} />
        <AttributeOverview profile={profile} />
      </div>
      <PerMatchAggregate profile={profile} />
      <SeasonStats profile={profile} />
      <div className={styles.grid2}>
        <RatingsAndRisk profile={profile} />
        <MarketValueHistory profile={profile} />
      </div>
      <CareerSeasons profile={profile} />
      <Transfers profile={profile} />
      <div className={styles.grid2}>
        <Injuries profile={profile} />
        <Achievements profile={profile} />
      </div>
      <Identifiers profile={profile} />
    </div>
  );
}

// ============================================================================
// Components
// ============================================================================
function Breadcrumbs({ name }: { name: string }) {
  return (
    <div className={styles.crumbs}>
      <Link href="/celje" className={styles.crumbLink}>
        ← NK Celje
      </Link>
      <span className={styles.crumbSep}>/</span>
      <span>{name}</span>
    </div>
  );
}

function Hero({ profile }: { profile: PlayerProfile }) {
  const { sf, tm, positionsDetailed, citizenship } = profile;
  const photoUrl = tm?.image_url;
  const accent = "var(--celje-yellow)";
  return (
    <header className={styles.hero}>
      <div className={styles.heroPhotoWrap}>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={sf.name} className={styles.heroPhoto} />
        ) : (
          <div className={styles.heroPhotoFallback}>{initials(sf.name)}</div>
        )}
      </div>
      <div className={styles.heroBody}>
        <div className={styles.heroSubtle}>
          {tm?.position_main ?? sf.position ?? "—"}
          {positionsDetailed.length > 0 ? ` · ${positionsDetailed.join(" / ")}` : ""}
        </div>
        <h1 className={styles.heroName}>
          {sf.name}
          {sf.jersey_number != null && (
            <span className={styles.heroJersey} style={{ color: accent }}>
              #{sf.jersey_number}
            </span>
          )}
        </h1>
        <div className={styles.heroFacts}>
          <Fact label="Возраст" value={sf.date_of_birth ? `${calcAge(sf.date_of_birth)} (${formatDob(sf.date_of_birth)})` : "—"} />
          <Fact label="Рост" value={sf.height ? `${sf.height} см` : "—"} />
          <Fact label="Нога" value={prettyFoot(sf.preferred_foot, tm?.foot)} />
          <Fact label="Гражданство" value={citizenship.length ? citizenship.join(" · ") : sf.country_name ?? "—"} />
          <Fact
            label="Стоимость"
            value={tm?.market_value ? formatMv(tm.market_value) : sf.proposed_market_value ? formatMv(sf.proposed_market_value) : "—"}
            accent
          />
          <Fact
            label="Контракт до"
            value={tm?.club_contract_expires ? formatDate(tm.club_contract_expires) : sf.contract_until_timestamp ? formatTs(sf.contract_until_timestamp) : "—"}
          />
        </div>
      </div>
    </header>
  );
}

function Fact({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`${styles.fact} ${accent ? styles.factAccent : ""}`}>
      <div className={styles.factLabel}>{label}</div>
      <div className={styles.factValue}>{value}</div>
    </div>
  );
}

function KeyMetrics({ profile }: { profile: PlayerProfile }) {
  const s = profile.currentSeason.stats;
  const t = profile.currentSeason.tournament;
  const sea = profile.currentSeason.season;

  if (!s) {
    return (
      <Card title={`Сезон ${sea?.year ?? "—"}`} subtitle={t?.name ?? ""}>
        <div className={styles.empty}>Сезонная статистика ещё не заполнена.</div>
      </Card>
    );
  }
  return (
    <Card title={`Сезон ${sea?.year ?? ""}`} subtitle={t?.name}>
      <div className={styles.metricGrid}>
        <Metric label="Рейтинг" value={s.rating?.toFixed(2) ?? "—"} accent={ratingAccent(s.rating)} />
        <Metric label="Матчи" value={`${s.appearances ?? 0}`} sub={`${s.matches_started ?? 0} в осн.`} />
        <Metric label="Минут" value={`${s.minutes_played ?? 0}`} />
        <Metric label="Голы + Ассисты" value={`${s.goals_assists_sum ?? 0}`} sub={`(${s.goals ?? 0}+${s.assists ?? 0})`} accent="good" />
        <Metric label="Удары · в створ" value={`${s.total_shots ?? 0} · ${s.shots_on_target ?? 0}`} />
        <Metric label="Конверсия" value={s.goal_conversion_percentage ? `${s.goal_conversion_percentage.toFixed(1)}%` : "—"} />
        <Metric label="Ключевые пасы" value={`${s.key_passes ?? 0}`} />
        <Metric label="Дриблинг (%)" value={s.successful_dribbles_percentage ? `${s.successful_dribbles ?? 0} (${s.successful_dribbles_percentage.toFixed(0)}%)` : `${s.successful_dribbles ?? 0}`} />
        <Metric label="Pass %" value={s.accurate_passes_percentage ? `${s.accurate_passes_percentage.toFixed(1)}%` : "—"} />
        <Metric label="Длинные %" value={s.accurate_long_balls_percentage ? `${s.accurate_long_balls_percentage.toFixed(1)}%` : "—"} />
        <Metric label="Дуэли %" value={s.total_duels_won_percentage ? `${s.total_duels_won_percentage.toFixed(1)}%` : "—"} />
        <Metric label="Воздух %" value={s.aerial_duels_won_percentage ? `${s.aerial_duels_won_percentage.toFixed(1)}%` : "—"} />
        <Metric label="Подборы" value={`${s.ball_recovery ?? 0}`} />
        <Metric label="Обыгран" value={`${s.dribbled_past ?? 0}`} />
        <Metric label="Кар. ЖК / КК" value={`${s.yellow_cards ?? 0} / ${s.red_cards ?? 0}`} />
        <Metric label="Фолы / На нём" value={`${s.fouls ?? 0} / ${s.was_fouled ?? 0}`} />
      </div>
    </Card>
  );
}

function AttributeOverview({ profile }: { profile: PlayerProfile }) {
  const { player, average } = profile.attributes;
  if (!player) {
    return (
      <Card title="Атрибуты (Sofascore)">
        <div className={styles.empty}>
          Sofascore ещё не выставил рейтинги для этого игрока (мало матчей).
        </div>
      </Card>
    );
  }
  const keys: { k: keyof typeof player; label: string }[] = [
    { k: "attacking", label: "Атака" },
    { k: "technical", label: "Техника" },
    { k: "tactical", label: "Тактика" },
    { k: "defending", label: "Оборона" },
    { k: "creativity", label: "Креатив" },
  ];
  return (
    <Card title="Атрибуты (Sofascore)" subtitle={`Сравнение с медианой ${player.position ?? "позиции"}`}>
      <div className={styles.bars}>
        {keys.map(({ k, label }) => {
          const v = player[k] as number;
          const avg = average ? (average[k] as number) : null;
          const delta = avg != null ? v - avg : null;
          return (
            <div key={k} className={styles.barRow}>
              <div className={styles.barLabel}>{label}</div>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: `${v}%` }} />
                {avg != null && (
                  <div
                    className={styles.barAvgMark}
                    style={{ left: `${avg}%` }}
                    title={`Медиана: ${avg}`}
                  />
                )}
              </div>
              <div className={styles.barValue}>
                <strong>{v}</strong>
                {delta != null && (
                  <span
                    className={
                      delta > 0 ? styles.deltaGood : delta < 0 ? styles.deltaBad : styles.deltaZero
                    }
                  >
                    {delta > 0 ? "+" : ""}
                    {delta}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function PerMatchAggregate({ profile }: { profile: PlayerProfile }) {
  const a = profile.matchAggregate;
  if (!a) {
    return (
      <Card title="Per-match агрегат" subtitle="xG · xA · touches · tackles из /event/{id}/lineups">
        <div className={styles.empty}>
          Per-match данные ещё не собраны. Запусти{" "}
          <code style={{ fontFamily: "var(--font-mono)" }}>
            python scripts/collect_celje.py --per-match-only
          </code>
        </div>
      </Card>
    );
  }
  const gMinusXg = a.goals - a.xG;
  const aMinusXa = a.assists - a.xA;
  return (
    <Card title="Per-match агрегат" subtitle={`${a.matches} матчей · ${a.minutes} мин · агрегаты из /event/{id}/lineups`}>
      <div className={styles.metricGrid}>
        <Metric label="xG" value={a.xG.toFixed(2)} sub={`${a.per90.xG.toFixed(2)}/90`} accent="elite" />
        <Metric label="xA" value={a.xA.toFixed(2)} sub={`${a.per90.xA.toFixed(2)}/90`} accent="elite" />
        <Metric label="npxG" value={a.npxG.toFixed(2)} sub={`${a.per90.npxG.toFixed(2)}/90`} />
        <Metric
          label="G − xG"
          value={(gMinusXg >= 0 ? "+" : "") + gMinusXg.toFixed(2)}
          sub={gMinusXg > 0.5 ? "перевыполняет" : gMinusXg < -0.5 ? "недобирает" : "по xG"}
          accent={gMinusXg > 0.5 ? "good" : gMinusXg < -0.5 ? "bad" : undefined}
        />
        <Metric
          label="A − xA"
          value={(aMinusXa >= 0 ? "+" : "") + aMinusXa.toFixed(2)}
          accent={aMinusXa > 0.5 ? "good" : aMinusXa < -0.5 ? "bad" : undefined}
        />
        <Metric label="Big chances created" value={`${a.bigChanceCreated}`} />
        <Metric label="Big chances missed" value={`${a.bigChanceMissed}`} />
        <Metric label="Touches" value={`${a.touches}`} sub={`${a.per90.touches.toFixed(0)}/90`} />
        <Metric label="Tackles (W/T)" value={`${a.tacklesWon}/${a.tackles}`} sub={`${a.per90.tackles.toFixed(2)}/90`} />
        <Metric label="Interceptions" value={`${a.interceptions}`} sub={`${a.per90.interceptions.toFixed(2)}/90`} />
        <Metric label="Key passes" value={`${a.keyPasses}`} sub={`${a.per90.keyPasses.toFixed(2)}/90`} />
        <Metric
          label="Кроссы (точн./всего)"
          value={`${a.accurateCross}/${a.totalCross}`}
          sub={a.totalCross > 0 ? `${((a.accurateCross / a.totalCross) * 100).toFixed(0)}%` : "—"}
        />
        <Metric
          label="Дуэли (W/L)"
          value={`${a.duelsWon}/${a.duelsLost}`}
          sub={
            a.duelsWon + a.duelsLost > 0
              ? `${((a.duelsWon / (a.duelsWon + a.duelsLost)) * 100).toFixed(0)}%`
              : "—"
          }
        />
        <Metric
          label="Воздух (W/L)"
          value={`${a.aerialWon}/${a.aerialLost}`}
          sub={
            a.aerialWon + a.aerialLost > 0
              ? `${((a.aerialWon / (a.aerialWon + a.aerialLost)) * 100).toFixed(0)}%`
              : "—"
          }
        />
        <Metric
          label="Pass% на чужой пол."
          value={
            a.totalOppositionHalfPasses > 0
              ? `${((a.accurateOppositionHalfPasses / a.totalOppositionHalfPasses) * 100).toFixed(1)}%`
              : "—"
          }
          sub={`${a.accurateOppositionHalfPasses}/${a.totalOppositionHalfPasses}`}
        />
      </div>

      {a.shotsBySituation.length > 0 && (
        <div>
          <div className={styles.statGroupTitle} style={{ marginBottom: 6 }}>
            Удары по ситуациям
          </div>
          <div className={styles.miniTableWrap}>
            <table className={styles.miniTable}>
              <thead>
                <tr>
                  <th>Ситуация</th>
                  <th>Удары</th>
                  <th>xG</th>
                  <th>Голы</th>
                </tr>
              </thead>
              <tbody>
                {a.shotsBySituation.map((s) => (
                  <tr key={s.situation}>
                    <td>{s.situation}</td>
                    <td>{s.count}</td>
                    <td>{s.xg.toFixed(2)}</td>
                    <td>{s.goals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {a.recentMatches.length > 0 && (
        <div>
          <div className={styles.statGroupTitle} style={{ marginBottom: 6 }}>
            Последние матчи
          </div>
          <div className={styles.miniTableWrap}>
            <table className={styles.miniTable}>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>H/A</th>
                  <th>Соперник</th>
                  <th>Счёт</th>
                  <th>Мин</th>
                  <th>Рейт</th>
                  <th>xG</th>
                  <th>xA</th>
                  <th>G + A</th>
                </tr>
              </thead>
              <tbody>
                {a.recentMatches.map((m) => (
                  <tr key={m.eventId}>
                    <td>{m.timestamp ? new Date(m.timestamp * 1000).toISOString().slice(0, 10) : "—"}</td>
                    <td>{m.isHome ? "H" : "A"}</td>
                    <td>{m.opponent ?? "—"}</td>
                    <td>{m.score ?? "—"}</td>
                    <td>{m.minutes ?? "—"}</td>
                    <td className={ratingAccent(m.rating) === "elite" ? styles.good : ""}>
                      {m.rating != null ? m.rating.toFixed(1) : "—"}
                    </td>
                    <td>{m.xG != null ? m.xG.toFixed(2) : "—"}</td>
                    <td>{m.xA != null ? m.xA.toFixed(2) : "—"}</td>
                    <td>
                      {(m.goals ?? 0) + (m.assists ?? 0) > 0
                        ? `${(m.goals ?? 0) + (m.assists ?? 0)} (${m.goals ?? 0}+${m.assists ?? 0})`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}

function SeasonStats({ profile }: { profile: PlayerProfile }) {
  const s = profile.currentSeason.stats;
  if (!s) return null;
  const groups: { title: string; fields: { k: string; label: string; format?: (v: any) => string }[] }[] = [
    {
      title: "Передачи",
      fields: [
        { k: "total_passes", label: "Всего" },
        { k: "accurate_passes", label: "Точные" },
        { k: "inaccurate_passes", label: "Неточные" },
        { k: "accurate_passes_percentage", label: "% точных", format: pct },
        { k: "accurate_final_third_passes", label: "В фин. треть" },
        { k: "key_passes", label: "Ключевые" },
        { k: "pass_to_assist", label: "Pre-assist" },
        { k: "total_long_balls", label: "Длинных" },
        { k: "accurate_long_balls", label: "Точных длин." },
        { k: "accurate_long_balls_percentage", label: "% длин.", format: pct },
      ],
    },
    {
      title: "Атака",
      fields: [
        { k: "goals", label: "Голы" },
        { k: "assists", label: "Ассисты" },
        { k: "goals_assists_sum", label: "Г + А" },
        { k: "total_shots", label: "Удары" },
        { k: "shots_on_target", label: "В створ" },
        { k: "goal_conversion_percentage", label: "Конверсия", format: pct },
        { k: "scoring_frequency", label: "Мин/гол", format: (v: any) => (v ? `${Math.round(v)}` : "—") },
        { k: "shot_from_set_piece", label: "Со станд." },
        { k: "penalties_taken", label: "Пен. бил" },
        { k: "penalty_goals", label: "Пен. забил" },
        { k: "offsides", label: "Офсайды" },
      ],
    },
    {
      title: "Кроссы / дриблинг",
      fields: [
        { k: "total_cross", label: "Всего кроссов" },
        { k: "accurate_crosses", label: "Точных" },
        { k: "accurate_crosses_percentage", label: "% точных", format: pct },
        { k: "successful_dribbles", label: "Удачных дрибл." },
        { k: "successful_dribbles_percentage", label: "% дрибл.", format: pct },
      ],
    },
    {
      title: "Дуэли / оборона",
      fields: [
        { k: "total_duels_won", label: "Дуэлей выигр." },
        { k: "duel_lost", label: "Дуэлей проигр." },
        { k: "total_duels_won_percentage", label: "% дуэлей", format: pct },
        { k: "aerial_duels_won", label: "Воздух выигр." },
        { k: "aerial_lost", label: "Воздух проигр." },
        { k: "aerial_duels_won_percentage", label: "% возд.", format: pct },
        { k: "ball_recovery", label: "Подборы" },
        { k: "clearances", label: "Выносы" },
        { k: "blocked_shots", label: "Блок. удары" },
        { k: "dribbled_past", label: "Обыгран" },
        { k: "error_lead_to_shot", label: "Ошибки → удар" },
      ],
    },
    {
      title: "Дисциплина",
      fields: [
        { k: "yellow_cards", label: "ЖК" },
        { k: "red_cards", label: "КК" },
        { k: "yellow_red_cards", label: "2-я ЖК → КК" },
        { k: "fouls", label: "Сфолил" },
        { k: "was_fouled", label: "Фолили на нём" },
      ],
    },
  ];

  return (
    <Card title="Сезонная статистика — детально">
      <div className={styles.statGroups}>
        {groups.map((g) => (
          <div key={g.title} className={styles.statGroup}>
            <div className={styles.statGroupTitle}>{g.title}</div>
            <div className={styles.statRows}>
              {g.fields.map((f) => {
                const v = s[f.k];
                if (v == null) return null;
                return (
                  <div key={f.k} className={styles.statRow}>
                    <span className={styles.statRowLabel}>{f.label}</span>
                    <span className={styles.statRowValue}>{f.format ? f.format(v) : String(v)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RatingsAndRisk({ profile }: { profile: PlayerProfile }) {
  const stats = profile.ratingStats;
  if (!stats) {
    return (
      <Card title="Поматчевые рейтинги">
        <div className={styles.empty}>Недостаточно матчей для статистики.</div>
      </Card>
    );
  }
  const ratings = profile.matchRatings.slice(0, 30).reverse(); // chronological for sparkline
  return (
    <Card title="Поматчевые рейтинги" subtitle={`${stats.n} матчей за год`}>
      <div className={styles.ratingsBlock}>
        <div className={styles.ratingsKpi}>
          <Metric label="Средний" value={stats.mean.toFixed(2)} accent={ratingAccent(stats.mean)} />
          <Metric label="Min / Max" value={`${stats.min} / ${stats.max}`} />
          <Metric label="CV (волатильность)" value={stats.cv.toFixed(3)} sub={cvLabel(stats.cv)} />
          <Metric
            label="Risk_volatility"
            value={profile.derivedRisks.riskVolatility.toFixed(3)}
            sub="по методологии §9.3"
            accent={profile.derivedRisks.riskVolatility < 0.1 ? "good" : profile.derivedRisks.riskVolatility > 0.5 ? "bad" : undefined}
          />
        </div>
        <Sparkline values={ratings.map((r) => r.rating)} />
        <div className={styles.subtleNote}>
          Рейтинги последних {ratings.length} матчей (хронологически слева направо).
        </div>
      </div>
    </Card>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values, 5);
  const max = Math.max(...values, 10);
  const range = max - min || 1;
  const W = 100, H = 40;
  const step = W / (values.length - 1);
  const pts = values.map((v, i) => `${(i * step).toFixed(2)},${(H - ((v - min) / range) * H).toFixed(2)}`).join(" ");
  const last = values[values.length - 1];
  const lastY = H - ((last - min) / range) * H;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.spark} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="var(--celje-yellow)" strokeWidth={1} />
      <circle cx={(values.length - 1) * step} cy={lastY} r={1.5} fill="var(--celje-yellow)" />
    </svg>
  );
}

function MarketValueHistory({ profile }: { profile: PlayerProfile }) {
  const mv = profile.marketValueHistory;
  if (mv.length === 0) {
    return (
      <Card title="История рыночной стоимости">
        <div className={styles.empty}>Нет данных Transfermarkt.</div>
      </Card>
    );
  }
  const peak = mv.reduce((a, b) => ((a.marketValue ?? 0) > (b.marketValue ?? 0) ? a : b));
  const current = mv[mv.length - 1];
  return (
    <Card title="История рыночной стоимости" subtitle={`${mv.length} точек`}>
      <div className={styles.mvKpi}>
        <Metric label="Текущая" value={current.marketValue ? formatMv(current.marketValue) : "—"} accent />
        <Metric label="Пик" value={peak.marketValue ? formatMv(peak.marketValue) : "—"} sub={peak.date} />
      </div>
      <Sparkline values={mv.map((m) => m.marketValue ?? 0).filter((v) => v > 0)} />
      <div className={styles.miniTableWrap}>
        <table className={styles.miniTable}>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Возраст</th>
              <th>Клуб</th>
              <th>MV</th>
            </tr>
          </thead>
          <tbody>
            {mv.slice().reverse().slice(0, 6).map((m, i) => (
              <tr key={i}>
                <td>{m.date}</td>
                <td>{m.age ?? "—"}</td>
                <td>{m.clubName}</td>
                <td>{m.marketValue ? formatMv(m.marketValue) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function CareerSeasons({ profile }: { profile: PlayerProfile }) {
  const seasons = profile.careerSeasons;
  if (seasons.length === 0) return null;
  return (
    <Card title="Карьера (сезоны со стат-данными)">
      <div className={styles.miniTableWrap}>
        <table className={styles.miniTable}>
          <thead>
            <tr>
              <th>Сезон</th>
              <th>Турнир</th>
              <th>Матчи</th>
              <th>Минут</th>
              <th>Г + А</th>
              <th>Рейтинг</th>
            </tr>
          </thead>
          <tbody>
            {seasons.map((s) => (
              <tr key={`${s.utId}-${s.seasonId}`}>
                <td>{s.year}</td>
                <td>{s.tournamentName}</td>
                <td>{s.appearances ?? "—"}</td>
                <td>{s.minutesPlayed ?? "—"}</td>
                <td>{(s.goals ?? 0) + (s.assists ?? 0)} <span className={styles.subtle}>({s.goals ?? 0}+{s.assists ?? 0})</span></td>
                <td className={ratingAccent(s.rating) === "good" || ratingAccent(s.rating) === "elite" ? styles.good : ""}>
                  {s.rating ? s.rating.toFixed(2) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Transfers({ profile }: { profile: PlayerProfile }) {
  const tr = profile.transfers;
  if (tr.length === 0) return null;
  return (
    <Card title={`История трансферов (${tr.length})`}>
      <div className={styles.miniTableWrap}>
        <table className={styles.miniTable}>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Сезон</th>
              <th>Из</th>
              <th>В</th>
              <th>MV</th>
              <th>Сумма</th>
            </tr>
          </thead>
          <tbody>
            {tr.map((t, i) => (
              <tr key={i}>
                <td>{t.date}</td>
                <td>{t.season}</td>
                <td>{t.from.name}</td>
                <td>{t.to.name}</td>
                <td>{t.marketValue ? formatMv(t.marketValue) : "—"}</td>
                <td>{t.fee ? formatMv(t.fee) : t.fee === 0 ? "Free" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Injuries({ profile }: { profile: PlayerProfile }) {
  const inj = profile.injuries;
  const risk = profile.derivedRisks;
  return (
    <Card
      title="Травмы"
      subtitle={inj.length ? `За карьеру: ${inj.length}` : ""}
    >
      <div className={styles.riskBlock}>
        <Metric
          label="Дней травм / 24 мес"
          value={`${risk.injuryDaysLast24Months}`}
        />
        <Metric
          label="Risk_injury"
          value={risk.riskInjury.toFixed(3)}
          sub="по методологии §9.1"
          accent={risk.riskInjury < 0.2 ? "good" : risk.riskInjury > 0.5 ? "bad" : "warn"}
        />
      </div>
      {inj.length > 0 && (
        <div className={styles.miniTableWrap}>
          <table className={styles.miniTable}>
            <thead>
              <tr>
                <th>Сезон</th>
                <th>Травма</th>
                <th>С</th>
                <th>По</th>
                <th>Дней</th>
                <th>Матчей</th>
              </tr>
            </thead>
            <tbody>
              {inj.map((i, k) => (
                <tr key={k}>
                  <td>{i.season}</td>
                  <td>{i.injury}</td>
                  <td>{i.fromDate}</td>
                  <td>{i.untilDate ?? "—"}</td>
                  <td>{i.days ?? "—"}</td>
                  <td>{i.gamesMissed ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {inj.length === 0 && <div className={styles.empty}>Травм не зафиксировано.</div>}
    </Card>
  );
}

function Achievements({ profile }: { profile: PlayerProfile }) {
  const ach = profile.achievements;
  if (ach.length === 0) {
    return (
      <Card title="Достижения">
        <div className={styles.empty}>Не зафиксировано.</div>
      </Card>
    );
  }
  // Group by title
  const byTitle = new Map<string, typeof ach>();
  for (const a of ach) {
    const arr = byTitle.get(a.title) ?? [];
    arr.push(a);
    byTitle.set(a.title, arr);
  }
  return (
    <Card title={`Достижения (${ach.length})`}>
      <ul className={styles.achList}>
        {Array.from(byTitle.entries()).map(([title, items]) => (
          <li key={title} className={styles.achItem}>
            <div className={styles.achTitle}>
              {title}
              <span className={styles.achCount}>×{items.length}</span>
            </div>
            <div className={styles.achDetails}>
              {items.map((a, i) => (
                <span key={i} className={styles.achDetail}>
                  {a.seasonName ?? a.season} · {a.clubName ?? "—"}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Identifiers({ profile }: { profile: PlayerProfile }) {
  const sf = profile.sf;
  const tm = profile.tm;
  return (
    <Card title="Идентификаторы">
      <div className={styles.idGrid}>
        <IdRow label="Sofascore ID" value={sf.player_id} link={`https://www.sofascore.com/player/${sf.slug}/${sf.player_id}`} />
        {tm && <IdRow label="Transfermarkt ID" value={tm.tm_id} link={`https://www.transfermarkt.com${tm.url}`} />}
        <IdRow label="Slug" value={sf.slug} />
      </div>
    </Card>
  );
}

function IdRow({ label, value, link }: { label: string; value: string | number; link?: string }) {
  return (
    <div className={styles.idRow}>
      <span className={styles.idLabel}>{label}</span>
      <span className={styles.idValue}>
        {link ? (
          <a href={link} target="_blank" rel="noreferrer">
            {value}
          </a>
        ) : (
          value
        )}
      </span>
    </div>
  );
}

// ============================================================================
// Atomic UI
// ============================================================================
function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className={styles.card}>
      <header className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{title}</h2>
        {subtitle && <span className={styles.cardSubtitle}>{subtitle}</span>}
      </header>
      <div className={styles.cardBody}>{children}</div>
    </section>
  );
}

function Metric({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "good" | "bad" | "warn" | "elite" | true;
}) {
  const cls =
    accent === "good"
      ? styles.metricGood
      : accent === "bad"
      ? styles.metricBad
      : accent === "warn"
      ? styles.metricWarn
      : accent === "elite" || accent === true
      ? styles.metricElite
      : "";
  return (
    <div className={styles.metric}>
      <div className={styles.metricLabel}>{label}</div>
      <div className={`${styles.metricValue} ${cls}`}>{value}</div>
      {sub && <div className={styles.metricSub}>{sub}</div>}
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================
function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? "").join("");
}

function formatMv(v: number): string {
  if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `€${(v / 1_000).toFixed(0)}k`;
  return `€${v}`;
}

function calcAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function formatDob(dob: string): string {
  return dob.slice(0, 10);
}

function formatDate(d: string): string {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toISOString().slice(0, 10);
}

function formatTs(ts: number): string {
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

function prettyFoot(sfFoot: string | null, tmFoot: string | null): string {
  const s = (sfFoot || "").toLowerCase();
  const t = (tmFoot || "").toLowerCase();
  if (s && t && s.charAt(0) !== t.charAt(0)) return `SF: ${cap(sfFoot!)} ⚠ TM: ${cap(tmFoot!)}`;
  return cap(sfFoot ?? tmFoot ?? "—");
}

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function pct(v: number): string {
  return `${v.toFixed(1)}%`;
}

function ratingAccent(r: number | null): "elite" | "good" | undefined {
  if (r == null) return undefined;
  if (r >= 7.5) return "elite";
  if (r >= 7.0) return "good";
  return undefined;
}

function cvLabel(cv: number): string {
  if (cv < 0.1) return "стабильный";
  if (cv < 0.2) return "умеренная вариативность";
  if (cv < 0.3) return "средняя";
  return "высокая";
}
