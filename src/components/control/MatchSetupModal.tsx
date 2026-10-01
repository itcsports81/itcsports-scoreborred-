import React, { useState } from 'react';
import { Match, Team, Player, MatchFormat, TossDecision, InningsState } from '../../types/cricket.js';
import { liveSync } from '../../services/liveSync.js';

interface MatchSetupModalProps {
  isOpen: boolean;
  teams: Team[];
  players: Player[];
  onClose: () => void;
  onMatchCreated: (match: Match) => void;
}

export function MatchSetupModal({ isOpen, teams, players, onClose, onMatchCreated }: MatchSetupModalProps) {
  if (!isOpen) return null;

  const [format, setFormat] = useState<MatchFormat>('T20');
  const [totalOvers, setTotalOvers] = useState<number>(20);
  const [maxOversPerBowler, setMaxOversPerBowler] = useState<number>(4);
  const [powerplayStart, setPowerplayStart] = useState<number>(1);
  const [powerplayEnd, setPowerplayEnd] = useState<number>(6);

  const [matchName, setMatchName] = useState<string>('Match 1');
  const [tournamentName, setTournamentName] = useState<string>('ITC Sports Championship');
  const [venue, setVenue] = useState<string>('ITC Stadium');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Selected Teams
  const [teamAId, setTeamAId] = useState<string>(teams[0]?.id || '');
  const [teamBId, setTeamBId] = useState<string>(teams[1]?.id || teams[0]?.id || '');

  // Toss
  const [tossWinnerTeamId, setTossWinnerTeamId] = useState<string>(teams[0]?.id || '');
  const [tossDecision, setTossDecision] = useState<TossDecision>('BAT');

  // Handle format change helper
  const handleFormatChange = (fmt: MatchFormat) => {
    setFormat(fmt);
    if (fmt === 'T10') {
      setTotalOvers(10);
      setMaxOversPerBowler(2);
      setPowerplayStart(1);
      setPowerplayEnd(3);
    } else if (fmt === 'T20') {
      setTotalOvers(20);
      setMaxOversPerBowler(4);
      setPowerplayStart(1);
      setPowerplayEnd(6);
    } else if (fmt === 'ODI') {
      setTotalOvers(50);
      setMaxOversPerBowler(10);
      setPowerplayStart(1);
      setPowerplayEnd(10);
    }
  };

  const selectedTeamA = teams.find((t) => t.id === teamAId) || teams[0];
  const selectedTeamB = teams.find((t) => t.id === teamBId) || teams[1] || teams[0];

  const teamAPlayers = players.filter((p) => p.teamId === selectedTeamA?.id);
  const teamBPlayers = players.filter((p) => p.teamId === selectedTeamB?.id);

  // If squad has fewer than 11, fallback to generic players
  const getInitialXI = (squad: Player[], teamPrefix: string) => {
    if (squad.length >= 11) return squad.slice(0, 11);
    const existing = [...squad];
    for (let i = squad.length + 1; i <= 11; i++) {
      existing.push({
        id: `p-${teamPrefix}-${i}-${Date.now()}`,
        name: `Player ${i}`,
        shortName: `P. ${i}`,
        jerseyNumber: i,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    return existing;
  };

  const [teamAPlayingXI, setTeamAPlayingXI] = useState<Player[]>(getInitialXI(teamAPlayers, 'a'));
  const [teamBPlayingXI, setTeamBPlayingXI] = useState<Player[]>(getInitialXI(teamBPlayers, 'b'));

  const [strikerId, setStrikerId] = useState<string>('');
  const [nonStrikerId, setNonStrikerId] = useState<string>('');
  const [openingBowlerId, setOpeningBowlerId] = useState<string>('');

  // Update XI when team selects change
  const handleSelectTeamA = (id: string) => {
    setTeamAId(id);
    const squad = players.filter((p) => p.teamId === id);
    setTeamAPlayingXI(getInitialXI(squad, 'a'));
  };

  const handleSelectTeamB = (id: string) => {
    setTeamBId(id);
    const squad = players.filter((p) => p.teamId === id);
    setTeamBPlayingXI(getInitialXI(squad, 'b'));
  };

  // Determine who bats first based on toss
  const isTeamABattingFirst =
    (tossWinnerTeamId === selectedTeamA?.id && tossDecision === 'BAT') ||
    (tossWinnerTeamId === selectedTeamB?.id && tossDecision === 'BOWL');

  const battingXI = isTeamABattingFirst ? teamAPlayingXI : teamBPlayingXI;
  const bowlingXI = isTeamABattingFirst ? teamBPlayingXI : teamAPlayingXI;
  const battingTeam = isTeamABattingFirst ? selectedTeamA : selectedTeamB;
  const bowlingTeam = isTeamABattingFirst ? selectedTeamB : selectedTeamA;

  const currentStriker = battingXI.find((p) => p.id === strikerId) || battingXI[0];
  const currentNonStriker = battingXI.find((p) => p.id === nonStrikerId) || battingXI[1];
  const currentOpeningBowler = bowlingXI.find((p) => p.id === openingBowlerId) || bowlingXI[0];

  const handleCreateMatch = async () => {
    if (!selectedTeamA || !selectedTeamB) {
      alert('Please select both teams');
      return;
    }
    if (selectedTeamA.id === selectedTeamB.id) {
      alert('Please select two distinct teams');
      return;
    }

    const firstInning: InningsState = {
      inningIndex: 0,
      battingTeamId: battingTeam.id,
      battingTeamName: battingTeam.name,
      bowlingTeamId: bowlingTeam.id,
      bowlingTeamName: bowlingTeam.name,
      runs: 0,
      wickets: 0,
      legalBalls: 0,
      oversString: '0.0',
      currentOverLegalBalls: 0,
      isCompleted: false,
      strikerId: currentStriker.id,
      nonStrikerId: currentNonStriker.id,
      currentBowlerId: currentOpeningBowler.id,
      batters: [
        {
          playerId: currentStriker.id,
          playerName: currentStriker.name,
          shortName: currentStriker.shortName || currentStriker.name,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          isOut: false,
          battingOrder: 1,
          strikeRate: 0,
        },
        {
          playerId: currentNonStriker.id,
          playerName: currentNonStriker.name,
          shortName: currentNonStriker.shortName || currentNonStriker.name,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          isOut: false,
          battingOrder: 2,
          strikeRate: 0,
        },
      ],
      bowlers: [
        {
          playerId: currentOpeningBowler.id,
          playerName: currentOpeningBowler.name,
          shortName: currentOpeningBowler.shortName || currentOpeningBowler.name,
          legalBalls: 0,
          maidens: 0,
          runsConceded: 0,
          wickets: 0,
          wides: 0,
          noBalls: 0,
          economy: 0,
        },
      ],
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0, total: 0 },
      fallOfWickets: [],
      partnerships: [],
      currentPartnership: {
        batter1Id: currentStriker.id,
        batter1Name: currentStriker.name,
        batter1Runs: 0,
        batter2Id: currentNonStriker.id,
        batter2Name: currentNonStriker.name,
        batter2Runs: 0,
        totalRuns: 0,
        balls: 0,
        isActive: true,
      },
      overs: [],
      deliveries: [],
      freeHitActive: false,
      powerplayActive: true,
    };

    const newMatch: Match = {
      id: `match-${Date.now()}`,
      matchName: matchName.trim() || 'Live Match',
      tournamentName: tournamentName.trim() || 'ITC Championship',
      venue: venue.trim() || 'Main Stadium',
      date,
      teamA: selectedTeamA,
      teamB: selectedTeamB,
      teamAPlayingXI,
      teamBPlayingXI,
      tossWinnerTeamId: tossWinnerTeamId || selectedTeamA.id,
      tossDecision,
      settings: {
        format,
        totalOvers,
        maxOversPerBowler,
        powerplayOvers: { start: powerplayStart, end: powerplayEnd },
        superOverEnabled: true,
        freeHitEnabled: true,
        widesAreRebowled: true,
        noBallsAreRebowled: true,
        wideRuns: 1,
        noBallRuns: 1,
      },
      sponsor: {
        enabled: true,
        name: 'ITC BROADCAST NETWORK',
        tagline: 'Official Stream',
        displayPosition: 'SCOREBUG',
      },
      currentInningIndex: 0,
      innings: [firstInning],
      isMatchCompleted: false,
      isSuperOver: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await liveSync.startNewMatch(newMatch);
    onMatchCreated(newMatch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0b1324] border-2 border-emerald-500 rounded-2xl max-w-4xl w-full p-6 shadow-2xl text-slate-100 my-8 max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
          <div className="flex items-center gap-3">
            <span className="bg-emerald-500 text-black px-2.5 py-0.5 rounded font-black text-xs font-heading">
              ITC SPORTS
            </span>
            <h2 className="text-xl font-bold font-heading text-white tracking-wide uppercase">
              PROFESSIONAL MATCH SETUP
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* FORMAT SELECTION */}
        <div className="mb-6">
          <label className="block text-xs font-heading uppercase text-emerald-400 tracking-wider mb-2 font-bold">
            1. Match Format & Overs
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            {(['T10', 'T20', 'ODI', 'CUSTOM'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => handleFormatChange(fmt)}
                className={`py-2.5 rounded-xl font-heading font-black text-xs uppercase border transition-all ${
                  format === fmt
                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Total Overs</label>
              <input
                type="number"
                min={1}
                max={50}
                value={totalOvers}
                onChange={(e) => setTotalOvers(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-numbers"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Max Overs / Bowler</label>
              <input
                type="number"
                min={1}
                max={10}
                value={maxOversPerBowler}
                onChange={(e) => setMaxOversPerBowler(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-numbers"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Powerplay Start Over</label>
              <input
                type="number"
                min={1}
                value={powerplayStart}
                onChange={(e) => setPowerplayStart(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-numbers"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Powerplay End Over</label>
              <input
                type="number"
                min={1}
                value={powerplayEnd}
                onChange={(e) => setPowerplayEnd(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white font-numbers"
              />
            </div>
          </div>
        </div>

        {/* MATCH DETAILS */}
        <div className="mb-6">
          <label className="block text-xs font-heading uppercase text-emerald-400 tracking-wider mb-2 font-bold">
            2. Match Information
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Match Name</label>
              <input
                type="text"
                value={matchName}
                onChange={(e) => setMatchName(e.target.value)}
                placeholder="e.g. Grand Final"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Tournament</label>
              <input
                type="text"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                placeholder="e.g. ITC Champions Trophy"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Venue</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. National Cricket Stadium"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white"
              />
            </div>
          </div>
        </div>

        {/* TEAM SELECTION */}
        <div className="mb-6">
          <label className="block text-xs font-heading uppercase text-emerald-400 tracking-wider mb-2 font-bold">
            3. Select Competing Teams
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Team A */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <label className="block text-xs font-heading uppercase text-slate-400 mb-1">Team A</label>
              <select
                value={teamAId}
                onChange={(e) => handleSelectTeamA(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white mb-3"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.shortName})
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-3">
                {selectedTeamA?.logoUrl && (
                  <img src={selectedTeamA.logoUrl} alt={selectedTeamA.shortName} className="w-10 h-10 object-contain" />
                )}
                <div>
                  <div className="font-bold text-sm text-white">{selectedTeamA?.name}</div>
                  <div className="text-xs text-emerald-400">{teamAPlayingXI.length} Players in Playing XI</div>
                </div>
              </div>
            </div>

            {/* Team B */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <label className="block text-xs font-heading uppercase text-slate-400 mb-1">Team B</label>
              <select
                value={teamBId}
                onChange={(e) => handleSelectTeamB(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white mb-3"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.shortName})
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-3">
                {selectedTeamB?.logoUrl && (
                  <img src={selectedTeamB.logoUrl} alt={selectedTeamB.shortName} className="w-10 h-10 object-contain" />
                )}
                <div>
                  <div className="font-bold text-sm text-white">{selectedTeamB?.name}</div>
                  <div className="text-xs text-emerald-400">{teamBPlayingXI.length} Players in Playing XI</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TOSS */}
        <div className="mb-6">
          <label className="block text-xs font-heading uppercase text-emerald-400 tracking-wider mb-2 font-bold">
            4. Toss Winner & Decision
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Toss Won By</label>
              <div className="flex gap-2">
                {[selectedTeamA, selectedTeamB].filter(Boolean).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTossWinnerTeamId(t.id)}
                    className={`flex-1 py-2 rounded-lg text-xs font-heading font-bold border transition-all ${
                      tossWinnerTeamId === t.id
                        ? 'bg-emerald-600 border-emerald-400 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-300'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Elected To</label>
              <div className="flex gap-2">
                {(['BAT', 'BOWL'] as const).map((dec) => (
                  <button
                    key={dec}
                    type="button"
                    onClick={() => setTossDecision(dec)}
                    className={`flex-1 py-2 rounded-lg text-xs font-heading font-bold border transition-all ${
                      tossDecision === dec
                        ? 'bg-emerald-600 border-emerald-400 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-300'
                    }`}
                  >
                    {dec}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* OPENING BATTERS & BOWLER */}
        <div className="mb-6">
          <label className="block text-xs font-heading uppercase text-emerald-400 tracking-wider mb-2 font-bold">
            5. Opening Batters & Opening Bowler
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Striker (Opening Batter 1)</label>
              <select
                value={strikerId}
                onChange={(e) => setStrikerId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                {battingXI.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Non-Striker (Opening Batter 2)</label>
              <select
                value={nonStrikerId}
                onChange={(e) => setNonStrikerId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                {battingXI.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Opening Bowler</label>
              <select
                value={openingBowlerId}
                onChange={(e) => setOpeningBowlerId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              >
                {bowlingXI.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-heading text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateMatch}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black font-heading text-sm uppercase tracking-wider shadow-lg shadow-emerald-950 transition-transform active:scale-95"
          >
            Start Live Match Scoring
          </button>
        </div>
      </div>
    </div>
  );
}
