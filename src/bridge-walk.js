// The feet follow the colored band in the children's scanned arch, not a straight chord.
export const BRIDGE_ROUTE = [
  { x: 300, y: 535 },
  { x: 317, y: 430 },
  { x: 352, y: 332 },
  { x: 403, y: 254 },
  { x: 463, y: 198 },
  { x: 530, y: 177 },
  { x: 602, y: 182 },
  { x: 676, y: 212 },
  { x: 746, y: 265 },
  { x: 815, y: 339 },
  { x: 872, y: 420 },
  { x: 924, y: 495 },
];
export function portWalkable(repaired) {
  const shore = [{ x: 440, y: 650 }, { x: 550, y: 685 }, { x: 645, y: 710 }, { x: 650, y: 760 }, {
    x: 70,
    y: 760,
  }];
  if (!repaired) return [{ x: 70, y: 500 }, { x: 265, y: 500 }, ...shore];
  return [
    { x: 70, y: 500 },
    { x: 260, y: 500 },
    ...BRIDGE_ROUTE.map(({ x, y }) => ({ x, y: y - 17 })),
    { x: 1010, y: 340 },
    { x: 1180, y: 330 },
    { x: 1180, y: 470 },
    { x: 980, y: 540 },
    ...BRIDGE_ROUTE.toReversed().map(({ x, y }) => ({ x, y: y + 17 })),
    ...shore,
  ];
}
