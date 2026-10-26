import { drawing } from "./DrawnWorld.js";
import { exitArrow } from "./WorldInteraction.js";

// The vine belongs behind the right-hand house. Its climb is a scripted walk,
// not a permanently walkable shortcut through the house or the sky.
export function villageVine(scene) {
  const vine = drawing(scene, "cloudVine", 720, 550, 220, 1);
  exitArrow(scene, "cloud-garden", 869, 39, () => climbVine(scene, vine), "up");
}

export function climbVine(scene, vine) {
  if (scene.blocked || scene.editor.active) return;
  scene.ui.setBusy(true);
  scene.activeMarker.setVisible(false);
  scene.ui.status("Up the vine! Let's visit the clouds.");
  const walkers = [scene.walk, ...scene.idleCharacters.map((c) => c.walker)];
  let waiting = walkers.length;
  const finish = (walker) => {
    walker.lock();
    if (--waiting === 0) scene.scene.start("CloudGarden", { climbed: true });
  };
  if (scene.registry.get("reducedMotion")) {
    scene.tweens.add({
      targets: walkers.map((w) => w.sprite),
      alpha: 0,
      duration: 160,
      onComplete: () => scene.scene.start("CloudGarden"),
    });
    return;
  }
  const steps = [
    { x: 10, y: -35 },
    { x: -10, y: -120 },
    { x: 14, y: -215 },
    { x: -10, y: -305 },
    { x: 10, y: -400 },
    { x: -10, y: -490 },
    { x: 0, y: -580 },
    { x: 0, y: -740 },
  ].map((p) => ({ x: vine.x + p.x, y: vine.y + p.y }));
  walkers.forEach((walker, i) => {
    walker.unlock();
    walker.walkTo(walker.snapToWalkable({ x: vine.x - i * 75, y: 665 }), () => {
      scene.time.delayedCall(i * 450, () => {
        walker.sprite.setDepth(6);
        walker.walkPath(steps, 0, () => finish(walker));
      });
    });
  });
}
