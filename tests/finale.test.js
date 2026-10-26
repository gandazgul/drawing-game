import { assert, test } from "vite-plus/test";
import {
  canCelebrate,
  canSayGoodbye,
  finaleCoverage,
  finaleStrokePoint,
  HEART_ROUTE,
  placeDecoration,
  TREE_ROUTE,
  treeReady,
  treeWalkable,
  validDecorations,
} from "../src/puzzles/finale.js";
import { chapterForScene, chapterResetState } from "../src/chapters.js";
import { freshState, resumeScene } from "../src/state.js";
import { createWaterway, restoreWaterway, waterConnected } from "../src/puzzles/waterway.js";

test("finale repairs, climb and party are separate lasting beats; decorations never gate them", () => {
  const v = { endingWaterDone: true, endingHouseDone: true, endingRouteDone: true };
  assert(treeReady(v));
  assert(!canCelebrate(v));
  v.endingClimbed = true;
  assert(canCelebrate(v));
  assert(!canSayGoodbye(v));
  v.endingParty = true;
  assert(canSayGoodbye(v));
  assert.deepEqual(v.endingDecorations, undefined);
});
test("route and heart trace permit lifts but reject shortcuts and partial scribbles", () => {
  for (const path of [TREE_ROUTE, HEART_ROUTE]) {
    const parts = path.slice(1).map((p, i) => [path[i], p]);
    assert(finaleCoverage(path, parts).complete());
    assert(!finaleCoverage(path, [[path[0], path.at(-1)]]).complete());
    assert(!finaleCoverage(path, parts.slice(0, 2)).complete());
  }
});
test("mouse accessor coordinates and plain touch coordinates produce the same complete traces", () => {
  class MousePointer {
    constructor(position) {
      this.position = position;
    }
    get x() {
      return this.position.x;
    }
    get y() {
      return this.position.y;
    }
  }
  for (const path of [TREE_ROUTE, HEART_ROUTE]) {
    for (const color of [0x45954f, 0xe26487]) {
      const mouse = path.map((p) => finaleStrokePoint(new MousePointer(p), color));
      const touch = path.map((p) => finaleStrokePoint(p, color));
      assert.deepEqual(mouse, touch);
      assert(finaleCoverage(path, [mouse]).complete());
      assert(mouse.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)));
    }
  }
});
test("decorations sanitize saves and persist independent freely placed copies", () => {
  let p = placeDecoration([], "flowers", 500, 450);
  p = placeDecoration(p, "flowers", 700, 600);
  const prior = structuredClone(p);
  p = placeDecoration(p, "flowers", 600, 350, 0);
  assert.deepEqual(p, [{ kind: "flowers", x: 600, y: 350 }, prior[1]]);
  assert.deepEqual(prior[0].x, 500);
  assert.deepEqual(
    validDecorations([null, { kind: "evil", x: 50, y: 100 }, { kind: "vase", x: NaN, y: 200 }, ...p]),
    p,
  );
  assert.deepEqual(validDecorations(Array(500).fill(p[0])).length, 60);
  assert.deepEqual(placeDecoration(p, "vase", -100, 10000).at(-1), { kind: "vase", x: 40, y: 730 });
});
test("chapter five reset preserves amulet, village, preferences, and collectibles", () => {
  const state = freshState();
  Object.assign(state.values, {
    studioTreehouseInvited: true,
    studioGemFound: true,
    studioKindEyes: true,
    villageTasks: ["rooms"],
    voicesOn: false,
    endingParty: true,
    endingDecorations: [{ kind: "flowers", x: 500, y: 500 }],
  });
  const reset = chapterResetState(state, "chapter5");
  assert.deepEqual(reset.values.endingParty, false);
  assert.deepEqual(reset.values.endingDecorations, []);
  assert(reset.values.studioTreehouseInvited && reset.values.studioGemFound && reset.values.studioKindEyes);
  assert.deepEqual(reset.values.villageTasks, ["rooms"]);
  assert.deepEqual(reset.values.voicesOn, false);
  for (const scene of [
    "TreeClearing",
    "TreePipes",
    "TreeAssembly",
    "TreeRoute",
    "TreeDecorate",
    "TreePortal",
  ]) {
    assert.deepEqual(chapterForScene(scene), "chapter5");
    assert.deepEqual(
      resumeScene({ ...state.values, sailDone: true, patchDone: true, currentScene: scene }),
      "TreeClearing",
    );
  }
});
test("tree path becomes a finite connected narrow walkable corridor", () => {
  const before = treeWalkable(false),
    after = treeWalkable(true);
  assert(before.every((p) => p.y >= 680));
  assert(after.some((p) => p.y < 330));
  assert(after.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x > 0 && p.x < 1200));
});
test("finale pipe boards remain solvable and separate from harbor progression", () => {
  for (let seed = 1; seed <= 30; seed++) {
    const p = createWaterway(seed);
    assert(!p.solved);
    assert(waterConnected(p.solution));
    assert.deepEqual(restoreWaterway(p, 999).cells, p.cells);
    assert(restoreWaterway(p, 999, true).solved);
  }
});
