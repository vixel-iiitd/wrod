// In-memory fallback store (swap for Redis in production)
// To use Redis: npm add ioredis and replace with ioredis client

import { GameRoom } from "../game/GameRoom";

const rooms = new Map<string, GameRoom>();

export function getRoom(code: string): GameRoom | undefined {
  return rooms.get(code);
}

export function setRoom(code: string, room: GameRoom): void {
  rooms.set(code, room);
}

export function deleteRoom(code: string): void {
  rooms.delete(code);
}

export function listRooms(): string[] {
  return Array.from(rooms.keys());
}
