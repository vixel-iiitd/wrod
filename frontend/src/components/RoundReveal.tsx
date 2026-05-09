import { motion } from "framer-motion";
import { Submission } from "../types";

interface Props {
  pattern: string;
  answer?: string;
  description?: string;
  submissions: Submission[];
  totalPlayers: number;
}

export default function RoundReveal({ pattern, answer, description, submissions, totalPlayers }: Props) {
  const noShows = totalPlayers - submissions.length;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        <p className="text-gray-400 text-sm mb-1">Pattern was</p>
        <p className="text-3xl font-extrabold tracking-widest text-yellow-400">{pattern}</p>
        {answer && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-3"
          >
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">The word was</p>
            <p className="text-4xl font-extrabold tracking-widest text-white uppercase">{answer}</p>
            {description && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="mt-2 text-gray-400 text-sm max-w-xs mx-auto leading-relaxed"
              >
                {description}
              </motion.p>
            )}
          </motion.div>
        )}
      </motion.div>

      <div className="w-full space-y-2">
        {submissions
          .sort((a, b) => a.timestamp - b.timestamp)
          .map((s, i) => (
            <motion.div
              key={s.playerId}
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.08 }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                s.valid ? "bg-green-900/40 border border-green-700" : "bg-gray-800/60 border border-gray-700"
              }`}
            >
              <span className={`text-lg font-extrabold ${s.valid ? "text-green-300" : "text-gray-500 line-through"}`}>
                {s.word}
              </span>
              <span className="text-gray-400 text-sm">{s.playerName}</span>
              {s.valid && (
                <span className="ml-auto text-yellow-400 font-bold text-sm">+{s.points}</span>
              )}
              {!s.valid && <span className="ml-auto text-gray-600 text-sm">0</span>}
            </motion.div>
          ))}

        {noShows > 0 && (
          <p className="text-gray-600 text-sm text-center">
            {noShows} player{noShows > 1 ? "s" : ""} didn't submit
          </p>
        )}
      </div>
    </div>
  );
}
