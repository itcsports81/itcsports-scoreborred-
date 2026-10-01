import React, { useState } from 'react';
import { WicketType, Match, Player } from '../../types/cricket.js';

interface WicketModalProps {
  isOpen: boolean;
  match: Match;
  onConfirm: (data: {
    wicketType: WicketType;
    dismissedPlayerId: string;
    fielderName?: string;
    batterRuns: number;
    extraType?: 'WIDE' | 'NO_BALL';
  }) => void;
  onCancel: () => void;
}

export function WicketModal({ isOpen, match, onConfirm, onCancel }: WicketModalProps) {
  if (!isOpen) return null;

  const currentInning = match.innings[match.currentInningIndex];
  if (!currentInning) return null;

  const striker = currentInning.batters.find((b) => b.playerId === currentInning.strikerId);
  const nonStriker = currentInning.batters.find((b) => b.playerId === currentInning.nonStrikerId);

  const [wicketType, setWicketType] = useState<WicketType>('BOWLED');
  const [dismissedId, setDismissedId] = useState<string>(currentInning.strikerId);
  const [fielderName, setFielderName] = useState<string>('');
  const [runsCompleted, setRunsCompleted] = useState<number>(0);
  const [onExtraType, setOnExtraType] = useState<'NONE' | 'WIDE' | 'NO_BALL'>('NONE');

  const isFreeHit = currentInning.freeHitActive;
  const fieldingXI: Player[] =
    match.currentInningIndex % 2 === 0 ? match.teamBPlayingXI : match.teamAPlayingXI;

  const handleConfirm = () => {
    onConfirm({
      wicketType,
      dismissedPlayerId: dismissedId,
      fielderName: fielderName.trim() || undefined,
      batterRuns: runsCompleted,
      extraType: onExtraType === 'NONE' ? undefined : onExtraType,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b1324] border-2 border-rose-500/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
            <h2 className="text-xl font-bold font-heading text-rose-400 tracking-wide uppercase">
              CONFIRM DISMISSAL (WICKET)
            </h2>
          </div>
          {isFreeHit && (
            <span className="bg-amber-500 text-black text-xs font-black px-2 py-0.5 rounded font-heading">
              FREE HIT ACTIVE
            </span>
          )}
        </div>

        {isFreeHit && (
          <div className="bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs p-3 rounded-lg mb-4">
            ⚠️ <strong>Free Hit rule:</strong> Batter can only be dismissed via <strong>RUN OUT</strong>,{' '}
            <strong>OBSTRUCTING THE FIELD</strong>, or <strong>HIT THE BALL TWICE</strong>.
          </div>
        )}

        {/* WICKET TYPE */}
        <div className="mb-4">
          <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-2">
            Method of Dismissal
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(
              [
                { type: 'BOWLED', label: 'Bowled', allowedOnFreeHit: false },
                { type: 'CAUGHT', label: 'Caught', allowedOnFreeHit: false },
                { type: 'LBW', label: 'LBW', allowedOnFreeHit: false },
                { type: 'RUN_OUT', label: 'Run Out', allowedOnFreeHit: true },
                { type: 'STUMPED', label: 'Stumped', allowedOnFreeHit: false },
                { type: 'HIT_WICKET', label: 'Hit Wicket', allowedOnFreeHit: false },
                { type: 'OBSTRUCTING', label: 'Obstructing', allowedOnFreeHit: true },
                { type: 'RETIRED_OUT', label: 'Retired Out', allowedOnFreeHit: true },
              ] as const
            ).map((item) => {
              const disabled = isFreeHit && !item.allowedOnFreeHit;
              return (
                <button
                  key={item.type}
                  type="button"
                  disabled={disabled}
                  onClick={() => setWicketType(item.type)}
                  className={`py-2 px-3 rounded-lg text-xs font-heading font-bold border transition-all ${
                    disabled
                      ? 'opacity-30 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                      : wicketType === item.type
                      ? 'bg-rose-600 border-rose-400 text-white shadow-lg'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* WHO IS OUT? (ESPECIALLY FOR RUN OUT) */}
        <div className="mb-4">
          <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-2">
            Batter Dismissed
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDismissedId(currentInning.strikerId)}
              className={`p-3 rounded-xl border text-left flex flex-col transition-all ${
                dismissedId === currentInning.strikerId
                  ? 'bg-rose-950/80 border-rose-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="text-[10px] font-heading uppercase tracking-wider text-emerald-400">
                Striker
              </span>
              <span className="font-bold text-base text-slate-100">
                {striker?.playerName || 'Striker'}
              </span>
              <span className="text-xs text-slate-400 font-numbers mt-0.5">
                {striker?.runs ?? 0} runs ({striker?.balls ?? 0} balls)
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDismissedId(currentInning.nonStrikerId)}
              className={`p-3 rounded-xl border text-left flex flex-col transition-all ${
                dismissedId === currentInning.nonStrikerId
                  ? 'bg-rose-950/80 border-rose-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="text-[10px] font-heading uppercase tracking-wider text-slate-400">
                Non-Striker
              </span>
              <span className="font-bold text-base text-slate-100">
                {nonStriker?.playerName || 'Non-Striker'}
              </span>
              <span className="text-xs text-slate-400 font-numbers mt-0.5">
                {nonStriker?.runs ?? 0} runs ({nonStriker?.balls ?? 0} balls)
              </span>
            </button>
          </div>
        </div>

        {/* FIELDER / CATCHER / RUN-OUT INVOLVED */}
        {(wicketType === 'CAUGHT' || wicketType === 'STUMPED' || wicketType === 'RUN_OUT') && (
          <div className="mb-4">
            <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-1">
              Fielder Involved
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={fielderName}
                onChange={(e) => setFielderName(e.target.value)}
                placeholder="Type or select fielder name..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>
            {/* Quick Fielder buttons */}
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {fieldingXI.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFielderName(f.shortName || f.name)}
                  className={`text-[11px] px-2 py-1 rounded border ${
                    fielderName === (f.shortName || f.name)
                      ? 'bg-rose-600 text-white border-rose-400'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {f.shortName || f.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* RUNS COMPLETED OR WICKET ON WIDE / NO BALL */}
        {wicketType === 'RUN_OUT' && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-1">
                Runs Completed Before Out
              </label>
              <div className="flex gap-1.5">
                {[0, 1, 2, 3].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRunsCompleted(r)}
                    className={`flex-1 py-1.5 rounded font-numbers text-base font-bold border ${
                      runsCompleted === r
                        ? 'bg-rose-600 text-white border-rose-400'
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-heading uppercase tracking-wider text-slate-400 mb-1">
                Occurred On Delivery
              </label>
              <div className="flex gap-1.5">
                {[
                  { id: 'NONE', label: 'Legal' },
                  { id: 'WIDE', label: 'Wide' },
                  { id: 'NO_BALL', label: 'No Ball' },
                ].map((item: any) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setOnExtraType(item.id)}
                    className={`flex-1 py-1.5 text-xs font-heading rounded border ${
                      onExtraType === item.id
                        ? 'bg-rose-600 text-white border-rose-400'
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODAL ACTION BUTTONS */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-heading text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold font-heading text-sm uppercase tracking-wider shadow-lg shadow-rose-900/40 transition-transform active:scale-95"
          >
            Confirm Wicket
          </button>
        </div>
      </div>
    </div>
  );
}
