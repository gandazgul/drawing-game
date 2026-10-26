import { assert, test } from "vite-plus/test";
import { bubbleSparkles } from "../src/BubbleSparkles.js";

function setup(reduced) {
  const tweens = [];
  return {
    tweens,
    scene: {
      registry: { get: () => reduced },
      add: {
        star(x, y, points, inner, outer, color) {
          return {
            x,
            y,
            points,
            inner,
            outer,
            color,
            setStrokeStyle() {
              return this;
            },
            setDepth(depth) {
              this.depth = depth;
              return this;
            },
            setAngle(angle) {
              this.angle = angle;
              return this;
            },
            setData() {
              return this;
            },
            destroy() {
              this.destroyed = true;
            },
          };
        },
      },
      tweens: { add: (tween) => tweens.push(tween) },
    },
  };
}

test("bubble pops scatter a bounded colorful sparkle burst and clean it up", () => {
  const { scene, tweens } = setup(false);
  const stars = bubbleSparkles(scene, 300, 400, 2);
  assert.deepEqual(stars.length, 12);
  assert(new Set(stars.map((s) => s.color)).size >= 4);
  for (const tween of tweens) {
    assert(Math.hypot(tween.x - 300, tween.y - 400) < 125);
    assert(tween.duration <= 700);
    assert.deepEqual(tween.alpha, 0);
    assert.deepEqual(tween.targets.depth, 16);
    tween.onComplete();
  }
  assert(stars.every((s) => s.destroyed));
});

test("reduced motion preserves sparkle feedback without flying or spinning", () => {
  const { scene, tweens } = setup(true);
  assert.deepEqual(bubbleSparkles(scene, 300, 400, 0).length, 5);
  for (const tween of tweens) {
    for (const property of ["x", "y", "angle", "scale", "repeat", "yoyo"]) {
      assert.deepEqual(tween[property], undefined);
    }
    assert.deepEqual(tween.alpha, 0);
    assert.deepEqual(tween.duration, 300);
  }
});
