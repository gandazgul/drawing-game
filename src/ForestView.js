import { COLORS, line } from "./art.js";
import { DANCE_PATH, danceWorld } from "./puzzles/forest.js";
import { trackArt } from "./WorldEditor.js";

export function forestMarks(scene, strokes, world = false) {
  const g = scene.add.graphics().setDepth(2);
  for (const stroke of strokes) {
    stroke.forEach((p, i) => {
      const a = stroke[i - 1] ?? p;
      line(
        g,
        world ? danceWorld(a) : a,
        world ? danceWorld(p) : p,
        COLORS.includes(p.c) ? p.c : COLORS[0],
        world ? 12 : 14,
      );
    });
  }
  return g;
}
export function createBear(scene, x, y, height = 240) {
  const source = scene.textures.get("bearSheet").getSourceImage();
  if (!scene.textures.exists("bearPoses")) {
    scene.textures.addSpriteSheet("bearPoses", source, {
      frameWidth: 384,
      frameHeight: 512,
    });
  }
  const sprite = scene.add.sprite(x, y, "bearPoses", 0).setOrigin(.5, 1).setDepth(5);
  sprite.setScale(height / 512);
  return trackArt(scene, "ballerina-bear", sprite);
}
export function bearDance(scene, bear, complete) {
  if (scene.registry.get("reducedMotion")) {
    bear.setFrame(5);
    scene.time.delayedCall(450, () => {
      bear.setFrame(0);
      complete?.();
    });
    return;
  }
  const poses = [0, 1, 2, 3, 2, 4, 2, 5];
  let frame = 0;
  const timer = scene.time.addEvent({
    delay: 260,
    loop: true,
    callback: () => {
      bear.setFrame(poses[frame++ % poses.length]);
    },
  });
  const route = DANCE_PATH.map(danceWorld);
  bear.setPosition(route[0].x, route[0].y);
  let i = 1;
  const next = () => {
    if (i === route.length) {
      timer.remove();
      bear.setFrame(5);
      scene.time.delayedCall(550, () => {
        bear.setFrame(0);
        complete?.();
      });
      return;
    }
    const point = route[i++];
    scene.tweens.add({
      targets: bear,
      x: point.x,
      y: point.y,
      duration: 950,
      ease: "Sine.inOut",
      onComplete: next,
    });
  };
  next();
  scene.events.once("shutdown", () => timer.remove());
}
