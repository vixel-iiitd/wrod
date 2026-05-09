import { wordList } from "../config/words";

const validWords = new Set(wordList);

export function patternToRegex(pattern: string): RegExp {
  const regexStr = pattern
    .split("")
    .map((ch) => (ch === "_" ? "[a-z]" : ch.toLowerCase()))
    .join("");
  return new RegExp(`^${regexStr}$`, "i");
}

export function validateWord(word: string, pattern: string): boolean {
  const clean = word.trim().toLowerCase();
  if (clean.length !== pattern.length) return false;
  if (!patternToRegex(pattern).test(clean)) return false;
  return validWords.has(clean);
}
