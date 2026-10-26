import { assertAlmostEquals, assertEquals } from "@std/assert";
import { framePlacement, measureFrames } from "../assets/concepts/animation-review/frame-layout.js";

Deno.test("unevenly spaced source figures are measured independently of grid cells", () => {
  const width = 240, height = 160, data = new Uint8ClampedArray(width * height * 4);
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      const left = 6 + col * 56 + col * 2, top = row * 80 + 3 + col;
      for (let y = top; y < top + 60 + col; y++) {
        for (let x = left; x < left + 26 + col; x++) data[(y * width + x) * 4 + 3] = 255;
      }
    }
  }
  const frames = measureFrames({ width, height, data });
  assertEquals(frames.length, 8);
  for (const [i, frame] of frames.entries()) {
    assertEquals(frame.x, 6 + i % 4 * 58);
    const target = framePlacement(frame, 150, 395, 372);
    assertEquals(target.height, 372);
    assertEquals(target.y + target.height, 395);
    assertAlmostEquals(target.x + frame.center * target.height / frame.height, 150);
    assertAlmostEquals(target.width / frame.width, target.height / frame.height);
  }
});
