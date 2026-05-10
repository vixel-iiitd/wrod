import { Filter } from "bad-words";

const filter = new Filter();

export function isProfane(word: string): boolean {
  try {
    return filter.isProfane(word);
  } catch {
    return false;
  }
}

export function filterCleanWords(words: string[]): string[] {
  return words.filter((w) => !isProfane(w));
}
