import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { RoomState, Category, RoomSettings, ChatMessage } from "../types";

const SERVER = import.meta.env.VITE_SERVER_URL ?? "http://localhost:3001";

export interface SubmitResult {
  result: "accepted" | "invalid" | "already_submitted" | "not_active" | "profanity";
  word: string;
  remainingAttempts: number;
  pointsEarned: number;
}

export interface SubmissionCount {
  count: number;
  total: number;
}

export interface GameNotification {
  id: number;
  playerName: string;
  variant: "solved" | "left";
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSubmit, setLastSubmit] = useState<SubmitResult | null>(null);
  const [submissionCount, setSubmissionCount] = useState<SubmissionCount | null>(null);
  const [toasts, setToasts] = useState<GameNotification[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const socket = io(SERVER, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("room:joined", ({ roomCode: code, playerId: pid }: { roomCode: string; playerId: string }) => {
      setRoomCode(code);
      setPlayerId(pid);
      setError(null);
      setChatMessages([]);
    });

    socket.on("room:state", (state: RoomState) => {
      setRoomState((prev) => {
        if (prev?.roundNumber !== state.roundNumber || prev?.phase !== state.phase) {
          setLastSubmit(null);
        }
        return state;
      });
    });
    socket.on("room:error", ({ message }: { message: string }) => setError(message));
    socket.on("game:submit:result", (r: SubmitResult) => setLastSubmit(r));
    socket.on("game:submission:count", (c: SubmissionCount) => setSubmissionCount(c));

    socket.on("chat:message", (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev.slice(-99), msg]);
    });

    const addToast = (playerName: string, variant: GameNotification["variant"]) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, playerName, variant }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
    };

    socket.on("game:player:solved", ({ playerName }: { playerName: string }) =>
      addToast(playerName, "solved")
    );
    socket.on("game:player:left", ({ playerName }: { playerName: string }) =>
      addToast(playerName, "left")
    );

    return () => { socket.disconnect(); };
  }, []);

  const createRoom = (playerName: string, category: Category = "general", settings?: Partial<RoomSettings>) =>
    socketRef.current?.emit("room:create", { playerName, category, settings });

  const joinRoom = (code: string, playerName: string) =>
    socketRef.current?.emit("room:join", { roomCode: code, playerName });

  const startGame = () =>
    roomCode && socketRef.current?.emit("game:start", { roomCode });

  const restartGame = () =>
    roomCode && socketRef.current?.emit("game:restart", { roomCode });

  const submitAnswer = (word: string) =>
    roomCode && socketRef.current?.emit("game:submit", { roomCode, word });

  const sendChatMessage = (text: string) =>
    roomCode && socketRef.current?.emit("chat:send", { roomCode, text });

  return {
    connected,
    roomState,
    playerId,
    roomCode,
    error,
    lastSubmit,
    submissionCount,
    toasts,
    chatMessages,
    createRoom,
    joinRoom,
    startGame,
    restartGame,
    submitAnswer,
    sendChatMessage,
    clearError: () => setError(null),
    clearSubmit: () => setLastSubmit(null),
  };
}
