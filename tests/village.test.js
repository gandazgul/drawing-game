import { assert, test } from "vite-plus/test";
import {
  BOX_GOAL,
  BOX_START,
  branchDone,
  BRANCHES,
  doneTasks,
  finishTask,
  MEMORY_ART,
  nextTask,
  slide,
  TASKS,
  villageDone,
} from "../src/village-progress.js";
import { resumeScene } from "../src/state.js";

test("all three branches are required, in every completion order; extras never gate", () => {
  for (const order of [
    ["inn", "birthday", "house"],
    ["inn", "house", "birthday"],
    ["house", "inn", "birthday"],
    ["house", "birthday", "inn"],
    ["birthday", "inn", "house"],
    ["birthday", "house", "inn"],
  ]) {
    let done = [];
    order.forEach((branch, index) => {
      for (const id of BRANCHES[branch].tasks) done = finishTask(done, id);
      assert(branchDone(done, branch));
      assert.deepEqual(villageDone(done), index === 2);
      assert.deepEqual(nextTask(done, branch), undefined);
    });
    assert.deepEqual(done.length, 9);
    assert.deepEqual(finishTask(done, "rope"), done);
  }
});
test("no skipping branch prerequisites and corrupt save values are harmless", () => {
  assert.deepEqual(finishTask([], "rooms"), []);
  assert.deepEqual(doneTasks(["garden", "garden", null, "unknown"]), ["garden"]);
  assert.deepEqual(doneTasks(null), []);
  assert.deepEqual(nextTask([], "house"), "clue");
  assert.deepEqual(Object.keys(TASKS).length, 9);
  assert.deepEqual(new Set(MEMORY_ART).size, 8);
});
test("2 by 3 picture box is solvable by legal slides", () => {
  const q = [[...BOX_START]],
    seen = new Set();
  let solved = false;
  while (q.length) {
    const board = q.shift(),
      key = board.join();
    if (seen.has(key)) continue;
    seen.add(key);
    if (key === BOX_GOAL.join()) {
      solved = true;
      break;
    }
    for (let i = 0; i < 6; i++) q.push(slide(board, i));
  }
  assert(solved);
  assert.deepEqual(slide(BOX_GOAL, 0), BOX_GOAL);
});
test("new village scenes resume without losing old progress", () => {
  const ready = { sailDone: true, patchDone: true, waterwayDone: true, pondClue: true, bridgeDone: true };
  for (const currentScene of ["House", "InnGarden", "BirthdayYard", "HouseLoft", "PictureMemory", "JumpRope"])
    assert.deepEqual(resumeScene({ ...ready, currentScene }), currentScene);
  assert.deepEqual(resumeScene({ ...ready, currentScene: "VillagePuzzle" }), "Village");
  assert.deepEqual(resumeScene({ ...ready, currentScene: "VillageInterior" }), "InnGarden");
  assert.deepEqual(
    resumeScene({ ...ready, currentScene: "VillageInterior", villageTasks: ["garden"] }),
    "VillageInterior",
  );
  assert.deepEqual(resumeScene({ ...ready, bridgeDone: false, currentScene: "House" }), "Harbor");
});
