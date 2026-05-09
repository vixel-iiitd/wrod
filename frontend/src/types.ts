export interface Player {
  id: string;
  name: string;
  isHost: boolean;
}

export interface Submission {
  playerId: string;
  playerName: string;
  word: string;
  timestamp: number;
  points: number;
  valid: boolean;
}

export interface RoundInfo {
  roundNumber: number;
  pattern: string;
  answer?: string;
  startTime: number;
  submittedCount: number;
  submissions: Submission[];
}

export interface LeaderboardEntry {
  playerId: string;
  name: string;
  score: number;
}

export interface RoomState {
  roomCode: string;
  phase: "lobby" | "countdown" | "active" | "reveal" | "leaderboard" | "finished";
  players: Player[];
  scores: Record<string, number>;
  roundNumber: number;
  totalRounds: number;
  currentRound: RoundInfo | null;
  leaderboard: LeaderboardEntry[];
}
