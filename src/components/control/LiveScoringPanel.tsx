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

  const handleSaveToHistory = async () => {
    await liveSync.saveMatchToHistory(match, true);
    alert('Match saved to history successfully and player career stats updated!');
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* TOP NAVIGATION / STATUS BAR */}
      <div className="bg-[#080d19] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl">
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

        {/* MASSIVE SCORE & OVERS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-center mb-6">
          {/* Main Runs & Wickets */}
          <div className="flex items-baseline justify-between md:justify-start gap-2">
            <div className="flex items-baseline gap-1">
              <span className="font-numbers text-5xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-none drop-shadow-md">
                {currentInning.runs}
              </span>
              <span className="font-numbers text-4xl sm:text-5xl md:text-6xl font-black text-emerald-400 leading-none">
                /{currentInning.wickets}
              </span>
            </div>
            <div className="ml-2 sm:ml-4 pl-3 sm:pl-4 border-l border-slate-800">
              <div className="font-numbers text-2xl sm:text-3xl md:text-4xl font-black text-slate-200 leading-none">
                {currentInning.oversString}
              </div>
              <div className="text-[9px] sm:text-[10px] uppercase font-heading tracking-widest text-slate-400 mt-0.5 sm:mt-1">
                OVERS COMPLETED
              </div>
            </div>
          </div>

          {/* Current Partnership */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-xs">
            <div className="text-[10px] uppercase font-heading text-emerald-400 tracking-wider mb-1 font-bold">
              Current Partnership
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-numbers text-2xl font-bold text-white">
                {currentInning.currentPartnership?.totalRuns ?? 0}
              </span>
              <span className="text-slate-400">
                runs ({currentInning.currentPartnership?.balls ?? 0} legal balls)
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
              {currentInning.currentPartnership?.batter1Name} & {currentInning.currentPartnership?.batter2Name}
            </div>
          </div>

          {/* Extras breakdown */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-xs">
            <div className="text-[10px] uppercase font-heading text-emerald-400 tracking-wider mb-1 font-bold">
              Extras Total: {currentInning.extras.total}
            </div>
            <div className="grid grid-cols-5 gap-1 font-numbers text-center">
              <div className="bg-black/40 rounded p-1">
                <span className="text-[9px] text-slate-400 font-sans block">W</span>
                <span className="text-sm font-bold text-emerald-400">{currentInning.extras.wides}</span>
              </div>
              <div className="bg-black/40 rounded p-1">
                <span className="text-[9px] text-slate-400 font-sans block">NB</span>
                <span className="text-sm font-bold text-amber-400">{currentInning.extras.noBalls}</span>
              </div>
              <div className="bg-black/40 rounded p-1">
                <span className="text-[9px] text-slate-400 font-sans block">B</span>
                <span className="text-sm font-bold text-slate-200">{currentInning.extras.byes}</span>
              </div>
              <div className="bg-black/40 rounded p-1">
                <span className="text-[9px] text-slate-400 font-sans block">LB</span>
                <span className="text-sm font-bold text-slate-200">{currentInning.extras.legByes}</span>
              </div>
              <div className="bg-black/40 rounded p-1">
                <span className="text-[9px] text-slate-400 font-sans block">PEN</span>
                <span className="text-sm font-bold text-slate-200">{currentInning.extras.penalty}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ACTIVE BATTERS & CURRENT BOWLER CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Striker Card */}
          <div className="bg-emerald-950/40 border-2 border-emerald-500 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-heading text-emerald-400 tracking-wider font-bold flex items-center gap-1">
                  <span className="animate-pulse">▶</span> STRIKER
                </span>
                <h3 className="font-heading font-black text-lg text-white">{striker?.playerName || 'Striker'}</h3>
              </div>
              <span className="font-numbers text-3xl font-black text-emerald-300">
                {striker?.runs ?? 0}
              </span>
            </div>
            <div className="mt-3 pt-2 border-t border-emerald-900/60 flex justify-between text-xs font-numbers text-slate-300">
              <span>{striker?.balls ?? 0} balls</span>
              <span>{striker?.fours ?? 0} x 4s</span>
              <span>{striker?.sixes ?? 0} x 6s</span>
              <span className="text-emerald-400 font-bold">SR {(striker?.strikeRate ?? 0).toFixed(1)}</span>
            </div>
          </div>

          {/* Non-Striker Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-heading text-slate-400 tracking-wider font-bold">
                  NON-STRIKER
                </span>
                <h3 className="font-heading font-black text-lg text-slate-200">
                  {nonStriker?.playerName || 'Non-Striker'}
                </h3>
              </div>
              <span className="font-numbers text-3xl font-bold text-slate-300">
                {nonStriker?.runs ?? 0}
              </span>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between text-xs font-numbers text-slate-400">
              <span>{nonStriker?.balls ?? 0} balls</span>
              <span>{nonStriker?.fours ?? 0} x 4s</span>
              <span>{nonStriker?.sixes ?? 0} x 6s</span>
              <span className="text-slate-300">SR {(nonStriker?.strikeRate ?? 0).toFixed(1)}</span>
            </div>
          </div>

          {/* Bowler Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-heading text-emerald-400 tracking-wider font-bold">
                  CURRENT BOWLER
                </span>
                <h3 className="font-heading font-black text-lg text-white">{bowler?.playerName || 'Bowler'}</h3>
              </div>
              <span className="font-numbers text-2xl font-bold text-emerald-400">
                {bowler ? `${Math.floor(bowler.legalBalls / 6)}.${bowler.legalBalls % 6}` : '0.0'} ov
              </span>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between text-xs font-numbers text-slate-300">
              <span>{bowler?.maidens ?? 0} m</span>
              <span>{bowler?.runsConceded ?? 0} r</span>
              <span className="text-emerald-400 font-bold">{bowler?.wickets ?? 0} w</span>
              <span>Eco {(bowler?.economy ?? 0).toFixed(1)}</span>
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
          {/* RUN BUTTONS (0 - 6) */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
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
                className={`py-3 sm:py-4 px-0.5 sm:px-1 rounded-xl font-heading font-black text-sm uppercase transition-all shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                  btn.isFour
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-black border border-emerald-400'
                    : btn.isSix
                    ? 'bg-amber-500 hover:bg-amber-400 text-black border border-amber-300 font-black'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700 hover:border-slate-500'
                }`}
              >
                <span className="font-numbers text-xl sm:text-2xl block">{btn.runs}</span>
                <span className="text-[9px] sm:text-[10px] tracking-wider text-slate-300 block truncate">
                  <span className="hidden sm:inline">{btn.label.split(' ')[1]}</span>
                  <span className="sm:hidden">{btn.short}</span>
                </span>
              </button>
            ))}
          </div>

          {/* EXTRAS ROW & WICKET BUTTON */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
            {/* WIDE BUTTONS */}
            <div className="flex flex-col gap-1">
              <button
                type="button"
                disabled={scoringLocked || currentInning.isCompleted}
                onClick={() => scoreBall(0, 'WIDE', 0)}
                className="py-2.5 bg-purple-950/80 hover:bg-purple-900 border border-purple-600 text-purple-200 rounded-xl font-heading font-bold text-xs uppercase shadow-md transition-all active:scale-95 disabled:opacity-40"
              >
                WIDE (+1)
              </button>
              <button
                type="button"
                disabled={scoringLocked || currentInning.isCompleted}
                onClick={() => setExtraModalMode('WIDE_PLUS')}
                className="py-1 bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/60 text-purple-300 rounded-lg font-heading text-[10px] font-bold uppercase transition-all"
              >
                WIDE + RUNS ▾
              </button>
            </div>

            {/* NO BALL BUTTONS */}
            <div className="flex flex-col gap-1">
              <button
                type="button"
                disabled={scoringLocked || currentInning.isCompleted}
                onClick={() => scoreBall(0, 'NO_BALL', 0)}
                className="py-2.5 bg-orange-950/80 hover:bg-orange-900 border border-orange-500 text-orange-200 rounded-xl font-heading font-bold text-xs uppercase shadow-md transition-all active:scale-95 disabled:opacity-40"
              >
                NO BALL (+1)
              </button>
              <button
                type="button"
                disabled={scoringLocked || currentInning.isCompleted}
                onClick={() => setExtraModalMode('NO_BALL_PLUS')}
                className="py-1 bg-orange-900/40 hover:bg-orange-800/60 border border-orange-600/60 text-orange-300 rounded-lg font-heading text-[10px] font-bold uppercase transition-all"
              >
                NB + RUNS ▾
              </button>
            </div>

            {/* BYE BUTTONS */}
            <div className="flex flex-col gap-1">
              <button
                type="button"
                disabled={scoringLocked || currentInning.isCompleted}
                onClick={() => scoreBall(1, 'BYE')}
                className="py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl font-heading font-bold text-xs uppercase shadow-md transition-all active:scale-95 disabled:opacity-40"
              >
                BYE (+1)
              </button>
              <button
                type="button"
                disabled={scoringLocked || currentInning.isCompleted}
                onClick={() => setExtraModalMode('BYE_PLUS')}
                className="py-1 bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 rounded-lg font-heading text-[10px] uppercase transition-all"
              >
                BYES + ▾
              </button>
            </div>

            {/* LEG BYE BUTTONS */}
            <div className="flex flex-col gap-1">
              <button
                type="button"
                disabled={scoringLocked || currentInning.isCompleted}
                onClick={() => scoreBall(1, 'LEG_BYE')}
                className="py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl font-heading font-bold text-xs uppercase shadow-md transition-all active:scale-95 disabled:opacity-40"
              >
                LEG BYE (+1)
              </button>
              <button
                type="button"
                disabled={scoringLocked || currentInning.isCompleted}
                onClick={() => setExtraModalMode('LEG_BYE_PLUS')}
                className="py-1 bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 rounded-lg font-heading text-[10px] uppercase transition-all"
              >
                LEG BYES + ▾
              </button>
            </div>

            {/* PENALTY */}
            <button
              type="button"
              disabled={scoringLocked || currentInning.isCompleted}
              onClick={() => scoreBall(5, 'PENALTY')}
              className="py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl font-heading font-bold text-xs uppercase shadow-md transition-all active:scale-95 disabled:opacity-40 self-start w-full"
            >
              PENALTY (+5)
            </button>

            {/* WICKET BUTTON (OPENS WICKET MODAL) */}
            <button
              type="button"
              disabled={scoringLocked || currentInning.isCompleted}
              onClick={() => setIsWicketModalOpen(true)}
              className="col-span-2 sm:col-span-3 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-heading font-black text-sm uppercase tracking-wider shadow-lg shadow-rose-950 transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
              WICKET / DISMISSAL
            </button>
          </div>

          {/* UTILITY ROW: SWAP STRIKE, CHANGE BOWLER, UNDO */}
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
            </div>

            <div className="flex items-center gap-2">
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
