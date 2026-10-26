import { store } from "@gandazgul/caper-engine";
import { PuzzleScene } from "./PuzzleScene.js";
import { drawingInterruptions } from "../touch-input.js";
import { distanceToSegment } from "../puzzles/geometry.js";
import { PICTURE_BOX, PICTURE_PARTS, pictureUncovered, validIds } from "../puzzles/workshop.js";
import { DIALOGUE } from "../dialogue.js";

export class WorkshopPicture extends PuzzleScene {
  constructor() {
    super("WorkshopPicture");
  }
  create() {
    if (!store.get("forestTrailDone")) return this.scene.start("ForestTrail");
    if (store.get("studioPictureDone")) return this.scene.start("StudioGallery");
    this.drag = null;
    this.selection = null;
    this.setup(
      "Bounka's picture",
      "A picture under the scribbles",
      "Rub away the scribbles.",
      "StudioGallery",
    );
    this.phase = store.get("studioPictureUncovered") ? "assemble" : "erase";
    this.erased = validIds(store.get("studioPictureErased"), 224);
    this.placed = validIds(store.get("studioPicturePlaced"), 6);
    this.selected = null;
    this.previous = null;
    const source = this.textures.get("house").getSourceImage();
    const texture = this.textures.exists("studioPictureParts")
      ? this.textures.get("studioPictureParts")
      : this.textures.addImage("studioPictureParts", source);
    this.pieces = PICTURE_PARTS.map((p) => {
      const frame = `part-${p.id}`,
        s = p.source;
      if (!texture.has(frame)) {
        texture.add(
          frame,
          0,
          Math.round(s.x * source.width),
          Math.round(s.y * source.height),
          Math.round(s.w * source.width),
          Math.round(s.h * source.height),
        );
      }
      this.add.rectangle(p.x, p.y, p.w, p.h, 0xfff9e9).setStrokeStyle(2, 0x66418d);
      this.add.image(p.x, p.y, "studioPictureParts", frame).setDisplaySize(p.w, p.h).setAlpha(0.22);
      const fitted = this.phase === "erase" || this.placed.has(p.id),
        at = fitted ? p : p.home;
      const size = fitted ? 1 : 0.7;
      const image = this.add
        .image(at.x, at.y, "studioPictureParts", frame)
        .setDisplaySize(p.w * size, p.h * size)
        .setDepth(3);
      return { ...p, image };
    });
    this.selection = this.add.graphics().setDepth(5);
    this.covers = [];
    if (this.phase === "erase") {
      const { x, y, w, h } = PICTURE_BOX,
        cw = w / 16,
        ch = h / 14;
      for (let id = 0; id < 224; id++) {
        const cx = x + ((id % 16) + 0.5) * cw,
          cy = y + (Math.floor(id / 16) + 0.5) * ch;
        const g = this.add.graphics().setPosition(cx, cy).setDepth(6).setVisible(!this.erased.has(id));
        g.fillStyle(0xb397bb).fillRect(-cw / 2 - 1, -ch / 2 - 1, cw + 2, ch + 2);
        g.lineStyle(3, 0x7250a0).lineBetween(-cw / 2, ch / 3, cw / 2, -ch / 3);
        this.covers.push({ id, x: cx, y: cy, g });
      }
      if (pictureUncovered([...this.erased])) this.reveal();
    } else this.ready();
    this.input.on("pointerdown", (p) => this.down(p));
    this.input.on("pointermove", (p) => this.move(p));
    this.input.on("pointerup", (p) => this.up(p));
    this.input.on("pointerupoutside", () => this.cancel());
    drawingInterruptions(this, () => this.cancel());
  }
  rub(p) {
    for (const c of this.covers) {
      if (distanceToSegment(c, this.previous ?? p, p) < 52) {
        this.erased.add(c.id);
        c.g.setVisible(false);
      }
    }
    this.previous = p;
    store.set("studioPictureErased", [...this.erased]);
    if (pictureUncovered([...this.erased])) this.reveal();
  }
  reveal() {
    this.phase = "reveal";
    this.cancel();
    this.ui.setBusy(true);
    this.instructions.setText("There's our house! Watch the pieces...");
    const reduced = this.registry.get("reducedMotion");
    this.tweens.add({
      targets: this.covers.map((c) => c.g),
      alpha: 0,
      duration: reduced ? 1 : 400,
      onComplete: () => {
        store.set("studioPictureUncovered", true);
        let remaining = this.pieces.length;
        for (const p of this.pieces) {
          this.tweens.add({
            targets: p.image,
            x: p.home.x,
            y: p.home.y,
            displayWidth: p.w * 0.7,
            displayHeight: p.h * 0.7,
            duration: reduced ? 1 : 650,
            delay: reduced ? 0 : 250 + p.id * 60,
            ease: "Cubic.Out",
            onComplete: () => {
              if (--remaining === 0) {
                this.ui.setBusy(false);
                this.ready();
              }
            },
          });
        }
      },
    });
  }
  ready() {
    this.phase = "assemble";
    this.instructions.setText("Drag a piece into place, or tap it then its matching space.");
    this.feedback.setText(`${this.placed.size} of 6 picture pieces fitted`);
    if (this.placed.size === 6) {
      this.phase = "complete";
      store.set("studioPictureDone", true);
      this.feedback.setText("Our picture is whole again!");
      this.ui.setBusy(true);
      this.time.delayedCall(this.registry.get("reducedMotion") ? 80 : 750, () => {
        this.ui.setBusy(false);
        this.scene.start("StudioGallery");
      });
    }
  }
  down(pointer) {
    if (this.blocked || this.pointerId != null) return;
    const p = { x: pointer.worldX, y: pointer.worldY };
    if (this.phase === "erase") {
      this.pointerId = pointer.id;
      this.previous = null;
      this.rub(p);
      return;
    }
    if (this.phase !== "assemble") return;
    const chosen = this.pieces[this.selected];
    if (chosen && Math.abs(p.x - chosen.x) < chosen.w / 2 && Math.abs(p.y - chosen.y) < chosen.h / 2) {
      return this.place(chosen);
    }
    const piece = this.pieces.find((s) => !this.placed.has(s.id) && s.image.getBounds().contains(p.x, p.y));
    if (!piece) return;
    this.selected = piece.id;
    this.drag = { piece, id: pointer.id, start: p, moved: false };
    this.highlight(piece);
  }
  move(pointer) {
    if (this.blocked || !pointer.isDown) return;
    const p = { x: pointer.worldX, y: pointer.worldY };
    if (this.phase === "erase" && pointer.id === this.pointerId) return this.rub(p);
    if (!this.drag || this.drag.id !== pointer.id) return;
    const d = this.drag;
    if (Math.hypot(p.x - d.start.x, p.y - d.start.y) > 8) d.moved = true;
    if (d.moved) {
      d.piece.image.setPosition(p.x, p.y).setDisplaySize(d.piece.w, d.piece.h);
      this.highlight(d.piece);
    }
  }
  up(pointer) {
    if (pointer.id === this.pointerId) {
      this.pointerId = null;
      this.previous = null;
    }
    if (!this.drag || this.drag.id !== pointer.id) return;
    const { piece, moved } = this.drag;
    this.drag = null;
    if (!moved) return;
    if (Math.hypot(piece.image.x - piece.x, piece.image.y - piece.y) < 75) this.place(piece);
    else {
      this.home(piece);
      this.highlight(piece);
    }
  }
  highlight(p) {
    const b = p.image.getBounds();
    this.selection
      .clear()
      .lineStyle(5, 0x66418d)
      .strokeRect(b.x - 3, b.y - 3, b.width + 6, b.height + 6);
  }
  home(p) {
    p.image.setPosition(p.home.x, p.home.y).setDisplaySize(p.w * 0.7, p.h * 0.7);
  }
  place(p) {
    this.drag = null;
    this.selected = null;
    this.selection.clear();
    p.image.setPosition(p.x, p.y).setDisplaySize(p.w, p.h);
    this.placed.add(p.id);
    store.set("studioPicturePlaced", [...this.placed]);
    this.ready();
  }
  cancel() {
    if (this.drag) this.home(this.drag.piece);
    this.drag = null;
    this.selected = null;
    this.pointerId = null;
    this.previous = null;
    this.selection?.clear();
  }
  setBlocked(value) {
    this.cancel();
    super.setBlocked(value);
  }
  hint() {
    this.ui.dialogue(DIALOGUE.studioPictureHelp);
  }
}
