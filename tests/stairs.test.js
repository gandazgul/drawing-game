import { assert, assertEquals } from "@std/assert";
import {
  ERASE_COUNT,
  erasedCells,
  placedStairs,
  STAIR_COVER,
  STAIR_PIECES,
  stairsUncovered,
} from "../src/puzzles/stairs.js";
import { resumeScene } from "../src/state.js";

Deno.test("erase cover hides the entire staircase including every bottom edge", () => {
  const c = STAIR_COVER;
  for (const p of STAIR_PIECES) {
    assert(p.target.x - p.w / 2 >= c.x);
    assert(p.target.x + p.w / 2 <= c.x + c.w);
    assert(p.target.y - p.h / 2 >= c.y);
    assert(p.target.y + p.h / 2 <= c.y + c.h);
    assertEquals(p.target.y + p.h / 2, 610);
  }
});
Deno.test("erase readiness allows a few remaining marks but rejects corrupt progress", () => {
  assert(!stairsUncovered([1, 1, -1, NaN, ERASE_COUNT]));
  assert(stairsUncovered(Array.from({ length: Math.ceil(ERASE_COUNT * .86) }, (_, i) => i)));
  assertEquals([...erasedCells([1, 1, 2, -1, 9999])], [1, 2]);
  assertEquals([...placedStairs([0, 5, 5, 9, "1"])], [0, 5]);
});
Deno.test("all six source stair pieces have distinct sizes and persistent IDs", () => {
  assertEquals(STAIR_PIECES.length, 6);
  assertEquals(new Set(STAIR_PIECES.map((p) => p.h)).size, 6);
  assertEquals(new Set(STAIR_PIECES.map((p) => p.home.x)).size, 6);
  for (let i = 1; i < 6; i++) {
    assertEquals(STAIR_PIECES[i - 1].source.x + STAIR_PIECES[i - 1].source.w, STAIR_PIECES[i].source.x);
  }
});
Deno.test("stair repair reload returns safely to the cat's house without discarding tasks", () => {
  assertEquals(
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
