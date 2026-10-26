import { drawPipe } from "./PipeView.js";
import { currentPoint, SPRING_BOARD, springFillOrder } from "./puzzles/spring.js";
import { trackArt } from "./WorldEditor.js";

export function springView(scene, puzzle, { restored = false, reveal = false } = {}) {
  const { x, y, size } = SPRING_BOARD, scale = size / 500;
  const root = scene.add.container(x, y).setDepth(3);
  const bed = scene.add.graphics();
  bed.fillStyle(0xffedbd, .96).fillRoundedRect(-14, -14, size + 28, size + 28, 22);
  bed.lineStyle(3, 0x916444).strokeRoundedRect(-14, -14, size + 28, size + 28, 22);
  root.add(bed);
  const pipes = scene.add.graphics().setScale(scale);
  root.add(pipes);
  // An anchored inlet and outlet are external fittings, not rotatable tiles.
  const spring = scene.add.ellipse(x - 65, y + 35, 78, 58, 0x26798c).setStrokeStyle(5, 0xfff9e9).setDepth(3);
  const lip = scene.add.ellipse(x - 65, y + 35, 45, 29).setStrokeStyle(3, 0xb8edf0).setDepth(4);
  const plants = [370, 820].map((px, i) => {
    const sprite = scene.add.image(px, 660, "plant").setOrigin(.5, 1).setDepth(4);
    sprite.setScale(100 / sprite.width).setAngle(i ? 14 : -14);
    trackArt(scene, `spring-plant-${i}`, sprite);
    return sprite;
  });
  const wet = new Set(restored && !reveal ? puzzle.cells.map((_m, i) => i) : [0]);
  const render = () => {
    pipes.clear();
    puzzle.cells.forEach((mask, i) => {
      drawPipe(pipes, (i % 5) * 100, Math.floor(i / 5) * 100, mask, wet.has(i), i === 0, i === 24);
    });
  };
  render();
  const current = scene.add.graphics().setDepth(1).setVisible(false);
  const motes = scene.add.graphics().setDepth(2);
  let flowing = false, elapsed = 0;
  const reduced = scene.registry.get("reducedMotion");
  const startFlow = () => {
    flowing = true;
    current.setVisible(true);
    // Broad pale ribbons remain readable even when reduced motion is enabled.
    for (const [offset, width, alpha] of [[0, 48, .27], [-29, 6, .65], [29, 6, .65]]) {
      const points = Array.from({ length: 61 }, (_, i) => currentPoint(i / 60, offset));
      current.lineStyle(width, 0xd4fff2, alpha).strokePoints(points);
    }
    plants.forEach((sprite, i) => {
      sprite.setAngle(0);
      if (!reduced) {
        sprite._springSway = scene.tweens.add({
          targets: sprite,
          angle: i ? 7 : -7,
          duration: 2200 + i * 350,
          yoyo: true,
          repeat: -1,
          ease: "Sine.inOut",
        });
      }
    });
  };
  const update = (_time, delta) => {
    plants.forEach((p) => scene.editor.active ? p._springSway?.pause() : p._springSway?.resume());
    if (!flowing) return;
    if (!reduced && !scene.editor.active) elapsed += delta;
    motes.clear();
    for (let i = 0; i < 15; i++) {
      const p = currentPoint((i / 15 + elapsed / 11000) % 1, (i % 3 - 1) * 18);
      const r = i % 3 === 0 ? 6 : 3;
      motes.fillStyle(i % 3 === 0 ? 0xffe89a : 0xffffff, .9);
      motes.fillPoints([{ x: p.x, y: p.y - r }, { x: p.x + r / 2, y: p.y }, { x: p.x, y: p.y + r }, {
        x: p.x - r / 2,
        y: p.y,
      }], true);
    }
  };
  scene.events.on("update", update);
  scene.events.once("shutdown", () => scene.events.off("update", update));
  if (restored && !reveal) startFlow();
  return {
    root,
    spring,
    lip,
    plants,
    wet,
    get flowing() {
      return flowing;
    },
    restore(onFlow) {
      const order = springFillOrder(puzzle.cells);
      const fill = (i) => {
        wet.add(i);
        render();
      };
      if (reduced) {
        order.forEach(fill);
        startFlow();
        onFlow();
      } else {
        order.forEach((cell, i) => scene.time.delayedCall(i * 65, () => fill(cell)));
        scene.time.delayedCall(order.length * 65 + 200, () => {
          startFlow();
          onFlow();
        });
      }
    },
  };
}
