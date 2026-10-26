import { assertEquals } from "@std/assert";
import { SISTER_FRAME, sisterAnimationConfig } from "../src/sister-animations.js";

Deno.test("all sister directions share fixed size, foot origin and scale", () => {
  for (const id of ["keila", "olivia"]) {
    const config = sisterAnimationConfig(id);
    assertEquals(Object.keys(config.animationSet), ["front", "side", "back"]);
    for (const entry of Object.values(config.animationSet)) {
      for (const name of Object.values(entry)) {
        assertEquals(config.animationScales[name], 2);
        assertEquals(config.animationOrigins[name], { x: .5, y: 500 / 512 });
      }
    }
    assertEquals(SISTER_FRAME, { width: 384, height: 512, ground: 500 });
  }
});

Deno.test("reduced motion keeps direction changes without walk or blink loops", () => {
  const { animationSet } = sisterAnimationConfig("keila", true);
  for (const [direction, entry] of Object.entries(animationSet)) {
    assertEquals(entry, { still: `character_keila_${direction}_still` });
  }
});
