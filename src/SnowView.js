import { SNOW_PARTS, validSnowPieces } from "./puzzles/snow.js";

// Frames select discrete sprites on an unmodified generated sheet.
export function registerSnowFrames(textures) {
  const texture = textures.get("snowParts");
  const frames = {
    base: [0, 85, 455, 535],
    body: [455, 180, 455, 410],
    head: [920, 235, 334, 350],
    twig: [40, 690, 380, 425],
    carrot: [435, 710, 500, 375],
    rock: [960, 820, 285, 250],
  };
  for (const [key, [x, y, w, h]] of Object.entries(frames)) {
    if (!texture.has(key)) texture.add(key, 0, x, y, w, h);
  }
}

export function snowPart(scene, kind, x, y, width) {
  const part = SNOW_PARTS[kind];
  const image = scene.add.image(x, y, part.texture ?? "snowParts", part.frame);
  image.setScale((width ?? part.width) / image.width);
  return image;
}

export function snowCreation(scene, raw, x, y, scale = 1) {
  const root = scene.add.container(x, y);
  const pieces = validSnowPieces(raw).sort((a, b) => SNOW_PARTS[a.kind].depth - SNOW_PARTS[b.kind].depth);
  for (const p of pieces) {
    root.add(snowPart(scene, p.kind, p.x - 490, p.y - 640).setFlipX(p.flip));
  }
  root.setScale(scale);
  return root;
}

export const materialPart = { twigs: "twig", carrot: "carrot", rocks: "rock" };
