import { motion } from "framer-motion";
import { Player, LeaderboardEntry } from "../types";

interface Props {
  roomCode: string;
  players: Player[];
  leaderboard: LeaderboardEntry[];
  playerId: string | null;
}

export default function ScoreBar({ roomCode, players, leaderboard, playerId }: Props) {
  // Build score map from leaderboard (already sorted)
  const scoreMap = Object.fromEntries(leaderboard.map((e) => [e.playerId, e.score]));

  // Sort players by score descending
  const sorted = [...players].sort(
    (a, b) => (scoreMap[b.id] ?? 0) - (scoreMap[a.id] ?? 0)
  );

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-gray-900/90 backdrop-blur border-b border-gray-800">
      <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-2">
        {/* Room code */}
        <span className="text-yellow-400 font-extrabold tracking-widest text-xs shrink-0">
          {roomCode}
        </span>

        <div className="w-px h-4 bg-gray-700 shrink-0" />

        {/* Player scores — scrollable on small screens */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-none min-w-0">
          {sorted.map((p, i) => {
            const isMe = p.id === playerId;
            const score = scoreMap[p.id] ?? 0;
            return (
              <motion.div
                key={p.id}
                layout
                className={`flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-lg text-sm ${
                  isMe
                    ? "bg-yellow-400/20 border border-yellow-500/50"
                    : "bg-gray-800"
                }`}
              >
                {i === 0 && <span className="text-xs">👑</span>}
                <span className={`font-bold truncate max-w-[80px] ${isMe ? "text-yellow-300" : "text-white"}`}>
                  {p.name}
                </span>
                <span className="text-yellow-400 font-extrabold tabular-nums">{score}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
