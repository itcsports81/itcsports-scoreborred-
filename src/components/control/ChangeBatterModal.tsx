import React, { useState } from 'react';
import { Match, Player } from '../../types/cricket.js';

interface ChangeBatterModalProps {
  isOpen: boolean;
  match: Match;
  onClose: () => void;
  onConfirmChange: (isStriker: boolean, newPlayer: Player) => void;
}

export function ChangeBatterModal({
  isOpen,
  match,
  onClose,
  onConfirmChange,
}: ChangeBatterModalProps) {
  const [targetEnd, setTargetEnd] = useState<'STRIKER' | 'NON_STRIKER' | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');

  if (!isOpen) return null;

  const currentInning = match.innings[match.currentInningIndex];
  if (!currentInning) return null;

  const striker = currentInning.batters.find((b) => b.playerId === currentInning.strikerId);
  const nonStriker = currentInning.batters.find((b) => b.playerId === currentInning.nonStrikerId);

  const battingXI: Player[] =
    currentInning.battingTeamId === match.teamA.id ? match.teamAPlayingXI : match.teamBPlayingXI;

  // Available players who are NOT currently the active striker or non-striker
  const activeIds = new Set([currentInning.strikerId, currentInning.nonStrikerId]);
  const availablePlayers = battingXI.filter((p) => !activeIds.has(p.id));

  const handleSelect = (isStriker: boolean) => {
    setTargetEnd(isStriker ? 'STRIKER' : 'NON_STRIKER');
    setSelectedPlayerId(availablePlayers[0]?.id || battingXI[0]?.id || '');
    setCustomName('');
  };

  const handleConfirmSubmit = () => {
    if (!targetEnd) return;
    const isStriker = targetEnd === 'STRIKER';

    if (customName.trim()) {
      const newPlayer: Player = {
        id: `p-custom-${Date.now()}`,
        name: customName.trim(),
        shortName: customName.trim().slice(0, 14),
        teamId: currentInning.battingTeamId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      onConfirmChange(isStriker, newPlayer);
    } else {
      const player = battingXI.find((p) => p.id === selectedPlayerId) || availablePlayers[0];
      if (player) {
        onConfirmChange(isStriker, player);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b1324] border-2 border-emerald-500 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xl font-bold font-heading text-emerald-400 tracking-wide uppercase">
              CHANGE BATTER (CORRECTION)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {!targetEnd ? (
          <div>
            <p className="text-xs text-slate-400 mb-4">
              Galti se galat batter select ho gaya hai? Select karein ki aap kis end ke batter ko change karna chahte hain:
            </p>

            <div className="space-y-3 mb-5">
              {/* STRIKER CARD */}
              <div className="bg-emerald-950/40 border-2 border-emerald-500/80 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-heading text-emerald-400 tracking-wider font-bold block mb-0.5">
                    ▶ CURRENT STRIKER
                  </span>
                  <div className="font-heading font-black text-white text-base">
                    {striker?.playerName || 'Not Set'}
                  </div>
                  <div className="text-xs text-slate-400 font-numbers mt-0.5">
                    {striker?.runs ?? 0} runs ({striker?.balls ?? 0} balls)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelect(true)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-heading font-black text-xs rounded-xl shadow-md transition-transform active:scale-95"
                >
                  CHANGE STRIKER
                </button>
              </div>

              {/* NON-STRIKER CARD */}
              <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-heading text-slate-400 tracking-wider font-bold block mb-0.5">
                    NON-STRIKER
                  </span>
                  <div className="font-heading font-black text-slate-200 text-base">
                    {nonStriker?.playerName || 'Not Set'}
                  </div>
                  <div className="text-xs text-slate-400 font-numbers mt-0.5">
                    {nonStriker?.runs ?? 0} runs ({nonStriker?.balls ?? 0} balls)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelect(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-heading font-bold text-xs rounded-xl shadow-md transition-transform active:scale-95"
                >
                  CHANGE NON-STR
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-heading"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-xs font-heading uppercase text-emerald-400 font-bold mb-2">
              Replacing {targetEnd === 'STRIKER' ? 'Striker' : 'Non-Striker'}:
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Select the correct player from the roster to replace them:
            </p>

            <div className="mb-4 max-h-56 overflow-y-auto pr-1 flex flex-col gap-2">
              {battingXI.map((p) => (
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
                  <span className="font-bold text-sm">{p.name}</span>
                  <span className="text-xs text-slate-400">{p.battingStyle || 'Batter'}</span>
                </button>
              ))}
            </div>

            <div className="mb-5 pt-3 border-t border-slate-800">
              <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-1.5">
                Or Enter Custom Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => {
                  setCustomName(e.target.value);
                  setSelectedPlayerId('');
                }}
                placeholder="Enter player name..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTargetEnd(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-heading"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-heading font-black text-xs rounded-xl shadow-lg transition-transform active:scale-95"
              >
                Confirm Change
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
