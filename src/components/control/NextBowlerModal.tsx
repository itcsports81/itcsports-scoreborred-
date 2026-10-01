import React, { useState } from 'react';
import { Match, Player } from '../../types/cricket.js';

interface NextBowlerModalProps {
  isOpen: boolean;
  match: Match;
  onSelectBowler: (player: Player) => void;
}

export function NextBowlerModal({ isOpen, match, onSelectBowler }: NextBowlerModalProps) {
  if (!isOpen) return null;

  const currentInning = match.innings[match.currentInningIndex];
  if (!currentInning) return null;

  // Fielding team Playing XI
  const fieldingXI: Player[] =
    currentInning.bowlingTeamId === match.teamA.id ? match.teamAPlayingXI : match.teamBPlayingXI;

  const lastBowlerId = currentInning.lastBowlerId;
  const maxOvers = match.settings.maxOversPerBowler;

  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');

  const handleConfirm = () => {
    if (customName.trim()) {
      const newPlayer: Player = {
        id: `p-bowler-custom-${Date.now()}`,
        name: customName.trim(),
        shortName: customName.trim().slice(0, 14),
        teamId: currentInning.bowlingTeamId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      onSelectBowler(newPlayer);
    } else {
      const player = fieldingXI.find((p) => p.id === selectedPlayerId);
      if (player) {
        onSelectBowler(player);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b1324] border-2 border-emerald-500 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-xl font-bold font-heading text-emerald-400 tracking-wide uppercase">
            END OF OVER • CHANGE BOWLER
          </h2>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Over completed! Please select the bowler for the next over from{' '}
          <strong className="text-white">{currentInning.bowlingTeamName}</strong>.
          Consecutive overs by the same bowler are not permitted.
        </p>

        {/* LIST OF BOWLING TEAM SQUAD */}
        <div className="mb-4">
          <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-2">
            Select Bowler
          </label>
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            {fieldingXI.map((p) => {
              const isLastBowler = p.id === lastBowlerId;
              const bowlerStats = currentInning.bowlers.find((bw) => bw.playerId === p.id);
              const oversBowled = bowlerStats ? Math.floor(bowlerStats.legalBalls / 6) : 0;
              const ballsBowledPart = bowlerStats ? bowlerStats.legalBalls % 6 : 0;
              const hasExceededLimit = maxOvers > 0 && oversBowled >= maxOvers;
              const disabled = isLastBowler || hasExceededLimit;

              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setSelectedPlayerId(p.id);
                    setCustomName('');
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all text-left ${
                    disabled
                      ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                      : selectedPlayerId === p.id && !customName
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
                      <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                        <span>{p.name}</span>
                        {isLastBowler && (
                          <span className="text-[9px] bg-rose-950 text-rose-300 px-1 py-0.2 rounded border border-rose-800">
                            Bowled Last Over
                          </span>
                        )}
                        {hasExceededLimit && (
                          <span className="text-[9px] bg-amber-950 text-amber-300 px-1 py-0.2 rounded border border-amber-800">
                            Max Overs Reached ({maxOvers})
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {p.bowlingStyle?.replace(/_/g, ' ') || 'Bowler'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-numbers text-xs text-slate-400">
                    {bowlerStats ? (
                      <span>
                        {oversBowled}.{ballsBowledPart} ov • {bowlerStats.wickets}w/{bowlerStats.runsConceded}r
                      </span>
                    ) : (
                      <span className="text-slate-500">Yet to bowl</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* OR CUSTOM BOWLER NAME */}
        <div className="mb-5 pt-3 border-t border-slate-800">
          <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-1.5">
            Or Enter Custom Bowler Name
          </label>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="e.g. Haris Rauf"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* CONFIRM BUTTON */}
        <div className="flex items-center justify-end">
          <button
            type="button"
            disabled={!selectedPlayerId && !customName.trim()}
            onClick={handleConfirm}
            className="w-full py-3 rounded-xl bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-400 text-black font-black font-heading text-sm uppercase tracking-wider shadow-lg shadow-emerald-950 transition-transform active:scale-95"
          >
            Confirm Bowler & Start Next Over
          </button>
        </div>
      </div>
    </div>
  );
}
