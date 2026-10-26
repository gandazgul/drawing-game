// Caper owns movement, turning, interruption and idle timing. These are just
// registered drawings: four walk phases per direction and a quiet front blink.
export const SISTER_FRAME = { width: 384, height: 512, ground: 500 };
export const SISTER_ATLASES = {
  keila: new URL("../assets/game/keila-animations-v1.webp", import.meta.url).href,
  olivia: new URL("../assets/game/olivia-animations-v1.webp", import.meta.url).href,
};
const directions = ["front", "side", "back"];
const key = (id, suffix) => `character_${id}_${suffix}`;

export function sisterAnimationConfig(id, reducedMotion = false) {
  const animationSet = {}, animationScales = {}, animationOrigins = {};
  for (const direction of directions) {
    const entry = { still: key(id, `${direction}_still`) };
    if (!reducedMotion) entry.walk = key(id, `${direction}_walk`);
    if (!reducedMotion && direction === "front") entry.idle = key(id, "blink");
    animationSet[direction] = entry;
    for (const name of Object.values(entry)) {
      // The original puppets used 1024px-tall sources; all new cells are 512px.
      animationScales[name] = 2;
      animationOrigins[name] = { x: .5, y: SISTER_FRAME.ground / SISTER_FRAME.height };
    }
  }
  return { animationSet, animationScales, animationOrigins };
}

export function preloadSisterAnimations(scene) {
  for (const [id, url] of Object.entries(SISTER_ATLASES)) {
    scene.load.spritesheet(key(id, "atlas"), url, {
      frameWidth: SISTER_FRAME.width,
      frameHeight: SISTER_FRAME.height,
    });
  }
}

export function createSisterAnimations(scene) {
  for (const id of Object.keys(SISTER_ATLASES)) {
    const atlas = key(id, "atlas"), source = scene.textures.get(atlas).getSourceImage();
    directions.forEach((direction, row) => {
      const stillIndex = [12, 14, 15][row];
      const texture = scene.textures.addImage(key(id, `${direction}_still`), source);
      texture.get().setSize(
        SISTER_FRAME.width,
        SISTER_FRAME.height,
        stillIndex % 4 * SISTER_FRAME.width,
        Math.floor(stillIndex / 4) * SISTER_FRAME.height,
      );
      scene.anims.create({
        key: key(id, `${direction}_walk`),
        frames: scene.anims.generateFrameNumbers(atlas, { start: row * 4, end: row * 4 + 3 }),
        frameRate: id === "keila" ? 6 : 5.5,
        repeat: -1,
      });
    });
    scene.anims.create({
      key: key(id, "blink"),
      frames: [{ key: atlas, frame: 12, duration: 100 }, { key: atlas, frame: 13, duration: 110 }, {
        key: atlas,
        frame: 12,
        duration: 100,
      }],
      frameRate: 1000,
      repeat: 0,
    });
  }
}
