import { assert, assertEquals } from "@std/assert";
import { amuletComplete, climaxPending } from "../src/puzzles/amulet-climax.js";
import { chapterResetState } from "../src/chapters.js";
import { freshState } from "../src/state.js";
import { AMULET_PARTS, amuletSVG } from "../src/amulet-art.js";
import { DIALOGUE } from "../src/dialogue.js";

const rings = ["garden", "luggage", "rooms", "clue", "stairs", "box"];
Deno.test("Bounka's gender stays undefined with they/them references", () => {
  for (const key of ["forestFollowBounka", "houseStairsHelp", "innGuestsHelp", "birthdayFlagsHelp"]) {
    const lines = DIALOGUE[key];
    assert(lines, `Missing dialogue ${key}`);
    const text = lines.map(([, line]) => line).join(" ");
    assert(/\b(they|their)\b/i.test(text));
    assert(!/\b(he|she|his|her|him)\b/i.test(text));
  }
});
Deno.test("amulet climax requires every recovered part, not just Bounka's gem", () => {
  assert(!amuletComplete({ studioGemFound: true, villageTasks: [] }));
  assert(!amuletComplete({ studioGemFound: false, villageTasks: rings }));
  assert(amuletComplete({ studioGemFound: true, villageTasks: rings }));
  assert(climaxPending({ studioGemFound: false }));
  assert(!climaxPending({ studioGemFound: true, villageTasks: [] }));
});
Deno.test("legacy and interrupted gem saves resume the unpaid celebration or invitation once", () => {
  const values = { studioGemFound: true, villageTasks: rings };
  assert(climaxPending(values));
  values.studioAmuletCelebrated = true;
  assert(climaxPending(values));
  values.studioTreehouseInvited = true;
  assert(!climaxPending(values));
});
Deno.test("chapter four reset replays the climax without losing village rings", () => {
  const state = freshState();
  Object.assign(state.values, {
    villageTasks: rings,
    studioGemFound: true,
    studioAmuletCelebrated: true,
    studioTreehouseInvited: true,
    studioKindEyes: true,
  });
  const reset = chapterResetState(state, "chapter4");
  for (
    const key of ["studioGemFound", "studioAmuletCelebrated", "studioTreehouseInvited", "studioKindEyes"]
  ) assertEquals(reset.values[key], false);
  assertEquals(reset.values.villageTasks, rings);
});
Deno.test("assembly and modal share the four original heart shapes and colors", () => {
  assertEquals(AMULET_PARTS.map((p) => p.color), ["#7250a0", "#e26487", "#e6ad24", "#26798c"]);
  for (const part of AMULET_PARTS) assert(amuletSVG.includes(part.path));
});
