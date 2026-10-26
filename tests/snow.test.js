import { assert, test } from "vite-plus/test";
import {
  MATERIALS,
  materialsFound,
  nextMaterial,
  placeSnowPiece,
  slideHits,
  slidePower,
  SNOW_PARTS,
  snowmanReady,
  snowUnlocked,
  validSnowPieces,
} from "../src/puzzles/snow.js";
import { freshState, resumeScene } from "../src/state.js";

test("twig arms render above all snowballs in both builder and saved creation", () => {
  for (const kind of ["base", "body", "head"]) {
    assert.deepEqual(SNOW_PARTS.twig.depth > SNOW_PARTS[kind].depth, true);
  }
  assert.deepEqual(SNOW_PARTS.twig.depth < SNOW_PARTS.rock.depth, true);
});

test("snow unlock requires all three materials, then stays unlocked", () => {
  assert.deepEqual(snowUnlocked(["twigs", "carrot"]), false);
  assert.deepEqual(snowUnlocked(MATERIALS), true);
  assert.deepEqual(snowUnlocked([], true), true);
  assert.deepEqual(materialsFound(["twigs", "twigs", "carrot", "unknown"]), ["twigs", "carrot"]);
  assert.deepEqual(nextMaterial(["twigs"]), "carrot");
  assert.deepEqual(nextMaterial(MATERIALS), undefined);
  assert.deepEqual(materialsFound(null), []);
});
test("slide strength loops gently, with generous target zones", () => {
  assert.deepEqual(slidePower(0), 0);
  assert.deepEqual(slidePower(1700), 1);
  assert.deepEqual(slidePower(3400), 0);
  assert.deepEqual(slideHits(0.34, "twigs"), true);
  assert.deepEqual(slideHits(0.45, "twigs"), true);
  assert.deepEqual(slideHits(0.9, "twigs"), false);
  assert.deepEqual(slideHits(0.61, "carrot"), true);
  assert.deepEqual(slideHits(0.82, "rocks"), true);
  assert.deepEqual(slideHits(NaN, "rocks"), false);
  assert.deepEqual(slideHits(0.82, "missing"), false);
});
test("snow builder snaps bodies, keeps decorations and never requires perfection", () => {
  let pieces = [];
  for (const kind of ["base", "body", "head"]) pieces = placeSnowPiece(pieces, kind, 200, 500);
  assert.deepEqual(snowmanReady(pieces), true);
  assert.deepEqual(pieces[0].x, 490);
  assert.deepEqual(pieces[2].y, 285);
  pieces = placeSnowPiece(pieces, "rock", 470, 270);
  pieces = placeSnowPiece(pieces, "carrot", 500, 300);
  assert.deepEqual(pieces.length, 5);
  pieces = placeSnowPiece(pieces, "head", 800, 600);
  assert.deepEqual(pieces.length, 5);
  assert.deepEqual(pieces.filter((p) => p.kind === "rock").length, 1);
  pieces = placeSnowPiece(pieces, "rock", 520, 275, 2);
  assert.deepEqual(pieces.length, 5);
  assert.deepEqual(pieces.at(-1).x, 520);
  assert.deepEqual(snowmanReady([]), false);
});
test("snow saved pieces reject malformed input and cap work", () => {
  assert.deepEqual(validSnowPieces(null), []);
  assert.deepEqual(
    validSnowPieces([
      { kind: "__proto__", x: 1, y: 1 },
      { kind: "rock", x: NaN, y: 4 },
    ]),
    [],
  );
  assert.deepEqual(validSnowPieces([{ kind: "twig", x: 9000, y: -500 }]), [
    { kind: "twig", x: 790, y: 190, flip: true },
  ]);
  assert.deepEqual(
    validSnowPieces(Array.from({ length: 100 }, () => ({ kind: "rock", x: 490, y: 400 }))).length,
    60,
  );
  assert.deepEqual(
    validSnowPieces([
      { kind: "head", x: 0, y: 0 },
      { kind: "head", x: 0, y: 0 },
    ]).length,
    1,
  );
});
test("winter activities resume safely on pond, without changing existing gates", () => {
  const values = { sailDone: true, patchDone: true, waterwayDone: true, pondClue: true, bridgeDone: true };
  for (const currentScene of ["FrozenPond", "PenguinSlide", "SnowmanBuilder"]) {
    assert.deepEqual(resumeScene({ ...values, currentScene }), "FrozenPond");
  }
  assert.deepEqual(resumeScene({ currentScene: "SnowmanBuilder" }), "Harbor");
  assert.deepEqual(freshState().values.snowBuilderUnlocked, false);
});
