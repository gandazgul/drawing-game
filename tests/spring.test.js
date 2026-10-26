import { assert, test } from "vite-plus/test";
import { createWaterway } from "../src/puzzles/waterway.js";
import { currentPoint, SPRING_BOARD, SPRING_BUBBLES, springFillOrder } from "../src/puzzles/spring.js";

test("spring fills every solved network from the inlet in connected order", () => {
  for (let seed = 1; seed <= 100; seed++) {
    const cells = createWaterway(seed).solution,
      order = springFillOrder(cells);
    assert.deepEqual(order[0], 0);
    assert.deepEqual(new Set(order).size, 25);
    const seen = new Set([0]);
    for (const i of order.slice(1)) {
      const neighbors = [
        i >= 5 ? i - 5 : -1,
        i % 5 < 4 ? i + 1 : -1,
        i < 20 ? i + 5 : -1,
        i % 5 ? i - 1 : -1,
      ];
      assert(neighbors.some((j, d) => seen.has(j) && cells[i] & (1 << d) && cells[j] & (1 << ((d + 2) % 4))));
      seen.add(i);
    }
  }
});

test("bubble targets surround the actual spring and settle near its base", () => {
  assert.deepEqual(SPRING_BUBBLES.length, 8);
  for (const p of SPRING_BUBBLES) {
    assert(p.x >= SPRING_BOARD.x && p.x <= SPRING_BOARD.x + SPRING_BOARD.size);
    assert(p.y >= SPRING_BOARD.y && p.y <= SPRING_BOARD.y + SPRING_BOARD.size);
    assert(p.floorY >= 565 && p.floorY <= 625);
  }
});

test("current stays inside the water and joins continuously between segments", () => {
  for (let i = 0; i <= 1000; i++) {
    const p = currentPoint(i / 1000);
    assert(p.x > 500 && p.x <= 1160 && p.y >= 100 && p.y <= 620);
    if (i) {
      const previous = currentPoint((i - 1) / 1000);
      assert(Math.hypot(p.x - previous.x, p.y - previous.y) < 3);
    }
  }
});
