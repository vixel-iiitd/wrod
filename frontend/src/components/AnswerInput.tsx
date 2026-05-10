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

  // Out of attempts when explicitly told remainingAttempts === 0 after invalid or profanity
  const outOfAttempts =
    (lastSubmit?.result === "invalid" || lastSubmit?.result === "profanity") &&
    lastSubmit.remainingAttempts === 0;
  const isLocked = disabled || outOfAttempts;

  useEffect(() => {
    if (!isLocked) inputRef.current?.focus();
  }, [isLocked]);

  useEffect(() => {
    if (lastSubmit?.result === "accepted" || outOfAttempts) {
      const t = setTimeout(onClearSubmit, 3000);
      return () => clearTimeout(t);
    }
    if (lastSubmit?.result === "invalid" || lastSubmit?.result === "profanity") {
      const t = setTimeout(onClearSubmit, 2000);
      return () => clearTimeout(t);
    }
  }, [lastSubmit, onClearSubmit, outOfAttempts]);

  // Clear input on accepted so they can't resubmit
  useEffect(() => {
    if (lastSubmit?.result === "accepted") setValue("");
  }, [lastSubmit]);

  const patternMatches = value.length === pattern.length;

  const handleSubmit = () => {
    if (!value.trim() || isLocked) return;
    onSubmit(value.trim());
    setValue("");
  };

  const feedbackColor =
    lastSubmit?.result === "accepted" ? "text-green-400" :
    lastSubmit?.result === "profanity" ? "text-orange-400" :
    lastSubmit?.result === "invalid" ? "text-red-400" :
    lastSubmit?.result === "already_submitted" ? "text-yellow-400" : "";

  const feedbackMsg =
    lastSubmit?.result === "accepted" ? `✓ "${lastSubmit.word}" — nice!` :
    lastSubmit?.result === "profanity" && lastSubmit.remainingAttempts > 0
      ? `⚠ Watch your language! ${lastSubmit.remainingAttempts} attempt${lastSubmit.remainingAttempts !== 1 ? "s" : ""} left` :
    lastSubmit?.result === "profanity" && lastSubmit.remainingAttempts === 0
      ? `⚠ Watch your language! No attempts left` :
    lastSubmit?.result === "invalid" && lastSubmit.remainingAttempts > 0
      ? `✗ "${lastSubmit.word}" — wrong! ${lastSubmit.remainingAttempts} attempt${lastSubmit.remainingAttempts !== 1 ? "s" : ""} left` :
    lastSubmit?.result === "invalid" && lastSubmit.remainingAttempts === 0
      ? `✗ "${lastSubmit.word}" — no attempts left` :
    lastSubmit?.result === "already_submitted" ? "Already submitted!" : "";

  const remainingAttempts =
    lastSubmit?.result === "invalid" || lastSubmit?.result === "profanity"
      ? lastSubmit.remainingAttempts
      : null;

  if (isLocked && !outOfAttempts) {
    return (
      <div className="text-center text-gray-500 py-4 animate-pulse">
        Waiting for round…
      </div>
    );
  }

  if (outOfAttempts) {
    return (
      <div className="text-center text-red-400 py-4 font-bold">
        No attempts remaining for this round
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-sm">
      {/* Attempt dots */}
      {remainingAttempts !== null && remainingAttempts > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Attempts left:</span>
          <div className="flex gap-1">
            {Array.from({ length: remainingAttempts }).map((_, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            ))}
          </div>
        </div>
      )}

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
            key={`${lastSubmit.result}-${lastSubmit.word}`}
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
