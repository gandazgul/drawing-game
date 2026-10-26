// Each lane stays in painted water, away from shore and the boat/mermaid targets.
// x/y are center anchors; dx/dy are the full outward journey, then they turn back.
export const WATER_CREATURES = {
  Harbor: [
    { art: "axolotlBlue", x: 275, y: 335, width: 115, dx: 145, dy: 12 },
    { art: "axolotlPink", x: 630, y: 440, width: 126, dx: -130, dy: 14 },
    { art: "seaCreature", x: 180, y: 395, width: 87, dx: 110, dy: -18 },
    { art: "fish", x: 595, y: 285, width: 72, dx: 110, dy: 10 },
    { art: "fish", x: 480, y: 390, width: 63, dx: -100, dy: -10 },
  ],
  Pond: [
    { art: "axolotlBlue", x: 555, y: 345, width: 115, dx: 145, dy: 15 },
    { art: "axolotlPink", x: 1005, y: 605, width: 126, dx: -155, dy: -12 },
    { art: "seaCreature", x: 670, y: 530, width: 90, dx: 95, dy: 14 },
    { art: "fish", x: 955, y: 265, width: 72, dx: -120, dy: 8 },
    { art: "fish", x: 540, y: 445, width: 64, dx: 80, dy: 12 },
  ],
  Underwater: [
    { art: "axolotlBlue", x: 225, y: 420, width: 155, dx: 155, dy: 15 },
    { art: "axolotlPink", x: 640, y: 170, width: 160, dx: -140, dy: 20 },
    { art: "seaCreature", x: 605, y: 490, width: 120, dx: 135, dy: -20 },
    { art: "fish", x: 170, y: 160, width: 86, dx: 150, dy: 35 },
    { art: "fish", x: 400, y: 320, width: 94, dx: 150, dy: 30 },
    { art: "fish", x: 820, y: 150, width: 102, dx: 170, dy: 30 },
    { art: "fish", x: 740, y: 320, width: 110, dx: -125, dy: 25 },
  ],
};

export function swimMotion(sprite, { art, dx, dy }, index) {
  const facesRight = art === "axolotlPink";
  const flip = dx > 0 ? !facesRight : facesRight;
  sprite.setFlipX(flip);
  return {
    targets: sprite,
    x: sprite.x + dx,
    y: sprite.y + dy,
    duration: 6200 + index * 650,
    ease: "Sine.inOut",
    yoyo: true,
    repeat: -1,
    onYoyo: () => sprite.setFlipX(!flip),
    onRepeat: () => sprite.setFlipX(flip),
  };
}
