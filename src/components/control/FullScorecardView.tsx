import React, { useState } from 'react';
import { Match, InningsState } from '../../types/cricket.js';
import { calculateRunRate } from '../../services/cricketEngine.js';

interface FullScorecardViewProps {
  match: Match;
  onClose?: () => void;
}

export function FullScorecardView({ match, onClose }: FullScorecardViewProps) {
  const [selectedInningTab, setSelectedInningTab] = useState<number>(0);

  const activeInning = match.innings[selectedInningTab] || match.innings[0];

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
              OFFICIAL SCORECARD
            </span>
          </div>
          <h2 className="text-2xl font-black font-heading text-white">{match.matchName || 'CRICKET MATCH'}</h2>
          <div className="text-xs text-slate-400 mt-0.5">
            {match.tournamentName} • {match.venue} • {match.date} • {match.settings.format} ({match.settings.totalOvers} Overs)
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="self-start sm:self-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-heading text-xs font-bold transition-colors"
          >
            Back to Scoring
          </button>
        )}
      </div>

      {/* MATCH RESULT BANNER */}
      {match.isMatchCompleted && match.resultSummary && (
        <div className="bg-emerald-950/80 border border-emerald-500 text-emerald-300 px-4 py-3 rounded-xl mb-6 text-center font-black font-heading text-base uppercase tracking-wider shadow-lg">
          {match.resultSummary}
        </div>
      )}

      {/* TOSS DETAIL */}
      <div className="text-xs text-slate-300 bg-slate-900/60 border border-slate-800 rounded-lg p-3 mb-6 flex items-center justify-between">
        <span>
          <strong>Toss:</strong>{' '}
          {match.tossWinnerTeamId === match.teamA.id ? match.teamA.name : match.teamB.name} won the toss and elected to{' '}
          {match.tossDecision.toLowerCase()} first.
        </span>
        <span className="font-heading text-emerald-400">
          Match Format: <strong>{match.settings.format}</strong>
        </span>
      </div>

      {/* INNINGS TABS */}
      <div className="flex items-center gap-2 border-b border-slate-800 mb-6 pb-2">
        {match.innings.map((inn, idx) => (
          <button
            key={inn.inningIndex}
            type="button"
            onClick={() => setSelectedInningTab(idx)}
            className={`px-4 py-2 rounded-lg font-heading text-xs font-bold uppercase transition-all ${
              selectedInningTab === idx
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            {idx === 0 ? '1st Innings' : idx === 1 ? '2nd Innings' : `Super Over ${idx}`} ({inn.battingTeamName}: {inn.runs}/{inn.wickets})
          </button>
        ))}
      </div>

      {/* INNINGS DETAILS */}
      {activeInning ? (
        <InningScorecardTable inning={activeInning} match={match} />
      ) : (
        <div className="text-center py-12 text-slate-500 font-heading">Innings not yet started.</div>
      )}
    </div>
  );
}

function InningScorecardTable({ inning, match }: { inning: InningsState; match: Match }) {
  const crr = calculateRunRate(inning.runs, inning.legalBalls);

  return (
    <div className="space-y-6">
      {/* INNING SUMMARY HEADER */}
      <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="font-heading font-black text-lg text-white">
            {inning.battingTeamName} Batting
          </div>
          <span className="text-xs text-slate-400 font-heading">
            vs {inning.bowlingTeamName}
          </span>
        </div>
        <div className="font-numbers text-3xl font-black text-emerald-400">
          {inning.runs}/{inning.wickets}{' '}
          <span className="text-slate-400 text-base font-sans">({inning.oversString} ov, CRR: {crr.toFixed(2)})</span>
        </div>
      </div>

      {/* BATTING TABLE */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0b1324] text-slate-400 font-heading uppercase tracking-wider text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-4">Batter</th>
              <th className="py-2.5 px-3">Dismissal</th>
              <th className="py-2.5 px-3 text-right">R</th>
              <th className="py-2.5 px-3 text-right">B</th>
              <th className="py-2.5 px-3 text-right">4s</th>
              <th className="py-2.5 px-3 text-right">6s</th>
              <th className="py-2.5 px-4 text-right">SR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 bg-slate-900/30">
            {inning.batters.map((b) => (
              <tr key={b.playerId} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-bold text-white text-sm">{b.playerName}</div>
                  <div className="text-[10px] text-slate-400">#{b.battingOrder} in order</div>
                </td>
                <td className="py-3 px-3 text-slate-400">
                  {b.isOut ? (
                    <span className="text-slate-300">{b.dismissalText || 'out'}</span>
                  ) : (
                    <span className="text-emerald-400 font-semibold font-heading">not out</span>
                  )}
                </td>
                <td className="py-3 px-3 text-right font-numbers text-base font-bold text-white">
                  {b.runs}
                </td>
                <td className="py-3 px-3 text-right font-numbers text-sm text-slate-300">
                  {b.balls}
                </td>
                <td className="py-3 px-3 text-right font-numbers text-sm text-slate-400">
                  {b.fours}
                </td>
                <td className="py-3 px-3 text-right font-numbers text-sm text-slate-400">
                  {b.sixes}
                </td>
                <td className="py-3 px-4 text-right font-numbers text-sm text-emerald-400 font-semibold">
                  {b.strikeRate.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EXTRAS & TOTAL ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 flex justify-between items-center">
          <div>
            <span className="font-heading font-bold uppercase text-slate-400 block mb-1">
              Extras Summary
            </span>
            <span className="text-slate-400">
              (w {inning.extras.wides}, nb {inning.extras.noBalls}, b {inning.extras.byes}, lb {inning.extras.legByes}, pen {inning.extras.penalty})
            </span>
          </div>
          <span className="font-numbers text-2xl font-bold text-emerald-400">
            {inning.extras.total}
          </span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 flex justify-between items-center">
          <div>
            <span className="font-heading font-bold uppercase text-slate-400 block mb-1">
              Total Score
            </span>
            <span className="text-slate-400">
              ({inning.oversString} Overs, Run Rate {crr.toFixed(2)})
            </span>
          </div>
          <span className="font-numbers text-3xl font-black text-white">
            {inning.runs}/{inning.wickets}
          </span>
        </div>
      </div>

      {/* BOWLING TABLE */}
      <div>
        <h4 className="text-xs font-heading uppercase tracking-wider text-emerald-400 mb-2 font-bold">
          Bowling Table ({inning.bowlingTeamName})
        </h4>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b1324] text-slate-400 font-heading uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4">Bowler</th>
                <th className="py-2.5 px-3 text-right">O</th>
                <th className="py-2.5 px-3 text-right">M</th>
                <th className="py-2.5 px-3 text-right">R</th>
                <th className="py-2.5 px-3 text-right">W</th>
                <th className="py-2.5 px-3 text-right">WD</th>
                <th className="py-2.5 px-3 text-right">NB</th>
                <th className="py-2.5 px-4 text-right">ECO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/30">
              {inning.bowlers.map((bw) => {
                const ovStr = `${Math.floor(bw.legalBalls / 6)}.${bw.legalBalls % 6}`;
                return (
                  <tr key={bw.playerId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-white text-sm">
                      {bw.playerName}
                    </td>
                    <td className="py-3 px-3 text-right font-numbers text-sm text-slate-200">
                      {ovStr}
                    </td>
                    <td className="py-3 px-3 text-right font-numbers text-sm text-slate-400">
                      {bw.maidens}
                    </td>
                    <td className="py-3 px-3 text-right font-numbers text-sm text-slate-200">
                      {bw.runsConceded}
                    </td>
                    <td className="py-3 px-3 text-right font-numbers text-base font-bold text-emerald-400">
                      {bw.wickets}
                    </td>
                    <td className="py-3 px-3 text-right font-numbers text-sm text-slate-400">
                      {bw.wides}
                    </td>
                    <td className="py-3 px-3 text-right font-numbers text-sm text-slate-400">
                      {bw.noBalls}
                    </td>
                    <td className="py-3 px-4 text-right font-numbers text-sm text-slate-300 font-semibold">
                      {bw.economy.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FALL OF WICKETS */}
      {inning.fallOfWickets.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <h4 className="text-xs font-heading uppercase tracking-wider text-emerald-400 mb-2 font-bold">
            Fall of Wickets
          </h4>
          <div className="flex flex-wrap gap-2 text-xs">
            {inning.fallOfWickets.map((f) => (
              <div
                key={f.wicketNumber}
                className="bg-black/50 border border-slate-700/80 px-3 py-1.5 rounded-lg text-slate-200 flex items-center gap-2"
              >
                <span className="font-numbers text-base font-bold text-emerald-400">
                  {f.wicketNumber}-{f.score}
                </span>
                <span className="text-slate-400 text-xs">
                  ({f.dismissedPlayerName}, {f.oversString} ov)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PARTNERSHIPS */}
      {inning.partnerships.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <h4 className="text-xs font-heading uppercase tracking-wider text-emerald-400 mb-2 font-bold">
            Completed Partnerships
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {inning.partnerships.map((p, i) => (
              <div key={i} className="bg-black/40 border border-slate-800 p-2.5 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-heading text-slate-400">Wicket {i + 1} Partnership</span>
                  <span className="font-numbers text-base font-bold text-emerald-400">
                    {p.totalRuns} ({p.balls}b)
                  </span>
                </div>
                <div className="text-[11px] text-slate-300">
                  {p.batter1Name} ({p.batter1Runs}) & {p.batter2Name} ({p.batter2Runs})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
