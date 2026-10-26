const KEY = "drawing-world-layouts-v1";
const point = (p) =>
  p && Number.isFinite(p.x) && Number.isFinite(p.y) &&
  p.x >= 0 && p.x <= 1200 && p.y >= 0 && p.y <= 800;
const polygon = (p) => Array.isArray(p) && p.length >= 3 && p.length <= 100 && p.every(point);
const bounds = (b) =>
  point(b) && Number.isFinite(b.w) && Number.isFinite(b.h) &&
  b.w > 0 && b.h > 0 && b.w <= 1200 && b.h <= 800;

function layouts() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}
export function trackArt(scene, id, sprite) {
  if (!scene.sceneConfig?.propItems) return sprite;
  const spec = { id, x: sprite.x, y: sprite.y };
  scene.sceneConfig.propItems.push(spec);
  scene.propSprites.set(id, sprite);
  return sprite;
}
export function installWorldEditor(scene) {
  scene.layoutKey = `${scene.scene.key}:${scene.layoutVariant ?? "default"}`;
  const original = scene.editor.toggle.bind(scene.editor);
  scene.editor.toggle = () => {
    if (scene.blocked) return;
    original();
    if (scene.editor.active) {
      scene.walk.lock();
      for (const idle of scene.idleCharacters) idle.freeze();
    } else {
      scene.walk.unlock();
      for (const idle of scene.idleCharacters) {
        idle.walker?.unlock();
        idle.behavior?.resume();
      }
    }
    scene.ui.refresh();
  };
  scene.editor.copyProps = () => scene.editor._writeClipboard(JSON.stringify(snapshot(scene), null, 2));
  scene.saveLayout = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...layouts(), [scene.layoutKey]: snapshot(scene) }));
      scene.editor.showToast("Layout saved in this browser. P copies it for the project.");
    } catch {
      scene.editor.showToast("Could not save. Press P to copy the layout instead.");
    }
  };
  // Subclasses finish adding art and hotspots synchronously after super.create.
  scene.time.delayedCall(0, () => restore(scene, layouts()?.[scene.layoutKey]));
}
function snapshot(scene) {
  return {
    scene: scene.layoutKey,
    walkable: scene.sceneConfig.walkable,
    props: scene.sceneConfig.propItems,
    hotspots: scene.hotspots.list().filter((h) => !h.data?.npc).map((h) => ({
      id: h.id,
      bounds: h.bounds,
      approachPoint: h.approachPoint,
    })),
    critters: (scene.critterEntries ?? []).map(({ spec }) => ({
      x: spec.x,
      y: spec.y,
      placementVersion: spec.placementVersion,
    })),
  };
}
function restore(scene, saved) {
  if (!saved || saved.scene !== scene.layoutKey) return;
  if (polygon(saved.walkable)) scene.setWalkable(structuredClone(saved.walkable));
  for (const spec of scene.sceneConfig.propItems) {
    const position = saved.props?.find?.((p) => p.id === spec.id);
    if (point(position)) {
      Object.assign(spec, { x: position.x, y: position.y });
      scene.propSprites.get(spec.id)?.setPosition(spec.x, spec.y);
    }
  }
  for (const h of scene.hotspots.list()) {
    const from = saved.hotspots?.find?.((p) => p.id === h.id);
    if (!from) continue;
    if (bounds(from.bounds)) {
      Object.assign(h.bounds, from.bounds);
      const b = h.bounds, zone = scene.hotspots.zones.get(h.id);
      zone.setPosition(b.x, b.y).setSize(b.w, b.h);
      zone.input.hitArea.setSize(b.w, b.h);
    }
    if (h.approachPoint && point(from.approachPoint)) Object.assign(h.approachPoint, from.approachPoint);
  }
  (scene.critterEntries ?? []).forEach(({ spec, sprite }, i) => {
    const p = saved.critters?.[i];
    if (!point(p)) return;
    // Preserve other edits, but don't restore an old flying-chicken anchor.
    if (spec.placementVersion && p.placementVersion !== spec.placementVersion) return;
    // Existing Caper tweens use their original endpoints. Freeze this edited
    // creature until a future authored export rebuilds its animation at the new anchor.
    scene.tweens.killTweensOf(sprite);
    spec.x = p.x;
    spec.y = p.y;
    sprite.setPosition(p.x, p.y);
  });
}
