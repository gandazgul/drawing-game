import { assert, test } from "vite-plus/test";
import { freshState, portReady, resumeScene, villageReady } from "../src/state.js";
import {
  createWaterway,
  createWaterwayReplay,
  restoreWaterway,
  rotatePipe,
  safeBubbles,
  waterCells,
  waterConnected,
  waterwayProgress,
} from "../src/puzzles/waterway.js";
import { BRIDGE, colorsReady, safeColors } from "../src/puzzles/rainbow.js";
import { traceCoverage } from "../src/puzzles/geometry.js";

test("pond and rainbow bridge gate the village, never optional stickers", () => {
  const values = { ...freshState().values, sailDone: true, patchDone: true };
  assert(!portReady(values));
  values.waterwayDone = true;
  assert(!portReady(values));
  values.pondClue = true;
  assert(portReady(values));
  assert(!villageReady(values));
  values.bridgeDone = true;
  assert(villageReady(values));
});
test("new and old saves resume at a valid world scene without resetting progress", () => {
  const boat = { sailDone: true, patchDone: true };
  for (const currentScene of ["Pond", "Waterway", "Port", "BridgeColors", "Village"]) {
    assert.deepEqual(resumeScene({ ...boat, currentScene }), "Pond");
  }
  const pond = { ...boat, waterwayDone: true, pondClue: true };
  assert.deepEqual(resumeScene({ ...pond, currentScene: "BridgeColors" }), "Port");
  assert.deepEqual(resumeScene({ ...pond, currentScene: "Village" }), "Port");
  assert.deepEqual(resumeScene({ ...pond, bridgeDone: true, currentScene: "Village" }), "Village");
  assert.deepEqual(resumeScene({ currentScene: "Village", bridgeDone: true }), "Harbor");
});
test("5x5 generated networks are solvable and start meaningfully scrambled", () => {
  const layouts = new Set();
  for (let seed = 1; seed <= 500; seed++) {
    const p = createWaterway(seed);
    assert.deepEqual(p.cells.length, 25);
    assert.deepEqual(p.cells[0], p.solution[0]);
    assert.deepEqual(p.cells[0] & 9, 0); // Fixed source opens only into the board.
    assert(waterConnected(p.solution));
    assert(!waterConnected(p.initial));
    assert(p.initial.filter((m, i) => m !== p.solution[i]).length >= 10);
    assert.deepEqual(waterCells(p.solution).size, 25);
    for (const mask of p.solution) assert.deepEqual(rotatePipe(mask, 4), mask);
    layouts.add(p.solution.join());
  }
  assert(layouts.size > 100);
});
test("old rotated sources are anchored without changing any other saved pipe", () => {
  const p = createWaterway(88);
  p.cells = p.cells.map((mask) => rotatePipe(mask));
  const restored = restoreWaterway(p, 999);
  assert.deepEqual(restored.seed, p.seed);
  assert.deepEqual(restored.cells[0], p.solution[0]);
  assert.deepEqual(restored.cells.slice(1), p.cells.slice(1));
});
test("saved puzzle input is bounded and does not accept bogus completion", () => {
  assert.deepEqual(safeBubbles([0, 0, 7, 8, -1, "2", NaN]), [0, 7]);
  assert.deepEqual(restoreWaterway(null, 7), createWaterway(7));
  assert.deepEqual(safeColors([1, 3, 5, 5, -1]), [1, 3, 5]);
  assert(!colorsReady([1, 1, 1]));
  assert(!colorsReady([5, 3, 1]));
  assert(colorsReady([6, 5, 4, 3, 2, 1, 0]));
  assert(!waterConnected([]));
});
test("partial story networks and popped bubbles survive leaving and reload", () => {
  const p = createWaterway(88);
  p.cells[4] = rotatePipe(p.cells[4]);
  const values = { waterwayPuzzle: JSON.parse(JSON.stringify(p)), poppedBubbles: [1, 2, 3] };
  const resumed = waterwayProgress(values, 999);
  assert.deepEqual(resumed.puzzle, p);
  assert.deepEqual(resumed.popped, [1, 2, 3]);
  assert.deepEqual(
    resumeScene({ sailDone: true, patchDone: true, metMermaid: true, currentScene: "Waterway" }),
    "Underwater",
  );
});
test("completed legacy saves stay completed and invalid boards cannot fake a solution", () => {
  const migrated = waterwayProgress({ waterwayDone: true, pipeTurns: [0, 0, 0, 0, 0, 0] }, 55);
  assert(migrated.puzzle.solved);
  assert.deepEqual(migrated.popped.length, 8);
  assert.deepEqual(
    waterwayProgress({ waterwayDone: true, waterwayPuzzle: migrated.puzzle }, 66).puzzle,
    migrated.puzzle,
  );
  const bogus = { ...createWaterway(8), cells: Array(25).fill(15), solved: true };
  assert.deepEqual(restoreWaterway(bogus, 99), createWaterway(8));
});
test("explicit later replays change layouts without changing the story board", () => {
  const story = createWaterway(9);
  story.cells = [...story.solution];
  story.solved = true;
  const before = JSON.stringify(story);
  const first = createWaterwayReplay(story, story.seed);
  assert(first.puzzle.solution.join() !== story.solution.join());
  assert(!first.puzzle.solved);
  assert.deepEqual(first.popped, []);
  first.puzzle.cells[0] = rotatePipe(first.puzzle.cells[0]);
  const second = createWaterwayReplay(story, first.puzzle.seed, first.puzzle);
  assert(second.puzzle.solution.join() !== first.puzzle.solution.join());
  assert.deepEqual(JSON.stringify(story), before);
});
test("curved bridge supports lifts, tap segments, persistence and continued drawing", () => {
  const c = traceCoverage(BRIDGE);
  c.stroke(BRIDGE[0], BRIDGE.at(-1));
  assert(!c.complete());
  const strokes = [BRIDGE.slice(0, 7), BRIDGE.slice(6, 13), BRIDGE.slice(12, 19), BRIDGE.slice(18)];
  c.restore(strokes);
  assert(c.complete());
  assert(!c.complete({ strokeActive: true }));
  assert.deepEqual(traceCoverage(BRIDGE).restore(JSON.parse(JSON.stringify(strokes))).ratio, c.ratio);
  c.stroke(BRIDGE[0]);
  assert(c.complete());
});
