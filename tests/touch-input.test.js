import { assert, test } from "vite-plus/test";
import { fingerCircle, fingerRect, nearestOnPath, traceTouch } from "../src/touch-input.js";
import { SAIL, traceCoverage } from "../src/puzzles/geometry.js";

test("touch tracing guides a nearby finger without changing mouse marks or distant input", () => {
  const path = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ];
  const p = { x: 50, y: 25 };
  assert.deepEqual(traceTouch(p, path, 2, false), p);
  assert.deepEqual(traceTouch(p, path, 2, true), { x: 50, y: 3 });
  assert.deepEqual(traceTouch({ x: 50, y: 37 }, path, 2, true), null);
  assert.deepEqual(nearestOnPath({ x: 105, y: 0 }, path).point, { x: 100, y: 0 });
});

test("guided touch still requires the full outline, and release before ready", () => {
  const coverage = traceCoverage();
  for (let i = 1; i < SAIL.length; i++) {
    const a = SAIL[i - 1],
      b = SAIL[i];
    let previous = null;
    for (let n = 0; n <= 30; n++) {
      const finger = { x: a.x + ((b.x - a.x) * n) / 30 + 12, y: a.y + ((b.y - a.y) * n) / 30 };
      const point = traceTouch(finger, SAIL, 2, true);
      if (point) coverage.stroke(previous ?? point, point);
      previous = point;
    }
    if (i === 1) assert.deepEqual(coverage.complete(), false);
  }
  assert.closeTo(coverage.ratio, 1, 0.03);
  assert.deepEqual(coverage.complete({ strokeActive: true }), false);
  assert.deepEqual(coverage.complete(), true);
});

test("finale touch areas retain 48 CSS pixels after resize and stay inside the canvas", () => {
  const original = globalThis.matchMedia;
  globalThis.matchMedia = () => ({ matches: true });
  try {
    let canvasWidth = 600;
    const scene = {
      scale: { gameSize: { width: 1200, height: 800 } },
      game: { canvas: { getBoundingClientRect: () => ({ width: canvasWidth }) } },
    };
    const shape = { radius: 27, setInteractive: (config) => config };
    const circle = fingerCircle(scene, shape, 48);
    const object = {
      x: 970,
      y: 755,
      width: 170,
      height: 56,
      originX: 0.5,
      originY: 0.5,
      setInteractive: (config) => config,
    };
    const rectangle = fingerRect(scene, object, 48);
    for (const width of [600, 400, 1000]) {
      canvasWidth = width;
      const units = 1200 / width;
      assert.deepEqual(circle.hitAreaCallback(circle.hitArea, 27 + 23 * units, 27), true);
      assert.deepEqual(circle.hitAreaCallback(circle.hitArea, 27 + 25 * units, 27), false);
      // Bottom-aligned expanded rectangle extends upward, not outside the stage.
      const top = 755 - 28;
      const height = Math.max(56, 48 * units),
        hitTop = Math.min(755 - height / 2, 800 - height);
      assert.deepEqual(rectangle.hitAreaCallback({}, 85, hitTop + 1 - top), true);
      assert.deepEqual(rectangle.hitAreaCallback({}, 85, hitTop - 1 - top), false);
      assert.deepEqual(rectangle.hitAreaCallback({}, 85, hitTop + height - 1 - top), true);
      assert.deepEqual(rectangle.hitAreaCallback({}, 85, 801 - top), false);
    }
  } finally {
    if (original) globalThis.matchMedia = original;
    else delete globalThis.matchMedia;
  }
});
