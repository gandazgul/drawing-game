import { assert, assertEquals } from "@std/assert";
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

Deno.test("all three branches are required, in every completion order; extras never gate", () => {
  for (
    const order of [
      ["inn", "birthday", "house"],
      ["inn", "house", "birthday"],
      ["house", "inn", "birthday"],
      ["house", "birthday", "inn"],
      ["birthday", "inn", "house"],
      ["birthday", "house", "inn"],
    ]
  ) {
    let done = [];
    order.forEach((branch, index) => {
      for (const id of BRANCHES[branch].tasks) done = finishTask(done, id);
      assert(branchDone(done, branch));
      assertEquals(villageDone(done), index === 2);
      assertEquals(nextTask(done, branch), undefined);
    });
    assertEquals(done.length, 9);
    assertEquals(finishTask(done, "rope"), done);
  }
});
Deno.test("no skipping branch prerequisites and corrupt save values are harmless", () => {
  assertEquals(finishTask([], "rooms"), []);
  assertEquals(doneTasks(["garden", "garden", null, "unknown"]), ["garden"]);
  assertEquals(doneTasks(null), []);
  assertEquals(nextTask([], "house"), "clue");
  assertEquals(Object.keys(TASKS).length, 9);
  assertEquals(new Set(MEMORY_ART).size, 8);
});
Deno.test("2 by 3 picture box is solvable by legal slides", () => {
  const q = [[...BOX_START]], seen = new Set();
  let solved = false;
  while (q.length) {
    const board = q.shift(), key = board.join();
    if (seen.has(key)) continue;
    seen.add(key);
    if (key === BOX_GOAL.join()) {
      solved = true;
      break;
    }
    for (let i = 0; i < 6; i++) q.push(slide(board, i));
  }
  assert(solved);
  assertEquals(slide(BOX_GOAL, 0), BOX_GOAL);
});
Deno.test("new village scenes resume without losing old progress", () => {
  const ready = { sailDone: true, patchDone: true, waterwayDone: true, pondClue: true, bridgeDone: true };
  for (
    const currentScene of ["House", "InnGarden", "BirthdayYard", "HouseLoft", "PictureMemory", "JumpRope"]
  ) assertEquals(resumeScene({ ...ready, currentScene }), currentScene);
  assertEquals(resumeScene({ ...ready, currentScene: "VillagePuzzle" }), "Village");
  assertEquals(resumeScene({ ...ready, currentScene: "VillageInterior" }), "InnGarden");
  assertEquals(
    resumeScene({ ...ready, currentScene: "VillageInterior", villageTasks: ["garden"] }),
    "VillageInterior",
  );
  assertEquals(resumeScene({ ...ready, bridgeDone: false, currentScene: "House" }), "Harbor");
});
