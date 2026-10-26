import { Coverage, traceSamples } from "./geometry.js";

export const DANCE_PATH = [
  { x: 250, y: 455 },
  { x: 370, y: 380 },
  { x: 500, y: 445 },
  { x: 650, y: 325 },
  { x: 800, y: 390 },
  { x: 1000, y: 290 },
];
export const danceWorld = (p) => ({ x: p.x, y: p.y + 220 });
export const danceCoverage = (strokes = []) =>
  new Coverage(traceSamples(DANCE_PATH), 20, { endRadius: 10, requiredRatio: 0.88 }).restore(strokes);
// Centerline measured against woodland-v1.webp, in the 1200×800 world.
// Stones, repaired marks and navigation all use this same painted trail.
export const WOODLAND_PATH = [
  { x: 400, y: 775 },
  { x: 300, y: 720 },
  { x: 200, y: 670 },
  { x: 180, y: 615 },
  { x: 300, y: 565 },
  { x: 450, y: 520 },
  { x: 570, y: 500 },
  { x: 660, y: 480 },
  { x: 760, y: 450 },
  { x: 850, y: 435 },
  { x: 930, y: 420 },
  { x: 945, y: 400 },
  { x: 920, y: 380 },
  { x: 950, y: 360 },
];
export const WOODLAND_STONES = [4, 5, 7, 8, 10, 13].map((i) => WOODLAND_PATH[i]);
export function woodlandWalkable(done) {
  const path = done ? WOODLAND_PATH : WOODLAND_PATH.slice(0, 5);
  const edge = (side) =>
    path.map((p, i) => {
      const a = path[Math.max(0, i - 1)],
        b = path[Math.min(path.length - 1, i + 1)];
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      const cap = i === 0 ? -18 : i === path.length - 1 ? 18 : 0;
      return {
        x: p.x + ((b.x - a.x) / length) * cap - ((b.y - a.y) / length) * 30 * side,
        y: p.y + ((b.y - a.y) / length) * cap + ((b.x - a.x) / length) * 30 * side,
      };
    });
  return [...edge(1), ...edge(-1).reverse()];
}
export function forestWalkable(done) {
  return done
    ? [
        { x: 90, y: 620 },
        { x: 420, y: 530 },
        { x: 720, y: 495 },
        { x: 1120, y: 465 },
        { x: 1130, y: 710 },
        {
          x: 90,
          y: 750,
        },
      ]
    : [
        { x: 90, y: 620 },
        { x: 395, y: 620 },
        { x: 395, y: 750 },
        { x: 90, y: 750 },
      ];
}
export const neighbors = (cell) =>
  Array.from({ length: 25 }, (_, i) => i).filter(
    (i) => Math.abs((i % 5) - (cell % 5)) + Math.abs(Math.floor(i / 5) - Math.floor(cell / 5)) === 1,
  );
const checkpoints = [0, 4, 8, 13, 18, 24];
// Daybook's Number Path backbite construction: a Hamiltonian route, not a random
// board that might be unsolvable. Accept every valid route, not only this witness.
export function newForestBoard(seed) {
  let value = seed >>> 0;
  const random = () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
  let solution = Array.from({ length: 25 }, (_, i) => {
    const row = Math.floor(i / 5);
    return row * 5 + (row % 2 ? 4 - (i % 5) : i % 5);
  });
  for (let i = 0; i < 250; i++) {
    if (random() < 0.5) solution.reverse();
    const options = neighbors(solution[0]).filter((cell) => cell !== solution[1]);
    const index = solution.indexOf(options[Math.floor(random() * options.length)]);
    if (index > 1) solution = [...solution.slice(0, index).reverse(), ...solution.slice(index)];
  }
  return { version: 1, seed: seed >>> 0, solution, path: [solution[0]] };
}
export const forestClues = (board) =>
  Object.fromEntries(checkpoints.map((p, i) => [board.solution[p], i + 1]));
export function canForestStep(board, path, cell) {
  if (!Number.isInteger(cell) || cell < 0 || cell >= 25 || path.includes(cell)) return false;
  if (!path.length) return cell === board.solution[0];
  if (!neighbors(path.at(-1)).includes(cell)) return false;
  const clues = forestClues(board);
  const next = 1 + path.filter((n) => clues[n]).length;
  return (!clues[cell] || clues[cell] === next) && (clues[cell] !== 6 || path.length === 24);
}
export function safeForestBoard(raw, seed = 1) {
  const valid =
    raw?.version === 1 &&
    Array.isArray(raw.solution) &&
    raw.solution.length === 25 &&
    new Set(raw.solution).size === 25 &&
    raw.solution.every(
      (n, i, a) => Number.isInteger(n) && n >= 0 && n < 25 && (!i || neighbors(a[i - 1]).includes(n)),
    );
  if (!valid) return newForestBoard(seed);
  const board = { version: 1, seed: raw.seed >>> 0, solution: [...raw.solution], path: [] };
  for (const cell of Array.isArray(raw.path) ? raw.path.slice(0, 25) : []) {
    if (!canForestStep(board, board.path, cell)) break;
    board.path.push(cell);
  }
  if (!board.path.length) board.path = [board.solution[0]];
  return board;
}
export const forestSolved = (board) => safeForestBoard(board).path.length === 25;
export function forestBoardForVisit(raw, seed) {
  const board = safeForestBoard(raw, seed);
  if (!forestSolved(board)) return board;
  const previousClues = JSON.stringify(forestClues(board));
  let next = newForestBoard(seed);
  // A completed visit starts fresh, with visibly different number positions.
  while (JSON.stringify(forestClues(next)) === previousClues) next = newForestBoard(++seed);
  return next;
}
// Search for a completion of the player's route so hints support their choices.
// At 25 cells, pruning disconnected unvisited areas keeps this bounded.
export function forestCompletion(board, path = board.path) {
  const route = [...path];
  let budget = 150000;
  function search() {
    if (--budget < 0) return null;
    if (route.length === 25) return [...route];
    const free = new Set(Array.from({ length: 25 }, (_, i) => i).filter((n) => !route.includes(n)));
    const seen = new Set(),
      queue = [free.values().next().value];
    while (queue.length) {
      const n = queue.pop();
      if (seen.has(n)) continue;
      seen.add(n);
      neighbors(n).forEach((v) => {
        if (free.has(v) && !seen.has(v)) queue.push(v);
      });
    }
    if (seen.size !== free.size) return null;
    for (const n of neighbors(route.at(-1))) {
      if (!canForestStep(board, route, n)) continue;
      route.push(n);
      const answer = search();
      if (answer) return answer;
      route.pop();
    }
    return null;
  }
  return search();
}
