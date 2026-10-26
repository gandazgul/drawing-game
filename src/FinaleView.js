import { drawing, treeFruit } from "./DrawnWorld.js";
import { COLORS, line } from "./art.js";
import { DECORATIONS, TREE_ROUTE, validDecorations } from "./puzzles/finale.js";

export function treeHouses(scene, done) {
  // Four different homes from the makers' pages, each seated on its own branch.
  // Widths account for the narrow orange house and the tall chimney silhouette.
  return [
    ["house", 440, 320, 132],
    ["orangeHouse", 890, 332, 104],
    ["birthdayHouse", 400, 216, 100],
    ["studioExterior", 700, 137, 66],
  ].map(([key, x, y, w]) => drawing(scene, key, x, y, w, 2).setAlpha(done ? 1 : .5));
}
export function finaleFruit(scene) {
  return treeFruit(scene, [[515, 180, 39, -9], [760, 94, 32, 11], [925, 259, 37, -8], [743, 390, 34, 8]]);
}
export function routeArt(scene, done, strokes = []) {
  const g = scene.add.graphics().setDepth(3);
  g.lineStyle(done ? 24 : 18, 0xfff3cd, done ? 1 : .8).strokePoints(TREE_ROUTE);
  if (done) g.lineStyle(17, 0xe6ad24).strokePoints(TREE_ROUTE);
  else {
    for (let i = 1; i < TREE_ROUTE.length; i++) {
      const a = TREE_ROUTE[i - 1], b = TREE_ROUTE[i], n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 22);
      for (let j = 0; j < n; j += 2) {
        line(
          g,
          { x: a.x + (b.x - a.x) * j / n, y: a.y + (b.y - a.y) * j / n },
          { x: a.x + (b.x - a.x) * Math.min(j + 1, n) / n, y: a.y + (b.y - a.y) * Math.min(j + 1, n) / n },
          0x66418d,
          3,
        );
      }
    }
  }
  for (const s of strokes) {
    s.forEach((p, i) => line(g, s[i - 1] ?? p, p, COLORS.includes(p.c) ? p.c : COLORS[1], 12));
  }
  return g;
}
export function decoration(scene, p, depth = 7) {
  const spec = DECORATIONS[p.kind];
  if (spec.art) return drawing(scene, spec.art, p.x, p.y, spec.width, depth);
  // Simple lantern icon, not substitute scenery; colored paper body with a handle.
  const g = scene.add.graphics().setPosition(p.x, p.y).setDepth(depth);
  g.lineStyle(3, 0x66418d).strokeEllipse(0, -58, 24, 20);
  g.fillStyle(0xf9df70).fillRoundedRect(-22, -55, 44, 50, 9);
  g.lineStyle(3, 0x66418d).strokeRoundedRect(-22, -55, 44, 50, 9);
  g.lineStyle(2, 0xb53e69).lineBetween(-7, -52, -7, -8).lineBetween(7, -52, 7, -8);
  return g;
}
export function savedDecorations(scene, raw) {
  return validDecorations(raw).map((p) => decoration(scene, p));
}
export function finaleBackdrop(scene, values) {
  scene.add.image(600, 400, values.endingWaterDone ? "endingWater" : "endingDry").setDisplaySize(1200, 800)
    .setDepth(-10);
  treeHouses(scene, values.endingHouseDone);
  finaleFruit(scene);
  routeArt(scene, values.endingRouteDone, values.endingRouteStrokes ?? []);
  savedDecorations(scene, values.endingDecorations);
}
export function sparkleBurst(scene, x, y, big = false) {
  const reduced = scene.registry.get("reducedMotion"), count = reduced ? 6 : big ? 32 : 12;
  for (let i = 0; i < count; i++) {
    const t = i / count * Math.PI * 2, r = big ? 125 : 30;
    const star = scene.add.star(x, y, 4, 2, big ? 10 : 6, [0xfddf55, 0xe26487, 0xffffff, 0x45954f][i % 4])
      .setDepth(40);
    scene.tweens.add({
      targets: star,
      alpha: 0,
      ...(reduced ? {} : { x: x + Math.cos(t) * r, y: y + Math.sin(t) * r, angle: 90 }),
      duration: reduced ? 450 : 1100,
      onComplete: () => star.destroy(),
    });
  }
}
