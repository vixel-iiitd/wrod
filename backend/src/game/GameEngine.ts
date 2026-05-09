import { game } from "../config/game";

export interface Submission {
  playerId: string;
  playerName: string;
  word: string;
  timestamp: number; // ms since round started
  points: number;
  valid: boolean;
}

export function calcPoints(elapsedMs: number): number {
  const { maxPoints, minPoints } = game.scoring;
  const fraction = Math.min(elapsedMs / game.roundDurationMs, 1);
  const points = Math.round(maxPoints - (maxPoints - minPoints) * fraction);
  return points;
}

export function buildLeaderboard(
  scores: Record<string, number>,
  playerNames: Record<string, string>
): Array<{ playerId: string; name: string; score: number }> {
  return Object.entries(scores)
    .map(([playerId, score]) => ({ playerId, name: playerNames[playerId] ?? playerId, score }))
    .sort((a, b) => b.score - a.score);
}
