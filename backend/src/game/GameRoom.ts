import { generatePattern } from "./PatternGenerator";
import { validateWord } from "./WordValidator";
import { calcPoints, buildLeaderboard, Submission } from "./GameEngine";
import { game } from "../config/game";

export type GamePhase =
  | "lobby"
  | "countdown"
  | "active"
  | "reveal"
  | "leaderboard"
  | "finished";

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
}

export interface RoundState {
  roundNumber: number;
  pattern: string;
  answer: string;
  startTime: number;
  submissions: Submission[];
  submittedIds: Set<string>;
}


export class GameRoom {
  roomCode: string;
  phase: GamePhase = "lobby";
  players: Map<string, Player> = new Map();
  scores: Record<string, number> = {};
  currentRound: RoundState | null = null;
  roundNumber = 0;
  private phaseTimer: NodeJS.Timeout | null = null;
  private onPhaseChange: (room: GameRoom) => void;

  constructor(roomCode: string, onPhaseChange: (room: GameRoom) => void) {
    this.roomCode = roomCode;
    this.onPhaseChange = onPhaseChange;
  }

  addPlayer(player: Player) {
    this.players.set(player.id, player);
    this.scores[player.id] = this.scores[player.id] ?? 0;
  }

  removePlayer(id: string) {
    this.players.delete(id);
  }

  startGame() {
    if (this.phase !== "lobby") return;
    this.roundNumber = 0;
    this.scores = {};
    this.players.forEach((p) => (this.scores[p.id] = 0));
    this.transitionTo("countdown");
  }

  submitAnswer(playerId: string, word: string): "accepted" | "invalid" | "already_submitted" | "not_active" {
    if (this.phase !== "active" || !this.currentRound) return "not_active";
    if (this.currentRound.submittedIds.has(playerId)) return "already_submitted";

    const elapsed = Date.now() - this.currentRound.startTime;
    const valid = validateWord(word, this.currentRound.pattern);
    const points = valid ? calcPoints(elapsed) : 0;
    const player = this.players.get(playerId);

    this.currentRound.submittedIds.add(playerId);
    this.currentRound.submissions.push({
      playerId,
      playerName: player?.name ?? playerId,
      word,
      timestamp: elapsed,
      points,
      valid,
    });

    if (valid) this.scores[playerId] = (this.scores[playerId] ?? 0) + points;

    // If everyone has submitted, end round early
    if (this.currentRound.submittedIds.size >= this.players.size) {
      this.clearTimer();
      this.transitionTo("reveal");
    }

    return valid ? "accepted" : "invalid";
  }

  getLeaderboard() {
    const names: Record<string, string> = {};
    this.players.forEach((p) => (names[p.id] = p.name));
    return buildLeaderboard(this.scores, names);
  }

  private transitionTo(phase: GamePhase) {
    this.clearTimer();
    this.phase = phase;

    if (phase === "countdown") {
      this.phaseTimer = setTimeout(() => this.transitionTo("active"), game.countdownMs);
    } else if (phase === "active") {
      this.roundNumber++;
      const { pattern, answer } = generatePattern();
      this.currentRound = {
        roundNumber: this.roundNumber,
        pattern,
        answer,
        startTime: Date.now(),
        submissions: [],
        submittedIds: new Set(),
      };
      this.phaseTimer = setTimeout(() => this.transitionTo("reveal"), game.roundDurationMs);
    } else if (phase === "reveal") {
      this.phaseTimer = setTimeout(() => this.transitionTo("leaderboard"), game.revealDurationMs);
    } else if (phase === "leaderboard") {
      if (this.roundNumber >= game.totalRounds) {
        this.phaseTimer = setTimeout(() => this.transitionTo("finished"), game.leaderboardDurationMs);
      } else {
        this.phaseTimer = setTimeout(() => this.transitionTo("countdown"), game.leaderboardDurationMs);
      }
    }

    this.onPhaseChange(this);
  }

  private clearTimer() {
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }
  }

  toJSON() {
    return {
      roomCode: this.roomCode,
      phase: this.phase,
      players: Array.from(this.players.values()),
      scores: this.scores,
      roundNumber: this.roundNumber,
      totalRounds: game.totalRounds,
      currentRound: this.currentRound
        ? {
            roundNumber: this.currentRound.roundNumber,
            pattern: this.currentRound.pattern,
            answer: (this.phase === "reveal" || this.phase === "leaderboard" || this.phase === "finished")
              ? this.currentRound.answer
              : undefined,
            startTime: this.currentRound.startTime,
            submittedCount: this.currentRound.submittedIds.size,
            submissions: this.phase === "reveal" || this.phase === "leaderboard" || this.phase === "finished"
              ? this.currentRound.submissions
              : [],
          }
        : null,
      leaderboard: this.getLeaderboard(),
    };
  }
}
