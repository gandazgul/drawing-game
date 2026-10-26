import { INK } from "./art.js";

// Flat tile-edge openings meet flush; only the center of a dead end has a bulb.
export function drawPipe(g, x, y, mask, wet, source = false, outlet = false) {
  const cx = x + 50, cy = y + 50;
  const ends = [[cx, y], [x + 100, cy], [cx, y + 100], [x, cy]]
    .filter((_end, d) => mask & (1 << d));
  // The spring's fixed inlet is not a rotatable opening or a board-edge leak.
  if (source) ends.push([x - 70, cy]);
  if (outlet) ends.push([x + 125, cy]);
  for (const [width, color] of [[29, INK], [18, wet ? 0x26798c : 0xfff9e9]]) {
    g.lineStyle(width, color);
    for (const [ex, ey] of ends) g.lineBetween(cx, cy, ex, ey);
    g.fillStyle(color).fillCircle(cx, cy, width / 2);
  }
  if (source || ends.length === 1) {
    g.fillStyle(INK).fillCircle(cx, cy, 19);
    g.fillStyle(wet ? 0x26798c : 0xfff9e9).fillCircle(cx, cy, 14);
    if (source) g.lineStyle(3, 0xffffff).strokeCircle(cx, cy, 9);
  }
}
