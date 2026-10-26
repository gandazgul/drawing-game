import { assert, test } from "vite-plus/test";
import { boatReady, freshState, nextRepair, resumeScene, validStrokes } from "../src/state.js";
import {
  Coverage,
  distanceToSegment,
  PATCH,
  patchCoverage,
  SAIL,
  TRACE_RADIUS,
  traceCoverage,
  traceSamples,
} from "../src/puzzles/geometry.js";

test("boat needs both repairs, never stickers", () => {
  const values = freshState().values;
  assert.deepEqual(nextRepair(values), "sail");
  assert(!boatReady(values));
  values.sailDone = true;
  assert.deepEqual(nextRepair(values), "patch");
  assert(!boatReady(values));
  values.patchDone = true;
  assert(boatReady(values));
  assert.deepEqual(nextRepair(values), null);
});
test("resume only enters pond with a usable boat", () => {
  assert.deepEqual(resumeScene({ currentScene: "Pond" }), "Harbor");
  assert.deepEqual(resumeScene({ currentScene: "Pond", sailDone: true, patchDone: true }), "Pond");
  assert.deepEqual(resumeScene({ currentScene: "Repair", sailDone: true }), "Harbor");
});
test("trace tolerates wobble and lifts, but not a scribble in one corner", () => {
  const c = traceCoverage();
  for (let i = 0; i < 50; i++) c.stroke(SAIL[0]);
  assert(!c.complete());
  SAIL.slice(1).forEach((b, i) => {
    const a = SAIL[i];
    const middle = { x: (a.x + b.x) / 2 + 6, y: (a.y + b.y) / 2 + 4 };
    c.stroke(a, middle);
    c.stroke(middle, b);
  });
  assert(c.complete());
});
test("one long shortcut does not complete a whole outline", () => {
  const c = new Coverage(traceSamples(), TRACE_RADIUS);
  c.stroke(SAIL[0], SAIL[2]);
  assert(!c.complete());
});
test("patch coverage uses the whole ellipse, not pointer event count", () => {
  const c = patchCoverage();
  for (let i = 0; i < 1000; i++) c.stroke(PATCH);
  assert(!c.complete());
  for (let y = PATCH.y - PATCH.ry; y <= PATCH.y + PATCH.ry; y += 24) {
    c.stroke({ x: PATCH.x - PATCH.rx, y }, { x: PATCH.x + PATCH.rx, y });
  }
  assert(c.complete());
});
test("restoring interrupted strokes gives identical coverage", () => {
  const strokes = [
    [SAIL[0], SAIL[1]],
    [SAIL[2], SAIL[3]],
  ];
  const a = new Coverage(traceSamples(), TRACE_RADIUS).restore(strokes);
  const b = new Coverage(traceSamples(), TRACE_RADIUS).restore(JSON.parse(JSON.stringify(strokes)));
  assert.deepEqual(a.ratio, b.ratio);
  assert(!a.complete());
});
test("saved-stroke validation rejects bad shapes and nonfinite coordinates", () => {
  assert.deepEqual(validStrokes(null), []);
  assert.deepEqual(
    validStrokes([
      null,
      [
        { x: NaN, y: 2 },
        { x: 12, y: 20 },
      ],
      [{ x: -1, y: 10 }],
    ]),
    [
      [
        {
          x: 12,
          y: 20,
        },
      ],
    ],
  );
});
test("point segment distance handles zero-length taps", () => {
  assert.deepEqual(distanceToSegment({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 }), 5);
});

test("sail readiness permits a small gap and coverage keeps accepting finishing strokes", () => {
  const c = traceCoverage();
  c.stroke(SAIL[0], SAIL[2]);
  c.stroke(SAIL[2], SAIL[1]);
  const gapEnd = { x: SAIL[0].x + 35, y: SAIL[0].y + 42 };
  c.stroke(SAIL[1], gapEnd);
  assert(c.ratio > 0.92);
  assert(c.complete());
  const readyRatio = c.ratio;
  c.stroke(gapEnd, SAIL[0]);
  assert(c.ratio > readyRatio);
  assert(c.complete());
});

test("sideways trace tolerance cannot bridge an unpainted gap between brush tips", () => {
  const c = traceCoverage([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ]);
  c.stroke({ x: 0, y: 0 }, { x: 40, y: 0 });
  c.stroke({ x: 60, y: 0 }, { x: 100, y: 0 });
  assert(!c.complete());
  c.stroke({ x: 40, y: 0 }, { x: 60, y: 0 });
  assert(c.complete());
});

test("patch still rejects larger interior holes and unfinished strips", () => {
  const c = patchCoverage();
  for (const p of c.samples) {
    if (Math.hypot(p.x - PATCH.x, p.y - PATCH.y) > 65) c.stroke(p);
  }
  assert(c.ratio > 0.85);
  assert(!c.complete());
  c.stroke(PATCH);
  assert(c.complete());

  const rim = patchCoverage();
  for (let y = PATCH.y - PATCH.ry; y <= PATCH.y + PATCH.ry - 50; y += 24) {
    rim.stroke({ x: PATCH.x - PATCH.rx, y }, { x: PATCH.x + PATCH.rx, y });
  }
  assert(!rim.complete());
  rim.stroke({ x: PATCH.x - PATCH.rx, y: 550 }, { x: PATCH.x + PATCH.rx, y: 550 });
  assert(rim.complete());
});

test("patch allows a small uncovered area after release", () => {
  const c = patchCoverage();
  for (const p of c.samples) {
    if (Math.hypot(p.x - PATCH.x, p.y - PATCH.y) > 45) c.stroke(p);
  }
  assert(c.ratio > 0.95 && c.ratio < 0.995);
  assert(!c.complete({ strokeActive: true }));
  assert(c.complete());
});

test("full coverage cannot celebrate until the current stroke is released", () => {
  for (const c of [traceCoverage(), patchCoverage()]) {
    for (const p of c.samples) c.stroke(p);
    assert.deepEqual(c.ratio, 1);
    assert(!c.complete({ strokeActive: true }));
    assert(c.complete({ strokeActive: false }));
  }
});

test("reusable tracing requires every edge of an arbitrary outline, not just three", () => {
  const square = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
    { x: 0, y: 0 },
  ];
  const c = traceCoverage(square);
  for (let i = 1; i < 4; i++) c.stroke(square[i - 1], square[i]);
  assert(!c.complete());
  c.stroke(square[3], square[4]);
  assert(c.complete());
  assert(!traceCoverage([]).complete());
});

test("patch is ready with a small strip left and accepts painting over it afterward", () => {
  const c = patchCoverage();
  const gamePoint = ([x, y]) => ({ x: (x - 185.5) / 0.7575, y: (y - 70) / 0.7575 });
  for (const [a, b] of [
    [
      [565, 412],
      [715, 412],
    ],
    [
      [515, 438],
      [765, 438],
    ],
    [
      [529, 466],
      [751, 466],
    ],
  ])
    c.stroke(gamePoint(a), gamePoint(b));
  assert(c.complete());
  const readyRatio = c.ratio;
  c.stroke(gamePoint([580, 486]), gamePoint([700, 486]));
  assert(c.ratio > readyRatio);
  assert(c.ratio < 1);
  assert(c.complete());
});
