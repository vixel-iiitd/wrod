import { motion } from "framer-motion";

interface Props {
  pattern: string;
}

export default function PatternDisplay({ pattern }: Props) {
  return (
    <div className="flex gap-3 justify-center flex-wrap">
      {pattern.split("").map((ch, i) => (
        <motion.div
          key={i}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className={`
            w-14 h-16 flex items-center justify-center rounded-xl text-3xl font-extrabold
            ${ch === "_"
              ? "border-b-4 border-yellow-400 bg-gray-800/50 text-transparent"
              : "bg-yellow-400 text-black"
            }
          `}
        >
          {ch !== "_" ? ch : ""}
        </motion.div>
      ))}
    </div>
  );
}
