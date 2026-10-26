import { assertEquals } from "@std/assert";
import { drawPatch } from "../src/puzzles/patch-art.js";

function recordingCanvas() {
  const calls = [];
  const ctx = {};
  for (
    const name of [
      "clearRect",
      "save",
      "beginPath",
      "ellipse",
      "clip",
      "fillRect",
      "moveTo",
      "lineTo",
      "stroke",
      "arc",
      "fill",
      "restore",
    ]
  ) ctx[name] = (...args) => calls.push([name, ...args, ctx.strokeStyle]);
  return { ctx, calls };
}

Deno.test("boat patch replays the saved colors and coordinates inside its ellipse", () => {
  const { ctx, calls } = recordingCanvas();
  drawPatch(ctx, [[{ x: 432, y: 425, c: 0xe26487 }, { x: 600, y: 495, c: 0x7250a0 }]], [
    0xe26487,
    0x7250a0,
  ], 0x513272);
  assertEquals(calls.filter(([name]) => name === "lineTo"), [
    ["lineTo", 0, 0, "#e26487"],
    ["lineTo", 168, 70, "#7250a0"],
  ]);
  assertEquals(
    calls.findIndex(([name]) => name === "clip") < calls.findIndex(([name]) => name === "stroke"),
    true,
  );
  assertEquals(ctx.lineWidth, 60);
  assertEquals(calls.filter(([name]) => name === "arc").length, 2);
  assertEquals(calls.at(-1)[0], "restore");
});

Deno.test("old saves without patch strokes remain safe and invalid colors use ink", () => {
  const { ctx, calls } = recordingCanvas();
  drawPatch(ctx, [], [], 0x513272);
  assertEquals(calls.filter(([name]) => name === "stroke").length, 0);
  drawPatch(ctx, [[{ x: 600, y: 495, c: "bad" }]], [0x7250a0], 0x513272);
  assertEquals(ctx.strokeStyle, "#513272");
});
