import { line } from "./art.js";
import {
  BRIDGE_CROP,
  BRIDGE_PATHS,
  BRIDGE_VIEW,
  bridgePoint,
  bridgeSource,
  RAINBOW,
  safeBridgeBands,
} from "./puzzles/rainbow.js";

export function bridgeCloseup(scene) {
  const key = "bridge-closeup";
  if (!scene.textures.exists(key)) {
    const c = BRIDGE_CROP;
    // A separate texture owns the crop. Adding the first named frame to port
    // would change its default frame and zoom the world on returning to it.
    const texture = scene.textures.addImage(key, scene.textures.get("rainbow").getSourceImage());
    texture.get().setSize(c.width, c.height, c.x, c.y);
  }
  const image = scene.add.image(BRIDGE_VIEW.x, BRIDGE_VIEW.y, key)
    .setOrigin(0).setScale(BRIDGE_VIEW.scale);
  bridgeGap(scene);
  return image;
}

export function bridgeGap(scene, world = false) {
  const g = scene.add.graphics().setDepth(2);
  const project = (p) => world ? bridgePoint(bridgeSource(p), true) : p;
  const a = project(BRIDGE_PATHS[0][0]), b = project(BRIDGE_PATHS[6].at(-1));
  if (!world) g.fillStyle(0xfff9e9).fillRect(a.x + 6, a.y - 55, b.x - a.x - 12, b.y - a.y + 70);
  BRIDGE_PATHS.forEach((path, i) => {
    g.lineStyle(2, RAINBOW[i], .22).strokePoints(path.map(project));
  });
  return g;
}

export function worldBridge(scene, complete) {
  const key = "rainbow-world-gap";
  if (!complete && !scene.textures.exists(key)) {
    const source = scene.textures.get("rainbow").getSourceImage();
    const texture = scene.textures.createCanvas(key, source.width, source.height);
    const context = texture.getContext();
    context.drawImage(source, 0, 0);
    const a = bridgeSource(BRIDGE_PATHS[0][0]);
    const b = bridgeSource(BRIDGE_PATHS[6].at(-1));
    // Cut the source arch, not the scenery behind it. The missing section
    // must reveal sky rather than painting a paper rectangle over the world.
    context.clearRect(a.x + 6 / .55, a.y - 55 / .55, b.x - a.x - 12 / .55, b.y - a.y + 70 / .55);
    texture.refresh();
  }
  const image = scene.add.image(240, 85, complete ? "rainbow" : key).setOrigin(0).setScale(.55).setDepth(2);
  if (!complete) bridgeGap(scene, true);
  return image;
}

export function drawBridgeBands(graphics, raw, world = false) {
  graphics.clear();
  safeBridgeBands(raw).forEach((strokes, band) => {
    for (const stroke of strokes) {
      stroke.forEach((p, i) => {
        const a = stroke[i - 1] ?? p;
        const project = (q) => world ? bridgePoint(bridgeSource(q), true) : q;
        line(graphics, project(a), project(p), RAINBOW[band], world ? 11 : 14);
      });
    }
  });
}
