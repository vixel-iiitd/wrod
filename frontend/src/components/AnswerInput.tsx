import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SubmitResult } from "../hooks/useSocket";

interface Props {
  pattern: string;
  onSubmit: (word: string) => void;
  lastSubmit: SubmitResult | null;
  onClearSubmit: () => void;
  disabled: boolean;
}

export default function AnswerInput({ pattern, onSubmit, lastSubmit, onClearSubmit, disabled }: Props) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [disabled]);

  useEffect(() => {
    if (lastSubmit) {
      const t = setTimeout(onClearSubmit, 2000);
      return () => clearTimeout(t);
    }
  }, [lastSubmit, onClearSubmit]);

  const patternMatches = value.length === pattern.length;

  const handleSubmit = () => {
    if (!value.trim() || disabled) return;
    onSubmit(value.trim());
    setValue("");
  };

  const feedbackColor =
    lastSubmit?.result === "accepted" ? "text-green-400" :
    lastSubmit?.result === "invalid" ? "text-red-400" :
    lastSubmit?.result === "already_submitted" ? "text-yellow-400" : "";

  const feedbackMsg =
    lastSubmit?.result === "accepted" ? `✓ "${lastSubmit.word}" — nice!` :
    lastSubmit?.result === "invalid" ? `✗ "${lastSubmit.word}" — not valid` :
    lastSubmit?.result === "already_submitted" ? "Already submitted!" : "";

  if (disabled) {
    return (
      <div className="text-center text-gray-500 py-4 animate-pulse">
        Waiting for round…
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-sm">
      <div className="flex gap-2 w-full">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value.toLowerCase().replace(/[^a-z]/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          maxLength={pattern.length}
          placeholder={`${pattern.length}-letter word`}
          className={`
            flex-1 bg-gray-800 border-2 rounded-xl px-4 py-3 text-white text-xl tracking-widest
            focus:outline-none transition-colors
            ${patternMatches && value.length > 0 ? "border-yellow-400" : "border-gray-600"}
          `}
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold px-6 py-3 rounded-xl disabled:opacity-40 transition-colors"
        >
          →
        </motion.button>
      </div>

      <AnimatePresence>
        {lastSubmit && feedbackMsg && (
          <motion.p
            key={lastSubmit.result}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`text-sm font-bold ${feedbackColor}`}
          >
            {feedbackMsg}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
