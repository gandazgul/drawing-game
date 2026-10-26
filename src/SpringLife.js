import { swimmingCreatures } from "./WaterLife.js";
import { WATER_CREATURES } from "./water-creatures.js";
import { currentPoint } from "./puzzles/spring.js";

export function springLife(scene, flowing) {
  const waiting = [
    [205, 300],
    [350, 190],
    [200, 460],
    [155, 185],
    [305, 390],
    [480, 180],
    [605, 170],
  ];
  const creatures = WATER_CREATURES.Underwater.map((spec, i) => ({
    ...spec,
    x: waiting[i][0],
    y: waiting[i][1],
    width: spec.width * 0.85,
  }));
  const sprites = swimmingCreatures(scene, { creatures, animate: false });
  const reduced = scene.registry.get("reducedMotion");
  let started = false;
  const follow = (sprite, i) => {
    const p = currentPoint(sprite.springT, ((i % 3) - 1) * 18);
    sprite.setPosition(p.x, p.y).setFlipX(p.right !== (creatures[i].art === "axolotlPink"));
    // Fade at the edge of the current, not a visible teleport back to the outlet.
    sprite.setAlpha(reduced ? 1 : Math.min(1, sprite.springT * 15, (1 - sprite.springT) * 15));
  };
  const startFlow = (arrival = false) => {
    if (started) return;
    started = true;
    sprites.forEach((sprite, i) => {
      sprite._critterTween?.stop();
      scene.tweens.killTweensOf(sprite);
      sprite.springT = (i + 0.5) / sprites.length;
      const begin = () => {
        follow(sprite, i);
        if (!reduced) {
          sprite._critterTween = scene.tweens.add({
            targets: sprite,
            springT: 1,
            duration: 12500 * (1 - sprite.springT),
            ease: "Linear",
            onUpdate: () => follow(sprite, i),
            onComplete: () => {
              sprite.springT = 0;
              sprite._critterTween = scene.tweens.add({
                targets: sprite,
                springT: 1,
                duration: 12500,
                repeat: -1,
                ease: "Linear",
                onUpdate: () => follow(sprite, i),
              });
            },
          });
        }
      };
      if (arrival && !reduced) {
        const p = currentPoint(sprite.springT, ((i % 3) - 1) * 18);
        sprite.setFlipX(p.x > sprite.x !== (creatures[i].art === "axolotlPink"));
        sprite._critterTween = scene.tweens.add({
          targets: sprite,
          x: p.x,
          y: p.y,
          duration: 1500 + i * 100,
          ease: "Sine.inOut",
          onComplete: begin,
        });
      } else begin();
    });
  };
  if (flowing) startFlow();
  else if (!reduced) {
    sprites.forEach((sprite, i) => {
      sprite.setFlipX(creatures[i].art !== "axolotlPink");
      sprite._critterTween = scene.tweens.add({
        targets: sprite,
        y: sprite.y + 6,
        duration: 2400 + i * 150,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    });
  }
  scene.events.once("shutdown", () => sprites.forEach((sprite) => sprite._critterTween?.stop()));
  return { sprites, startFlow };
}
