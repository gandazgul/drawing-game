// Saved puzzle sessions: randomness belongs at the start, never on scene redraw.
export const LEGACY_PATTERNS = [[0, 1, 0, 1, 0, 1], [2, 3, 4, 2, 3, 4], [0, 0, 2, 0, 0, 2]];
// The three shown flags uniquely identify these families. ABA would be ambiguous
// with AB from only three clues, so it is deliberately not in the deck.
const PATTERN_UNITS = [[0, 1], [0, 1, 2], [0, 0, 1], [0, 1, 1]];
export function shuffled(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
const color = (n) => Number.isInteger(n) && n >= 0 && n < 5;
export const validPatterns = (rows) =>
  Array.isArray(rows) && rows.length === 3 &&
  rows.every((row) =>
    Array.isArray(row) && row.length === 6 && row.every(color) &&
    PATTERN_UNITS.some((unit) => row.every((value, i) => value === row[i % unit.length]))
  );
export const validAnswers = (raw) => Array.from({ length: 9 }, (_, i) => color(raw?.[i]) ? raw[i] : null);
export function newPatterns(previous, random = Math.random) {
  const rows = shuffled(PATTERN_UNITS, random).slice(0, 3).map((unit) => {
    const colors = shuffled([0, 1, 2, 3, 4], random);
    return Array.from({ length: 6 }, (_, i) => colors[unit[i % unit.length]]);
  });
  // Even a repeated random stream must not serve the identical completed puzzle.
  return JSON.stringify(rows) === JSON.stringify(previous)
    ? rows.map((row) => row.map((n) => (n + 1) % 5))
    : rows;
}
export function buntingSession(raw, random = Math.random) {
  if (raw?.complete !== true && validPatterns(raw?.patterns)) {
    return { patterns: raw.patterns.map((r) => [...r]), answers: validAnswers(raw.answers), complete: false };
  }
  return { patterns: newPatterns(raw?.patterns, random), answers: validAnswers([]), complete: false };
}

// Full painted scenes give the 25 pieces distinctive details, rather than blank paper.
export const JIGSAW_PICTURES = ["harbor", "pond", "underwater", "villageBackdrop", "houseLoft", "frozenPond"];
const picture = (key) => JIGSAW_PICTURES.includes(key);
const pieceIds = Array.from({ length: 25 }, (_, i) => i);
export const validPieces = (raw) =>
  Array.isArray(raw) ? [...new Set(raw.filter((n) => Number.isInteger(n) && n >= 0 && n < 25))] : [];
export function jigsawSession(raw, random = Math.random) {
  const remaining = Array.isArray(raw?.remaining)
    ? [...new Set(raw.remaining.filter((key) => picture(key) && key !== raw.picture))]
    : [];
  if (raw?.complete !== true && picture(raw?.picture)) {
    return {
      picture: raw.picture,
      remaining: remaining.filter((key) => key !== raw.picture),
      placed: validPieces(raw.placed),
      order: raw.order?.length === 25 && validPieces(raw.order).length === 25
        ? [...raw.order]
        : shuffled(pieceIds, random),
      complete: false,
    };
  }
  const bag = remaining.length ? remaining : shuffled(JIGSAW_PICTURES, random);
  // At a bag boundary, never repeat the picture just completed.
  if (bag[0] === raw?.picture) [bag[0], bag[1]] = [bag[1], bag[0]];
  return {
    picture: bag[0],
    remaining: bag.slice(1),
    placed: [],
    order: shuffled(pieceIds, random),
    complete: false,
  };
}
