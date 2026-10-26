import { assert, assertEquals } from "@std/assert";
import { BOAT_LANDINGS, takeBoatArrival } from "../src/BoatJourney.js";
import { portWalkable } from "../src/bridge-walk.js";
import { findPathInWalkable, pointInPolygon } from "../../Caper/src/movement/pathfinding.js";

Deno.test("boat arrival is consumed once even when Phaser reuses scene data", () => {
  const data = { boatArrival: true, other: 42 };
  assert(takeBoatArrival(data));
  assert(!takeBoatArrival(data));
  assertEquals(data, { other: 42 });
  assert(!takeBoatArrival(undefined));
});

Deno.test("both port boarding points lie on shore before and after bridge repair", () => {
  for (const repaired of [false, true]) {
    const polygon = portWalkable(repaired);
    for (const target of BOAT_LANDINGS.Port.shore) {
      assert(pointInPolygon(target, polygon));
      const route = findPathInWalkable(
        repaired ? { x: 1080, y: 410 } : { x: 250, y: 640 },
        target,
        polygon,
      );
      assert(route.reachedTarget);
      if (repaired) assert(route.path.some((p) => p.y < 220));
    }
  }
});
