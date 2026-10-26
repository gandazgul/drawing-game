// Caper owns routing and editor handles; these helpers connect drawn objects to them.
export function worldTarget(scene, id, bounds, action, approach = null) {
  const config = { id, type: "look", cursor: "pointer", bounds, approachPoint: approach };
  scene.hotspots.register(config);
  const zone = scene.hotspots.zones.get(id).setDepth(12);
  const arrived = (target) => {
    if (target.id === id && !scene.blocked && !scene.editor.active) action();
  };
  scene.bus.on("hotspot:arrived", arrived);
  return zone;
}

export function objectTarget(scene, id, image, action, approach = null) {
  const b = image.getBounds();
  return worldTarget(scene, id, { x: b.x, y: b.y, w: b.width, h: b.height }, action, approach);
}

// Use only where no clear door, stairway, or destination object carries the transition.
// Prefer objectTarget/worldTarget on the artwork; never add a duplicate arrow beside it.
// Opaque, high-contrast exit markers stay readable over every painted background.
export function exitArrow(scene, id, x, y, action, direction = "left") {
  const g = scene.add.graphics().setPosition(x, y).setDepth(14).setName(`exit-${id}`);
  const angle = { left: 0, right: Math.PI, up: Math.PI / 2, down: -Math.PI / 2 }[direction] ?? 0;
  const arrow = [
    { x: -24, y: 0 },
    { x: -3, y: -19 },
    { x: -3, y: -7 },
    { x: 24, y: -7 },
    { x: 24, y: 7 },
    { x: -3, y: 7 },
    { x: -3, y: 19 },
  ].map((p) => ({
    x: p.x * Math.cos(angle) - p.y * Math.sin(angle),
    y: p.x * Math.sin(angle) + p.y * Math.cos(angle),
  }));
  let highlighted = false;
  const paint = () => {
    g.clear();
    g.fillStyle(0xfff9e9).fillRoundedRect(-48, -32, 96, 64, 12);
    g.fillStyle(highlighted ? 0x292b4b : 0x66418d).fillRoundedRect(-44, -28, 88, 56, 9);
    g.fillStyle(0xfff9e9).fillPoints(arrow, true);
  };
  paint();
  const bounds = { x: x - 48, y: y - 32, w: 96, h: 64 };
  const zone = worldTarget(scene, id, bounds, action);
  let minWidth = 96,
    minHeight = 64;
  const resize = () => {
    const scale = scene.game.canvas.getBoundingClientRect().width / scene.scale.gameSize.width;
    const touchSize = Math.ceil(48 / (scale || 1));
    const nextWidth = Math.max(96, touchSize),
      nextHeight = Math.max(64, touchSize);
    // Keep the center and any editor-authored extra space when the viewport rotates.
    const w = Math.max(nextWidth, zone.width + nextWidth - minWidth);
    const h = Math.max(nextHeight, zone.height + nextHeight - minHeight);
    const cx = zone.x + zone.width / 2,
      cy = zone.y + zone.height / 2;
    Object.assign(bounds, { x: cx - w / 2, y: cy - h / 2, w, h });
    zone.setPosition(bounds.x, bounds.y).setSize(w, h);
    zone.input.hitArea.setSize(w, h);
    minWidth = nextWidth;
    minHeight = nextHeight;
  };
  // Follow the hotspot if it is repositioned in Caper's editor or a saved layout.
  const sync = () => {
    const w = Math.max(minWidth, zone.width),
      h = Math.max(minHeight, zone.height);
    const cx = Math.max(w / 2 + 4, Math.min(1200 - w / 2 - 4, zone.x + zone.width / 2));
    const cy = Math.max(h / 2 + 4, Math.min(800 - h / 2 - 4, zone.y + zone.height / 2));
    if (zone.width !== w || zone.height !== h || zone.x !== cx - w / 2 || zone.y !== cy - h / 2) {
      Object.assign(bounds, { x: cx - w / 2, y: cy - h / 2, w, h });
      zone.setPosition(bounds.x, bounds.y).setSize(w, h);
      zone.input.hitArea.setSize(w, h);
    }
    g.setPosition(cx, cy);
  };
  const highlight = (value) => {
    highlighted = value;
    paint();
  };
  zone.on("pointerover", () => highlight(true));
  zone.on("pointerdown", () => highlight(true));
  zone.on("pointerout", () => highlight(false));
  zone.on("pointerup", () => highlight(false));
  resize();
  scene.scale.on("resize", resize);
  scene.events.on("update", sync);
  scene.events.once("shutdown", () => {
    scene.scale.off("resize", resize);
    scene.events.off("update", sync);
  });
  return zone;
}
