import { assert, test } from "vite-plus/test";
import { CHICKEN_WALKS, chickenWalk } from "../src/chicken.js";
import { STICKERS } from "../src/stickers.js";

test("chickens walk a bounded ground path with pauses and turns, never a flight bob", () => {
  for (const [art, x, y, width, type] of Object.values(CHICKEN_WALKS)) {
    assert.deepEqual(art, "bird"); // Existing art and saves remain compatible.
    assert.deepEqual(type, "ground");
    assert(y > 550 && y < 780);
    const tween = chickenWalk({ x, y });
    assert.deepEqual(tween.x, x + 80);
    assert.deepEqual(tween.y, undefined);
    assert.deepEqual(tween.flipX, true);
    assert(tween.hold > 0 && tween.repeatDelay > 0);
    assert(x - width / 2 > 0 && tween.x + width / 2 < 1200);
  }
});

test("chicken stickers retain collected IDs but live on the floor and use the correct name", () => {
  const chickens = STICKERS.filter((s) => s.art === "bird");
  assert.deepEqual(
    chickens.map((s) => s.id),
    ["village-bird", "loft-bird"],
  );
  for (const chicken of chickens) {
    assert(chicken.name.includes("chicken"));
    assert(chicken.y > 600);
  }
});
