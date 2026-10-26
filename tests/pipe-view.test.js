import { assert, test } from "vite-plus/test";
import { drawPipe } from "../src/PipeView.js";

function graphics() {
  const calls = [];
  const g = {};
  for (const name of ["lineStyle", "lineBetween", "fillStyle", "fillCircle", "strokeCircle"]) {
    g[name] = (...args) => {
      calls.push({ name, args });
      return g;
    };
  }
  return { g, calls };
}
test("end pipes have a bulb at their center and flat openings in all four rotations", () => {
  for (const mask of [1, 2, 4, 8]) {
    const { g, calls } = graphics();
    drawPipe(g, 100, 200, mask, false);
    assert.deepEqual(calls.filter((c) => c.name === "lineBetween").length, 2);
    const circles = calls.filter((c) => c.name === "fillCircle");
    assert(circles.every((c) => c.args[0] === 150 && c.args[1] === 250));
    assert(circles.some((c) => c.args[2] === 19));
  }
});
test("source inlet continuously joins the outside to the source center", () => {
  for (const mask of [2, 4, 6]) {
    const { g, calls } = graphics();
    drawPipe(g, 300, 148, mask, true, true);
    const inlet = calls.filter((c) => c.name === "lineBetween" && c.args[2] === 230);
    assert.deepEqual(inlet.length, 2); // Outline and water both reach the outside.
    assert.deepEqual(inlet[0].args, [350, 198, 230, 198]);
    assert.deepEqual(calls.filter((c) => c.name === "strokeCircle").length, 1);
  }
});
