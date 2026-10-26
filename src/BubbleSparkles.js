const COLORS = [0xffdf59, 0xff91be, 0xc3a0ff, 0xffffff, 0x8ff0d0];

// A short, local celebration: no input targets, flashing, or persistent particles.
export function bubbleSparkles(scene, x, y, bubbleId) {
  const reduced = scene.registry.get("reducedMotion");
  const count = reduced ? 5 : 12;
  return Array.from({ length: count }, (_, i) => {
    const angle = i * Math.PI * 2 / count + bubbleId * .47;
    const start = reduced ? 25 : 15 + (i % 3) * 7;
    const distance = 65 + (i % 4) * 12;
    const radius = 7 + (i % 3) * 2;
    const star = scene.add.star(
      x + Math.cos(angle) * start,
      y + Math.sin(angle) * start,
      4,
      radius * .3,
      radius,
      COLORS[(i + bubbleId) % COLORS.length],
    ).setStrokeStyle(1.5, 0x513272, .7).setDepth(16).setAngle(i * 27);
    star.setData("bubbleSparkle", true);
    scene.tweens.add({
      targets: star,
      ...(reduced ? {} : {
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance - 18,
        angle: star.angle + (i % 2 ? 65 : -65),
        scale: .2,
      }),
      alpha: 0,
      duration: reduced ? 300 : 520 + (i % 4) * 60,
      ease: "Cubic.out",
      onComplete: () => star.destroy(),
    });
    return star;
  });
}
