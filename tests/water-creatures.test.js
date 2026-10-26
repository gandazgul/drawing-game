import { assert, test } from "vite-plus/test";
import { swimMotion, WATER_CREATURES } from "../src/water-creatures.js";

test("all three water scenes mix both axolotls and the sea creature with fish", () => {
  assert.deepEqual(Object.keys(WATER_CREATURES), ["Harbor", "Pond", "Underwater"]);
  for (const population of Object.values(WATER_CREATURES)) {
    for (const art of ["axolotlBlue", "axolotlPink", "seaCreature", "fish"]) {
      assert(population.some((creature) => creature.art === art));
    }
    for (const { art, x, y, width, dx, dy } of population) {
      for (const [cx, cy] of [
        [x, y],
        [x + dx, y + dy],
      ]) {
        assert(cx - width / 2 > 0 && cx + width / 2 < 1200);
        const halfHeight = (width * (art === "seaCreature" ? 1 : 0.6)) / 2;
        assert(cy - halfHeight > 0 && cy + halfHeight < 650);
      }
    }
  }
  assert.deepEqual(WATER_CREATURES.Underwater.filter((c) => c.art === "fish").length, 4);
});

test("swimmers follow bounded journeys and face their return direction", () => {
  for (const art of ["axolotlBlue", "axolotlPink", "fish"]) {
    for (const dx of [-100, 100]) {
      const sprite = {
        x: 300,
        y: 350,
        setFlipX(value) {
          this.flipX = value;
        },
      };
      const tween = swimMotion(sprite, { art, dx, dy: 12 }, 0);
      const flip = sprite.flipX;
      assert.deepEqual(tween.x, 300 + dx);
      assert.deepEqual(tween.y, 362);
      assert.deepEqual(tween.yoyo, true);
      assert.deepEqual(tween.repeat, -1);
      tween.onYoyo();
      assert.deepEqual(sprite.flipX, !flip);
      tween.onRepeat();
      assert.deepEqual(sprite.flipX, flip);
    }
  }
});
