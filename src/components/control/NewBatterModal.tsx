import React, { useState } from 'react';
import { Match, Player } from '../../types/cricket.js';

interface NewBatterModalProps {
  isOpen: boolean;
  match: Match;
  replacesStriker: boolean;
  onSelectBatter: (player: Player) => void;
}

export function NewBatterModal({ isOpen, match, replacesStriker, onSelectBatter }: NewBatterModalProps) {
  if (!isOpen) return null;

  const currentInning = match.innings[match.currentInningIndex];
  if (!currentInning) return null;

  // Batting team Playing XI
  const battingXI: Player[] =
    currentInning.battingTeamId === match.teamA.id ? match.teamAPlayingXI : match.teamBPlayingXI;

  // Already batted / currently batting player IDs
  const alreadyBattedIds = new Set(currentInning.batters.map((b) => b.playerId));
  const availablePlayers = battingXI.filter((p) => !alreadyBattedIds.has(p.id));

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(availablePlayers[0]?.id || '');
  const [customName, setCustomName] = useState<string>('');

  const handleConfirm = () => {
    if (customName.trim()) {
      const newPlayer: Player = {
        id: `p-custom-${Date.now()}`,
        name: customName.trim(),
        shortName: customName.trim().slice(0, 14),
        teamId: currentInning.battingTeamId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      onSelectBatter(newPlayer);
    } else {
      const player = battingXI.find((p) => p.id === selectedPlayerId) || availablePlayers[0];
      if (player) {
        onSelectBatter(player);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b1324] border-2 border-emerald-500 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-xl font-bold font-heading text-emerald-400 tracking-wide uppercase">
            SELECT NEW BATTER
          </h2>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Wicket fell! Scoring is paused. Please select the next batter coming in at the{' '}
          <strong className="text-white uppercase">{replacesStriker ? 'Striker End' : 'Non-Striker End'}</strong>.
        </p>

        {/* AVAILABLE PLAYERS FROM ROSTER */}
        <div className="mb-4">
          <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-2">
            Available Players ({availablePlayers.length} remaining)
          </label>
          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
            {availablePlayers.length === 0 ? (
              <div className="text-xs text-amber-400 p-3 bg-amber-950/40 border border-amber-800 rounded-lg">
                No unbatted players remaining in Playing XI. Enter a name below if needed.
              </div>
            ) : (
              availablePlayers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlayerId(p.id);
                    setCustomName('');
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all text-left ${
                    selectedPlayerId === p.id && !customName
                      ? 'bg-emerald-950/90 border-emerald-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {p.jerseyNumber ? (
                      <span className="w-6 h-6 rounded-full bg-black/60 border border-slate-700 text-xs font-numbers font-bold flex items-center justify-center text-emerald-400">
                        {p.jerseyNumber}
                      </span>
                    ) : null}
                    <div>
                      <div className="font-bold text-sm text-slate-100">{p.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {p.battingStyle?.replace(/_/g, ' ') || 'Batting'}
                      </div>
                    </div>
                  </div>
                  {p.isWicketKeeper && (
                    <span className="text-[10px] font-heading bg-blue-900/60 text-blue-300 px-1.5 py-0.5 rounded border border-blue-700">
                      WK
                    </span>
                  )}
                  {p.isCaptain && (
                    <span className="text-[10px] font-heading bg-amber-900/60 text-amber-300 px-1.5 py-0.5 rounded border border-amber-700">
                      C
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* OR ENTER CUSTOM BATTER NAME */}
        <div className="mb-5 pt-3 border-t border-slate-800">
          <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-1.5">
            Or Enter Custom Batter Name
          </label>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="e.g. Asif Ali"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* CONFIRM BUTTON */}
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black font-heading text-sm uppercase tracking-wider shadow-lg shadow-emerald-950 transition-transform active:scale-95"
          >
            Confirm Batter & Resume Scoring
          </button>
        </div>
      </div>
    </div>
  );
}
