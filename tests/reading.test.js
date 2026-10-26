import { assert, assertEquals } from "@std/assert";
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

Deno.test("family's 60 words appear exactly once in four-word sets; homework comes first", () => {
  assertEquals(SUPER_WORDS.length, 60);
  assertEquals(new Set(SUPER_WORDS).size, 60);
  assertEquals(WORD_SETS[0], ["like", "there", "what", "make"]);
  assertEquals(new Set(WORD_SETS.flat()), new Set(SUPER_WORDS));
  assert(WORD_SETS.every((set) => set.length === 4));
  assert(SUPER_WORDS.includes("I") && SUPER_WORDS.includes("call"));
  assert(!SUPER_WORDS.includes("called") && !SUPER_WORDS.includes("in"));
  assert(WORD_RECORDS.every((w) => w.mastered === null && w.parentListed));
  assertEquals(WORD_RECORDS.filter((w) => w.phonicsPattern === "CVCe").map((w) => w.word), ["like", "make"]);
});
Deno.test("every randomized word round has three distinct choices and one correct answer", () => {
  let seed = 123;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const orders = new Set();
  for (let i = 0; i < 500; i++) {
    const set = i % WORD_SETS.length;
    const rounds = wordRounds(set, random);
    assertEquals(new Set(rounds.map((r) => r.answer)), new Set(WORD_SETS[set]));
    for (const r of rounds) {
      assertEquals(new Set(r.choices).size, 3);
      assertEquals(r.choices.filter((word) => word === r.answer).length, 1);
      assert(r.choices.every((w) => WORD_SETS[set].includes(w)));
    }
    orders.add(rounds.map((r) => r.choices.join("/")).join("|"));
  }
  assert(orders.size > 100);
});
Deno.test("corrupt reading saves cannot skip words or placement steps", () => {
  for (const bad of [null, NaN, -1, 15, "3", {}, Infinity]) assertEquals(wordSetIndex(bad), 0);
  assertEquals(readingSession(null, 0), { set: 0, words: [], placed: [] });
  assertEquals(readingSession({ set: 0, words: ["like", "like", "wrong"], placed: ["bag"] }, 0), {
    set: 0,
    words: ["like"],
    placed: [],
  });
  assertEquals(readingSession({ set: 0, words: HOMEWORK_WORDS, placed: ["mat", "mat", "invalid"] }, 0), {
    set: 0,
    words: HOMEWORK_WORDS,
    placed: ["mat"],
  });
  assertEquals(readingSession({ set: 1, words: HOMEWORK_WORDS }, 0).words, []);
  assertEquals(new Set(PLACEMENTS.map((p) => p.id)).size, 3);
  assert(readingLines().some((line) => line.text === "Find the word: I."));
});
Deno.test("free decoration positions are bounded and independently copied", () => {
  const good = { art: "pinkFruit", x: 400, y: 500 };
  assertEquals(validPicnicDecorations([good, { ...good, x: NaN }, { ...good, art: "unknown" }, null]), [
    good,
  ]);
  assertEquals(validPicnicDecorations(new Array(100).fill(good)).length, 24);
  assertEquals(validPicnicDecorations({}), []);
  const copy = validPicnicDecorations([good]);
  copy[0].x = 900;
  assertEquals(good.x, 400);
});
Deno.test("picnic resumes safely and resets only with chapter two", () => {
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
    assertEquals(chapterForScene(currentScene), "chapter2");
    assertEquals(resumeScene({ ...state.values, currentScene }), "CloudGarden");
  }
  const after = chapterResetState(state, "chapter2");
  assert(after.values.sailDone && after.values.forestDanceDone);
  assertEquals(after.values.villagePicnicDone, false);
  assertEquals(after.values.villagePicnicDecorations, []);
  assertEquals(after.values.villagePicnicSession, undefined);
  assertEquals(chapterResetState(state, "chapter3").values.villagePicnicDone, true);
  assertEquals(state.values.villageTasks, ["garden"]);
});
