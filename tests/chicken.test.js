import { assert, assertEquals } from "@std/assert";
import { CHICKEN_WALKS, chickenWalk } from "../src/chicken.js";
import { STICKERS } from "../src/stickers.js";

Deno.test("chickens walk a bounded ground path with pauses and turns, never a flight bob", () => {
  for (const [art, x, y, width, type] of Object.values(CHICKEN_WALKS)) {
    assertEquals(art, "bird"); // Existing art and saves remain compatible.
    assertEquals(type, "ground");
    assert(y > 550 && y < 780);
    const tween = chickenWalk({ x, y });
    assertEquals(tween.x, x + 80);
    assertEquals(tween.y, undefined);
    assertEquals(tween.flipX, true);
    assert(tween.hold > 0 && tween.repeatDelay > 0);
    assert(x - width / 2 > 0 && tween.x + width / 2 < 1200);
  }
});

Deno.test("chicken stickers retain collected IDs but live on the floor and use the correct name", () => {
  const chickens = STICKERS.filter((s) => s.art === "bird");
  assertEquals(chickens.map((s) => s.id), ["village-bird", "loft-bird"]);
  for (const chicken of chickens) {
    assert(chicken.name.includes("chicken"));
    assert(chicken.y > 600);
  }
});
