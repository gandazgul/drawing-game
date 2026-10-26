import { assertEquals } from "@std/assert";
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

Deno.test("twig arms render above all snowballs in both builder and saved creation", () => {
  for (const kind of ["base", "body", "head"]) {
    assertEquals(SNOW_PARTS.twig.depth > SNOW_PARTS[kind].depth, true);
  }
  assertEquals(SNOW_PARTS.twig.depth < SNOW_PARTS.rock.depth, true);
});

Deno.test("snow unlock requires all three materials, then stays unlocked", () => {
  assertEquals(snowUnlocked(["twigs", "carrot"]), false);
  assertEquals(snowUnlocked(MATERIALS), true);
  assertEquals(snowUnlocked([], true), true);
  assertEquals(materialsFound(["twigs", "twigs", "carrot", "unknown"]), ["twigs", "carrot"]);
  assertEquals(nextMaterial(["twigs"]), "carrot");
  assertEquals(nextMaterial(MATERIALS), undefined);
  assertEquals(materialsFound(null), []);
});
Deno.test("slide strength loops gently, with generous target zones", () => {
  assertEquals(slidePower(0), 0);
  assertEquals(slidePower(1700), 1);
  assertEquals(slidePower(3400), 0);
  assertEquals(slideHits(.34, "twigs"), true);
  assertEquals(slideHits(.45, "twigs"), true);
  assertEquals(slideHits(.90, "twigs"), false);
  assertEquals(slideHits(.61, "carrot"), true);
  assertEquals(slideHits(.82, "rocks"), true);
  assertEquals(slideHits(NaN, "rocks"), false);
  assertEquals(slideHits(.82, "missing"), false);
});
Deno.test("snow builder snaps bodies, keeps decorations and never requires perfection", () => {
  let pieces = [];
  for (const kind of ["base", "body", "head"]) pieces = placeSnowPiece(pieces, kind, 200, 500);
  assertEquals(snowmanReady(pieces), true);
  assertEquals(pieces[0].x, 490);
  assertEquals(pieces[2].y, 285);
  pieces = placeSnowPiece(pieces, "rock", 470, 270);
  pieces = placeSnowPiece(pieces, "carrot", 500, 300);
  assertEquals(pieces.length, 5);
  pieces = placeSnowPiece(pieces, "head", 800, 600);
  assertEquals(pieces.length, 5);
  assertEquals(pieces.filter((p) => p.kind === "rock").length, 1);
  pieces = placeSnowPiece(pieces, "rock", 520, 275, 2);
  assertEquals(pieces.length, 5);
  assertEquals(pieces.at(-1).x, 520);
  assertEquals(snowmanReady([]), false);
});
Deno.test("snow saved pieces reject malformed input and cap work", () => {
  assertEquals(validSnowPieces(null), []);
  assertEquals(validSnowPieces([{ kind: "__proto__", x: 1, y: 1 }, { kind: "rock", x: NaN, y: 4 }]), []);
  assertEquals(validSnowPieces([{ kind: "twig", x: 9000, y: -500 }]), [
    { kind: "twig", x: 790, y: 190, flip: true },
  ]);
  assertEquals(
    validSnowPieces(Array.from({ length: 100 }, () => ({ kind: "rock", x: 490, y: 400 }))).length,
    60,
  );
  assertEquals(validSnowPieces([{ kind: "head", x: 0, y: 0 }, { kind: "head", x: 0, y: 0 }]).length, 1);
});
Deno.test("winter activities resume safely on pond, without changing existing gates", () => {
  const values = { sailDone: true, patchDone: true, waterwayDone: true, pondClue: true, bridgeDone: true };
  for (const currentScene of ["FrozenPond", "PenguinSlide", "SnowmanBuilder"]) {
    assertEquals(resumeScene({ ...values, currentScene }), "FrozenPond");
  }
  assertEquals(resumeScene({ currentScene: "SnowmanBuilder" }), "Harbor");
  assertEquals(freshState().values.snowBuilderUnlocked, false);
});
