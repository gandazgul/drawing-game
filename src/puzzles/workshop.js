import { Coverage, distanceToSegment, traceSamples } from "./geometry.js";

export const PICTURE_BOX = { x: 380, y: 175, w: 440, h: 420 };
// Six broad, differently sized picture blocks, like the blue cat's stair pieces.
// These are not interlocking jigsaw tiles; together they cover the original scan.
export const PICTURE_PARTS = [
  [0, 0, 1, .35],
  [0, .35, .48, .30],
  [.48, .35, .52, .30],
  [0, .65, .35, .35],
  [.35, .65, .30, .35],
  [.65, .65, .35, .35],
].map(([x, y, w, h], id) => ({
  id,
  source: { x, y, w, h },
  x: PICTURE_BOX.x + (x + w / 2) * PICTURE_BOX.w,
  y: PICTURE_BOX.y + (y + h / 2) * PICTURE_BOX.h,
  w: w * PICTURE_BOX.w,
  h: h * PICTURE_BOX.h,
  home: { x: id % 2 ? 1010 : 190, y: 235 + Math.floor(id / 2) * 190 },
}));
export const validIds = (raw, count) =>
  new Set(
    Array.isArray(raw) ? raw.filter((n) => Number.isInteger(n) && n >= 0 && n < count) : [],
  );
export const PICTURE_COVER = { cols: 16, rows: 14 };
export const pictureUncovered = (raw) => validIds(raw, 224).size >= 202;
export const STUDIO_STAIRS = [
  [850, 700],
  [900, 700],
  [900, 622],
  [950, 622],
  [950, 544],
  [1000, 544],
  [1000, 466],
  [1050, 466],
  [1050, 388],
  [1100, 388],
  [1100, 310],
].map(([x, y]) => ({ x, y }));
export const STUDIO_GAP = [{ x: 780, y: 310 }, { x: 660, y: 310 }, { x: 540, y: 310 }];
export const studioCoverage = (path, strokes = []) =>
  new Coverage(traceSamples(path), 20, { endRadius: 12, requiredRatio: .9 }).restore(strokes);

// A narrow connected corridor follows the drawn steps, never cuts across the room.
// Mitered corners keep the pathfinding polygon inside the actual repaired route.
export function studioWalkable(stairs, gap) {
  const route = stairs
    ? [{ x: 80, y: 700 }, ...STUDIO_STAIRS, { x: gap ? 80 : 780, y: 310 }]
    : [{ x: 80, y: 700 }, { x: 850, y: 700 }];
  const normals = route.slice(1).map((p, i) => {
    const a = route[i], d = Math.hypot(p.x - a.x, p.y - a.y);
    return { x: -(p.y - a.y) / d, y: (p.x - a.x) / d };
  });
  const side = (sign) =>
    route.map((p, i) => {
      const a = normals[Math.max(0, i - 1)], b = normals[Math.min(i, normals.length - 1)];
      const divisor = 1 + a.x * b.x + a.y * b.y;
      return { x: p.x + (a.x + b.x) / divisor * sign * 10, y: p.y + (a.y + b.y) / divisor * sign * 10 };
    });
  return [...side(1), ...side(-1).reverse()];
}
export const validRub = (raw) =>
  Array.isArray(raw)
    ? raw.filter((p) =>
      p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 1200 && p.y >= 0 && p.y <= 800
    ).slice(-6000)
    : [];
export const pathRevealed = (path, rubs) =>
  traceSamples(path, 25).every((p) => rubs.some((q) => Math.hypot(p.x - q.x, p.y - q.y) <= 76));
// Sample the rubbable room area, not the number of pointer events: repeated
// scribbling in one spot must not clear the whole room. Leave generous slack.
export function darknessCleared(raw) {
  const rubs = validRub(raw);
  let covered = 0, total = 0;
  for (let y = 100; y <= 700; y += 50) {
    for (let x = 25; x < 1200; x += 50) {
      total++;
      if (rubs.some((p) => (p.x - x) ** 2 + (p.y - y) ** 2 <= 78 ** 2)) covered++;
    }
  }
  return covered / total >= .7;
}
export const nearPath = (point, path, radius = 35) =>
  path.slice(1).some((p, i) => distanceToSegment(point, path[i], p) <= radius);
export const HOME_DOOR = [
  { x: 655, y: 595 },
  { x: 655, y: 450 },
  { x: 695, y: 440 },
  { x: 735, y: 450 },
  { x: 735, y: 595 },
];
export const HOME_PATCH = { x: 695, y: 522, w: 105, h: 165 };
export const studioCrayon = (id) => id === "keila" ? 0x45954f : 0xe26487;
export const studioStrokeColor = (point, fallback = 0xe6ad24) =>
  [0xe26487, 0x45954f, 0x26798c, 0xe6ad24, 0x7250a0].includes(point.c) ? point.c : fallback;
