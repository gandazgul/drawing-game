import { adjacent, BOX_GOAL, slide } from "../village-progress.js";

// Explore legal slides from the finished picture. This small 3×2 board has only
// 360 reachable states, so we can guarantee both solvability and gentle difficulty.
const reachable = new Map([[BOX_GOAL.join(), { board: BOX_GOAL, distance: 0 }]]);
const queue = [...reachable.values()];
for (let head = 0; head < queue.length; head++) {
  const { board, distance } = queue[head];
  for (let i = 0; i < 6; i++) {
    if (!adjacent(i, board.indexOf(0), 3)) continue;
    const next = slide(board, i),
      key = next.join();
    if (reachable.has(key)) continue;
    const entry = { board: next, distance: distance + 1 };
    reachable.set(key, entry);
    queue.push(entry);
  }
}
const valid = (board) =>
  Array.isArray(board) &&
  board.length === 6 &&
  board.every((n) => Number.isInteger(n) && n >= 0 && n < 6) &&
  reachable.has(board.join());
export function boxSession(raw, random = Math.random) {
  if (
    raw?.complete !== true &&
    valid(raw?.board) &&
    valid(raw?.start) &&
    raw.start.join() !== BOX_GOAL.join()
  ) {
    return { board: [...raw.board], start: [...raw.start], complete: false };
  }
  const choices = queue.filter(
    ({ board, distance }) =>
      distance >= 6 && distance <= 12 && board.join() !== (Array.isArray(raw?.start) ? raw.start.join() : ""),
  );
  const board = choices[Math.floor(random() * choices.length)].board;
  return { board: [...board], start: [...board], complete: false };
}
