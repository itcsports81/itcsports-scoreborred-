import {
  Match,
  InningsState,
  Delivery,
  WicketType,
  BatterInning,
  BowlerInning,
  FallOfWicket,
  Partnership,
  OverSummary,
  Player,
  BroadcastAnimationEvent,
} from '../types/cricket.js';

export function calculateOversString(legalBalls: number): string {
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  return `${overs}.${balls}`;
}

export function calculateRunRate(runs: number, legalBalls: number): number {
  if (legalBalls === 0) return 0;
  const overs = legalBalls / 6;
  return Number((runs / overs).toFixed(2));
}

export function calculateEconomy(runsConceded: number, legalBalls: number): number {
  if (legalBalls === 0) return 0;
  const overs = legalBalls / 6;
  return Number((runsConceded / overs).toFixed(2));
}

export function calculateStrikeRate(runs: number, balls: number): number {
  if (balls === 0) return 0;
  return Number(((runs / balls) * 100).toFixed(2));
}

export interface ScoreDeliveryInput {
  batterRuns: number;
  extraType?: 'WIDE' | 'NO_BALL' | 'BYE' | 'LEG_BYE' | 'PENALTY';
  extraRuns?: number;
  isWicket?: boolean;
  wicketType?: WicketType;
  dismissedPlayerId?: string;
  fielderName?: string;
  commentary?: string;
}

export function processDelivery(
  match: Match,
  input: ScoreDeliveryInput
): {
  updatedMatch: Match;
  animationEvent: BroadcastAnimationEvent | null;
  overCompleted: boolean;
  wicketFell: boolean;
  inningsCompleted: boolean;
  matchCompleted: boolean;
} {
  const currentInning = match.innings[match.currentInningIndex];
  if (!currentInning || currentInning.isCompleted || match.isMatchCompleted) {
    return {
      updatedMatch: match,
      animationEvent: null,
      overCompleted: false,
      wicketFell: false,
      inningsCompleted: false,
      matchCompleted: false,
    };
  }

  // Clone match deeply
  const newMatch: Match = JSON.parse(JSON.stringify(match));
  const inning = newMatch.innings[newMatch.currentInningIndex];
  const settings = newMatch.settings;

  const isWide = input.extraType === 'WIDE';
  const isNoBall = input.extraType === 'NO_BALL';
  const isPenalty = input.extraType === 'PENALTY';
  const isLegalDelivery = !isWide && !isNoBall && !isPenalty;

  const batterRuns = input.batterRuns || 0;
  let extraRuns = 0;

  if (isWide) {
    extraRuns = (settings.wideRuns ?? 1) + (input.extraRuns || 0);
  } else if (isNoBall) {
    extraRuns = (settings.noBallRuns ?? 1) + (input.extraRuns || 0);
  } else if (input.extraType === 'BYE' || input.extraType === 'LEG_BYE' || isPenalty) {
    extraRuns = input.extraRuns || (batterRuns > 0 ? batterRuns : 1);
  }

  const totalRunsThisBall = (isLegalDelivery || isNoBall ? batterRuns : 0) + extraRuns;
  const isFour = batterRuns === 4;
  const isSix = batterRuns === 6;

  // Active players
  const striker = inning.batters.find((b) => b.playerId === inning.strikerId);
  const nonStriker = inning.batters.find((b) => b.playerId === inning.nonStrikerId);
  let bowler = inning.bowlers.find((bw) => bw.playerId === inning.currentBowlerId);

  // If bowler not in bowlers list yet, register them
  if (!bowler && inning.currentBowlerId) {
    const bowlerPlayer =
      (newMatch.currentInningIndex % 2 === 0 ? newMatch.teamBPlayingXI : newMatch.teamAPlayingXI).find(
        (p) => p.id === inning.currentBowlerId
      ) || { name: 'Bowler', shortName: 'Bowler' };

    bowler = {
      playerId: inning.currentBowlerId,
      playerName: bowlerPlayer.name,
      shortName: bowlerPlayer.shortName || bowlerPlayer.name,
      legalBalls: 0,
      maidens: 0,
      runsConceded: 0,
      wickets: 0,
      wides: 0,
      noBalls: 0,
      economy: 0,
    };
    inning.bowlers.push(bowler);
  }

  // Create delivery record
  const currentOverIndex = Math.floor(inning.legalBalls / 6);
  const isFreeHitDelivery = inning.freeHitActive;

  const delivery: Delivery = {
    id: `del-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    inningIndex: newMatch.currentInningIndex,
    overIndex: currentOverIndex,
    ballNumberInOver: inning.currentOverLegalBalls + (isLegalDelivery ? 1 : 0),
    isLegalDelivery,
    bowlerId: inning.currentBowlerId,
    bowlerName: bowler?.shortName || bowler?.playerName || 'Bowler',
    strikerId: inning.strikerId,
    strikerName: striker?.shortName || striker?.playerName || 'Striker',
    nonStrikerId: inning.nonStrikerId,
    nonStrikerName: nonStriker?.shortName || nonStriker?.playerName || 'Non-Striker',
    batterRuns: isLegalDelivery || isNoBall ? batterRuns : 0,
    extraType: input.extraType,
    extraRuns,
    totalDeliveryRuns: totalRunsThisBall,
    isFour,
    isSix,
    isWicket: !!input.isWicket,
    wicketType: input.wicketType,
    dismissedPlayerId: input.dismissedPlayerId,
    dismissedPlayerName: input.dismissedPlayerId
      ? inning.batters.find((b) => b.playerId === input.dismissedPlayerId)?.playerName
      : undefined,
    fielderName: input.fielderName,
    isFreeHitDelivery,
    freeHitActiveAfter: isNoBall ? true : isLegalDelivery ? false : inning.freeHitActive,
    commentary: input.commentary,
    timestamp: Date.now(),
  };

  // Add delivery to list
  inning.deliveries.push(delivery);

  // Update inning runs & extras
  inning.runs += totalRunsThisBall;

  if (isWide) {
    inning.extras.wides += extraRuns;
    inning.extras.total += extraRuns;
    if (bowler) {
      bowler.wides += 1;
      bowler.runsConceded += extraRuns;
    }
  } else if (isNoBall) {
    inning.extras.noBalls += extraRuns;
    inning.extras.total += extraRuns;
    if (bowler) {
      bowler.noBalls += 1;
      bowler.runsConceded += extraRuns + (batterRuns > 0 ? batterRuns : 0);
    }
  } else if (input.extraType === 'BYE') {
    inning.extras.byes += extraRuns;
    inning.extras.total += extraRuns;
  } else if (input.extraType === 'LEG_BYE') {
    inning.extras.legByes += extraRuns;
    inning.extras.total += extraRuns;
  } else if (isPenalty) {
    inning.extras.penalty += extraRuns;
    inning.extras.total += extraRuns;
  }

  // Update striker stats
  if (striker && !isPenalty) {
    if (isLegalDelivery || (isNoBall && (batterRuns > 0 || isFour || isSix))) {
      striker.balls += 1;
    }
    if (isLegalDelivery || isNoBall) {
      striker.runs += batterRuns;
      if (isFour) striker.fours += 1;
      if (isSix) striker.sixes += 1;
    }
    striker.strikeRate = calculateStrikeRate(striker.runs, striker.balls);
  }

  // Update bowler stats
  if (bowler && !isPenalty) {
    if (isLegalDelivery) {
      bowler.legalBalls += 1;
      if (!input.extraType || input.extraType === 'NO_BALL') {
        bowler.runsConceded += batterRuns;
      }
    }
    bowler.economy = calculateEconomy(bowler.runsConceded, bowler.legalBalls);
  }

  // Update partnership
  if (inning.currentPartnership) {
    inning.currentPartnership.totalRuns += totalRunsThisBall;
    if (isLegalDelivery) {
      inning.currentPartnership.balls += 1;
    }
    if (striker && inning.currentPartnership.batter1Id === striker.playerId) {
      inning.currentPartnership.batter1Runs += isLegalDelivery || isNoBall ? batterRuns : 0;
    } else if (striker && inning.currentPartnership.batter2Id === striker.playerId) {
      inning.currentPartnership.batter2Runs += isLegalDelivery || isNoBall ? batterRuns : 0;
    }
  }

  // Free Hit logic:
  // After a No Ball: automatically activate Free Hit
  // If Free Hit was already active and ball was legal, Free Hit deactivates
  // If Free Hit was active and another No Ball or Wide occurs, Free Hit remains active
  if (isNoBall) {
    inning.freeHitActive = true;
  } else if (isLegalDelivery && inning.freeHitActive) {
    inning.freeHitActive = false;
  }

  // Handle Wickets
  const wicketFell = !!input.isWicket;
  let dismissedBatter: BatterInning | undefined;

  if (wicketFell) {
    inning.wickets += 1;
    const dismissedId = input.dismissedPlayerId || inning.strikerId;
    dismissedBatter = inning.batters.find((b) => b.playerId === dismissedId);

    if (dismissedBatter) {
      dismissedBatter.isOut = true;
      dismissedBatter.dismissalType = input.wicketType || 'BOWLED';
      dismissedBatter.bowlerId = bowler?.playerId;
      dismissedBatter.bowlerName = bowler?.playerName;
      dismissedBatter.fielderName = input.fielderName;

      // Format dismissal string
      if (input.wicketType === 'BOWLED') {
        dismissedBatter.dismissalText = `b ${bowler?.shortName || bowler?.playerName}`;
      } else if (input.wicketType === 'CAUGHT') {
        dismissedBatter.dismissalText = `c ${input.fielderName || 'Fielder'} b ${bowler?.shortName || bowler?.playerName}`;
      } else if (input.wicketType === 'LBW') {
        dismissedBatter.dismissalText = `lbw b ${bowler?.shortName || bowler?.playerName}`;
      } else if (input.wicketType === 'STUMPED') {
        dismissedBatter.dismissalText = `st ${input.fielderName || 'Keeper'} b ${bowler?.shortName || bowler?.playerName}`;
      } else if (input.wicketType === 'RUN_OUT') {
        dismissedBatter.dismissalText = `run out (${input.fielderName || ''})`;
      } else if (input.wicketType === 'HIT_WICKET') {
        dismissedBatter.dismissalText = `hit wicket b ${bowler?.shortName || bowler?.playerName}`;
      } else {
        dismissedBatter.dismissalText = `${input.wicketType?.toLowerCase().replace(/_/g, ' ')}`;
      }
    }

    // Bowler credit for wickets (Run Out, Obstructing, Retired don't credit bowler)
    const isBowlerWicket =
      input.wicketType !== 'RUN_OUT' &&
      input.wicketType !== 'OBSTRUCTING' &&
      input.wicketType !== 'RETIRED_HURT' &&
      input.wicketType !== 'RETIRED_OUT';

    if (bowler && isBowlerWicket) {
      bowler.wickets += 1;
    }

    // Fall of wicket entry
    const currentOversStr = calculateOversString(inning.legalBalls + (isLegalDelivery ? 1 : 0));
    const fow: FallOfWicket = {
      wicketNumber: inning.wickets,
      score: inning.runs,
      oversString: currentOversStr,
      dismissedPlayerId: dismissedId,
      dismissedPlayerName: dismissedBatter?.playerName || 'Batter',
      wicketType: input.wicketType || 'BOWLED',
    };
    inning.fallOfWickets.push(fow);

    // Save completed partnership and create new slot
    if (inning.currentPartnership) {
      inning.currentPartnership.isActive = false;
      inning.partnerships.push({ ...inning.currentPartnership });
    }
  }

  // Update legal balls and overs
  let overCompleted = false;
  if (isLegalDelivery) {
    inning.legalBalls += 1;
    inning.currentOverLegalBalls += 1;
    inning.oversString = calculateOversString(inning.legalBalls);

    // Check if over completed (6 legal balls)
    if (inning.currentOverLegalBalls >= 6) {
      overCompleted = true;
      inning.currentOverLegalBalls = 0;
      inning.lastBowlerId = inning.currentBowlerId;

      // Check maiden over
      const thisOverDeliveries = inning.deliveries.filter(
        (d) => d.overIndex === currentOverIndex && d.inningIndex === newMatch.currentInningIndex
      );
      const runsConcededInOver = thisOverDeliveries.reduce((sum, d) => {
        // Exclude byes and leg byes from bowler runs conceded
        if (d.extraType === 'BYE' || d.extraType === 'LEG_BYE') return sum;
        return sum + d.totalDeliveryRuns;
      }, 0);

      const isMaiden = runsConcededInOver === 0 && thisOverDeliveries.some((d) => d.isLegalDelivery);
      if (isMaiden && bowler) {
        bowler.maidens += 1;
      }

      // Add OverSummary to overs list
      const overSummary: OverSummary = {
        overNumber: currentOverIndex + 1,
        bowlerId: bowler?.playerId || '',
        bowlerName: bowler?.shortName || bowler?.playerName || 'Bowler',
        deliveries: [...thisOverDeliveries],
        runsInOver: runsConcededInOver,
        wicketsInOver: thisOverDeliveries.filter((d) => d.isWicket).length,
        isMaiden,
      };
      inning.overs.push(overSummary);
    }
  }

  // Strike Rotation Logic:
  // 1. Odd runs off bat or byes: swap strike
  // 2. Wide + odd runs taken by running: swap strike (e.g. Wide + 1, Wide + 3)
  // 3. Over completed: swap strike (the batter who was at non-striker end becomes striker for next over)
  const isOddRuns =
    (isLegalDelivery || isNoBall ? batterRuns : 0) % 2 === 1 ||
    (isWide && (input.extraRuns || 0) % 2 === 1) ||
    (input.extraType === 'BYE' || input.extraType === 'LEG_BYE' ? extraRuns % 2 === 1 : false);

  if (isOddRuns) {
    const temp = inning.strikerId;
    inning.strikerId = inning.nonStrikerId;
    inning.nonStrikerId = temp;
  }

  if (overCompleted) {
    // End of over strike rotation
    const temp = inning.strikerId;
    inning.strikerId = inning.nonStrikerId;
    inning.nonStrikerId = temp;
  }

  // Powerplay check
  const currentOverNum = Math.floor(inning.legalBalls / 6) + 1;
  inning.powerplayActive =
    currentOverNum >= settings.powerplayOvers.start && currentOverNum <= settings.powerplayOvers.end;

  // Check Innings and Match Completion
  let inningsCompleted = false;
  let matchCompleted = false;
  const maxWickets = newMatch.isSuperOver ? 2 : 10;
  const allOut = inning.wickets >= maxWickets;
  const oversDone = inning.legalBalls >= settings.totalOvers * 6;

  // Second innings target chasing check
  let targetReached = false;
  if (newMatch.currentInningIndex === 1 && newMatch.innings[0]) {
    const firstInningsRuns = newMatch.innings[0].runs;
    const target = firstInningsRuns + 1;
    if (inning.runs >= target) {
      targetReached = true;
    }
  }

  if (allOut || oversDone || targetReached) {
    inning.isCompleted = true;
    inningsCompleted = true;

    if (newMatch.currentInningIndex === 0) {
      // 1st innings ended
      inning.statusText = `Innings completed: ${inning.runs}/${inning.wickets} in ${inning.oversString} ov`;
    } else {
      // 2nd innings ended -> determine match result
      matchCompleted = true;
      newMatch.isMatchCompleted = true;
      const team1 = newMatch.innings[0];
      const team2 = newMatch.innings[1];

      if (team2.runs > team1.runs) {
        const wicketsRemaining = maxWickets - team2.wickets;
        newMatch.winnerTeamId = team2.battingTeamId;
        newMatch.resultSummary = `${team2.battingTeamName.toUpperCase()} WON BY ${wicketsRemaining} WICKET${wicketsRemaining > 1 ? 'S' : ''}`;
      } else if (team1.runs > team2.runs) {
        const runMargin = team1.runs - team2.runs;
        newMatch.winnerTeamId = team1.battingTeamId;
        newMatch.resultSummary = `${team1.battingTeamName.toUpperCase()} WON BY ${runMargin} RUN${runMargin > 1 ? 'S' : ''}`;
      } else {
        newMatch.resultSummary = `MATCH TIED (${team1.runs} RUNS EACH)`;
      }
    }
  }

  // Broadcast Event Generation
  let animationEvent: BroadcastAnimationEvent | null = null;
  if (wicketFell) {
    animationEvent = {
      id: `ev-${Date.now()}`,
      type: 'WICKET',
      title: 'WICKET!',
      subtitle: `${dismissedBatter?.shortName || dismissedBatter?.playerName} (${dismissedBatter?.runs} off ${dismissedBatter?.balls})`,
      durationMs: 4000,
      timestamp: Date.now(),
    };
  } else if (isSix) {
    animationEvent = {
      id: `ev-${Date.now()}`,
      type: 'SIX',
      title: 'MAXIMUM 6',
      subtitle: `${striker?.shortName || striker?.playerName} sends it all the way!`,
      durationMs: 3500,
      timestamp: Date.now(),
    };
  } else if (isFour) {
    animationEvent = {
      id: `ev-${Date.now()}`,
      type: 'FOUR',
      title: 'FOUR 4',
      subtitle: `Boundary by ${striker?.shortName || striker?.playerName}`,
      durationMs: 3000,
      timestamp: Date.now(),
    };
  } else if (isNoBall) {
    animationEvent = {
      id: `ev-${Date.now()}`,
      type: 'FREE_HIT',
      title: 'NO BALL • FREE HIT',
      subtitle: 'Next delivery is a Free Hit!',
      durationMs: 4000,
      timestamp: Date.now(),
    };
  } else if (striker && striker.runs >= 100 && striker.runs - batterRuns < 100) {
    animationEvent = {
      id: `ev-${Date.now()}`,
      type: 'HUNDRED',
      title: 'CENTURY! 100',
      subtitle: `${striker.playerName} brings up magnificent 100!`,
      durationMs: 4500,
      timestamp: Date.now(),
    };
  } else if (striker && striker.runs >= 50 && striker.runs - batterRuns < 50) {
    animationEvent = {
      id: `ev-${Date.now()}`,
      type: 'FIFTY',
      title: 'HALF CENTURY! 50',
      subtitle: `${striker.playerName} reaches 50 runs!`,
      durationMs: 4000,
      timestamp: Date.now(),
    };
  } else if (matchCompleted) {
    animationEvent = {
      id: `ev-${Date.now()}`,
      type: 'MATCH_RESULT',
      title: 'MATCH RESULT',
      subtitle: newMatch.resultSummary || 'Match Finished',
      durationMs: 6000,
      timestamp: Date.now(),
    };
  } else if (inningsCompleted && newMatch.currentInningIndex === 0) {
    animationEvent = {
      id: `ev-${Date.now()}`,
      type: 'INNINGS_BREAK',
      title: 'INNINGS BREAK',
      subtitle: `Target: ${inning.runs + 1} runs in ${settings.totalOvers} overs`,
      durationMs: 5000,
      timestamp: Date.now(),
    };
  }

  return {
    updatedMatch: newMatch,
    animationEvent,
    overCompleted,
    wicketFell,
    inningsCompleted,
    matchCompleted,
  };
}

// Undo Last Delivery
export function undoLastDelivery(match: Match): Match {
  const currentInning = match.innings[match.currentInningIndex];
  if (!currentInning || currentInning.deliveries.length === 0) {
    return match;
  }

  // Create deep clone
  const newMatch: Match = JSON.parse(JSON.stringify(match));
  const inning = newMatch.innings[newMatch.currentInningIndex];

  // Remove the last delivery
  const lastDelivery = inning.deliveries.pop();
  if (!lastDelivery) return match;

  // Re-build inning stats cleanly from ground up from the remaining deliveries
  // to ensure 100% mathematical integrity across all fields!
  const remainingDeliveries = [...inning.deliveries];

  // Reset counters
  inning.runs = 0;
  inning.wickets = 0;
  inning.legalBalls = 0;
  inning.oversString = '0.0';
  inning.currentOverLegalBalls = 0;
  inning.isCompleted = false;
  newMatch.isMatchCompleted = false;
  newMatch.winnerTeamId = undefined;
  newMatch.resultSummary = undefined;
  inning.freeHitActive = false;
  inning.extras = { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0, total: 0 };
  inning.fallOfWickets = [];
  inning.overs = [];
  inning.partnerships = [];

  // Reset all batters
  inning.batters.forEach((b) => {
    b.runs = 0;
    b.balls = 0;
    b.fours = 0;
    b.sixes = 0;
    b.isOut = false;
    b.dismissalType = undefined;
    b.dismissalText = undefined;
    b.bowlerId = undefined;
    b.bowlerName = undefined;
    b.fielderName = undefined;
    b.strikeRate = 0;
  });

  // Reset all bowlers
  inning.bowlers.forEach((bw) => {
    bw.legalBalls = 0;
    bw.maidens = 0;
    bw.runsConceded = 0;
    bw.wickets = 0;
    bw.wides = 0;
    bw.noBalls = 0;
    bw.economy = 0;
  });

  // Set opening partnership
  const b1 = inning.batters[0] || { playerId: 'p1', playerName: 'Batter 1' };
  const b2 = inning.batters[1] || { playerId: 'p2', playerName: 'Batter 2' };
  inning.currentPartnership = {
    batter1Id: b1.playerId,
    batter1Name: b1.playerName,
    batter1Runs: 0,
    batter2Id: b2.playerId,
    batter2Name: b2.playerName,
    batter2Runs: 0,
    totalRuns: 0,
    balls: 0,
    isActive: true,
  };

  // Re-apply deliveries
  inning.deliveries = [];
  remainingDeliveries.forEach((d) => {
    processDelivery(newMatch, {
      batterRuns: d.batterRuns,
      extraType: d.extraType,
      extraRuns: d.extraRuns,
      isWicket: d.isWicket,
      wicketType: d.wicketType,
      dismissedPlayerId: d.dismissedPlayerId,
      fielderName: d.fielderName,
      commentary: d.commentary,
    });
  });

  return newMatch;
}

// Start 2nd Innings
export function startSecondInnings(
  match: Match,
  strikerId: string,
  nonStrikerId: string,
  openingBowlerId: string
): Match {
  const newMatch: Match = JSON.parse(JSON.stringify(match));
  const team1Inning = newMatch.innings[0];
  team1Inning.isCompleted = true;

  const battingTeam = newMatch.teamBPlayingXI;
  const striker = battingTeam.find((p) => p.id === strikerId) || battingTeam[0];
  const nonStriker = battingTeam.find((p) => p.id === nonStrikerId) || battingTeam[1];

  const bowlingTeam = newMatch.teamAPlayingXI;
  const openingBowler = bowlingTeam.find((p) => p.id === openingBowlerId) || bowlingTeam[0];

  const secondInning: InningsState = {
    inningIndex: 1,
    battingTeamId: newMatch.teamB.id,
    battingTeamName: newMatch.teamB.name,
    bowlingTeamId: newMatch.teamA.id,
    bowlingTeamName: newMatch.teamA.name,
    runs: 0,
    wickets: 0,
    legalBalls: 0,
    oversString: '0.0',
    currentOverLegalBalls: 0,
    isCompleted: false,
    strikerId: striker.id,
    nonStrikerId: nonStriker.id,
    currentBowlerId: openingBowler.id,
    batters: [
      {
        playerId: striker.id,
        playerName: striker.name,
        shortName: striker.shortName || striker.name,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
        battingOrder: 1,
        strikeRate: 0,
      },
      {
        playerId: nonStriker.id,
        playerName: nonStriker.name,
        shortName: nonStriker.shortName || nonStriker.name,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
        battingOrder: 2,
        strikeRate: 0,
      },
    ],
    bowlers: [
      {
        playerId: openingBowler.id,
        playerName: openingBowler.name,
        shortName: openingBowler.shortName || openingBowler.name,
        legalBalls: 0,
        maidens: 0,
        runsConceded: 0,
        wickets: 0,
        wides: 0,
        noBalls: 0,
        economy: 0,
      },
    ],
    extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0, total: 0 },
    fallOfWickets: [],
    partnerships: [],
    currentPartnership: {
      batter1Id: striker.id,
      batter1Name: striker.name,
      batter1Runs: 0,
      batter2Id: nonStriker.id,
      batter2Name: nonStriker.name,
      batter2Runs: 0,
      totalRuns: 0,
      balls: 0,
      isActive: true,
    },
    overs: [],
    deliveries: [],
    freeHitActive: false,
    powerplayActive: true,
  };

  newMatch.innings.push(secondInning);
  newMatch.currentInningIndex = 1;
  return newMatch;
}

// Select Next Batter
export function setNextBatter(match: Match, newPlayer: Player, replacesStriker: boolean): Match {
  const newMatch: Match = JSON.parse(JSON.stringify(match));
  const inning = newMatch.innings[newMatch.currentInningIndex];
  if (!inning) return match;

  let existingBatter = inning.batters.find((b) => b.playerId === newPlayer.id);
  if (!existingBatter) {
    existingBatter = {
      playerId: newPlayer.id,
      playerName: newPlayer.name,
      shortName: newPlayer.shortName || newPlayer.name,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
      battingOrder: inning.batters.length + 1,
      strikeRate: 0,
    };
    inning.batters.push(existingBatter);
  }

  if (replacesStriker) {
    inning.strikerId = newPlayer.id;
  } else {
    inning.nonStrikerId = newPlayer.id;
  }

  // Start new partnership
  const otherBatter = inning.batters.find((b) => b.playerId === (replacesStriker ? inning.nonStrikerId : inning.strikerId));
  inning.currentPartnership = {
    batter1Id: newPlayer.id,
    batter1Name: newPlayer.name,
    batter1Runs: 0,
    batter2Id: otherBatter?.playerId || '',
    batter2Name: otherBatter?.playerName || '',
    batter2Runs: otherBatter?.runs || 0,
    totalRuns: 0,
    balls: 0,
    isActive: true,
  };

  return newMatch;
}

// Select Next Bowler
export function setNextBowler(match: Match, newBowlerPlayer: Player): Match {
  const newMatch: Match = JSON.parse(JSON.stringify(match));
  const inning = newMatch.innings[newMatch.currentInningIndex];
  if (!inning) return match;

  inning.currentBowlerId = newBowlerPlayer.id;

  let existingBowler = inning.bowlers.find((bw) => bw.playerId === newBowlerPlayer.id);
  if (!existingBowler) {
    existingBowler = {
      playerId: newBowlerPlayer.id,
      playerName: newBowlerPlayer.name,
      shortName: newBowlerPlayer.shortName || newBowlerPlayer.name,
      legalBalls: 0,
      maidens: 0,
      runsConceded: 0,
      wickets: 0,
      wides: 0,
      noBalls: 0,
      economy: 0,
    };
    inning.bowlers.push(existingBowler);
  }

  return newMatch;
}
