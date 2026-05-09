import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { RoomState, Category } from "../types";

const SERVER = import.meta.env.VITE_SERVER_URL ?? "http://localhost:3001";

export interface SubmitResult {
  result: "accepted" | "invalid" | "already_submitted" | "not_active";
  word: string;
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

  useEffect(() => {
    const socket = io(SERVER, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("room:joined", ({ roomCode: code, playerId: pid }: { roomCode: string; playerId: string }) => {
      setRoomCode(code);
      setPlayerId(pid);
      setError(null);
    });

    socket.on("room:state", (state: RoomState) => setRoomState(state));
    socket.on("room:error", ({ message }: { message: string }) => setError(message));
    socket.on("game:submit:result", (r: SubmitResult) => setLastSubmit(r));
    socket.on("game:submission:count", (c: SubmissionCount) => setSubmissionCount(c));

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

  const createRoom = (playerName: string, category: Category = "general") =>
    socketRef.current?.emit("room:create", { playerName, category });

  const joinRoom = (code: string, playerName: string) =>
    socketRef.current?.emit("room:join", { roomCode: code, playerName });

  const startGame = () =>
    roomCode && socketRef.current?.emit("game:start", { roomCode });

  const submitAnswer = (word: string) =>
    roomCode && socketRef.current?.emit("game:submit", { roomCode, word });

  return {
    connected,
    roomState,
    playerId,
    roomCode,
    error,
    lastSubmit,
    submissionCount,
    toasts,
    createRoom,
    joinRoom,
    startGame,
    submitAnswer,
    clearError: () => setError(null),
    clearSubmit: () => setLastSubmit(null),
  };
}
