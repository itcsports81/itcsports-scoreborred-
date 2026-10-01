import React, { useState } from 'react';
import { SponsorConfig, BroadcastOverlaySettings, Match } from '../../types/cricket.js';
import { liveSync } from '../../services/liveSync.js';

interface SettingsAndSponsorViewProps {
  sponsor: SponsorConfig;
  overlaySettings: BroadcastOverlaySettings;
  match: Match | null;
  onClose?: () => void;
}

export function SettingsAndSponsorView({ sponsor, overlaySettings, match, onClose }: SettingsAndSponsorViewProps) {
  const [localSponsor, setLocalSponsor] = useState<SponsorConfig>({ ...sponsor });
  const [localOverlay, setLocalOverlay] = useState<BroadcastOverlaySettings>({ ...overlaySettings });
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Password / PIN change state
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPinInput.trim() || !newPinInput.trim()) {
      setPinChangeMsg({ text: 'Please fill all PIN fields', isError: true });
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setPinChangeMsg({ text: 'New PIN and Confirm PIN do not match', isError: true });
      return;
    }
    if (newPinInput.trim().length < 4) {
      setPinChangeMsg({ text: 'New PIN must be at least 4 characters long', isError: true });
      return;
    }

    setPinLoading(true);
    setPinChangeMsg(null);
    const result = await liveSync.changePin(currentPinInput.trim(), newPinInput.trim());
    setPinLoading(false);

    if (result.success) {
      setPinChangeMsg({ text: '✓ Password/PIN updated successfully! Use your new PIN next time you log in.', isError: false });
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
    } else {
      setPinChangeMsg({ text: result.error || 'Failed to update PIN', isError: true });
    }
  };

  const handleSponsorLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLocalSponsor((prev) => ({ ...prev, logoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAll = async () => {
    await liveSync.saveSponsor(localSponsor);
    await liveSync.saveOverlaySettings(localOverlay);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const triggerTestAnimation = (type: 'FOUR' | 'SIX' | 'WICKET' | 'FREE_HIT') => {
    liveSync.triggerBroadcastEvent({
      id: `test-${Date.now()}`,
      type,
      title: type === 'FOUR' ? 'FOUR 4' : type === 'SIX' ? 'MAXIMUM 6' : type === 'WICKET' ? 'WICKET!' : 'FREE HIT',
      subtitle: type === 'WICKET' ? 'Caught behind by Keeper' : 'ITC SPORTS Live Broadcast',
      durationMs: 3500,
      timestamp: Date.now(),
    });
  };

  return (
    <div className="bg-[#080d19] border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500 text-black px-2 py-0.5 rounded text-[10px] font-black font-heading">
              ITC SPORTS
            </span>
            <span className="text-xs text-emerald-400 font-heading tracking-widest uppercase">
              BROADCAST & SPONSOR CONFIG
            </span>
          </div>
          <h2 className="text-2xl font-black font-heading text-white">Broadcast Engine Settings</h2>
          <p className="text-xs text-slate-400">
            Control overlay layout, sponsor branding, graphics triggers, and broadcast safety features.
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-heading text-xs"
          >
            Close
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-300 px-4 py-2.5 rounded-xl mb-6 text-center font-heading text-xs font-bold animate-in fade-in">
          ✓ Broadcast settings saved & synced to all connected overlays!
        </div>
      )}

      {/* SECTION 1: SPONSOR CONFIG */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold font-heading text-emerald-400 uppercase tracking-wide">
              Commercial Sponsor Branding
            </h3>
            <p className="text-xs text-slate-400">
              Display official sponsor title or upload computer logo to appear on the scorebug.
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localSponsor.enabled}
              onChange={(e) => setLocalSponsor({ ...localSponsor, enabled: e.target.checked })}
              className="rounded accent-emerald-500 w-4 h-4"
            />
            <span className="text-xs font-heading font-bold text-slate-200">Enable Sponsor</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] text-slate-400 uppercase font-heading mb-1">
                Sponsor Brand Name
              </label>
              <input
                type="text"
                value={localSponsor.name || ''}
                onChange={(e) => setLocalSponsor({ ...localSponsor, name: e.target.value })}
                placeholder="e.g. ITC BROADCAST NETWORK"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 uppercase font-heading mb-1">
                Tagline / Subtext
              </label>
              <input
                type="text"
                value={localSponsor.tagline || ''}
                onChange={(e) => setLocalSponsor({ ...localSponsor, tagline: e.target.value })}
                placeholder="e.g. Official Streaming Partner"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 uppercase font-heading mb-1">
              Upload Sponsor Logo
            </label>
            <div className="border border-dashed border-slate-700 rounded-lg p-3 flex flex-col items-center justify-center bg-slate-900/40 min-h-[110px]">
              {localSponsor.logoUrl ? (
                <div className="flex items-center gap-3">
                  <img
                    src={localSponsor.logoUrl}
                    alt="Sponsor Logo"
                    className="h-10 object-contain rounded p-1 bg-black/60 border border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => setLocalSponsor({ ...localSponsor, logoUrl: '' })}
                    className="text-xs text-rose-400 hover:text-rose-300 font-heading"
                  >
                    Remove Logo
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer text-center">
                  <span className="text-xs text-emerald-400 font-heading font-bold block">
                    Choose Sponsor Logo from Computer
                  </span>
                  <span className="text-[10px] text-slate-500">PNG, JPG, SVG</span>
                  <input type="file" accept="image/*" onChange={handleSponsorLogoUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: PROFESSIONAL THEME SELECTOR & COLOR CUSTOMIZATION SYSTEM */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 mb-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black font-heading text-emerald-400 uppercase tracking-wide">
              🏆 Professional Theme & Color Customization System
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select one of 3 professional broadcast themes or configure custom color pickers. Changes update the live /overlay automatically for vMix/OBS.
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              const updated = { ...localOverlay, activeGraphic: 'SCOREBUG' as const };
              setLocalOverlay(updated);
              await liveSync.saveOverlaySettings(updated);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <span>🟢 Show Clean Scorebug Only</span>
          </button>
        </div>

        {/* THEME SELECTION BUTTONS BAR */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setLocalOverlay({ ...localOverlay, theme: 'itc_premium' })}
            className={`px-5 py-3 rounded-xl font-heading font-black text-xs transition-all border-2 flex items-center gap-2 ${
              localOverlay.theme === 'itc_premium'
                ? 'bg-emerald-500 text-black border-emerald-300 shadow-lg scale-105'
                : 'bg-slate-950 text-emerald-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span>[ ITC PREMIUM ]</span>
            {localOverlay.theme === 'itc_premium' && <span>✓</span>}
          </button>
          <button
            type="button"
            onClick={() => setLocalOverlay({ ...localOverlay, theme: 'itc_gold' })}
            className={`px-5 py-3 rounded-xl font-heading font-black text-xs transition-all border-2 flex items-center gap-2 ${
              localOverlay.theme === 'itc_gold'
                ? 'bg-amber-400 text-black border-amber-200 shadow-lg scale-105'
                : 'bg-slate-950 text-amber-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span>[ ITC GOLD ]</span>
            {localOverlay.theme === 'itc_gold' && <span>✓</span>}
          </button>
          <button
            type="button"
            onClick={() => setLocalOverlay({ ...localOverlay, theme: 'itc_neon' })}
            className={`px-5 py-3 rounded-xl font-heading font-black text-xs transition-all border-2 flex items-center gap-2 ${
              localOverlay.theme === 'itc_neon'
                ? 'bg-cyan-400 text-black border-cyan-200 shadow-lg scale-105'
                : 'bg-slate-950 text-cyan-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span>[ ITC NEON ]</span>
            {localOverlay.theme === 'itc_neon' && <span>✓</span>}
          </button>
          <button
            type="button"
            onClick={() => setLocalOverlay({ ...localOverlay, theme: 'custom' })}
            className={`px-5 py-3 rounded-xl font-heading font-bold text-xs transition-all border-2 flex items-center gap-2 ${
              localOverlay.theme === 'custom'
                ? 'bg-purple-500 text-white border-purple-300 shadow-lg scale-105'
                : 'bg-slate-950 text-purple-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span>[ CUSTOM COLORS ]</span>
            {localOverlay.theme === 'custom' && <span>✓</span>}
          </button>
        </div>

        {/* 3 PREVIEW CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* THEME 1 PREVIEW */}
          <div
            onClick={() => setLocalOverlay({ ...localOverlay, theme: 'itc_premium' })}
            className={`cursor-pointer rounded-2xl p-4 border-2 transition-all ${
              localOverlay.theme === 'itc_premium' ? 'bg-emerald-950/40 border-emerald-400' : 'bg-slate-950/70 border-slate-800'
            }`}
          >
            <div className="text-[10px] font-heading font-black text-emerald-400 uppercase mb-1">Theme 1</div>
            <div className="text-sm font-bold text-white mb-2">ITC SPORTS PREMIUM</div>
            <div className="bg-[#050811] border border-emerald-500/60 rounded-lg p-2 text-[10px] text-emerald-300">
              Deep Black/Navy • ITC Green • Gold Accent
            </div>
          </div>

          {/* THEME 2 PREVIEW */}
          <div
            onClick={() => setLocalOverlay({ ...localOverlay, theme: 'itc_gold' })}
            className={`cursor-pointer rounded-2xl p-4 border-2 transition-all ${
              localOverlay.theme === 'itc_gold' ? 'bg-amber-950/40 border-amber-400' : 'bg-slate-950/70 border-slate-800'
            }`}
          >
            <div className="text-[10px] font-heading font-black text-amber-400 uppercase mb-1">Theme 2</div>
            <div className="text-sm font-bold text-white mb-2">ITC SPORTS GOLD</div>
            <div className="bg-[#0a0a0c] border border-amber-400/60 rounded-lg p-2 text-[10px] text-amber-300">
              Black • Gold • Dark Charcoal
            </div>
          </div>

          {/* THEME 3 PREVIEW */}
          <div
            onClick={() => setLocalOverlay({ ...localOverlay, theme: 'itc_neon' })}
            className={`cursor-pointer rounded-2xl p-4 border-2 transition-all ${
              localOverlay.theme === 'itc_neon' ? 'bg-cyan-950/40 border-cyan-400' : 'bg-slate-950/70 border-slate-800'
            }`}
          >
            <div className="text-[10px] font-heading font-black text-cyan-400 uppercase mb-1">Theme 3</div>
            <div className="text-sm font-bold text-white mb-2">ITC SPORTS NEON</div>
            <div className="bg-[#020617] border border-cyan-400/60 rounded-lg p-2 text-[10px] text-cyan-300">
              Black • Neon Green • Cyan
            </div>
          </div>
        </div>

        {/* CUSTOM COLOR PICKERS IF CUSTOM THEME */}
        {(localOverlay.theme === 'custom' || true) && (
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="text-xs font-heading font-bold text-emerald-400 uppercase">Custom Color Pickers</div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-heading mb-1">Primary Color</label>
                <input
                  type="color"
                  value={localOverlay.customPrimary || '#10b981'}
                  onChange={(e) => setLocalOverlay({ ...localOverlay, customPrimary: e.target.value })}
                  className="w-full h-9 bg-transparent cursor-pointer rounded"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-heading mb-1">Secondary Color</label>
                <input
                  type="color"
                  value={localOverlay.customSecondary || '#047857'}
                  onChange={(e) => setLocalOverlay({ ...localOverlay, customSecondary: e.target.value })}
                  className="w-full h-9 bg-transparent cursor-pointer rounded"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-heading mb-1">Accent Color</label>
                <input
                  type="color"
                  value={localOverlay.customAccent || '#fbbf24'}
                  onChange={(e) => setLocalOverlay({ ...localOverlay, customAccent: e.target.value })}
                  className="w-full h-9 bg-transparent cursor-pointer rounded"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-heading mb-1">Text Color</label>
                <input
                  type="color"
                  value={localOverlay.customText || '#ffffff'}
                  onChange={(e) => setLocalOverlay({ ...localOverlay, customText: e.target.value })}
                  className="w-full h-9 bg-transparent cursor-pointer rounded"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-heading mb-1">Background Color</label>
                <input
                  type="color"
                  value={localOverlay.customBg || '#050811'}
                  onChange={(e) => setLocalOverlay({ ...localOverlay, customBg: e.target.value })}
                  className="w-full h-9 bg-transparent cursor-pointer rounded"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-heading mb-1">Border Color</label>
                <input
                  type="color"
                  value={localOverlay.customBorder || '#10b981'}
                  onChange={(e) => setLocalOverlay({ ...localOverlay, customBorder: e.target.value })}
                  className="w-full h-9 bg-transparent cursor-pointer rounded"
                />
              </div>
            </div>
          </div>
        )}

        {/* SAVE, APPLY & RESET THEME BUTTONS */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-heading font-black text-xs rounded-xl shadow-lg transition-all"
            >
              Save Theme
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-heading font-black text-xs rounded-xl shadow-lg transition-all"
            >
              Apply Theme
            </button>
          </div>
          <button
            type="button"
            onClick={() => setLocalOverlay({ ...localOverlay, theme: 'itc_premium', showLogo: true, showTicker: true, showAnimations: true })}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-heading text-xs rounded-xl transition-all font-bold"
          >
            Reset Theme
          </button>
        </div>

        {/* ADDITIONAL CUSTOMIZATION OPTIONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
          <div>
            <label className="block text-[11px] text-slate-400 uppercase font-heading mb-1">
              Scorebug Position
            </label>
            <div className="flex gap-2">
              {(['bottom', 'top'] as const).map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setLocalOverlay({ ...localOverlay, position: pos })}
                  className={`flex-1 py-2 text-xs font-heading font-bold uppercase rounded-lg border transition-all ${
                    localOverlay.position === pos
                      ? 'bg-emerald-600 border-emerald-400 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 uppercase font-heading mb-1">
              Animation Style
            </label>
            <select
              value={localOverlay.animationStyle || 'slide_in'}
              onChange={(e) => setLocalOverlay({ ...localOverlay, animationStyle: e.target.value as any })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            >
              <option value="slide_in">Slide In (Broadcast Smooth)</option>
              <option value="fade_in">Fade In Smooth</option>
              <option value="zoom">Zoom In Dynamic</option>
              <option value="bounce">Bounce Effect</option>
              <option value="glow">Glow & Pulse</option>
              <option value="none">Minimal / No Animation</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 uppercase font-heading mb-1">
              Animation Speed
            </label>
            <div className="flex gap-2">
              {(['slow', 'normal', 'fast'] as const).map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setLocalOverlay({ ...localOverlay, animationSpeed: spd })}
                  className={`flex-1 py-2 text-xs font-heading font-bold uppercase rounded-lg border transition-all ${
                    localOverlay.animationSpeed === spd
                      ? 'bg-emerald-600 border-emerald-400 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  {spd}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 uppercase font-heading mb-1">
              Active Graphic Mode
            </label>
            <select
              value={localOverlay.activeGraphic}
              onChange={(e) => setLocalOverlay({ ...localOverlay, activeGraphic: e.target.value as any })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            >
              <option value="SCOREBUG">Standard Scorebug</option>
              <option value="MINI_BUG">Mini Scorebug</option>
              <option value="SCORECARD">Fullscreen Inning Scorecard</option>
              <option value="CURRENT_PARTNERSHIP">Current Partnership</option>
              <option value="TOP_SCORERS">Top Scorers</option>
              <option value="BEST_BOWLERS">Best Bowlers</option>
              <option value="BOTH_SQUADS">Both Playing XI</option>
              <option value="MATCH_SUMMARY">Match Summary</option>
              <option value="RESULT_BANNER">Result Banner</option>
            </select>
          </div>
        </div>

        {/* TOGGLES: LOGO, SPONSOR, TICKER, ANIMATIONS */}
        <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-800 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localOverlay.showLogo !== false}
              onChange={(e) => setLocalOverlay({ ...localOverlay, showLogo: e.target.checked })}
              className="rounded accent-emerald-500 w-4 h-4"
            />
            <span className="text-slate-300 font-heading">Logo ON/OFF</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localOverlay.showSponsor !== false}
              onChange={(e) => setLocalOverlay({ ...localOverlay, showSponsor: e.target.checked })}
              className="rounded accent-emerald-500 w-4 h-4"
            />
            <span className="text-slate-300 font-heading">Sponsor ON/OFF</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localOverlay.showTicker !== false}
              onChange={(e) => setLocalOverlay({ ...localOverlay, showTicker: e.target.checked })}
              className="rounded accent-emerald-500 w-4 h-4"
            />
            <span className="text-slate-300 font-heading">Ticker ON/OFF</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localOverlay.showAnimations !== false}
              onChange={(e) => setLocalOverlay({ ...localOverlay, showAnimations: e.target.checked })}
              className="rounded accent-emerald-500 w-4 h-4"
            />
            <span className="text-slate-300 font-heading">Event Popups (4/6/Wicket) ON/OFF</span>
          </label>
        </div>
      </div>

      {/* SECTION 3: TEST BROADCAST ANIMATIONS */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 mb-6">
        <h3 className="text-base font-bold font-heading text-emerald-400 uppercase tracking-wide mb-2">
          Broadcast Graphic Testing Triggers
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Click to test how live graphics appear on vMix / OBS overlays instantly without altering score numbers.
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => triggerTestAnimation('FOUR')}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-heading text-xs font-bold"
          >
            ⚡ Test FOUR Banner
          </button>
          <button
            type="button"
            onClick={() => triggerTestAnimation('SIX')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-black rounded-lg font-heading text-xs font-black"
          >
            ⚡ Test SIX Banner
          </button>
          <button
            type="button"
            onClick={() => triggerTestAnimation('WICKET')}
            className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-lg font-heading text-xs font-bold"
          >
            ⚡ Test WICKET Alert
          </button>
          <button
            type="button"
            onClick={() => triggerTestAnimation('FREE_HIT')}
            className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-amber-200 rounded-lg font-heading text-xs font-bold"
          >
            ⚡ Test FREE HIT
          </button>
        </div>
      </div>

      {/* SECTION 4: OPERATOR SECURITY PIN / PASSWORD MANAGEMENT */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <h3 className="text-base font-bold font-heading text-emerald-400 uppercase tracking-wide">
            Operator Security Password / PIN Management
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Change the Control Panel PIN to your own preferred password or PIN (e.g. 7860, 1234, or text password).
          The new password will be required next time you unlock the scoring console.
        </p>

        <form onSubmit={handleUpdatePin} className="max-w-md space-y-3">
          <div>
            <label className="block text-[11px] uppercase font-heading text-slate-400 mb-1">
              Current PIN / Password:
            </label>
            <input
              type="password"
              value={currentPinInput}
              onChange={(e) => setCurrentPinInput(e.target.value)}
              placeholder="Enter current PIN (Default: 7860)"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-numbers tracking-wider"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase font-heading text-slate-400 mb-1">
                New PIN / Password:
              </label>
              <input
                type="password"
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value)}
                placeholder="Enter new PIN"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-numbers tracking-wider"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase font-heading text-slate-400 mb-1">
                Confirm New PIN:
              </label>
              <input
                type="password"
                value={confirmPinInput}
                onChange={(e) => setConfirmPinInput(e.target.value)}
                placeholder="Confirm new PIN"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-numbers tracking-wider"
              />
            </div>
          </div>

          {pinChangeMsg && (
            <div
              className={`p-2.5 rounded-lg text-xs font-heading ${
                pinChangeMsg.isError
                  ? 'bg-rose-950/60 border border-rose-800 text-rose-300'
                  : 'bg-emerald-950/60 border border-emerald-700 text-emerald-300'
              }`}
            >
              {pinChangeMsg.text}
            </div>
          )}

          <div className="pt-1">
            <button
              type="submit"
              disabled={pinLoading || !newPinInput.trim() || !currentPinInput.trim()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-black font-black font-heading text-xs uppercase tracking-wider rounded-xl shadow-md transition-transform active:scale-95"
            >
              {pinLoading ? 'Updating PIN...' : 'Update & Save New PIN'}
            </button>
          </div>
        </form>
      </div>

      {/* SAVE BUTTON */}
      <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
        <button
          type="button"
          onClick={handleSaveAll}
          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black font-heading text-xs rounded-xl uppercase tracking-wider shadow-lg"
        >
          Save All Broadcast Settings
        </button>
      </div>

      {/* GITHUB & VERCEL/RENDER DEPLOYMENT EXPORT */}
      <div className="mt-8 pt-6 border-t border-slate-800 bg-[#060a12] p-5 rounded-xl border border-slate-800/80">
        <h3 className="text-sm font-black font-heading text-white uppercase tracking-wider mb-1 flex items-center gap-2">
          <span>📦 GitHub / Vercel / Render Project Source Export</span>
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Download the complete source code archive to upload to your GitHub repository (`ITC-SPORTS`) for 100% public hosting without login prompts.
        </p>
        <a
          href="/project.tar.gz"
          download="itc-sports-broadcast-source.tar.gz"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-black font-heading text-xs uppercase tracking-wider rounded-xl shadow-md transition-transform active:scale-95"
        >
          <span>⬇ Download Complete Source Code (.tar.gz)</span>
        </a>
      </div>
    </div>
  );
}
