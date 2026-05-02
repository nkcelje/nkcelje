import { db, schema } from "./client";
import { eq, and, desc, sql } from "drizzle-orm";

const { sfPlayers, sfTeams, sfPlayerSeasonStats, sfSeasons, tmPlayers, playerIdMap } = schema;

// ----------------------------------------------------------------------------
// Team
// ----------------------------------------------------------------------------
export function getTeam(teamId: number) {
  return db.select().from(sfTeams).where(eq(sfTeams.teamId, teamId)).get();
}

export function getTeamRoster(teamId: number) {
  return db.select().from(sfPlayers).where(eq(sfPlayers.currentTeamId, teamId)).all();
}

// ----------------------------------------------------------------------------
// Player
// ----------------------------------------------------------------------------
export function getPlayer(playerId: number) {
  return db.select().from(sfPlayers).where(eq(sfPlayers.playerId, playerId)).get();
}

export function getPlayerWithTm(playerId: number) {
  const sf = getPlayer(playerId);
  if (!sf) return null;
  const map = db
    .select()
    .from(playerIdMap)
    .where(eq(playerIdMap.sfId, playerId))
    .get();
  const tm = map?.tmId
    ? db.select().from(tmPlayers).where(eq(tmPlayers.tmId, map.tmId)).get()
    : null;
  return { sf, tm };
}

export function getPlayerSeasonStats(playerId: number, utId?: number, seasonId?: number) {
  const conditions = [eq(sfPlayerSeasonStats.playerId, playerId)];
  if (utId !== undefined) conditions.push(eq(sfPlayerSeasonStats.utId, utId));
  if (seasonId !== undefined) conditions.push(eq(sfPlayerSeasonStats.seasonId, seasonId));
  return db
    .select()
    .from(sfPlayerSeasonStats)
    .where(and(...conditions))
    .all();
}

// ----------------------------------------------------------------------------
// Seasons
// ----------------------------------------------------------------------------
export function getCurrentSeason(utId: number) {
  return (
    db
      .select()
      .from(sfSeasons)
      .where(and(eq(sfSeasons.utId, utId), eq(sfSeasons.isCurrent, true)))
      .get() ??
    db
      .select()
      .from(sfSeasons)
      .where(eq(sfSeasons.utId, utId))
      .orderBy(desc(sfSeasons.year))
      .get()
  );
}

// ============================================================================
// Player profile (full)
// ============================================================================
export interface PlayerMatchAggregate {
  matches: number;
  minutes: number;
  goals: number;
  assists: number;
  xG: number;          // sum of expected_goals
  xA: number;          // sum of expected_assists
  npxG: number;        // xG excluding penalties (from sf_shots)
  bigChanceCreated: number;
  bigChanceMissed: number;
  shots: number;
  shotsOnTarget: number;
  keyPasses: number;
  touches: number;
  tackles: number;
  tacklesWon: number;
  interceptions: number;
  duelsWon: number;
  duelsLost: number;
  aerialWon: number;
  aerialLost: number;
  totalCross: number;
  accurateCross: number;
  accurateOppositionHalfPasses: number;
  totalOppositionHalfPasses: number;
  // per 90
  per90: {
    xG: number;
    xA: number;
    npxG: number;
    keyPasses: number;
    touches: number;
    tackles: number;
    interceptions: number;
  };
  // last N matches series
  recentMatches: Array<{
    eventId: number;
    timestamp: number | null;
    isHome: boolean;
    opponent: string | null;
    score: string | null;
    minutes: number | null;
    rating: number | null;
    xG: number | null;
    xA: number | null;
    goals: number | null;
    assists: number | null;
  }>;
  shotsBySituation: Array<{ situation: string; count: number; xg: number; goals: number }>;
}

export interface PlayerProfile {
  sf: any | null;
  tm: any | null;
  positionsDetailed: string[];
  citizenship: string[];
  attributes: {
    player: { attacking: number; technical: number; tactical: number; defending: number; creativity: number; position: string | null } | null;
    average: { attacking: number; technical: number; tactical: number; defending: number; creativity: number; position: string | null } | null;
  };
  currentSeason: {
    season: { seasonId: number; year: string; name: string; utId: number } | null;
    tournament: { name: string; tier: number | null } | null;
    stats: any | null;
  };
  careerSeasons: Array<{
    seasonId: number;
    year: string;
    seasonName: string;
    utId: number;
    tournamentName: string;
    teamId: number | null;
    appearances: number | null;
    minutesPlayed: number | null;
    rating: number | null;
    goals: number | null;
    assists: number | null;
  }>;
  marketValueHistory: Array<{
    date: string;
    age: number | null;
    clubId: string | null;
    clubName: string | null;
    marketValue: number | null;
  }>;
  transfers: Array<{
    date: string | null;
    season: string | null;
    from: { id: string | null; name: string | null };
    to: { id: string | null; name: string | null };
    fee: number | null;
    marketValue: number | null;
  }>;
  injuries: Array<{
    season: string | null;
    injury: string | null;
    fromDate: string | null;
    untilDate: string | null;
    days: number | null;
    gamesMissed: number | null;
  }>;
  achievements: Array<{
    title: string;
    season: string | null;
    seasonName: string | null;
    clubName: string | null;
  }>;
  matchRatings: Array<{ timestamp: number; rating: number; utId: number | null }>;
  ratingStats: { n: number; mean: number; stdev: number; min: number; max: number; cv: number } | null;
  derivedRisks: {
    injuryDaysLast24Months: number;
    riskInjury: number;
    riskVolatility: number;
  };
  matchAggregate: PlayerMatchAggregate | null;
}

export function getPlayerIds(): number[] {
  // For generateStaticParams — all current Celje player IDs
  const SF_TEAM = 2413;
  const rows = db.all<{ player_id: number }>(
    sql`SELECT player_id FROM sf_players WHERE current_team_id = ${SF_TEAM}`,
  );
  return rows.map((r) => r.player_id);
}

export function getPlayerProfile(playerId: number): PlayerProfile | null {
  const sf = db.get<any>(sql`SELECT * FROM sf_players WHERE player_id = ${playerId}`);
  if (!sf) return null;

  const idMap = db.get<any>(sql`SELECT * FROM player_id_map WHERE sf_id = ${playerId}`);
  const tmId = idMap?.tm_id ?? null;

  const tm = tmId ? db.get<any>(sql`SELECT * FROM tm_players WHERE tm_id = ${tmId}`) : null;

  const positionsDetailed = sf.positions_detailed ? safeJsonArray(sf.positions_detailed) : [];
  const citizenship = tm?.citizenship ? safeJsonArray(tm.citizenship) : [];

  // Attribute overviews
  const playerAttr = db.get<any>(
    sql`SELECT * FROM sf_player_attribute_overviews
        WHERE player_id = ${playerId} AND year_shift = 0 AND is_average = 0 LIMIT 1`,
  );
  const averageAttr = db.get<any>(
    sql`SELECT * FROM sf_player_attribute_overviews
        WHERE player_id = ${playerId} AND year_shift = 0 AND is_average = 1 LIMIT 1`,
  );

  // Current season stats
  const currentSeasonRow = db.get<any>(
    sql`SELECT s.season_id, s.year, s.name, s.ut_id, t.name AS tournament_name, t.tier
        FROM sf_seasons s
        JOIN sf_tournaments t ON t.ut_id = s.ut_id
        WHERE s.is_current = 1
        ORDER BY s.season_id DESC LIMIT 1`,
  );
  const currentSeasonStats = currentSeasonRow
    ? db.get<any>(
        sql`SELECT * FROM sf_player_season_stats
            WHERE player_id = ${playerId} AND ut_id = ${currentSeasonRow.ut_id}
              AND season_id = ${currentSeasonRow.season_id}`,
      ) ?? null
    : null;

  // Career: all sf_player_season_stats rows for this player
  const careerSeasonsRaw = db.all<any>(
    sql`SELECT
          pss.season_id, pss.ut_id, pss.team_id,
          pss.appearances, pss.minutes_played, pss.rating, pss.goals, pss.assists,
          s.year AS season_year, s.name AS season_name,
          t.name AS tournament_name
        FROM sf_player_season_stats pss
        JOIN sf_seasons s ON s.season_id = pss.season_id
        JOIN sf_tournaments t ON t.ut_id = pss.ut_id
        WHERE pss.player_id = ${playerId}
        ORDER BY pss.season_id DESC`,
  );

  // TM-driven data (only if mapped)
  const mvHistory = tmId
    ? db.all<any>(
        sql`SELECT date, age, club_id, club_name, market_value
            FROM tm_market_values WHERE tm_id = ${tmId} ORDER BY date ASC`,
      )
    : [];
  const transfers = tmId
    ? db.all<any>(
        sql`SELECT date, season, club_from_id, club_from_name, club_to_id, club_to_name, fee, market_value
            FROM tm_transfers WHERE tm_id = ${tmId} ORDER BY date DESC`,
      )
    : [];
  const injuries = tmId
    ? db.all<any>(
        sql`SELECT season, injury, from_date, until_date, days, games_missed
            FROM tm_injuries WHERE tm_id = ${tmId} ORDER BY from_date DESC`,
      )
    : [];
  const achievements = tmId
    ? db.all<any>(
        sql`SELECT title, season, season_name, club_name
            FROM tm_achievements WHERE tm_id = ${tmId} ORDER BY season DESC`,
      )
    : [];

  // Match ratings
  const matchRatings = db.all<any>(
    sql`SELECT timestamp, rating, ut_id FROM sf_player_match_ratings
        WHERE player_id = ${playerId} ORDER BY timestamp DESC`,
  );

  // CV calculation
  let ratingStats: PlayerProfile["ratingStats"] = null;
  if (matchRatings.length >= 5) {
    const xs = matchRatings.map((r) => r.rating);
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    const variance = xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (xs.length - 1);
    const stdev = Math.sqrt(variance);
    ratingStats = {
      n: xs.length,
      mean,
      stdev,
      min: Math.min(...xs),
      max: Math.max(...xs),
      cv: stdev / mean,
    };
  }

  // Per-match aggregate (xG/xA/touches/tackles from sf_player_match_stats)
  const matchAggregate = computeMatchAggregate(playerId);

  // Derived risks (methodology §9)
  const now = Date.now();
  const cutoff24mo = now - 24 * 30 * 86400 * 1000;
  const injuryDaysLast24Months = injuries.reduce((acc, inj) => {
    if (!inj.from_date) return acc;
    const t = new Date(inj.from_date).getTime();
    if (isNaN(t) || t < cutoff24mo) return acc;
    return acc + (inj.days ?? 0);
  }, 0);
  const riskInjury = Math.min(1, injuryDaysLast24Months / 200);
  const riskVolatility = ratingStats
    ? Math.max(0, (ratingStats.cv - 0.1) / 0.3)
    : 0;

  return {
    sf,
    tm,
    positionsDetailed,
    citizenship,
    attributes: {
      player: playerAttr
        ? {
            attacking: playerAttr.attacking,
            technical: playerAttr.technical,
            tactical: playerAttr.tactical,
            defending: playerAttr.defending,
            creativity: playerAttr.creativity,
            position: playerAttr.position,
          }
        : null,
      average: averageAttr
        ? {
            attacking: averageAttr.attacking,
            technical: averageAttr.technical,
            tactical: averageAttr.tactical,
            defending: averageAttr.defending,
            creativity: averageAttr.creativity,
            position: averageAttr.position,
          }
        : null,
    },
    currentSeason: {
      season: currentSeasonRow
        ? {
            seasonId: currentSeasonRow.season_id,
            year: currentSeasonRow.year,
            name: currentSeasonRow.name,
            utId: currentSeasonRow.ut_id,
          }
        : null,
      tournament: currentSeasonRow
        ? { name: currentSeasonRow.tournament_name, tier: currentSeasonRow.tier ?? null }
        : null,
      stats: currentSeasonStats,
    },
    careerSeasons: careerSeasonsRaw.map((r) => ({
      seasonId: r.season_id,
      year: r.season_year,
      seasonName: r.season_name,
      utId: r.ut_id,
      tournamentName: r.tournament_name,
      teamId: r.team_id,
      appearances: r.appearances,
      minutesPlayed: r.minutes_played,
      rating: r.rating,
      goals: r.goals,
      assists: r.assists,
    })),
    marketValueHistory: mvHistory.map((m) => ({
      date: m.date,
      age: m.age,
      clubId: m.club_id,
      clubName: m.club_name,
      marketValue: m.market_value,
    })),
    transfers: transfers.map((t) => ({
      date: t.date,
      season: t.season,
      from: { id: t.club_from_id, name: t.club_from_name },
      to: { id: t.club_to_id, name: t.club_to_name },
      fee: t.fee,
      marketValue: t.market_value,
    })),
    injuries: injuries.map((i) => ({
      season: i.season,
      injury: i.injury,
      fromDate: i.from_date,
      untilDate: i.until_date,
      days: i.days,
      gamesMissed: i.games_missed,
    })),
    achievements: achievements.map((a) => ({
      title: a.title,
      season: a.season,
      seasonName: a.season_name,
      clubName: a.club_name,
    })),
    matchRatings: matchRatings.map((r) => ({
      timestamp: r.timestamp,
      rating: r.rating,
      utId: r.ut_id,
    })),
    ratingStats,
    derivedRisks: {
      injuryDaysLast24Months,
      riskInjury,
      riskVolatility,
    },
    matchAggregate,
  };
}

// ============================================================================
// NK Celje overview + roster
// ============================================================================
export interface CeljeOverview {
  sf: {
    teamId: number;
    name: string;
    shortName: string | null;
    nameCode: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    textColor: string | null;
    userCount: number | null;
  } | null;
  tm: {
    name: string;
    officialName: string | null;
    imageUrl: string | null;
    foundedOn: string | null;
    stadiumName: string | null;
    stadiumSeats: number | null;
    currentMarketValue: number | null;
    leagueName: string | null;
    leagueCountryName: string | null;
    leagueTier: string | null;
    squadSize: number | null;
    squadAverageAge: number | null;
    squadForeigners: number | null;
    squadNationalTeamPlayers: number | null;
  } | null;
  season: {
    seasonId: number;
    year: string;
    name: string;
  } | null;
  teamStats: {
    matches: number | null;
    goalsScored: number | null;
    goalsConceded: number | null;
    cleanSheets: number | null;
    averageBallPossession: number | null;
    accuratePassesPercentage: number | null;
    accurateLongBallsPercentage: number | null;
    accurateCrossesPercentage: number | null;
    successfulDribbles: number | null;
    interceptions: number | null;
    duelsWonPercentage: number | null;
    aerialDuelsWonPercentage: number | null;
    yellowCards: number | null;
    redCards: number | null;
    fouls: number | null;
  } | null;
  elo: {
    elo: number;
    fromDate: string;
    toDate: string;
    level: number | null;
  } | null;
}

export function getCeljeOverview(): CeljeOverview {
  const SF_TEAM = 2413;
  const SF_UT = 212;
  const TM_CLUB = "710";

  const sf = db.get<any>(sql`SELECT * FROM sf_teams WHERE team_id = ${SF_TEAM}`);
  const tm = db.get<any>(sql`SELECT * FROM tm_clubs WHERE tm_id = ${TM_CLUB}`);
  const season = db.get<any>(
    sql`SELECT * FROM sf_seasons WHERE ut_id = ${SF_UT} AND is_current = 1 LIMIT 1`,
  );

  let teamStats: CeljeOverview["teamStats"] = null;
  if (season) {
    teamStats = db.get<any>(
      sql`SELECT * FROM sf_team_league_stats
          WHERE team_id = ${SF_TEAM} AND ut_id = ${SF_UT} AND season_id = ${season.season_id}`,
    ) ?? null;
  }

  const elo = db.get<any>(
    sql`SELECT elo, level, from_date AS fromDate, to_date AS toDate
        FROM elo_team_history WHERE team_name = 'Celje' ORDER BY to_date DESC LIMIT 1`,
  );

  return {
    sf: sf
      ? {
          teamId: sf.team_id,
          name: sf.name,
          shortName: sf.short_name,
          nameCode: sf.name_code,
          primaryColor: sf.primary_color,
          secondaryColor: sf.secondary_color,
          textColor: sf.text_color,
          userCount: sf.user_count,
        }
      : null,
    tm: tm
      ? {
          name: tm.name,
          officialName: tm.official_name,
          imageUrl: tm.image_url,
          foundedOn: tm.founded_on,
          stadiumName: tm.stadium_name,
          stadiumSeats: tm.stadium_seats,
          currentMarketValue: tm.current_market_value,
          leagueName: tm.league_name,
          leagueCountryName: tm.league_country_name,
          leagueTier: tm.league_tier,
          squadSize: tm.squad_size,
          squadAverageAge: tm.squad_average_age,
          squadForeigners: tm.squad_foreigners,
          squadNationalTeamPlayers: tm.squad_national_team_players,
        }
      : null,
    season: season
      ? { seasonId: season.season_id, year: season.year, name: season.name }
      : null,
    teamStats: teamStats
      ? {
          matches: (teamStats as any).matches,
          goalsScored: (teamStats as any).goals_scored,
          goalsConceded: (teamStats as any).goals_conceded,
          cleanSheets: (teamStats as any).clean_sheets,
          averageBallPossession: (teamStats as any).average_ball_possession,
          accuratePassesPercentage: (teamStats as any).accurate_passes_percentage,
          accurateLongBallsPercentage: (teamStats as any).accurate_long_balls_percentage,
          accurateCrossesPercentage: (teamStats as any).accurate_crosses_percentage,
          successfulDribbles: (teamStats as any).successful_dribbles,
          interceptions: (teamStats as any).interceptions,
          duelsWonPercentage: (teamStats as any).duels_won_percentage,
          aerialDuelsWonPercentage: (teamStats as any).aerial_duels_won_percentage,
          yellowCards: (teamStats as any).yellow_cards,
          redCards: (teamStats as any).red_cards,
          fouls: (teamStats as any).fouls,
        }
      : null,
    elo: elo ? { elo: elo.elo, fromDate: elo.fromDate, toDate: elo.toDate, level: elo.level } : null,
  };
}

export interface RosterPlayer {
  playerId: number;
  name: string;
  positionGroup: string | null; // G/D/M/F
  positionsDetailed: string[]; // ["RW", "LW"]
  jerseyNumber: number | null;
  height: number | null;
  preferredFoot: string | null;
  dateOfBirth: string | null;
  age: number | null;
  imageUrl: string | null;
  // From TM
  tmId: string | null;
  tmPositionMain: string | null;
  marketValue: number | null;
  contractExpires: string | null;
  citizenship: string[];
  // Season stats
  appearances: number | null;
  matchesStarted: number | null;
  minutesPlayed: number | null;
  rating: number | null;
  goals: number | null;
  assists: number | null;
  goalsAssistsSum: number | null;
  // Active injury (optional)
  currentInjury: string | null;
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

export function getCeljeRoster(): RosterPlayer[] {
  const SF_TEAM = 2413;
  const SF_UT = 212;
  const today = new Date().toISOString().slice(0, 10);

  const rows = db.all<any>(sql`
    SELECT
      sp.player_id, sp.name, sp.position AS pos_group, sp.positions_detailed,
      sp.height, sp.preferred_foot, sp.jersey_number, sp.date_of_birth,
      pim.tm_id,
      tm.market_value AS tm_mv, tm.club_contract_expires, tm.image_url, tm.shirt_number AS tm_shirt_number,
      tm.position_main AS tm_pos, tm.citizenship AS tm_citizenship,
      pss.appearances, pss.matches_started, pss.minutes_played, pss.rating,
      pss.goals, pss.assists, pss.goals_assists_sum,
      sea.season_id AS sea_id,
      (SELECT inj.injury FROM tm_injuries inj
        WHERE inj.tm_id = pim.tm_id
          AND inj.from_date <= ${today}
          AND (inj.until_date IS NULL OR inj.until_date >= ${today})
        ORDER BY inj.from_date DESC LIMIT 1) AS current_injury
    FROM sf_players sp
    LEFT JOIN player_id_map pim ON pim.sf_id = sp.player_id
    LEFT JOIN tm_players tm ON tm.tm_id = pim.tm_id
    LEFT JOIN sf_seasons sea ON sea.ut_id = ${SF_UT} AND sea.is_current = 1
    LEFT JOIN sf_player_season_stats pss
      ON pss.player_id = sp.player_id AND pss.ut_id = ${SF_UT} AND pss.season_id = sea.season_id
    WHERE sp.current_team_id = ${SF_TEAM}
    ORDER BY pss.minutes_played DESC NULLS LAST, sp.name
  `);

  return rows.map((r) => ({
    playerId: r.player_id,
    name: r.name,
    positionGroup: r.pos_group,
    positionsDetailed: r.positions_detailed ? safeJsonArray(r.positions_detailed) : [],
    jerseyNumber: parseJersey(r.tm_shirt_number, r.jersey_number),
    height: r.height,
    preferredFoot: r.preferred_foot,
    dateOfBirth: r.date_of_birth,
    age: calcAge(r.date_of_birth),
    imageUrl: r.image_url,
    tmId: r.tm_id,
    tmPositionMain: r.tm_pos,
    marketValue: r.tm_mv,
    contractExpires: r.club_contract_expires,
    citizenship: r.tm_citizenship ? safeJsonArray(r.tm_citizenship) : [],
    appearances: r.appearances,
    matchesStarted: r.matches_started,
    minutesPlayed: r.minutes_played,
    rating: r.rating,
    goals: r.goals,
    assists: r.assists,
    goalsAssistsSum: r.goals_assists_sum,
    currentInjury: r.current_injury,
  }));
}

function computeMatchAggregate(playerId: number): PlayerMatchAggregate | null {
  const SF_TEAM = 2413;

  const totals = db.get<any>(sql`
    SELECT
      COUNT(*) AS matches,
      COALESCE(SUM(minutes_played), 0) AS minutes,
      COALESCE(SUM(goals), 0) AS goals,
      COALESCE(SUM(goal_assist), 0) AS assists,
      COALESCE(SUM(expected_goals), 0) AS xg,
      COALESCE(SUM(expected_assists), 0) AS xa,
      COALESCE(SUM(big_chance_created), 0) AS bcc,
      COALESCE(SUM(big_chance_missed), 0) AS bcm,
      COALESCE(SUM(total_shots), 0) AS shots,
      COALESCE(SUM(on_target_scoring_attempt), 0) AS sot,
      COALESCE(SUM(key_pass), 0) AS kp,
      COALESCE(SUM(touches), 0) AS touches,
      COALESCE(SUM(total_tackle), 0) AS tackles,
      COALESCE(SUM(won_tackle), 0) AS tackles_won,
      COALESCE(SUM(interception_won), 0) AS interceptions,
      COALESCE(SUM(duel_won), 0) AS duels_won,
      COALESCE(SUM(duel_lost), 0) AS duels_lost,
      COALESCE(SUM(aerial_won), 0) AS aerial_won,
      COALESCE(SUM(aerial_lost), 0) AS aerial_lost,
      COALESCE(SUM(total_cross), 0) AS cross_total,
      COALESCE(SUM(accurate_cross), 0) AS cross_acc,
      COALESCE(SUM(accurate_opposition_half_passes), 0) AS opp_half_acc,
      COALESCE(SUM(total_opposition_half_passes), 0) AS opp_half_total
    FROM sf_player_match_stats
    WHERE player_id = ${playerId} AND team_id = ${SF_TEAM}
  `);

  if (!totals || totals.matches === 0) return null;

  // npxG: sum of xg from sf_shots excluding penalties
  const npx = db.get<{ npxg: number }>(sql`
    SELECT COALESCE(SUM(xg), 0) AS npxg FROM sf_shots
    WHERE player_id = ${playerId} AND (situation IS NULL OR situation != 'penalty')
  `);
  const npxG = npx?.npxg ?? 0;

  const minutes = totals.minutes || 0;
  const n90 = minutes > 0 ? minutes / 90 : 1;

  // Last N match rows + opponent name + final score
  const recentMatches = db.all<any>(sql`
    SELECT
      pms.event_id, pms.minutes_played, pms.rating,
      pms.expected_goals AS xg, pms.expected_assists AS xa,
      pms.goals, pms.goal_assist AS assists, pms.is_home,
      e.start_timestamp,
      e.home_score, e.away_score,
      ht.name AS home_name, at.name AS away_name
    FROM sf_player_match_stats pms
    JOIN sf_events e ON e.event_id = pms.event_id
    LEFT JOIN sf_teams ht ON ht.team_id = e.home_team_id
    LEFT JOIN sf_teams at ON at.team_id = e.away_team_id
    WHERE pms.player_id = ${playerId} AND pms.team_id = ${SF_TEAM}
    ORDER BY e.start_timestamp DESC
    LIMIT 12
  `);

  const recent = recentMatches.map((r) => ({
    eventId: r.event_id,
    timestamp: r.start_timestamp,
    isHome: !!r.is_home,
    opponent: r.is_home ? r.away_name : r.home_name,
    score:
      r.home_score != null && r.away_score != null
        ? r.is_home
          ? `${r.home_score}-${r.away_score}`
          : `${r.away_score}-${r.home_score}`
        : null,
    minutes: r.minutes_played,
    rating: r.rating,
    xG: r.xg,
    xA: r.xa,
    goals: r.goals,
    assists: r.assists,
  }));

  // Shots breakdown by situation (NK Celje player)
  const shotsBySit = db.all<any>(sql`
    SELECT
      COALESCE(situation, 'unknown') AS situation,
      COUNT(*) AS count,
      COALESCE(SUM(xg), 0) AS xg,
      COALESCE(SUM(CASE WHEN shot_type = 'goal' THEN 1 ELSE 0 END), 0) AS goals
    FROM sf_shots
    WHERE player_id = ${playerId}
    GROUP BY situation
    ORDER BY count DESC
  `);

  return {
    matches: totals.matches,
    minutes,
    goals: totals.goals,
    assists: totals.assists,
    xG: totals.xg,
    xA: totals.xa,
    npxG,
    bigChanceCreated: totals.bcc,
    bigChanceMissed: totals.bcm,
    shots: totals.shots,
    shotsOnTarget: totals.sot,
    keyPasses: totals.kp,
    touches: totals.touches,
    tackles: totals.tackles,
    tacklesWon: totals.tackles_won,
    interceptions: totals.interceptions,
    duelsWon: totals.duels_won,
    duelsLost: totals.duels_lost,
    aerialWon: totals.aerial_won,
    aerialLost: totals.aerial_lost,
    totalCross: totals.cross_total,
    accurateCross: totals.cross_acc,
    accurateOppositionHalfPasses: totals.opp_half_acc,
    totalOppositionHalfPasses: totals.opp_half_total,
    per90: {
      xG: totals.xg / n90,
      xA: totals.xa / n90,
      npxG: npxG / n90,
      keyPasses: totals.kp / n90,
      touches: totals.touches / n90,
      tackles: totals.tackles / n90,
      interceptions: totals.interceptions / n90,
    },
    recentMatches: recent,
    shotsBySituation: shotsBySit.map((s) => ({
      situation: s.situation,
      count: s.count,
      xg: s.xg,
      goals: s.goals,
    })),
  };
}

// Transfermarkt stores jersey numbers as "#20"; Sofascore as plain int (often null).
function parseJersey(tmShirt: string | null, sfNumber: number | null): number | null {
  if (tmShirt) {
    const digits = tmShirt.replace(/\D+/g, "");
    if (digits) {
      const n = parseInt(digits, 10);
      if (!isNaN(n)) return n;
    }
  }
  return sfNumber ?? null;
}

function safeJsonArray(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

// ----------------------------------------------------------------------------
// DB health
// ----------------------------------------------------------------------------
export function dbHealth() {
  const tables = db.all<{ name: string }>(
    sql`SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name`,
  );
  const counts: Record<string, number> = {};
  for (const t of tables) {
    if (t.name.startsWith("__") || t.name === "sqlite_sequence") continue;
    const c = db.get<{ n: number }>(sql.raw(`SELECT COUNT(*) AS n FROM ${t.name}`));
    counts[t.name] = c?.n ?? 0;
  }
  return counts;
}
