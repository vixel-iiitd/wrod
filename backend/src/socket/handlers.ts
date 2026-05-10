import { Server, Socket } from "socket.io";
import { GameRoom } from "../game/GameRoom";
import { getRoom, setRoom, deleteRoom } from "../store/redis";
import { Category, DEFAULT_CATEGORY } from "../config/categories";
import { RoomSettings, DEFAULT_SETTINGS } from "../config/game";

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function broadcastRoomState(io: Server, room: GameRoom) {
  io.to(room.roomCode).emit("room:state", room.toJSON());
}

export function registerHandlers(io: Server, socket: Socket) {
  socket.on("room:create", ({
    playerName,
    category,
    settings,
  }: {
    playerName: string;
    category?: Category;
    settings?: Partial<RoomSettings>;
  }) => {
    let code = generateRoomCode();
    while (getRoom(code)) code = generateRoomCode();

    const resolvedSettings: RoomSettings = { ...DEFAULT_SETTINGS, ...settings };
    const room = new GameRoom(code, (r) => broadcastRoomState(io, r), category ?? DEFAULT_CATEGORY, resolvedSettings);
    room.addPlayer({ id: socket.id, name: playerName, isHost: true });
    setRoom(code, room);

    socket.join(code);
    socket.emit("room:joined", { roomCode: code, playerId: socket.id });
    broadcastRoomState(io, room);
  });

  socket.on("room:join", ({ roomCode, playerName }: { roomCode: string; playerName: string }) => {
    const code = roomCode.toUpperCase();
    const room = getRoom(code);
    if (!room) {
      socket.emit("room:error", { message: "Room not found" });
      return;
    }
    if (room.phase !== "lobby") {
      socket.emit("room:error", { message: "Game already in progress" });
      return;
    }

    room.addPlayer({ id: socket.id, name: playerName, isHost: false });
    socket.join(code);
    socket.emit("room:joined", { roomCode: code, playerId: socket.id });
    broadcastRoomState(io, room);
  });

  socket.on("game:start", ({ roomCode }: { roomCode: string }) => {
    const room = getRoom(roomCode);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player?.isHost) {
      socket.emit("room:error", { message: "Only the host can start the game" });
      return;
    }
    room.startGame();
  });

  socket.on("game:restart", ({ roomCode }: { roomCode: string }) => {
    const room = getRoom(roomCode);
    if (!room) return;
    const ok = room.restartGame(socket.id);
    if (!ok) {
      socket.emit("room:error", { message: "Only the host can restart the game" });
    }
  });

  socket.on("game:submit", ({ roomCode, word }: { roomCode: string; word: string }) => {
    const room = getRoom(roomCode);
    if (!room) return;

    const { status, remainingAttempts, pointsEarned } = room.submitAnswer(socket.id, word.trim());

    socket.emit("game:submit:result", { result: status, word, remainingAttempts, pointsEarned });

    if (status === "accepted") {
      const player = room.players.get(socket.id);
      socket.to(roomCode).emit("game:player:solved", { playerName: player?.name ?? "Someone" });
    }

    if (status !== "not_active" && status !== "already_submitted") {
      io.to(roomCode).emit("game:submission:count", {
        count: room.currentRound?.submittedIds.size ?? 0,
        total: room.players.size,
      });
      broadcastRoomState(io, room);
    }
  });

  socket.on("chat:send", ({ roomCode, text }: { roomCode: string; text: string }) => {
    if (!text?.trim()) return;
    const room = getRoom(roomCode);
    if (!room) return;
    const msg = room.addChatMessage(socket.id, text.trim());
    if (msg) {
      io.to(roomCode).emit("chat:message", msg);
    }
  });

  socket.on("disconnect", () => {
    for (const code of [...require("../store/redis").listRooms()]) {
      const room = getRoom(code);
      if (!room) continue;
      if (!room.players.has(socket.id)) continue;

      const leavingPlayer = room.players.get(socket.id);
      room.removePlayer(socket.id);

      if (room.players.size === 0) {
        deleteRoom(code);
      } else {
        if (leavingPlayer) {
          io.to(code).emit("game:player:left", { playerName: leavingPlayer.name });
        }
        const wasHost = !Array.from(room.players.values()).find((p) => p.isHost);
        if (wasHost) {
          const first = room.players.values().next().value;
          if (first) first.isHost = true;
        }
        broadcastRoomState(io, room);
      }
      break;
    }
  });
}
