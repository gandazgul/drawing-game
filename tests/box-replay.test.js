import { assert, test } from "vite-plus/test";
import { boxSession } from "../src/puzzles/box-replay.js";
import { adjacent, BOX_GOAL, slide } from "../src/village-progress.js";

function distance(start) {
  const queue = [[start, 0]],
    seen = new Set([start.join()]);
  for (let head = 0; head < queue.length; head++) {
    const [board, depth] = queue[head];
    if (board.join() === BOX_GOAL.join()) return depth;
    for (let i = 0; i < 6; i++) {
      if (!adjacent(i, board.indexOf(0), 3)) continue;
      const next = slide(board, i);
      if (seen.has(next.join())) continue;
      seen.add(next.join());
      queue.push([next, depth + 1]);
    }
  }
  return Infinity;
}
test("box replays vary and are always 6–12 legal moves from the finished picture", () => {
  const boards = new Set();
  for (let n = 0; n < 100; n++) {
    const session = boxSession(null, () => n / 100);
    const steps = distance(session.board);
    assert(steps >= 6 && steps <= 12);
    boards.add(session.board.join());
    const next = boxSession({ ...session, complete: true }, () => n / 100);
    assert.notDeepEqual(session.start, next.start);
  }
  assert(boards.size > 30);
});
test("box replays resume without mutating saves and replace malformed or impossible boards", () => {
  const raw = boxSession(null, () => 0.3),
    resumed = boxSession(raw);
  assert.deepEqual(resumed, raw);
  resumed.board[0] = 99;
  assert.notDeepEqual(resumed.board, raw.board);
  for (const bad of [null, { start: 5 }, { board: [2, 1, 3, 4, 5, 0], start: raw.start }]) {
    assert(Number.isFinite(distance(boxSession(bad).board)));
  }
});
