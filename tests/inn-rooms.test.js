import { assert, test } from "vite-plus/test";
import {
  INN_ROOMS,
  INN_TASK_ROOMS,
  ladderRoute,
  roomFloor,
  roomTarget,
  validRoom,
} from "../src/inn-rooms.js";

test("inn activities occupy different rooms above the entrance", () => {
  assert.deepEqual(INN_ROOMS[INN_TASK_ROOMS.luggage].name, "Bedroom");
  assert.deepEqual(INN_ROOMS[INN_TASK_ROOMS.rooms].name, "Picture room");
  assert.deepEqual(ladderRoute(4, INN_TASK_ROOMS.rooms).length, 2);
});

test("inn has five separate walkable floors that fit both sisters", () => {
  assert.deepEqual(INN_ROOMS.length, 5);
  INN_ROOMS.forEach((r, id) => {
    assert(r.right - r.left >= 150);
    assert(r.floor - r.top >= 70);
    assert(r.ladder >= r.left + 28 && r.ladder <= r.right);
    assert.deepEqual(
      roomFloor(id).map((p) => p.y),
      [r.floor - 3, r.floor - 3, r.floor + 2, r.floor + 2],
    );
    assert.deepEqual(roomTarget(id, -100).x, r.left + 25);
    assert.deepEqual(roomTarget(id, 9999).x, r.right - 25);
  });
});
test("ladder visits every intervening floor in either direction", () => {
  assert.deepEqual(
    ladderRoute(4, 0).map((p) => p.y),
    [645, 524, 391, 267],
  );
  assert.deepEqual(
    ladderRoute(0, 4).map((p) => p.y),
    [391, 524, 645, 761],
  );
  assert.deepEqual(ladderRoute(2, 2), []);
  assert.deepEqual(ladderRoute(3, 1, -28), [
    { x: 796, y: 524 },
    { x: 782, y: 391 },
  ]);
});
test("missing or corrupt room saves return to entrance", () => {
  for (const id of [undefined, null, -1, 5, 1.5, "2", NaN]) assert.deepEqual(validRoom(id), 4);
  assert.deepEqual(validRoom(0), 0);
});
