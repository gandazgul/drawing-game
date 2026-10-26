// The authors have identified this drawing as a chicken. Keep the legacy
// "bird" asset/save IDs, but never give it a flight path.
export const CHICKEN_PLACEMENT = "chicken-ground-v1";
export const CHICKEN_WALKS = {
  Pond: ["bird", 360, 749, 68, "ground"],
  Port: ["bird", 125, 586, 63, "ground"],
  BirthdayYard: ["bird", 700, 675, 75, "ground"],
};

export function chickenWalk(sprite) {
  return {
    targets: sprite,
    x: sprite.x + 80,
    // Feet stay on the same patch of ground: no vertical flight/bob tween.
    duration: 4000,
    hold: 900,
    repeatDelay: 900,
    yoyo: true,
    flipX: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  };
}
