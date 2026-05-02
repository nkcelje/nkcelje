import { sqliteTable, text, integer, real, primaryKey, index } from "drizzle-orm/sqlite-core";

// ============================================================================
// Layer 1 — Raw API cache
// ============================================================================
export const apiCache = sqliteTable(
  "api_cache",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    source: text("source").notNull(), // "sofascore" | "transfermarkt" | "clubelo"
    url: text("url").notNull(),
    fetchedAt: integer("fetched_at").notNull(), // unix seconds
    httpStatus: integer("http_status").notNull(),
    responseJson: text("response_json").notNull(), // raw JSON string
  },
  (t) => ({
    sourceUrlIdx: index("api_cache_source_url_idx").on(t.source, t.url),
    fetchedIdx: index("api_cache_fetched_idx").on(t.fetchedAt),
  }),
);

// ============================================================================
// Layer 2 — Sofascore normalized
// ============================================================================
export const sfTournaments = sqliteTable("sf_tournaments", {
  utId: integer("ut_id").primaryKey(), // unique-tournament id
  name: text("name").notNull(),
  slug: text("slug"),
  countryCode: text("country_code"),
  countryName: text("country_name"),
  // optional methodology mapping
  tier: real("tier"), // 1.0 .. 4.0 from methodology §4.1
});

export const sfSeasons = sqliteTable(
  "sf_seasons",
  {
    seasonId: integer("season_id").primaryKey(),
    utId: integer("ut_id")
      .notNull()
      .references(() => sfTournaments.utId),
    year: text("year").notNull(), // "25/26"
    name: text("name").notNull(), // "PrvaLiga 25/26"
    isCurrent: integer("is_current", { mode: "boolean" }).default(false),
  },
  (t) => ({
    utIdx: index("sf_seasons_ut_idx").on(t.utId),
  }),
);

export const sfTeams = sqliteTable("sf_teams", {
  teamId: integer("team_id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug"),
  shortName: text("short_name"),
  nameCode: text("name_code"), // 3-letter
  countryCode: text("country_code"),
  countryName: text("country_name"),
  primaryColor: text("primary_color"),
  secondaryColor: text("secondary_color"),
  textColor: text("text_color"),
  isNational: integer("is_national", { mode: "boolean" }).default(false),
  userCount: integer("user_count"),
});

export const sfPlayers = sqliteTable(
  "sf_players",
  {
    playerId: integer("player_id").primaryKey(),
    name: text("name").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    slug: text("slug"),
    shortName: text("short_name"),
    position: text("position"), // group: M/F/D/G
    positionsDetailed: text("positions_detailed"), // JSON array as string
    jerseyNumber: integer("jersey_number"),
    height: integer("height"), // cm
    weight: integer("weight"), // kg, often null
    dateOfBirth: text("date_of_birth"), // ISO date
    dateOfBirthTimestamp: integer("date_of_birth_timestamp"),
    preferredFoot: text("preferred_foot"), // Left/Right/Both
    countryCode: text("country_code"),
    countryName: text("country_name"),
    contractUntilTimestamp: integer("contract_until_timestamp"),
    proposedMarketValue: integer("proposed_market_value"), // EUR
    marketValueCurrency: text("market_value_currency"),
    currentTeamId: integer("current_team_id").references(() => sfTeams.teamId),
    userCount: integer("user_count"),
    fetchedAt: integer("fetched_at"),
  },
  (t) => ({
    teamIdx: index("sf_players_team_idx").on(t.currentTeamId),
    nameIdx: index("sf_players_name_idx").on(t.name),
  }),
);

// 58 fields per-season player stats (see §1.8 of api_endpoints_reference.md)
export const sfPlayerSeasonStats = sqliteTable(
  "sf_player_season_stats",
  {
    playerId: integer("player_id")
      .notNull()
      .references(() => sfPlayers.playerId),
    utId: integer("ut_id")
      .notNull()
      .references(() => sfTournaments.utId),
    seasonId: integer("season_id")
      .notNull()
      .references(() => sfSeasons.seasonId),
    teamId: integer("team_id").references(() => sfTeams.teamId),

    // playing time
    rating: real("rating"),
    appearances: integer("appearances"),
    matchesStarted: integer("matches_started"),
    minutesPlayed: integer("minutes_played"),
    substitutionsIn: integer("substitutions_in"),
    substitutionsOut: integer("substitutions_out"),

    // attack
    goals: integer("goals"),
    assists: integer("assists"),
    goalsAssistsSum: integer("goals_assists_sum"),
    totalShots: integer("total_shots"),
    shotsOnTarget: integer("shots_on_target"),
    goalConversionPercentage: real("goal_conversion_percentage"),
    scoringFrequency: real("scoring_frequency"),
    shotFromSetPiece: integer("shot_from_set_piece"),
    penaltiesTaken: integer("penalties_taken"),
    penaltyGoals: integer("penalty_goals"),
    penaltyConversion: real("penalty_conversion"),
    offsides: integer("offsides"),

    // passing
    totalPasses: integer("total_passes"),
    accuratePasses: integer("accurate_passes"),
    inaccuratePasses: integer("inaccurate_passes"),
    accuratePassesPercentage: real("accurate_passes_percentage"),
    accurateFinalThirdPasses: integer("accurate_final_third_passes"),
    keyPasses: integer("key_passes"),
    passToAssist: integer("pass_to_assist"),
    totalLongBalls: integer("total_long_balls"),
    accurateLongBalls: integer("accurate_long_balls"),
    accurateLongBallsPercentage: real("accurate_long_balls_percentage"),

    // crosses
    totalCross: integer("total_cross"),
    accurateCrosses: integer("accurate_crosses"),
    accurateCrossesPercentage: real("accurate_crosses_percentage"),

    // dribbling
    successfulDribbles: integer("successful_dribbles"),
    successfulDribblesPercentage: real("successful_dribbles_percentage"),

    // duels
    totalDuelsWon: integer("total_duels_won"),
    totalDuelsWonPercentage: real("total_duels_won_percentage"),
    duelLost: integer("duel_lost"),
    aerialDuelsWon: integer("aerial_duels_won"),
    aerialDuelsWonPercentage: real("aerial_duels_won_percentage"),
    aerialLost: integer("aerial_lost"),

    // defending
    ballRecovery: integer("ball_recovery"),
    clearances: integer("clearances"),
    blockedShots: integer("blocked_shots"),
    dribbledPast: integer("dribbled_past"),
    errorLeadToShot: integer("error_lead_to_shot"),

    // discipline
    yellowCards: integer("yellow_cards"),
    redCards: integer("red_cards"),
    directRedCards: integer("direct_red_cards"),
    yellowRedCards: integer("yellow_red_cards"),
    fouls: integer("fouls"),
    wasFouled: integer("was_fouled"),

    // GK-specific (zero for outfielders)
    saves: integer("saves"),
    cleanSheet: integer("clean_sheet"),
    crossesNotClaimed: integer("crosses_not_claimed"),
    goalsConceded: integer("goals_conceded"),
    goalKicks: integer("goal_kicks"),

    fetchedAt: integer("fetched_at"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.playerId, t.utId, t.seasonId] }),
    playerIdx: index("sfpss_player_idx").on(t.playerId),
    seasonIdx: index("sfpss_season_idx").on(t.utId, t.seasonId),
  }),
);

// 45 fields per-match player stats (see §1.7) — has xG/xA, tackles, interceptions, touches
export const sfPlayerMatchStats = sqliteTable(
  "sf_player_match_stats",
  {
    playerId: integer("player_id")
      .notNull()
      .references(() => sfPlayers.playerId),
    eventId: integer("event_id").notNull().references(() => sfEvents.eventId),

    teamId: integer("team_id").references(() => sfTeams.teamId),
    isHome: integer("is_home", { mode: "boolean" }),
    position: text("position"),
    isSubstitute: integer("is_substitute", { mode: "boolean" }),
    isCaptain: integer("is_captain", { mode: "boolean" }),

    minutesPlayed: integer("minutes_played"),
    rating: real("rating"),

    // attack
    goals: integer("goals"),
    goalAssist: integer("goal_assist"),
    totalShots: integer("total_shots"),
    onTargetScoringAttempt: integer("on_target_scoring_attempt"),
    shotOffTarget: integer("shot_off_target"),
    expectedGoals: real("expected_goals"), // ⭐ xG
    expectedAssists: real("expected_assists"), // ⭐ xA
    bigChanceCreated: integer("big_chance_created"),
    bigChanceMissed: integer("big_chance_missed"),

    // passing
    totalPass: integer("total_pass"),
    accuratePass: integer("accurate_pass"),
    totalLongBalls: integer("total_long_balls"),
    accurateLongBalls: integer("accurate_long_balls"),
    totalCross: integer("total_cross"),
    accurateCross: integer("accurate_cross"),
    accurateOwnHalfPasses: integer("accurate_own_half_passes"),
    totalOwnHalfPasses: integer("total_own_half_passes"),
    accurateOppositionHalfPasses: integer("accurate_opposition_half_passes"),
    totalOppositionHalfPasses: integer("total_opposition_half_passes"),
    keyPass: integer("key_pass"),

    // dribble / control
    totalContest: integer("total_contest"),
    wonContest: integer("won_contest"),
    unsuccessfulTouch: integer("unsuccessful_touch"),
    possessionLostCtrl: integer("possession_lost_ctrl"),
    touches: integer("touches"),
    dispossessed: integer("dispossessed"),

    // duels / defending
    duelWon: integer("duel_won"),
    duelLost: integer("duel_lost"),
    aerialWon: integer("aerial_won"),
    aerialLost: integer("aerial_lost"),
    challengeLost: integer("challenge_lost"),
    totalTackle: integer("total_tackle"),
    wonTackle: integer("won_tackle"),
    interceptionWon: integer("interception_won"),
    ballRecovery: integer("ball_recovery"),
    totalClearance: integer("total_clearance"),
    outfielderBlock: integer("outfielder_block"),
    errorLeadToAShot: integer("error_lead_to_a_shot"),
    ownGoals: integer("own_goals"),

    // discipline
    wasFouled: integer("was_fouled"),
    fouls: integer("fouls"),
    totalOffside: integer("total_offside"),

    fetchedAt: integer("fetched_at"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.playerId, t.eventId] }),
    eventIdx: index("sfpms_event_idx").on(t.eventId),
    playerIdx: index("sfpms_player_idx").on(t.playerId),
  }),
);

export const sfEvents = sqliteTable(
  "sf_events",
  {
    eventId: integer("event_id").primaryKey(),
    utId: integer("ut_id").references(() => sfTournaments.utId),
    seasonId: integer("season_id").references(() => sfSeasons.seasonId),
    round: integer("round"),
    homeTeamId: integer("home_team_id").references(() => sfTeams.teamId),
    awayTeamId: integer("away_team_id").references(() => sfTeams.teamId),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
    winnerCode: integer("winner_code"), // 1=home 2=away 3=draw
    statusType: text("status_type"), // finished/inprogress
    startTimestamp: integer("start_timestamp"),
    venueName: text("venue_name"),
    refereeName: text("referee_name"),
    attendance: integer("attendance"),
    hasXg: integer("has_xg", { mode: "boolean" }),
    hasEventPlayerStatistics: integer("has_event_player_statistics", { mode: "boolean" }),
    fetchedAt: integer("fetched_at"),
  },
  (t) => ({
    seasonIdx: index("sf_events_season_idx").on(t.utId, t.seasonId),
    homeIdx: index("sf_events_home_idx").on(t.homeTeamId),
    awayIdx: index("sf_events_away_idx").on(t.awayTeamId),
  }),
);

export const sfShots = sqliteTable(
  "sf_shots",
  {
    shotId: integer("shot_id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => sfEvents.eventId),
    playerId: integer("player_id")
      .notNull()
      .references(() => sfPlayers.playerId),
    isHome: integer("is_home", { mode: "boolean" }),
    timeMin: integer("time_min"),
    timeSeconds: integer("time_seconds"),
    shotType: text("shot_type"), // goal/save/miss/block/post
    situation: text("situation"), // regular/fast-break/set-piece/penalty/...
    bodyPart: text("body_part"),
    playerX: real("player_x"),
    playerY: real("player_y"),
    goalMouthLocation: text("goal_mouth_location"),
    goalMouthX: real("goal_mouth_x"),
    goalMouthY: real("goal_mouth_y"),
    goalMouthZ: real("goal_mouth_z"),
    xg: real("xg"),
    xgot: real("xgot"),
    fetchedAt: integer("fetched_at"),
  },
  (t) => ({
    eventIdx: index("sf_shots_event_idx").on(t.eventId),
    playerIdx: index("sf_shots_player_idx").on(t.playerId),
  }),
);

export const sfTeamLeagueStats = sqliteTable(
  "sf_team_league_stats",
  {
    teamId: integer("team_id")
      .notNull()
      .references(() => sfTeams.teamId),
    utId: integer("ut_id")
      .notNull()
      .references(() => sfTournaments.utId),
    seasonId: integer("season_id")
      .notNull()
      .references(() => sfSeasons.seasonId),

    matches: integer("matches"),
    awardedMatches: integer("awarded_matches"),
    goalsScored: integer("goals_scored"),
    goalsConceded: integer("goals_conceded"),
    assists: integer("assists"),
    shots: integer("shots"),
    shotsAgainst: integer("shots_against"),
    penaltyGoals: integer("penalty_goals"),
    penaltiesTaken: integer("penalties_taken"),
    successfulDribbles: integer("successful_dribbles"),
    dribbleAttempts: integer("dribble_attempts"),
    corners: integer("corners"),
    averageBallPossession: real("average_ball_possession"),
    totalPasses: integer("total_passes"),
    accuratePasses: integer("accurate_passes"),
    accuratePassesPercentage: real("accurate_passes_percentage"),
    totalLongBalls: integer("total_long_balls"),
    accurateLongBalls: integer("accurate_long_balls"),
    accurateLongBallsPercentage: real("accurate_long_balls_percentage"),
    totalCrosses: integer("total_crosses"),
    accurateCrosses: integer("accurate_crosses"),
    accurateCrossesPercentage: real("accurate_crosses_percentage"),
    cleanSheets: integer("clean_sheets"),
    interceptions: integer("interceptions"),
    saves: integer("saves"),
    errorsLeadingToShot: integer("errors_leading_to_shot"),
    totalDuels: integer("total_duels"),
    duelsWon: integer("duels_won"),
    duelsWonPercentage: real("duels_won_percentage"),
    totalAerialDuels: integer("total_aerial_duels"),
    aerialDuelsWon: integer("aerial_duels_won"),
    aerialDuelsWonPercentage: real("aerial_duels_won_percentage"),
    offsides: integer("offsides"),
    fouls: integer("fouls"),
    yellowCards: integer("yellow_cards"),
    yellowRedCards: integer("yellow_red_cards"),
    redCards: integer("red_cards"),
    goalKicks: integer("goal_kicks"),
    ballRecovery: integer("ball_recovery"),
    freeKicks: integer("free_kicks"),

    fetchedAt: integer("fetched_at"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.teamId, t.utId, t.seasonId] }),
  }),
);

export const sfPlayerAttributeOverviews = sqliteTable(
  "sf_player_attribute_overviews",
  {
    playerId: integer("player_id")
      .notNull()
      .references(() => sfPlayers.playerId),
    yearShift: integer("year_shift").notNull().default(0), // 0 = current
    isAverage: integer("is_average", { mode: "boolean" }).notNull().default(false),
    position: text("position"),
    attacking: integer("attacking"),
    technical: integer("technical"),
    tactical: integer("tactical"),
    defending: integer("defending"),
    creativity: integer("creativity"),
    fetchedAt: integer("fetched_at"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.playerId, t.yearShift, t.isAverage] }),
  }),
);

// per-match rating series for Risk_volatility
export const sfPlayerMatchRatings = sqliteTable(
  "sf_player_match_ratings",
  {
    playerId: integer("player_id")
      .notNull()
      .references(() => sfPlayers.playerId),
    eventId: integer("event_id").notNull(),
    timestamp: integer("timestamp").notNull(),
    utId: integer("ut_id"),
    rating: real("rating").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.playerId, t.eventId] }),
    playerIdx: index("sfpmr_player_idx").on(t.playerId),
  }),
);

// ============================================================================
// Layer 3 — Transfermarkt (via transfermarkt-api project)
// ============================================================================
export const tmPlayers = sqliteTable("tm_players", {
  tmId: text("tm_id").primaryKey(),
  url: text("url"),
  name: text("name").notNull(),
  fullName: text("full_name"),
  nameInHomeCountry: text("name_in_home_country"),
  imageUrl: text("image_url"),
  dateOfBirth: text("date_of_birth"),
  placeOfBirthCity: text("place_of_birth_city"),
  placeOfBirthCountry: text("place_of_birth_country"),
  age: integer("age"),
  height: integer("height"), // cm
  citizenship: text("citizenship"), // JSON array
  isRetired: integer("is_retired", { mode: "boolean" }),
  positionMain: text("position_main"),
  positionOther: text("position_other"), // JSON array
  foot: text("foot"),
  shirtNumber: text("shirt_number"),
  clubId: text("club_id"),
  clubName: text("club_name"),
  clubJoined: text("club_joined"),
  clubContractExpires: text("club_contract_expires"),
  marketValue: integer("market_value"),
  outfitter: text("outfitter"),
  fetchedAt: integer("fetched_at"),
});

export const tmClubs = sqliteTable("tm_clubs", {
  tmId: text("tm_id").primaryKey(),
  name: text("name").notNull(),
  officialName: text("official_name"),
  url: text("url"),
  imageUrl: text("image_url"),
  foundedOn: text("founded_on"),
  stadiumName: text("stadium_name"),
  stadiumSeats: integer("stadium_seats"),
  currentTransferRecord: integer("current_transfer_record"),
  currentMarketValue: integer("current_market_value"),
  confederation: text("confederation"),
  fifaWorldRanking: integer("fifa_world_ranking"),
  squadSize: integer("squad_size"),
  squadAverageAge: real("squad_average_age"),
  squadForeigners: integer("squad_foreigners"),
  squadNationalTeamPlayers: integer("squad_national_team_players"),
  leagueId: text("league_id"),
  leagueName: text("league_name"),
  leagueCountryName: text("league_country_name"),
  leagueTier: text("league_tier"),
  fetchedAt: integer("fetched_at"),
});

export const tmMarketValues = sqliteTable(
  "tm_market_values",
  {
    tmId: text("tm_id")
      .notNull()
      .references(() => tmPlayers.tmId),
    date: text("date").notNull(),
    age: integer("age"),
    clubId: text("club_id"),
    clubName: text("club_name"),
    marketValue: integer("market_value"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.tmId, t.date] }),
    playerIdx: index("tm_mv_player_idx").on(t.tmId),
  }),
);

export const tmTransfers = sqliteTable(
  "tm_transfers",
  {
    transferId: text("transfer_id").primaryKey(),
    tmId: text("tm_id")
      .notNull()
      .references(() => tmPlayers.tmId),
    clubFromId: text("club_from_id"),
    clubFromName: text("club_from_name"),
    clubToId: text("club_to_id"),
    clubToName: text("club_to_name"),
    date: text("date"),
    season: text("season"),
    upcoming: integer("upcoming", { mode: "boolean" }),
    marketValue: integer("market_value"),
    fee: integer("fee"),
  },
  (t) => ({
    playerIdx: index("tm_tr_player_idx").on(t.tmId),
  }),
);

export const tmInjuries = sqliteTable(
  "tm_injuries",
  {
    injuryId: integer("injury_id").primaryKey({ autoIncrement: true }),
    tmId: text("tm_id")
      .notNull()
      .references(() => tmPlayers.tmId),
    season: text("season"),
    injury: text("injury"),
    fromDate: text("from_date"),
    untilDate: text("until_date"),
    days: integer("days"),
    gamesMissed: integer("games_missed"),
    gamesMissedClubs: text("games_missed_clubs"), // JSON array of club ids
  },
  (t) => ({
    playerIdx: index("tm_inj_player_idx").on(t.tmId),
  }),
);

export const tmAchievements = sqliteTable(
  "tm_achievements",
  {
    achievementId: integer("achievement_id").primaryKey({ autoIncrement: true }),
    tmId: text("tm_id")
      .notNull()
      .references(() => tmPlayers.tmId),
    title: text("title").notNull(),
    season: text("season"),
    seasonName: text("season_name"),
    clubId: text("club_id"),
    clubName: text("club_name"),
  },
  (t) => ({
    playerIdx: index("tm_ach_player_idx").on(t.tmId),
  }),
);

// ============================================================================
// Layer 4 — ClubELO
// ============================================================================
export const eloTeamHistory = sqliteTable(
  "elo_team_history",
  {
    rowId: integer("row_id").primaryKey({ autoIncrement: true }),
    teamName: text("team_name").notNull(), // ClubELO short name (no spaces): "Celje"
    countryCode: text("country_code"), // 3-letter
    level: integer("level"),
    elo: real("elo").notNull(),
    fromDate: text("from_date").notNull(),
    toDate: text("to_date").notNull(),
    rank: real("rank"), // can be NaN
  },
  (t) => ({
    teamIdx: index("elo_team_idx").on(t.teamName),
    rangeIdx: index("elo_range_idx").on(t.fromDate, t.toDate),
  }),
);

// ============================================================================
// Layer 5 — Cross-source ID mapping
// ============================================================================
export const playerIdMap = sqliteTable(
  "player_id_map",
  {
    internalId: integer("internal_id").primaryKey({ autoIncrement: true }),
    sfId: integer("sf_id").references(() => sfPlayers.playerId),
    tmId: text("tm_id").references(() => tmPlayers.tmId),
  },
  (t) => ({
    sfIdx: index("pidm_sf_idx").on(t.sfId),
    tmIdx: index("pidm_tm_idx").on(t.tmId),
  }),
);

export const teamIdMap = sqliteTable(
  "team_id_map",
  {
    internalId: integer("internal_id").primaryKey({ autoIncrement: true }),
    sfId: integer("sf_id").references(() => sfTeams.teamId),
    tmId: text("tm_id").references(() => tmClubs.tmId),
    eloName: text("elo_name"), // teamName in ClubELO
  },
  (t) => ({
    sfIdx: index("tidm_sf_idx").on(t.sfId),
    tmIdx: index("tidm_tm_idx").on(t.tmId),
  }),
);
