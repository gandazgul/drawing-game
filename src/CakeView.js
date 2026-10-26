import { COLORS, line } from "./art.js";
import { validStrokes } from "./state.js";

// Frame a section of the original scan, like the rainbow puzzle. No source pixels are rewritten.
export function cakeBody(scene, x, bottom, width, raw = []) {
  const key = "cake-without-candles";
  if (!scene.textures.exists(key)) {
    const source = scene.textures.get("cake").getSourceImage();
    const texture = scene.textures.addImage(key, source);
    const top = Math.round(source.height * 0.3);
    texture.get().setSize(source.width, source.height - top, 0, top);
  }
  const scale = width / 280;
  scene.add
    .image(x, bottom, key)
    .setOrigin(0.5, 1)
    .setDisplaySize(width, 350 * scale)
    .setDepth(2);
  const ink = scene.add.graphics().setDepth(4);
  const project = (p) => ({ x: x + (p.x - 600) * scale, y: bottom + (p.y - 635) * scale });
  for (const stroke of validStrokes(raw)) {
    for (let i = 1; i < stroke.length; i++) {
      line(ink, project(stroke[i - 1]), project(stroke[i]), stroke[i].color ?? COLORS[1], 8 * scale);
    }
  }
}
