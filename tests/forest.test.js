import { assert, test } from "vite-plus/test";
import {
  canForestStep,
  DANCE_PATH,
  danceCoverage,
  forestBoardForVisit,
  forestClues,
  forestCompletion,
  forestSolved,
  forestWalkable,
  neighbors,
  newForestBoard,
  safeForestBoard,
  WOODLAND_PATH,
  WOODLAND_STONES,
  woodlandWalkable,
} from "../src/puzzles/forest.js";
import { findPath, pointInPolygon, snapToPolygon } from "./helpers/caper.js";
import { chapterForScene, chapterResetState } from "../src/chapters.js";
import { freshState, resumeScene } from "../src/state.js";

test("500 seeded woodland trails are solvable, varied and stable", () => {
  const distinct = new Set();
  for (let seed = 1; seed <= 500; seed++) {
    const board = newForestBoard(seed);
    assert.deepEqual(board, newForestBoard(seed));
    assert.deepEqual(new Set(board.solution).size, 25);
    assert(board.solution.every((n, i, a) => !i || neighbors(a[i - 1]).includes(n)));
    const path = [];
    for (const n of board.solution) {
      assert(canForestStep(board, path, n));
      path.push(n);
    }
    board.path = path;
    assert(forestSolved(board));
    assert.deepEqual(
      Object.values(forestClues(board)),
      [1, 2, 3, 4, 5, 6].sort((a, b) => {
        return board.solution[[0, 4, 8, 13, 18, 24][a - 1]] - board.solution[[0, 4, 8, 13, 18, 24][b - 1]];
      }),
    );
    distinct.add(board.solution.join());
  }
  assert(distinct.size > 400);
});
test("number path rejects skips, diagonals, revisits and early last number", () => {
  const board = newForestBoard(52),
    first = board.solution[0];
  assert(!canForestStep(board, [], board.solution[1]));
  assert(!canForestStep(board, [first], first));
  assert(!canForestStep(board, [first], -1));
  assert(!canForestStep(board, board.solution.slice(0, 5), board.solution[24]));
  const raw = { ...board, path: [first, first, 99] };
  assert.deepEqual(safeForestBoard(raw).path, [first]);
  assert.deepEqual(safeForestBoard(null, 52), board);
});
test("hints complete valid prefixes without discarding the player's route", () => {
  for (let seed = 1; seed < 35; seed++) {
    const board = newForestBoard(seed);
    for (const length of [1, 5, 13, 24]) {
      const prefix = board.solution.slice(0, length),
        answer = forestCompletion(board, prefix);
      assert(answer);
      assert.deepEqual(answer.slice(0, length), prefix);
      assert(forestSolved({ ...board, path: answer }));
    }
  }
});
test("dance trail permits small gaps, waits for lift, and expands the walkable world", () => {
  const c = danceCoverage([DANCE_PATH]);
  assert(c.complete());
  assert(!c.complete({ strokeActive: true }));
  assert(!danceCoverage([DANCE_PATH.slice(0, 3)]).complete());
  assert.deepEqual(c.requiredRatio, 0.88);
  assert(Math.max(...forestWalkable(true).map((p) => p.x)) > 1000);
  assert(Math.max(...forestWalkable(false).map((p) => p.x)) < 400);
});
test("forest resume and chapter reset keep village and snow safe", () => {
  const ready = { sailDone: true, patchDone: true, waterwayDone: true, pondClue: true, bridgeDone: true };
  assert.deepEqual(resumeScene({ ...ready, currentScene: "ForestNumbers" }), "ForestEdge");
  assert.deepEqual(
    resumeScene({ ...ready, forestDanceDone: true, currentScene: "ForestNumbers" }),
    "ForestTrail",
  );
  assert.deepEqual(
    resumeScene({ ...ready, forestDanceDone: true, forestTrailDone: true, currentScene: "StudioApproach" }),
    "StudioApproach",
  );
  for (const key of ["ForestDraw", "ForestTrail", "ForestNumbers", "StudioApproach"]) {
    assert.deepEqual(chapterForScene(key), "chapter3");
  }
  const state = freshState();
  Object.assign(state.values, ready, {
    forestDanceDone: true,
    forestBoard: newForestBoard(2),
    forestBearMet: true,
    forestBounkaMet: true,
    snowBuilderUnlocked: true,
    villageTasks: ["garden"],
  });
  const reset = chapterResetState(state, "chapter3");
  assert.deepEqual(reset.values.forestDanceDone, false);
  assert.deepEqual(reset.values.forestBounkaMet, false);
  assert.deepEqual(reset.values.forestBoard, null);
  assert.deepEqual(reset.values.forestBearMet, undefined);
  assert.deepEqual(reset.values.villageTasks, ["garden"]);
  assert(reset.values.snowBuilderUnlocked && reset.values.sailDone);
});

test("woodland stones and both sisters' route stay on the painted path", () => {
  const polygon = woodlandWalkable(true);
  assert.deepEqual(WOODLAND_STONES.length, 6);
  for (const p of WOODLAND_STONES) assert(pointInPolygon(p, polygon));
  assert(!pointInPolygon(WOODLAND_STONES.at(-1), woodlandWalkable(false)));
  assert(!pointInPolygon({ x: 850, y: 650 }, polygon));
  for (const offset of [0, 12]) {
    const target = WOODLAND_PATH.at(-1);
    const route = [
      { x: 300, y: 720 },
      ...findPath(
        { x: 300, y: 720 },
        {
          x: target.x - offset,
          y: target.y + offset,
        },
        polygon,
      ),
    ];
    assert(route.length > 3, "Route must turn with the painted trail");
    for (let i = 1; i < route.length; i++) {
      const a = route[i - 1],
        b = route[i];
      for (let t = 0.01; t < 1; t += 0.05) {
        const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
        const snapped = snapToPolygon(p, polygon);
        assert(Math.hypot(p.x - snapped.x, p.y - snapped.y) < 0.01, "Walking segment cut across grass");
      }
    }
  }
});

test("completed Number Path replays change clues, while partial replays stay stable", () => {
  for (let seed = 0; seed < 100; seed++) {
    const board = newForestBoard(seed);
    board.path = [...board.solution];
    const next = forestBoardForVisit(board, seed);
    assert(JSON.stringify(forestClues(next)) !== JSON.stringify(forestClues(board)));
    assert.deepEqual(next.path, [next.solution[0]]);
    assert(forestSolved({ ...next, path: next.solution }));
    next.path = next.solution.slice(0, 5);
    assert.deepEqual(forestBoardForVisit(next, seed + 999), next);
  }
});
