export const game = {
  totalRounds: 8,
  roundDurationMs: 15_000,
  revealDurationMs: 5_000,
  leaderboardDurationMs: 4_000,
  countdownMs: 3_000,
  maxAttempts: 3,
  scoring: {
    maxPoints: 100,
    minPoints: 10,
    incorrectPenalty: 15,
  },
};

export interface RoomSettings {
  totalRounds: number;
  roundDurationSec: number;
  wordLength: "any" | "short" | "medium" | "long";
}

export const DEFAULT_SETTINGS: RoomSettings = {
  totalRounds: 8,
  roundDurationSec: 15,
  wordLength: "any",
};
