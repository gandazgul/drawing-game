import { store } from "@gandazgul/caper-engine";
import { PuzzleScene } from "./PuzzleScene.js";
import { drawing } from "../DrawnWorld.js";
import { DIALOGUE } from "../dialogue.js";
import { finishTask } from "../village-progress.js";
import { tasks } from "../VillageFlow.js";
import { drawingInterruptions } from "../touch-input.js";
import { distanceToSegment } from "../puzzles/geometry.js";
import { erasedCells, placedStairs, STAIR_COVER, STAIR_PIECES, stairsUncovered } from "../puzzles/stairs.js";

export class StairRepair extends PuzzleScene {
  constructor() {
    super("StairRepair");
  }
  create() {
    if (tasks().includes("stairs")) return this.scene.start("House");
    // UI binding calls setBlocked; discard references from a previous visit first.
    this.drag = null;
    this.selection = null;
    this.setup(
      "Blue cat's stairs",
      "A way upstairs",
      "Rub away the scribbles to uncover every step.",
      "House",
    );
    this.phase = tasks().includes("clue") ? "assemble" : "erase";
    this.selected = null;
    this.drag = null;
    this.previous = null;
    this.erased = erasedCells(store.get("village_clue"));
    this.placed = placedStairs(store.get("village_stairs"));
    drawing(this, "blueCat", 190, 235, 90);
    const source = this.textures.get("houseRoomFinished").getSourceImage();
    // Phaser's first added frame becomes its default. Keep puzzle frames on a
    // separate texture so the room background continues to use the whole image.
    const texture = this.textures.exists("houseStairPieces")
      ? this.textures.get("houseStairPieces")
      : this.textures.addImage("houseStairPieces", source);
    this.pieces = STAIR_PIECES.map((p) => {
      const frame = `step-${p.id}`;
      if (!texture.has(frame)) {
        texture.add(
          frame,
          0,
          Math.round((p.source.x * source.width) / 1200),
          Math.round((p.source.y * source.height) / 800),
          Math.round((p.source.w * source.width) / 1200),
          Math.round((p.source.h * source.height) / 800),
        );
      }
      const ghost = this.add
        .image(p.target.x, p.target.y, "houseStairPieces", frame)
        .setDisplaySize(p.w, p.h)
        .setAlpha(0.16);
      const outline = this.add.rectangle(p.target.x, p.target.y, p.w, p.h).setStrokeStyle(2, 0x66418d, 0.7);
      const at = this.phase === "erase" || this.placed.has(p.id) ? p.target : p.home;
      const image = this.add
        .image(at.x, at.y, "houseStairPieces", frame)
        .setDisplaySize(p.w, p.h)
        .setDepth(3);
      return { ...p, image, ghost, outline };
    });
    this.selection = this.add.graphics().setDepth(4);
    this.covers = [];
    if (this.phase === "erase") this.makeCover();
    else this.readyToAssemble();
    this.input.on("pointerdown", (p) => this.down(p));
    this.input.on("pointermove", (p) => this.move(p));
    this.input.on("pointerup", (p) => this.up(p));
    this.input.on("pointerupoutside", () => this.cancelGesture());
    drawingInterruptions(this, () => this.cancelGesture());
    if (this.phase === "erase" && stairsUncovered([...this.erased])) this.reveal();
  }
  makeCover() {
    const { x, y, w, h, cols, rows } = STAIR_COVER;
    const cw = w / cols,
      ch = h / rows;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const id = row * cols + col,
          cx = x + (col + 0.5) * cw,
          cy = y + (row + 0.5) * ch;
        const g = this.add.graphics().setPosition(cx, cy).setDepth(6).setVisible(!this.erased.has(id));
        g.fillStyle(0xb397bb).fillRect(-cw / 2 - 1, -ch / 2 - 1, cw + 2, ch + 2);
        g.lineStyle(3, 0x7250a0, 0.65).lineBetween(-cw / 2, ch / 3, cw / 2, -ch / 3);
        this.covers.push({ id, x: cx, y: cy, g });
      }
    }
    this.feedback.setText("What's hiding under Bounka's scribbles?");
  }
  rub(p) {
    const a = this.previous ?? p;
    for (const cell of this.covers) {
      if (distanceToSegment(cell, a, p) < 43) {
        this.erased.add(cell.id);
        cell.g.setVisible(false);
      }
    }
    this.previous = { x: p.x, y: p.y };
    store.set("village_clue", [...this.erased]);
    if (stairsUncovered([...this.erased])) this.reveal();
  }
  reveal() {
    this.phase = "reveal";
    this.cancelGesture();
    this.ui.setBusy(true);
    this.instructions.setText("There are all the steps!");
    this.ui.status("Watch the steps uncover and mix themselves up.");
    this.feedback.setText("");
    const reduced = this.registry.get("reducedMotion");
    this.tweens.add({
      targets: this.covers.map((c) => c.g),
      alpha: 0,
      duration: reduced ? 1 : 450,
      onComplete: () => {
        store.set("villageTasks", finishTask(tasks(), "clue"));
        this.time.delayedCall(reduced ? 1 : 350, () => this.scramble());
      },
    });
  }
  scramble() {
    this.phase = "scramble";
    this.instructions.setText("Let's put the steps back together.");
    const reduced = this.registry.get("reducedMotion");
    let remaining = 6;
    for (const p of this.pieces) {
      const at = this.placed.has(p.id) ? p.target : p.home;
      this.tweens.add({
        targets: p.image,
        x: at.x,
        y: at.y,
        duration: reduced ? 1 : 650,
        delay: reduced ? 0 : p.id * 65,
        ease: "Cubic.Out",
        onComplete: () => {
          if (--remaining === 0) {
            this.ui.setBusy(false);
            this.readyToAssemble();
          }
        },
      });
    }
  }
  readyToAssemble() {
    this.phase = "assemble";
    this.instructions.setText("Drag each step into place, or tap a piece then its space.");
    this.ui.status("Drag each step into place, or tap a piece then its space.");
    this.feedback.setText(`${this.placed.size} of 6 steps fitted`);
    if (this.placed.size === 6) this.complete();
  }
  down(pointer) {
    if (this.blocked) return;
    const p = { x: pointer.worldX, y: pointer.worldY };
    if (this.phase === "erase") {
      this.pointerId = pointer.id;
      this.previous = null;
      this.rub(p);
      return;
    }
    if (this.phase !== "assemble") return;
    if (this.selected !== null) {
      const chosen = this.pieces[this.selected];
      if (
        Math.abs(p.x - chosen.target.x) < chosen.w / 2 + 14 &&
        Math.abs(p.y - chosen.target.y) < chosen.h / 2 + 14
      )
        return this.place(chosen);
    }
    const piece = this.pieces.find(
      (s) =>
        !this.placed.has(s.id) &&
        Math.abs(p.x - s.image.x) <= s.w / 2 + 5 &&
        Math.abs(p.y - s.image.y) <= s.h / 2 + 5,
    );
    if (!piece) return;
    this.selected = piece.id;
    this.drag = {
      id: pointer.id,
      piece,
      start: p,
      dx: p.x - piece.image.x,
      dy: p.y - piece.image.y,
      moved: false,
    };
    this.highlight(piece);
  }
  move(pointer) {
    if (this.blocked) return;
    const p = { x: pointer.worldX, y: pointer.worldY };
    if (this.phase === "erase" && pointer.isDown && pointer.id === this.pointerId) return this.rub(p);
    if (!this.drag || this.drag.id !== pointer.id || !pointer.isDown) return;
    const d = this.drag;
    if (Math.hypot(p.x - d.start.x, p.y - d.start.y) > 8) d.moved = true;
    if (d.moved) {
      d.piece.image.setPosition(p.x - d.dx, p.y - d.dy);
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
    if (Math.hypot(piece.image.x - piece.target.x, piece.image.y - piece.target.y) < 65) this.place(piece);
    else {
      piece.image.setPosition(piece.home.x, piece.home.y);
      this.highlight(piece);
    }
  }
  highlight(piece) {
    this.selection
      .clear()
      .lineStyle(5, 0x66418d)
      .strokeRect(piece.image.x - piece.w / 2 - 3, piece.image.y - piece.h / 2 - 3, piece.w + 6, piece.h + 6);
  }
  place(piece) {
    this.drag = null;
    this.selected = null;
    this.selection.clear();
    piece.image.setPosition(piece.target.x, piece.target.y);
    this.placed.add(piece.id);
    store.set("village_stairs", [...this.placed]);
    this.readyToAssemble();
  }
  cancelGesture() {
    if (this.drag) this.drag.piece.image.setPosition(this.drag.piece.home.x, this.drag.piece.home.y);
    this.drag = null;
    this.pointerId = null;
    this.previous = null;
    this.selected = null;
    this.selection?.clear();
  }
  setBlocked(value) {
    this.cancelGesture();
    super.setBlocked(value);
  }
  complete() {
    this.phase = "complete";
    store.set("villageTasks", finishTask(tasks(), "stairs"));
    this.feedback.setText("A way upstairs!");
    this.ui.setBusy(true);
    this.time.delayedCall(this.registry.get("reducedMotion") ? 80 : 750, () => {
      this.ui.setBusy(false);
      this.scene.start("House", { stairsCompleted: true });
    });
  }
  hint() {
    this.ui.dialogue(this.phase === "erase" ? DIALOGUE.houseEraseHint : DIALOGUE.houseBuildHint);
  }
}
