import { assert, assertEquals } from "@std/assert";
import {
  INN_ROOMS,
  INN_TASK_ROOMS,
  ladderRoute,
  roomFloor,
  roomTarget,
  validRoom,
} from "../src/inn-rooms.js";

Deno.test("inn activities occupy different rooms above the entrance", () => {
  assertEquals(INN_ROOMS[INN_TASK_ROOMS.luggage].name, "Bedroom");
  assertEquals(INN_ROOMS[INN_TASK_ROOMS.rooms].name, "Picture room");
  assertEquals(ladderRoute(4, INN_TASK_ROOMS.rooms).length, 2);
});

Deno.test("inn has five separate walkable floors that fit both sisters", () => {
  assertEquals(INN_ROOMS.length, 5);
  INN_ROOMS.forEach((r, id) => {
    assert(r.right - r.left >= 150);
    assert(r.floor - r.top >= 70);
    assert(r.ladder >= r.left + 28 && r.ladder <= r.right);
    assertEquals(roomFloor(id).map((p) => p.y), [r.floor - 3, r.floor - 3, r.floor + 2, r.floor + 2]);
    assertEquals(roomTarget(id, -100).x, r.left + 25);
    assertEquals(roomTarget(id, 9999).x, r.right - 25);
  });
});
Deno.test("ladder visits every intervening floor in either direction", () => {
  assertEquals(ladderRoute(4, 0).map((p) => p.y), [645, 524, 391, 267]);
  assertEquals(ladderRoute(0, 4).map((p) => p.y), [391, 524, 645, 761]);
  assertEquals(ladderRoute(2, 2), []);
  assertEquals(ladderRoute(3, 1, -28), [{ x: 796, y: 524 }, { x: 782, y: 391 }]);
});
Deno.test("missing or corrupt room saves return to entrance", () => {
  for (const id of [undefined, null, -1, 5, 1.5, "2", NaN]) assertEquals(validRoom(id), 4);
  assertEquals(validRoom(0), 0);
});
