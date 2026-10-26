import { store } from "@caper/engine";
import { COLORS, INK, line } from "./art.js";
import { PATCH, SAIL } from "./puzzles/geometry.js";
import { drawPatch } from "./puzzles/patch-art.js";
import { validStrokes } from "./state.js";
import { trackArt } from "./WorldEditor.js";

export class BoatView {
  constructor(scene, x, y, scale = .65) {
    this.scene = scene;
    this.root = scene.add.container(x, y).setDepth(4).setScale(scale);
    trackArt(scene, "boat-art", this.root);
    this.base = scene.add.image(0, 0, "boat").setDisplaySize(600, 600);
    this.ink = scene.add.graphics();
    this.patchTexture = scene.textures.exists("boat-patch")
      ? scene.textures.get("boat-patch")
      : scene.textures.createCanvas("boat-patch", PATCH.rx * 2, PATCH.ry * 2);
    this.patch = scene.add.image(0, 178, "boat-patch").setDisplaySize(86, 36);
    this.patchOutline = scene.add.graphics();
    this.patchOutline.lineStyle(3, INK).strokeEllipse(0, 178, 86, 36);
    this.root.add([this.base, this.ink, this.patch, this.patchOutline]);
    this.refresh();
  }
  refresh() {
    const g = this.ink;
    g.clear();
    const points = SAIL.slice(0, 3).map((p) => ({ x: p.x - 600, y: p.y - 425 }));
    if (store.get("sailDone")) {
      g.fillStyle(0xfff3b0).fillPoints(points, true);
      const strokes = validStrokes(store.get("sailStrokes"));
      for (const stroke of strokes) {
        stroke.forEach((p, i) => {
          const a = stroke[i - 1] ?? p;
          line(
            g,
            { x: a.x - 600, y: a.y - 425 },
            { x: p.x - 600, y: p.y - 425 },
            COLORS.includes(p.c) ? p.c : INK,
            7,
          );
        });
      }
      if (!strokes.length) g.lineStyle(7, INK).strokePoints(points, true);
    } else {
      g.lineStyle(4, INK, .45).strokePoints(points, true);
    }
    const patched = store.get("patchDone") === true;
    this.patch.setVisible(patched);
    this.patchOutline.setVisible(patched);
    if (!patched) {
      g.fillStyle(0x234d59).fillEllipse(0, 178, 78, 36);
      g.lineStyle(4, INK).strokeEllipse(0, 178, 78, 36);
    } else {
      drawPatch(this.patchTexture.context, validStrokes(store.get("patchStrokes")), COLORS, INK);
      this.patchTexture.refresh();
    }
  }
  showPassengers(sprites, seats, scale) {
    this.clearPassengers();
    this.passengers = sprites.map((sprite, i) => {
      const person = this.scene.add.image(seats[i].x, seats[i].y, sprite.texture.key, sprite.frame.name)
        .setOrigin(sprite.originX, sprite.originY).setScale(scale).setFlipX(this.root.scaleX < 0);
      this.root.add(person);
      return person;
    });
    // The original hull sits in front of their feet, so they are inside the boat.
    const source = this.base.texture.getSourceImage();
    this.frontHull = this.scene.add.image(0, 0, "boat").setDisplaySize(600, 600)
      .setCrop(0, source.height * .73, source.width, source.height * .27);
    this.root.add(this.frontHull);
    this.root.bringToTop(this.patch);
    this.root.bringToTop(this.patchOutline);
  }
  clearPassengers() {
    for (const sprite of this.passengers ?? []) sprite.destroy();
    this.passengers = [];
    this.frontHull?.destroy();
    this.frontHull = null;
  }
}
