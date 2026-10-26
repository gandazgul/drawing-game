import { assert, test } from "vite-plus/test";
import { SISTER_FRAME, sisterAnimationConfig } from "../src/sister-animations.js";

test("all sister directions share fixed size, foot origin and scale", () => {
  for (const id of ["keila", "olivia"]) {
    const config = sisterAnimationConfig(id);
    assert.deepEqual(Object.keys(config.animationSet), ["front", "side", "back"]);
    for (const entry of Object.values(config.animationSet)) {
      for (const name of Object.values(entry)) {
        assert.deepEqual(config.animationScales[name], 2);
        assert.deepEqual(config.animationOrigins[name], { x: 0.5, y: 500 / 512 });
      }
    }
    assert.deepEqual(SISTER_FRAME, { width: 384, height: 512, ground: 500 });
  }
});

test("reduced motion keeps direction changes without walk or blink loops", () => {
  const { animationSet } = sisterAnimationConfig("keila", true);
  for (const [direction, entry] of Object.entries(animationSet)) {
    assert.deepEqual(entry, { still: `character_keila_${direction}_still` });
  }
});
