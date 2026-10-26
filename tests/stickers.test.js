import { assert, assertEquals } from "@std/assert";
import { stickerCount, STICKERS } from "../src/stickers.js";
import { art } from "../src/art.js";
import { resumeScene, villageReady } from "../src/state.js";

Deno.test("eleven fixed sticker slots retain existing finds and add the snowy penguin", () => {
  assertEquals(STICKERS.length, 11);
  assertEquals(new Set(STICKERS.map((s) => s.id)).size, 11);
  assertEquals(stickerCount(["harbor-fish"]), 1);
  assertEquals(stickerCount(STICKERS.map((s) => s.id)), 11);
  assertEquals(stickerCount(["harbor-fish", "harbor-fish", "unknown"]), 1);
  for (const s of STICKERS) assert(art[s.art]);
});
Deno.test("inn exploration resumes without adding a sticker progression gate", () => {
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
  assertEquals(resumeScene(values), "VillageInterior");
  assertEquals(resumeScene({ ...values, bridgeDone: false }), "Harbor");
});
