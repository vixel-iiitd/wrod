import * as fs from "fs";
import * as path from "path";

/**
 * Central word directory for Pattern Rush.
 * Words are organized by length → starting letter.
 * All pattern generation and answer validation draws exclusively from this list.
 *
 * Visible-letter rules per word length:
 *   minVisible(len) = Math.min(4, Math.floor(len / 2))
 *   maxVisible(len) = Math.max(Math.floor(len / 2), len - 2)
 *
 *   len=4 → 2   visible (exactly)
 *   len=5 → 2-3 visible
 *   len=6 → 3-4 visible
 *   len=7 → 3-5 visible
 *   len=8 → 4-6 visible
 */

export const patternConfig = {
  minVisible: (len: number) => Math.min(4, Math.floor((len+1) / 2)),
  maxVisible: (len: number) => Math.max(Math.floor(len / 2), len - 2),
  maxLength: 4,
};

const wordFilePath = path.resolve(__dirname, "../../../words.txt");

function loadWordList(maxLength?: number): string[] {
  const raw = fs.readFileSync(wordFilePath, "utf8");
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((word) => !maxLength || word.length <= maxLength);
}

export const wordList: string[] = loadWordList(patternConfig.maxLength);

export function getWordsByMaxLength(maxLength: number): string[] {
  return loadWordList(maxLength);
}