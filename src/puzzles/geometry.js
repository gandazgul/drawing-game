export const SAIL = [{ x: 600, y: 190 }, { x: 845, y: 480 }, { x: 600, y: 480 }, { x: 600, y: 190 }];
export const PATCH = { x: 600, y: 495, rx: 168, ry: 70 };
export const TRACE_RADIUS = 12;
export const TRACE_WIDTH = 9;
export const BRUSH_RADIUS = 30;

export function distanceToSegment(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length)) : 0;
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}

export function traceSamples(points = SAIL, spacing = 3) {
  return points.slice(1).flatMap((b, edge) => {
    const a = points[edge];
    const count = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / spacing);
    return Array.from({ length: count + 1 }, (_, i) => ({
      x: a.x + (b.x - a.x) * i / count,
      y: a.y + (b.y - a.y) * i / count,
      edge,
    }));
  });
}

export function patchSamples(ellipse = PATCH, spacing = 4) {
  const samples = [];
  for (let x = ellipse.x - ellipse.rx; x <= ellipse.x + ellipse.rx; x += spacing) {
    for (let y = ellipse.y - ellipse.ry; y <= ellipse.y + ellipse.ry; y += spacing) {
      if (insideEllipse({ x, y }, ellipse)) samples.push({ x, y });
    }
  }
  // Include the perimeter too: an interior grid alone can miss an unpainted rim.
  const count = Math.ceil(2 * Math.PI * Math.max(ellipse.rx, ellipse.ry) / spacing);
  for (let i = 0; i < count; i++) {
    const angle = i / count * Math.PI * 2;
    samples.push({
      x: ellipse.x + Math.cos(angle) * ellipse.rx,
      y: ellipse.y + Math.sin(angle) * ellipse.ry,
    });
  }
  return samples;
}

// Any polyline can use this, not just a three-sided sail. Sideways wobble is
// allowed, but a stroke's ends only cover as far as its visible round brush tip.
export function traceCoverage(points = SAIL) {
  return new Coverage(traceSamples(points), TRACE_RADIUS, { endRadius: TRACE_WIDTH / 2, requiredRatio: .94 });
}

export function patchCoverage(ellipse = PATCH) {
  // A small missed area is fine; the patch need not be perfectly filled.
  return new Coverage(patchSamples(ellipse), BRUSH_RADIUS, { requiredRatio: .92 });
}

export function insideEllipse(p, ellipse = PATCH) {
  return ((p.x - ellipse.x) / ellipse.rx) ** 2 + ((p.y - ellipse.y) / ellipse.ry) ** 2 <= 1;
}

export class Coverage {
  constructor(samples, radius, { endRadius = radius, requiredRatio = 1 } = {}) {
    this.samples = samples;
    this.radius = radius;
    this.endRadius = endRadius;
    this.requiredRatio = requiredRatio;
    this.hit = new Set();
  }
  stroke(a, b = a) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const lengthSquared = dx * dx + dy * dy;
    this.samples.forEach((p, i) => {
      if (this.hit.has(i)) return;
      const projection = (p.x - a.x) * dx + (p.y - a.y) * dy;
      const beyondTip = !lengthSquared || projection < 0 || projection > lengthSquared;
      if (distanceToSegment(p, a, b) <= (beyondTip ? this.endRadius : this.radius)) this.hit.add(i);
    });
    return this.ratio;
  }
  restore(strokes) {
    for (const stroke of strokes) stroke.forEach((p, i) => this.stroke(stroke[i - 1] ?? p, p));
    return this;
  }
  get ratio() {
    return this.samples.length ? this.hit.size / this.samples.length : 0;
  }
  complete({ strokeActive = false } = {}) {
    return !strokeActive && this.samples.length > 0 && this.ratio >= this.requiredRatio;
  }
}
