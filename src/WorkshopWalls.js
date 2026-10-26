// Original scans, not AI redrawn versions. Keep these separate from the room
// painting so darkness uncovers the makers' own marks, colors and proportions.
export const WORKSHOP_WALL_ART = [
  { key: "rainbow", x: 258, y: 230, w: 140, h: 95, angle: -4 },
  { key: "heartButterfly", x: 845, y: 230, w: 72, h: 94, angle: 4 },
  { key: "house", x: 950, y: 230, w: 105, h: 94, angle: -3 },
  { key: "birthdayFlowers", x: 325, y: 460, w: 105, h: 110, angle: -5 },
  { key: "blueCat", x: 660, y: 477, w: 82, h: 95, angle: 4 },
  { key: "cake", x: 755, y: 480, w: 95, h: 100, angle: -3 },
];
export function workshopWallArt(scene) {
  for (const { key, x, y, w, h, angle } of WORKSHOP_WALL_ART) {
    const source = scene.textures.get(key).getSourceImage();
    const scale = Math.min((w - 12) / source.width, (h - 12) / source.height);
    const paper = scene.add.rectangle(0, 0, w, h, 0xfff9e9);
    const scan = scene.add.image(0, 0, key).setScale(scale);
    const tape = scene.add.rectangle(0, -h / 2, 22, 10, 0xe6c579);
    scene.add.container(x, y, [paper, scan, tape]).setAngle(angle).setDepth(2);
  }
}
