import { distanceToSegment } from "./puzzles/geometry.js";

export function nearestOnPath(point, path) {
  let nearest = null, distance = Infinity;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i], dx = b.x - a.x, dy = b.y - a.y;
    const length = dx * dx + dy * dy;
    const t = length ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / length)) : 0;
    const d = distanceToSegment(point, a, b);
    if (d < distance) {
      distance = d;
      nearest = { x: a.x + dx * t, y: a.y + dy * t };
    }
  }
  return { point: nearest, distance };
}

// A finger obscures a thin line. Keep its small wobbles, but guide a nearby
// touch onto the chosen stroke. Coverage/finishing requirements do not change.
export function traceTouch(point, path, worldPerPixel = 1, isTouch = false) {
  if (!isTouch) return point;
  const near = nearestOnPath(point, path);
  if (!near.point || near.distance > 18 * worldPerPixel) return null;
  const wobble = near.distance ? Math.min(.25, 3 / near.distance) : 0;
  return {
    x: near.point.x + (point.x - near.point.x) * wobble,
    y: near.point.y + (point.y - near.point.y) * wobble,
  };
}

export function worldPerPixel(scene) {
  return scene.scale.gameSize.width / scene.game.canvas.getBoundingClientRect().width;
}

// Circle hit targets grow in physical CSS pixels, not tiny scaled game units.
export function fingerCircle(scene, shape, minimumPixels = 44) {
  const center = shape.radius;
  return shape.setInteractive({
    useHandCursor: true,
    hitArea: { x: center, y: center },
    hitAreaCallback: (area, x, y) => {
      const touch = globalThis.matchMedia?.("(pointer: coarse)").matches;
      const radius = touch ? Math.max(center, minimumPixels / 2 * worldPerPixel(scene)) : center;
      return Math.hypot(x - area.x, y - area.y) <= radius;
    },
  });
}

// Keep small paper controls visually compact, with a live, viewport-sized touch area.
// Clamp that area inside the canvas so controls at its bottom still get the full height.
export function fingerRect(scene, object, minimumPixels = 48) {
  return object.setInteractive({
    useHandCursor: true,
    hitArea: {},
    hitAreaCallback: (_area, x, y) => {
      const touch = globalThis.matchMedia?.("(pointer: coarse)").matches;
      const minimum = touch ? minimumPixels * worldPerPixel(scene) : 0;
      const w = Math.max(object.width, minimum), h = Math.max(object.height, minimum);
      const left = object.x - object.width * object.originX;
      const top = object.y - object.height * object.originY;
      const hitLeft = Math.max(0, Math.min(scene.scale.gameSize.width - w, left - (w - object.width) / 2));
      const hitTop = Math.max(0, Math.min(scene.scale.gameSize.height - h, top - (h - object.height) / 2));
      return x + left >= hitLeft && x + left <= hitLeft + w &&
        y + top >= hitTop && y + top <= hitTop + h;
    },
  });
}

export function drawingInterruptions(scene, finish) {
  const canvas = scene.game.canvas;
  const hidden = () => {
    if (document.hidden) finish();
  };
  canvas.addEventListener("touchcancel", finish);
  canvas.addEventListener("pointercancel", finish);
  globalThis.addEventListener("blur", finish);
  document.addEventListener("visibilitychange", hidden);
  scene.events.once("shutdown", () => {
    canvas.removeEventListener("touchcancel", finish);
    canvas.removeEventListener("pointercancel", finish);
    globalThis.removeEventListener("blur", finish);
    document.removeEventListener("visibilitychange", hidden);
  });
}
