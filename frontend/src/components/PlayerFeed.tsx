import { motion, AnimatePresence } from "framer-motion";

interface Props {
  submittedCount: number;
  totalPlayers: number;
}

export default function PlayerFeed({ submittedCount, totalPlayers }: Props) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-gray-400 text-sm">
        <span className="text-white font-bold">{submittedCount}</span> / {totalPlayers} submitted
      </p>
      <div className="flex gap-2">
        {Array.from({ length: totalPlayers }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: i < submittedCount ? 1 : 0.6 }}
            className={`w-3 h-3 rounded-full ${i < submittedCount ? "bg-green-400" : "bg-gray-700"}`}
          />
        ))}
      </div>
    </div>
  );
}
