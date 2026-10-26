// Coordinates follow the floors and sloping ladder in inn-playable-v2.
// Each floor is independent: only the ladder connects rooms, never a diagonal.
export const INN_ROOMS = [
  { name: "Attic", left: 500, right: 805, top: 190, floor: 267, ladder: 770 },
  { name: "Dining room", left: 425, right: 860, top: 280, floor: 391, ladder: 810 },
  { name: "Picture room", left: 397, right: 875, top: 407, floor: 524, ladder: 824 },
  { name: "Bedroom", left: 440, right: 861, top: 540, floor: 645, ladder: 824 },
  { name: "Entrance", left: 600, right: 780, top: 660, floor: 761, ladder: 762 },
];

export const INN_TASK_ROOMS = { luggage: 3, rooms: 2 };

export const validRoom = (id) => (Number.isInteger(id) && id >= 0 && id < INN_ROOMS.length ? id : 4);
export const roomFloor = (id) => {
  const { left, right, floor } = INN_ROOMS[validRoom(id)];
  return [
    { x: left, y: floor - 3 },
    { x: right, y: floor - 3 },
    { x: right, y: floor + 2 },
    {
      x: left,
      y: floor + 2,
    },
  ];
};
export const roomTarget = (id, x) => {
  const room = INN_ROOMS[validRoom(id)];
  return { x: Math.max(room.left + 25, Math.min(room.right - 25, x)), y: room.floor };
};
export function ladderRoute(from, to, offset = 0) {
  from = validRoom(from);
  to = validRoom(to);
  const points = [];
  const step = Math.sign(to - from);
  for (let id = from + step; step && id !== to + step; id += step) {
    points.push({ x: INN_ROOMS[id].ladder + offset, y: INN_ROOMS[id].floor });
  }
  return points;
}
