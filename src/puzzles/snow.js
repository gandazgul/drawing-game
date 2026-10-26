// Pure progress/placement rules shared by gameplay and regression tests.
export const MATERIALS = ["twigs", "carrot", "rocks"];
export const SLIDE_TARGETS = [.34, .61, .82];
export const SLIDE_TOLERANCE = .13;
export const materialsFound = (raw) => MATERIALS.filter((id) => Array.isArray(raw) && raw.includes(id));
export const snowUnlocked = (raw, unlocked = false) => unlocked === true || materialsFound(raw).length === 3;
export const nextMaterial = (raw) => MATERIALS.find((id) => !materialsFound(raw).includes(id));
export function slidePower(milliseconds) {
  const t = Math.max(0, milliseconds) % 3400 / 1700;
  return t <= 1 ? t : 2 - t;
}
export const slideHits = (power, material) =>
  Number.isFinite(power) && MATERIALS.includes(material) &&
  Math.abs(power - SLIDE_TARGETS[MATERIALS.indexOf(material)]) <= SLIDE_TOLERANCE;

export const SNOW_PARTS = {
  base: { frame: "base", width: 250, x: 490, y: 500, depth: 2, label: "Bottom" },
  body: { frame: "body", width: 205, x: 490, y: 390, depth: 3, label: "Middle" },
  head: { frame: "head", width: 170, x: 490, y: 285, depth: 4, label: "Head" },
  twig: { frame: "twig", width: 135, depth: 5, label: "Twigs" },
  carrot: { frame: "carrot", width: 82, depth: 6, label: "Nose" },
  rock: { frame: "rock", width: 28, depth: 7, label: "Rocks" },
  flower: { texture: "flowerVase", width: 55, depth: 8, label: "Flowers" },
  butterfly: { texture: "heartButterfly", width: 65, depth: 8, label: "Butterfly" },
};
export const BODY_PARTS = ["base", "body", "head"];
export const MAX_PIECES = 60;
export function validSnowPieces(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  return raw.slice(0, MAX_PIECES).filter((p) => {
    if (!p || !Object.hasOwn(SNOW_PARTS, p.kind) || !Number.isFinite(p.x) || !Number.isFinite(p.y)) {
      return false;
    }
    if (BODY_PARTS.includes(p.kind)) {
      if (seen.has(p.kind)) return false;
      seen.add(p.kind);
    }
    return true;
  }).map((p) => {
    const part = SNOW_PARTS[p.kind];
    return {
      kind: p.kind,
      x: part.x ?? Math.max(170, Math.min(790, p.x)),
      y: part.y ?? Math.max(190, Math.min(610, p.y)),
      flip: p.kind === "twig" && p.x > 490,
    };
  });
}
export function placeSnowPiece(raw, kind, x, y, replacing = -1) {
  const pieces = validSnowPieces(raw);
  if (!Object.hasOwn(SNOW_PARTS, kind) || !Number.isFinite(x) || !Number.isFinite(y)) return pieces;
  const next = pieces.filter((p, i) => i !== replacing && !(BODY_PARTS.includes(kind) && p.kind === kind));
  if (next.length >= MAX_PIECES) return pieces;
  return validSnowPieces([...next, { kind, x, y }]);
}
export const snowmanReady = (raw) => {
  const pieces = validSnowPieces(raw);
  return BODY_PARTS.every((kind) => pieces.some((p) => p.kind === kind));
};
