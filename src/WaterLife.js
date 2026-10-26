import { createCritters } from "@gandazgul/caper-engine";
import { swimMotion, WATER_CREATURES } from "./water-creatures.js";

export function swimmingCreatures(
  scene,
  { creatures = WATER_CREATURES[scene.scene.key] ?? [], animate = true } = {},
) {
  const first = scene.critterEntries?.length ?? 0;
  createCritters(
    scene,
    creatures.map(({ art, x, y, width }) => ({
      atlas: art,
      x,
      y,
      scale: width / scene.textures.get(art).getSourceImage().width,
      originX: 0.5,
      originY: 0.5,
      depth: 2,
      type: "custom",
      ampX: 0,
      ampY: 0,
    })),
  );
  const entries = scene.critterEntries.slice(first);
  if (animate && !scene.registry.get("reducedMotion")) {
    entries.forEach(({ sprite }, i) => {
      // Keep the tween in Caper's slot so the scene editor can pause/reposition
      // the swimmers without the animation fighting the editor's handles.
      sprite._critterTween = scene.tweens.add(swimMotion(sprite, creatures[i], i));
    });
    scene.events.once("shutdown", () => entries.forEach(({ sprite }) => sprite._critterTween?.stop()));
  }
  return entries.map(({ sprite }) => sprite);
}
