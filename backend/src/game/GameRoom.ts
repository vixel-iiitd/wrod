import { generatePattern } from "./PatternGenerator";
import { validateWord } from "./WordValidator";
import { calcPoints, buildLeaderboard, Submission } from "./GameEngine";
import { game, RoomSettings, DEFAULT_SETTINGS } from "../config/game";
import { Category, DEFAULT_CATEGORY, getCategoryWords, getWordDescription } from "../config/categories";
import { isProfane, filterCleanWords } from "../utils/profanity";

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

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
}

export interface RoundState {
  roundNumber: number;
  pattern: string;
  answer: string;
  description: string | null;
  startTime: number;
  submissions: Submission[];
  submittedIds: Set<string>;
  attemptsCount: Map<string, number>;
  lastAttemptWord: Map<string, string>;
}

export class GameRoom {
  roomCode: string;
  category: Category;
  settings: RoomSettings;
  phase: GamePhase = "lobby";
  players: Map<string, Player> = new Map();
  scores: Record<string, number> = {};
  currentRound: RoundState | null = null;
  roundNumber = 0;
  chatMessages: ChatMessage[] = [];
  private categoryWords: string[];
  private categoryWordSet: Set<string>;
  private phaseTimer: NodeJS.Timeout | null = null;
  private onPhaseChange: (room: GameRoom) => void;

  constructor(
    roomCode: string,
    onPhaseChange: (room: GameRoom) => void,
    category: Category = DEFAULT_CATEGORY,
    settings: RoomSettings = DEFAULT_SETTINGS
  ) {
    this.roomCode = roomCode;
    this.category = category;
    this.settings = settings;
    this.onPhaseChange = onPhaseChange;
    const allWords = filterCleanWords(getCategoryWords(category));
    this.categoryWords = this.filterWordsByLength(allWords, settings.wordLength);
    this.categoryWordSet = new Set(allWords);
  }

  private filterWordsByLength(words: string[], length: RoomSettings["wordLength"]): string[] {
    if (length === "any") return words;
    if (length === "short") return words.filter(w => w.length >= 3 && w.length <= 5);
    if (length === "medium") return words.filter(w => w.length >= 5 && w.length <= 8);
    if (length === "long") return words.filter(w => w.length >= 7);
    return words;
  }

  addPlayer(player: Player) {
    this.players.set(player.id, player);
    this.scores[player.id] = this.scores[player.id] ?? 0;
  }

  removePlayer(id: string) {
    this.players.delete(id);
  }

  addChatMessage(playerId: string, text: string): ChatMessage | null {
    const player = this.players.get(playerId);
    if (!player) return null;
    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      playerId,
      playerName: player.name,
      text: text.slice(0, 200),
      timestamp: Date.now(),
    };
    this.chatMessages.push(msg);
    if (this.chatMessages.length > 100) this.chatMessages.shift();
    return msg;
  }

  startGame() {
    if (this.phase !== "lobby") return;
    this.roundNumber = 0;
    this.scores = {};
    this.players.forEach((p) => (this.scores[p.id] = 0));
    this.transitionTo("countdown");
  }

  restartGame(requesterId: string): boolean {
    if (this.phase !== "finished") return false;
    const player = this.players.get(requesterId);
    if (!player?.isHost) return false;
    this.roundNumber = 0;
    this.scores = {};
    this.players.forEach((p) => (this.scores[p.id] = 0));
    this.currentRound = null;
    this.transitionTo("countdown");
    return true;
  }

  submitAnswer(playerId: string, word: string): {
    status: "accepted" | "invalid" | "already_submitted" | "not_active" | "profanity";
    remainingAttempts: number;
    pointsEarned: number;
  } {
    if (this.phase !== "active" || !this.currentRound) {
      return { status: "not_active", remainingAttempts: 0, pointsEarned: 0 };
    }
    if (this.currentRound.submittedIds.has(playerId)) {
      return { status: "already_submitted", remainingAttempts: 0, pointsEarned: 0 };
    }

    if (isProfane(word)) {
      const penalty = game.scoring.incorrectPenalty;
      this.scores[playerId] = Math.max(0, (this.scores[playerId] ?? 0) - penalty);
      const prevAttempts = this.currentRound.attemptsCount.get(playerId) ?? 0;
      const newAttempts = prevAttempts + 1;
      this.currentRound.attemptsCount.set(playerId, newAttempts);
      this.currentRound.lastAttemptWord.set(playerId, word);
      const remainingAttempts = game.maxAttempts - newAttempts;
      if (remainingAttempts <= 0) {
        this.currentRound.submittedIds.add(playerId);
        const player = this.players.get(playerId);
        this.currentRound.submissions.push({
          playerId,
          playerName: player?.name ?? playerId,
          word: "***",
          timestamp: Date.now() - this.currentRound.startTime,
          points: -(newAttempts * penalty),
          valid: false,
        });
        if (this.currentRound.submittedIds.size >= this.players.size) {
          this.clearTimer();
          this.transitionTo("reveal");
        }
      }
      return { status: "profanity", remainingAttempts: Math.max(0, remainingAttempts), pointsEarned: -penalty };
    }

    const elapsed = Date.now() - this.currentRound.startTime;
    const valid = validateWord(word, this.currentRound.pattern, this.categoryWordSet);
    const player = this.players.get(playerId);
    const prevAttempts = this.currentRound.attemptsCount.get(playerId) ?? 0;
    const newAttempts = prevAttempts + 1;

    this.currentRound.attemptsCount.set(playerId, newAttempts);
    this.currentRound.lastAttemptWord.set(playerId, word);

    if (valid) {
      const points = Math.max(
        game.scoring.minPoints,
        calcPoints(elapsed, this.settings.roundDurationSec * 1000)
      );
      this.currentRound.submittedIds.add(playerId);
      this.currentRound.submissions.push({
        playerId,
        playerName: player?.name ?? playerId,
        word,
        timestamp: elapsed,
        points,
        valid: true,
      });
      this.scores[playerId] = (this.scores[playerId] ?? 0) + points;

      if (this.currentRound.submittedIds.size >= this.players.size) {
        this.clearTimer();
        this.transitionTo("reveal");
      }
      return { status: "accepted", remainingAttempts: 0, pointsEarned: points };
    }

    // Wrong attempt — deduct one penalty unit from running score
    const penalty = game.scoring.incorrectPenalty;
    this.scores[playerId] = Math.max(0, (this.scores[playerId] ?? 0) - penalty);
    const remainingAttempts = game.maxAttempts - newAttempts;

    if (remainingAttempts <= 0) {
      // Attempts exhausted — lock player out, record for reveal
      this.currentRound.submittedIds.add(playerId);
      this.currentRound.submissions.push({
        playerId,
        playerName: player?.name ?? playerId,
        word,
        timestamp: elapsed,
        points: -(newAttempts * penalty),
        valid: false,
      });

      if (this.currentRound.submittedIds.size >= this.players.size) {
        this.clearTimer();
        this.transitionTo("reveal");
      }
      return { status: "invalid", remainingAttempts: 0, pointsEarned: -penalty };
    }

    return { status: "invalid", remainingAttempts, pointsEarned: -penalty };
  }

  getLeaderboard() {
    const names: Record<string, string> = {};
    this.players.forEach((p) => (names[p.id] = p.name));
    return buildLeaderboard(this.scores, names);
  }

  private finalizeRound() {
    if (!this.currentRound) return;
    // Record any player who had wrong attempts but wasn't fully locked out (time ran out on them)
    this.players.forEach((player) => {
      if (this.currentRound!.submittedIds.has(player.id)) return;
      const attempts = this.currentRound!.attemptsCount.get(player.id) ?? 0;
      if (attempts === 0) return;
      const lastWord = this.currentRound!.lastAttemptWord.get(player.id) ?? "?";
      this.currentRound!.submissions.push({
        playerId: player.id,
        playerName: player.name,
        word: lastWord,
        timestamp: Date.now() - this.currentRound!.startTime,
        points: -(attempts * game.scoring.incorrectPenalty),
        valid: false,
      });
    });
  }

  private transitionTo(phase: GamePhase) {
    this.clearTimer();
    this.phase = phase;
    const roundDurationMs = this.settings.roundDurationSec * 1000;

    if (phase === "countdown") {
      this.phaseTimer = setTimeout(() => this.transitionTo("active"), game.countdownMs);
    } else if (phase === "active") {
      this.roundNumber++;
      const wordPool = this.categoryWords.length >= 5 ? this.categoryWords : getCategoryWords(this.category);
      const { pattern, answer } = generatePattern(wordPool);
      this.currentRound = {
        roundNumber: this.roundNumber,
        pattern,
        answer,
        description: getWordDescription(this.category, answer) ?? null,
        startTime: Date.now(),
        submissions: [],
        submittedIds: new Set(),
        attemptsCount: new Map(),
        lastAttemptWord: new Map(),
      };
      this.phaseTimer = setTimeout(() => this.transitionTo("reveal"), roundDurationMs);
    } else if (phase === "reveal") {
      this.finalizeRound();
      this.phaseTimer = setTimeout(() => this.transitionTo("leaderboard"), game.revealDurationMs);
    } else if (phase === "leaderboard") {
      if (this.roundNumber >= this.settings.totalRounds) {
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
      category: this.category,
      settings: this.settings,
      phase: this.phase,
      players: Array.from(this.players.values()),
      scores: this.scores,
      roundNumber: this.roundNumber,
      totalRounds: this.settings.totalRounds,
      currentRound: this.currentRound
        ? {
            roundNumber: this.currentRound.roundNumber,
            pattern: this.currentRound.pattern,
            answer: (this.phase === "reveal" || this.phase === "leaderboard" || this.phase === "finished")
              ? this.currentRound.answer
              : undefined,
            description: (this.phase === "reveal" || this.phase === "leaderboard" || this.phase === "finished")
              ? this.currentRound.description ?? undefined
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
