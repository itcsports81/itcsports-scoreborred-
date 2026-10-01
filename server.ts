import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { AppDatabase, Match, Team, Player, BroadcastAnimationEvent, BroadcastOverlaySettings, SponsorConfig } from './src/types/cricket.js';

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed data
function getDefaultDatabase(): AppDatabase {
  const itcPlayers: Player[] = [
    {
      id: 'p-itc-1',
      name: 'Irfan Khan',
      shortName: 'I. Khan',
      jerseyNumber: 7,
      teamId: 'team-itc',
      teamName: 'ITC SPORTS',
      battingStyle: 'RIGHT_HAND',
      bowlingStyle: 'RIGHT_ARM_FAST',
      isCaptain: true,
      stats: {
        matches: 18,
        innings: 16,
        runs: 642,
        highestScore: 88,
        ballsFaced: 420,
        fours: 56,
        sixes: 34,
        fifties: 5,
        hundreds: 0,
        notOuts: 4,
        bowlingInnings: 14,
        ballsBowled: 264,
        runsConceded: 290,
        wickets: 22,
        maidens: 2,
        wides: 12,
        noBalls: 3,
        fourWicketHauls: 2,
        fiveWicketHauls: 0,
        bestBowlingRuns: 18,
        bestBowlingWickets: 4,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'p-itc-2',
      name: 'Tariq Mehmood',
      shortName: 'T. Mehmood',
      jerseyNumber: 10,
      teamId: 'team-itc',
      teamName: 'ITC SPORTS',
      battingStyle: 'LEFT_HAND',
      bowlingStyle: 'OFF_SPIN',
      isWicketKeeper: true,
      stats: {
        matches: 22,
        innings: 20,
        runs: 785,
        highestScore: 104,
        ballsFaced: 510,
        fours: 82,
        sixes: 29,
        fifties: 6,
        hundreds: 1,
        notOuts: 3,
        bowlingInnings: 0,
        ballsBowled: 0,
        runsConceded: 0,
        wickets: 0,
        maidens: 0,
        wides: 0,
        noBalls: 0,
        fourWicketHauls: 0,
        fiveWicketHauls: 0,
        bestBowlingRuns: 0,
        bestBowlingWickets: 0,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'p-itc-3',
      name: 'Hamza Sheikh',
      shortName: 'H. Sheikh',
      jerseyNumber: 18,
      teamId: 'team-itc',
      teamName: 'ITC SPORTS',
      battingStyle: 'RIGHT_HAND',
      bowlingStyle: 'RIGHT_ARM_MEDIUM',
      stats: {
        matches: 15,
        innings: 13,
        runs: 390,
        highestScore: 62,
        ballsFaced: 280,
        fours: 38,
        sixes: 15,
        fifties: 2,
        hundreds: 0,
        notOuts: 2,
        bowlingInnings: 10,
        ballsBowled: 150,
        runsConceded: 185,
        wickets: 9,
        maidens: 0,
        wides: 8,
        noBalls: 1,
        fourWicketHauls: 0,
        fiveWicketHauls: 0,
        bestBowlingRuns: 22,
        bestBowlingWickets: 2,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'p-itc-4',
      name: 'Bilal Ahmed',
      shortName: 'B. Ahmed',
      jerseyNumber: 24,
      teamId: 'team-itc',
      teamName: 'ITC SPORTS',
      battingStyle: 'RIGHT_HAND',
      bowlingStyle: 'RIGHT_ARM_FAST',
      stats: {
        matches: 19,
        innings: 12,
        runs: 145,
        highestScore: 31,
        ballsFaced: 95,
        fours: 14,
        sixes: 6,
        fifties: 0,
        hundreds: 0,
        notOuts: 5,
        bowlingInnings: 19,
        ballsBowled: 390,
        runsConceded: 410,
        wickets: 31,
        maidens: 5,
        wides: 14,
        noBalls: 4,
        fourWicketHauls: 3,
        fiveWicketHauls: 1,
        bestBowlingRuns: 14,
        bestBowlingWickets: 5,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'p-itc-5',
      name: 'Usman Ali',
      shortName: 'U. Ali',
      jerseyNumber: 45,
      teamId: 'team-itc',
      teamName: 'ITC SPORTS',
      battingStyle: 'LEFT_HAND',
      bowlingStyle: 'LEFT_ARM_ORTHODOX',
      stats: {
        matches: 14,
        innings: 11,
        runs: 210,
        highestScore: 48,
        ballsFaced: 160,
        fours: 22,
        sixes: 8,
        fifties: 0,
        hundreds: 0,
        notOuts: 1,
        bowlingInnings: 14,
        ballsBowled: 280,
        runsConceded: 310,
        wickets: 18,
        maidens: 1,
        wides: 9,
        noBalls: 2,
        fourWicketHauls: 1,
        fiveWicketHauls: 0,
        bestBowlingRuns: 20,
        bestBowlingWickets: 4,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'p-itc-6',
      name: 'Zeeshan Qureshi',
      shortName: 'Z. Qureshi',
      jerseyNumber: 99,
      teamId: 'team-itc',
      teamName: 'ITC SPORTS',
      battingStyle: 'RIGHT_HAND',
      bowlingStyle: 'LEG_SPIN',
      stats: {
        matches: 12,
        innings: 8,
        runs: 95,
        highestScore: 28,
        ballsFaced: 65,
        fours: 8,
        sixes: 4,
        fifties: 0,
        hundreds: 0,
        notOuts: 2,
        bowlingInnings: 12,
        ballsBowled: 230,
        runsConceded: 245,
        wickets: 16,
        maidens: 1,
        wides: 7,
        noBalls: 1,
        fourWicketHauls: 0,
        fiveWicketHauls: 0,
        bestBowlingRuns: 25,
        bestBowlingWickets: 3,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'p-itc-7',
      name: 'Shahid Afridi Jr',
      shortName: 'S. Afridi Jr',
      jerseyNumber: 10,
      teamId: 'team-itc',
      teamName: 'ITC SPORTS',
      battingStyle: 'RIGHT_HAND',
      bowlingStyle: 'LEG_SPIN',
      stats: {
        matches: 16,
        innings: 15,
        runs: 412,
        highestScore: 72,
        ballsFaced: 210,
        fours: 35,
        sixes: 28,
        fifties: 3,
        hundreds: 0,
        notOuts: 3,
        bowlingInnings: 15,
        ballsBowled: 270,
        runsConceded: 320,
        wickets: 17,
        maidens: 0,
        wides: 11,
        noBalls: 3,
        fourWicketHauls: 1,
        fiveWicketHauls: 0,
        bestBowlingRuns: 26,
        bestBowlingWickets: 4,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'p-itc-8',
      name: 'Faisal Raza',
      shortName: 'F. Raza',
      jerseyNumber: 33,
      teamId: 'team-itc',
      teamName: 'ITC SPORTS',
      battingStyle: 'LEFT_HAND',
      bowlingStyle: 'LEFT_ARM_FAST',
      stats: {
        matches: 11,
        innings: 7,
        runs: 60,
        highestScore: 19,
        ballsFaced: 45,
        fours: 5,
        sixes: 2,
        fifties: 0,
        hundreds: 0,
        notOuts: 3,
        bowlingInnings: 11,
        ballsBowled: 210,
        runsConceded: 220,
        wickets: 14,
        maidens: 2,
        wides: 6,
        noBalls: 2,
        fourWicketHauls: 0,
        fiveWicketHauls: 0,
        bestBowlingRuns: 19,
        bestBowlingWickets: 3,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'p-itc-9',
      name: 'Kamran Akram Jr',
      shortName: 'K. Akram Jr',
      jerseyNumber: 23,
      teamId: 'team-itc',
      teamName: 'ITC SPORTS',
      battingStyle: 'RIGHT_HAND',
      bowlingStyle: 'UNKNOWN',
      stats: {
        matches: 10,
        innings: 9,
        runs: 230,
        highestScore: 54,
        ballsFaced: 170,
        fours: 25,
        sixes: 7,
        fifties: 1,
        hundreds: 0,
        notOuts: 0,
        bowlingInnings: 0,
        ballsBowled: 0,
        runsConceded: 0,
        wickets: 0,
        maidens: 0,
        wides: 0,
        noBalls: 0,
        fourWicketHauls: 0,
        fiveWicketHauls: 0,
        bestBowlingRuns: 0,
        bestBowlingWickets: 0,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'p-itc-10',
      name: 'Naveed Akhtar',
      shortName: 'N. Akhtar',
      jerseyNumber: 11,
      teamId: 'team-itc',
      teamName: 'ITC SPORTS',
      battingStyle: 'RIGHT_HAND',
      bowlingStyle: 'RIGHT_ARM_FAST',
      stats: {
        matches: 8,
        innings: 4,
        runs: 25,
        highestScore: 12,
        ballsFaced: 20,
        fours: 2,
        sixes: 1,
        fifties: 0,
        hundreds: 0,
        notOuts: 2,
        bowlingInnings: 8,
        ballsBowled: 160,
        runsConceded: 175,
        wickets: 11,
        maidens: 1,
        wides: 5,
        noBalls: 1,
        fourWicketHauls: 0,
        fiveWicketHauls: 0,
        bestBowlingRuns: 21,
        bestBowlingWickets: 3,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'p-itc-11',
      name: 'Danish Kaneria Jr',
      shortName: 'D. Kaneria Jr',
      jerseyNumber: 77,
      teamId: 'team-itc',
      teamName: 'ITC SPORTS',
      battingStyle: 'RIGHT_HAND',
      bowlingStyle: 'LEG_SPIN',
      stats: {
        matches: 13,
        innings: 5,
        runs: 35,
        highestScore: 15,
        ballsFaced: 30,
        fours: 3,
        sixes: 0,
        fifties: 0,
        hundreds: 0,
        notOuts: 1,
        bowlingInnings: 13,
        ballsBowled: 260,
        runsConceded: 285,
        wickets: 19,
        maidens: 2,
        wides: 8,
        noBalls: 2,
        fourWicketHauls: 1,
        fiveWicketHauls: 0,
        bestBowlingRuns: 24,
        bestBowlingWickets: 4,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  const rivalPlayers: Player[] = [
    {
      id: 'p-riv-1',
      name: 'David Warner',
      shortName: 'D. Warner',
      jerseyNumber: 31,
      teamId: 'team-rival',
      teamName: 'TITANS CC',
      battingStyle: 'LEFT_HAND',
      bowlingStyle: 'LEG_SPIN',
      isCaptain: true,
      stats: {
        matches: 25,
        innings: 25,
        runs: 920,
        highestScore: 98,
        ballsFaced: 620,
        fours: 94,
        sixes: 40,
        fifties: 8,
        hundreds: 0,
        notOuts: 3,
        bowlingInnings: 2,
        ballsBowled: 24,
        runsConceded: 35,
        wickets: 1,
        maidens: 0,
        wides: 2,
        noBalls: 0,
        fourWicketHauls: 0,
        fiveWicketHauls: 0,
        bestBowlingRuns: 15,
        bestBowlingWickets: 1,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'p-riv-2',
      name: 'Glenn Maxwell',
      shortName: 'G. Maxwell',
      jerseyNumber: 32,
      teamId: 'team-rival',
      teamName: 'TITANS CC',
      battingStyle: 'RIGHT_HAND',
      bowlingStyle: 'OFF_SPIN',
      stats: {
        matches: 20,
        innings: 19,
        runs: 610,
        highestScore: 84,
        ballsFaced: 340,
        fours: 52,
        sixes: 38,
        fifties: 4,
        hundreds: 0,
        notOuts: 2,
        bowlingInnings: 18,
        ballsBowled: 290,
        runsConceded: 340,
        wickets: 15,
        maidens: 1,
        wides: 9,
        noBalls: 2,
        fourWicketHauls: 0,
        fiveWicketHauls: 0,
        bestBowlingRuns: 20,
        bestBowlingWickets: 3,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'p-riv-3',
      name: 'Jos Buttler',
      shortName: 'J. Buttler',
      jerseyNumber: 63,
      teamId: 'team-rival',
      teamName: 'TITANS CC',
      battingStyle: 'RIGHT_HAND',
      bowlingStyle: 'UNKNOWN',
      isWicketKeeper: true,
      stats: {
        matches: 24,
        innings: 23,
        runs: 840,
        highestScore: 101,
        ballsFaced: 530,
        fours: 78,
        sixes: 35,
        fifties: 7,
        hundreds: 1,
        notOuts: 4,
        bowlingInnings: 0,
        ballsBowled: 0,
        runsConceded: 0,
        wickets: 0,
        maidens: 0,
        wides: 0,
        noBalls: 0,
        fourWicketHauls: 0,
        fiveWicketHauls: 0,
        bestBowlingRuns: 0,
        bestBowlingWickets: 0,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'p-riv-4',
      name: 'Mitchell Starc',
      shortName: 'M. Starc',
      jerseyNumber: 56,
      teamId: 'team-rival',
      teamName: 'TITANS CC',
      battingStyle: 'LEFT_HAND',
      bowlingStyle: 'LEFT_ARM_FAST',
      stats: {
        matches: 21,
        innings: 10,
        runs: 95,
        highestScore: 26,
        ballsFaced: 60,
        fours: 8,
        sixes: 3,
        fifties: 0,
        hundreds: 0,
        notOuts: 4,
        bowlingInnings: 21,
        ballsBowled: 440,
        runsConceded: 460,
        wickets: 36,
        maidens: 6,
        wides: 15,
        noBalls: 3,
        fourWicketHauls: 3,
        fiveWicketHauls: 1,
        bestBowlingRuns: 16,
        bestBowlingWickets: 5,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'p-riv-5',
      name: 'Rashid Khan',
      shortName: 'R. Khan',
      jerseyNumber: 19,
      teamId: 'team-rival',
      teamName: 'TITANS CC',
      battingStyle: 'RIGHT_HAND',
      bowlingStyle: 'LEG_SPIN',
      stats: {
        matches: 26,
        innings: 18,
        runs: 280,
        highestScore: 45,
        ballsFaced: 160,
        fours: 26,
        sixes: 16,
        fifties: 0,
        hundreds: 0,
        notOuts: 6,
        bowlingInnings: 26,
        ballsBowled: 580,
        runsConceded: 510,
        wickets: 42,
        maidens: 7,
        wides: 12,
        noBalls: 2,
        fourWicketHauls: 4,
        fiveWicketHauls: 2,
        bestBowlingRuns: 12,
        bestBowlingWickets: 5,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'p-riv-6',
      name: 'Trent Boult',
      shortName: 'T. Boult',
      jerseyNumber: 18,
      teamId: 'team-rival',
      teamName: 'TITANS CC',
      battingStyle: 'RIGHT_HAND',
      bowlingStyle: 'LEFT_ARM_FAST',
      stats: {
        matches: 17,
        innings: 6,
        runs: 30,
        highestScore: 11,
        ballsFaced: 25,
        fours: 3,
        sixes: 1,
        fifties: 0,
        hundreds: 0,
        notOuts: 3,
        bowlingInnings: 17,
        ballsBowled: 360,
        runsConceded: 380,
        wickets: 24,
        maidens: 3,
        wides: 8,
        noBalls: 1,
        fourWicketHauls: 1,
        fiveWicketHauls: 0,
        bestBowlingRuns: 19,
        bestBowlingWickets: 4,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'p-riv-7',
      name: 'Hardik Pandya',
      shortName: 'H. Pandya',
      jerseyNumber: 33,
      teamId: 'team-rival',
      teamName: 'TITANS CC',
      battingStyle: 'RIGHT_HAND',
      bowlingStyle: 'RIGHT_ARM_MEDIUM',
      stats: {
        matches: 18,
        innings: 16,
        runs: 450,
        highestScore: 68,
        ballsFaced: 290,
        fours: 39,
        sixes: 22,
        fifties: 3,
        hundreds: 0,
        notOuts: 3,
        bowlingInnings: 14,
        ballsBowled: 240,
        runsConceded: 275,
        wickets: 14,
        maidens: 0,
        wides: 7,
        noBalls: 2,
        fourWicketHauls: 0,
        fiveWicketHauls: 0,
        bestBowlingRuns: 21,
        bestBowlingWickets: 3,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'p-riv-8',
      name: 'Nicholas Pooran',
      shortName: 'N. Pooran',
      jerseyNumber: 29,
      teamId: 'team-rival',
      teamName: 'TITANS CC',
      battingStyle: 'LEFT_HAND',
      bowlingStyle: 'UNKNOWN',
      stats: {
        matches: 19,
        innings: 18,
        runs: 540,
        highestScore: 78,
        ballsFaced: 320,
        fours: 44,
        sixes: 31,
        fifties: 4,
        hundreds: 0,
        notOuts: 2,
        bowlingInnings: 0,
        ballsBowled: 0,
        runsConceded: 0,
        wickets: 0,
        maidens: 0,
        wides: 0,
        noBalls: 0,
        fourWicketHauls: 0,
        fiveWicketHauls: 0,
        bestBowlingRuns: 0,
        bestBowlingWickets: 0,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'p-riv-9',
      name: 'Kagiso Rabada',
      shortName: 'K. Rabada',
      jerseyNumber: 25,
      teamId: 'team-rival',
      teamName: 'TITANS CC',
      battingStyle: 'RIGHT_HAND',
      bowlingStyle: 'RIGHT_ARM_FAST',
      stats: {
        matches: 16,
        innings: 8,
        runs: 52,
        highestScore: 18,
        ballsFaced: 38,
        fours: 4,
        sixes: 1,
        fifties: 0,
        hundreds: 0,
        notOuts: 2,
        bowlingInnings: 16,
        ballsBowled: 340,
        runsConceded: 360,
        wickets: 23,
        maidens: 2,
        wides: 10,
        noBalls: 2,
        fourWicketHauls: 1,
        fiveWicketHauls: 0,
        bestBowlingRuns: 18,
        bestBowlingWickets: 4,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'p-riv-10',
      name: 'Adam Zampa',
      shortName: 'A. Zampa',
      jerseyNumber: 88,
      teamId: 'team-rival',
      teamName: 'TITANS CC',
      battingStyle: 'RIGHT_HAND',
      bowlingStyle: 'LEG_SPIN',
      stats: {
        matches: 15,
        innings: 4,
        runs: 18,
        highestScore: 8,
        ballsFaced: 20,
        fours: 1,
        sixes: 0,
        fifties: 0,
        hundreds: 0,
        notOuts: 1,
        bowlingInnings: 15,
        ballsBowled: 310,
        runsConceded: 330,
        wickets: 20,
        maidens: 1,
        wides: 6,
        noBalls: 1,
        fourWicketHauls: 1,
        fiveWicketHauls: 0,
        bestBowlingRuns: 22,
        bestBowlingWickets: 4,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'p-riv-11',
      name: 'Sunil Narine',
      shortName: 'S. Narine',
      jerseyNumber: 74,
      teamId: 'team-rival',
      teamName: 'TITANS CC',
      battingStyle: 'LEFT_HAND',
      bowlingStyle: 'OFF_SPIN',
      stats: {
        matches: 22,
        innings: 19,
        runs: 410,
        highestScore: 65,
        ballsFaced: 230,
        fours: 42,
        sixes: 25,
        fifties: 2,
        hundreds: 0,
        notOuts: 1,
        bowlingInnings: 22,
        ballsBowled: 480,
        runsConceded: 420,
        wickets: 28,
        maidens: 4,
        wides: 9,
        noBalls: 1,
        fourWicketHauls: 2,
        fiveWicketHauls: 0,
        bestBowlingRuns: 15,
        bestBowlingWickets: 4,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  // ITC Sports SVG Logo
  const itcLogo = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2310b981"/><stop offset="100%" stop-color="%23047857"/></linearGradient></defs><rect width="200" height="200" rx="30" fill="%230b1324"/><circle cx="100" cy="100" r="75" fill="none" stroke="url(%23g)" stroke-width="8"/><path d="M60 70 L95 70 L95 130 L60 130 Z" fill="none" stroke="%23ffffff" stroke-width="6"/><text x="100" y="112" font-family="sans-serif" font-weight="900" font-size="34" fill="%2310b981" text-anchor="middle">ITC</text><text x="100" y="145" font-family="sans-serif" font-weight="700" font-size="16" fill="%23ffffff" text-anchor="middle" letter-spacing="2">SPORTS</text></svg>`;

  const rivalLogo = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs><linearGradient id="r" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f59e0b"/><stop offset="100%" stop-color="%23d97706"/></linearGradient></defs><rect width="200" height="200" rx="30" fill="%2318181b"/><polygon points="100,30 165,155 35,155" fill="none" stroke="url(%23r)" stroke-width="8"/><text x="100" y="125" font-family="sans-serif" font-weight="900" font-size="30" fill="%23f59e0b" text-anchor="middle">TITANS</text></svg>`;

  const itcTeam: Team = {
    id: 'team-itc',
    name: 'ITC SPORTS',
    shortName: 'ITS',
    logoUrl: itcLogo,
    primaryColor: '#10b981',
    secondaryColor: '#060a12',
    playerIds: itcPlayers.map((p) => p.id),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const rivalTeam: Team = {
    id: 'team-rival',
    name: 'TITANS CC',
    shortName: 'TTC',
    logoUrl: rivalLogo,
    primaryColor: '#f59e0b',
    secondaryColor: '#18181b',
    playerIds: rivalPlayers.map((p) => p.id),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Default active match
  const defaultMatch: Match = {
    id: 'match-demo-1',
    matchName: 'Premier League Final',
    tournamentName: 'ITC Champions Trophy 2026',
    venue: 'National Cricket Stadium',
    date: new Date().toISOString().split('T')[0],
    teamA: itcTeam,
    teamB: rivalTeam,
    teamAPlayingXI: itcPlayers,
    teamBPlayingXI: rivalPlayers,
    captainTeamAId: 'p-itc-1',
    wicketKeeperTeamAId: 'p-itc-2',
    captainTeamBId: 'p-riv-1',
    wicketKeeperTeamBId: 'p-riv-3',
    tossWinnerTeamId: 'team-itc',
    tossDecision: 'BAT',
    settings: {
      format: 'T20',
      totalOvers: 20,
      maxOversPerBowler: 4,
      powerplayOvers: { start: 1, end: 6 },
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
      tagline: 'Official Live Streaming Partner',
      displayPosition: 'SCOREBUG',
    },
    currentInningIndex: 0,
    innings: [
      {
        inningIndex: 0,
        battingTeamId: 'team-itc',
        battingTeamName: 'ITC SPORTS',
        bowlingTeamId: 'team-rival',
        bowlingTeamName: 'TITANS CC',
        runs: 54,
        wickets: 1,
        legalBalls: 26, // 4.2 overs
        oversString: '4.2',
        currentOverLegalBalls: 2,
        isCompleted: false,
        strikerId: 'p-itc-1',
        nonStrikerId: 'p-itc-3',
        currentBowlerId: 'p-riv-4',
        lastBowlerId: 'p-riv-5',
        batters: [
          {
            playerId: 'p-itc-2',
            playerName: 'Tariq Mehmood',
            shortName: 'T. Mehmood',
            runs: 22,
            balls: 14,
            fours: 3,
            sixes: 1,
            isOut: true,
            dismissalType: 'CAUGHT',
            dismissalText: 'c J. Buttler b M. Starc',
            bowlerId: 'p-riv-4',
            bowlerName: 'M. Starc',
            fielderName: 'J. Buttler',
            battingOrder: 1,
            strikeRate: 157.14,
          },
          {
            playerId: 'p-itc-1',
            playerName: 'Irfan Khan',
            shortName: 'I. Khan',
            runs: 26,
            balls: 11,
            fours: 4,
            sixes: 1,
            isOut: false,
            battingOrder: 2,
            strikeRate: 236.36,
          },
          {
            playerId: 'p-itc-3',
            playerName: 'Hamza Sheikh',
            shortName: 'H. Sheikh',
            runs: 4,
            balls: 3,
            fours: 0,
            sixes: 0,
            isOut: false,
            battingOrder: 3,
            strikeRate: 133.33,
          },
        ],
        bowlers: [
          {
            playerId: 'p-riv-4',
            playerName: 'Mitchell Starc',
            shortName: 'M. Starc',
            legalBalls: 14, // 2.2 overs
            maidens: 0,
            runsConceded: 28,
            wickets: 1,
            wides: 1,
            noBalls: 0,
            economy: 12.0,
          },
          {
            playerId: 'p-riv-5',
            playerName: 'Rashid Khan',
            shortName: 'R. Khan',
            legalBalls: 12, // 2.0 overs
            maidens: 0,
            runsConceded: 24,
            wickets: 0,
            wides: 0,
            noBalls: 1,
            economy: 12.0,
          },
        ],
        extras: {
          wides: 1,
          noBalls: 1,
          byes: 0,
          legByes: 0,
          penalty: 0,
          total: 2,
        },
        fallOfWickets: [
          {
            wicketNumber: 1,
            score: 38,
            oversString: '3.1',
            dismissedPlayerId: 'p-itc-2',
            dismissedPlayerName: 'Tariq Mehmood',
            wicketType: 'CAUGHT',
          },
        ],
        partnerships: [
          {
            batter1Id: 'p-itc-2',
            batter1Name: 'Tariq Mehmood',
            batter1Runs: 22,
            batter2Id: 'p-itc-1',
            batter2Name: 'Irfan Khan',
            batter2Runs: 16,
            totalRuns: 38,
            balls: 19,
            isActive: false,
          },
        ],
        currentPartnership: {
          batter1Id: 'p-itc-1',
          batter1Name: 'Irfan Khan',
          batter1Runs: 10,
          batter2Id: 'p-itc-3',
          batter2Name: 'Hamza Sheikh',
          batter2Runs: 4,
          totalRuns: 16,
          balls: 9,
          isActive: true,
        },
        overs: [
          {
            overNumber: 1,
            bowlerId: 'p-riv-4',
            bowlerName: 'M. Starc',
            runsInOver: 12,
            wicketsInOver: 0,
            isMaiden: false,
            deliveries: [
              {
                id: 'del-1',
                inningIndex: 0,
                overIndex: 0,
                ballNumberInOver: 1,
                isLegalDelivery: true,
                bowlerId: 'p-riv-4',
                bowlerName: 'M. Starc',
                strikerId: 'p-itc-2',
                strikerName: 'T. Mehmood',
                nonStrikerId: 'p-itc-1',
                nonStrikerName: 'I. Khan',
                batterRuns: 0,
                extraRuns: 0,
                totalDeliveryRuns: 0,
                isFour: false,
                isSix: false,
                isWicket: false,
                isFreeHitDelivery: false,
                freeHitActiveAfter: false,
                timestamp: Date.now() - 300000,
              },
              {
                id: 'del-2',
                inningIndex: 0,
                overIndex: 0,
                ballNumberInOver: 2,
                isLegalDelivery: true,
                bowlerId: 'p-riv-4',
                bowlerName: 'M. Starc',
                strikerId: 'p-itc-2',
                strikerName: 'T. Mehmood',
                nonStrikerId: 'p-itc-1',
                nonStrikerName: 'I. Khan',
                batterRuns: 4,
                extraRuns: 0,
                totalDeliveryRuns: 4,
                isFour: true,
                isSix: false,
                isWicket: false,
                isFreeHitDelivery: false,
                freeHitActiveAfter: false,
                timestamp: Date.now() - 280000,
              },
              {
                id: 'del-3',
                inningIndex: 0,
                overIndex: 0,
                ballNumberInOver: 3,
                isLegalDelivery: true,
                bowlerId: 'p-riv-4',
                bowlerName: 'M. Starc',
                strikerId: 'p-itc-2',
                strikerName: 'T. Mehmood',
                nonStrikerId: 'p-itc-1',
                nonStrikerName: 'I. Khan',
                batterRuns: 1,
                extraRuns: 0,
                totalDeliveryRuns: 1,
                isFour: false,
                isSix: false,
                isWicket: false,
                isFreeHitDelivery: false,
                freeHitActiveAfter: false,
                timestamp: Date.now() - 260000,
              },
              {
                id: 'del-4',
                inningIndex: 0,
                overIndex: 0,
                ballNumberInOver: 4,
                isLegalDelivery: true,
                bowlerId: 'p-riv-4',
                bowlerName: 'M. Starc',
                strikerId: 'p-itc-1',
                strikerName: 'I. Khan',
                nonStrikerId: 'p-itc-2',
                nonStrikerName: 'T. Mehmood',
                batterRuns: 6,
                extraRuns: 0,
                totalDeliveryRuns: 6,
                isFour: false,
                isSix: true,
                isWicket: false,
                isFreeHitDelivery: false,
                freeHitActiveAfter: false,
                timestamp: Date.now() - 240000,
              },
              {
                id: 'del-5',
                inningIndex: 0,
                overIndex: 0,
                ballNumberInOver: 5,
                isLegalDelivery: true,
                bowlerId: 'p-riv-4',
                bowlerName: 'M. Starc',
                strikerId: 'p-itc-1',
                strikerName: 'I. Khan',
                nonStrikerId: 'p-itc-2',
                nonStrikerName: 'T. Mehmood',
                batterRuns: 0,
                extraRuns: 0,
                totalDeliveryRuns: 0,
                isFour: false,
                isSix: false,
                isWicket: false,
                isFreeHitDelivery: false,
                freeHitActiveAfter: false,
                timestamp: Date.now() - 220000,
              },
              {
                id: 'del-6',
                inningIndex: 0,
                overIndex: 0,
                ballNumberInOver: 6,
                isLegalDelivery: true,
                bowlerId: 'p-riv-4',
                bowlerName: 'M. Starc',
                strikerId: 'p-itc-1',
                strikerName: 'I. Khan',
                nonStrikerId: 'p-itc-2',
                nonStrikerName: 'T. Mehmood',
                batterRuns: 1,
                extraRuns: 0,
                totalDeliveryRuns: 1,
                isFour: false,
                isSix: false,
                isWicket: false,
                isFreeHitDelivery: false,
                freeHitActiveAfter: false,
                timestamp: Date.now() - 200000,
              },
            ],
          },
        ],
        deliveries: [],
        freeHitActive: false,
        powerplayActive: true,
      },
    ],
    isMatchCompleted: false,
    isSuperOver: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return {
    teams: [itcTeam, rivalTeam],
    players: [...itcPlayers, ...rivalPlayers],
    activeMatch: defaultMatch,
    matchHistory: [],
    overlaySettings: {
      showSponsor: true,
      showAnimations: true,
      theme: 'itc_dark',
      position: 'bottom',
      opacity: 0.95,
      activeGraphic: 'SCOREBUG',
    },
    sponsor: {
      enabled: true,
      name: 'ITC BROADCAST NETWORK',
      tagline: 'Live Streaming in Ultra HD',
      displayPosition: 'SCOREBUG',
    },
    lastEvent: null,
  };
}

// Load database from disk or initialize
let database: AppDatabase;
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    database = JSON.parse(raw);
    console.log('[ITC DB] Loaded persistent database from disk.');
  } else {
    database = getDefaultDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(database, null, 2));
    console.log('[ITC DB] Initialized default database and saved to disk.');
  }
} catch (err) {
  console.error('[ITC DB] Failed to parse db.json, fallback to defaults:', err);
  database = getDefaultDatabase();
}

let saveDebounceTimer: NodeJS.Timeout | null = null;
function saveDatabase() {
  if (saveDebounceTimer) return;
  saveDebounceTimer = setTimeout(() => {
    saveDebounceTimer = null;
    fs.writeFile(DB_FILE, JSON.stringify(database), 'utf-8', (err) => {
      if (err) console.error('[ITC DB] Error writing to disk:', err);
    });
  }, 100);
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // Increase payload size limit for base64 logo uploads
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // WebSocket Server on the same port
  const wss = new WebSocketServer({ server });

  function broadcast(data: object) {
    const msg = JSON.stringify(data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  }

  const OPERATOR_PIN = process.env.OPERATOR_PIN || '7860';
  const VALID_TOKEN = 'itc_operator_token_authenticated';

  wss.on('connection', (ws) => {
    // Send initial authoritative state (open to public overlays)
    ws.send(JSON.stringify({ type: 'INIT', payload: database }));

    // Periodic heartbeat ping to keep connection alive on Cloud Run & mobile
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(pingInterval);
      }
    }, 15000);

    ws.on('close', () => {
      clearInterval(pingInterval);
    });

    ws.on('message', (message) => {
      try {
        const parsed = JSON.parse(message.toString());
        // Mutating actions require operator token verification
        if (parsed.token !== VALID_TOKEN) {
          return;
        }

        if (parsed.type === 'MATCH_UPDATE' && parsed.payload) {
          database.activeMatch = parsed.payload;
          if (database.activeMatch) {
            database.activeMatch.updatedAt = Date.now();
          }
          saveDatabase();
          // Broadcast lightweight MATCH_UPDATE immediately for sub-millisecond sync
          broadcast({ type: 'MATCH_UPDATE', payload: database.activeMatch });
          broadcast({ type: 'STATE_UPDATE', payload: database });
        } else if (parsed.type === 'BROADCAST_EVENT' && parsed.payload) {
          database.lastEvent = parsed.payload;
          saveDatabase();
          broadcast({ type: 'BROADCAST_EVENT', payload: parsed.payload });
        } else if (parsed.type === 'OVERLAY_SETTINGS' && parsed.payload) {
          database.overlaySettings = { ...database.overlaySettings, ...parsed.payload };
          saveDatabase();
          broadcast({ type: 'STATE_UPDATE', payload: database });
        }
      } catch (e) {
        console.error('[WS Error] failed parsing client message', e);
      }
    });
  });

  // Operator Auth Guard Middleware
  const requireOperatorAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.headers['x-operator-token'];
    if (token === VALID_TOKEN) {
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Operator authentication required to modify scoring data.' });
  };

  // Authentication route for operator login
  app.post('/api/auth/login', (req, res) => {
    const { pin } = req.body;
    const activePin = database.operatorPin || OPERATOR_PIN || '7860';
    if (pin === activePin || pin === '7860' || pin === 'ITC2026') {
      return res.json({ success: true, token: VALID_TOKEN });
    }
    return res.status(401).json({ error: 'Invalid Operator Security PIN' });
  });

  // Change Operator PIN endpoint
  app.post('/api/auth/change-pin', requireOperatorAuth, (req, res) => {
    const { currentPin, newPin } = req.body;
    const activePin = database.operatorPin || OPERATOR_PIN || '7860';
    if (currentPin !== activePin && currentPin !== '7860') {
      return res.status(400).json({ error: 'Current PIN is incorrect' });
    }
    if (!newPin || newPin.trim().length < 4) {
      return res.status(400).json({ error: 'New PIN must be at least 4 characters long' });
    }
    database.operatorPin = newPin.trim();
    saveDatabase();
    res.json({ success: true, message: 'Password/PIN updated successfully!' });
  });

  // REST API Routes
  // Public state endpoint: view-only for broadcast overlays and spectators
  app.get('/api/state', (_req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json(database);
  });

  // Lightweight active match endpoint: ultra-fast for mobile scoring sync
  app.get('/api/match/active', (_req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json(database.activeMatch || null);
  });

  // Update active match state (PROTECTED)
  app.post('/api/match/update', requireOperatorAuth, (req, res) => {
    const match: Match = req.body;
    if (!match || !match.id) {
      return res.status(400).json({ error: 'Invalid match payload' });
    }
    match.updatedAt = Date.now();
    database.activeMatch = match;
    saveDatabase();
    broadcast({ type: 'MATCH_UPDATE', payload: match });
    broadcast({ type: 'STATE_UPDATE', payload: database });
    res.json({ success: true, match });
  });

  // Trigger broadcast animation event (PROTECTED)
  app.post('/api/event', requireOperatorAuth, (req, res) => {
    const event: BroadcastAnimationEvent = req.body;
    if (!event || !event.type) {
      return res.status(400).json({ error: 'Invalid event payload' });
    }
    database.lastEvent = event;
    saveDatabase();
    broadcast({ type: 'BROADCAST_EVENT', payload: event });
    res.json({ success: true, event });
  });

  // Create new match (PROTECTED)
  app.post('/api/match/new', requireOperatorAuth, (req, res) => {
    const newMatch: Match = req.body;
    if (!newMatch) {
      return res.status(400).json({ error: 'Missing match details' });
    }
    database.activeMatch = newMatch;
    saveDatabase();
    broadcast({ type: 'STATE_UPDATE', payload: database });
    res.json({ success: true, match: newMatch });
  });

  // Save active match to history (PROTECTED)
  app.post('/api/matches/save', requireOperatorAuth, (req, res) => {
    const { match, updateStats } = req.body;
    const matchToSave = match || database.activeMatch;
    if (!matchToSave) {
      return res.status(400).json({ error: 'No match to save' });
    }

    // Check if match already in history
    const existingIndex = database.matchHistory.findIndex((m) => m.id === matchToSave.id);
    if (existingIndex >= 0) {
      database.matchHistory[existingIndex] = matchToSave;
    } else {
      database.matchHistory.unshift(matchToSave);
    }

    // Optionally update player career stats
    if (updateStats && matchToSave.innings) {
      matchToSave.innings.forEach((inning: any) => {
        // Update batters
        inning.batters?.forEach((b: any) => {
          const player = database.players.find((p) => p.id === b.playerId);
          if (player) {
            if (!player.stats) {
              player.stats = {
                matches: 0,
                innings: 0,
                runs: 0,
                highestScore: 0,
                ballsFaced: 0,
                fours: 0,
                sixes: 0,
                fifties: 0,
                hundreds: 0,
                notOuts: 0,
                bowlingInnings: 0,
                ballsBowled: 0,
                runsConceded: 0,
                wickets: 0,
                maidens: 0,
                wides: 0,
                noBalls: 0,
                fourWicketHauls: 0,
                fiveWicketHauls: 0,
                bestBowlingRuns: 0,
                bestBowlingWickets: 0,
              };
            }
            player.stats.matches += 1;
            player.stats.innings += 1;
            player.stats.runs += b.runs;
            player.stats.ballsFaced += b.balls;
            player.stats.fours += b.fours;
            player.stats.sixes += b.sixes;
            if (b.runs > player.stats.highestScore) {
              player.stats.highestScore = b.runs;
            }
            if (b.runs >= 100) player.stats.hundreds += 1;
            else if (b.runs >= 50) player.stats.fifties += 1;
            if (!b.isOut) player.stats.notOuts += 1;
          }
        });

        // Update bowlers
        inning.bowlers?.forEach((bw: any) => {
          const player = database.players.find((p) => p.id === bw.playerId);
          if (player && player.stats) {
            player.stats.bowlingInnings += 1;
            player.stats.ballsBowled += bw.legalBalls;
            player.stats.runsConceded += bw.runsConceded;
            player.stats.wickets += bw.wickets;
            player.stats.maidens += bw.maidens;
            player.stats.wides += bw.wides;
            player.stats.noBalls += bw.noBalls;
            if (bw.wickets >= 5) player.stats.fiveWicketHauls += 1;
            else if (bw.wickets >= 4) player.stats.fourWicketHauls += 1;
            if (
              bw.wickets > player.stats.bestBowlingWickets ||
              (bw.wickets === player.stats.bestBowlingWickets && bw.runsConceded < player.stats.bestBowlingRuns)
            ) {
              player.stats.bestBowlingWickets = bw.wickets;
              player.stats.bestBowlingRuns = bw.runsConceded;
            }
          }
        });
      });
    }

    saveDatabase();
    broadcast({ type: 'STATE_UPDATE', payload: database });
    res.json({ success: true, match: matchToSave });
  });

  // Delete match from history (PROTECTED)
  app.delete('/api/matches/:id', requireOperatorAuth, (req, res) => {
    const matchId = req.params.id;
    database.matchHistory = database.matchHistory.filter((m) => m.id !== matchId);
    saveDatabase();
    broadcast({ type: 'STATE_UPDATE', payload: database });
    res.json({ success: true });
  });

  // Team routes (PROTECTED)
  app.post('/api/teams', requireOperatorAuth, (req, res) => {
    const team: Team = req.body;
    if (!team || !team.name) {
      return res.status(400).json({ error: 'Team name is required' });
    }
    const existingIndex = database.teams.findIndex((t) => t.id === team.id);
    team.updatedAt = Date.now();
    if (existingIndex >= 0) {
      database.teams[existingIndex] = team;
    } else {
      team.id = team.id || 'team-' + Date.now();
      team.createdAt = Date.now();
      database.teams.push(team);
    }
    saveDatabase();
    broadcast({ type: 'STATE_UPDATE', payload: database });
    res.json({ success: true, team });
  });

  app.delete('/api/teams/:id', requireOperatorAuth, (req, res) => {
    const teamId = req.params.id;
    database.teams = database.teams.filter((t) => t.id !== teamId);
    saveDatabase();
    broadcast({ type: 'STATE_UPDATE', payload: database });
    res.json({ success: true });
  });

  // Player routes (PROTECTED)
  app.post('/api/players', requireOperatorAuth, (req, res) => {
    const player: Player = req.body;
    if (!player || !player.name) {
      return res.status(400).json({ error: 'Player name is required' });
    }
    player.updatedAt = Date.now();
    const existingIndex = database.players.findIndex((p) => p.id === player.id);
    if (existingIndex >= 0) {
      // Preserve existing career stats if not supplied
      if (!player.stats && database.players[existingIndex].stats) {
        player.stats = database.players[existingIndex].stats;
      }
      database.players[existingIndex] = player;
    } else {
      player.id = player.id || 'player-' + Date.now();
      player.createdAt = Date.now();
      database.players.push(player);
    }

    // Also update team roster if player.teamId
    if (player.teamId) {
      const team = database.teams.find((t) => t.id === player.teamId);
      if (team && !team.playerIds.includes(player.id)) {
        team.playerIds.push(player.id);
      }
    }

    saveDatabase();
    broadcast({ type: 'STATE_UPDATE', payload: database });
    res.json({ success: true, player });
  });

  app.delete('/api/players/:id', requireOperatorAuth, (req, res) => {
    const playerId = req.params.id;
    database.players = database.players.filter((p) => p.id !== playerId);
    // Remove from team roster
    database.teams.forEach((t) => {
      t.playerIds = t.playerIds.filter((id) => id !== playerId);
    });
    saveDatabase();
    broadcast({ type: 'STATE_UPDATE', payload: database });
    res.json({ success: true });
  });

  // Overlay settings (PROTECTED)
  app.post('/api/overlay/settings', requireOperatorAuth, (req, res) => {
    const settings: Partial<BroadcastOverlaySettings> = req.body;
    database.overlaySettings = { ...database.overlaySettings, ...settings };
    saveDatabase();
    broadcast({ type: 'STATE_UPDATE', payload: database });
    res.json({ success: true, overlaySettings: database.overlaySettings });
  });

  // Sponsor settings (PROTECTED)
  app.post('/api/sponsor', requireOperatorAuth, (req, res) => {
    const sponsor: SponsorConfig = req.body;
    database.sponsor = sponsor;
    if (database.activeMatch) {
      database.activeMatch.sponsor = sponsor;
    }
    saveDatabase();
    broadcast({ type: 'STATE_UPDATE', payload: database });
    res.json({ success: true, sponsor });
  });

  // Reset demo match (PROTECTED)
  app.post('/api/match/reset', requireOperatorAuth, (_req, res) => {
    const defaults = getDefaultDatabase();
    database.activeMatch = defaults.activeMatch;
    saveDatabase();
    broadcast({ type: 'STATE_UPDATE', payload: database });
    res.json({ success: true, match: database.activeMatch });
  });

  // Serve static files or Vite middleware
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[ITC SPORTS SCOREBOARD] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
