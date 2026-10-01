import React from 'react';
import { Match, InningsState, BroadcastOverlaySettings } from '../../types/cricket.js';
import { calculateRunRate } from '../../services/cricketEngine.js';
import { liveSync } from '../../services/liveSync.js';

interface MatchSummaryModalProps {
  isOpen: boolean;
  match: Match;
  overlaySettings?: BroadcastOverlaySettings;
  onClose: () => void;
}

export function MatchSummaryModal({ isOpen, match, overlaySettings, onClose }: MatchSummaryModalProps) {
  if (!isOpen) return null;

  const currentGraphic = overlaySettings?.activeGraphic || 'SCOREBUG';

  const handleToggleBroadcastSummary = () => {
    if (currentGraphic === 'MATCH_SUMMARY') {
      liveSync.saveOverlaySettings({ activeGraphic: 'SCOREBUG' });
    } else {
      liveSync.saveOverlaySettings({ activeGraphic: 'MATCH_SUMMARY' });
    }
  };

  const currentInning = match.innings[match.currentInningIndex];
  const firstInning = match.innings[0];
  const secondInning = match.innings[1];

  const striker = currentInning?.batters.find((b) => b.playerId === currentInning.strikerId);
  const nonStriker = currentInning?.batters.find((b) => b.playerId === currentInning.nonStrikerId);
  const bowler = currentInning?.bowlers.find((bw) => bw.playerId === currentInning.currentBowlerId);

  const crr = currentInning ? calculateRunRate(currentInning.runs, currentInning.legalBalls) : 0;
  const isSecond = match.currentInningIndex === 1 && firstInning;
  const target = isSecond ? firstInning.runs + 1 : 0;
  const needRuns = isSecond && currentInning ? Math.max(0, target - currentInning.runs) : 0;
  const ballsLeft = isSecond && currentInning ? Math.max(0, match.settings.totalOvers * 6 - currentInning.legalBalls) : 0;
  const rrr = isSecond && ballsLeft > 0 ? Number(((needRuns / (ballsLeft / 6))).toFixed(2)) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0b1324] border-2 border-emerald-500 rounded-2xl max-w-3xl w-full p-6 shadow-2xl text-slate-100 my-8 max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="bg-emerald-500 text-black px-2.5 py-0.5 rounded font-black text-xs font-heading">
              ITC SPORTS
            </span>
            <h2 className="text-xl font-bold font-heading text-white tracking-wide uppercase">
              LIVE MATCH SUMMARY
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleBroadcastSummary}
              className={`px-3 py-1.5 rounded-xl font-heading text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
                currentGraphic === 'MATCH_SUMMARY'
                  ? 'bg-amber-500 text-black border border-amber-300 ring-2 ring-amber-500/50'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <span>{currentGraphic === 'MATCH_SUMMARY' ? '🔴 SUMMARY ON AIR (CLICK TO HIDE)' : '📺 SHOW SUMMARY ON STREAM'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ON-AIR STATUS ALERT */}
        {currentGraphic === 'MATCH_SUMMARY' && (
          <div className="bg-amber-950/80 border border-amber-500 text-amber-200 px-4 py-2 rounded-xl mb-4 text-xs font-heading flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="font-bold">LIVE ON STREAM:</span>
              <span>This match summary graphic is currently showing to viewers on OBS / vMix overlay!</span>
            </div>
            <button
              type="button"
              onClick={handleToggleBroadcastSummary}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-lg text-[10px] uppercase"
            >
              Back to Scorebug ⚡
            </button>
          </div>
        )}

        {/* MATCH TEAMS & SCORES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Team A */}
          <div
            className={`p-4 rounded-xl border ${
              currentInning?.battingTeamId === match.teamA.id
                ? 'bg-emerald-950/40 border-emerald-500'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-heading text-emerald-400 tracking-wider">
                  TEAM A {currentInning?.battingTeamId === match.teamA.id ? '• BATTING NOW' : ''}
                </span>
                <h3 className="font-heading font-black text-lg text-white">{match.teamA.name}</h3>
              </div>
              {match.teamA.logoUrl && (
                <img src={match.teamA.logoUrl} alt={match.teamA.shortName} className="w-8 h-8 object-contain" />
              )}
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-numbers text-3xl font-black text-white">
                {firstInning ? `${firstInning.runs}/${firstInning.wickets}` : 'Yet to Bat'}
              </span>
              {firstInning && (
                <span className="text-xs text-slate-400 font-heading">({firstInning.oversString} ov)</span>
              )}
            </div>
          </div>

          {/* Team B */}
          <div
            className={`p-4 rounded-xl border ${
              currentInning?.battingTeamId === match.teamB.id
                ? 'bg-emerald-950/40 border-emerald-500'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-heading text-emerald-400 tracking-wider">
                  TEAM B {currentInning?.battingTeamId === match.teamB.id ? '• BATTING NOW' : ''}
                </span>
                <h3 className="font-heading font-black text-lg text-white">{match.teamB.name}</h3>
              </div>
              {match.teamB.logoUrl && (
                <img src={match.teamB.logoUrl} alt={match.teamB.shortName} className="w-8 h-8 object-contain" />
              )}
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-numbers text-3xl font-black text-white">
                {secondInning ? `${secondInning.runs}/${secondInning.wickets}` : 'Yet to Bat'}
              </span>
              {secondInning && (
                <span className="text-xs text-slate-400 font-heading">({secondInning.oversString} ov)</span>
              )}
            </div>
          </div>
        </div>

        {/* SITUATION BAR */}
        {isSecond && (
          <div className="bg-[#070d18] border border-emerald-500/50 rounded-xl p-3 mb-6 flex flex-wrap items-center justify-between gap-3 text-xs font-heading">
            <span className="text-slate-300">
              Target: <strong className="text-emerald-400 text-sm font-numbers">{target}</strong>
            </span>
            <span className="text-slate-300">
              Need: <strong className="text-amber-400 text-sm font-numbers">{needRuns}</strong> runs from{' '}
              <strong className="text-white text-sm font-numbers">{ballsLeft}</strong> balls
            </span>
            <span className="text-slate-300">
              CRR: <strong className="text-slate-100 font-numbers">{crr.toFixed(2)}</strong>
            </span>
            <span className="text-slate-300">
              RRR: <strong className="text-emerald-400 text-sm font-numbers">{rrr.toFixed(2)}</strong>
            </span>
          </div>
        )}

        {/* MATCH RESULT IF COMPLETED */}
        {match.isMatchCompleted && match.resultSummary && (
          <div className="bg-emerald-600/90 text-white rounded-xl p-3 mb-6 text-center font-black font-heading tracking-wider uppercase text-base shadow-lg">
            {match.resultSummary}
          </div>
        )}

        {/* CURRENT BATTERS & CURRENT BOWLER */}
        {currentInning && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Batters */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs uppercase font-heading text-emerald-400 tracking-wider mb-2">
                Current Batters
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className="text-emerald-400 text-xs">▶</span> {striker?.playerName || 'Striker'}
                  </span>
                  <div className="font-numbers text-base">
                    <span className="font-bold text-emerald-400">{striker?.runs ?? 0}</span>
                    <span className="text-slate-400 text-xs font-sans ml-1">
                      ({striker?.balls ?? 0}b • {striker?.fours ?? 0}x4 {striker?.sixes ?? 0}x6 • SR{' '}
                      {(striker?.strikeRate ?? 0).toFixed(1)})
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm border-t border-slate-800/80 pt-2">
                  <span className="font-medium text-slate-300 flex items-center gap-1.5">
                    <span className="text-slate-500 text-xs">○</span> {nonStriker?.playerName || 'Non-Striker'}
                  </span>
                  <div className="font-numbers text-base">
                    <span className="text-slate-200">{nonStriker?.runs ?? 0}</span>
                    <span className="text-slate-400 text-xs font-sans ml-1">
                      ({nonStriker?.balls ?? 0}b • {nonStriker?.fours ?? 0}x4 {nonStriker?.sixes ?? 0}x6 • SR{' '}
                      {(nonStriker?.strikeRate ?? 0).toFixed(1)})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bowler */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs uppercase font-heading text-emerald-400 tracking-wider mb-2">
                Current Bowler
              </h4>
              <div className="flex justify-between items-center text-sm">
                <div>
                  <div className="font-bold text-white">{bowler?.playerName || 'Bowler'}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Wides: {bowler?.wides ?? 0} • No-Balls: {bowler?.noBalls ?? 0}
                  </div>
                </div>
                <div className="text-right font-numbers text-sm">
                  <div className="text-slate-200 font-bold">
                    {bowler ? `${Math.floor(bowler.legalBalls / 6)}.${bowler.legalBalls % 6}` : '0.0'} ov •{' '}
                    <span className="text-emerald-400">{bowler?.wickets ?? 0}</span>/{bowler?.runsConceded ?? 0}
                  </div>
                  <div className="text-slate-400 text-xs font-sans">
                    Eco: {(bowler?.economy ?? 0).toFixed(1)} • Maidens: {bowler?.maidens ?? 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PARTNERSHIP & EXTRAS SUMMARY */}
        {currentInning && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Partnership */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs uppercase font-heading text-emerald-400 tracking-wider mb-2">
                Current Partnership
              </h4>
              <div className="text-sm">
                <span className="font-numbers text-2xl font-bold text-white">
                  {currentInning.currentPartnership?.totalRuns ?? 0}
                </span>{' '}
                <span className="text-xs text-slate-400">
                  runs off {currentInning.currentPartnership?.balls ?? 0} balls
                </span>
                <div className="text-xs text-slate-400 mt-1">
                  {currentInning.currentPartnership?.batter1Name} ({currentInning.currentPartnership?.batter1Runs}r) •{' '}
                  {currentInning.currentPartnership?.batter2Name} ({currentInning.currentPartnership?.batter2Runs}r)
                </div>
              </div>
            </div>

            {/* Extras Summary */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs uppercase font-heading text-emerald-400 tracking-wider mb-2">
                Extras Breakdown (Total: {currentInning.extras.total})
              </h4>
              <div className="flex justify-between items-center text-xs font-numbers text-slate-300">
                <span>W: <strong className="text-emerald-400 text-sm">{currentInning.extras.wides}</strong></span>
                <span>NB: <strong className="text-amber-400 text-sm">{currentInning.extras.noBalls}</strong></span>
                <span>B: <strong className="text-slate-100 text-sm">{currentInning.extras.byes}</strong></span>
                <span>LB: <strong className="text-slate-100 text-sm">{currentInning.extras.legByes}</strong></span>
                <span>PEN: <strong className="text-slate-100 text-sm">{currentInning.extras.penalty}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* FALL OF WICKETS */}
        {currentInning && currentInning.fallOfWickets.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 mb-6">
            <h4 className="text-xs uppercase font-heading text-emerald-400 tracking-wider mb-2">
              Fall of Wickets ({currentInning.battingTeamName})
            </h4>
            <div className="flex flex-wrap gap-2 text-xs">
              {currentInning.fallOfWickets.map((f) => (
                <div
                  key={f.wicketNumber}
                  className="bg-black/40 border border-slate-700/80 px-2.5 py-1 rounded text-slate-200"
                >
                  <strong className="text-emerald-400 font-numbers text-sm">{f.wicketNumber}-{f.score}</strong>{' '}
                  <span className="text-slate-400">({f.dismissedPlayerName}, {f.oversString} ov)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleBroadcastSummary}
              className={`px-4 py-2 rounded-xl font-heading text-xs font-bold transition-all flex items-center gap-2 shadow-md ${
                currentGraphic === 'MATCH_SUMMARY'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <span>{currentGraphic === 'MATCH_SUMMARY' ? '⚡ Back to Live Scorebug' : '📺 Send Summary to vMix/OBS Stream'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-heading text-sm transition-colors"
          >
            Close (Keep Scoring)
          </button>
        </div>
      </div>
    </div>
  );
}
