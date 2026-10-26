export const RAINBOW = [0xda4b43, 0xea8b34, 0xeac643, 0x45954f, 0x368ec5, 0xe26487, 0x7250a0];
import { Coverage, distanceToSegment, traceSamples } from "./geometry.js";
import { validStrokes } from "../state.js";

export const MISSING_COLORS = [0, 1, 2, 3, 4, 5, 6];
export const safeColors = (raw) => MISSING_COLORS.filter((n) => Array.isArray(raw) && raw.includes(n));
export const colorsReady = (raw) => safeColors(raw).length === MISSING_COLORS.length;
// Open arch; the same coverage model used by the sail accepts a curved polyline.
export const BRIDGE = Array.from({ length: 25 }, (_, i) => {
  const t = i / 24;
  return { x: 320 + 660 * t, y: 565 - 275 * Math.sin(t * Math.PI) };
});

// Direct scan coordinates; world and puzzle share the same source silhouette.
export const BRIDGE_CROP = { x: 0, y: 0, width: 1310, height: 780 };
export const BRIDGE_VIEW = { x: 240, y: 140, scale: 0.55 };
export const COLOR_NAMES = ["Red", "Orange", "Yellow", "Green", "Blue", "Pink", "Purple"];
export function bridgePoint(p, world = false) {
  return world
    ? { x: 240 + p.x * 0.55, y: 85 + p.y * 0.55 }
    : {
        x: BRIDGE_VIEW.x + (p.x - BRIDGE_CROP.x) * BRIDGE_VIEW.scale,
        y: BRIDGE_VIEW.y + (p.y - BRIDGE_CROP.y) * BRIDGE_VIEW.scale,
      };
}
export function bridgeSource(p) {
  return {
    x: (p.x - BRIDGE_VIEW.x) / BRIDGE_VIEW.scale + BRIDGE_CROP.x,
    y: (p.y - BRIDGE_VIEW.y) / BRIDGE_VIEW.scale + BRIDGE_CROP.y,
  };
}
export const BRIDGE_PATHS = [
  [390, 82, 740, 123, 48],
  [390, 119, 740, 156, 91],
  [390, 145, 740, 184, 118],
  [390, 178, 740, 215, 150],
  [390, 201, 740, 242, 180],
  [390, 237, 740, 272, 212],
  [390, 270, 740, 303, 244],
].map(([left, ly, right, ry, top]) =>
  Array.from({ length: 25 }, (_, n) => {
    const t = n / 24;
    return bridgePoint({
      x: left + (right - left) * t,
      y: ly * (1 - t) + ry * t - (ly - top) * Math.sin(Math.PI * t),
    });
  }),
);
// Reproject existing marks when replacing the former generated arch. Keep the
// player's strokes, including partial work and wobble, rather than clearing them.
export function migrateBridgeBands(raw, version) {
  const bands = safeBridgeBands(raw);
  if (version === 2) return bands;
  const old = [
    [586, 229, 917, 230, 201],
    [593, 254, 914, 254, 226],
    [597, 277, 909, 278, 249],
    [599, 302, 903, 303, 274],
    [600, 323, 899, 324, 296],
    [605, 344, 893, 345, 317],
    [611, 365, 889, 365, 338],
  ];
  return bands.map((strokes, i) =>
    strokes.map((stroke) =>
      stroke.map((p) => {
        const [l, ly, r, ry, top] = old[i];
        const sx = (p.x - 60) / (1080 / 1120) + 175;
        const t = Math.max(0, Math.min(1, (sx - l) / (r - l)));
        const oy = 180 + (ly * (1 - t) + ry * t - (ly - top) * Math.sin(Math.PI * t) - 170) * (1080 / 1120);
        const index = t * 24,
          a = BRIDGE_PATHS[i][Math.floor(index)],
          b = BRIDGE_PATHS[i][Math.min(24, Math.ceil(index))];
        const f = index - Math.floor(index);
        return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f + (p.y - oy) * 0.55 };
      }),
    ),
  );
}
export const safeBridgeBands = (raw) => RAINBOW.map((_, i) => validStrokes(raw?.[i]));
export function bridgeBandCoverage(i, strokes = []) {
  const coverage = new Coverage(traceSamples(BRIDGE_PATHS[i]), 10, {
    endRadius: 7,
    requiredRatio: 0.92,
  }).restore(strokes);
  const complete = coverage.complete.bind(coverage);
  coverage.complete = (options) =>
    complete(options) && coverage.hit.has(0) && coverage.hit.has(coverage.samples.length - 1);
  return coverage;
}
export const bridgeBandAccepts = (i, p) =>
  BRIDGE_PATHS[i].slice(1).some((b, n) => distanceToSegment(p, BRIDGE_PATHS[i][n], b) <= 14);
export function bridgeBandsReady(bands, strokeActive = false) {
  return (
    !strokeActive && safeBridgeBands(bands).every((strokes, i) => bridgeBandCoverage(i, strokes).complete())
  );
}
