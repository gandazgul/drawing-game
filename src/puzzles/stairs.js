// Source coordinates use the finished room's 1200x800 composition.
// Each piece is an actual column of that staircase, not a replacement colored block.
const edges = [605, 697, 803, 907, 987, 1070, 1148];
const tops = [557, 498, 427, 355, 278, 209];
const order = [3, 0, 5, 2, 4, 1];
export const STAIR_PIECES = tops.map((top, id) => {
  const w = edges[id + 1] - edges[id],
    h = 630 - top;
  return {
    id,
    source: { x: edges[id], y: top, w, h },
    w: w * 0.85,
    h: h * 0.85,
    target: { x: 650 + (edges[id] - 605 + w / 2) * 0.85, y: 610 - (h * 0.85) / 2 },
    home: { x: 110 + order.indexOf(id) * 88, y: 610 - (h * 0.85) / 2 },
  };
});
export const STAIR_COVER = { x: 634, y: 237, w: 494, h: 390, cols: 19, rows: 15 };
export const ERASE_COUNT = STAIR_COVER.cols * STAIR_COVER.rows;
export const erasedCells = (raw) =>
  new Set(Array.isArray(raw) ? raw.filter((id) => Number.isInteger(id) && id >= 0 && id < ERASE_COUNT) : []);
export const placedStairs = (raw) =>
  new Set(
    Array.isArray(raw) ? raw.filter((id) => Number.isInteger(id) && id >= 0 && id < STAIR_PIECES.length) : [],
  );
export const stairsUncovered = (raw) => erasedCells(raw).size >= Math.ceil(ERASE_COUNT * 0.86);
