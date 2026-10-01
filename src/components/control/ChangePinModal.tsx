import React, { useState } from 'react';
import { liveSync } from '../../services/liveSync.js';

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePinModal({ isOpen, onClose }: ChangePinModalProps) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPin.trim() || !newPin.trim()) {
      setStatusMsg({ text: 'Please fill all password fields / Sabhi fields bharein', isError: true });
      return;
    }
    if (newPin !== confirmPin) {
      setStatusMsg({ text: 'New PIN and Confirm PIN do not match / Naya PIN match nahi kar raha', isError: true });
      return;
    }
    if (newPin.trim().length < 4) {
      setStatusMsg({ text: 'New PIN must be at least 4 characters long (kam se kam 4 ank ya akshar)', isError: true });
      return;
    }

    setLoading(true);
    setStatusMsg(null);
    const result = await liveSync.changePin(currentPin.trim(), newPin.trim());
    setLoading(false);

    if (result.success) {
      setStatusMsg({
        text: '✓ Password / PIN successfully changed! Aapka naya password save ho gaya hai.',
        isError: false,
      });
      setTimeout(() => {
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
        setStatusMsg(null);
        onClose();
      }, 1800);
    } else {
      setStatusMsg({
        text: result.error || 'Failed to change password. Please check your current PIN.',
        isError: true,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#080d1a] border-2 border-emerald-500/80 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔑</span>
            <div>
              <h3 className="text-lg font-black font-heading text-white">
                CHANGE OPERATOR PASSWORD / PIN
              </h3>
              <p className="text-[11px] text-emerald-400 font-heading">
                Apna manpasand password / PIN set karein
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs uppercase font-heading text-slate-300 mb-1 font-bold">
              Current PIN / Purana Password:
            </label>
            <input
              type="password"
              autoFocus
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              placeholder="Enter current PIN (Default: 7860)"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-numbers tracking-widest focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 placeholder:font-sans placeholder:text-xs"
            />
            <span className="text-[10px] text-slate-500">Agar pehle kabhi change nahi kiya, toh default <b>7860</b> daalein</span>
          </div>

          <div>
            <label className="block text-xs uppercase font-heading text-slate-300 mb-1 font-bold">
              New Password / Naya PIN (Jo aap rakhna chahte hain):
            </label>
            <input
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="e.g. 1234 ya apna password"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-numbers tracking-widest focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 placeholder:font-sans placeholder:text-xs"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-heading text-slate-300 mb-1 font-bold">
              Confirm New Password / Naya PIN dobara daalein:
            </label>
            <input
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="Re-enter new PIN / password"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-numbers tracking-widest focus:outline-none focus:border-emerald-500 placeholder:text-slate-600 placeholder:font-sans placeholder:text-xs"
            />
          </div>

          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-heading ${
                statusMsg.isError
                  ? 'bg-rose-950/80 border border-rose-800 text-rose-300'
                  : 'bg-emerald-950/80 border border-emerald-600 text-emerald-300 font-bold'
              }`}
            >
              {statusMsg.text}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-heading text-xs uppercase tracking-wider rounded-xl font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !newPin.trim() || !currentPin.trim()}
              className="w-2/3 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-black font-heading text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform active:scale-95"
            >
              {loading ? 'Saving...' : '💾 Save New Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
