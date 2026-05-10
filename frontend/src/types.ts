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
  description?: string;
  startTime: number;
  submittedCount: number;
  submissions: Submission[];
}

export interface LeaderboardEntry {
  playerId: string;
  name: string;
  score: number;
}

export type Category = "general" | "chess" | "animals" | "food";

export interface CategoryConfig {
  label: string;
  description: string;
}

export const CATEGORY_CONFIG: Record<Category, CategoryConfig> = {
  general: { label: "General", description: "Everyday English words" },
  chess: { label: "Chess", description: "Chess pieces, tactics & strategy" },
  animals: { label: "Animals", description: "Creatures from around the world" },
  food: { label: "Food", description: "Ingredients, dishes & flavors" },
};

export const CATEGORIES = Object.keys(CATEGORY_CONFIG) as Category[];

export interface RoomSettings {
  totalRounds: number;
  roundDurationSec: number;
  wordLength: "any" | "short" | "medium" | "long";
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
}

export interface RoomState {
  roomCode: string;
  category: Category;
  settings: RoomSettings;
  phase: "lobby" | "countdown" | "active" | "reveal" | "leaderboard" | "finished";
  players: Player[];
  scores: Record<string, number>;
  roundNumber: number;
  totalRounds: number;
  currentRound: RoundInfo | null;
  leaderboard: LeaderboardEntry[];
}
