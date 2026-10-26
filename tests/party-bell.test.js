import { assert, test } from "vite-plus/test";
import { ringPartyBell } from "../src/party-bell.js";

function fixture(reduced) {
  const calls = [];
  const bell = {
    x: 835,
    y: 338,
    angle: 12,
    alpha: 0.65,
    setAngle(n) {
      this.angle = n;
      return this;
    },
    setAlpha(n) {
      this.alpha = n;
      return this;
    },
  };
  const scene = {
    registry: { get: () => reduced },
    tweens: {
      killTweensOf: (target) => calls.push(["stop", target]),
      chain: (config) => calls.push(["chain", config]),
      add: (config) => calls.push(["add", config]),
    },
  };
  return { scene, bell, calls };
}
test("party bell rings from its fixed branch anchor and settles upright", () => {
  const { scene, bell, calls } = fixture(false);
  ringPartyBell(scene, bell);
  assert.deepEqual(calls[0], ["stop", bell]);
  assert.deepEqual(bell.angle, 0);
  assert.deepEqual(bell.alpha, 1);
  const chain = calls[1][1];
  assert.deepEqual(
    chain.tweens.map((t) => t.angle),
    [-18, 15, -10, 6, 0],
  );
  assert.deepEqual([bell.x, bell.y], [835, 338]);
  ringPartyBell(scene, bell);
  assert.deepEqual(calls[2], ["stop", bell]);
});
test("reduced motion acknowledges the bell without swinging", () => {
  const { scene, bell, calls } = fixture(true);
  ringPartyBell(scene, bell);
  assert.deepEqual(calls[1][0], "add");
  assert.deepEqual(calls[1][1].angle, undefined);
  assert.deepEqual(calls[1][1].yoyo, true);
  assert.deepEqual(bell.angle, 0);
});
