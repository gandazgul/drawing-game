import { assert, assertEquals } from "@std/assert";
import { findPathInWalkable, pointInPolygon } from "../../Caper/src/movement/pathfinding.js";
import {
  darknessCleared,
  pathRevealed,
  PICTURE_PARTS,
  pictureUncovered,
  STUDIO_GAP,
  STUDIO_STAIRS,
  studioCoverage,
  studioCrayon,
  studioStrokeColor,
  studioWalkable,
  validRub,
} from "../src/puzzles/workshop.js";
import { WORKSHOP_WALL_ART } from "../src/WorkshopWalls.js";
import { scanArt } from "../src/scan-art.js";
import { chapterForScene, chapterResetState } from "../src/chapters.js";
import { freshState, resumeScene } from "../src/state.js";

Deno.test("workshop wall pictures reference only original scans", () => {
  assertEquals(WORKSHOP_WALL_ART.length, 6);
  for (const picture of WORKSHOP_WALL_ART) assert(Object.hasOwn(scanArt, picture.key));
});
Deno.test("workshop strokes preserve each artist's color with legacy fallbacks", () => {
  const green = studioCrayon("keila"), pink = studioCrayon("olivia");
  assertEquals(green, 0x45954f);
  assertEquals(pink, 0xe26487);
  assertEquals(studioStrokeColor({ c: green }), green);
  assertEquals(studioStrokeColor({ c: pink }), pink);
  assertEquals(studioStrokeColor({ c: "bad" }), 0xe6ad24);
  assertEquals(studioStrokeColor({}, pink), pink);
});
Deno.test("picture assembly uses six large source regions, covering the whole original", () => {
  assertEquals(PICTURE_PARTS.length, 6);
  assert(Math.abs(PICTURE_PARTS.reduce((sum, p) => sum + p.source.w * p.source.h, 0) - 1) < .0001);
  assert(!pictureUncovered([0, 0, -1, 224]));
  assert(pictureUncovered(Array.from({ length: 202 }, (_, i) => i)));
});
Deno.test("dark workshop routes cannot reach upper floor or gap before drawing", () => {
  assert(!pointInPolygon({ x: 1000, y: 310 }, studioWalkable(false, false)));
  assert(!pointInPolygon({ x: 660, y: 310 }, studioWalkable(true, false)));
  const poly = studioWalkable(true, true);
  const result = findPathInWalkable({ x: 150, y: 700 }, { x: 150, y: 310 }, poly);
  assert(result.reachedTarget);
  assert(result.path.length > 10, "Must follow the steps, not cut diagonally across the wall");
  let a = { x: 150, y: 700 };
  for (const b of result.path) {
    for (let i = 1; i < 20; i++) {
      assert(pointInPolygon({ x: a.x + (b.x - a.x) * i / 20, y: a.y + (b.y - a.y) * i / 20 }, poly));
    }
    a = b;
  }
});
Deno.test("drawing and erasing require the entire route and survive restoration", () => {
  assert(studioCoverage(STUDIO_STAIRS, [STUDIO_STAIRS]).complete());
  assert(studioCoverage(STUDIO_GAP, [STUDIO_GAP]).complete());
  assert(!studioCoverage(STUDIO_STAIRS, [[STUDIO_STAIRS[0], STUDIO_STAIRS.at(-1)]]).complete());
  assert(pathRevealed(STUDIO_STAIRS, STUDIO_STAIRS));
  assert(!pathRevealed(STUDIO_STAIRS, [STUDIO_STAIRS[0]]));
  assertEquals(validRub([{}, null, { x: NaN, y: 5 }, { x: 5, y: 6 }]), [{ x: 5, y: 6 }]);
});
Deno.test("workshop resume and reset preserve earlier chapters", () => {
  const state = freshState();
  Object.assign(state.values, {
    sailDone: true,
    patchDone: true,
    waterwayDone: true,
    pondClue: true,
    bridgeDone: true,
    forestDanceDone: true,
    forestTrailDone: true,
    currentScene: "StudioWorkroom",
  });
  assertEquals(resumeScene(state.values), "StudioGallery");
  state.values.studioPictureDone = true;
  assertEquals(resumeScene(state.values), "StudioDark");
  state.values.studioStairsDone = true;
  state.values.studioGapDone = true;
  state.values.studioGemFound = true;
  state.values.studioDarkCleared = true;
  assertEquals(resumeScene(state.values), "StudioWorkroom");
  const reset = chapterResetState(state, "chapter4");
  assert(reset.values.forestTrailDone && reset.values.bridgeDone);
  assert(!reset.values.studioGemFound);
  assert(!reset.values.studioDarkCleared);
  assertEquals(chapterForScene("WorkshopPicture"), "chapter4");
});

Deno.test("darkness clears after broad coverage, never repeated rubbing in one spot", () => {
  assert(!darknessCleared(null));
  assert(!darknessCleared(Array.from({ length: 6000 }, () => ({ x: 600, y: 400 }))));
  const rubs = [];
  for (const y of [130, 250, 370]) {
    for (let x = 100; x <= 1150; x += 25) rubs.push({ x, y });
  }
  assert(!darknessCleared(rubs), "Three rows should still leave meaningful darkness below");
  for (let x = 100; x <= 1150; x += 25) rubs.push({ x, y: 490 });
  assert(darknessCleared(rubs), "Should forgive the bottom strip and edge patches");
  assert(darknessCleared(JSON.parse(JSON.stringify(rubs))));
});
