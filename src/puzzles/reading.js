// Parent-supplied vocabulary, not an inferred teaching order or mastery record.
export const SUPER_WORDS = [
  "I",
  "the",
  "we",
  "to",
  "my",
  "a",
  "an",
  "you",
  "and",
  "do",
  "are",
  "is",
  "like",
  "of",
  "they",
  "for",
  "have",
  "it",
  "make",
  "said",
  "he",
  "she",
  "that",
  "with",
  "was",
  "his",
  "her",
  "when",
  "one",
  "so",
  "no",
  "be",
  "there",
  "this",
  "or",
  "from",
  "out",
  "about",
  "by",
  "has",
  "what",
  "could",
  "would",
  "their",
  "were",
  "as",
  "into",
  "very",
  "people",
  "other",
  "more",
  "your",
  "all",
  "call",
  "also",
  "many",
  "how",
  "now",
  "down",
  "which",
];
export const HOMEWORK_WORDS = ["like", "there", "what", "make"];
const remaining = SUPER_WORDS.filter((w) => !HOMEWORK_WORDS.includes(w));
export const WORD_SETS = [HOMEWORK_WORDS];
for (let i = 0; i < remaining.length; i += 4) WORD_SETS.push(remaining.slice(i, i + 4));
export const WORD_RECORDS = SUPER_WORDS.map((word) => ({
  word,
  source: "family-2026-10-25",
  parentListed: true,
  recentHomework: HOMEWORK_WORDS.includes(word),
  enabled: true,
  mastered: null,
  phonicsPattern: ["like", "make"].includes(word) ? "CVCe" : null,
}));
export const PLACEMENTS = [
  { id: "bag", phrase: "in the bag", explanation: "In means inside. Put the fruit inside the bag." },
  { id: "mat", phrase: "on the mat", explanation: "On means resting on top. Put the fruit on the mat." },
  { id: "log", phrase: "by the log", explanation: "By means beside. Put the fruit beside the log." },
];
export function shuffled(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.max(0, Math.floor(random() * (i + 1))));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function wordSetIndex(value) {
  return Number.isInteger(value) && value >= 0 && value < WORD_SETS.length ? value : 0;
}
export function readingSession(raw, set) {
  const words = raw?.set === set && Array.isArray(raw.words)
    ? [...new Set(raw.words.filter((word) => WORD_SETS[wordSetIndex(set)].includes(word)))]
    : [];
  const placed = words.length === 4 && Array.isArray(raw?.placed)
    ? [...new Set(raw.placed.filter((id) => PLACEMENTS.some((p) => p.id === id)))]
    : [];
  return { set: wordSetIndex(set), words, placed };
}
export function wordRounds(set = 0, random = Math.random) {
  const pool = WORD_SETS[wordSetIndex(set)];
  return shuffled(pool, random).map((answer) => ({
    answer,
    choices: shuffled([answer, ...shuffled(pool.filter((w) => w !== answer), random).slice(0, 2)], random),
  }));
}
export const DECORATION_ART = ["pinkFruit", "birthdayFlowers", "flowerBlue", "heartButterfly"];
export function validPicnicDecorations(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 24).filter((p) =>
    p && DECORATION_ART.includes(p.art) && Number.isFinite(p.x) && Number.isFinite(p.y) &&
    p.x >= 120 && p.x <= 1100 && p.y >= 350 && p.y <= 650
  ).map(({ art, x, y }) => ({ art, x, y }));
}
export const CLOUD_LINES = {
  welcome:
    "The wind mixed up my picnic word slips! Will you help me read them? Then we can share a picnic with the clouds.",
  wordsDone:
    "We found our words! Now let's read where the fruit goes. In, on, and by are words that tell us where.",
  complete:
    "Our cloud picnic is ready! You can put more fruit and flowers anywhere you like. Come back whenever you want to play again.",
};
export const readingLines = () =>
  [
    ...Object.values(CLOUD_LINES),
    ...SUPER_WORDS.map((word) => `Find the word: ${word}.`),
    ...PLACEMENTS.flatMap((p) => [p.phrase, p.explanation]),
  ].map((text) => ({ speaker: "Cloud friend", text }));
