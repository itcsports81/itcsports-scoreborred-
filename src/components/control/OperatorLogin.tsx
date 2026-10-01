import React, { useState } from 'react';
import { liveSync } from '../../services/liveSync.js';

interface OperatorLoginProps {
  onSuccess: () => void;
}

export function OperatorLogin({ onSuccess }: OperatorLoginProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin.trim()) return;
    setLoading(true);
    setError(null);

    const ok = await liveSync.login(pin.trim());
    setLoading(false);
    if (ok) {
      onSuccess();
    } else {
      setError('Invalid Operator Security PIN.');
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-emerald-500 selection:text-black">
      <div className="max-w-md w-full bg-[#080d1a] border-2 border-emerald-500/80 rounded-2xl p-8 shadow-2xl shadow-emerald-950/40 relative overflow-hidden backdrop-blur-xl">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-black flex items-center justify-center font-heading font-black text-xl mb-3 shadow-lg shadow-emerald-950">
            ITC
          </div>
          <span className="text-[10px] uppercase font-heading tracking-widest text-emerald-400 font-bold mb-1">
            ITC SPORTS OFFICIAL BROADCAST CONSOLE
          </span>
          <h2 className="text-2xl font-black font-heading text-white">
            OPERATOR CONTROL LOGIN
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            Live scoring, match setup, teams, players, and match history are protected.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase font-heading text-slate-300 mb-1.5 font-bold">
              Enter Operator Security PIN:
            </label>
            <input
              type="password"
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter secure PIN"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-numbers text-lg tracking-widest focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 placeholder:text-sm placeholder:font-sans"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-heading">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !pin.trim()}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-black font-heading text-sm uppercase tracking-wider rounded-xl shadow-lg transition-transform active:scale-95"
          >
            {loading ? 'Authenticating...' : 'Unlock Control Panel'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <span className="text-[11px] text-slate-500 block mb-2">
            Broadcasting via OBS or vMix?
          </span>
          <a
            href="/overlay"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-heading"
          >
            <span>↗ Open Public /overlay (No Login Required)</span>
          </a>
        </div>
      </div>
    </div>
  );
}
