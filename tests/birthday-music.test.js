import { assert, assertEquals } from "@std/assert";
import { MUSIC_TARGETS, musicHit, musicHits, nextMusicTarget } from "../src/puzzles/birthday-music.js";
Deno.test("music target moves visibly between attempts and stays within the note's travel", () => {
  for (const previous of [undefined, ...MUSIC_TARGETS]) {
    for (const random of [0, .1, .5, .99999]) {
      const x = nextMusicTarget(previous, () => random);
      assert(MUSIC_TARGETS.includes(x));
      assert(x - 72.5 >= 285 && x + 72.5 <= 915);
      if (previous) assert(Math.abs(x - previous) >= 120);
    }
  }
});
Deno.test("music timing judges the current patch, not the old center", () => {
  assert(musicHit(390, 390));
  assert(musicHit(475, 390));
  assert(!musicHit(476, 390));
  assert(!musicHit(600, 390));
  assert(!musicHit(NaN, 390));
  assert(!musicHit(500, 500));
});
Deno.test("saved music score is bounded and invalid saves do not complete the song", () => {
  for (const value of [undefined, null, NaN, Infinity, "5", 4.8]) assertEquals(musicHits(value), 0);
  assertEquals(musicHits(3), 3);
  assertEquals(musicHits(-2), 0);
  assertEquals(musicHits(9), 5);
});
