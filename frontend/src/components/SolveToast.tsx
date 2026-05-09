import { AnimatePresence, motion } from "framer-motion";
import { GameNotification } from "../hooks/useSocket";

interface Props {
  toasts: GameNotification[];
}

const VARIANTS = {
  solved: {
    bg: "bg-green-500",
    text: "text-black",
    icon: "✓",
    label: (name: string) => `${name} solved it!`,
  },
  left: {
    bg: "bg-red-500",
    text: "text-white",
    icon: "✕",
    label: (name: string) => `${name} left the room`,
  },
};

export default function SolveToast({ toasts }: Props) {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col-reverse gap-2 z-50 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const v = VARIANTS[t.variant];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24, x: 8 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className={`flex items-center gap-2 ${v.bg} ${v.text} font-bold px-4 py-2 rounded-xl shadow-xl text-sm whitespace-nowrap`}
            >
              <span className="text-base">{v.icon}</span>
              <span>{v.label(t.playerName)}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
