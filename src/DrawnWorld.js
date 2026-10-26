import { createCritters, store } from "@gandazgul/caper-engine";
import { STICKERS } from "./stickers.js";
import { trackArt } from "./WorldEditor.js";
import { CHICKEN_PLACEMENT, chickenWalk } from "./chicken.js";

export function drawing(scene, key, x, y, width, depth = 2) {
  if (scene.textures.exists(`${key}Mask`)) key = stickerTexture(scene, key);
  const image = scene.add.image(x, y, key).setOrigin(0.5, 1).setDepth(depth);
  image.setScale(width / image.width);
  if (scene.artCounts) {
    scene.artCounts[key] = (scene.artCounts[key] ?? 0) + 1;
    trackArt(scene, `${key}-${scene.artCounts[key]}`, image);
  }
  return image;
}

export function drawnCritters(scene, specs) {
  const reduced = scene.registry.get("reducedMotion");
  const first = scene.critterEntries?.length ?? 0;
  createCritters(
    scene,
    specs.map(([atlas, x, y, width, type = "butterfly"]) => {
      const source = scene.textures.get(atlas).getSourceImage();
      const height = (width * source.height) / source.width;
      const chicken = atlas === "bird";
      const ampX = chicken ? 80 : 18,
        ampY = chicken ? 0 : 9;
      return {
        atlas: scene.textures.exists(`${atlas}Mask`) ? stickerTexture(scene, atlas) : atlas,
        x: Math.max(width / 2 + 24, Math.min(scene.scale.width - width / 2 - ampX - 24, x)),
        y: Math.max(height + ampY + 24, Math.min(scene.scale.height - 24, y)),
        scale: width / source.width,
        // The makers clarified the drawing's orientation. Rotate around its top
        // edge so its on-screen bounds still sit above the saved anchor.
        ...(atlas === "tealButterfly" ? { rotation: 180, originY: 0 } : {}),
        type: reduced || chicken ? "ground" : type,
        ...(chicken ? { placementVersion: CHICKEN_PLACEMENT } : {}),
        depth: 4,
        ampX,
        ampY,
      };
    }),
  );
  if (!reduced) {
    for (const { spec, sprite } of scene.critterEntries.slice(first)) {
      if (spec.placementVersion !== CHICKEN_PLACEMENT) continue;
      // Store on Caper's own slot so its editor can pause this walk too.
      sprite._critterTween = scene.tweens.add(chickenWalk(sprite));
      scene.events.once("shutdown", () => sprite._critterTween?.stop());
    }
  }
}

// Stationary fruit belongs to the tree canopy, not the collectible/puzzle layer.
// Use drawing() so each piece stays independently movable in the world editor.
export function treeFruit(scene, placements) {
  return placements.map(([x, y, width, angle = 0]) =>
    drawing(scene, "pinkFruit", x, y, width, 1).setAngle(angle),
  );
}

export function stickerTexture(scene, art) {
  if (!scene.textures.exists(`${art}Mask`)) return art;
  if (["bee", "mouse", "heartButterfly"].includes(art)) return art;
  const key = `${art}-paper-sticker`;
  if (scene.textures.exists(key)) return key;
  const source = scene.textures.get(art).getSourceImage();
  const texture = scene.textures.createCanvas(key, source.width, source.height);
  const context = texture.getContext();
  // Source-derived silhouette, not a rectangular card: opaque paper supports
  // the faint pencil/crayon while all original colored marks stay on top.
  context.drawImage(scene.textures.get(`${art}Mask`).getSourceImage(), 0, 0, source.width, source.height);
  context.globalCompositeOperation = "source-in";
  context.fillStyle = "#fff3cd";
  context.fillRect(0, 0, source.width, source.height);
  context.globalCompositeOperation = "source-over";
  context.drawImage(source, 0, 0);
  // Faint scanned pencil needs more ink density at sticker size. Reapply the
  // same pixels, never replace the child's lines or original color choices.
  context.drawImage(source, 0, 0);
  context.drawImage(source, 0, 0);
  texture.refresh();
  return key;
}

export function hiddenStickers(scene) {
  for (const sticker of STICKERS.filter((s) => s.scene === scene.scene.key && s.x !== undefined)) {
    if (store.has("stickers", sticker.id)) continue;
    const image = drawing(scene, stickerTexture(scene, sticker.art), sticker.x, sticker.y, sticker.width, 8);
    // A generous target without a visible badge that gives away the hiding place.
    const target = scene.add
      .zone(
        sticker.x,
        sticker.y - image.displayHeight / 2,
        Math.max(70, image.displayWidth),
        Math.max(70, image.displayHeight),
      )
      .setDepth(9)
      .setInteractive({ useHandCursor: true });
    target.on("pointerdown", (_p, _x, _y, event) => {
      event.stopPropagation();
      if (scene.blocked || store.has("stickers", sticker.id)) return;
      if (sticker.room !== undefined && scene.currentRoom !== sticker.room) {
        scene.goToRoom(sticker.room, sticker.x);
        return;
      }
      store.addTo("stickers", sticker.id);
      scene.ui.collectSticker(scene, image, sticker.name);
      image.destroy();
      target.destroy();
    });
  }
}

export function villageArt(scene) {
  drawing(scene, "innExterior", 262, 453, 350);
  drawing(scene, "house", 994, 564, 395);
  drawing(scene, "cake", 505, 554, 112);
  drawing(scene, "birthdayFriend", 612, 553, 92);
  drawing(scene, "birthdayFlowers", 411, 550, 100);
  drawing(scene, "flowers", 75, 695, 125, 3);
  drawing(scene, "sunflower", 1140, 693, 66, 3);
  drawing(scene, "flowerVase", 327, 762, 91);
  drawing(scene, "plant", 672, 788, 86);
  // Keep the editor's exact anchors and scales, without the generic edge clamping.
  createCritters(
    scene,
    [
      { x: 46, y: 342, atlas: "bee", scale: 0.10848400556328233, type: "butterfly" },
      { x: 966, y: 135, atlas: "heartButterfly", scale: 0.1717948717948718, type: "butterfly" },
      { x: 329, y: 548, atlas: stickerTexture(scene, "bug"), scale: 0.06351351351351352, type: "ground" },
      {
        x: 518,
        y: 141,
        atlas: "tealButterfly",
        scale: 0.052924791086350974,
        type: "butterfly",
        rotation: 180,
        originY: 0,
      },
    ].map((spec) => ({
      ...spec,
      type: scene.registry.get("reducedMotion") ? "ground" : spec.type,
      ampX: 18,
      ampY: 9,
      depth: 4,
    })),
  );
  hiddenStickers(scene);
}
