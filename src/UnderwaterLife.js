import { font } from "./art.js";
import { bubbleSparkles } from "./BubbleSparkles.js";

// Inspired by Bears BathScene: distinct floating and floor states. Here some
// bubbles first fall to the floor, squash on contact, then gently settle there.
export function bubbleTarget(scene, id, onPop, placement) {
  const positions = [[355, 225], [445, 280], [455, 195], [555, 310], [385, 465], [655, 400], [755, 220], [
    900,
    370,
  ]];
  const [x, y] = placement ? [placement.x, placement.y] : positions[id], r = 43;
  const root = scene.add.container(x, y).setDepth(14);
  const circle = scene.add.circle(0, 0, r, 0xc8f4fa, .65).setStrokeStyle(4, 0x356986);
  const gleam = scene.add.arc(-8, -8, 25, 195, 275, false).setStrokeStyle(5, 0xffffff, .95);
  root.add([circle, gleam]);
  circle.setInteractive({ useHandCursor: true });
  let popped = false;
  const reduced = scene.registry.get("reducedMotion");
  const type = id % 3 === 0 ? "falling" : id % 3 === 1 ? "floating" : "floor";
  root.setData("bubbleState", type);
  const floor = () => {
    root.setData("bubbleState", "floor");
    if (!reduced) {
      scene.tweens.add({
        targets: root,
        scaleX: 1.12,
        scaleY: .83,
        duration: 600,
        ease: "Sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    }
  };
  if (type === "floating" && !reduced) {
    scene.tweens.add({
      targets: root,
      x: x + (placement ? 12 : 35),
      y: y - (placement ? 18 : 65),
      duration: 3200 + id * 250,
      ease: "Sine.inOut",
      yoyo: true,
      repeat: -1,
    });
  } else if (type === "falling" && !reduced) {
    scene.tweens.add({
      targets: root,
      y: placement?.floorY ?? 595 + id * 8,
      duration: 3100 + id * 350,
      ease: "Sine.in",
      onComplete: floor,
    });
  } else if (type === "floor") {
    root.y = placement?.floorY ?? 605 + (id % 2) * 35;
    floor();
  }
  circle.on("pointerdown", (_p, _x, _y, event) => {
    event.stopPropagation();
    if (scene.blocked || popped) return;
    popped = true;
    circle.disableInteractive();
    scene.tweens.killTweensOf(root);
    if (scene.ui.effectsOn && scene.cache.audio.exists("bubblePop")) {
      scene.sound.play("bubblePop", { volume: .4, rate: 1 + id * .025 });
    }
    onPop(id);
    bubbleSparkles(scene, root.x, root.y, id);
    if (reduced) {
      root.destroy();
      return;
    }
    const burst = scene.add.circle(root.x, root.y, r, 0xffffff, 0).setStrokeStyle(5, 0xffffff, .9).setDepth(
      15,
    );
    scene.tweens.add({
      targets: burst,
      scale: 1.45,
      alpha: 0,
      duration: 200,
      onComplete: () => burst.destroy(),
    });
    scene.tweens.add({
      targets: root,
      scale: 1.18,
      alpha: 0,
      duration: 140,
      onComplete: () => root.destroy(),
    });
  });
  return root;
}

export function paperAction(scene, x, y, text, fn) {
  return scene.add.text(x, y, text, {
    ...font,
    fontSize: "27px",
    backgroundColor: "#fff9e9",
    padding: { x: 16, y: 13 },
  })
    .setOrigin(.5).setDepth(25).setInteractive({ useHandCursor: true })
    .on("pointerdown", (_p, _x, _y, e) => {
      e.stopPropagation();
      if (!scene.blocked) fn();
    });
}
