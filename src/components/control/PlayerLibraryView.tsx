import React, { useState, useRef, useEffect } from 'react';
import { Player, Team, BattingStyle, BowlingStyle } from '../../types/cricket.js';
import { liveSync } from '../../services/liveSync.js';

interface PlayerLibraryViewProps {
  players: Player[];
  teams: Team[];
  onClose?: () => void;
}

export function PlayerLibraryView({ players, teams, onClose }: PlayerLibraryViewProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('ALL');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingPlayer, setEditingPlayer] = useState<Partial<Player> | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewingStatsPlayer, setViewingStatsPlayer] = useState<Player | null>(null);

  // Fast Multi-Player Continuous Entry State
  const [isFastAddOpen, setIsFastAddOpen] = useState(false);
  const [fastPlayerName, setFastPlayerName] = useState('');
  const [fastTeamId, setFastTeamId] = useState(teams[0]?.id || '');
  const [recentlyAdded, setRecentlyAdded] = useState<string[]>([]);
  const fastInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isFastAddOpen) {
      setTimeout(() => fastInputRef.current?.focus(), 100);
    }
  }, [isFastAddOpen]);

  const filteredPlayers = players.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.jerseyNumber && p.jerseyNumber.toString().includes(searchQuery));
    const matchesTeam = selectedTeamFilter === 'ALL' || p.teamId === selectedTeamFilter;
    return matchesSearch && matchesTeam;
  });

  const handleFastAdd = async () => {
    const trimmed = fastPlayerName.trim();
    if (!trimmed) return;
    const team = teams.find((t) => t.id === fastTeamId);
    const newPlayer: Player = {
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: trimmed,
      shortName: trimmed.length > 14 ? trimmed.slice(0, 14) : trimmed,
      teamId: fastTeamId || undefined,
      teamName: team?.name,
      battingStyle: 'RIGHT_HAND',
      bowlingStyle: 'RIGHT_ARM_MEDIUM',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await liveSync.savePlayer(newPlayer);
    setRecentlyAdded((prev) => [trimmed, ...prev]);
    setFastPlayerName('');
    setTimeout(() => fastInputRef.current?.focus(), 50);
  };

  const handleStartAdd = () => {
    setEditingPlayer({
      id: `p-${Date.now()}`,
      name: '',
      shortName: '',
      jerseyNumber: undefined,
      teamId: teams[0]?.id || '',
      battingStyle: 'RIGHT_HAND',
      bowlingStyle: 'RIGHT_ARM_MEDIUM',
    });
    setIsEditing(true);
  };

  const handleStartEdit = (player: Player) => {
    setEditingPlayer({ ...player });
    setIsEditing(true);
  };

  const handleSavePlayer = async () => {
    if (!editingPlayer || !editingPlayer.name?.trim()) {
      alert('Please enter a player name');
      return;
    }

    const team = teams.find((t) => t.id === editingPlayer.teamId);

    const playerToSave: Player = {
      id: editingPlayer.id || `p-${Date.now()}`, // Stable internal ID preserved!
      name: editingPlayer.name.trim(),
      shortName: (editingPlayer.shortName || editingPlayer.name.slice(0, 12)).trim(),
      jerseyNumber: editingPlayer.jerseyNumber ? Number(editingPlayer.jerseyNumber) : undefined,
      teamId: editingPlayer.teamId || undefined,
      teamName: team?.name,
      battingStyle: editingPlayer.battingStyle as BattingStyle,
      bowlingStyle: editingPlayer.bowlingStyle as BowlingStyle,
      isCaptain: !!editingPlayer.isCaptain,
      isWicketKeeper: !!editingPlayer.isWicketKeeper,
      stats: editingPlayer.stats, // Career stats preserved even after spelling correction!
      createdAt: editingPlayer.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    await liveSync.savePlayer(playerToSave);
    setIsEditing(false);
    setEditingPlayer(null);
  };

  const handleDeletePlayer = async (id: string) => {
    await liveSync.deletePlayer(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="bg-[#080d19] border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500 text-black px-2 py-0.5 rounded text-[10px] font-black font-heading">
              ITC SPORTS
            </span>
            <span className="text-xs text-emerald-400 font-heading tracking-widest uppercase">
              PLAYER LIBRARY & CAREER ARCHIVE
            </span>
          </div>
          <h2 className="text-2xl font-black font-heading text-white">Player Roster & History</h2>
          <p className="text-xs text-slate-400">
            Internal stable Player IDs preserve all batting & bowling career records even after spelling updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFastAddOpen((prev) => !prev)}
            className={`px-3.5 py-2 font-black font-heading text-xs rounded-xl uppercase tracking-wider shadow-lg transition-transform active:scale-95 border ${
              isFastAddOpen
                ? 'bg-amber-500 text-black border-amber-400'
                : 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-500 text-emerald-300'
            }`}
          >
            ⚡ Fast Multi-Player Add (Enter-Key)
          </button>
          <button
            type="button"
            onClick={handleStartAdd}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black font-heading text-xs rounded-xl uppercase tracking-wider shadow-lg transition-transform active:scale-95"
          >
            + Add Full Profile
          </button>
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
      </div>

      {/* FAST MULTI-PLAYER CONTINUOUS ENTRY PANEL */}
      {isFastAddOpen && (
        <div className="bg-[#0b1426] border-2 border-emerald-500/80 rounded-2xl p-5 mb-6 shadow-2xl animate-in fade-in">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-heading font-black text-emerald-400 text-sm uppercase tracking-wide">
                Fast Multi-Player Continuous Roster Entry
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsFastAddOpen(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕ Close
            </button>
          </div>

          <p className="text-xs text-slate-300 mb-3">
            Type player name and press <strong className="text-white underline">ENTER</strong>. The player is saved immediately with a stable ID and the next blank field is focused automatically!
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="sm:col-span-1">
              <label className="block text-[11px] font-heading uppercase text-slate-400 mb-1">
                Assign to Team:
              </label>
              <select
                value={fastTeamId}
                onChange={(e) => setFastTeamId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="">No Team (Free Agent)</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.shortName})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-heading uppercase text-emerald-400 mb-1 font-bold">
                Player Name (Press Enter to Save & Advance):
              </label>
              <div className="flex items-center gap-2">
                <input
                  ref={fastInputRef}
                  type="text"
                  value={fastPlayerName}
                  onChange={(e) => setFastPlayerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleFastAdd();
                    }
                  }}
                  placeholder="Type player name and hit ENTER (e.g. Asif)..."
                  className="flex-1 bg-slate-900 border border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
                <button
                  type="button"
                  onClick={handleFastAdd}
                  disabled={!fastPlayerName.trim()}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-black font-heading text-xs rounded-xl uppercase shrink-0 transition-transform active:scale-95"
                >
                  + Add (ENTER)
                </button>
              </div>
            </div>
          </div>

          {recentlyAdded.length > 0 && (
            <div className="pt-3 border-t border-slate-800">
              <span className="text-[11px] font-heading text-slate-400 block mb-1.5">
                Added in this session ({recentlyAdded.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {recentlyAdded.map((name, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 rounded text-xs font-semibold flex items-center gap-1"
                  >
                    <span>✓</span> {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* EDIT / CREATE FORM */}
      {isEditing && editingPlayer && (
        <div className="bg-[#0c1426] border-2 border-emerald-500/80 rounded-2xl p-5 mb-8 shadow-2xl animate-in fade-in">
          <h3 className="font-heading font-bold text-lg text-emerald-400 uppercase tracking-wide mb-4">
            {editingPlayer.createdAt ? 'Edit Player (ID Preserved)' : 'Add New Player'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-5">
            <div>
              <label className="block text-xs font-heading uppercase text-slate-400 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={editingPlayer.name || ''}
                onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                placeholder="e.g. Babar Azam"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-heading uppercase text-slate-400 mb-1">
                Short Name (Scorebug Display)
              </label>
              <input
                type="text"
                value={editingPlayer.shortName || ''}
                onChange={(e) => setEditingPlayer({ ...editingPlayer, shortName: e.target.value })}
                placeholder="e.g. B. Azam"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-heading uppercase text-slate-400 mb-1">
                Jersey Number
              </label>
              <input
                type="number"
                value={editingPlayer.jerseyNumber ?? ''}
                onChange={(e) =>
                  setEditingPlayer({
                    ...editingPlayer,
                    jerseyNumber: e.target.value ? parseInt(e.target.value, 10) : undefined,
                  })
                }
                placeholder="e.g. 56"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-numbers focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-heading uppercase text-slate-400 mb-1">
                Assign Team
              </label>
              <select
                value={editingPlayer.teamId || ''}
                onChange={(e) => setEditingPlayer({ ...editingPlayer, teamId: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">No Team (Free Agent)</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.shortName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-heading uppercase text-slate-400 mb-1">
                Batting Style
              </label>
              <select
                value={editingPlayer.battingStyle || 'RIGHT_HAND'}
                onChange={(e) =>
                  setEditingPlayer({ ...editingPlayer, battingStyle: e.target.value as BattingStyle })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="RIGHT_HAND">Right-Hand Bat</option>
                <option value="LEFT_HAND">Left-Hand Bat</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-heading uppercase text-slate-400 mb-1">
                Bowling Style
              </label>
              <select
                value={editingPlayer.bowlingStyle || 'RIGHT_ARM_MEDIUM'}
                onChange={(e) =>
                  setEditingPlayer({ ...editingPlayer, bowlingStyle: e.target.value as BowlingStyle })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="RIGHT_ARM_FAST">Right-Arm Fast</option>
                <option value="RIGHT_ARM_MEDIUM">Right-Arm Medium</option>
                <option value="LEFT_ARM_FAST">Left-Arm Fast</option>
                <option value="LEFT_ARM_MEDIUM">Left-Arm Medium</option>
                <option value="OFF_SPIN">Right-Arm Off Spin</option>
                <option value="LEG_SPIN">Right-Arm Leg Spin</option>
                <option value="LEFT_ARM_ORTHODOX">Left-Arm Orthodox Spin</option>
                <option value="LEFT_ARM_CHINAMAN">Left-Arm Chinaman</option>
                <option value="UNKNOWN">None / Wicketkeeper</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-6 mb-5">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-heading">
              <input
                type="checkbox"
                checked={!!editingPlayer.isCaptain}
                onChange={(e) => setEditingPlayer({ ...editingPlayer, isCaptain: e.target.checked })}
                className="rounded accent-emerald-500"
              />
              <span>Team Captain</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-heading">
              <input
                type="checkbox"
                checked={!!editingPlayer.isWicketKeeper}
                onChange={(e) =>
                  setEditingPlayer({ ...editingPlayer, isWicketKeeper: e.target.checked })
                }
                className="rounded accent-emerald-500"
              />
              <span>Wicketkeeper</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditingPlayer(null);
              }}
              className="px-4 py-2 text-slate-400 hover:text-white font-heading text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSavePlayer}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black font-heading text-xs rounded-xl uppercase tracking-wider shadow-lg"
            >
              Save Player
            </button>
          </div>
        </div>
      )}

      {/* FILTER & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by player name or jersey #..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedTeamFilter}
            onChange={(e) => setSelectedTeamFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Teams ({players.length})</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* PLAYER LIST */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0b1324] text-slate-400 font-heading uppercase tracking-wider text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Player</th>
              <th className="py-3 px-3">Team</th>
              <th className="py-3 px-3">Role / Style</th>
              <th className="py-3 px-3 text-right">Runs / HS</th>
              <th className="py-3 px-3 text-right">Wickets</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 bg-slate-900/30">
            {filteredPlayers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 font-heading">
                  No players found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredPlayers.map((p) => {
                const team = teams.find((t) => t.id === p.teamId);
                const stats = p.stats || {
                  matches: 0,
                  runs: 0,
                  highestScore: 0,
                  wickets: 0,
                };

                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {p.jerseyNumber ? (
                          <span className="w-6 h-6 rounded-full bg-black/60 border border-slate-700 text-xs font-numbers font-bold flex items-center justify-center text-emerald-400">
                            {p.jerseyNumber}
                          </span>
                        ) : null}
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-1.5">
                            {p.name}
                            {p.isCaptain && (
                              <span className="text-[9px] bg-amber-950 text-amber-300 px-1 py-0.2 rounded border border-amber-800">
                                C
                              </span>
                            )}
                            {p.isWicketKeeper && (
                              <span className="text-[9px] bg-blue-950 text-blue-300 px-1 py-0.2 rounded border border-blue-800">
                                WK
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {p.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-heading font-medium text-slate-300">
                        {team ? team.shortName : 'Free Agent'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-400">
                      <div>{p.battingStyle === 'LEFT_HAND' ? 'LHB' : 'RHB'}</div>
                      <div className="text-[10px] text-slate-500">
                        {p.bowlingStyle?.replace(/_/g, ' ') || 'Bowler'}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-numbers text-sm text-slate-200">
                      <strong className="text-white text-base">{stats.runs}</strong>
                      <span className="text-slate-500 ml-1 text-xs">(HS: {stats.highestScore})</span>
                    </td>

                    <td className="py-3 px-3 text-right font-numbers text-sm text-emerald-400 font-bold">
                      {stats.wickets} w
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingStatsPlayer(p)}
                          className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 rounded font-heading text-[11px]"
                        >
                          Stats
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(p)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-heading text-[11px]"
                        >
                          Edit
                        </button>
                        {deleteConfirmId === p.id ? (
                          <button
                            type="button"
                            onClick={() => handleDeletePlayer(p.id)}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-heading text-[11px] font-bold"
                          >
                            Sure?
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(p.id)}
                            className="px-2 py-1 text-rose-400 hover:text-rose-300 font-heading text-[11px]"
                          >
                            Del
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* DETAILED PLAYER CAREER STATS MODAL */}
      {viewingStatsPlayer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1324] border-2 border-emerald-500 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-100 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <span className="text-[10px] text-emerald-400 uppercase font-heading tracking-wider">
                  CAREER PROFILE
                </span>
                <h3 className="text-xl font-bold font-heading text-white">{viewingStatsPlayer.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingStatsPlayer(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* BATTING CAREER CARD */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 mb-4">
              <h4 className="text-xs font-heading uppercase text-emerald-400 tracking-wider mb-2 font-bold">
                Batting Career
              </h4>
              <div className="grid grid-cols-4 gap-2 text-center font-numbers text-xs">
                <div className="bg-black/40 p-2 rounded">
                  <div className="text-slate-400 text-[10px] font-sans">Matches</div>
                  <div className="text-lg font-bold text-white">{viewingStatsPlayer.stats?.matches ?? 0}</div>
                </div>
                <div className="bg-black/40 p-2 rounded">
                  <div className="text-slate-400 text-[10px] font-sans">Innings</div>
                  <div className="text-lg font-bold text-white">{viewingStatsPlayer.stats?.innings ?? 0}</div>
                </div>
                <div className="bg-black/40 p-2 rounded">
                  <div className="text-slate-400 text-[10px] font-sans">Runs</div>
                  <div className="text-lg font-bold text-emerald-400">{viewingStatsPlayer.stats?.runs ?? 0}</div>
                </div>
                <div className="bg-black/40 p-2 rounded">
                  <div className="text-slate-400 text-[10px] font-sans">Highest</div>
                  <div className="text-lg font-bold text-white">{viewingStatsPlayer.stats?.highestScore ?? 0}</div>
                </div>
                <div className="bg-black/40 p-2 rounded">
                  <div className="text-slate-400 text-[10px] font-sans">4s / 6s</div>
                  <div className="text-sm font-bold text-slate-200">
                    {viewingStatsPlayer.stats?.fours ?? 0} / {viewingStatsPlayer.stats?.sixes ?? 0}
                  </div>
                </div>
                <div className="bg-black/40 p-2 rounded">
                  <div className="text-slate-400 text-[10px] font-sans">50s / 100s</div>
                  <div className="text-sm font-bold text-slate-200">
                    {viewingStatsPlayer.stats?.fifties ?? 0} / {viewingStatsPlayer.stats?.hundreds ?? 0}
                  </div>
                </div>
                <div className="bg-black/40 p-2 rounded">
                  <div className="text-slate-400 text-[10px] font-sans">Balls</div>
                  <div className="text-sm font-bold text-slate-200">{viewingStatsPlayer.stats?.ballsFaced ?? 0}</div>
                </div>
                <div className="bg-black/40 p-2 rounded">
                  <div className="text-slate-400 text-[10px] font-sans">Strike Rate</div>
                  <div className="text-sm font-bold text-emerald-400">
                    {viewingStatsPlayer.stats && viewingStatsPlayer.stats.ballsFaced > 0
                      ? ((viewingStatsPlayer.stats.runs / viewingStatsPlayer.stats.ballsFaced) * 100).toFixed(1)
                      : '0.0'}
                  </div>
                </div>
              </div>
            </div>

            {/* BOWLING CAREER CARD */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-heading uppercase text-emerald-400 tracking-wider mb-2 font-bold">
                Bowling Career
              </h4>
              <div className="grid grid-cols-4 gap-2 text-center font-numbers text-xs">
                <div className="bg-black/40 p-2 rounded">
                  <div className="text-slate-400 text-[10px] font-sans">Overs</div>
                  <div className="text-lg font-bold text-white">
                    {viewingStatsPlayer.stats
                      ? `${Math.floor(viewingStatsPlayer.stats.ballsBowled / 6)}.${viewingStatsPlayer.stats.ballsBowled % 6}`
                      : '0.0'}
                  </div>
                </div>
                <div className="bg-black/40 p-2 rounded">
                  <div className="text-slate-400 text-[10px] font-sans">Wickets</div>
                  <div className="text-lg font-bold text-emerald-400">{viewingStatsPlayer.stats?.wickets ?? 0}</div>
                </div>
                <div className="bg-black/40 p-2 rounded">
                  <div className="text-slate-400 text-[10px] font-sans">Runs</div>
                  <div className="text-lg font-bold text-white">{viewingStatsPlayer.stats?.runsConceded ?? 0}</div>
                </div>
                <div className="bg-black/40 p-2 rounded">
                  <div className="text-slate-400 text-[10px] font-sans">Best Figures</div>
                  <div className="text-sm font-bold text-white">
                    {viewingStatsPlayer.stats?.bestBowlingWickets ?? 0}/{viewingStatsPlayer.stats?.bestBowlingRuns ?? 0}
                  </div>
                </div>
                <div className="bg-black/40 p-2 rounded">
                  <div className="text-slate-400 text-[10px] font-sans">Maidens</div>
                  <div className="text-sm font-bold text-slate-200">{viewingStatsPlayer.stats?.maidens ?? 0}</div>
                </div>
                <div className="bg-black/40 p-2 rounded">
                  <div className="text-slate-400 text-[10px] font-sans">4W / 5W</div>
                  <div className="text-sm font-bold text-slate-200">
                    {viewingStatsPlayer.stats?.fourWicketHauls ?? 0} / {viewingStatsPlayer.stats?.fiveWicketHauls ?? 0}
                  </div>
                </div>
                <div className="bg-black/40 p-2 rounded">
                  <div className="text-slate-400 text-[10px] font-sans">WD / NB</div>
                  <div className="text-sm font-bold text-slate-200">
                    {viewingStatsPlayer.stats?.wides ?? 0} / {viewingStatsPlayer.stats?.noBalls ?? 0}
                  </div>
                </div>
                <div className="bg-black/40 p-2 rounded">
                  <div className="text-slate-400 text-[10px] font-sans">Economy</div>
                  <div className="text-sm font-bold text-emerald-400">
                    {viewingStatsPlayer.stats && viewingStatsPlayer.stats.ballsBowled > 0
                      ? ((viewingStatsPlayer.stats.runsConceded / (viewingStatsPlayer.stats.ballsBowled / 6))).toFixed(2)
                      : '0.00'}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingStatsPlayer(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-heading text-xs rounded-xl"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
