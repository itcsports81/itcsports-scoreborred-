import React, { useState } from 'react';

interface ExtraRunsModalProps {
  isOpen: boolean;
  mode: 'WIDE_PLUS' | 'NO_BALL_PLUS' | 'BYE_PLUS' | 'LEG_BYE_PLUS' | null;
  onConfirmWide: (additionalRuns: number) => void;
  onConfirmNoBall: (batterRuns: number, isOffBat: boolean, byeRuns: number) => void;
  onConfirmBye: (runs: number, isLegBye: boolean) => void;
  onClose: () => void;
}

export function ExtraRunsModal({
  isOpen,
  mode,
  onConfirmWide,
  onConfirmNoBall,
  onConfirmBye,
  onClose,
}: ExtraRunsModalProps) {
  const [customVal, setCustomVal] = useState<string>('');

  if (!isOpen || !mode) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b1324] border-2 border-emerald-500 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95">
        {/* WIDE + RUNS */}
        {mode === 'WIDE_PLUS' && (
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
                <h3 className="font-heading font-black text-lg text-purple-400 uppercase tracking-wide">
                  WIDE + ADDITIONAL RUNS
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Standard 1 Wide penalty run is automatically added. Select additional runs completed by the batters running or boundary:
            </p>

            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {[
                { add: 1, total: 2, label: 'WIDE + 1', desc: '1 run run (Strike swaps)', swap: true },
                { add: 2, total: 3, label: 'WIDE + 2', desc: '2 runs run', swap: false },
                { add: 3, total: 4, label: 'WIDE + 3', desc: '3 runs run (Strike swaps)', swap: true },
                { add: 4, total: 5, label: 'WIDE + 4', desc: '4 Boundary overthrows', swap: false },
              ].map((item) => (
                <button
                  key={item.add}
                  type="button"
                  onClick={() => onConfirmWide(item.add)}
                  className="p-3 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-600/80 rounded-xl text-left transition-all active:scale-95 flex flex-col justify-between"
                >
                  <div className="flex justify-between items-baseline">
                    <span className="font-heading font-black text-sm text-purple-200">
                      {item.label}
                    </span>
                    <span className="font-numbers text-xs text-purple-400 font-bold">
                      {item.total} runs total
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">{item.desc}</span>
                </button>
              ))}
            </div>

            {/* Custom input */}
            <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="10"
                value={customVal}
                onChange={(e) => setCustomVal(e.target.value)}
                placeholder="Custom additional runs..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />
              <button
                type="button"
                disabled={!customVal}
                onClick={() => onConfirmWide(parseInt(customVal, 10) || 0)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-heading font-bold text-xs rounded-lg uppercase"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* NO BALL + RUNS */}
        {mode === 'NO_BALL_PLUS' && (
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                <h3 className="font-heading font-black text-lg text-orange-400 uppercase tracking-wide">
                  NO BALL + RUNS (FREE HIT ACTIVATES)
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Standard 1 No Ball penalty is added to extras and Free Hit is activated. Select runs scored off the bat:
            </p>

            <div className="text-[11px] font-heading font-bold text-emerald-400 uppercase tracking-wider mb-2">
              Runs Off the Bat (Credited to Striker)
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { runs: 1, label: 'NB + 1', total: 2, swap: true },
                { runs: 2, label: 'NB + 2', total: 3, swap: false },
                { runs: 3, label: 'NB + 3', total: 4, swap: true },
                { runs: 4, label: 'NB + 4 FOUR', total: 5, swap: false, isBoundary: true },
                { runs: 5, label: 'NB + 5', total: 6, swap: true },
                { runs: 6, label: 'NB + 6 SIX', total: 7, swap: false, isBoundary: true },
              ].map((item) => (
                <button
                  key={item.runs}
                  type="button"
                  onClick={() => onConfirmNoBall(item.runs, true, 0)}
                  className={`p-2.5 rounded-xl border text-center transition-all active:scale-95 flex flex-col items-center justify-center ${
                    item.isBoundary
                      ? 'bg-amber-950/80 border-amber-500 text-white font-black'
                      : 'bg-orange-950/60 hover:bg-orange-900 border-orange-600/80 text-orange-200'
                  }`}
                >
                  <span className="font-heading font-bold text-xs">{item.label}</span>
                  <span className="font-numbers text-[10px] text-slate-300 mt-0.5">
                    {item.total} runs total
                  </span>
                </button>
              ))}
            </div>

            {/* OR BYES/LEG-BYES ON NO BALL */}
            <div className="pt-3 border-t border-slate-800">
              <div className="text-[11px] font-heading font-bold text-slate-400 uppercase tracking-wider mb-2">
                Or Byes on No Ball (Not off the Bat)
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => onConfirmNoBall(0, false, b)}
                    className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs font-heading font-bold"
                  >
                    NB + {b} Bye
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BYE / LEG BYE MULTI-RUNS */}
        {(mode === 'BYE_PLUS' || mode === 'LEG_BYE_PLUS') && (
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-heading font-black text-lg text-white uppercase tracking-wide">
                SELECT {mode === 'BYE_PLUS' ? 'BYES' : 'LEG BYES'} RUNS
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Counts as legal ball. Runs are credited to team extras, not to the batter.
            </p>

            <div className="grid grid-cols-4 gap-2.5 mb-4">
              {[1, 2, 3, 4].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onConfirmBye(r, mode === 'LEG_BYE_PLUS')}
                  className="py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white rounded-xl font-heading font-bold text-sm text-center active:scale-95 transition-all"
                >
                  <span className="font-numbers text-xl block">{r}</span>
                  <span className="text-[10px] text-slate-400">{r === 1 ? '1 Run' : `${r} Runs`}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white font-heading text-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
