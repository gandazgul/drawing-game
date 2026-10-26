import { assert, test } from "vite-plus/test";
import {
  ERASE_COUNT,
  erasedCells,
  placedStairs,
  STAIR_COVER,
  STAIR_PIECES,
  stairsUncovered,
} from "../src/puzzles/stairs.js";
import { resumeScene } from "../src/state.js";

test("erase cover hides the entire staircase including every bottom edge", () => {
  const c = STAIR_COVER;
  for (const p of STAIR_PIECES) {
    assert(p.target.x - p.w / 2 >= c.x);
    assert(p.target.x + p.w / 2 <= c.x + c.w);
    assert(p.target.y - p.h / 2 >= c.y);
    assert(p.target.y + p.h / 2 <= c.y + c.h);
    assert.deepEqual(p.target.y + p.h / 2, 610);
  }
});
test("erase readiness allows a few remaining marks but rejects corrupt progress", () => {
  assert(!stairsUncovered([1, 1, -1, NaN, ERASE_COUNT]));
  assert(stairsUncovered(Array.from({ length: Math.ceil(ERASE_COUNT * 0.86) }, (_, i) => i)));
  assert.deepEqual([...erasedCells([1, 1, 2, -1, 9999])], [1, 2]);
  assert.deepEqual([...placedStairs([0, 5, 5, 9, "1"])], [0, 5]);
});
test("all six source stair pieces have distinct sizes and persistent IDs", () => {
  assert.deepEqual(STAIR_PIECES.length, 6);
  assert.deepEqual(new Set(STAIR_PIECES.map((p) => p.h)).size, 6);
  assert.deepEqual(new Set(STAIR_PIECES.map((p) => p.home.x)).size, 6);
  for (let i = 1; i < 6; i++) {
    assert.deepEqual(STAIR_PIECES[i - 1].source.x + STAIR_PIECES[i - 1].source.w, STAIR_PIECES[i].source.x);
  }
});
test("stair repair reload returns safely to the cat's house without discarding tasks", () => {
  assert.deepEqual(
    resumeScene({
      currentScene: "StairRepair",
      sailDone: true,
      patchDone: true,
      waterwayDone: true,
      pondClue: true,
      bridgeDone: true,
      villageTasks: ["clue"],
    }),
    "House",
  );
});
