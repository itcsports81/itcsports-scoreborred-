import React, { useState } from 'react';
import { Match } from '../../types/cricket.js';
import { liveSync } from '../../services/liveSync.js';
import { FullScorecardView } from './FullScorecardView.js';

interface MatchHistoryViewProps {
  history: Match[];
  onLoadMatch?: (match: Match) => void;
  onClose?: () => void;
}

export function MatchHistoryView({ history, onLoadMatch, onClose }: MatchHistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedScorecardMatch, setSelectedScorecardMatch] = useState<Match | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredMatches = history.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.matchName.toLowerCase().includes(q) ||
      m.tournamentName.toLowerCase().includes(q) ||
      m.teamA.name.toLowerCase().includes(q) ||
      m.teamB.name.toLowerCase().includes(q) ||
      m.venue.toLowerCase().includes(q)
    );
  });

  const handleDelete = async (id: string) => {
    await liveSync.deleteMatchFromHistory(id);
    setDeleteConfirmId(null);
  };

  if (selectedScorecardMatch) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setSelectedScorecardMatch(null)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-heading text-xs font-bold"
        >
          ← Back to Match History
        </button>
        <FullScorecardView match={selectedScorecardMatch} onClose={() => setSelectedScorecardMatch(null)} />
      </div>
    );
  }

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
              MATCH HISTORY & ARCHIVE
            </span>
          </div>
          <h2 className="text-2xl font-black font-heading text-white">Archived Matches ({history.length})</h2>
          <p className="text-xs text-slate-400">
            Review past tournaments, match summaries, and official ball-by-ball scorecards.
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

      {/* SEARCH */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by match title, tournament, team, or venue..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* MATCH LIST */}
      {filteredMatches.length === 0 ? (
        <div className="text-center py-12 text-slate-500 font-heading bg-slate-900/30 rounded-xl border border-slate-800">
          No archived matches found. Save completed matches from the live scoring panel to view them here.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((m) => {
            const team1Inning = m.innings[0];
            const team2Inning = m.innings[1];

            return (
              <div
                key={m.id}
                className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-heading font-bold text-emerald-400 uppercase">
                      {m.tournamentName || 'Tournament'}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400">{m.venue || 'Venue'}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400">{m.date}</span>
                  </div>

                  <h3 className="font-heading font-bold text-lg text-white mb-2">{m.matchName}</h3>

                  <div className="flex items-center gap-6 font-numbers text-base">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-slate-300">{m.teamA.shortName}:</span>
                      <span className="font-bold text-emerald-400">
                        {team1Inning ? `${team1Inning.runs}/${team1Inning.wickets} (${team1Inning.oversString} ov)` : '-'}
                      </span>
                    </div>

                    <span className="text-slate-600 font-sans">vs</span>

                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-slate-300">{m.teamB.shortName}:</span>
                      <span className="font-bold text-emerald-400">
                        {team2Inning ? `${team2Inning.runs}/${team2Inning.wickets} (${team2Inning.oversString} ov)` : '-'}
                      </span>
                    </div>
                  </div>

                  {m.resultSummary && (
                    <div className="mt-2 text-xs font-heading font-bold text-emerald-300 uppercase tracking-wide">
                      {m.resultSummary}
                    </div>
                  )}
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedScorecardMatch(m)}
                    className="px-3 py-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-300 rounded-xl font-heading text-xs font-bold transition-colors"
                  >
                    View Scorecard
                  </button>

                  {onLoadMatch && (
                    <button
                      type="button"
                      onClick={() => onLoadMatch(m)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-heading text-xs font-bold transition-colors"
                    >
                      Load into Scorer
                    </button>
                  )}

                  {deleteConfirmId === m.id ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDelete(m.id)}
                        className="px-2.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-heading text-xs font-bold"
                      >
                        Confirm Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-2 text-xs text-slate-400"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(m.id)}
                      className="px-3 py-2 text-rose-400 hover:bg-rose-950/40 rounded-xl font-heading text-xs transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
