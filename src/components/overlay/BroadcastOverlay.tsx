import React, { useEffect, useState } from 'react';
import { liveSync } from '../../services/liveSync.js';
import { AppDatabase, Match, BroadcastAnimationEvent, InningsState } from '../../types/cricket.js';
import { calculateRunRate } from '../../services/cricketEngine.js';

export function BroadcastOverlay() {
  const [database, setDatabase] = useState<AppDatabase | null>(null);
  const [activeEvent, setActiveEvent] = useState<BroadcastAnimationEvent | null>(null);

  // Check URL params for customization: ?pos=top|bottom & ?theme=dark|emerald & ?graphic=scorebug|scorecard|partnership|bowler
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const posParam = searchParams.get('pos') || 'bottom';
  const graphicParam = searchParams.get('graphic');

  useEffect(() => {
    liveSync.fetchInitialState().then((db) => {
      if (db) setDatabase(db);
    });

    const unsubscribe = liveSync.subscribe((db) => {
      setDatabase(db);
    });

    const unsubscribeEvents = liveSync.subscribeEvents((ev) => {
      setActiveEvent(ev);
      const timer = setTimeout(() => {
        setActiveEvent(null);
      }, ev.durationMs || 3500);
      return () => clearTimeout(timer);
    });

    return () => {
      unsubscribe();
      unsubscribeEvents();
    };
  }, []);

  if (!database || !database.activeMatch) {
    return (
      <div className="w-screen h-screen bg-transparent flex items-center justify-center p-8">
        <div className="bg-[#0b1324]/90 border border-emerald-500/40 text-emerald-400 px-6 py-3 rounded-lg font-heading tracking-wider shadow-2xl backdrop-blur-md">
          ITC SPORTS • WAITING FOR LIVE MATCH SIGNAL...
        </div>
      </div>
    );
  }

  const match: Match = database.activeMatch;
  const currentInning: InningsState | undefined = match.innings[match.currentInningIndex];
  if (!currentInning) return null;

  const overlaySettings = database.overlaySettings || {
    showSponsor: true,
    showAnimations: true,
    position: 'bottom',
    activeGraphic: 'SCOREBUG',
  };

  const activeGraphicType = graphicParam?.toUpperCase() || overlaySettings.activeGraphic || 'SCOREBUG';
  const isTop = posParam === 'top' || overlaySettings.position === 'top';

  // Batter stats
  const striker = currentInning.batters.find((b) => b.playerId === currentInning.strikerId);
  const nonStriker = currentInning.batters.find((b) => b.playerId === currentInning.nonStrikerId);

  // Bowler stats
  const bowler = currentInning.bowlers.find((bw) => bw.playerId === currentInning.currentBowlerId);

  // Team Details
  const battingTeam = currentInning.battingTeamId === match.teamA.id ? match.teamA : match.teamB;
  const bowlingTeam = currentInning.bowlingTeamId === match.teamA.id ? match.teamA : match.teamB;

  // Run rates
  const crr = calculateRunRate(currentInning.runs, currentInning.legalBalls);

  // 2nd Innings Target / RRR
  const isSecondInning = Boolean(match.currentInningIndex === 1 && match.innings[0]);
  const targetRuns = isSecondInning ? match.innings[0].runs + 1 : 0;
  const runsNeeded = isSecondInning ? Math.max(0, targetRuns - currentInning.runs) : 0;
  const ballsRemaining = isSecondInning ? Math.max(0, match.settings.totalOvers * 6 - currentInning.legalBalls) : 0;
  const rrr = isSecondInning && ballsRemaining > 0 ? Number(((runsNeeded / (ballsRemaining / 6))).toFixed(2)) : 0;

  // Recent deliveries in current over
  const currentOverIndex = Math.floor(currentInning.legalBalls / 6);
  const recentDeliveries = currentInning.deliveries.filter(
    (d) => d.inningIndex === match.currentInningIndex && d.overIndex === currentOverIndex
  );

  const bgType = overlaySettings?.bgType || 'transparent';
  let dynamicBgClass = 'w-screen h-screen relative overflow-hidden flex flex-col justify-between p-4 md:p-6 select-none pointer-events-none ';
  if (bgType === 'solid') dynamicBgClass += 'bg-[#080d19] text-white';
  else if (bgType === 'gradient') dynamicBgClass += 'bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white';
  else if (bgType === 'dark') dynamicBgClass += 'bg-slate-950 text-slate-100';
  else if (bgType === 'light') dynamicBgClass += 'bg-slate-100 text-slate-900';
  else dynamicBgClass += 'bg-transparent text-white';

  const customBgStyle: React.CSSProperties = {};
  if (bgType === 'image' && overlaySettings?.bgImageUrl) {
    customBgStyle.backgroundImage = `url(${overlaySettings.bgImageUrl})`;
    customBgStyle.backgroundSize = 'cover';
    customBgStyle.backgroundPosition = 'center';
  }

  return (
    <div
      className={dynamicBgClass}
      style={customBgStyle}
    >
      {bgType === 'video' && overlaySettings?.bgVideoUrl && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-50 z-0 pointer-events-none"
        >
          <source src={overlaySettings.bgVideoUrl} type="video/mp4" />
        </video>
      )}
      {/* ANIMATION POPUP BANNER (4, 6, WICKET, FREE HIT, POWERPLAY, RESULT) */}
      {overlaySettings.showAnimations && activeEvent && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <div
            className={`px-10 py-5 rounded-2xl shadow-2xl border flex flex-col items-center justify-center backdrop-blur-xl ${
              activeEvent.type === 'WICKET'
                ? 'bg-rose-950/90 border-rose-500 text-white animate-alert-glow'
                : activeEvent.type === 'SIX'
                ? 'bg-amber-950/90 border-amber-400 text-white animate-pulse-glow'
                : activeEvent.type === 'FOUR'
                ? 'bg-emerald-950/90 border-emerald-400 text-white'
                : activeEvent.type === 'FREE_HIT'
                ? 'bg-amber-900/90 border-amber-400 text-amber-200 animate-freehit-glow'
                : 'bg-[#0b1324]/95 border-emerald-500 text-white'
            }`}
          >
            <div className="text-xs uppercase tracking-widest text-emerald-400 font-heading mb-1">
              ITC SPORTS BROADCAST
            </div>
            <div className="text-4xl md:text-6xl font-black font-numbers tracking-widest drop-shadow-md">
              {activeEvent.title}
            </div>
            {activeEvent.subtitle && (
              <div className="text-base md:text-xl font-heading text-slate-200 mt-1 drop-shadow">
                {activeEvent.subtitle}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOP BAR / SPONSOR TICKER IF CONFIGURED FOR TOP */}
      {isTop && (
        <div className="w-full flex justify-center mb-auto">
          <ScorebugComponent
            match={match}
            currentInning={currentInning}
            battingTeam={battingTeam}
            bowlingTeam={bowlingTeam}
            striker={striker}
            nonStriker={nonStriker}
            bowler={bowler}
            crr={crr}
            isSecondInning={isSecondInning}
            targetRuns={targetRuns}
            runsNeeded={runsNeeded}
            ballsRemaining={ballsRemaining}
            rrr={rrr}
            recentDeliveries={recentDeliveries}
            sponsor={database.sponsor}
            overlaySettings={overlaySettings}
          />
        </div>
      )}

      {/* MID SCREEN GRAPHIC OVERLAYS: SQUADS, SUMMARY, SCORECARD, STATS, LOWER THIRDS */}
      {activeGraphicType === 'MINI_BUG' && (
        <div className="m-auto bg-[#080d1a]/95 border border-emerald-500/80 rounded-xl px-6 py-3 shadow-2xl flex items-center gap-4 pointer-events-auto">
          <span className="font-heading font-black text-emerald-400">{battingTeam.shortName}</span>
          <span className="font-numbers text-2xl font-bold text-white">{currentInning.runs}/{currentInning.wickets}</span>
          <span className="text-xs text-slate-400">({currentInning.oversString} ov) - CRR {crr}</span>
        </div>
      )}

      {activeGraphicType === 'CURRENT_PARTNERSHIP' && (
        <div className="m-auto w-full max-w-lg bg-[#080d1a]/95 border-2 border-emerald-500/80 rounded-2xl p-6 shadow-2xl pointer-events-auto">
          <div className="text-xs uppercase font-heading text-emerald-400 mb-1">Current Partnership</div>
          <div className="text-2xl font-black font-heading text-white mb-3">
            {striker?.shortName || 'Batter 1'} & {nonStriker?.shortName || 'Batter 2'}
          </div>
          <div className="flex justify-between items-center bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            <div>
              <div className="text-3xl font-black font-numbers text-emerald-400">
                {currentInning.currentPartnership?.totalRuns || 0} <span className="text-sm font-normal text-slate-400">runs</span>
              </div>
            </div>
            <div>
              <div className="text-xl font-bold font-numbers text-slate-200">
                {currentInning.currentPartnership?.balls || 0} <span className="text-sm font-normal text-slate-400">balls</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeGraphicType === 'TOP_SCORERS' && (
        <div className="m-auto w-full max-w-xl bg-[#080d1a]/95 border-2 border-emerald-500/80 rounded-2xl p-6 shadow-2xl pointer-events-auto">
          <div className="text-xs uppercase font-heading text-emerald-400 mb-2">Top Scorers - {battingTeam.name}</div>
          <div className="space-y-2">
            {currentInning.batters.slice(0, 5).map((b, idx) => (
              <div key={b.playerId} className="flex justify-between items-center bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800">
                <span className="font-bold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center">#{idx+1}</span>
                  {b.playerName}
                </span>
                <span className="font-numbers font-bold text-emerald-400 text-lg">
                  {b.runs} <span className="text-xs text-slate-400 font-sans">({b.balls}b, {b.fours}x4, {b.sixes}x6)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeGraphicType === 'BEST_BOWLERS' && (
        <div className="m-auto w-full max-w-xl bg-[#080d1a]/95 border-2 border-emerald-500/80 rounded-2xl p-6 shadow-2xl pointer-events-auto">
          <div className="text-xs uppercase font-heading text-emerald-400 mb-2">Best Bowlers - {bowlingTeam.name}</div>
          <div className="space-y-2">
            {currentInning.bowlers.slice(0, 5).map((bw, idx) => {
              const ov = `${Math.floor(bw.legalBalls / 6)}.${bw.legalBalls % 6}`;
              return (
                <div key={bw.playerId} className="flex justify-between items-center bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-800">
                  <span className="font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center">#{idx+1}</span>
                    {bw.playerName}
                  </span>
                  <span className="font-numbers font-bold text-emerald-400 text-lg">
                    {bw.wickets}/{bw.runsConceded} <span className="text-xs text-slate-400 font-sans">({ov} ov, Eco {bw.economy.toFixed(1)})</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeGraphicType === 'TEAM_COMPARISON' && (
        <div className="m-auto w-full max-w-2xl bg-[#080d1a]/95 border-2 border-emerald-500/80 rounded-2xl p-6 shadow-2xl pointer-events-auto">
          <div className="text-xs uppercase font-heading text-emerald-400 mb-3 text-center">Team Comparison & Run Rates</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-emerald-500/40 text-center">
              <div className="font-heading font-bold text-white">{match.teamA.name}</div>
              <div className="font-numbers text-3xl font-black text-emerald-400 my-2">
                {match.innings[0] ? `${match.innings[0].runs}/${match.innings[0].wickets}` : '0/0'}
              </div>
              <div className="text-xs text-slate-400">Overs: {match.innings[0]?.oversString || '0.0'}</div>
            </div>
            <div className="bg-slate-900/80 p-4 rounded-xl border border-blue-500/40 text-center">
              <div className="font-heading font-bold text-white">{match.teamB.name}</div>
              <div className="font-numbers text-3xl font-black text-blue-400 my-2">
                {match.innings[1] ? `${match.innings[1].runs}/${match.innings[1].wickets}` : 'Yet to bat'}
              </div>
              <div className="text-xs text-slate-400">Overs: {match.innings[1]?.oversString || '0.0'}</div>
            </div>
          </div>
        </div>
      )}

      {activeGraphicType === 'PLAYER_INTRO' && striker && (
        <div className="m-auto w-full max-w-lg bg-gradient-to-r from-emerald-950 via-[#080d1a] to-slate-950 border-2 border-emerald-400 rounded-2xl p-6 shadow-2xl pointer-events-auto flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-black flex items-center justify-center font-heading font-black text-2xl shadow-lg">
            ⭐
          </div>
          <div>
            <div className="text-xs uppercase font-heading tracking-widest text-emerald-400">Current Batter</div>
            <div className="text-3xl font-black font-heading text-white">{striker.playerName}</div>
            <div className="text-xs text-slate-300 mt-1">Batting Order #{striker.battingOrder}</div>
          </div>
        </div>
      )}

      {activeGraphicType === 'BOWLER_INTRO' && bowler && (
        <div className="m-auto w-full max-w-lg bg-gradient-to-r from-blue-950 via-[#080d1a] to-slate-950 border-2 border-blue-400 rounded-2xl p-6 shadow-2xl pointer-events-auto flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-500 text-white flex items-center justify-center font-heading font-black text-2xl shadow-lg">
            ⚡
          </div>
          <div>
            <div className="text-xs uppercase font-heading tracking-widest text-blue-400">Current Bowler</div>
            <div className="text-3xl font-black font-heading text-white">{bowler.playerName}</div>
            <div className="text-xs text-slate-300 mt-1">Economy: {bowler.economy.toFixed(1)}</div>
          </div>
        </div>
      )}

      {activeGraphicType === 'MATCH_INFO' && (
        <div className="m-auto w-full max-w-xl bg-[#080d1a]/95 border-2 border-emerald-500/80 rounded-2xl p-6 shadow-2xl pointer-events-auto text-center">
          <div className="text-xs uppercase font-heading text-emerald-400 mb-1">{match.tournamentName || 'ITC SPORTS TOURNAMENT'}</div>
          <div className="text-2xl font-black font-heading text-white mb-2">{match.matchName}</div>
          <div className="text-sm text-slate-300">Venue: {match.venue}</div>
          <div className="text-xs text-slate-400 mt-1">Date: {match.date}</div>
        </div>
      )}

      {activeGraphicType === 'RESULT_BANNER' && (
        <div className="m-auto w-full max-w-xl bg-gradient-to-tr from-emerald-950 via-slate-950 to-emerald-900 border-2 border-emerald-400 rounded-2xl p-8 shadow-2xl pointer-events-auto text-center">
          <div className="text-xs uppercase font-heading text-emerald-400 tracking-widest mb-1">OFFICIAL MATCH RESULT</div>
          <div className="text-3xl md:text-4xl font-black font-heading text-white mb-3">
            {match.resultSummary || 'MATCH COMPLETED'}
          </div>
          <div className="text-xs text-slate-300 uppercase tracking-widest">
            {match.tournamentName} • {match.venue}
          </div>
        </div>
      )}

      {activeGraphicType === 'BOTH_SQUADS' && (
        <BroadcastBothSquadsGraphic
          match={match}
          sponsor={database.sponsor}
        />
      )}

      {activeGraphicType === 'TEAM_A_SQUAD' && (
        <BroadcastSingleSquadGraphic
          team={match.teamA}
          playingXI={match.teamAPlayingXI}
          captainId={match.captainTeamAId}
          keeperId={match.wicketKeeperTeamAId}
          match={match}
          sponsor={database.sponsor}
        />
      )}

      {activeGraphicType === 'TEAM_B_SQUAD' && (
        <BroadcastSingleSquadGraphic
          team={match.teamB}
          playingXI={match.teamBPlayingXI}
          captainId={match.captainTeamBId}
          keeperId={match.wicketKeeperTeamBId}
          match={match}
          sponsor={database.sponsor}
        />
      )}

      {activeGraphicType === 'MATCH_SUMMARY' && (
        <BroadcastMatchSummaryGraphic
          match={match}
          sponsor={database.sponsor}
        />
      )}

      {activeGraphicType === 'SCORECARD' && (
        <div className="m-auto w-full max-w-4xl bg-[#080d1a]/95 border-2 border-emerald-500/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl pointer-events-auto">
          <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3 mb-4">
            <div className="flex items-center gap-3">
              <span className="bg-emerald-500 text-black px-2 py-0.5 rounded font-black text-xs font-heading">
                ITC SPORTS
              </span>
              <span className="font-heading font-bold text-xl text-white">
                {currentInning.battingTeamName} • INNINGS SCORECARD
              </span>
            </div>
            <div className="font-numbers text-3xl font-bold text-emerald-400">
              {currentInning.runs}/{currentInning.wickets}
              <span className="text-slate-400 text-lg ml-2 font-heading">({currentInning.oversString} OVERS)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Batting Column */}
            <div>
              <div className="text-xs uppercase tracking-wider text-emerald-400 font-heading mb-2">Batters</div>
              <div className="divide-y divide-slate-800">
                {currentInning.batters.map((b) => (
                  <div key={b.playerId} className="flex justify-between items-center py-1.5 text-sm">
                    <div>
                      <span className="font-semibold text-slate-100">{b.shortName}</span>
                      <span className="text-xs text-slate-400 block">{b.dismissalText || (b.isOut ? 'out' : 'not out')}</span>
                    </div>
                    <div className="flex items-center gap-3 font-numbers text-base">
                      <span className="font-bold text-white text-lg w-8 text-right">{b.runs}</span>
                      <span className="text-slate-400 text-xs font-sans w-12 text-right">({b.balls}b, {b.fours}x4, {b.sixes}x6)</span>
                      <span className="text-emerald-400 text-xs font-sans w-12 text-right">SR {b.strikeRate.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bowling Column & Extras */}
            <div>
              <div className="text-xs uppercase tracking-wider text-emerald-400 font-heading mb-2">Bowlers</div>
              <div className="divide-y divide-slate-800">
                {currentInning.bowlers.map((bw) => {
                  const ovStr = `${Math.floor(bw.legalBalls / 6)}.${bw.legalBalls % 6}`;
                  return (
                    <div key={bw.playerId} className="flex justify-between items-center py-1.5 text-sm">
                      <span className="font-semibold text-slate-100">{bw.shortName}</span>
                      <div className="flex items-center gap-3 font-numbers text-base">
                        <span className="text-slate-300 w-10 text-right">{ovStr} ov</span>
                        <span className="text-slate-400 w-6 text-right">{bw.maidens}m</span>
                        <span className="text-slate-200 w-8 text-right">{bw.runsConceded}r</span>
                        <span className="font-bold text-emerald-400 w-6 text-right">{bw.wickets}w</span>
                        <span className="text-slate-400 text-xs font-sans w-12 text-right">Eco {bw.economy.toFixed(1)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-300">
                <span>
                  Extras: {currentInning.extras.total} (w {currentInning.extras.wides}, nb {currentInning.extras.noBalls}, b {currentInning.extras.byes}, lb {currentInning.extras.legByes})
                </span>
                <span className="font-bold text-emerald-400 font-heading">
                  CRR: {crr.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM SCOREBUG (DEFAULT BROADCAST LOOK) */}
      {!isTop &&
        activeGraphicType !== 'SCORECARD' &&
        activeGraphicType !== 'BOTH_SQUADS' &&
        activeGraphicType !== 'TEAM_A_SQUAD' &&
        activeGraphicType !== 'TEAM_B_SQUAD' &&
        activeGraphicType !== 'MATCH_SUMMARY' && (
        <div className="w-full flex justify-center mt-auto">
          <ScorebugComponent
            match={match}
            currentInning={currentInning}
            battingTeam={battingTeam}
            bowlingTeam={bowlingTeam}
            striker={striker}
            nonStriker={nonStriker}
            bowler={bowler}
            crr={crr}
            isSecondInning={isSecondInning}
            targetRuns={targetRuns}
            runsNeeded={runsNeeded}
            ballsRemaining={ballsRemaining}
            rrr={rrr}
            recentDeliveries={recentDeliveries}
            sponsor={database.sponsor}
            overlaySettings={overlaySettings}
          />
        </div>
      )}
    </div>
  );
}

interface ScorebugProps {
  match: Match;
  currentInning: InningsState;
  battingTeam: any;
  bowlingTeam: any;
  striker: any;
  nonStriker: any;
  bowler: any;
  crr: number;
  isSecondInning: boolean;
  targetRuns: number;
  runsNeeded: number;
  ballsRemaining: number;
  rrr: number;
  recentDeliveries: any[];
  sponsor: any;
  overlaySettings: any;
}

function ScorebugComponent({
  match,
  currentInning,
  battingTeam,
  striker,
  nonStriker,
  bowler,
  crr,
  isSecondInning,
  targetRuns,
  runsNeeded,
  ballsRemaining,
  rrr,
  recentDeliveries,
  sponsor,
  overlaySettings,
}: ScorebugProps) {
  const bowlerOversStr = bowler
    ? `${Math.floor(bowler.legalBalls / 6)}.${bowler.legalBalls % 6}`
    : '0.0';

  const theme = (overlaySettings?.theme || 'itc_premium') as string;
  const themeMap: Record<string, { border: string; badge: string; text: string; bg: string }> = {
    itc_premium: { border: 'border-emerald-500/80', badge: 'bg-emerald-500 text-black font-black', text: 'text-emerald-400', bg: 'bg-[#050811]/95' },
    itc_gold: { border: 'border-amber-400/90', badge: 'bg-amber-500 text-black font-black', text: 'text-amber-400', bg: 'bg-[#0a0a0c]/95' },
    itc_neon: { border: 'border-cyan-400/90', badge: 'bg-cyan-500 text-black font-black', text: 'text-cyan-400', bg: 'bg-[#020617]/95' },
    emerald_pro: { border: 'border-emerald-500/80', badge: 'bg-emerald-500 text-black', text: 'text-emerald-400', bg: 'bg-[#070b14]/95' },
    royal_blue: { border: 'border-blue-500/80', badge: 'bg-blue-500 text-white', text: 'text-blue-400', bg: 'bg-[#091026]/95' },
    neon_gold: { border: 'border-amber-400/80', badge: 'bg-amber-400 text-black', text: 'text-amber-300', bg: 'bg-[#141208]/95' },
  };
  const themeStyles = themeMap[theme] || themeMap['itc_premium'];

  const chassisStyle: React.CSSProperties = {};
  if (theme === 'custom') {
    if (overlaySettings?.customBg) chassisStyle.backgroundColor = overlaySettings.customBg;
    if (overlaySettings?.customBorder) chassisStyle.borderColor = overlaySettings.customBorder;
    if (overlaySettings?.customText) chassisStyle.color = overlaySettings.customText;
  }

  return (
    <div className="flex flex-col items-center w-full max-w-5xl transition-all">
      {/* SPECIAL BADGES BAR: FREE HIT, POWERPLAY, TARGET */}
      <div className="flex items-center gap-2 mb-1">
        {currentInning.freeHitActive && (
          <div className="bg-amber-500 text-black px-3 py-0.5 rounded font-black font-heading text-xs tracking-wider uppercase animate-freehit-glow shadow-lg flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-black animate-ping" />
            FREE HIT
          </div>
        )}

        {currentInning.powerplayActive && (
          <div className="bg-emerald-500 text-black px-3 py-0.5 rounded font-bold font-heading text-xs tracking-wider uppercase shadow-md">
            POWERPLAY ({match.settings.powerplayOvers.start}-{match.settings.powerplayOvers.end})
          </div>
        )}

        {isSecondInning && (
          <div className="bg-[#0b1324]/90 border border-slate-700 text-slate-200 px-3 py-0.5 rounded font-heading text-xs shadow-md flex items-center gap-2">
            <span>
              TARGET: <strong className={`${themeStyles.text} font-numbers text-sm`}>{targetRuns}</strong>
            </span>
            <span className="text-slate-500">•</span>
            <span>
              NEED: <strong className="text-amber-400 font-numbers text-sm">{runsNeeded}</strong> OFF{' '}
              <strong className="text-white font-numbers text-sm">{ballsRemaining}</strong> BALLS
            </span>
            <span className="text-slate-500">•</span>
            <span>
              RRR: <strong className={`${themeStyles.text} font-numbers text-sm`}>{rrr.toFixed(2)}</strong>
            </span>
          </div>
        )}

        {match.isMatchCompleted && match.resultSummary && (
          <div className="bg-emerald-600 text-white px-4 py-0.5 rounded font-black font-heading text-xs tracking-wider uppercase shadow-xl animate-pulse">
            {match.resultSummary}
          </div>
        )}
      </div>

      {/* MAIN SCOREBUG CHASSIS */}
      <div
        style={chassisStyle}
        className={`w-full ${theme === 'custom' ? 'bg-slate-900/95' : themeStyles.bg} border-2 ${theme === 'custom' ? '' : themeStyles.border} rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-stretch divide-y md:divide-y-0 md:divide-x divide-slate-800`}
      >
        {/* BRAND & TEAM SECTION */}
        <div className="flex items-center px-4 py-2 bg-gradient-to-r from-[#03060c] to-[#0a101f] gap-3">
          {/* Broadcaster Logo Badge */}
          <div className={`flex flex-col items-center justify-center ${themeStyles.badge} px-2.5 py-1 rounded font-heading font-black leading-none`}>
            <span className="text-[10px] tracking-tight">ITC</span>
            <span className="text-[8px] tracking-widest font-sans font-bold">SPORTS</span>
          </div>

          {/* Team Logo & Short Name */}
          <div className="flex items-center gap-2">
            {battingTeam?.logoUrl ? (
              <img
                src={battingTeam.logoUrl}
                alt={battingTeam.shortName}
                className="w-9 h-9 object-contain rounded-md bg-black/40 p-0.5 border border-slate-700"
              />
            ) : (
              <div className={`w-9 h-9 rounded-md bg-emerald-950 border ${themeStyles.border} flex items-center justify-center font-heading font-bold ${themeStyles.text} text-xs`}>
                {battingTeam?.shortName || 'BAT'}
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-heading font-black text-xl text-white tracking-wider leading-none">
                {battingTeam?.shortName || battingTeam?.name || 'TEAM'}
              </span>
              <span className={`text-[10px] font-heading ${themeStyles.text} tracking-wider uppercase mt-0.5`}>
                {match.tournamentName || 'LIVE CRICKET'}
              </span>
            </div>
          </div>
        </div>

        {/* SCORE & OVERS DISPLAY (CRITICAL: NEVER SHOW BALL COUNT, ONLY OVERS) */}
        <div className="flex items-center px-5 py-2 bg-[#060a12] gap-4">
          <div className="flex items-baseline gap-1">
            <span className="font-numbers text-4xl md:text-5xl font-black text-white tracking-tight leading-none drop-shadow">
              {currentInning.runs}
            </span>
            <span className="font-numbers text-3xl font-bold text-emerald-400 leading-none">
              /{currentInning.wickets}
            </span>
          </div>

          <div className="flex flex-col justify-center border-l border-slate-800 pl-3">
            <div className="flex items-center gap-1 font-heading text-sm font-bold text-slate-200">
              <span className="font-numbers text-xl text-emerald-400 font-black">{currentInning.oversString}</span>
              <span className="text-xs text-slate-400 tracking-wider">OVERS</span>
            </div>
            <div className="text-[10px] text-slate-400 font-heading tracking-wide">
              CRR: <strong className="text-slate-200">{crr.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* BATTERS SECTION */}
        <div className="flex-1 flex items-center justify-around px-4 py-2 bg-[#080d19] gap-4 min-w-[260px]">
          {/* Striker */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-400 text-xs font-bold animate-pulse">▶</span>
              <span className="font-heading font-bold text-sm text-white tracking-wide">
                {striker?.shortName || 'Striker'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-numbers text-xl font-bold text-emerald-300 leading-none">
                {striker?.runs ?? 0}
              </span>
              <span className="text-[11px] text-slate-400 font-sans">
                ({striker?.balls ?? 0}b • {striker?.fours ?? 0}x4 {striker?.sixes ?? 0}x6)
              </span>
            </div>
          </div>

          {/* Non-Striker */}
          <div className="flex flex-col border-l border-slate-800/80 pl-4">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-xs">○</span>
              <span className="font-heading font-medium text-sm text-slate-300 tracking-wide">
                {nonStriker?.shortName || 'Non-Striker'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-numbers text-lg font-semibold text-slate-300 leading-none">
                {nonStriker?.runs ?? 0}
              </span>
              <span className="text-[11px] text-slate-500 font-sans">
                ({nonStriker?.balls ?? 0}b)
              </span>
            </div>
          </div>
        </div>

        {/* BOWLER SECTION & THIS OVER BALLS */}
        <div className="flex items-center px-4 py-2 bg-[#090f1e] gap-3">
          <div className="flex flex-col">
            <div className="text-[10px] text-emerald-400 uppercase font-heading tracking-wider">
              BOWLING
            </div>
            <div className="font-heading font-bold text-sm text-white leading-tight">
              {bowler?.shortName || 'Bowler'}
            </div>
            <div className="flex items-center gap-1.5 font-numbers text-xs text-slate-300 mt-0.5">
              <span>{bowlerOversStr} ov</span>
              <span className="text-slate-500">•</span>
              <span className="font-bold text-emerald-400">{bowler?.wickets ?? 0}-{bowler?.runsConceded ?? 0}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 text-[10px] font-sans">Eco {(bowler?.economy ?? 0).toFixed(1)}</span>
            </div>
          </div>

          {/* This over sequence */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
            {recentDeliveries.length === 0 ? (
              <span className="text-[10px] text-slate-500 font-heading">START OVER</span>
            ) : (
              recentDeliveries.map((d) => {
                let badgeClass = 'bg-slate-800 text-slate-200 border-slate-700';
                let label = `${d.totalDeliveryRuns}`;

                if (d.isWicket) {
                  badgeClass = 'bg-rose-600 text-white border-rose-500 font-bold';
                  label = 'W';
                } else if (d.isSix) {
                  badgeClass = 'bg-amber-500 text-black font-black border-amber-400';
                  label = '6';
                } else if (d.isFour) {
                  badgeClass = 'bg-emerald-500 text-black font-bold border-emerald-400';
                  label = '4';
                } else if (d.extraType === 'WIDE') {
                  badgeClass = 'bg-purple-900/80 text-purple-200 border-purple-600';
                  label = d.extraRuns > 1 ? `${d.extraRuns}wd` : 'wd';
                } else if (d.extraType === 'NO_BALL') {
                  badgeClass = 'bg-orange-900/80 text-orange-200 border-orange-500';
                  label = d.batterRuns > 0 ? `${d.batterRuns}nb` : (d.extraRuns > 1 ? `${d.extraRuns}nb` : 'nb');
                } else if (d.batterRuns === 0 && !d.extraType) {
                  badgeClass = 'bg-slate-900 text-slate-400 border-slate-800';
                  label = '•';
                }

                return (
                  <div
                    key={d.id}
                    className={`w-6 h-6 rounded flex items-center justify-center text-xs font-numbers border ${badgeClass}`}
                  >
                    {label}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SPONSOR SECTION (OPTIONAL) */}
        {overlaySettings.showSponsor && sponsor?.enabled && (
          <div className="flex items-center px-3 py-1.5 bg-[#04070e] gap-2 border-l border-slate-800">
            {sponsor.logoUrl ? (
              <img src={sponsor.logoUrl} alt="Sponsor" className="h-6 object-contain max-w-[80px]" />
            ) : (
              <div className="flex flex-col text-right">
                <span className="text-[9px] text-slate-500 uppercase font-heading tracking-widest leading-none">
                  SPONSOR
                </span>
                <span className="text-xs font-bold text-emerald-400 font-heading leading-tight truncate max-w-[120px]">
                  {sponsor.name || 'ITC BROADCAST'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

{/* BROADCAST GRAPHIC: BOTH TEAMS SQUADS / PLAYING XI */}
interface BroadcastBothSquadsGraphicProps {
  match: Match;
  sponsor: any;
}

function BroadcastBothSquadsGraphic({ match, sponsor }: BroadcastBothSquadsGraphicProps) {
  const tossWinner = match.tossWinnerTeamId === match.teamA.id ? match.teamA : match.teamB;

  return (
    <div className="m-auto w-full max-w-5xl bg-[#060a14]/95 border-2 border-emerald-500/80 rounded-2xl p-5 md:p-6 shadow-2xl backdrop-blur-2xl pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-emerald-500/30 pb-3 mb-4 gap-2">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 text-black px-3 py-1 rounded font-black text-xs font-heading tracking-wider shadow-md">
            ITC SPORTS
          </div>
          <div>
            <div className="text-[11px] font-heading font-bold text-emerald-400 uppercase tracking-widest">
              OFFICIAL PLAYING XI • BOTH TEAMS SQUAD
            </div>
            <h2 className="text-xl md:text-2xl font-black font-heading text-white">
              {match.teamA.name} VS {match.teamB.name}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-xs font-heading text-slate-300">
              {match.tournamentName} • {match.venue}
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-heading">
              {match.settings.format} • {match.settings.totalOvers} OVERS MATCH
            </div>
          </div>
        </div>
      </div>

      {/* TOSS BANNER */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border border-emerald-500/40 rounded-xl px-4 py-2 mb-4 flex items-center justify-between shadow-inner">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-amber-400 font-heading font-black">🪙 TOSS UPDATE:</span>
          <span className="text-white font-semibold">
            {tossWinner.name} won the toss and elected to <strong className="text-emerald-400 uppercase">{match.tossDecision}</strong>
          </span>
        </div>
        <span className="text-[10px] font-heading text-slate-400 uppercase tracking-wider hidden sm:inline">
          Live Broadcast Graphics
        </span>
      </div>

      {/* 2-COLUMN SQUAD SPLIT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* TEAM A */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
            <div className="flex items-center gap-2.5">
              {match.teamA.logoUrl ? (
                <img
                  src={match.teamA.logoUrl}
                  alt={match.teamA.shortName}
                  className="w-8 h-8 object-contain rounded-lg p-0.5 bg-black/60 border border-slate-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-heading font-black text-xs flex items-center justify-center">
                  {match.teamA.shortName.slice(0, 3)}
                </div>
              )}
              <div>
                <h3 className="font-heading font-black text-sm text-white">{match.teamA.name}</h3>
                <span className="text-[10px] text-emerald-400 font-heading tracking-wider">
                  PLAYING XI ({match.teamAPlayingXI.length})
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-800 rounded text-slate-300">
              {match.teamA.shortName}
            </span>
          </div>

          <div className="space-y-1">
            {match.teamAPlayingXI.map((player, idx) => {
              const isCaptain = match.captainTeamAId === player.id || player.isCaptain;
              const isKeeper = match.wicketKeeperTeamAId === player.id || player.isWicketKeeper;
              return (
                <div
                  key={player.id || idx}
                  className="flex items-center justify-between px-2.5 py-1.5 bg-slate-950/60 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4 font-mono text-[11px] text-slate-500 font-bold">{idx + 1}.</span>
                    <span className="font-bold text-slate-100">{player.name}</span>
                    {isCaptain && (
                      <span className="px-1.5 py-0.2 bg-amber-500 text-black rounded font-black font-heading text-[9px]">
                        (C)
                      </span>
                    )}
                    {isKeeper && (
                      <span className="px-1.5 py-0.2 bg-cyan-500 text-black rounded font-black font-heading text-[9px]">
                        (WK)
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-heading uppercase text-slate-400 tracking-wider">
                    {player.role || 'Player'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* TEAM B */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
            <div className="flex items-center gap-2.5">
              {match.teamB.logoUrl ? (
                <img
                  src={match.teamB.logoUrl}
                  alt={match.teamB.shortName}
                  className="w-8 h-8 object-contain rounded-lg p-0.5 bg-black/60 border border-slate-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 font-heading font-black text-xs flex items-center justify-center">
                  {match.teamB.shortName.slice(0, 3)}
                </div>
              )}
              <div>
                <h3 className="font-heading font-black text-sm text-white">{match.teamB.name}</h3>
                <span className="text-[10px] text-cyan-400 font-heading tracking-wider">
                  PLAYING XI ({match.teamBPlayingXI.length})
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-800 rounded text-slate-300">
              {match.teamB.shortName}
            </span>
          </div>

          <div className="space-y-1">
            {match.teamBPlayingXI.map((player, idx) => {
              const isCaptain = match.captainTeamBId === player.id || player.isCaptain;
              const isKeeper = match.wicketKeeperTeamBId === player.id || player.isWicketKeeper;
              return (
                <div
                  key={player.id || idx}
                  className="flex items-center justify-between px-2.5 py-1.5 bg-slate-950/60 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4 font-mono text-[11px] text-slate-500 font-bold">{idx + 1}.</span>
                    <span className="font-bold text-slate-100">{player.name}</span>
                    {isCaptain && (
                      <span className="px-1.5 py-0.2 bg-amber-500 text-black rounded font-black font-heading text-[9px]">
                        (C)
                      </span>
                    )}
                    {isKeeper && (
                      <span className="px-1.5 py-0.2 bg-cyan-500 text-black rounded font-black font-heading text-[9px]">
                        (WK)
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-heading uppercase text-slate-400 tracking-wider">
                    {player.role || 'Player'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      {sponsor?.enabled && sponsor?.name && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="text-emerald-400 font-heading uppercase tracking-wider text-[11px]">
            ITC SPORTS BROADCAST ENGINE
          </span>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 uppercase tracking-widest text-[10px]">SPONSORED BY:</span>
            <strong className="text-white font-heading">{sponsor.name}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

{/* BROADCAST GRAPHIC: SINGLE TEAM SQUAD */}
interface BroadcastSingleSquadGraphicProps {
  team: any;
  playingXI: any[];
  captainId?: string;
  keeperId?: string;
  match: Match;
  sponsor: any;
}

function BroadcastSingleSquadGraphic({
  team,
  playingXI,
  captainId,
  keeperId,
  match,
  sponsor,
}: BroadcastSingleSquadGraphicProps) {
  return (
    <div className="m-auto w-full max-w-2xl bg-[#060a14]/95 border-2 border-emerald-500/80 rounded-2xl p-6 shadow-2xl backdrop-blur-2xl pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3 mb-4">
        <div className="flex items-center gap-3">
          {team.logoUrl ? (
            <img
              src={team.logoUrl}
              alt={team.shortName}
              className="w-12 h-12 object-contain rounded-xl p-1 bg-black/60 border border-slate-700"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 font-heading font-black text-base flex items-center justify-center">
              {team.shortName.slice(0, 3)}
            </div>
          )}
          <div>
            <span className="bg-emerald-500 text-black px-2 py-0.5 rounded font-black text-[10px] font-heading">
              ITC SPORTS
            </span>
            <h2 className="text-2xl font-black font-heading text-white">{team.name}</h2>
            <div className="text-xs text-emerald-400 font-heading tracking-wider">
              OFFICIAL PLAYING XI ({playingXI.length} PLAYERS)
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono font-bold px-3 py-1 bg-slate-800 rounded-lg text-slate-200 block mb-1">
            {team.shortName}
          </span>
          <span className="text-[10px] text-slate-400 font-heading block">{match.tournamentName}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {playingXI.map((player, idx) => {
          const isCaptain = captainId === player.id || player.isCaptain;
          const isKeeper = keeperId === player.id || player.isWicketKeeper;
          return (
            <div
              key={player.id || idx}
              className="flex items-center justify-between px-3 py-2 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 font-mono text-[11px] text-slate-500 font-bold">{idx + 1}.</span>
                <span className="font-bold text-slate-100">{player.name}</span>
                {isCaptain && (
                  <span className="px-1.5 py-0.2 bg-amber-500 text-black rounded font-black font-heading text-[9px]">
                    (C)
                  </span>
                )}
                {isKeeper && (
                  <span className="px-1.5 py-0.2 bg-cyan-500 text-black rounded font-black font-heading text-[9px]">
                    (WK)
                  </span>
                )}
              </div>
              <span className="text-[10px] font-heading uppercase text-slate-400 tracking-wider">
                {player.role || 'Player'}
              </span>
            </div>
          );
        })}
      </div>

      {sponsor?.enabled && sponsor?.name && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="text-slate-500 uppercase tracking-widest text-[10px]">SPONSORED BY:</span>
          <strong className="text-emerald-400 font-heading">{sponsor.name}</strong>
        </div>
      )}
    </div>
  );
}

{/* BROADCAST GRAPHIC: MATCH / INNINGS SUMMARY ("SUMMER") */}
interface BroadcastMatchSummaryGraphicProps {
  match: Match;
  sponsor: any;
}

function BroadcastMatchSummaryGraphic({ match, sponsor }: BroadcastMatchSummaryGraphicProps) {
  const firstInning = match.innings[0];
  const secondInning = match.innings[1];
  const currentInning = match.innings[match.currentInningIndex];

  const isSecond = match.currentInningIndex === 1 && firstInning;
  const target = isSecond ? firstInning.runs + 1 : 0;
  const needRuns = isSecond && currentInning ? Math.max(0, target - currentInning.runs) : 0;
  const ballsLeft = isSecond && currentInning ? Math.max(0, match.settings.totalOvers * 6 - currentInning.legalBalls) : 0;
  const rrr = isSecond && ballsLeft > 0 ? Number(((needRuns / (ballsLeft / 6))).toFixed(2)) : 0;

  // Helper to extract top 3 batters for an inning
  const getTopBatters = (inning?: any) => {
    if (!inning?.batters) return [];
    return inning.batters
      .slice()
      .sort((a: any, b: any) => b.runs - a.runs)
      .slice(0, 3);
  };

  // Helper to extract top 2 bowlers for an inning
  const getTopBowlers = (inning?: any) => {
    if (!inning?.bowlers) return [];
    return inning.bowlers
      .slice()
      .sort((a: any, b: any) => b.wickets - a.wickets || a.runsConceded - b.runsConceded)
      .slice(0, 2);
  };

  const firstBatters = getTopBatters(firstInning);
  const firstBowlers = getTopBowlers(firstInning);
  const secondBatters = getTopBatters(secondInning);
  const secondBowlers = getTopBowlers(secondInning);

  return (
    <div className="m-auto w-full max-w-4xl bg-[#060a14]/95 border-2 border-emerald-500/80 rounded-2xl p-5 md:p-6 shadow-2xl backdrop-blur-2xl pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 text-black px-3 py-1 rounded font-black text-xs font-heading tracking-wider shadow-md">
            ITC SPORTS
          </div>
          <div>
            <div className="text-[11px] font-heading font-bold text-emerald-400 uppercase tracking-widest">
              OFFICIAL BROADCAST SUMMARY
            </div>
            <h2 className="text-xl md:text-2xl font-black font-heading text-white">
              MATCH / INNINGS SUMMARY
            </h2>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-heading text-slate-300">
            {match.tournamentName}
          </div>
          <div className="text-[10px] text-slate-400 uppercase font-heading">
            {match.venue} • {match.settings.totalOvers} OVERS
          </div>
        </div>
      </div>

      {/* MATCH RESULT OR IN-PROGRESS STATUS ALERT BANNER */}
      {match.isMatchCompleted ? (
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 border-2 border-emerald-400 rounded-xl p-3 mb-4 text-center shadow-lg">
          <span className="text-[10px] font-heading uppercase tracking-widest text-emerald-300 font-bold block">
            MATCH COMPLETED • OFFICIAL RESULT
          </span>
          <div className="text-xl md:text-2xl font-black font-heading text-white">
            🏆 {match.resultSummary || 'MATCH FINISHED'}
          </div>
        </div>
      ) : isSecond && currentInning ? (
        <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 border border-amber-400 rounded-xl p-3 mb-4 flex items-center justify-between text-xs shadow-lg">
          <div>
            <span className="text-amber-300 font-heading font-bold uppercase tracking-wider block">
              2ND INNINGS IN PROGRESS • CHASE
            </span>
            <div className="text-base font-black font-heading text-white">
              Target: {target} runs • Need {needRuns} runs in {ballsLeft} balls
            </div>
          </div>
          <div className="text-right font-numbers">
            <div className="text-amber-300 font-bold text-sm">RRR: {rrr}</div>
            <div className="text-slate-300 text-[11px]">CRR: {calculateRunRate(currentInning.runs, currentInning.legalBalls).toFixed(2)}</div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 mb-4 text-center text-xs text-slate-300">
          <span className="text-emerald-400 font-heading font-bold">1ST INNINGS IN PROGRESS</span> • {match.teamA.name} vs {match.teamB.name}
        </div>
      )}

      {/* 2 INNINGS SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* INNINGS 1 */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              {match.teamA.logoUrl && (
                <img src={match.teamA.logoUrl} alt={match.teamA.shortName} className="w-6 h-6 object-contain" />
              )}
              <h3 className="font-heading font-bold text-sm text-white">{match.teamA.name}</h3>
            </div>
            <div className="font-numbers text-xl font-black text-emerald-400">
              {firstInning ? `${firstInning.runs}/${firstInning.wickets}` : '0/0'}
              <span className="text-xs text-slate-400 ml-1 font-heading">
                ({firstInning ? firstInning.oversString : '0.0'} ov)
              </span>
            </div>
          </div>

          {/* Top Batters */}
          <div className="mb-3">
            <div className="text-[10px] uppercase font-heading text-slate-400 tracking-wider mb-1">
              Top Batters
            </div>
            <div className="space-y-1">
              {firstBatters.length > 0 ? (
                firstBatters.map((b: any) => (
                  <div key={b.playerId} className="flex justify-between items-center text-xs py-0.5">
                    <span className="font-semibold text-slate-200">{b.shortName}</span>
                    <span className="font-numbers font-bold text-white">
                      {b.runs}{' '}
                      <span className="text-slate-400 text-[11px] font-normal">({b.balls}b, {b.fours}x4, {b.sixes}x6)</span>
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-[11px] text-slate-500 italic">No batting data</div>
              )}
            </div>
          </div>

          {/* Top Bowlers */}
          <div>
            <div className="text-[10px] uppercase font-heading text-slate-400 tracking-wider mb-1">
              Top Bowlers
            </div>
            <div className="space-y-1">
              {firstBowlers.length > 0 ? (
                firstBowlers.map((bw: any) => {
                  const ovStr = `${Math.floor(bw.legalBalls / 6)}.${bw.legalBalls % 6}`;
                  return (
                    <div key={bw.playerId} className="flex justify-between items-center text-xs py-0.5">
                      <span className="font-semibold text-slate-200">{bw.shortName}</span>
                      <span className="font-numbers font-bold text-emerald-400">
                        {bw.wickets}/{bw.runsConceded}{' '}
                        <span className="text-slate-400 text-[11px] font-normal">({ovStr} ov)</span>
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-[11px] text-slate-500 italic">No bowling data</div>
              )}
            </div>
          </div>
        </div>

        {/* INNINGS 2 */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              {match.teamB.logoUrl && (
                <img src={match.teamB.logoUrl} alt={match.teamB.shortName} className="w-6 h-6 object-contain" />
              )}
              <h3 className="font-heading font-bold text-sm text-white">{match.teamB.name}</h3>
            </div>
            <div className="font-numbers text-xl font-black text-emerald-400">
              {secondInning ? `${secondInning.runs}/${secondInning.wickets}` : 'Yet to Bat'}
              {secondInning && (
                <span className="text-xs text-slate-400 ml-1 font-heading">
                  ({secondInning.oversString} ov)
                </span>
              )}
            </div>
          </div>

          {/* Top Batters */}
          <div className="mb-3">
            <div className="text-[10px] uppercase font-heading text-slate-400 tracking-wider mb-1">
              Top Batters
            </div>
            <div className="space-y-1">
              {secondBatters.length > 0 ? (
                secondBatters.map((b: any) => (
                  <div key={b.playerId} className="flex justify-between items-center text-xs py-0.5">
                    <span className="font-semibold text-slate-200">{b.shortName}</span>
                    <span className="font-numbers font-bold text-white">
                      {b.runs}{' '}
                      <span className="text-slate-400 text-[11px] font-normal">({b.balls}b, {b.fours}x4, {b.sixes}x6)</span>
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-[11px] text-slate-500 italic">
                  {secondInning ? 'Batting underway' : 'Innings yet to begin'}
                </div>
              )}
            </div>
          </div>

          {/* Top Bowlers */}
          <div>
            <div className="text-[10px] uppercase font-heading text-slate-400 tracking-wider mb-1">
              Top Bowlers
            </div>
            <div className="space-y-1">
              {secondBowlers.length > 0 ? (
                secondBowlers.map((bw: any) => {
                  const ovStr = `${Math.floor(bw.legalBalls / 6)}.${bw.legalBalls % 6}`;
                  return (
                    <div key={bw.playerId} className="flex justify-between items-center text-xs py-0.5">
                      <span className="font-semibold text-slate-200">{bw.shortName}</span>
                      <span className="font-numbers font-bold text-emerald-400">
                        {bw.wickets}/{bw.runsConceded}{' '}
                        <span className="text-slate-400 text-[11px] font-normal">({ovStr} ov)</span>
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-[11px] text-slate-500 italic">
                  {secondInning ? 'Bowling underway' : 'Innings yet to begin'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      {sponsor?.enabled && sponsor?.name && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="text-emerald-400 font-heading uppercase tracking-wider text-[11px]">
            ITC SPORTS REAL-TIME BROADCAST ENGINE
          </span>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 uppercase tracking-widest text-[10px]">OFFICIAL SPONSOR:</span>
            <strong className="text-white font-heading">{sponsor.name}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
