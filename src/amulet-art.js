// One set of shapes for the book-style modal and the story's assembly moment.
export const AMULET_PARTS = [
  { color: "#7250a0", path: "M80 143 18 80C-22 24 44-8 80 39 116-8 182 24 142 80Z", className: "" },
  {
    color: "#e26487",
    path: "M80 123 35 78C7 40 56 17 80 53 104 17 153 40 125 78Z",
    className: "inn-ring missing",
  },
  {
    color: "#e6ad24",
    path: "M80 104 52 76C33 52 66 40 80 67 94 40 127 52 108 76Z",
    className: "house-ring missing",
  },
  { color: "#26798c", path: "M80 89 68 77q-6-13 12-2 18-11 12 2Z", className: "missing" },
];
export const amuletSVG =
  `<svg class="heart-display" role="img" viewBox="0 0 160 160" aria-label="Outer heart frame, two missing heart rings and a missing center gem">${
    AMULET_PARTS.map((p) => `<path class="${p.className}" d="${p.path}"/>`).join("")
  }</svg>`;

export function amuletTextures(scene) {
  return AMULET_PARTS.map((part, i) => {
    const key = `amulet-part-${i}`;
    if (scene.textures.exists(key)) return key;
    const t = scene.textures.createCanvas(key, 480, 480), ctx = t.getContext();
    ctx.scale(3, 3);
    const path = new Path2D(part.path);
    ctx.lineJoin = "round";
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#fff9e9";
    ctx.stroke(path);
    ctx.lineWidth = 5;
    ctx.strokeStyle = part.color;
    ctx.stroke(path);
    if (i === 3) {
      ctx.fillStyle = part.color;
      ctx.fill(path);
    }
    t.refresh();
    return key;
  });
}
