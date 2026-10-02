import React, { useState } from 'react';
import { Match, Player } from '../../types/cricket.js';
import {
  processDelivery,
  undoLastDelivery,
  startSecondInnings,
  setNextBatter,
  setNextBowler,
  calculateRunRate,
} from '../../services/cricketEngine.js';
import { liveSync } from '../../services/liveSync.js';
import { WicketModal } from './WicketModal.js';
import { NewBatterModal } from './NewBatterModal.js';
import { NextBowlerModal } from './NextBowlerModal.js';
import { MatchSummaryModal } from './MatchSummaryModal.js';
import { ExtraRunsModal } from './ExtraRunsModal.js';
import { ChangeBatterModal } from './ChangeBatterModal.js';

interface LiveScoringPanelProps {
  match: Match;
  onOpenScorecard: () => void;
  onOpenSetup: () => void;
  onOpenTeams: () => void;
  onOpenPlayers: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenMobileConnect?: () => void;
}

export function LiveScoringPanel({
  match,
  onOpenScorecard,
  onOpenSetup,
  onOpenTeams,
  onOpenPlayers,
  onOpenHistory,
  onOpenSettings,
  onOpenMobileConnect,
}: LiveScoringPanelProps) {
  const [isWicketModalOpen, setIsWicketModalOpen] = useState(false);
  const [isNewBatterModalOpen, setIsNewBatterModalOpen] = useState(false);
  const [isNextBowlerModalOpen, setIsNextBowlerModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [replacesStriker, setReplacesStriker] = useState(true);
  const [scoringLocked, setScoringLocked] = useState(false);
  const [extraInputRuns, setExtraInputRuns] = useState<number>(0);
  const [extraModalMode, setExtraModalMode] = useState<'WIDE_PLUS' | 'NO_BALL_PLUS' | 'BYE_PLUS' | 'LEG_BYE_PLUS' | null>(null);
  const [isSecondInningsModalOpen, setIsSecondInningsModalOpen] = useState(false);
  const [isChangeBatterModalOpen, setIsChangeBatterModalOpen] = useState(false);
  const [isEndInningModalOpen, setIsEndInningModalOpen] = useState(false);

  const currentInning = match.innings[match.currentInningIndex];
  if (!currentInning) return null;

  // Active players
  const striker = currentInning.batters.find((b) => b.playerId === currentInning.strikerId);
  const nonStriker = currentInning.batters.find((b) => b.playerId === currentInning.nonStrikerId);
  const bowler = currentInning.bowlers.find((bw) => bw.playerId === currentInning.currentBowlerId);

  // Teams
  const battingTeam = currentInning.battingTeamId === match.teamA.id ? match.teamA : match.teamB;
  const bowlingTeam = currentInning.bowlingTeamId === match.teamA.id ? match.teamA : match.teamB;

  // Run rates
  const crr = calculateRunRate(currentInning.runs, currentInning.legalBalls);

  // 2nd innings info
  const isSecondInning = match.currentInningIndex === 1 && match.innings[0];
  const targetRuns = isSecondInning ? match.innings[0].runs + 1 : 0;
  const runsNeeded = isSecondInning ? Math.max(0, targetRuns - currentInning.runs) : 0;
  const ballsRemaining = isSecondInning
    ? Math.max(0, match.settings.totalOvers * 6 - currentInning.legalBalls)
    : 0;
  const rrr =
    isSecondInning && ballsRemaining > 0 ? Number(((runsNeeded / (ballsRemaining / 6))).toFixed(2)) : 0;

  // Current over balls
  const currentOverIndex = Math.floor(currentInning.legalBalls / 6);
  const currentOverDeliveries = currentInning.deliveries.filter(
    (d) => d.inningIndex === match.currentInningIndex && d.overIndex === currentOverIndex
  );
  const currentOverRuns = currentOverDeliveries.reduce((sum, d) => sum + d.totalDeliveryRuns, 0);

  // Guard against duplicate accidental rapid clicks
  const scoreBall = async (
    runs: number,
    extraType?: 'WIDE' | 'NO_BALL' | 'BYE' | 'LEG_BYE' | 'PENALTY',
    extraRunsArg: number = 0
  ) => {
    if (scoringLocked || currentInning.isCompleted || match.isMatchCompleted) return;
    setScoringLocked(true);

    try {
      const extraRunsToApply = extraRunsArg > 0 ? extraRunsArg : (extraInputRuns > 0 ? extraInputRuns : undefined);

      const result = processDelivery(match, {
        batterRuns: runs,
        extraType,
        extraRuns: extraRunsToApply,
      });

      // Clear extra runs input
      setExtraInputRuns(0);

      // Save match to backend and sync
      await liveSync.updateMatch(result.updatedMatch);

      // Trigger broadcast animation if applicable
      if (result.animationEvent) {
        liveSync.triggerBroadcastEvent(result.animationEvent);
      }

      // Handle modals & state transitions
      if (result.wicketFell) {
        setReplacesStriker(true);
        setIsNewBatterModalOpen(true);
      } else if (result.overCompleted && !result.inningsCompleted) {
        setIsNextBowlerModalOpen(true);
      } else if (result.inningsCompleted && match.currentInningIndex === 0) {
        setIsSecondInningsModalOpen(true);
      }
    } finally {
      setScoringLocked(false);
    }
  };

  const handleConfirmWide = async (additionalRuns: number) => {
    setExtraModalMode(null);
    await scoreBall(0, 'WIDE', additionalRuns);
  };

  const handleConfirmNoBall = async (batterRuns: number, isOffBat: boolean, byeRuns: number) => {
    setExtraModalMode(null);
    if (isOffBat) {
      await scoreBall(batterRuns, 'NO_BALL', 0);
    } else {
      await scoreBall(0, 'NO_BALL', byeRuns);
    }
  };

  const handleConfirmBye = async (runs: number, isLegBye: boolean) => {
    setExtraModalMode(null);
    await scoreBall(runs, isLegBye ? 'LEG_BYE' : 'BYE', runs);
  };

  const handleWicketConfirm = async (data: any) => {
    setIsWicketModalOpen(false);
    setScoringLocked(true);

    try {
      const result = processDelivery(match, {
        batterRuns: data.batterRuns,
        extraType: data.extraType,
        isWicket: true,
        wicketType: data.wicketType,
        dismissedPlayerId: data.dismissedPlayerId,
        fielderName: data.fielderName,
      });

      await liveSync.updateMatch(result.updatedMatch);

      if (result.animationEvent) {
        liveSync.triggerBroadcastEvent(result.animationEvent);
      }

      const dismissedWasStriker = data.dismissedPlayerId === currentInning.strikerId;
      setReplacesStriker(dismissedWasStriker);

      if (!result.inningsCompleted) {
        setIsNewBatterModalOpen(true);
      } else if (match.currentInningIndex === 0) {
        setIsSecondInningsModalOpen(true);
      }
    } finally {
      setTimeout(() => setScoringLocked(false), 200);
    }
  };

  const handleSelectNewBatter = async (newPlayer: Player) => {
    setIsNewBatterModalOpen(false);
    const updated = setNextBatter(match, newPlayer, replacesStriker);
    await liveSync.updateMatch(updated);
  };

  const handleSelectNextBowler = async (newBowler: Player) => {
    setIsNextBowlerModalOpen(false);
    const updated = setNextBowler(match, newBowler);
    await liveSync.updateMatch(updated);
  };

  const handleUndo = async () => {
    if (scoringLocked) return;
    const restored = undoLastDelivery(match);
    await liveSync.updateMatch(restored);
  };

  const handleSwapStrike = async () => {
    if (scoringLocked) return;
    const newMatch: Match = JSON.parse(JSON.stringify(match));
    const inn = newMatch.innings[newMatch.currentInningIndex];
    if (inn) {
      const temp = inn.strikerId;
      inn.strikerId = inn.nonStrikerId;
      inn.nonStrikerId = temp;
      await liveSync.updateMatch(newMatch);
    }
  };

  const handleStartSecondInnings = async (sId: string, nsId: string, bId: string) => {
    setIsSecondInningsModalOpen(false);
    const updated = startSecondInnings(match, sId, nsId, bId);
    await liveSync.updateMatch(updated);
  };

  const handleEndInning = () => {
    if (scoringLocked || currentInning.isCompleted) return;
    setIsEndInningModalOpen(true);
  };

  const executeEndInning = async () => {
    setIsEndInningModalOpen(false);
    if (scoringLocked || currentInning.isCompleted) return;
    setScoringLocked(true);
    try {
      const newMatch: Match = JSON.parse(JSON.stringify(match));
      const inn = newMatch.innings[newMatch.currentInningIndex];
      if (inn) {
        inn.isCompleted = true;
      }

      if (newMatch.currentInningIndex === 0) {
        await liveSync.updateMatch(newMatch);
        setIsSecondInningsModalOpen(true);
      } else {
        newMatch.isMatchCompleted = true;
        const score1 = newMatch.innings[0].runs;
        const score2 = inn.runs;
        const wickets2 = inn.wickets;
        if (score2 > score1) {
          newMatch.winnerTeamId = newMatch.innings[1].battingTeamId;
          newMatch.resultSummary = `${newMatch.innings[1].battingTeamName} won by ${10 - wickets2} wickets`;
        } else if (score1 > score2) {
          newMatch.winnerTeamId = newMatch.innings[0].battingTeamId;
          newMatch.resultSummary = `${newMatch.innings[0].battingTeamName} won by ${score1 - score2} runs`;
        } else {
          newMatch.resultSummary = `Match Tied`;
        }
        await liveSync.updateMatch(newMatch);
      }
    } finally {
      setScoringLocked(false);
    }
  };

  const executeAbandonMatch = async () => {
    setIsEndInningModalOpen(false);
    if (scoringLocked) return;
    setScoringLocked(true);
    try {
      const newMatch: Match = JSON.parse(JSON.stringify(match));
      newMatch.innings.forEach((inn) => {
        inn.isCompleted = true;
      });
      newMatch.isMatchCompleted = true;
      newMatch.winnerTeamId = undefined;
      newMatch.resultSummary = 'Match Abandoned (Rain / Technical Issue)';
      await liveSync.updateMatch(newMatch);
    } finally {
      setScoringLocked(false);
    }
  };

  const handleConfirmChangeBatter = async (isStriker: boolean, newPlayer: Player) => {
    setIsChangeBatterModalOpen(false);
    const newMatch: Match = JSON.parse(JSON.stringify(match));
    const inn = newMatch.innings[newMatch.currentInningIndex];
    if (inn) {
      if (isStriker) {
        inn.strikerId = newPlayer.id;
        const existing = inn.batters.find((b) => b.playerId === newPlayer.id);
        if (!existing) {
          inn.batters.push({
            playerId: newPlayer.id,
            playerName: newPlayer.name,
            shortName: newPlayer.shortName || newPlayer.name,
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            isOut: false,
            battingOrder: inn.batters.length + 1,
            strikeRate: 0,
          });
        }
      } else {
        inn.nonStrikerId = newPlayer.id;
        const existing = inn.batters.find((b) => b.playerId === newPlayer.id);
        if (!existing) {
          inn.batters.push({
            playerId: newPlayer.id,
            playerName: newPlayer.name,
            shortName: newPlayer.shortName || newPlayer.name,
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            isOut: false,
            battingOrder: inn.batters.length + 1,
            strikeRate: 0,
          });
        }
      }
      await liveSync.updateMatch(newMatch);
    }
  };

  const handleSaveToHistory = async () => {
    await liveSync.saveMatchToHistory(match, true);
    alert('Match saved to history successfully and player career stats updated!');
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* TOP NAVIGATION / STATUS BAR - HIDDEN ON MOBILE */}
      <div className="hidden sm:flex bg-[#080d19] border border-slate-800 rounded-2xl p-4 flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-emerald-500 text-black px-3 py-1 rounded-lg font-heading font-black text-xs tracking-wider">
            <span>ITC SPORTS</span>
          </div>
          <div>
            <h1 className="font-heading font-black text-lg text-white tracking-wide">
              {match.matchName} • {match.settings.format} ({match.settings.totalOvers} Ov)
            </h1>
            <div className="text-xs text-slate-400">
              {match.tournamentName} • {match.venue}
            </div>
          </div>
        </div>

        {/* TOP QUICK ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenMobileConnect && (
            <button
              type="button"
              onClick={onOpenMobileConnect}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl font-heading text-xs font-black transition-transform active:scale-95 shadow-md flex items-center gap-1.5"
            >
              <span>📱 MOBILE LINK</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsSummaryModalOpen(true)}
            className="px-3.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-300 rounded-xl font-heading text-xs font-bold transition-transform active:scale-95"
          >
            📋 MATCH SUMMARY
          </button>
          <button
            type="button"
            onClick={onOpenScorecard}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-heading text-xs font-bold transition-transform active:scale-95"
          >
            📊 FULL SCORECARD
          </button>
          <button
            type="button"
            onClick={onOpenSetup}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-heading text-xs font-bold transition-transform active:scale-95"
          >
            ⚙️ MATCH SETUP
          </button>
          <button
            type="button"
            onClick={onOpenTeams}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl font-heading text-xs"
          >
            Teams
          </button>
          <button
            type="button"
            onClick={onOpenPlayers}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl font-heading text-xs"
          >
            Players
          </button>
          <button
            type="button"
            onClick={onOpenHistory}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl font-heading text-xs"
          >
            History
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl font-heading text-xs"
          >
            Overlay & Sponsor
          </button>
        </div>
      </div>

      {/* MATCH RESULT OR INNINGS ALERT */}
      {match.isMatchCompleted && (
        <div className="bg-emerald-950 border-2 border-emerald-500 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl">
          <div className="text-center sm:text-left">
            <span className="text-[10px] font-heading uppercase tracking-widest text-emerald-400 font-bold">
              MATCH FINISHED
            </span>
            <div className="font-heading font-black text-xl text-white">
              {match.resultSummary || 'Match Completed'}
            </div>
          </div>
          <button
            type="button"
            onClick={handleSaveToHistory}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black font-heading text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform active:scale-95"
          >
            Save Match to Archive & Update Career Stats
          </button>
        </div>
      )}

      {currentInning.isCompleted && !match.isMatchCompleted && match.currentInningIndex === 0 && (
        <div className="bg-amber-950/80 border-2 border-amber-500 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl">
          <div>
            <span className="text-[10px] font-heading uppercase tracking-widest text-amber-400 font-bold">
              INNINGS BREAK
            </span>
            <div className="font-heading font-black text-lg text-white">
              {match.teamA.name} scored {currentInning.runs}/{currentInning.wickets} in {currentInning.oversString} overs.
              Target for {match.teamB.name} is {currentInning.runs + 1} runs.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSecondInningsModalOpen(true)}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black font-heading text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform active:scale-95"
          >
            Start 2nd Innings
          </button>
        </div>
      )}

      {/* MAIN SCOREBOARD HUB */}
      <div className="bg-[#070b14] border-2 border-emerald-500/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
        {/* TEAM NAMES, STATUS & FREE HIT / POWERPLAY BADGES */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            {battingTeam.logoUrl ? (
              <img
                src={battingTeam.logoUrl}
                alt={battingTeam.shortName}
                className="w-12 h-12 object-contain rounded-xl p-1 bg-black/60 border border-slate-700 shadow-md"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center font-heading font-bold text-emerald-400 text-sm">
                {battingTeam.shortName}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-2xl text-white">{battingTeam.name}</span>
                <span className="text-xs bg-emerald-950 border border-emerald-700/60 text-emerald-400 px-2 py-0.5 rounded font-heading font-bold">
                  {match.currentInningIndex === 0 ? '1ST INNINGS' : '2ND INNINGS'}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Bowling: <strong className="text-slate-200">{bowlingTeam.name}</strong>
              </div>
            </div>
          </div>

          {/* INDICATORS: FREE HIT, POWERPLAY, CRR/RRR */}
          <div className="flex flex-wrap items-center gap-2">
            {currentInning.freeHitActive && (
              <div className="bg-amber-500 text-black px-3 py-1 rounded-lg font-black font-heading text-xs uppercase tracking-wider animate-freehit-glow shadow-md flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-black animate-ping" />
                FREE HIT ACTIVE
              </div>
            )}

            {currentInning.powerplayActive && (
              <div className="bg-emerald-500 text-black px-3 py-1 rounded-lg font-bold font-heading text-xs uppercase tracking-wider shadow-md">
                POWERPLAY ({match.settings.powerplayOvers.start}-{match.settings.powerplayOvers.end})
              </div>
            )}

            <div className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg text-xs font-heading text-slate-300">
              CRR: <strong className="text-emerald-400 font-numbers text-sm">{crr.toFixed(2)}</strong>
            </div>

            {isSecondInning && (
              <div className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg text-xs font-heading text-slate-300 flex items-center gap-2">
                <span>
                  TARGET: <strong className="text-emerald-400 font-numbers text-sm">{targetRuns}</strong>
                </span>
                <span>
                  NEED: <strong className="text-amber-400 font-numbers text-sm">{runsNeeded}</strong> OFF{' '}
                  <strong className="text-white font-numbers text-sm">{ballsRemaining}</strong>b
                </span>
                <span>
                  RRR: <strong className="text-emerald-400 font-numbers text-sm">{rrr.toFixed(2)}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* MOBILE COMPACT SCORE & PLAYERS (MOBILE ONLY) */}
        <div className="block sm:hidden bg-slate-900/60 border border-slate-800 rounded-xl p-3 mb-3 space-y-2">
          {/* Main Runs & Wickets & Overs */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-numbers text-5xl font-black text-white tracking-tight leading-none">
                {currentInning.runs}
              </span>
              <span className="font-numbers text-4xl font-black text-emerald-400 leading-none">
                /{currentInning.wickets}
              </span>
            </div>
            <div className="text-right">
              <div className="font-numbers text-2xl font-black text-slate-200 leading-none">
                {currentInning.oversString}
              </div>
              <div className="text-[9px] uppercase font-heading tracking-widest text-slate-400 mt-0.5">
                OVERS
              </div>
            </div>
          </div>

          {/* Bowler under score */}
          <div className="text-xs font-heading text-slate-300 pt-1.5 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-emerald-400 font-bold shrink-0">BOWL:</span>
            <span className="text-white font-semibold truncate mx-2">{bowler?.playerName || 'Bowler'}</span>
            <span className="font-numbers text-emerald-300 shrink-0">
              {bowler ? `${Math.floor(bowler.legalBalls / 6)}.${bowler.legalBalls % 6}` : '0.0'} ov • {bowler?.wickets ?? 0}w-{bowler?.runsConceded ?? 0}r
            </span>
          </div>

          {/* Striker & Non-Striker compact text rows without outlines */}
          <div className="space-y-1 pt-1.5 border-t border-slate-800/80 text-xs font-heading">
            <div className="flex items-center justify-between text-slate-200">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-emerald-400 font-bold">▶</span>
                <span className="font-bold text-white truncate">{striker?.playerName || 'Striker'}</span>
              </div>
              <span className="font-numbers text-emerald-300 font-bold shrink-0 ml-2">{striker?.runs ?? 0}* <span className="text-slate-400 font-normal">({striker?.balls ?? 0}b)</span></span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-slate-500">○</span>
                <span className="font-medium text-slate-300 truncate">{nonStriker?.playerName || 'Non-Striker'}</span>
              </div>
              <span className="font-numbers text-slate-300 shrink-0 ml-2">{nonStriker?.runs ?? 0}* <span className="text-slate-500 font-normal">({nonStriker?.balls ?? 0}b)</span></span>
            </div>
          </div>
        </div>

        {/* DESKTOP SCORE & ACTIVE PLAYERS ROW */}
        <div className="hidden sm:flex bg-slate-900/60 border border-slate-800 rounded-2xl p-4 mb-4 flex-col md:flex-row items-center justify-between gap-4">
          {/* Main Runs & Wickets & Overs */}
          <div className="flex items-baseline gap-3">
            <div className="flex items-baseline gap-1">
              <span className="font-numbers text-5xl sm:text-6xl font-black text-white tracking-tight leading-none">
                {currentInning.runs}
              </span>
              <span className="font-numbers text-4xl sm:text-5xl font-black text-emerald-400 leading-none">
                /{currentInning.wickets}
              </span>
            </div>
            <div className="pl-3 border-l border-slate-800">
              <div className="font-numbers text-2xl sm:text-3xl font-black text-slate-200 leading-none">
                {currentInning.oversString}
              </div>
              <div className="text-[9px] uppercase font-heading tracking-widest text-slate-400 mt-0.5">
                OVERS
              </div>
            </div>
          </div>

          {/* Compact Striker, Non-Striker & Bowler Line */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-heading">
            <div className="bg-emerald-950/60 border border-emerald-500/60 px-3 py-2 rounded-xl flex items-center gap-2">
              <span className="text-emerald-400 font-bold">▶ STR:</span>
              <span className="text-white font-black">{striker?.playerName || 'Striker'}</span>
              <span className="font-numbers text-emerald-300 font-bold">({striker?.runs ?? 0}* / {striker?.balls ?? 0}b)</span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 px-3 py-2 rounded-xl flex items-center gap-2">
              <span className="text-slate-400 font-bold">NON-STR:</span>
              <span className="text-slate-200 font-bold">{nonStriker?.playerName || 'Non-Striker'}</span>
              <span className="font-numbers text-slate-400">({nonStriker?.runs ?? 0}* / {nonStriker?.balls ?? 0}b)</span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 px-3 py-2 rounded-xl flex items-center gap-2">
              <span className="text-emerald-400 font-bold">BOWL:</span>
              <span className="text-white font-bold">{bowler?.playerName || 'Bowler'}</span>
              <span className="font-numbers text-emerald-300">({bowler ? `${Math.floor(bowler.legalBalls / 6)}.${bowler.legalBalls % 6}` : '0.0'} ov, {bowler?.wickets ?? 0}w-{bowler?.runsConceded ?? 0}r)</span>
            </div>
          </div>
        </div>

        {/* CURRENT OVER SEQUENCE TIMELINE */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 sm:p-3.5 mb-6 flex items-center justify-between gap-3 overflow-hidden">
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            <span className="text-xs uppercase font-heading text-emerald-400 font-bold shrink-0">
              OVER {currentOverIndex + 1}:
            </span>
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-0.5 max-w-full">
              {currentOverDeliveries.length === 0 ? (
                <span className="text-xs text-slate-500 font-heading shrink-0">Ready for first delivery...</span>
              ) : (
                currentOverDeliveries.map((d) => {
                  let badge = 'bg-slate-800 text-slate-200 border-slate-700';
                  let text = `${d.totalDeliveryRuns}`;
                  if (d.isWicket) {
                    badge = 'bg-rose-600 text-white font-bold border-rose-500';
                    text = 'W';
                  } else if (d.isSix) {
                    badge = 'bg-amber-500 text-black font-black border-amber-400';
                    text = '6';
                  } else if (d.isFour) {
                    badge = 'bg-emerald-500 text-black font-bold border-emerald-400';
                    text = '4';
                  } else if (d.extraType === 'WIDE') {
                    badge = 'bg-purple-900 text-purple-200 border-purple-600';
                    text = d.extraRuns > 1 ? `${d.extraRuns}wd` : 'wd';
                  } else if (d.extraType === 'NO_BALL') {
                    badge = 'bg-orange-900 text-orange-200 border-orange-500';
                    text = d.batterRuns > 0 ? `${d.batterRuns}nb` : (d.extraRuns > 1 ? `${d.extraRuns}nb` : 'nb');
                  } else if (d.batterRuns === 0 && !d.extraType) {
                    badge = 'bg-slate-950 text-slate-400 border-slate-800';
                    text = '•';
                  }

                  return (
                    <div
                      key={d.id}
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-numbers text-xs border shrink-0 ${badge}`}
                    >
                      {text}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[11px] sm:text-xs text-slate-400 font-heading">Total: </span>
            <span className="font-numbers text-sm sm:text-base font-bold text-white">{currentOverRuns}</span>
          </div>
        </div>

        {/* PRIMARY SCORING PAD (LARGE TACTILE TOUCH TARGETS) */}
        <div className="space-y-4">
          {/* RUN BUTTONS (0 - 6) - EXTRA LARGE MOBILE TOUCH TARGETS */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
            {[
              { runs: 0, label: '0 • DOT', short: 'DOT' },
              { runs: 1, label: '1 SINGLE', short: '1' },
              { runs: 2, label: '2 RUNS', short: '2' },
              { runs: 3, label: '3 RUNS', short: '3' },
              { runs: 4, label: '4 FOUR', short: '4', isFour: true },
              { runs: 5, label: '5 RUNS', short: '5' },
              { runs: 6, label: '6 SIX', short: '6', isSix: true },
            ].map((btn) => (
              <button
                key={btn.runs}
                type="button"
                disabled={scoringLocked || currentInning.isCompleted}
                onClick={() => scoreBall(btn.runs)}
                className={`py-5 sm:py-6 px-1 rounded-2xl font-heading font-black uppercase transition-all shadow-xl active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex flex-col items-center justify-center ${
                  btn.isFour
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-black border-2 border-emerald-300 shadow-emerald-900/50'
                    : btn.isSix
                    ? 'bg-amber-500 hover:bg-amber-400 text-black border-2 border-amber-200 shadow-amber-900/50 font-black'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-100 border-2 border-slate-700 hover:border-slate-500'
                }`}
              >
                <span className="font-numbers text-3xl sm:text-4xl block leading-none mb-1">{btn.runs}</span>
                <span className="text-[10px] sm:text-xs tracking-wider text-slate-300 block font-bold">
                  {btn.short}
                </span>
              </button>
            ))}
          </div>

          {/* EXTRAS ROW & WICKET BUTTON (POPUP-BASED, SAVING MASSIVE SPACE) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {/* WIDE BUTTON */}
            <button
              type="button"
              disabled={scoringLocked || currentInning.isCompleted}
              onClick={() => setExtraModalMode('WIDE_PLUS')}
              className="py-3 bg-purple-950/80 hover:bg-purple-900 border border-purple-600 text-purple-200 rounded-xl font-heading font-bold text-xs uppercase shadow-md transition-all active:scale-95 disabled:opacity-40"
            >
              WIDE (+RUNS)
            </button>

            {/* NO BALL BUTTON */}
            <button
              type="button"
              disabled={scoringLocked || currentInning.isCompleted}
              onClick={() => setExtraModalMode('NO_BALL_PLUS')}
              className="py-3 bg-orange-950/80 hover:bg-orange-900 border border-orange-500 text-orange-200 rounded-xl font-heading font-bold text-xs uppercase shadow-md transition-all active:scale-95 disabled:opacity-40"
            >
              NO BALL (+RUNS)
            </button>

            {/* BYE BUTTON */}
            <button
              type="button"
              disabled={scoringLocked || currentInning.isCompleted}
              onClick={() => setExtraModalMode('BYE_PLUS')}
              className="py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl font-heading font-bold text-xs uppercase shadow-md transition-all active:scale-95 disabled:opacity-40"
            >
              BYES (+RUNS)
            </button>

            {/* LEG BYE BUTTON */}
            <button
              type="button"
              disabled={scoringLocked || currentInning.isCompleted}
              onClick={() => setExtraModalMode('LEG_BYE_PLUS')}
              className="py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl font-heading font-bold text-xs uppercase shadow-md transition-all active:scale-95 disabled:opacity-40"
            >
              LEG BYES (+RUNS)
            </button>

            {/* PENALTY */}
            <button
              type="button"
              disabled={scoringLocked || currentInning.isCompleted}
              onClick={() => scoreBall(5, 'PENALTY')}
              className="py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl font-heading font-bold text-xs uppercase shadow-md transition-all active:scale-95 disabled:opacity-40"
            >
              PENALTY (+5)
            </button>

            {/* WICKET BUTTON (OPENS WICKET MODAL) */}
            <button
              type="button"
              disabled={scoringLocked || currentInning.isCompleted}
              onClick={() => setIsWicketModalOpen(true)}
              className="py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-heading font-black text-sm uppercase tracking-wider shadow-lg shadow-rose-950 transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
              WICKET
            </button>
          </div>

          {/* UTILITY ROW: SWAP STRIKE, CHANGE BOWLER, CHANGE BATTER, UNDO */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSwapStrike}
                disabled={scoringLocked}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-heading text-xs font-bold transition-all active:scale-95"
              >
                ⇄ SWAP STRIKE
              </button>

              <button
                type="button"
                onClick={() => setIsNextBowlerModalOpen(true)}
                disabled={scoringLocked}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-heading text-xs font-bold transition-all active:scale-95"
              >
                CHANGE BOWLER
              </button>

              <button
                type="button"
                onClick={() => setIsChangeBatterModalOpen(true)}
                disabled={scoringLocked}
                className="px-4 py-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 rounded-xl font-heading text-xs font-bold transition-all active:scale-95"
              >
                👤 CHANGE BATTER
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleEndInning}
                disabled={scoringLocked || currentInning.isCompleted}
                className="px-4 py-2 bg-amber-950/80 hover:bg-amber-900 border border-amber-600 text-amber-300 rounded-xl font-heading text-xs font-bold transition-all active:scale-95 disabled:opacity-30 flex items-center gap-1.5"
              >
                🏁 END INNING
              </button>
              <button
                type="button"
                onClick={handleUndo}
                disabled={scoringLocked || currentInning.deliveries.length === 0}
                className="px-5 py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-xl font-heading text-xs font-bold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                ↺ UNDO LAST BALL
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* POPUP MODALS */}
      <WicketModal
        isOpen={isWicketModalOpen}
        match={match}
        onConfirm={handleWicketConfirm}
        onCancel={() => setIsWicketModalOpen(false)}
      />

      <NewBatterModal
        isOpen={isNewBatterModalOpen}
        match={match}
        replacesStriker={replacesStriker}
        onSelectBatter={handleSelectNewBatter}
      />

      <ChangeBatterModal
        isOpen={isChangeBatterModalOpen}
        match={match}
        onClose={() => setIsChangeBatterModalOpen(false)}
        onConfirmChange={handleConfirmChangeBatter}
      />

      <NextBowlerModal
        isOpen={isNextBowlerModalOpen}
        match={match}
        onSelectBowler={handleSelectNextBowler}
      />

      <MatchSummaryModal
        isOpen={isSummaryModalOpen}
        match={match}
        onClose={() => setIsSummaryModalOpen(false)}
      />

      {/* EXTRA RUNS MODAL */}
      <ExtraRunsModal
        isOpen={!!extraModalMode}
        mode={extraModalMode}
        onConfirmWide={handleConfirmWide}
        onConfirmNoBall={handleConfirmNoBall}
        onConfirmBye={handleConfirmBye}
        onClose={() => setExtraModalMode(null)}
      />

      {/* END INNING / ABANDON MATCH MODAL */}
      {isEndInningModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b1324] border-2 border-amber-500 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-bold font-heading text-amber-400 uppercase tracking-wide mb-2 flex items-center gap-2">
              <span>⚠️</span> END INNING OR ABANDON MATCH?
            </h3>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Choose an option for stopping the match due to rain, technical failure, or stoppage:
            </p>
            <div className="space-y-3 mb-5">
              <button
                type="button"
                onClick={executeEndInning}
                className="w-full p-3 bg-amber-950/80 hover:bg-amber-900 border border-amber-600 rounded-xl text-left transition-all active:scale-95 flex flex-col"
              >
                <span className="font-heading font-black text-sm text-amber-200">
                  🏁 End Current Inning Only
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  {match.currentInningIndex === 0 ? 'Closes 1st innings and prompts to start 2nd innings' : 'Finalizes the match normally'}
                </span>
              </button>

              <button
                type="button"
                onClick={executeAbandonMatch}
                className="w-full p-3 bg-rose-950/80 hover:bg-rose-900 border border-rose-600 rounded-xl text-left transition-all active:scale-95 flex flex-col"
              >
                <span className="font-heading font-black text-sm text-rose-200">
                  🌧️ Abandon / Cancel Match (Rain / Technical)
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Fully cancels match, ends both 1st & 2nd innings at once ("Match Abandoned")
                </span>
              </button>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEndInningModalOpen(false)}
                className="px-4 py-2 text-slate-400 font-heading text-xs hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2ND INNINGS START MODAL */}
      {isSecondInningsModalOpen && (
        <SecondInningsModal
          match={match}
          onStart={handleStartSecondInnings}
          onCancel={() => setIsSecondInningsModalOpen(false)}
        />
      )}
    </div>
  );
}

function SecondInningsModal({
  match,
  onStart,
  onCancel,
}: {
  match: Match;
  onStart: (strikerId: string, nonStrikerId: string, bowlerId: string) => void;
  onCancel: () => void;
}) {
  const battingTeam = match.teamBPlayingXI;
  const bowlingTeam = match.teamAPlayingXI;

  const [sId, setSId] = useState(battingTeam[0]?.id || '');
  const [nsId, setNsId] = useState(battingTeam[1]?.id || '');
  const [bId, setBId] = useState(bowlingTeam[0]?.id || '');

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b1324] border-2 border-emerald-500 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100">
        <h3 className="text-xl font-bold font-heading text-emerald-400 uppercase tracking-wide mb-2">
          START 2ND INNINGS
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Target is <strong className="text-white">{(match.innings[0]?.runs ?? 0) + 1} runs</strong> in{' '}
          {match.settings.totalOvers} overs. Select the opening batters for {match.teamB.name} and opening bowler for{' '}
          {match.teamA.name}.
        </p>

        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-xs font-heading uppercase text-slate-400 mb-1">
              Opening Striker
            </label>
            <select
              value={sId}
              onChange={(e) => setSId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            >
              {battingTeam.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-heading uppercase text-slate-400 mb-1">
              Opening Non-Striker
            </label>
            <select
              value={nsId}
              onChange={(e) => setNsId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            >
              {battingTeam.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-heading uppercase text-slate-400 mb-1">
              Opening Bowler
            </label>
            <select
              value={bId}
              onChange={(e) => setBId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            >
              {bowlingTeam.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-400 font-heading text-xs">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onStart(sId, nsId, bId)}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black font-heading text-xs rounded-xl uppercase tracking-wider"
          >
            Commence 2nd Innings
          </button>
        </div>
      </div>
    </div>
  );
}
