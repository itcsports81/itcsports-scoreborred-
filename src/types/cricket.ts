export type MatchFormat = 'T10' | 'T20' | 'ODI' | 'CUSTOM';
export type TossDecision = 'BAT' | 'BOWL';
export type WicketType = 
  | 'BOWLED'
  | 'CAUGHT'
  | 'LBW'
  | 'STUMPED'
  | 'RUN_OUT'
  | 'HIT_WICKET'
  | 'OBSTRUCTING'
  | 'HIT_BALL_TWICE'
  | 'RETIRED_OUT'
  | 'RETIRED_HURT';

export type BattingStyle = 'RIGHT_HAND' | 'LEFT_HAND';
export type BowlingStyle = 
  | 'RIGHT_ARM_FAST' 
  | 'RIGHT_ARM_MEDIUM' 
  | 'LEFT_ARM_FAST' 
  | 'LEFT_ARM_MEDIUM' 
  | 'OFF_SPIN' 
  | 'LEG_SPIN' 
  | 'LEFT_ARM_ORTHODOX' 
  | 'LEFT_ARM_CHINAMAN'
  | 'UNKNOWN';

export interface PlayerCareerStats {
  matches: number;
  innings: number;
  runs: number;
  highestScore: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  fifties: number;
  hundreds: number;
  notOuts: number;
  // Bowling
  bowlingInnings: number;
  ballsBowled: number;
  runsConceded: number;
  wickets: number;
  maidens: number;
  wides: number;
  noBalls: number;
  fourWicketHauls: number;
  fiveWicketHauls: number;
  bestBowlingRuns: number;
  bestBowlingWickets: number;
}

export interface Player {
  id: string; // Stable internal ID
  name: string;
  shortName: string;
  jerseyNumber?: number;
  teamId?: string;
  teamName?: string;
  photoUrl?: string;
  battingStyle?: BattingStyle;
  bowlingStyle?: BowlingStyle;
  role?: string;
  isCaptain?: boolean;
  isWicketKeeper?: boolean;
  stats?: PlayerCareerStats;
  createdAt: number;
  updatedAt: number;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string; // base64 data url or image path
  primaryColor?: string;
  secondaryColor?: string;
  playerIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface BatterInning {
  playerId: string;
  playerName: string;
  shortName: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissalType?: WicketType;
  dismissalText?: string; // e.g. "c Smith b Johnson"
  bowlerId?: string;
  bowlerName?: string;
  fielderName?: string;
  battingOrder: number;
  strikeRate: number;
}

export interface BowlerInning {
  playerId: string;
  playerName: string;
  shortName: string;
  legalBalls: number; // For exact overs display (e.g. 15 = 2.3)
  maidens: number;
  runsConceded: number;
  wickets: number;
  wides: number;
  noBalls: number;
  economy: number;
}

export interface ExtrasSummary {
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
  penalty: number;
  total: number;
}

export interface FallOfWicket {
  wicketNumber: number;
  score: number;
  oversString: string; // e.g. "4.2"
  dismissedPlayerId: string;
  dismissedPlayerName: string;
  wicketType: WicketType;
}

export interface Partnership {
  batter1Id: string;
  batter1Name: string;
  batter1Runs: number;
  batter2Id: string;
  batter2Name: string;
  batter2Runs: number;
  totalRuns: number;
  balls: number;
  isActive: boolean;
}

export interface Delivery {
  id: string;
  inningIndex: number;
  overIndex: number; // 0-indexed over number
  ballNumberInOver: number; // Display sequence
  isLegalDelivery: boolean;
  bowlerId: string;
  bowlerName: string;
  strikerId: string;
  strikerName: string;
  nonStrikerId: string;
  nonStrikerName: string;
  batterRuns: number;
  extraType?: 'WIDE' | 'NO_BALL' | 'BYE' | 'LEG_BYE' | 'PENALTY';
  extraRuns: number;
  totalDeliveryRuns: number;
  isFour: boolean;
  isSix: boolean;
  isWicket: boolean;
  wicketType?: WicketType;
  dismissedPlayerId?: string;
  dismissedPlayerName?: string;
  fielderName?: string;
  isFreeHitDelivery: boolean;
  freeHitActiveAfter: boolean;
  commentary?: string;
  timestamp: number;
}

export interface OverSummary {
  overNumber: number; // 1-indexed (e.g. Over 1, Over 2)
  bowlerId: string;
  bowlerName: string;
  deliveries: Delivery[];
  runsInOver: number;
  wicketsInOver: number;
  isMaiden: boolean;
}

export interface InningsState {
  inningIndex: number; // 0 for 1st, 1 for 2nd, 2+ for Super Over
  battingTeamId: string;
  battingTeamName: string;
  bowlingTeamId: string;
  bowlingTeamName: string;
  runs: number;
  wickets: number;
  legalBalls: number; // 18 balls = 3.0 overs
  oversString: string; // "3.0"
  currentOverLegalBalls: number;
  isCompleted: boolean;
  strikerId: string;
  nonStrikerId: string;
  currentBowlerId: string;
  lastBowlerId?: string; // To prevent consecutive overs
  batters: BatterInning[];
  bowlers: BowlerInning[];
  extras: ExtrasSummary;
  fallOfWickets: FallOfWicket[];
  partnerships: Partnership[];
  currentPartnership: Partnership;
  overs: OverSummary[];
  deliveries: Delivery[];
  freeHitActive: boolean;
  powerplayActive: boolean;
  statusText?: string;
}

export interface MatchSettings {
  format: MatchFormat;
  totalOvers: number;
  maxOversPerBowler: number;
  powerplayOvers: { start: number; end: number }; // e.g. 1 to 6
  superOverEnabled: boolean;
  freeHitEnabled: boolean;
  widesAreRebowled: boolean;
  noBallsAreRebowled: boolean;
  wideRuns: number; // Default 1
  noBallRuns: number; // Default 1
}

export interface SponsorConfig {
  enabled: boolean;
  name: string;
  tagline?: string;
  logoUrl?: string;
  displayPosition: 'SCOREBUG' | 'CORNER' | 'BANNER';
}

export interface BroadcastAnimationEvent {
  id: string;
  type: 'FOUR' | 'SIX' | 'WICKET' | 'FREE_HIT' | 'POWERPLAY' | 'FIFTY' | 'HUNDRED' | 'INNINGS_BREAK' | 'MATCH_RESULT';
  title: string;
  subtitle?: string;
  durationMs: number;
  timestamp: number;
}

export interface Match {
  id: string;
  matchName: string;
  tournamentName: string;
  venue: string;
  date: string;
  teamA: Team;
  teamB: Team;
  teamAPlayingXI: Player[];
  teamBPlayingXI: Player[];
  captainTeamAId?: string;
  wicketKeeperTeamAId?: string;
  captainTeamBId?: string;
  wicketKeeperTeamBId?: string;
  tossWinnerTeamId: string;
  tossDecision: TossDecision;
  settings: MatchSettings;
  sponsor: SponsorConfig;
  currentInningIndex: number;
  innings: InningsState[];
  isMatchCompleted: boolean;
  winnerTeamId?: string;
  resultSummary?: string; // e.g. "ITC SPORTS WON BY 24 RUNS"
  isSuperOver: boolean;
  createdAt: number;
  updatedAt: number;
}

export type OverlayGraphicType =
  | 'SCOREBUG'
  | 'SCORECARD'
  | 'PARTNERSHIP'
  | 'BOWLER_CARD'
  | 'BATTER_CARD'
  | 'MINI_BUG'
  | 'BOTH_SQUADS'
  | 'TEAM_A_SQUAD'
  | 'TEAM_B_SQUAD'
  | 'MATCH_SUMMARY'
  | 'CURRENT_PARTNERSHIP'
  | 'HIGHEST_PARTNERSHIP'
  | 'TOP_SCORERS'
  | 'BEST_BOWLERS'
  | 'TEAM_COMPARISON'
  | 'RUN_RATE_STATS'
  | 'LAST_5_OVERS'
  | 'LAST_10_OVERS'
  | 'FALL_OF_WICKETS'
  | 'PREVIOUS_OVER'
  | 'OVER_SUMMARY'
  | 'PLAYER_INTRO'
  | 'BOWLER_INTRO'
  | 'TEAM_INTRO'
  | 'MATCH_INFO'
  | 'VENUE_INFO'
  | 'TOURNAMENT_INFO'
  | 'RESULT_BANNER';

export interface BroadcastOverlaySettings {
  showSponsor: boolean;
  showAnimations: boolean;
  showLogo: boolean;
  showTicker: boolean;
  theme: 'itc_premium' | 'itc_gold' | 'itc_neon' | 'emerald_pro' | 'royal_blue' | 'neon_gold' | 'crimson_red' | 'cyber_purple' | 'carbon_black' | 'itc_dark' | 'custom';
  position: 'bottom' | 'top';
  opacity: number;
  activeGraphic: OverlayGraphicType;
  // Background options
  bgType: 'transparent' | 'solid' | 'gradient' | 'dark' | 'light' | 'image' | 'video';
  bgImageUrl?: string;
  bgVideoUrl?: string;
  bgSolidColor?: string;
  bgGradientType?: string;
  blurLevel: number; // 0 to 20
  brightness: number; // 50 to 150
  overlayDarkness: number; // 0 to 100
  // Custom theme colors
  customPrimary?: string;
  customSecondary?: string;
  customAccent?: string;
  customText?: string;
  customBg?: string;
  customBorder?: string;
  // Animation options
  animationStyle: 'slide_in' | 'slide_out' | 'fade_in' | 'zoom' | 'bounce' | 'glow' | 'shimmer' | 'pulse' | 'smooth_slide' | 'none';
  animationSpeed: 'slow' | 'normal' | 'fast';
}

export interface AppDatabase {
  teams: Team[];
  players: Player[];
  activeMatch: Match | null;
  matchHistory: Match[];
  overlaySettings: BroadcastOverlaySettings;
  sponsor: SponsorConfig;
  lastEvent: BroadcastAnimationEvent | null;
  operatorPin?: string;
}
