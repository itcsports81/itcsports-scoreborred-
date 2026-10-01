import React from 'react';
import { Match, BroadcastOverlaySettings } from '../../types/cricket.js';
import { liveSync } from '../../services/liveSync.js';

interface BothTeamsSquadModalProps {
  isOpen: boolean;
  match: Match;
  overlaySettings?: BroadcastOverlaySettings;
  onClose: () => void;
}

export function BothTeamsSquadModal({
  isOpen,
  match,
  overlaySettings,
  onClose,
}: BothTeamsSquadModalProps) {
  if (!isOpen) return null;

  const currentGraphic = overlaySettings?.activeGraphic || 'SCOREBUG';

  const handleSetGraphic = (graphic: 'BOTH_SQUADS' | 'TEAM_A_SQUAD' | 'TEAM_B_SQUAD' | 'SCOREBUG') => {
    liveSync.saveOverlaySettings({ activeGraphic: graphic });
  };

  const tossWinner = match.tossWinnerTeamId === match.teamA.id ? match.teamA : match.teamB;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#080d1a] border-2 border-emerald-500 rounded-2xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl text-slate-100 my-auto max-h-[92vh] flex flex-col">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 mb-4 gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-500 text-black px-2.5 py-0.5 rounded font-black text-xs font-heading">
                ITC SPORTS
              </span>
              <span className="text-xs text-emerald-400 font-heading tracking-widest uppercase">
                PLAYING XI & SQUADS MANAGEMENT
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-heading text-white tracking-wide">
              {match.teamA.name} VS {match.teamB.name}
            </h2>
            <p className="text-xs text-slate-400">
              {match.tournamentName} • {match.venue} • {match.settings.format} ({match.settings.totalOvers} Overs)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-heading text-xs font-bold transition-colors"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* BROADCAST ON-AIR CONTROLS BANNER */}
        <div className="bg-slate-900/90 border border-emerald-500/40 rounded-xl p-3.5 mb-4 shrink-0 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 border border-slate-700 text-xs font-heading">
                <span className={`w-2.5 h-2.5 rounded-full ${currentGraphic !== 'SCOREBUG' ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'}`} />
                <span className="text-slate-400">vMix / OBS On-Air:</span>
                <span className="font-bold text-white uppercase">{currentGraphic.replace('_', ' ')}</span>
              </div>
              <span className="text-[11px] text-slate-400 hidden md:inline">
                Click buttons below to display squads directly on live stream overlay!
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleSetGraphic('BOTH_SQUADS')}
                className={`px-3 py-1.5 rounded-xl font-heading text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
                  currentGraphic === 'BOTH_SQUADS'
                    ? 'bg-amber-500 text-black border-2 border-amber-300 ring-2 ring-amber-500/50'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <span>📺 Show Both Squads on Stream</span>
                {currentGraphic === 'BOTH_SQUADS' && <span className="text-[10px] bg-black text-amber-400 px-1.5 py-0.5 rounded font-black">ON AIR</span>}
              </button>

              <button
                type="button"
                onClick={() => handleSetGraphic('TEAM_A_SQUAD')}
                className={`px-3 py-1.5 rounded-xl font-heading text-xs font-bold transition-all ${
                  currentGraphic === 'TEAM_A_SQUAD'
                    ? 'bg-amber-500 text-black border-2 border-amber-300 ring-2 ring-amber-500/50'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <span>📺 Team A Squad</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetGraphic('TEAM_B_SQUAD')}
                className={`px-3 py-1.5 rounded-xl font-heading text-xs font-bold transition-all ${
                  currentGraphic === 'TEAM_B_SQUAD'
                    ? 'bg-amber-500 text-black border-2 border-amber-300 ring-2 ring-amber-500/50'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <span>📺 Team B Squad</span>
              </button>

              {currentGraphic !== 'SCOREBUG' && (
                <button
                  type="button"
                  onClick={() => handleSetGraphic('SCOREBUG')}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-heading text-xs font-black shadow-md flex items-center gap-1 transition-transform active:scale-95"
                >
                  <span>⚡ Back to Scorebug</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TOSS INFO BAR */}
        <div className="bg-[#0b1325] border border-slate-800 rounded-xl px-4 py-2.5 mb-4 shrink-0 flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-heading font-black">🪙 TOSS:</span>
            <span className="font-semibold text-white">
              {tossWinner.name} won the toss and elected to {match.tossDecision.toUpperCase()} first.
            </span>
          </div>
          <div className="text-slate-400 font-heading text-[11px]">
            11 Players per side • Playing XI
          </div>
        </div>

        {/* SQUADS 2-COLUMN VIEW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-y-auto pr-1">
          {/* TEAM A SQUAD */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-3">
                {match.teamA.logoUrl ? (
                  <img
                    src={match.teamA.logoUrl}
                    alt={match.teamA.shortName}
                    className="w-10 h-10 object-contain rounded-xl p-1 bg-black/60 border border-slate-700"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black font-heading">
                    {match.teamA.shortName.slice(0, 3)}
                  </div>
                )}
                <div>
                  <h3 className="font-heading font-black text-base text-white">{match.teamA.name}</h3>
                  <span className="text-[11px] text-emerald-400 font-heading tracking-wider">
                    {match.teamAPlayingXI.length} PLAYERS SELECTED
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-800 rounded text-slate-300">
                {match.teamA.shortName}
              </span>
            </div>

            <div className="space-y-1.5 flex-1 overflow-y-auto">
              {match.teamAPlayingXI.map((player, idx) => {
                const isCaptain = match.captainTeamAId === player.id || player.isCaptain;
                const isKeeper = match.wicketKeeperTeamAId === player.id || player.isWicketKeeper;
                return (
                  <div
                    key={player.id || idx}
                    className="flex items-center justify-between px-3 py-2 bg-slate-950/60 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 font-mono text-[11px] text-slate-500 font-bold">{idx + 1}.</span>
                      <span className="font-bold text-slate-100">{player.name}</span>
                      {isCaptain && (
                        <span className="px-1.5 py-0.5 bg-amber-500 text-black rounded font-black font-heading text-[10px]" title="Captain">
                          (C)
                        </span>
                      )}
                      {isKeeper && (
                        <span className="px-1.5 py-0.5 bg-cyan-500 text-black rounded font-black font-heading text-[10px]" title="Wicket Keeper">
                          (WK)
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-heading uppercase text-slate-400 tracking-wider">
                      {player.role || 'Player'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TEAM B SQUAD */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-3">
                {match.teamB.logoUrl ? (
                  <img
                    src={match.teamB.logoUrl}
                    alt={match.teamB.shortName}
                    className="w-10 h-10 object-contain rounded-xl p-1 bg-black/60 border border-slate-700"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black font-heading">
                    {match.teamB.shortName.slice(0, 3)}
                  </div>
                )}
                <div>
                  <h3 className="font-heading font-black text-base text-white">{match.teamB.name}</h3>
                  <span className="text-[11px] text-cyan-400 font-heading tracking-wider">
                    {match.teamBPlayingXI.length} PLAYERS SELECTED
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-800 rounded text-slate-300">
                {match.teamB.shortName}
              </span>
            </div>

            <div className="space-y-1.5 flex-1 overflow-y-auto">
              {match.teamBPlayingXI.map((player, idx) => {
                const isCaptain = match.captainTeamBId === player.id || player.isCaptain;
                const isKeeper = match.wicketKeeperTeamBId === player.id || player.isWicketKeeper;
                return (
                  <div
                    key={player.id || idx}
                    className="flex items-center justify-between px-3 py-2 bg-slate-950/60 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 font-mono text-[11px] text-slate-500 font-bold">{idx + 1}.</span>
                      <span className="font-bold text-slate-100">{player.name}</span>
                      {isCaptain && (
                        <span className="px-1.5 py-0.5 bg-amber-500 text-black rounded font-black font-heading text-[10px]" title="Captain">
                          (C)
                        </span>
                      )}
                      {isKeeper && (
                        <span className="px-1.5 py-0.5 bg-cyan-500 text-black rounded font-black font-heading text-[10px]" title="Wicket Keeper">
                          (WK)
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-heading uppercase text-slate-400 tracking-wider">
                      {player.role || 'Player'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
