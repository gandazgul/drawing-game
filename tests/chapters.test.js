import { assert, assertEquals } from "@std/assert";
import { chapterForScene, chapterResetState, CHAPTERS, enterChapter, resetChapter } from "../src/chapters.js";
import { freshState } from "../src/state.js";
import { Store } from "../../Caper/src/state/Store.js";

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
Deno.test("five named chapters cover current scenes including village snow branch", () => {
  assertEquals(Object.values(CHAPTERS).map((c) => c.number), [1, 2, 3, 4, 5]);
  assertEquals(chapterForScene("Underwater"), "chapter1");
  assertEquals(chapterForScene("BridgeDraw"), "chapter2");
  assertEquals(chapterForScene("FrozenPond"), "chapter2");
  assertEquals(chapterForScene("StairRepair"), "chapter2");
  assertEquals(chapterForScene("ForestEdge"), "chapter3");
  assertEquals(chapterForScene("Future", "chapter4"), "chapter4");
  assertEquals(chapterForScene("Unknown", "paint"), "chapter1");
  assertEquals(chapterResetState(progressed(), "chapter4").values.currentScene, "StudioGallery");
  assertEquals(chapterResetState(progressed(), "chapter5").values.currentScene, "TreeClearing");
});
Deno.test("village reset keeps harbor, later progress, preferences and unrelated collections", () => {
  const before = progressed(), after = chapterResetState(before, "chapter2");
  assertEquals(after.values.currentScene, "Port");
  assertEquals(after.values.chapter, "chapter2");
  assert(after.values.sailDone && after.values.waterwayDone && after.values.pondClue);
  assertEquals(after.values.sailStrokes, before.values.sailStrokes);
  assertEquals(after.values.villageTasks, []);
  assertEquals(after.values.village_stairs, undefined);
  assertEquals(after.values.villageSeen_house, undefined);
  assertEquals(after.values.villagePrompt_luggage, undefined);
  assertEquals(after.values.villagePrompt_bunting, undefined);
  assertEquals(after.values.villageReplay_rooms, undefined);
  assertEquals(after.values.village_bunting_layout, undefined);
  assertEquals(after.values.houseStairsHelpSeen, undefined);
  assertEquals(after.values.bridgeDone, false);
  assertEquals(after.values.snowPieces, []);
  assertEquals(after.values.snowBuilderUnlocked, false);
  assert(after.values.forestTestDone && after.values.studioTestDone && after.values.endingTestDone);
  assertEquals(after.values.voicesOn, false);
  assertEquals(after.collections.stickers, new Set(["harbor-fish", "pond-bee"]));
  assertEquals(after.collections.inventory, before.collections.inventory);
  assertEquals(after.items, before.items);
  assertEquals(before.values.villageTasks, ["garden", "clue", "stairs"]);
});
Deno.test("revisiting chapter one resets only harbor and pond, forest reset preserves village", () => {
  const after = chapterResetState(progressed(), "chapter1");
  assertEquals(after.values.currentScene, "Harbor");
  assertEquals(after.values.sailDone, false);
  assertEquals(after.values.sailStrokes, []);
  assertEquals(after.values.waterwayDone, false);
  assertEquals(after.values.villageTasks, ["garden", "clue", "stairs"]);
  assertEquals(after.collections.stickers, new Set(["port-bug", "loft-bird", "snow-penguin"]));
  const forest = chapterResetState(progressed(), "chapter3");
  assertEquals(forest.values.forestTestDone, undefined);
  assert(forest.values.bridgeDone && forest.values.studioTestDone);
});
Deno.test("Caper integration migrates chapter on entry and resets through its store", () => {
  const store = new Store();
  store.configure({ saveKey: "chapter-test", createFreshState: progressed });
  assertEquals(enterChapter(store, "House"), "chapter2");
  assertEquals(store.get("chapter"), "chapter2");
  assertEquals(resetChapter(store, "chapter2"), "Port");
  assertEquals(store.get("villageTasks"), []);
  assert(store.get("sailDone"));
  assertEquals(freshState().values.voicesOn, true);
});
