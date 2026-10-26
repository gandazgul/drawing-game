// The world and close-up show the same saved network; only their scale differs.
export const SPRING_BOARD = { x: 425, y: 305, size: 350 };
export const SPRING_BUBBLES = [
  { x: 442, y: 340, floorY: 565 },
  { x: 535, y: 355, floorY: 600 },
  { x: 475, y: 610, floorY: 610 },
  { x: 638, y: 350, floorY: 590 },
  { x: 738, y: 430, floorY: 610 },
  { x: 620, y: 610, floorY: 610 },
  { x: 730, y: 530, floorY: 625 },
  { x: 550, y: 470, floorY: 600 },
];

// Breadth-first filling makes the water travel from the inlet, never randomly.
export function springFillOrder(cells) {
  const seen = new Set([0]), order = [0];
  for (let k = 0; k < order.length; k++) {
    const i = order[k];
    const neighbors = [i >= 5 ? i - 5 : -1, i % 5 < 4 ? i + 1 : -1, i < 20 ? i + 5 : -1, i % 5 ? i - 1 : -1];
    neighbors.forEach((j, d) => {
      if (j < 0 || seen.has(j) || !(cells[i] & (1 << d)) || !(cells[j] & (1 << ((d + 2) % 4)))) return;
      seen.add(j);
      order.push(j);
    });
  }
  return order;
}

export const CURRENT_ROUTE = [
  { x: 790, y: 620 },
  { x: 850, y: 540 },
  { x: 850, y: 420 },
  { x: 835, y: 315 },
  { x: 790, y: 230 },
  { x: 950, y: 180 },
  { x: 1110, y: 125 },
];

export function currentPoint(t, lane = 0) {
  const scaled = Math.max(0, Math.min(1, t)) * (CURRENT_ROUTE.length - 1);
  const i = Math.min(CURRENT_ROUTE.length - 2, Math.floor(scaled)), f = scaled - i;
  const a = CURRENT_ROUTE[i], b = CURRENT_ROUTE[i + 1];
  const previous = CURRENT_ROUTE[Math.max(0, i - 1)],
    next = CURRENT_ROUTE[Math.min(CURRENT_ROUTE.length - 1, i + 2)];
  const curve = (key) =>
    .5 * ((2 * a[key]) + (-previous[key] + b[key]) * f +
      (2 * previous[key] - 5 * a[key] + 4 * b[key] - next[key]) * f * f +
      (-previous[key] + 3 * a[key] - 3 * b[key] + next[key]) * f * f * f);
  return { x: curve("x"), y: curve("y") + lane, right: b.x >= a.x };
}
