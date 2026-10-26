import { PIPE_LAYOUTS } from "./pipe-layouts.js";

export const PIPE_SIZE = 5;
export const BUBBLE_COUNT = 8;
export const rotatePipe = (mask, turns = 1) => {
  for (let i = 0; i < ((turns % 4) + 4) % 4; i++) mask = ((mask << 1) & 15) | (mask >> 3);
  return mask;
};
export const safeBubbles = (raw) => [
  ...new Set(
    Array.isArray(raw) ? raw.filter((n) => Number.isInteger(n) && n >= 0 && n < BUBBLE_COUNT) : [],
  ),
];
const neighbors = (i) => [
  i >= 5 ? i - 5 : -1,
  i % 5 < 4 ? i + 1 : -1,
  i < 20 ? i + 5 : -1,
  i % 5 > 0 ? i - 1 : -1,
];
const validCells = (cells) =>
  Array.isArray(cells) && cells.length === 25 &&
  cells.every((m) => Number.isInteger(m) && m > 0 && m < 16);

// Daybook's connected-network rule: matching openings, no edge leaks,
// and all 25 tiles reachable from the source at top left.
export function waterCells(cells) {
  const seen = new Set();
  if (!validCells(cells)) return seen;
  const pending = [0];
  while (pending.length) {
    const i = pending.pop();
    if (seen.has(i)) continue;
    seen.add(i);
    neighbors(i).forEach((j, d) => {
      if (j >= 0 && cells[i] & (1 << d) && cells[j] & (1 << ((d + 2) % 4))) pending.push(j);
    });
  }
  return seen;
}
export function waterConnected(cells) {
  return validCells(cells) &&
    cells.every((mask, i) =>
      neighbors(i).every((j, d) => !(mask & (1 << d)) || j >= 0 && !!(cells[j] & (1 << ((d + 2) % 4))))
    ) && waterCells(cells).size === 25;
}

// Seeded bank selection, reflection, rotation and independent tile scrambling,
// adapted from Daybook's generateRatedPipes. Never roll on a scene revisit.
export function createWaterway(seed) {
  seed = (Number(seed) >>> 0) || 1;
  let state = seed;
  const random = (n) => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) % n;
  };
  const source = PIPE_LAYOUTS[random(PIPE_LAYOUTS.length)], turns = random(4), reflect = random(2);
  const solution = Array(25).fill(0);
  source.forEach((mask, i) => {
    let r = Math.floor(i / 5), c = i % 5;
    if (reflect) {
      c = 4 - c;
      mask = (mask & 5) | ((mask & 2) << 2) | ((mask & 8) >> 2);
    }
    for (let t = 0; t < turns; t++) {
      [r, c] = [c, 4 - r];
      mask = rotatePipe(mask);
    }
    solution[r * 5 + c] = mask;
  });
  const initial = solution.map((mask) => rotatePipe(mask, random(4)));
  initial[0] = solution[0]; // The outside spring feeds a fixed source tile.
  let changed = initial.filter((mask, i) => mask !== solution[i]).length;
  for (let i = 1; changed < 10 && i < 25; i++) {
    if (initial[i] === solution[i] && rotatePipe(initial[i]) !== initial[i]) {
      initial[i] = rotatePipe(initial[i]);
      changed++;
    }
  }
  return { version: 2, seed, initial, solution, cells: [...initial], solved: false };
}

export function restoreWaterway(raw, seed, storyDone = false) {
  const valid = raw?.version === 2 && Number.isInteger(raw.seed) && raw.seed > 0 && raw.seed <= 0xffffffff;
  const puzzle = createWaterway(valid ? raw.seed : seed);
  if (
    valid && validCells(raw.cells) &&
    raw.cells.every((mask, i) => [0, 1, 2, 3].some((t) => rotatePipe(puzzle.solution[i], t) === mask))
  ) puzzle.cells = [...raw.cells];
  // Keep old partial boards intact except for anchoring the source to its inlet.
  puzzle.cells[0] = puzzle.solution[0];
  if (storyDone) puzzle.cells = [...puzzle.solution];
  puzzle.solved = waterConnected(puzzle.cells);
  return puzzle;
}

// Future bedroom paintings call this explicitly. Replay owns different data;
// it cannot clear the story's completed flags, bubbles, or solved board.
export function createWaterwayReplay(story, seed, previous) {
  let puzzle = createWaterway(seed);
  while (
    [story, previous].some((old) =>
      puzzle.seed === old?.seed || puzzle.solution.join() === old?.solution?.join()
    )
  ) {
    puzzle = createWaterway(puzzle.seed + 1);
  }
  return { puzzle, popped: [], replay: true };
}

export function waterwayProgress(values, seed) {
  const puzzle = restoreWaterway(values.waterwayPuzzle, seed, values.waterwayDone === true);
  const popped = values.waterwayDone
    ? Array.from({ length: BUBBLE_COUNT }, (_, i) => i)
    : safeBubbles(values.poppedBubbles);
  return { puzzle, popped, replay: false };
}
