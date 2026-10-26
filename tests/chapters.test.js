import { assert, test } from "vite-plus/test";
import { chapterForScene, chapterResetState, CHAPTERS, enterChapter, resetChapter } from "../src/chapters.js";
import { freshState } from "../src/state.js";
import { Store } from "./helpers/caper.js";

const progressed = () => ({
  values: {
    ...freshState().values,
    chapter: "paint",
    currentScene: "House",
    sailDone: true,
    patchDone: true,
    waterwayDone: true,
    pondClue: true,
    sailStrokes: [[{ x: 1, y: 1 }]],
    villageTasks: ["garden", "clue", "stairs"],
    village_stairs: [0, 1],
    villageSeen_house: true,
    villagePrompt_luggage: true,
    villagePrompt_bunting: true,
    villageReplay_rooms: { picture: "pond", placed: [1] },
    village_bunting_layout: [[0, 1]],
    houseStairsHelpSeen: true,
    bridgeDone: true,
    portArrived: true,
    snowBuilderUnlocked: true,
    snowPieces: [{ id: "hat" }],
    forestTestDone: true,
    studioTestDone: true,
    endingTestDone: true,
    voicesOn: false,
    effectsOn: false,
  },
  collections: {
    stickers: new Set(["harbor-fish", "pond-bee", "port-bug", "loft-bird", "snow-penguin"]),
    inventory: new Set(["keepsake"]),
  },
  items: { keepsake: "found" },
});
test("five named chapters cover current scenes including village snow branch", () => {
  assert.deepEqual(
    Object.values(CHAPTERS).map((c) => c.number),
    [1, 2, 3, 4, 5],
  );
  assert.deepEqual(chapterForScene("Underwater"), "chapter1");
  assert.deepEqual(chapterForScene("BridgeDraw"), "chapter2");
  assert.deepEqual(chapterForScene("FrozenPond"), "chapter2");
  assert.deepEqual(chapterForScene("StairRepair"), "chapter2");
  assert.deepEqual(chapterForScene("ForestEdge"), "chapter3");
  assert.deepEqual(chapterForScene("Future", "chapter4"), "chapter4");
  assert.deepEqual(chapterForScene("Unknown", "paint"), "chapter1");
  assert.deepEqual(chapterResetState(progressed(), "chapter4").values.currentScene, "StudioGallery");
  assert.deepEqual(chapterResetState(progressed(), "chapter5").values.currentScene, "TreeClearing");
});
test("village reset keeps harbor, later progress, preferences and unrelated collections", () => {
  const before = progressed(),
    after = chapterResetState(before, "chapter2");
  assert.deepEqual(after.values.currentScene, "Port");
  assert.deepEqual(after.values.chapter, "chapter2");
  assert(after.values.sailDone && after.values.waterwayDone && after.values.pondClue);
  assert.deepEqual(after.values.sailStrokes, before.values.sailStrokes);
  assert.deepEqual(after.values.villageTasks, []);
  assert.deepEqual(after.values.village_stairs, undefined);
  assert.deepEqual(after.values.villageSeen_house, undefined);
  assert.deepEqual(after.values.villagePrompt_luggage, undefined);
  assert.deepEqual(after.values.villagePrompt_bunting, undefined);
  assert.deepEqual(after.values.villageReplay_rooms, undefined);
  assert.deepEqual(after.values.village_bunting_layout, undefined);
  assert.deepEqual(after.values.houseStairsHelpSeen, undefined);
  assert.deepEqual(after.values.bridgeDone, false);
  assert.deepEqual(after.values.snowPieces, []);
  assert.deepEqual(after.values.snowBuilderUnlocked, false);
  assert(after.values.forestTestDone && after.values.studioTestDone && after.values.endingTestDone);
  assert.deepEqual(after.values.voicesOn, false);
  assert.deepEqual(after.collections.stickers, new Set(["harbor-fish", "pond-bee"]));
  assert.deepEqual(after.collections.inventory, before.collections.inventory);
  assert.deepEqual(after.items, before.items);
  assert.deepEqual(before.values.villageTasks, ["garden", "clue", "stairs"]);
});
test("revisiting chapter one resets only harbor and pond, forest reset preserves village", () => {
  const after = chapterResetState(progressed(), "chapter1");
  assert.deepEqual(after.values.currentScene, "Harbor");
  assert.deepEqual(after.values.sailDone, false);
  assert.deepEqual(after.values.sailStrokes, []);
  assert.deepEqual(after.values.waterwayDone, false);
  assert.deepEqual(after.values.villageTasks, ["garden", "clue", "stairs"]);
  assert.deepEqual(after.collections.stickers, new Set(["port-bug", "loft-bird", "snow-penguin"]));
  const forest = chapterResetState(progressed(), "chapter3");
  assert.deepEqual(forest.values.forestTestDone, undefined);
  assert(forest.values.bridgeDone && forest.values.studioTestDone);
});
test("Caper integration migrates chapter on entry and resets through its store", () => {
  const store = new Store();
  store.configure({ saveKey: "chapter-test", createFreshState: progressed });
  assert.deepEqual(enterChapter(store, "House"), "chapter2");
  assert.deepEqual(store.get("chapter"), "chapter2");
  assert.deepEqual(resetChapter(store, "chapter2"), "Port");
  assert.deepEqual(store.get("villageTasks"), []);
  assert(store.get("sailDone"));
  assert.deepEqual(freshState().values.voicesOn, true);
});
