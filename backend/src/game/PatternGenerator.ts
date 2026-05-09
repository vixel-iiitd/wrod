import { wordList, patternConfig } from "../config/words";

export interface PatternResult {
  pattern: string; // e.g. "_O_N"
  answer: string;  // the word this pattern was generated from
}

function randomMask(length: number, revealCount: number): boolean[] {
  const mask = Array(length).fill(false);
  const positions = Array.from({ length }, (_, i) => i);
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  for (let i = 0; i < revealCount; i++) {
    mask[positions[i]] = true;
  }
  return mask;
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function generatePattern(): PatternResult {
  for (let attempt = 0; attempt < 200; attempt++) {
    const word = wordList[Math.floor(Math.random() * wordList.length)];
    const len = word.length;

    const minVisible = patternConfig.minVisible(len);
    const maxVisible = patternConfig.maxVisible(len);
    const revealCount = randInt(minVisible, maxVisible);

    const mask = randomMask(len, revealCount);
    const pattern = word
      .split("")
      .map((ch, i) => (mask[i] ? ch.toUpperCase() : "_"))
      .join("");

    if (!pattern.includes("_")) continue;

    return { pattern, answer: word };
  }

  // Should never reach here given a valid wordList, but keeps TS happy
  return { pattern: "_O_N", answer: "corn" };
}
