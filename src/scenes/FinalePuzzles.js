import { store } from "@gandazgul/caper-engine";
import { PuzzleScene } from "./PuzzleScene.js";
import { drawPipe } from "../PipeView.js";
import { restoreWaterway, rotatePipe, waterCells, waterConnected } from "../puzzles/waterway.js";
import { PICTURE_PARTS, studioCrayon, validIds } from "../puzzles/workshop.js";
import { drawing } from "../DrawnWorld.js";
import { COLORS, font, line } from "../art.js";
import { drawingInterruptions, fingerCircle, traceTouch, worldPerPixel } from "../touch-input.js";
import { distanceToSegment } from "../puzzles/geometry.js";
import { validStrokes } from "../state.js";
import {
  canSayGoodbye,
  DECORATIONS,
  finaleCoverage,
  finaleStrokePoint,
  HEART_ROUTE,
  placeDecoration,
  TREE_ROUTE,
  treeReady,
  validDecorations,
} from "../puzzles/finale.js";
import { decoration, finaleBackdrop, savedDecorations, sparkleBurst } from "../FinaleView.js";
import { amuletTextures } from "../amulet-art.js";
import { DIALOGUE } from "../dialogue.js";

const allowed = (scene) => {
  if (store.get("studioTreehouseInvited")) return true;
  scene.scene.start("StudioWorkroom");
  return false;
};
function paperChrome(scene) {
  scene.add.rectangle(600, 63, 1200, 135, 0xfff9e9, 0.96).setDepth(20);
  scene.children.list
    .filter((child) => child.type === "Text" && child.y < 135)
    .forEach((child) => child.setDepth(21));
  scene.add.rectangle(600, 752, 1200, 96, 0xfff9e9, 0.96).setDepth(20);
  scene.feedback.setDepth(24).setStyle({ backgroundColor: "#fff9e9", padding: { x: 12, y: 6 } });
}

export class TreePipes extends PuzzleScene {
  constructor() {
    super("TreePipes");
  }
  create() {
    if (!allowed(this)) return;
    this.setup(
      "Water for our friends",
      "Fill the tree's pool",
      "Turn the pipes until every piece joins the blue spring.",
      "TreeClearing",
    );
    this.puzzle = restoreWaterway(
      store.get("endingPipes"),
      crypto.getRandomValues(new Uint32Array(1))[0],
      store.get("endingWaterDone"),
    );
    this.scheduled = false;
    drawing(this, "axolotlPink", 1040, 365, 180);
    drawing(this, "seaCreature", 1030, 550, 130);
    this.add.text(176, 165, "Spring", font).setOrigin(0.5);
    this.add.text(870, 615, "Our pool", font).setOrigin(0.5);
    this.tiles = this.puzzle.cells.map((_c, i) => {
      const x = 300 + (i % 5) * 100,
        y = 148 + Math.floor(i / 5) * 100;
      const tile = this.add.rectangle(x + 50, y + 50, 96, 96, 0xe4ede5).setStrokeStyle(2, 0x97aaa1);
      const g = this.add.graphics().setDepth(1);
      if (i) {
        tile.setInteractive({ useHandCursor: true }).on("pointerdown", (_p, _x, _y, e) => {
          e.stopPropagation();
          if (this.blocked || this.puzzle.solved) return;
          this.puzzle.cells[i] = rotatePipe(this.puzzle.cells[i]);
          this.refresh();
        });
      }
      return { g, x, y };
    });
    this.refresh();
  }
  refresh() {
    const wet = waterCells(this.puzzle.cells);
    this.puzzle.solved = waterConnected(this.puzzle.cells);
    store.set("endingPipes", structuredClone(this.puzzle));
    this.tiles.forEach(({ g, x, y }, i) =>
      drawPipe(g.clear(), x, y, this.puzzle.cells[i], wet.has(i), i === 0, i === 24),
    );
    this.feedback.setText(
      this.puzzle.solved ? "Water for all our swimming friends!" : `${wet.size} of 25 pipes reach the spring`,
    );
    if (this.puzzle.solved && !this.scheduled) {
      this.scheduled = true;
      store.set("endingWaterDone", true);
      this.ui.setBusy(true);
      this.time.delayedCall(650, () => {
        this.ui.setBusy(false);
        this.scene.start("TreeClearing", { waterArrival: true });
      });
    }
  }
  hint() {
    this.ui.dialogue(DIALOGUE.endingPipes);
  }
}

export class TreeAssembly extends PuzzleScene {
  constructor() {
    super("TreeAssembly");
  }
  create() {
    if (!allowed(this)) return;
    if (store.get("endingHouseDone")) return this.scene.start("TreeClearing");
    this.setup(
      "Our tree house",
      "A house in the branches",
      "Drag a piece into place, or tap it then its matching space.",
      "TreeClearing",
    );
    this.drag = null;
    this.selected = null;
    this.done = false;
    this.placed = validIds(store.get("endingHousePlaced"), 6);
    const source = this.textures.get("birthdayHouse").getSourceImage();
    const texture = this.textures.exists("endingHouseParts")
      ? this.textures.get("endingHouseParts")
      : this.textures.addImage("endingHouseParts", source);
    this.pieces = PICTURE_PARTS.map((p) => {
      const s = p.source,
        frame = `part-${p.id}`;
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
      this.add.image(p.x, p.y, "endingHouseParts", frame).setDisplaySize(p.w, p.h).setAlpha(0.24);
      const fitted = this.placed.has(p.id),
        at = fitted ? p : p.home;
      const image = this.add
        .image(at.x, at.y, "endingHouseParts", frame)
        .setDisplaySize(p.w * (fitted ? 1 : 0.7), p.h * (fitted ? 1 : 0.7))
        .setDepth(3);
      return { ...p, image };
    });
    this.selection = this.add.graphics().setDepth(5);
    this.input.on("pointerdown", (p) => {
      if (this.blocked || this.done || this.drag) return;
      const chosen = this.pieces[this.selected];
      if (chosen && Math.abs(p.x - chosen.x) < chosen.w / 2 && Math.abs(p.y - chosen.y) < chosen.h / 2) {
        return this.place(chosen);
      }
      const piece = this.pieces.find((s) => !this.placed.has(s.id) && s.image.getBounds().contains(p.x, p.y));
      if (!piece) return;
      this.selected = piece.id;
      this.drag = { piece, id: p.id, x: p.x, y: p.y, moved: false };
      this.highlight(piece);
    });
    this.input.on("pointermove", (p) => {
      const d = this.drag;
      if (this.blocked || !d || d.id !== p.id || !p.isDown) return;
      if (Math.hypot(p.x - d.x, p.y - d.y) > 8) d.moved = true;
      if (d.moved) {
        d.piece.image.setPosition(p.x, p.y).setDisplaySize(d.piece.w, d.piece.h);
        this.highlight(d.piece);
      }
    });
    this.input.on("pointerup", (p) => {
      const d = this.drag;
      if (!d || d.id !== p.id) return;
      this.drag = null;
      if (!d.moved) return;
      if (Math.hypot(d.piece.image.x - d.piece.x, d.piece.image.y - d.piece.y) < 80) this.place(d.piece);
      else {
        this.home(d.piece);
        this.highlight(d.piece);
      }
    });
    this.input.on("pointerupoutside", () => this.cancel());
    drawingInterruptions(this, () => this.cancel());
    this.refresh();
  }
  home(p) {
    p.image.setPosition(p.home.x, p.home.y).setDisplaySize(p.w * 0.7, p.h * 0.7);
  }
  highlight(p) {
    const b = p.image.getBounds();
    this.selection
      .clear()
      .lineStyle(5, 0x66418d)
      .strokeRect(b.x - 3, b.y - 3, b.width + 6, b.height + 6);
  }
  cancel() {
    if (this.drag) this.home(this.drag.piece);
    this.drag = null;
    this.selected = null;
    this.selection?.clear();
  }
  place(p) {
    this.drag = null;
    this.selected = null;
    this.selection.clear();
    p.image.setPosition(p.x, p.y).setDisplaySize(p.w, p.h);
    this.placed.add(p.id);
    store.set("endingHousePlaced", [...this.placed]);
    this.refresh();
  }
  refresh() {
    this.feedback.setText(`${this.placed.size} of 6 pieces fitted`);
    if (this.placed.size !== 6 || this.done) return;
    this.done = true;
    this.ui.setBusy(true);
    sparkleBurst(this, 600, 390, true);
    this.feedback.setText("Bounka is finishing the door!");
    const helper = drawing(this, "bounkaKind", 940, 628, 125, 8);
    const door = this.add
      .ellipse(620, 465, 14, 22, 0xf9df70)
      .setStrokeStyle(3, 0x26798c)
      .setDepth(7)
      .setAlpha(0);
    this.tweens.add({
      targets: helper,
      x: 780,
      duration: this.registry.get("reducedMotion") ? 100 : 900,
      onComplete: () => {
        this.tweens.add({ targets: door, alpha: 1, duration: 400 });
        sparkleBurst(this, 620, 465);
        store.set("endingHouseDone", true);
        this.ui.setBusy(false);
        this.ui.dialogue(DIALOGUE.endingDoor, () => this.scene.start("TreeClearing"));
      },
    });
  }
  setBlocked(v) {
    this.cancel();
    super.setBlocked(v);
  }
  hint() {
    this.ui.dialogue(DIALOGUE.endingHouse);
  }
}

class TreeTrace extends PuzzleScene {
  create() {
    if (!allowed(this)) return;
    this.portal = this.scene.key === "TreePortal";
    if (this.portal ? !canSayGoodbye(store.values) : !store.get("endingHouseDone")) {
      return this.scene.start("TreeClearing");
    }
    this.prefix = this.portal ? "endingHeart" : "endingRoute";
    this.path = this.portal ? HEART_ROUTE : TREE_ROUTE;
    this.done = false;
    this.current = null;
    this.pointerId = null;
    this.setup(
      this.portal ? "Our way home" : "A way into the branches",
      this.portal ? "A heart to take us home" : "Draw a way up",
      this.portal
        ? "Draw the big heart around both sisters."
        : "Follow the pale path up and across the branches.",
      "TreeClearing",
    );
    finaleBackdrop(this, store.values);
    paperChrome(this);
    this.strokes = validStrokes(store.get(`${this.prefix}Strokes`));
    this.coverage = finaleCoverage(this.path, this.strokes);
    if (this.portal) {
      drawing(this, "character_keila", 555, 540, 105, 12);
      drawing(this, "character_olivia", 670, 540, 108, 12);
      this.add.graphics().setDepth(10).fillStyle(0xfff9e9).fillPoints(HEART_ROUTE, true);
    }
    this.ink = this.add.graphics().setDepth(this.portal ? 13 : 3);
    this.paint();
    this.dots = [];
    this.tapMode = false;
    this.tapIndex = 0;
    this.assist = this.button(1000, 752, "Tap dots instead", () => {
      this.finish(false);
      this.tapMode = !this.tapMode;
      this.tapIndex = 0;
      this.showDots();
      this.assist.setText(this.tapMode ? "Draw instead" : "Tap dots instead");
    });
    this.input.on("pointerdown", (p) => {
      if (this.blocked || this.done || this.tapMode || this.pointerId != null || p.y < 140 || p.y > 725) {
        return;
      }
      this.pointerId = p.id;
      this.touch(p);
    });
    this.input.on("pointermove", (p) => {
      if (p.isDown && p.id === this.pointerId) this.touch(p);
    });
    this.input.on("pointerup", (p) => {
      if (p.id === this.pointerId) {
        this.touch(p);
        this.finish(true);
      }
    });
    this.input.on("pointerupoutside", () => this.finish(false));
    drawingInterruptions(this, () => this.finish(false));
    if (this.portal && store.get("endingPortalReady")) this.complete();
  }
  touch(p) {
    const q = traceTouch(p, this.path, worldPerPixel(this), p.wasTouch);
    if (!q || !this.path.slice(1).some((b, i) => distanceToSegment(q, this.path[i], b) < 32)) {
      this.current = null;
      return;
    }
    if (!this.current) {
      this.current = [];
      this.strokes.push(this.current);
    }
    const point = finaleStrokePoint(q, studioCrayon(store.getActiveCharacter()));
    const prev = this.current.at(-1) ?? point;
    this.current.push(point);
    this.coverage.stroke(prev, point);
    line(this.ink, prev, point, point.c, 14);
  }
  paint() {
    this.ink
      .clear()
      .lineStyle(22, 0xfff9e9)
      .strokePoints(this.path)
      .lineStyle(3, 0x66418d)
      .strokePoints(this.path);
    for (const s of this.strokes) {
      s.forEach((p, i) => line(this.ink, s[i - 1] ?? p, p, COLORS.includes(p.c) ? p.c : COLORS[0], 14));
    }
  }
  finish(check) {
    this.pointerId = null;
    this.current = null;
    if (!this.strokes) return;
    store.set(`${this.prefix}Strokes`, validStrokes(this.strokes));
    if (check && !this.done && this.coverage.complete()) this.complete();
  }
  complete() {
    if (this.done) return;
    this.done = true;
    this.assist?.setVisible(false);
    this.dots.forEach((d) => d.destroy());
    if (!this.portal) {
      store.set("endingRouteDone", true);
      this.feedback.setText("Let's walk up our drawing!");
      this.ui.setBusy(true);
      this.time.delayedCall(650, () => {
        this.ui.setBusy(false);
        this.scene.start("TreeClearing");
      });
      return;
    }
    store.set("endingPortalReady", true);
    this.instructions.setText("Our doorway is ready. Our friends will be here.");
    this.feedback.setText("Made together. Kept forever.");
    this.portalLight = this.add.graphics().setDepth(11).fillStyle(0xfff9e9).fillPoints(HEART_ROUTE, true);
    const heart = this.add
      .container(
        600,
        280,
        amuletTextures(this).map((key) => this.add.image(0, 0, key).setScale(0.19)),
      )
      .setDepth(16);
    sparkleBurst(this, 600, 390, true);
    if (!this.registry.get("reducedMotion")) {
      this.tweens.add({ targets: heart, y: 260, duration: 900, ease: "Sine.inOut", yoyo: true });
    }
    this.button(650, 752, "Back to our friends", () => this.scene.start("TreeClearing"), "#f9df70");
    if (!store.get("endingPortalSeen")) {
      this.time.delayedCall(1000, () =>
        this.ui.dialogue(DIALOGUE.endingPortal, () => store.set("endingPortalSeen", true)),
      );
    }
  }
  showDots() {
    this.dots.forEach((d) => d.destroy());
    this.dots = [];
    if (!this.tapMode || this.done) return;
    const indices = this.portal ? [0, 8, 16, 24, 32, 40, 48, 56, 64] : this.path.map((_p, i) => i);
    const i = indices[this.tapIndex],
      p = this.path[i];
    const dot = this.add.circle(p.x, p.y, 27, 0xfddf55).setStrokeStyle(3, 0x66418d).setDepth(14);
    fingerCircle(this, dot, 48);
    const label = this.add
      .text(p.x, p.y, String(this.tapIndex + 1), font)
      .setOrigin(0.5)
      .setDepth(15);
    dot.on("pointerdown", (_p, _x, _y, e) => {
      e.stopPropagation();
      if (this.blocked) return;
      if (this.tapIndex) {
        const stroke = this.path.slice(indices[this.tapIndex - 1], i + 1).map((q) => ({
          ...q,
          c: studioCrayon(store.getActiveCharacter()),
        }));
        this.strokes.push(stroke);
        this.coverage.restore([stroke]);
        this.paint();
      }
      this.tapIndex++;
      this.finish(true);
      if (!this.done) this.showDots();
    });
    this.dots.push(dot, label);
  }
  setBlocked(v) {
    this.finish(false);
    super.setBlocked(v);
  }
  leave() {
    this.finish(false);
    super.leave();
  }
  hint() {
    this.ui.dialogue(this.portal ? DIALOGUE.endingHeart : DIALOGUE.endingRoute);
  }
}
export class TreeRoute extends TreeTrace {
  constructor() {
    super("TreeRoute");
  }
}
export class TreePortal extends TreeTrace {
  constructor() {
    super("TreePortal");
  }
}

export class TreeDecorate extends PuzzleScene {
  constructor() {
    super("TreeDecorate");
  }
  create() {
    if (!allowed(this)) return;
    if (!treeReady(store.values)) return this.scene.start("TreeClearing");
    this.setup(
      "Our decorations",
      "Make it yours",
      "Drag decorations, or tap one then tap a place. There is no wrong answer.",
      "TreeClearing",
    );
    finaleBackdrop(this, { ...store.values, endingDecorations: [] });
    paperChrome(this);
    this.pieces = validDecorations(store.get("endingDecorations"));
    this.history = [];
    this.drag = null;
    this.selected = null;
    this.preview = null;
    this.rendered = [];
    this.selection = this.add.graphics().setDepth(18);
    this.add.rectangle(600, 180, 1120, 90, 0xfff9e9, 0.97).setDepth(10);
    this.tray = Object.keys(DECORATIONS).map((kind, i) => {
      const x = 150 + i * 180,
        y = 199;
      const thumbnail = decoration(this, { kind, x, y }, 12).setName("decoration-thumbnail");
      const fit = Math.min(0.65, 62 / (thumbnail.displayHeight || 62));
      thumbnail.setScale(thumbnail.scaleX * fit, thumbnail.scaleY * fit);
      this.add
        .text(x + 36, 182, DECORATIONS[kind].label, { ...font, fontSize: "21px" })
        .setOrigin(0, 0.5)
        .setDepth(12);
      return { kind, x, y: 180 };
    });
    this.undo = this.button(1050, 752, "Undo", () => {
      if (this.history.length) {
        this.pieces = this.history.pop();
        this.save();
      }
    });
    this.button(635, 752, "See our tree house", () => this.leave(), "#f9df70");
    this.redraw();
    this.input.on("pointerdown", (p) => this.begin(p));
    this.input.on("pointermove", (p) => this.move(p));
    this.input.on("pointerup", (p) => this.end(p));
    this.input.on("pointerupoutside", () => this.cancel());
    drawingInterruptions(this, () => this.cancel());
  }
  begin(p) {
    if (this.blocked || this.drag || p.y < 135 || p.y > 700) return;
    const slot = this.tray.find((s) => Math.abs(p.x - s.x - 40) < 85 && Math.abs(p.y - s.y) < 45);
    if (slot) {
      this.selected = slot.kind;
      this.selection
        .clear()
        .lineStyle(4, 0x66418d)
        .strokeRoundedRect(slot.x - 40, 137, 160, 82, 8);
      this.drag = { id: p.id, kind: slot.kind, index: -1, x: p.x, y: p.y, moved: false };
      return;
    }
    if (this.selected) {
      this.drag = { id: p.id, kind: this.selected, index: -1, x: p.x, y: p.y, moved: true };
      this.move(p);
      return;
    }
    const index = this.pieces.findLastIndex(
      (q) => Math.abs(q.x - p.x) < 45 && p.y > q.y - 95 && p.y < q.y + 20,
    );
    if (index >= 0) {
      this.drag = { id: p.id, kind: this.pieces[index].kind, index, x: p.x, y: p.y, moved: false };
    }
  }
  move(p) {
    const d = this.drag;
    if (!d || d.id !== p.id || this.blocked) return;
    if (Math.hypot(p.x - d.x, p.y - d.y) > 8) d.moved = true;
    if (!d.moved) return;
    this.preview ??= decoration(this, { kind: d.kind, x: p.x, y: p.y }, 19).setAlpha(0.8);
    this.preview.setPosition(p.x, p.y);
  }
  end(p) {
    const d = this.drag;
    if (!d || d.id !== p.id) return;
    if (d.moved && !this.blocked) {
      const before = this.pieces;
      if (p.y >= 235 && p.y <= 700) this.pieces = placeDecoration(before, d.kind, p.x, p.y, d.index);
      else if (p.y < 225 && d.index >= 0) this.pieces = before.filter((_q, i) => i !== d.index);
      if (JSON.stringify(before) !== JSON.stringify(this.pieces)) {
        this.history.push(before);
        if (this.history.length > 40) this.history.shift();
        this.selected = null;
        this.selection.clear();
        this.save();
      }
    }
    this.cancel();
  }
  cancel() {
    this.drag = null;
    this.preview?.destroy();
    this.preview = null;
  }
  save() {
    store.set("endingDecorations", this.pieces);
    this.redraw();
  }
  redraw() {
    this.rendered.forEach((s) => s.destroy());
    this.rendered = savedDecorations(this, this.pieces);
    this.undo.setAlpha(this.history.length ? 1 : 0.45);
    this.feedback.setText(
      this.pieces.length >= 60
        ? "A full garden! Move a decoration or return one to the tray."
        : "Move anything. Return a decoration to the tray to remove it.",
    );
  }
  setBlocked(v) {
    this.cancel();
    super.setBlocked(v);
  }
  leave() {
    this.cancel();
    super.leave();
  }
  hint() {
    this.ui.dialogue(DIALOGUE.endingDecorate);
  }
}
