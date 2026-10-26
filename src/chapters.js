import { freshState } from "./state.js";
import { STICKERS } from "./stickers.js";

// Caper owns the reactive store; these story boundaries belong to the game.
export const CHAPTERS = {
  chapter1: {
    number: 1,
    name: "Harbor and pond",
    start: "Harbor",
    scenes: ["Harbor", "Repair", "Pond", "Underwater", "Waterway"],
  },
  chapter2: {
    number: 2,
    name: "The village",
    start: "Port",
    scenes: [
      "Port",
      "BridgeColors",
      "BridgeDraw",
      "Village",
      "VillageInterior",
      "InnGarden",
      "BirthdayYard",
      "House",
      "HouseLoft",
      "VillagePuzzle",
      "StairRepair",
      "JumpRope",
      "PictureMemory",
      "FrozenPond",
      "PenguinSlide",
      "SnowmanBuilder",
      "CloudGarden",
      "CloudPicnic",
    ],
  },
  chapter3: {
    number: 3,
    name: "The forest",
    start: "ForestEdge",
    scenes: ["ForestEdge", "ForestDraw", "ForestTrail", "ForestNumbers", "StudioApproach"],
  },
  // Future scenes register here when those chapters are built.
  chapter4: {
    number: 4,
    name: "Bounka's studio",
    start: "StudioGallery",
    scenes: ["StudioGallery", "WorkshopPicture", "StudioDark", "StudioWorkroom", "StudioHome"],
  },
  chapter5: {
    number: 5,
    name: "Our tree house",
    start: "TreeClearing",
    scenes: ["TreeClearing", "TreePipes", "TreeAssembly", "TreeRoute", "TreeDecorate", "TreePortal"],
  },
};
export function chapterForScene(scene, fallback = "chapter1") {
  return Object.keys(CHAPTERS).find((id) => CHAPTERS[id].scenes.includes(scene)) ??
    (CHAPTERS[fallback] ? fallback : "chapter1");
}
export function enterChapter(store, scene) {
  const id = chapterForScene(scene, store.get("chapter"));
  if (store.get("chapter") !== id) store.set("chapter", id);
  return id;
}
const harborKeys = new Set([
  "arrived",
  "sailDone",
  "patchDone",
  "metMermaid",
  "waterwayDone",
  "waterwayPuzzle",
  "waterwayReplay",
  "metBigMermaid",
  "pondClue",
  "poppedBubbles",
  "pipeTurns",
  "sailStrokes",
  "patchStrokes",
]);
const villageKeys = new Set([
  "portArrived",
  "bridgeDone",
  "bridgeStrokes",
  "bridgeBands",
  "bridgeColors",
  "bridgeArtVersion",
  "innRoom",
  "innGardenHelpSeen",
  "innGardenThanksSeen",
  "houseStairsHelpSeen",
  "ropeBest",
]);
export function keyChapter(key) {
  if (harborKeys.has(key)) return "chapter1";
  if (villageKeys.has(key) || /^(village|snow)/.test(key)) return "chapter2";
  if (/^forest/.test(key)) return "chapter3";
  if (/^studio/.test(key)) return "chapter4";
  if (/^ending/.test(key)) return "chapter5";
  return null;
}
export function chapterResetState(state, id) {
  const chapter = CHAPTERS[id];
  if (!chapter?.start) throw Error("This chapter has no playable starting scene yet.");
  const result = structuredClone(state), defaults = freshState().values;
  for (const key of Object.keys(result.values)) if (keyChapter(key) === id) delete result.values[key];
  for (const [key, value] of Object.entries(defaults)) if (keyChapter(key) === id) result.values[key] = value;
  result.values.chapter = id;
  result.values.currentScene = chapter.start;
  const removed = new Set(STICKERS.filter((s) => chapterForScene(s.scene) === id).map((s) => s.id));
  result.collections.stickers = new Set(
    [...result.collections.stickers ?? []].filter((s) => !removed.has(s)),
  );
  return result;
}
export function resetChapter(store, id) {
  if (store.isReplaying()) store.endReplay();
  store.replaceState(
    chapterResetState({ values: store.values, collections: store.collections, items: store.items }, id),
  );
  store.handleChange();
  return CHAPTERS[id].start;
}
