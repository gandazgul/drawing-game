import { assert, assertAlmostEquals, assertEquals } from "@std/assert";
import {
  BRIDGE_PATHS,
  bridgeBandCoverage,
  bridgeBandsReady,
  bridgePoint,
  bridgeSource,
  colorsReady,
  migrateBridgeBands,
  safeBridgeBands,
  safeColors,
} from "../src/puzzles/rainbow.js";
import { bridgeCloseup, drawBridgeBands, worldBridge } from "../src/BridgeView.js";
import { resumeScene, villageReady } from "../src/state.js";

Deno.test("all seven matching colors are required; old partial matches survive", () => {
  assertEquals(safeColors([1, 3, 5, 5, -1, "2", 8]), [1, 3, 5]);
  assert(!colorsReady([1, 3, 5]));
  for (let missing = 0; missing < 7; missing++) {
    assert(!colorsReady([0, 1, 2, 3, 4, 5, 6].filter((i) => i !== missing)));
  }
  assert(colorsReady([6, 5, 4, 3, 2, 1, 0]));
});
Deno.test("each band needs its own connected trace, not a single arch or wrong stripe", () => {
  const bands = BRIDGE_PATHS.map((path) => [path.map((p) => ({ ...p }))]);
  assert(bridgeBandsReady(bands));
  assert(!bridgeBandsReady(bands, true));
  for (let i = 0; i < 7; i++) {
    const incomplete = JSON.parse(JSON.stringify(bands));
    incomplete[i] = [];
    assert(!bridgeBandsReady(incomplete));
    const c = bridgeBandCoverage(i);
    c.stroke(BRIDGE_PATHS[i][0], BRIDGE_PATHS[i].at(-1));
    assert(!c.complete(), "straight chord cannot skip the curve");
    const wrong = bridgeBandCoverage(i, [BRIDGE_PATHS[(i + 1) % 7]]);
    assert(!wrong.complete(), "another stripe cannot complete this one");
    assert(!bridgeBandCoverage(i, [BRIDGE_PATHS[i].slice(2, -2)]).complete(), "both ends must connect");
  }
});
Deno.test("band progress restores, tolerates small middle gaps and accepts more marks", () => {
  const path = BRIDGE_PATHS[0];
  const strokes = [path.slice(0, 12), path.slice(13)];
  const c = bridgeBandCoverage(0, strokes);
  assert(c.complete());
  assert(!c.complete({ strokeActive: true }));
  const saved = safeBridgeBands(JSON.parse(JSON.stringify([strokes])));
  assertEquals(bridgeBandCoverage(0, saved[0]).ratio, c.ratio);
  c.stroke(path[12], path[13]);
  assert(c.complete());
  assertEquals(safeBridgeBands(null), [[], [], [], [], [], [], []]);
  assertEquals(safeBridgeBands([[[{ x: NaN, y: 12 }, { x: 500, y: 220 }]]])[0], [[{ x: 500, y: 220 }]]);
});
Deno.test("port marks are projected back onto the exact same source-pixel gaps", () => {
  for (const path of BRIDGE_PATHS) {
    for (const p of path) {
      const restored = bridgePoint(bridgeSource(p));
      assertAlmostEquals(restored.x, p.x);
      assertAlmostEquals(restored.y, p.y);
    }
  }
  const calls = [];
  const g = {
    clear() {
      return this;
    },
    lineStyle() {
      return this;
    },
    lineBetween(...a) {
      calls.push(a);
      return this;
    },
    fillStyle() {
      return this;
    },
    fillCircle() {
      return this;
    },
  };
  drawBridgeBands(g, [[BRIDGE_PATHS[0]]], true);
  const expected = bridgePoint(bridgeSource(BRIDGE_PATHS[0][0]), true);
  assertAlmostEquals(calls[0][0], expected.x);
  assertAlmostEquals(calls[0][1], expected.y);
});
Deno.test("legacy completed bridges stay open and new drawing resumes at the port", () => {
  const old = {
    sailDone: true,
    patchDone: true,
    waterwayDone: true,
    pondClue: true,
    bridgeDone: true,
    bridgeColors: [1, 3, 5],
  };
  assert(villageReady(old));
  assertEquals(resumeScene({ ...old, currentScene: "BridgeDraw" }), "Port");
});

Deno.test("bridge close-up never changes the port texture's default frame", () => {
  const source = {};
  const cropCalls = [];
  const images = [];
  const port = { getSourceImage: () => source };
  const textures = new Map([["rainbow", port]]);
  const scene = {
    textures: {
      exists: (key) => textures.has(key),
      get: (key) => textures.get(key),
      addImage(key, image) {
        assertEquals(image, source);
        const texture = { get: () => ({ setSize: (...args) => cropCalls.push(args) }) };
        textures.set(key, texture);
        return texture;
      },
    },
    add: {
      graphics() {
        return {
          setDepth() {
            return this;
          },
          fillStyle() {
            return this;
          },
          fillRect() {
            return this;
          },
          lineStyle() {
            return this;
          },
          strokePoints() {
            return this;
          },
        };
      },
      image(_x, _y, key) {
        images.push(key);
        return {
          setOrigin() {
            return this;
          },
          setScale() {
            return this;
          },
        };
      },
    },
  };
  bridgeCloseup(scene);
  bridgeCloseup(scene);
  assertEquals(cropCalls, [[1310, 780, 0, 0]]);
  assertEquals(images, ["bridge-closeup", "bridge-closeup"]);
  assertEquals(textures.get("rainbow"), port);
});
Deno.test("source art migration preserves partial strokes and runs only once", () => {
  const original = [[[{ x: 470, y: 215 }, { x: 510, y: 211 }]], [], []];
  const migrated = migrateBridgeBands(original, undefined);
  assertEquals(migrated[0][0].length, 2);
  assertEquals(migrateBridgeBands(migrated, 2), migrated);
  assertEquals(migrateBridgeBands(null, undefined), [[], [], [], [], [], [], []]);
});

Deno.test("world bridge cuts only its own texture and never paints over scenery", () => {
  const cleared = [], used = [];
  const source = { width: 1310, height: 780 };
  const scene = {
    textures: {
      exists: () => false,
      get: () => ({ getSourceImage: () => source }),
      createCanvas: () => ({
        getContext: () => ({ drawImage() {}, clearRect: (...args) => cleared.push(args) }),
        refresh() {},
      }),
    },
    add: {
      image: (_x, _y, key) => {
        used.push(key);
        const image = { setOrigin: () => image, setScale: () => image, setDepth: () => image };
        return image;
      },
      graphics: () => {
        const g = {
          setDepth: () => g,
          lineStyle: () => g,
          strokePoints: () => g,
          fillRect: () => {
            throw Error("Must not cover backdrop");
          },
        };
        return g;
      },
    },
  };
  worldBridge(scene, false);
  worldBridge(scene, true);
  assertEquals(cleared.length, 1);
  assert(cleared[0][2] > 0);
  assertEquals(used, ["rainbow-world-gap", "rainbow"]);
});
