CREATE TABLE `api_cache` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source` text NOT NULL,
	`url` text NOT NULL,
	`fetched_at` integer NOT NULL,
	`http_status` integer NOT NULL,
	`response_json` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `api_cache_source_url_idx` ON `api_cache` (`source`,`url`);--> statement-breakpoint
CREATE INDEX `api_cache_fetched_idx` ON `api_cache` (`fetched_at`);--> statement-breakpoint
CREATE TABLE `elo_team_history` (
	`row_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_name` text NOT NULL,
	`country_code` text,
	`level` integer,
	`elo` real NOT NULL,
	`from_date` text NOT NULL,
	`to_date` text NOT NULL,
	`rank` real
);
--> statement-breakpoint
CREATE INDEX `elo_team_idx` ON `elo_team_history` (`team_name`);--> statement-breakpoint
CREATE INDEX `elo_range_idx` ON `elo_team_history` (`from_date`,`to_date`);--> statement-breakpoint
CREATE TABLE `player_id_map` (
	`internal_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sf_id` integer,
	`tm_id` text,
	FOREIGN KEY (`sf_id`) REFERENCES `sf_players`(`player_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tm_id`) REFERENCES `tm_players`(`tm_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `pidm_sf_idx` ON `player_id_map` (`sf_id`);--> statement-breakpoint
CREATE INDEX `pidm_tm_idx` ON `player_id_map` (`tm_id`);--> statement-breakpoint
CREATE TABLE `sf_events` (
	`event_id` integer PRIMARY KEY NOT NULL,
	`ut_id` integer,
	`season_id` integer,
	`round` integer,
	`home_team_id` integer,
	`away_team_id` integer,
	`home_score` integer,
	`away_score` integer,
	`winner_code` integer,
	`status_type` text,
	`start_timestamp` integer,
	`venue_name` text,
	`referee_name` text,
	`attendance` integer,
	`has_xg` integer,
	`has_event_player_statistics` integer,
	`fetched_at` integer,
	FOREIGN KEY (`ut_id`) REFERENCES `sf_tournaments`(`ut_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`season_id`) REFERENCES `sf_seasons`(`season_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`home_team_id`) REFERENCES `sf_teams`(`team_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`away_team_id`) REFERENCES `sf_teams`(`team_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sf_events_season_idx` ON `sf_events` (`ut_id`,`season_id`);--> statement-breakpoint
CREATE INDEX `sf_events_home_idx` ON `sf_events` (`home_team_id`);--> statement-breakpoint
CREATE INDEX `sf_events_away_idx` ON `sf_events` (`away_team_id`);--> statement-breakpoint
CREATE TABLE `sf_player_attribute_overviews` (
	`player_id` integer NOT NULL,
	`year_shift` integer DEFAULT 0 NOT NULL,
	`is_average` integer DEFAULT false NOT NULL,
	`position` text,
	`attacking` integer,
	`technical` integer,
	`tactical` integer,
	`defending` integer,
	`creativity` integer,
	`fetched_at` integer,
	PRIMARY KEY(`player_id`, `year_shift`, `is_average`),
	FOREIGN KEY (`player_id`) REFERENCES `sf_players`(`player_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sf_player_match_ratings` (
	`player_id` integer NOT NULL,
	`event_id` integer NOT NULL,
	`timestamp` integer NOT NULL,
	`ut_id` integer,
	`rating` real NOT NULL,
	PRIMARY KEY(`player_id`, `event_id`),
	FOREIGN KEY (`player_id`) REFERENCES `sf_players`(`player_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sfpmr_player_idx` ON `sf_player_match_ratings` (`player_id`);--> statement-breakpoint
CREATE TABLE `sf_player_match_stats` (
	`player_id` integer NOT NULL,
	`event_id` integer NOT NULL,
	`team_id` integer,
	`is_home` integer,
	`position` text,
	`is_substitute` integer,
	`is_captain` integer,
	`minutes_played` integer,
	`rating` real,
	`goals` integer,
	`goal_assist` integer,
	`total_shots` integer,
	`on_target_scoring_attempt` integer,
	`shot_off_target` integer,
	`expected_goals` real,
	`expected_assists` real,
	`big_chance_created` integer,
	`big_chance_missed` integer,
	`total_pass` integer,
	`accurate_pass` integer,
	`total_long_balls` integer,
	`accurate_long_balls` integer,
	`total_cross` integer,
	`accurate_cross` integer,
	`accurate_own_half_passes` integer,
	`total_own_half_passes` integer,
	`accurate_opposition_half_passes` integer,
	`total_opposition_half_passes` integer,
	`key_pass` integer,
	`total_contest` integer,
	`won_contest` integer,
	`unsuccessful_touch` integer,
	`possession_lost_ctrl` integer,
	`touches` integer,
	`dispossessed` integer,
	`duel_won` integer,
	`duel_lost` integer,
	`aerial_won` integer,
	`aerial_lost` integer,
	`challenge_lost` integer,
	`total_tackle` integer,
	`won_tackle` integer,
	`interception_won` integer,
	`ball_recovery` integer,
	`total_clearance` integer,
	`outfielder_block` integer,
	`error_lead_to_a_shot` integer,
	`own_goals` integer,
	`was_fouled` integer,
	`fouls` integer,
	`total_offside` integer,
	`fetched_at` integer,
	PRIMARY KEY(`player_id`, `event_id`),
	FOREIGN KEY (`player_id`) REFERENCES `sf_players`(`player_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`event_id`) REFERENCES `sf_events`(`event_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_id`) REFERENCES `sf_teams`(`team_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sfpms_event_idx` ON `sf_player_match_stats` (`event_id`);--> statement-breakpoint
CREATE INDEX `sfpms_player_idx` ON `sf_player_match_stats` (`player_id`);--> statement-breakpoint
CREATE TABLE `sf_player_season_stats` (
	`player_id` integer NOT NULL,
	`ut_id` integer NOT NULL,
	`season_id` integer NOT NULL,
	`team_id` integer,
	`rating` real,
	`appearances` integer,
	`matches_started` integer,
	`minutes_played` integer,
	`substitutions_in` integer,
	`substitutions_out` integer,
	`goals` integer,
	`assists` integer,
	`goals_assists_sum` integer,
	`total_shots` integer,
	`shots_on_target` integer,
	`goal_conversion_percentage` real,
	`scoring_frequency` real,
	`shot_from_set_piece` integer,
	`penalties_taken` integer,
	`penalty_goals` integer,
	`penalty_conversion` real,
	`offsides` integer,
	`total_passes` integer,
	`accurate_passes` integer,
	`inaccurate_passes` integer,
	`accurate_passes_percentage` real,
	`accurate_final_third_passes` integer,
	`key_passes` integer,
	`pass_to_assist` integer,
	`total_long_balls` integer,
	`accurate_long_balls` integer,
	`accurate_long_balls_percentage` real,
	`total_cross` integer,
	`accurate_crosses` integer,
	`accurate_crosses_percentage` real,
	`successful_dribbles` integer,
	`successful_dribbles_percentage` real,
	`total_duels_won` integer,
	`total_duels_won_percentage` real,
	`duel_lost` integer,
	`aerial_duels_won` integer,
	`aerial_duels_won_percentage` real,
	`aerial_lost` integer,
	`ball_recovery` integer,
	`clearances` integer,
	`blocked_shots` integer,
	`dribbled_past` integer,
	`error_lead_to_shot` integer,
	`yellow_cards` integer,
	`red_cards` integer,
	`direct_red_cards` integer,
	`yellow_red_cards` integer,
	`fouls` integer,
	`was_fouled` integer,
	`saves` integer,
	`clean_sheet` integer,
	`crosses_not_claimed` integer,
	`goals_conceded` integer,
	`goal_kicks` integer,
	`fetched_at` integer,
	PRIMARY KEY(`player_id`, `ut_id`, `season_id`),
	FOREIGN KEY (`player_id`) REFERENCES `sf_players`(`player_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ut_id`) REFERENCES `sf_tournaments`(`ut_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`season_id`) REFERENCES `sf_seasons`(`season_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_id`) REFERENCES `sf_teams`(`team_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sfpss_player_idx` ON `sf_player_season_stats` (`player_id`);--> statement-breakpoint
CREATE INDEX `sfpss_season_idx` ON `sf_player_season_stats` (`ut_id`,`season_id`);--> statement-breakpoint
CREATE TABLE `sf_players` (
	`player_id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`first_name` text,
	`last_name` text,
	`slug` text,
	`short_name` text,
	`position` text,
	`positions_detailed` text,
	`jersey_number` integer,
	`height` integer,
	`weight` integer,
	`date_of_birth` text,
	`date_of_birth_timestamp` integer,
	`preferred_foot` text,
	`country_code` text,
	`country_name` text,
	`contract_until_timestamp` integer,
	`proposed_market_value` integer,
	`market_value_currency` text,
	`current_team_id` integer,
	`user_count` integer,
	`fetched_at` integer,
	FOREIGN KEY (`current_team_id`) REFERENCES `sf_teams`(`team_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sf_players_team_idx` ON `sf_players` (`current_team_id`);--> statement-breakpoint
CREATE INDEX `sf_players_name_idx` ON `sf_players` (`name`);--> statement-breakpoint
CREATE TABLE `sf_seasons` (
	`season_id` integer PRIMARY KEY NOT NULL,
	`ut_id` integer NOT NULL,
	`year` text NOT NULL,
	`name` text NOT NULL,
	`is_current` integer DEFAULT false,
	FOREIGN KEY (`ut_id`) REFERENCES `sf_tournaments`(`ut_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sf_seasons_ut_idx` ON `sf_seasons` (`ut_id`);--> statement-breakpoint
CREATE TABLE `sf_shots` (
	`shot_id` integer PRIMARY KEY NOT NULL,
	`event_id` integer NOT NULL,
	`player_id` integer NOT NULL,
	`is_home` integer,
	`time_min` integer,
	`time_seconds` integer,
	`shot_type` text,
	`situation` text,
	`body_part` text,
	`player_x` real,
	`player_y` real,
	`goal_mouth_location` text,
	`goal_mouth_x` real,
	`goal_mouth_y` real,
	`goal_mouth_z` real,
	`xg` real,
	`xgot` real,
	`fetched_at` integer,
	FOREIGN KEY (`event_id`) REFERENCES `sf_events`(`event_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player_id`) REFERENCES `sf_players`(`player_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sf_shots_event_idx` ON `sf_shots` (`event_id`);--> statement-breakpoint
CREATE INDEX `sf_shots_player_idx` ON `sf_shots` (`player_id`);--> statement-breakpoint
CREATE TABLE `sf_team_league_stats` (
	`team_id` integer NOT NULL,
	`ut_id` integer NOT NULL,
	`season_id` integer NOT NULL,
	`matches` integer,
	`awarded_matches` integer,
	`goals_scored` integer,
	`goals_conceded` integer,
	`assists` integer,
	`shots` integer,
	`shots_against` integer,
	`penalty_goals` integer,
	`penalties_taken` integer,
	`successful_dribbles` integer,
	`dribble_attempts` integer,
	`corners` integer,
	`average_ball_possession` real,
	`total_passes` integer,
	`accurate_passes` integer,
	`accurate_passes_percentage` real,
	`total_long_balls` integer,
	`accurate_long_balls` integer,
	`accurate_long_balls_percentage` real,
	`total_crosses` integer,
	`accurate_crosses` integer,
	`accurate_crosses_percentage` real,
	`clean_sheets` integer,
	`interceptions` integer,
	`saves` integer,
	`errors_leading_to_shot` integer,
	`total_duels` integer,
	`duels_won` integer,
	`duels_won_percentage` real,
	`total_aerial_duels` integer,
	`aerial_duels_won` integer,
	`aerial_duels_won_percentage` real,
	`offsides` integer,
	`fouls` integer,
	`yellow_cards` integer,
	`yellow_red_cards` integer,
	`red_cards` integer,
	`goal_kicks` integer,
	`ball_recovery` integer,
	`free_kicks` integer,
	`fetched_at` integer,
	PRIMARY KEY(`team_id`, `ut_id`, `season_id`),
	FOREIGN KEY (`team_id`) REFERENCES `sf_teams`(`team_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ut_id`) REFERENCES `sf_tournaments`(`ut_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`season_id`) REFERENCES `sf_seasons`(`season_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sf_teams` (
	`team_id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text,
	`short_name` text,
	`name_code` text,
	`country_code` text,
	`country_name` text,
	`primary_color` text,
	`secondary_color` text,
	`text_color` text,
	`is_national` integer DEFAULT false,
	`user_count` integer
);
--> statement-breakpoint
CREATE TABLE `sf_tournaments` (
	`ut_id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text,
	`country_code` text,
	`country_name` text,
	`tier` real
);
--> statement-breakpoint
CREATE TABLE `team_id_map` (
	`internal_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sf_id` integer,
	`tm_id` text,
	`elo_name` text,
	FOREIGN KEY (`sf_id`) REFERENCES `sf_teams`(`team_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tm_id`) REFERENCES `tm_clubs`(`tm_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `tidm_sf_idx` ON `team_id_map` (`sf_id`);--> statement-breakpoint
CREATE INDEX `tidm_tm_idx` ON `team_id_map` (`tm_id`);--> statement-breakpoint
CREATE TABLE `tm_achievements` (
	`achievement_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tm_id` text NOT NULL,
	`title` text NOT NULL,
	`season` text,
	`season_name` text,
	`club_id` text,
	`club_name` text,
	FOREIGN KEY (`tm_id`) REFERENCES `tm_players`(`tm_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `tm_ach_player_idx` ON `tm_achievements` (`tm_id`);--> statement-breakpoint
CREATE TABLE `tm_clubs` (
	`tm_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`official_name` text,
	`url` text,
	`image_url` text,
	`founded_on` text,
	`stadium_name` text,
	`stadium_seats` integer,
	`current_transfer_record` integer,
	`current_market_value` integer,
	`confederation` text,
	`fifa_world_ranking` integer,
	`squad_size` integer,
	`squad_average_age` real,
	`squad_foreigners` integer,
	`squad_national_team_players` integer,
	`league_id` text,
	`league_name` text,
	`league_country_name` text,
	`league_tier` text,
	`fetched_at` integer
);
--> statement-breakpoint
CREATE TABLE `tm_injuries` (
	`injury_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tm_id` text NOT NULL,
	`season` text,
	`injury` text,
	`from_date` text,
	`until_date` text,
	`days` integer,
	`games_missed` integer,
	`games_missed_clubs` text,
	FOREIGN KEY (`tm_id`) REFERENCES `tm_players`(`tm_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `tm_inj_player_idx` ON `tm_injuries` (`tm_id`);--> statement-breakpoint
CREATE TABLE `tm_market_values` (
	`tm_id` text NOT NULL,
	`date` text NOT NULL,
	`age` integer,
	`club_id` text,
	`club_name` text,
	`market_value` integer,
	PRIMARY KEY(`tm_id`, `date`),
	FOREIGN KEY (`tm_id`) REFERENCES `tm_players`(`tm_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `tm_mv_player_idx` ON `tm_market_values` (`tm_id`);--> statement-breakpoint
CREATE TABLE `tm_players` (
	`tm_id` text PRIMARY KEY NOT NULL,
	`url` text,
	`name` text NOT NULL,
	`full_name` text,
	`name_in_home_country` text,
	`image_url` text,
	`date_of_birth` text,
	`place_of_birth_city` text,
	`place_of_birth_country` text,
	`age` integer,
	`height` integer,
	`citizenship` text,
	`is_retired` integer,
	`position_main` text,
	`position_other` text,
	`foot` text,
	`shirt_number` text,
	`club_id` text,
	`club_name` text,
	`club_joined` text,
	`club_contract_expires` text,
	`market_value` integer,
	`outfitter` text,
	`fetched_at` integer
);
--> statement-breakpoint
CREATE TABLE `tm_transfers` (
	`transfer_id` text PRIMARY KEY NOT NULL,
	`tm_id` text NOT NULL,
	`club_from_id` text,
	`club_from_name` text,
	`club_to_id` text,
	`club_to_name` text,
	`date` text,
	`season` text,
	`upcoming` integer,
	`market_value` integer,
	`fee` integer,
	FOREIGN KEY (`tm_id`) REFERENCES `tm_players`(`tm_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `tm_tr_player_idx` ON `tm_transfers` (`tm_id`);