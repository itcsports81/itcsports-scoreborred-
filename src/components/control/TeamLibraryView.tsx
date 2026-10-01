import React, { useState, useRef, useEffect } from 'react';
import { Team, Player } from '../../types/cricket.js';
import { liveSync } from '../../services/liveSync.js';

interface TeamLibraryViewProps {
  teams: Team[];
  players: Player[];
  onClose?: () => void;
}

export function TeamLibraryView({ teams, players, onClose }: TeamLibraryViewProps) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingTeam, setEditingTeam] = useState<Partial<Team> | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fast Roster Entry Modal State
  const [rosterTeam, setRosterTeam] = useState<Team | null>(null);
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const fastInputRef = useRef<HTMLInputElement>(null);

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.shortName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (rosterTeam) {
      setTimeout(() => fastInputRef.current?.focus(), 100);
    }
  }, [rosterTeam]);

  const handleStartAdd = () => {
    setEditingTeam({
      id: `team-${Date.now()}`,
      name: '',
      shortName: '',
      logoUrl: '',
      primaryColor: '#10b981',
      secondaryColor: '#0b1324',
      playerIds: [],
    });
    setIsEditing(true);
  };

  const handleStartEdit = (team: Team) => {
    setEditingTeam({ ...team });
    setIsEditing(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Logo file size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditingTeam((prev) => (prev ? { ...prev, logoUrl: reader.result as string } : null));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setEditingTeam((prev) => (prev ? { ...prev, logoUrl: '' } : null));
  };

  const handleSaveTeam = async () => {
    if (!editingTeam || !editingTeam.name?.trim()) {
      alert('Please enter a team name');
      return;
    }

    const teamToSave: Team = {
      id: editingTeam.id || `team-${Date.now()}`,
      name: editingTeam.name.trim(),
      shortName: (editingTeam.shortName || editingTeam.name.slice(0, 3)).toUpperCase().trim(),
      logoUrl: editingTeam.logoUrl || undefined,
      primaryColor: editingTeam.primaryColor || '#10b981',
      secondaryColor: editingTeam.secondaryColor || '#0b1324',
      playerIds: editingTeam.playerIds || [],
      createdAt: editingTeam.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    await liveSync.saveTeam(teamToSave);
    setIsEditing(false);
    setEditingTeam(null);
  };

  const handleDeleteTeam = async (id: string) => {
    await liveSync.deleteTeam(id);
    setDeleteConfirmId(null);
  };

  // Fast Multi-Player Add Handler (Runs on Enter)
  const handleFastAddPlayer = async () => {
    if (!rosterTeam) return;
    const trimmed = newPlayerName.trim();
    if (!trimmed) return; // Do not save empty player on Enter

    setDuplicateWarning(null);

    // Check duplicate
    const teamPlayers = players.filter((p) => p.teamId === rosterTeam.id);
    const isDuplicate = teamPlayers.some((p) => p.name.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) {
      setDuplicateWarning(`"${trimmed}" is already in this roster.`);
      return;
    }

    // Stable internal ID
    const newPlayer: Player = {
      id: `p-${rosterTeam.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: trimmed,
      shortName: trimmed.length > 14 ? trimmed.slice(0, 14) : trimmed,
      jerseyNumber: teamPlayers.length + 1,
      teamId: rosterTeam.id,
      teamName: rosterTeam.name,
      battingStyle: 'RIGHT_HAND',
      bowlingStyle: 'RIGHT_ARM_MEDIUM',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await liveSync.savePlayer(newPlayer);

    // Clear input and immediately focus next blank field
    setNewPlayerName('');
    setTimeout(() => fastInputRef.current?.focus(), 50);
  };

  const handleRemovePlayerFromTeam = async (playerId: string) => {
    await liveSync.deletePlayer(playerId);
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
              TEAM LIBRARY & FAST ROSTER ENTRY
            </span>
          </div>
          <h2 className="text-2xl font-black font-heading text-white">Teams & Squad Manager</h2>
          <p className="text-xs text-slate-400">
            Create teams, upload computer logos, and use fast continuous Enter-key player entry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleStartAdd}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black font-heading text-xs rounded-xl uppercase tracking-wider shadow-lg transition-transform active:scale-95"
          >
            + Add New Team
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

      {/* EDIT / CREATE MODAL / FORM */}
      {isEditing && editingTeam && (
        <div className="bg-[#0c1426] border-2 border-emerald-500/80 rounded-2xl p-5 mb-8 shadow-2xl animate-in fade-in">
          <h3 className="font-heading font-bold text-lg text-emerald-400 uppercase tracking-wide mb-4">
            {editingTeam.createdAt ? 'Edit Team Details' : 'Add New Team'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
            {/* Left Column: Names and colors */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-heading uppercase text-slate-400 mb-1">
                  Full Team Name *
                </label>
                <input
                  type="text"
                  value={editingTeam.name || ''}
                  onChange={(e) => setEditingTeam({ ...editingTeam, name: e.target.value })}
                  placeholder="e.g. ITC SPORTS"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-heading uppercase text-slate-400 mb-1">
                  Short Name (Scorebug Display, 3-4 chars) *
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={editingTeam.shortName || ''}
                  onChange={(e) => setEditingTeam({ ...editingTeam, shortName: e.target.value.toUpperCase() })}
                  placeholder="e.g. ITS"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white uppercase font-heading focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-heading uppercase text-slate-400 mb-1">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingTeam.primaryColor || '#10b981'}
                      onChange={(e) => setEditingTeam({ ...editingTeam, primaryColor: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs font-numbers text-slate-300">{editingTeam.primaryColor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Direct computer logo upload */}
            <div className="space-y-3">
              <label className="block text-xs font-heading uppercase text-slate-400 mb-1">
                Team Logo (Upload Directly from Computer)
              </label>

              <div className="border-2 border-dashed border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-900/40 min-h-[160px]">
                {editingTeam.logoUrl ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={editingTeam.logoUrl}
                      alt="Logo Preview"
                      className="w-24 h-24 object-contain rounded-lg border border-slate-700 p-1 bg-black/60 shadow-md mb-3"
                    />
                    <div className="flex gap-2">
                      <label className="cursor-pointer px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-heading rounded-lg text-emerald-400 border border-slate-700">
                        Replace Logo
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-xs font-heading rounded-lg text-rose-300 border border-rose-800"
                      >
                        Remove Logo
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center text-center p-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-2">
                      📁
                    </div>
                    <span className="text-xs font-heading font-bold text-slate-200">
                      Click to Browse & Upload Logo
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">
                      PNG, JPG, SVG or WEBP (Max 5MB)
                    </span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditingTeam(null);
              }}
              className="px-4 py-2 text-slate-400 hover:text-white font-heading text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveTeam}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black font-heading text-xs rounded-xl uppercase tracking-wider shadow-lg"
            >
              Save Team to Library
            </button>
          </div>
        </div>
      )}

      {/* SEARCH BAR */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search team by name or abbreviation..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* TEAM CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeams.map((t) => {
          const teamRoster = players.filter((p) => p.teamId === t.id);
          return (
            <div
              key={t.id}
              className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition-all"
            >
              <div className="flex items-start gap-3">
                {t.logoUrl ? (
                  <img
                    src={t.logoUrl}
                    alt={t.shortName}
                    className="w-14 h-14 object-contain rounded-lg p-1 bg-black/60 border border-slate-800 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center font-heading font-black text-emerald-400 text-lg shrink-0">
                    {t.shortName}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-heading font-bold text-emerald-400 tracking-wider">
                    {t.shortName}
                  </span>
                  <h4 className="font-heading font-bold text-base text-white truncate">{t.name}</h4>
                  <div className="text-xs text-slate-400 mt-1">
                    {teamRoster.length} registered players
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setRosterTeam(t)}
                  className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/70 text-emerald-300 text-xs font-heading font-bold rounded-lg transition-transform active:scale-95"
                >
                  ⚡ Fast Roster ({teamRoster.length})
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(t)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-heading rounded-lg transition-colors"
                  >
                    Edit
                  </button>

                  {deleteConfirmId === t.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDeleteTeam(t.id)}
                        className="px-2 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-heading font-bold rounded-lg"
                      >
                        Sure?
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-1.5 py-1.5 text-xs text-slate-400"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(t.id)}
                      className="px-2 py-1.5 text-rose-400 hover:bg-rose-950/40 text-xs font-heading rounded-lg"
                    >
                      Del
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAST MULTI-PLAYER ROSTER ENTRY MODAL */}
      {rosterTeam && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b1324] border-2 border-emerald-500 rounded-2xl max-w-xl w-full p-6 shadow-2xl text-slate-100 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <span className="text-[10px] uppercase font-heading text-emerald-400 font-bold tracking-wider">
                    FAST CONTINUOUS ROSTER ENTRY (PRESS ENTER)
                  </span>
                  <h3 className="font-heading font-black text-xl text-white">
                    {rosterTeam.name} Roster
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRosterTeam(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Instruction Banner */}
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 mb-4 text-xs text-emerald-200">
              💡 <strong>Fast Roster Workflow:</strong> Type player name and press{' '}
              <strong className="text-white underline">ENTER</strong>. The player is saved immediately and the next
              blank field appears focused automatically!
              <span className="block text-[11px] text-slate-400 mt-0.5">
                Example: ASIF → ENTER, RAHUL → ENTER, IMRAN → ENTER, SALIM → ENTER
              </span>
            </div>

            {duplicateWarning && (
              <div className="p-2.5 bg-amber-950/60 border border-amber-600 text-amber-200 rounded-lg text-xs font-heading mb-3">
                ⚠️ {duplicateWarning}
              </div>
            )}

            {/* Existing Players in Roster */}
            <div className="flex-1 overflow-y-auto pr-1 mb-4 space-y-2 max-h-64">
              {(() => {
                const teamPlayers = players.filter((p) => p.teamId === rosterTeam.id);
                if (teamPlayers.length === 0) {
                  return (
                    <div className="text-center py-6 text-slate-500 text-xs font-heading">
                      No players in this roster yet. Type a name below and press ENTER to start!
                    </div>
                  );
                }

                return teamPlayers.map((p, idx) => (
                  <div
                    key={p.id}
                    className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-black/60 border border-slate-700 text-[10px] font-numbers font-bold flex items-center justify-center text-emerald-400">
                        {p.jerseyNumber || idx + 1}
                      </span>
                      <span className="font-bold text-white text-sm">{p.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">ID: {p.id.slice(0, 10)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemovePlayerFromTeam(p.id)}
                      className="px-2 py-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded text-[11px] font-heading"
                      title="Remove player"
                    >
                      ✕ Remove
                    </button>
                  </div>
                ));
              })()}
            </div>

            {/* FAST CONTINUOUS INPUT BOX */}
            <div className="pt-3 border-t border-slate-800">
              {(() => {
                const count = players.filter((p) => p.teamId === rosterTeam.id).length;
                return (
                  <div>
                    <label className="block text-xs font-heading uppercase text-emerald-400 mb-1.5 font-bold">
                      Player {count + 1} Name:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        ref={fastInputRef}
                        type="text"
                        value={newPlayerName}
                        onChange={(e) => {
                          setNewPlayerName(e.target.value);
                          if (duplicateWarning) setDuplicateWarning(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleFastAddPlayer();
                          }
                        }}
                        placeholder={`Type name and press ENTER (e.g. Player ${count + 1})...`}
                        className="flex-1 bg-slate-900 border border-emerald-500/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 placeholder:text-slate-600"
                      />
                      <button
                        type="button"
                        onClick={handleFastAddPlayer}
                        disabled={!newPlayerName.trim()}
                        className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-black font-heading text-xs uppercase tracking-wider rounded-xl shadow-md shrink-0 transition-transform active:scale-95"
                      >
                        + Add (ENTER)
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-800 text-xs">
              <span className="text-slate-400 font-heading">
                Total in Roster: <strong className="text-white">{players.filter((p) => p.teamId === rosterTeam.id).length}</strong>
              </span>
              <button
                type="button"
                onClick={() => setRosterTeam(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-heading text-xs rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
