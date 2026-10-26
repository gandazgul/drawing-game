import { assert, test } from "vite-plus/test";
import {
  buntingSession,
  JIGSAW_PICTURES,
  jigsawSession,
  LEGACY_PATTERNS,
  newPatterns,
  validPatterns,
} from "../src/puzzles/village-replay.js";

function random(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
test("birthday patterns shuffle colors, pattern families and row positions", () => {
  const layouts = new Set(),
    firstRows = new Set(),
    colors = new Set();
  for (let seed = 1; seed <= 100; seed++) {
    const rows = newPatterns(null, random(seed * 7919));
    assert(validPatterns(rows));
    for (const row of rows) {
      assert(new Set(row).size >= 2);
      // Three shown examples are enough to continue either a 2- or 3-color unit.
      assert(row.every((v, i) => v === row[i % 2]) || row.every((v, i) => v === row[i % 3]));
      row.forEach((c) => colors.add(c));
    }
    layouts.add(JSON.stringify(rows));
    firstRows.add(rows[0].map((c) => rows[0].indexOf(c)).join());
  }
  assert(layouts.size > 90);
  assert.deepEqual(firstRows.size, 4);
  assert.deepEqual(colors.size, 5);
  assert(validPatterns(LEGACY_PATTERNS));
});
test("unfinished bunting is stable, completed bunting starts empty and differs", () => {
  const first = buntingSession(null, random(42));
  first.answers[2] = 4;
  assert.deepEqual(buntingSession(first, random(99)), first);
  const next = buntingSession({ ...first, complete: true }, random(42));
  assert.notDeepEqual(next.patterns, first.patterns);
  assert.deepEqual(next.answers, Array(9).fill(null));
  assert(validPatterns(buntingSession({ patterns: "bad", answers: [9] }).patterns));
});
test("jigsaw cycles every replay picture before repeating, never the initial inn", () => {
  let state;
  const rng = random(123),
    pictures = [];
  for (let i = 0; i < 24; i++) {
    state = jigsawSession(state, rng);
    pictures.push(state.picture);
    assert.notDeepEqual(state.picture, "innPlayable");
    if (i) assert.notDeepEqual(state.picture, pictures[i - 1]);
    assert.deepEqual(new Set(state.order).size, 25);
    assert.deepEqual(state.placed, []);
    state.complete = true;
  }
  for (let i = 0; i < pictures.length; i += JIGSAW_PICTURES.length) {
    assert.deepEqual(new Set(pictures.slice(i, i + JIGSAW_PICTURES.length)), new Set(JIGSAW_PICTURES));
  }
});
test("jigsaw saves picture, tray order, remaining deck and partial placement", () => {
  const first = jigsawSession(null, random(5));
  first.placed = [0, 7, 24];
  assert.deepEqual(jigsawSession(first, random(77)), first);
  const repaired = jigsawSession(
    {
      ...first,
      placed: [0, 0, -1, 25, "2"],
      order: [2],
      remaining: [first.picture, "bad"],
    },
    random(8),
  );
  assert.deepEqual(repaired.placed, [0]);
  assert.deepEqual(repaired.remaining, []);
  assert.deepEqual(new Set(repaired.order).size, 25);
  const badBag = jigsawSession({ picture: "pond", complete: true, remaining: ["pond"] }, random(9));
  assert(JIGSAW_PICTURES.includes(badBag.picture));
  assert.notDeepEqual(badBag.picture, "pond");
});
