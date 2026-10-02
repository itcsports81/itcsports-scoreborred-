import React from 'react';

interface MobileMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSetup: () => void;
  onOpenScorecard: () => void;
  onOpenTeams: () => void;
  onOpenPlayers: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenMobileConnect: () => void;
  onOpenChangePin: () => void;
  onCopyOverlayUrl: () => void;
  copiedUrl: boolean;
  onLogout: () => void;
}

export function MobileMenuModal({
  isOpen,
  onClose,
  onOpenSetup,
  onOpenScorecard,
  onOpenTeams,
  onOpenPlayers,
  onOpenHistory,
  onOpenSettings,
  onOpenMobileConnect,
  onOpenChangePin,
  onCopyOverlayUrl,
  copiedUrl,
  onLogout,
}: MobileMenuModalProps) {
  if (!isOpen) return null;

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b1324] border-2 border-emerald-500 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xl font-black font-heading text-emerald-400 tracking-wide uppercase">
              ITC SPORTS MENU & TOOLS
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-5">
          Live scoring is active below. Select any management tool or view from the categories below:
        </p>

        <div className="space-y-5">
          {/* MATCH */}
          <div>
            <div className="text-[11px] font-heading font-bold text-emerald-400 uppercase tracking-widest mb-2 border-b border-emerald-950 pb-1">
              Match Controls
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleAction(onOpenSetup)}
                className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-left transition-all active:scale-95 flex items-center gap-2.5"
              >
                <span className="text-base">⚙️</span>
                <div>
                  <div className="font-bold text-xs text-white">Match Setup</div>
                  <div className="text-[10px] text-slate-400">Configure teams & overs</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAction(onOpenScorecard)}
                className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-left transition-all active:scale-95 flex items-center gap-2.5"
              >
                <span className="text-base">📊</span>
                <div>
                  <div className="font-bold text-xs text-white">Full Scorecard</div>
                  <div className="text-[10px] text-slate-400">Detailed batter & bowler stats</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAction(onOpenHistory)}
                className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-left transition-all active:scale-95 flex items-center gap-2.5 col-span-2"
              >
                <span className="text-base">📁</span>
                <div>
                  <div className="font-bold text-xs text-white">Match History</div>
                  <div className="text-[10px] text-slate-400">Past matches and archives</div>
                </div>
              </button>
            </div>
          </div>

          {/* TEAM & PLAYERS */}
          <div>
            <div className="text-[11px] font-heading font-bold text-emerald-400 uppercase tracking-widest mb-2 border-b border-emerald-950 pb-1">
              Teams & Roster
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleAction(onOpenTeams)}
                className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-left transition-all active:scale-95 flex items-center gap-2.5"
              >
                <span className="text-base">🛡️</span>
                <div>
                  <div className="font-bold text-xs text-white">Team Library</div>
                  <div className="text-[10px] text-slate-400">Manage teams & logos</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAction(onOpenPlayers)}
                className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-left transition-all active:scale-95 flex items-center gap-2.5"
              >
                <span className="text-base">👥</span>
                <div>
                  <div className="font-bold text-xs text-white">Player Library</div>
                  <div className="text-[10px] text-slate-400">Rosters & player stats</div>
                </div>
              </button>
            </div>
          </div>

          {/* BROADCAST */}
          <div>
            <div className="text-[11px] font-heading font-bold text-emerald-400 uppercase tracking-widest mb-2 border-b border-emerald-950 pb-1">
              Broadcast & vMix
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href="/overlay"
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-left transition-all active:scale-95 flex items-center gap-2.5"
              >
                <span className="text-base">📺</span>
                <div>
                  <div className="font-bold text-xs text-white">Popup Overlay Window</div>
                  <div className="text-[10px] text-slate-400">Open transparent scorebug</div>
                </div>
              </a>

              <button
                type="button"
                onClick={() => {
                  onCopyOverlayUrl();
                }}
                className="p-3 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-600/60 rounded-xl text-left transition-all active:scale-95 flex items-center gap-2.5"
              >
                <span className="text-base">📋</span>
                <div>
                  <div className="font-bold text-xs text-emerald-300">
                    {copiedUrl ? 'Copied URL!' : 'Copy /Overlay URL'}
                  </div>
                  <div className="text-[10px] text-emerald-400/80">For vMix / OBS browser source</div>
                </div>
              </button>
            </div>
          </div>

          {/* TOOLS & SECURITY */}
          <div>
            <div className="text-[11px] font-heading font-bold text-emerald-400 uppercase tracking-widest mb-2 border-b border-emerald-950 pb-1">
              Tools & Security
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleAction(onOpenMobileConnect)}
                className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-left transition-all active:scale-95 flex items-center gap-2.5"
              >
                <span className="text-base">📱</span>
                <div>
                  <div className="font-bold text-xs text-white">Mobile Scoring Link</div>
                  <div className="text-[10px] text-slate-400">QR code for second device</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAction(onOpenSettings)}
                className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-left transition-all active:scale-95 flex items-center gap-2.5"
              >
                <span className="text-base">⚙️</span>
                <div>
                  <div className="font-bold text-xs text-white">Settings & Sponsors</div>
                  <div className="text-[10px] text-slate-400">Sponsor banners & themes</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAction(onOpenChangePin)}
                className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-left transition-all active:scale-95 flex items-center gap-2.5"
              >
                <span className="text-base">🔑</span>
                <div>
                  <div className="font-bold text-xs text-white">Change PIN / Password</div>
                  <div className="text-[10px] text-slate-400">Secure operator access</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAction(onLogout)}
                className="p-3 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/80 rounded-xl text-left transition-all active:scale-95 flex items-center gap-2.5"
              >
                <span className="text-base">🔒</span>
                <div>
                  <div className="font-bold text-xs text-rose-300">Lock Console</div>
                  <div className="text-[10px] text-rose-400/80">Require PIN to return</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-heading text-xs font-bold rounded-xl"
          >
            Close Menu
          </button>
        </div>
      </div>
    </div>
  );
}
