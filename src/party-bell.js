// Pivot at the tied cord, so ringing stays anchored to the branch.
// No idle loop: one short, diminishing swing acknowledges each tap.
export function ringPartyBell(scene, bell) {
  scene.tweens.killTweensOf(bell);
  bell.setAngle(0).setAlpha(1);
  if (scene.registry.get("reducedMotion")) {
    return scene.tweens.add({ targets: bell, alpha: .65, duration: 160, yoyo: true });
  }
  return scene.tweens.chain({
    targets: bell,
    tweens: [
      { angle: -18, duration: 120, ease: "Sine.Out" },
      { angle: 15, duration: 220, ease: "Sine.InOut" },
      { angle: -10, duration: 200, ease: "Sine.InOut" },
      { angle: 6, duration: 180, ease: "Sine.InOut" },
      { angle: 0, duration: 180, ease: "Sine.Out" },
    ],
  });
}
