import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { GameRoom } from "../game/GameRoom";
import { getRoom, setRoom, deleteRoom } from "../store/redis";
import { Category, DEFAULT_CATEGORY } from "../config/categories";

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function broadcastRoomState(io: Server, room: GameRoom) {
  io.to(room.roomCode).emit("room:state", room.toJSON());
}

export function registerHandlers(io: Server, socket: Socket) {
  // Create a new room
  socket.on("room:create", ({ playerName, category }: { playerName: string; category?: Category }) => {
    let code = generateRoomCode();
    while (getRoom(code)) code = generateRoomCode();

    const room = new GameRoom(code, (r) => broadcastRoomState(io, r), category ?? DEFAULT_CATEGORY);
    room.addPlayer({ id: socket.id, name: playerName, isHost: true });
    setRoom(code, room);

    socket.join(code);
    socket.emit("room:joined", { roomCode: code, playerId: socket.id });
    broadcastRoomState(io, room);
  });

  // Join an existing room
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

  // Host starts the game
  socket.on("game:start", ({ roomCode }: { roomCode: string }) => {
    const room = getRoom(roomCode);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player?.isHost) {
      socket.emit("room:error", { message: "Only the host can start the game" });
      return;
    }
    if (room.players.size < 1) {
      socket.emit("room:error", { message: "Need at least 1 player" });
      return;
    }
    room.startGame();
  });

  // Player submits an answer
  socket.on("game:submit", ({ roomCode, word }: { roomCode: string; word: string }) => {
    const room = getRoom(roomCode);
    if (!room) return;

    const result = room.submitAnswer(socket.id, word.trim());

    // Tell the submitter their result immediately
    socket.emit("game:submit:result", { result, word });

    // Notify everyone ELSE that this player solved it (toast popup)
    if (result === "accepted") {
      const player = room.players.get(socket.id);
      socket.to(roomCode).emit("game:player:solved", {
        playerName: player?.name ?? "Someone",
      });
    }

    // Tell everyone a submission happened (count only, not the word)
    io.to(roomCode).emit("game:submission:count", {
      count: room.currentRound?.submittedIds.size ?? 0,
      total: room.players.size,
    });

    if (result === "accepted" || result === "invalid") {
      broadcastRoomState(io, room);
    }
  });

  // Handle disconnect
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
        // Transfer host if host left
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
