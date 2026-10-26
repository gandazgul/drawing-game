import { assert, test } from "vite-plus/test";
import { BRIDGE_ROUTE, portWalkable } from "../src/bridge-walk.js";
import { findPathInWalkable, pointInPolygon } from "./helpers/caper.js";

test("repair restores a continuous walkable rainbow, while the broken bridge stays off limits", () => {
  const closed = portWalkable(false),
    open = portWalkable(true);
  assert(!pointInPolygon(BRIDGE_ROUTE[5], closed));
  for (const p of BRIDGE_ROUTE) assert(pointInPolygon(p, open));
  const result = findPathInWalkable({ x: 250, y: 640 }, { x: 1080, y: 410 }, open);
  assert(result.reachedTarget);
  assert(result.path.length > 5, "Walking must curve over the arch, not jump straight to the village");
  assert(result.path.some((p) => p.y < 220));
  assert.deepEqual(portWalkable(true), JSON.parse(JSON.stringify(open)));
  const reverse = findPathInWalkable({ x: 1080, y: 410 }, { x: 250, y: 640 }, open);
  assert(reverse.reachedTarget);
  assert(reverse.path.some((p) => p.y < 220));
});
