import { assert, test } from "vite-plus/test";
import {
  HOMEWORK_WORDS,
  PLACEMENTS,
  readingLines,
  readingSession,
  SUPER_WORDS,
  validPicnicDecorations,
  WORD_RECORDS,
  WORD_SETS,
  wordRounds,
  wordSetIndex,
} from "../src/puzzles/reading.js";
import { chapterForScene, chapterResetState } from "../src/chapters.js";
import { freshState, resumeScene } from "../src/state.js";

test("family's 60 words appear exactly once in four-word sets; homework comes first", () => {
  assert.deepEqual(SUPER_WORDS.length, 60);
  assert.deepEqual(new Set(SUPER_WORDS).size, 60);
  assert.deepEqual(WORD_SETS[0], ["like", "there", "what", "make"]);
  assert.deepEqual(new Set(WORD_SETS.flat()), new Set(SUPER_WORDS));
  assert(WORD_SETS.every((set) => set.length === 4));
  assert(SUPER_WORDS.includes("I") && SUPER_WORDS.includes("call"));
  assert(!SUPER_WORDS.includes("called") && !SUPER_WORDS.includes("in"));
  assert(WORD_RECORDS.every((w) => w.mastered === null && w.parentListed));
  assert.deepEqual(
    WORD_RECORDS.filter((w) => w.phonicsPattern === "CVCe").map((w) => w.word),
    ["like", "make"],
  );
});
test("every randomized word round has three distinct choices and one correct answer", () => {
  let seed = 123;
  const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  const orders = new Set();
  for (let i = 0; i < 500; i++) {
    const set = i % WORD_SETS.length;
    const rounds = wordRounds(set, random);
    assert.deepEqual(new Set(rounds.map((r) => r.answer)), new Set(WORD_SETS[set]));
    for (const r of rounds) {
      assert.deepEqual(new Set(r.choices).size, 3);
      assert.deepEqual(r.choices.filter((word) => word === r.answer).length, 1);
      assert(r.choices.every((w) => WORD_SETS[set].includes(w)));
    }
    orders.add(rounds.map((r) => r.choices.join("/")).join("|"));
  }
  assert(orders.size > 100);
});
test("corrupt reading saves cannot skip words or placement steps", () => {
  for (const bad of [null, NaN, -1, 15, "3", {}, Infinity]) assert.deepEqual(wordSetIndex(bad), 0);
  assert.deepEqual(readingSession(null, 0), { set: 0, words: [], placed: [] });
  assert.deepEqual(readingSession({ set: 0, words: ["like", "like", "wrong"], placed: ["bag"] }, 0), {
    set: 0,
    words: ["like"],
    placed: [],
  });
  assert.deepEqual(readingSession({ set: 0, words: HOMEWORK_WORDS, placed: ["mat", "mat", "invalid"] }, 0), {
    set: 0,
    words: HOMEWORK_WORDS,
    placed: ["mat"],
  });
  assert.deepEqual(readingSession({ set: 1, words: HOMEWORK_WORDS }, 0).words, []);
  assert.deepEqual(new Set(PLACEMENTS.map((p) => p.id)).size, 3);
  assert(readingLines().some((line) => line.text === "Find the word: I."));
});
test("free decoration positions are bounded and independently copied", () => {
  const good = { art: "pinkFruit", x: 400, y: 500 };
  assert.deepEqual(validPicnicDecorations([good, { ...good, x: NaN }, { ...good, art: "unknown" }, null]), [
    good,
  ]);
  assert.deepEqual(validPicnicDecorations(Array.from({ length: 100 }, () => good)).length, 24);
  assert.deepEqual(validPicnicDecorations({}), []);
  const copy = validPicnicDecorations([good]);
  copy[0].x = 900;
  assert.deepEqual(good.x, 400);
});
test("picnic resumes safely and resets only with chapter two", () => {
  const state = freshState();
  Object.assign(state.values, {
    sailDone: true,
    patchDone: true,
    waterwayDone: true,
    pondClue: true,
    bridgeDone: true,
    villageTasks: ["garden"],
    forestDanceDone: true,
    villagePicnicDone: true,
    villagePicnicSession: { set: 0, words: ["like"], placed: [] },
    villagePicnicDecorations: [{ art: "pinkFruit", x: 600, y: 500 }],
  });
  for (const currentScene of ["CloudGarden", "CloudPicnic"]) {
    assert.deepEqual(chapterForScene(currentScene), "chapter2");
    assert.deepEqual(resumeScene({ ...state.values, currentScene }), "CloudGarden");
  }
  const after = chapterResetState(state, "chapter2");
  assert(after.values.sailDone && after.values.forestDanceDone);
  assert.deepEqual(after.values.villagePicnicDone, false);
  assert.deepEqual(after.values.villagePicnicDecorations, []);
  assert.deepEqual(after.values.villagePicnicSession, undefined);
  assert.deepEqual(chapterResetState(state, "chapter3").values.villagePicnicDone, true);
  assert.deepEqual(state.values.villageTasks, ["garden"]);
});
