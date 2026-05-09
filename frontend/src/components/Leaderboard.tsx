import { motion } from "framer-motion";
import { LeaderboardEntry } from "../types";

const MEDALS = ["🥇", "🥈", "🥉"];

interface Props {
  entries: LeaderboardEntry[];
  playerId: string | null;
  isFinal?: boolean;
}

export default function Leaderboard({ entries, playerId, isFinal }: Props) {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-extrabold"
      >
        {isFinal ? "Final Scores 🏆" : "Leaderboard"}
      </motion.h2>

      <div className="w-full space-y-2">
        {entries.map((e, i) => {
          const isMe = e.playerId === playerId;
          return (
            <motion.div
              key={e.playerId}
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.07 }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                isMe
                  ? "bg-yellow-400/20 border border-yellow-500"
                  : "bg-gray-800 border border-gray-700"
              }`}
            >
              <span className="text-xl w-7 text-center">
                {MEDALS[i] ?? `${i + 1}.`}
              </span>
              <span className={`font-bold ${isMe ? "text-yellow-300" : "text-white"}`}>
                {e.name}
                {isMe && <span className="text-xs text-gray-400 ml-1">(you)</span>}
              </span>
              <span className="ml-auto font-extrabold text-yellow-400">{e.score}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
