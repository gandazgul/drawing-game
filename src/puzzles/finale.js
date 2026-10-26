import { Coverage, traceSamples } from "./geometry.js";

export const TREE_ROUTE = [
  [1100, 710],
  [1040, 585],
  [985, 455],
  [930, 332],
  [820, 332],
  [680, 320],
  [540, 320],
  [440, 320],
].map(([x, y]) => ({ x, y }));
export const HEART_ROUTE = Array.from({ length: 65 }, (_, i) => {
  const t = (i / 64) * Math.PI * 2;
  return {
    x: 600 + 225 * Math.sin(t) ** 3,
    y: 385 - (225 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))) / 16,
  };
});
export const finaleCoverage = (path, strokes = []) =>
  new Coverage(traceSamples(path, 5), 23, { endRadius: 16, requiredRatio: 0.88 }).restore(strokes);
// Mouse pointers expose x/y as prototype accessors; spreading them loses coordinates.
// Touch snapping returns plain objects, so read both input forms explicitly.
export const finaleStrokePoint = (point, color) => ({ x: point.x, y: point.y, c: color });
export const treeReady = (v) => !!(v.endingWaterDone && v.endingHouseDone && v.endingRouteDone);
export const canCelebrate = (v) => treeReady(v) && v.endingClimbed === true;
export const canSayGoodbye = (v) => canCelebrate(v) && v.endingParty === true;

// One corridor follows the actual drawing. No rectangle permits walking through the air.
export function treeWalkable(repaired) {
  if (!repaired)
    return [
      { x: 65, y: 680 },
      { x: 1140, y: 680 },
      { x: 1140, y: 755 },
      { x: 65, y: 755 },
    ];
  const path = [{ x: 65, y: 710 }, ...TREE_ROUTE];
  const normals = path.slice(1).map((b, i) => {
    const a = path[i],
      d = Math.hypot(b.x - a.x, b.y - a.y);
    return { x: -(b.y - a.y) / d, y: (b.x - a.x) / d };
  });
  const side = (sign) =>
    path.map((p, i) => {
      const a = normals[Math.max(0, i - 1)],
        b = normals[Math.min(i, normals.length - 1)];
      const d = 1 + a.x * b.x + a.y * b.y;
      return { x: p.x + ((a.x + b.x) / d) * sign * 15, y: p.y + ((a.y + b.y) / d) * sign * 15 };
    });
  return [...side(1), ...side(-1).reverse()];
}

export const DECORATIONS = {
  flowers: { art: "flowers", label: "Flowers", width: 78 },
  butterfly: { art: "heartButterfly", label: "Butterfly", width: 70 },
  sunflower: { art: "sunflower", label: "Sunflower", width: 58 },
  vase: { art: "flowerVase", label: "Bouquet", width: 65 },
  drawing: { art: "blueCat", label: "Cat picture", width: 65 },
  lantern: { art: null, label: "Lantern", width: 50 },
};
export function validDecorations(raw) {
  return Array.isArray(raw)
    ? raw
        .filter(
          (p) =>
            p &&
            Object.hasOwn(DECORATIONS, p.kind) &&
            Number.isFinite(p.x) &&
            Number.isFinite(p.y) &&
            p.x >= 40 &&
            p.x <= 1160 &&
            p.y >= 80 &&
            p.y <= 730,
        )
        .slice(0, 60)
        .map(({ kind, x, y }) => ({ kind, x, y }))
    : [];
}
export function placeDecoration(raw, kind, x, y, index = -1) {
  const pieces = validDecorations(raw);
  if (!Object.hasOwn(DECORATIONS, kind) || !Number.isFinite(x) || !Number.isFinite(y)) return pieces;
  const p = { kind, x: Math.max(40, Math.min(1160, x)), y: Math.max(80, Math.min(730, y)) };
  if (index >= 0 && index < pieces.length) pieces[index] = p;
  else if (pieces.length < 60) pieces.push(p);
  return pieces;
}
