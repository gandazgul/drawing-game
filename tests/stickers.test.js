import { assert, test } from "vite-plus/test";
import { stickerCount, STICKERS } from "../src/stickers.js";
import { art } from "../src/art.js";
import { resumeScene, villageReady } from "../src/state.js";

test("eleven fixed sticker slots retain existing finds and add the snowy penguin", () => {
  assert.deepEqual(STICKERS.length, 11);
  assert.deepEqual(new Set(STICKERS.map((s) => s.id)).size, 11);
  assert.deepEqual(stickerCount(["harbor-fish"]), 1);
  assert.deepEqual(stickerCount(STICKERS.map((s) => s.id)), 11);
  assert.deepEqual(stickerCount(["harbor-fish", "harbor-fish", "unknown"]), 1);
  for (const s of STICKERS) assert(art[s.art]);
});
test("inn exploration resumes without adding a sticker progression gate", () => {
  const values = {
    sailDone: true,
    patchDone: true,
    waterwayDone: true,
    pondClue: true,
    bridgeDone: true,
    currentScene: "VillageInterior",
    villageTasks: ["garden"],
  };
  assert(villageReady(values));
  assert.deepEqual(resumeScene(values), "VillageInterior");
  assert.deepEqual(resumeScene({ ...values, bridgeDone: false }), "Harbor");
});
