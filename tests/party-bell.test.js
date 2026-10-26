import { assertEquals } from "@std/assert";
import { ringPartyBell } from "../src/party-bell.js";

function fixture(reduced) {
  const calls = [];
  const bell = {
    x: 835,
    y: 338,
    angle: 12,
    alpha: .65,
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
Deno.test("party bell rings from its fixed branch anchor and settles upright", () => {
  const { scene, bell, calls } = fixture(false);
  ringPartyBell(scene, bell);
  assertEquals(calls[0], ["stop", bell]);
  assertEquals(bell.angle, 0);
  assertEquals(bell.alpha, 1);
  const chain = calls[1][1];
  assertEquals(chain.tweens.map((t) => t.angle), [-18, 15, -10, 6, 0]);
  assertEquals([bell.x, bell.y], [835, 338]);
  ringPartyBell(scene, bell);
  assertEquals(calls[2], ["stop", bell]);
});
Deno.test("reduced motion acknowledges the bell without swinging", () => {
  const { scene, bell, calls } = fixture(true);
  ringPartyBell(scene, bell);
  assertEquals(calls[1][0], "add");
  assertEquals(calls[1][1].angle, undefined);
  assertEquals(calls[1][1].yoyo, true);
  assertEquals(bell.angle, 0);
});
