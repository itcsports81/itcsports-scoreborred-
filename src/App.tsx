import React, { useEffect, useState, useRef } from 'react';
import { liveSync } from './services/liveSync.js';
import { AppDatabase, Match } from './types/cricket.js';
import { BroadcastOverlay } from './components/overlay/BroadcastOverlay.js';
import { LiveScoringPanel } from './components/control/LiveScoringPanel.js';
import { MatchSetupModal } from './components/control/MatchSetupModal.js';
import { FullScorecardView } from './components/control/FullScorecardView.js';
import { TeamLibraryView } from './components/control/TeamLibraryView.js';
import { PlayerLibraryView } from './components/control/PlayerLibraryView.js';
import { MatchHistoryView } from './components/control/MatchHistoryView.js';
import { SettingsAndSponsorView } from './components/control/SettingsAndSponsorView.js';
import { OperatorLogin } from './components/control/OperatorLogin.js';
import { ChangePinModal } from './components/control/ChangePinModal.js';
import { MobileConnectModal } from './components/control/MobileConnectModal.js';
import { MobileMenuModal } from './components/control/MobileMenuModal.js';

type ActiveView = 'LIVE' | 'SETUP' | 'SCORECARD' | 'TEAMS' | 'PLAYERS' | 'HISTORY' | 'SETTINGS';

export default function App() {
  const [database, setDatabase] = useState<AppDatabase | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('LIVE');
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => liveSync.isAuthenticated());
  const [isOverlayRoute] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const isOverlay = path === '/overlay' || path.endsWith('/overlay') || params.get('mode') === 'overlay';
    if (isOverlay) {
      document.body.style.backgroundColor = 'transparent';
      document.body.classList.remove('bg-[#060a12]');
      document.body.classList.add('bg-transparent');
    }
    return isOverlay;
  });

  // Check if current route is /overlay
  useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    if (path === '/overlay' || path.endsWith('/overlay') || params.get('mode') === 'overlay') {
      document.body.style.backgroundColor = 'transparent';
      document.body.classList.remove('bg-[#060a12]');
      document.body.classList.add('bg-transparent');
    }
  }, []);

  useEffect(() => {
    liveSync.fetchInitialState().then((db) => {
      if (db) setDatabase(db);
    });

    const unsubscribe = liveSync.subscribe((db) => {
      setDatabase(db);
    });

    return () => unsubscribe();
  }, []);

  // 1. PUBLIC ROUTE: /overlay is 100% view-only and requires NO authentication
  if (isOverlayRoute) {
    return <BroadcastOverlay />;
  }

  // 2. PROTECTED CONTROL PANEL: requires operator login
  if (!isAuthenticated) {
    return <OperatorLogin onSuccess={() => setIsAuthenticated(true)} />;
  }

  const currentMatch: Match | null = database?.activeMatch || null;
  const overlayUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/overlay`;

  const copyOverlayUrl = () => {
    navigator.clipboard.writeText(overlayUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleLogout = () => {
    liveSync.logout();
    setIsAuthenticated(false);
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* GLOBAL TOP BROADCASTER HEADER */}
      <header className="bg-[#080d1a] border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Brand Logo & Mobile Menu Trigger */}
          <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-emerald-400 text-black px-3 py-1 rounded-lg font-heading font-black text-sm tracking-wider shadow-md shadow-emerald-950/50">
                <span>ITC SPORTS</span>
              </div>
              <div>
                <span className="font-heading font-bold text-sm text-white tracking-wide block">
                  LIVE CRICKET SCORING & BROADCAST SYSTEM
                </span>
                <span className="text-[10px] text-emerald-400 font-heading tracking-widest uppercase">
                  VMIX & OBS BROADCAST ENGINE • REAL-TIME SYNC
                </span>
              </div>
            </div>

            {/* MOBILE MENU BUTTON (VISIBLE ONLY ON MOBILE) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="sm:hidden px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-heading font-black flex items-center gap-1.5 shadow-lg shadow-emerald-950/80 active:scale-95 transition-transform shrink-0"
            >
              <span className="text-sm font-bold">☰</span>
              <span>MENU</span>
            </button>
          </div>

          {/* VMIX / OVERLAY URL COPY & PREVIEW (DESKTOP ONLY, MOBILE USES ☰ MENU) */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileModalOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-heading font-black flex items-center gap-1.5 transition-transform active:scale-95 shadow-md shadow-emerald-950/60"
              title="Open Scoring Panel on Mobile via QR Code or Link"
            >
              <span>📱 Mobile Scoring Link</span>
            </button>

            <button
              type="button"
              onClick={copyOverlayUrl}
              className="px-3.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-300 rounded-xl text-xs font-heading font-bold flex items-center gap-1.5 transition-transform active:scale-95 shadow-md"
              title="Copy public transparent overlay URL for vMix or OBS Browser Source"
            >
              <span>{copiedUrl ? '✓ COPIED!' : '📋 COPY /OVERLAY FOR VMIX'}</span>
            </button>

            <a
              href="/overlay"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-heading font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Open full transparent broadcast overlay in a new window"
            >
              <span>↗ POPUP OVERLAY</span>
            </a>

            <button
              type="button"
              onClick={() => setIsChangePinOpen(true)}
              className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 rounded-xl text-xs font-heading font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="Change Operator Security Password / PIN"
            >
              <span>🔑 Password / PIN</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 bg-slate-900 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-700 text-slate-300 hover:text-rose-300 rounded-xl text-xs font-heading font-bold transition-colors"
              title="Lock operator console"
            >
              🔒 Lock Console
            </button>
          </div>
        </div>

        {/* PRIMARY NAVIGATION TABS (DESKTOP ONLY, MOBILE USES ☰ MENU) */}
        <div className="hidden sm:flex max-w-7xl mx-auto mt-3 pt-2 border-t border-slate-800/60 items-center gap-1 overflow-x-auto pb-1">
          {[
            { id: 'LIVE', label: '🔴 LIVE SCORING' },
            { id: 'SCORECARD', label: '📊 FULL SCORECARD' },
            { id: 'SETUP', label: '⚙️ MATCH SETUP' },
            { id: 'TEAMS', label: '🛡️ TEAM LIBRARY' },
            { id: 'PLAYERS', label: '👥 PLAYER LIBRARY' },
            { id: 'HISTORY', label: '📁 MATCH HISTORY' },
            { id: 'SETTINGS', label: '⚙️ SETTINGS & PASSWORD' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (tab.id === 'SETUP') {
                  setIsSetupOpen(true);
                } else {
                  setActiveView(tab.id as ActiveView);
                }
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-heading font-bold uppercase transition-all shrink-0 ${
                activeView === tab.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2.5 sm:p-4 md:p-6 overflow-x-hidden">
        {/* VIEW: LIVE SCORING */}
        {activeView === 'LIVE' && currentMatch && (
          <LiveScoringPanel
            match={currentMatch}
            onOpenScorecard={() => setActiveView('SCORECARD')}
            onOpenSetup={() => setIsSetupOpen(true)}
            onOpenTeams={() => setActiveView('TEAMS')}
            onOpenPlayers={() => setActiveView('PLAYERS')}
            onOpenHistory={() => setActiveView('HISTORY')}
            onOpenSettings={() => setActiveView('SETTINGS')}
            onOpenMobileConnect={() => setIsMobileModalOpen(true)}
          />
        )}

        {/* VIEW: FULL SCORECARD */}
        {activeView === 'SCORECARD' && currentMatch && (
          <FullScorecardView match={currentMatch} onClose={() => setActiveView('LIVE')} />
        )}

        {/* VIEW: TEAM LIBRARY */}
        {activeView === 'TEAMS' && database && (
          <TeamLibraryView
            teams={database.teams}
            players={database.players}
            onClose={() => setActiveView('LIVE')}
          />
        )}

        {/* VIEW: PLAYER LIBRARY */}
        {activeView === 'PLAYERS' && database && (
          <PlayerLibraryView
            players={database.players}
            teams={database.teams}
            onClose={() => setActiveView('LIVE')}
          />
        )}

        {/* VIEW: MATCH HISTORY */}
        {activeView === 'HISTORY' && database && (
          <MatchHistoryView
            history={database.matchHistory}
            onLoadMatch={(loaded) => {
              liveSync.updateMatch(loaded);
              setActiveView('LIVE');
            }}
            onClose={() => setActiveView('LIVE')}
          />
        )}

        {/* VIEW: SETTINGS & SPONSOR */}
        {activeView === 'SETTINGS' && database && (
          <SettingsAndSponsorView
            sponsor={database.sponsor}
            overlaySettings={database.overlaySettings}
            match={database.activeMatch}
            onClose={() => setActiveView('LIVE')}
          />
        )}
      </main>

      {/* MATCH SETUP MODAL */}
      {database && (
        <MatchSetupModal
          isOpen={isSetupOpen}
          teams={database.teams}
          players={database.players}
          onClose={() => setIsSetupOpen(false)}
          onMatchCreated={() => setActiveView('LIVE')}
        />
      )}

      {/* CHANGE PIN / PASSWORD MODAL */}
      <ChangePinModal
        isOpen={isChangePinOpen}
        onClose={() => setIsChangePinOpen(false)}
      />

      {/* MOBILE CONNECT & QR CODE MODAL */}
      <MobileConnectModal
        isOpen={isMobileModalOpen}
        onClose={() => setIsMobileModalOpen(false)}
      />

      {/* MOBILE MENU & TOOLS DRAWER */}
      <MobileMenuModal
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenSetup={() => setIsSetupOpen(true)}
        onOpenScorecard={() => setActiveView('SCORECARD')}
        onOpenTeams={() => setActiveView('TEAMS')}
        onOpenPlayers={() => setActiveView('PLAYERS')}
        onOpenHistory={() => setActiveView('HISTORY')}
        onOpenSettings={() => setActiveView('SETTINGS')}
        onOpenMobileConnect={() => setIsMobileModalOpen(true)}
        onOpenChangePin={() => setIsChangePinOpen(true)}
        onCopyOverlayUrl={copyOverlayUrl}
        copiedUrl={copiedUrl}
        onLogout={handleLogout}
      />
    </div>
  );
}
