import { BRUSH_RADIUS, PATCH } from "./geometry.js";

// Replay the original repair coordinates into a clipped, boat-sized texture.
// Drawing at the original resolution preserves strokes, overlaps and brush width.
export function drawPatch(ctx, strokes, palette, fallback) {
  const width = PATCH.rx * 2,
    height = PATCH.ry * 2;
  const cssColor = (color) => `#${color.toString(16).padStart(6, "0")}`;
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(PATCH.rx, PATCH.ry, PATCH.rx, PATCH.ry, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "#fff9e9";
  ctx.fillRect(0, 0, width, height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = BRUSH_RADIUS * 2;
  for (const stroke of strokes) {
    stroke.forEach((point, i) => {
      const previous = stroke[i - 1] ?? point;
      const x = point.x - PATCH.x + PATCH.rx;
      const y = point.y - PATCH.y + PATCH.ry;
      ctx.fillStyle = ctx.strokeStyle = cssColor(palette.includes(point.c) ? point.c : fallback);
      ctx.beginPath();
      ctx.moveTo(previous.x - PATCH.x + PATCH.rx, previous.y - PATCH.y + PATCH.ry);
      ctx.lineTo(x, y);
      ctx.stroke();
      // Canvas does not paint a zero-length line; a tap must still leave its mark.
      ctx.beginPath();
      ctx.arc(x, y, BRUSH_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  ctx.restore();
}
