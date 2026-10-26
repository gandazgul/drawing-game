import { store } from "@caper/engine";
import { PuzzleScene } from "./PuzzleScene.js";
import { COLORS, font, INK, line } from "../art.js";
import { validStrokes } from "../state.js";
import { distanceToSegment } from "../puzzles/geometry.js";
import { drawingInterruptions, fingerCircle, traceTouch, worldPerPixel } from "../touch-input.js";
import { createBear, forestMarks } from "../ForestView.js";
import {
  canForestStep,
  DANCE_PATH,
  danceCoverage,
  forestBoardForVisit,
  forestClues,
  forestCompletion,
  forestSolved,
} from "../puzzles/forest.js";
import { DIALOGUE } from "../dialogue.js";

export class ForestDraw extends PuzzleScene {
  constructor() {
    super("ForestDraw");
  }
  create() {
    this.setup(
      "The dancing trail",
      "A trail for a twirl",
      "Draw along the trail. Wobbles are welcome!",
      "ForestEdge",
    );
    this.strokes = validStrokes(store.get("forestStrokes"));
    this.coverage = danceCoverage(this.strokes);
    this.color = store.getActiveCharacter() === "keila" ? COLORS[1] : COLORS[0];
    this.pointerId = null;
    this.current = null;
    this.done = false;
    this.tapMode = false;
    this.tapIndex = 0;
    this.add.image(600, 415, "forestGrove").setDisplaySize(1200, 520).setAlpha(.25);
    const guide = this.add.graphics().setDepth(1);
    guide.lineStyle(40, 0xfff9e9, 1).strokePoints(DANCE_PATH);
    guide.lineStyle(3, INK, .65).strokePoints(DANCE_PATH);
    createBear(this, 1020, 292, 155).setDepth(2);
    this.ink = forestMarks(this, this.strokes);
    this.chips = COLORS.map((color, i) => {
      const chip = fingerCircle(this, this.add.circle(375 + i * 110, 600, 30, color).setDepth(5));
      chip.setStrokeStyle(4, color === this.color ? INK : 0xfff9e9);
      chip.on("pointerdown", (_p, _x, _y, e) => {
        e.stopPropagation();
        this.endStroke();
        this.color = color;
        this.chips.forEach((c, n) => c.setStrokeStyle(4, COLORS[n] === color ? INK : 0xfff9e9));
      });
      return chip;
    });
    this.assist = this.button(990, 751, "Tap dots instead", () => {
      this.endStroke();
      this.tapMode = !this.tapMode;
      this.tapIndex = 0;
      this.showDots();
    });
    this.dots = [];
    this.input.on("pointerdown", (p) => {
      if (!this.blocked && !this.tapMode && this.pointerId === null) {
        this.pointerId = p.id;
        this.paint(p);
      }
    });
    this.input.on("pointermove", (p) => {
      if (p.isDown && p.id === this.pointerId) this.paint(p);
    });
    this.input.on("pointerup", (p) => {
      if (p.id === this.pointerId) {
        this.paint(p);
        this.endStroke();
      }
    });
    this.input.on("pointerupoutside", () => this.endStroke());
    this.input.on("gameout", () => {
      this.current = null;
    });
    this.input.keyboard.on("keydown", (e) => {
      if (this.tapMode && /^[1-6]$/.test(e.key)) this.tapDot(Number(e.key) - 1);
    });
    drawingInterruptions(this, () => this.endStroke());
    this.events.once("shutdown", () => this.persist());
    this.refresh();
  }
  paint(p) {
    if (this.blocked || this.tapMode || p.id !== this.pointerId) return;
    const pos = traceTouch(p, DANCE_PATH, worldPerPixel(this), p.wasTouch);
    if (!pos || !DANCE_PATH.slice(1).some((b, i) => distanceToSegment(pos, DANCE_PATH[i], b) < 30)) {
      this.current = null;
      return;
    }
    if (!this.current) {
      this.current = [];
      this.strokes.push(this.current);
    }
    const point = { x: pos.x, y: pos.y, c: this.color }, previous = this.current.at(-1) ?? point;
    if (this.current.length && Math.hypot(point.x - previous.x, point.y - previous.y) < 2) return;
    this.current.push(point);
    this.coverage.stroke(previous, point);
    line(this.ink, previous, point, this.color, 14);
  }
  persist() {
    if (this.strokes) store.set("forestStrokes", validStrokes(this.strokes));
  }
  endStroke() {
    this.pointerId = null;
    this.current = null;
    this.persist();
    this.refresh();
  }
  setBlocked(value) {
    this.endStroke();
    super.setBlocked(value);
  }
  switchSister(id) {
    this.endStroke();
    super.switchSister(id);
    this.color = id === "keila" ? COLORS[1] : COLORS[0];
    this.chips.forEach((c, n) => c.setStrokeStyle(4, COLORS[n] === this.color ? INK : 0xfff9e9));
  }
  leave() {
    this.endStroke();
    super.leave();
  }
  tapDot(i) {
    if (this.blocked || !this.tapMode || i !== this.tapIndex) return;
    if (i) {
      const stroke = [DANCE_PATH[i - 1], DANCE_PATH[i]].map((p) => ({ ...p, c: this.color }));
      this.strokes.push(stroke);
      this.coverage.restore([stroke]);
      line(this.ink, stroke[0], stroke[1], this.color, 14);
    }
    this.tapIndex = (i + 1) % DANCE_PATH.length;
    this.persist();
    this.refresh();
    this.showDots();
  }
  showDots() {
    this.dots.forEach((o) => o.destroy());
    this.dots = [];
    this.assist.setText(this.tapMode ? "Draw instead" : "Tap dots instead");
    this.instructions.setText(
      this.tapMode ? "Tap the numbered dots from 1 to 6." : "Draw along the trail. Wobbles are welcome!",
    );
    if (!this.tapMode) return;
    DANCE_PATH.forEach((p, i) => {
      const dot = this.add.circle(p.x, p.y, 24, i === this.tapIndex ? 0xfddf55 : 0xfff9e9)
        .setStrokeStyle(3, INK).setDepth(7);
      if (i === this.tapIndex) fingerCircle(this, dot, 48);
      dot.on("pointerdown", (_p, _x, _y, e) => {
        e.stopPropagation();
        this.tapDot(i);
      });
      const label = this.add.text(p.x, p.y, String(i + 1), { ...font, fontSize: "29px" }).setOrigin(.5)
        .setDepth(8);
      this.dots.push(dot, label);
    });
  }
  refresh() {
    if (!this.feedback || !this.coverage) return;
    this.feedback.setText(
      this.done ? "Ready for a dance! You can keep drawing." : "Follow the trail all the way to our bear.",
    );
    if (!this.done && this.coverage.complete()) {
      this.done = true;
      store.set("forestDanceDone", true);
      this.feedback.setText("Ready for a dance! You can keep drawing.");
      this.button(600, 751, "Watch her dance →", () => {
        this.persist();
        this.scene.start("ForestEdge", { dance: true });
      }, "#fddf55");
      this.ui.speak(...DIALOGUE.forestDrawReady[0]);
    }
  }
  hint() {
    this.ui.dialogue(DIALOGUE.forestDrawHint);
  }
}

export class ForestNumbers extends PuzzleScene {
  constructor() {
    super("ForestNumbers");
  }
  create() {
    this.setup(
      "The woodland trail",
      "Every stepping stone",
      "Start at 1. Visit every square. Reach the numbers in order.",
      "ForestTrail",
    );
    this.board = forestBoardForVisit(store.get("forestBoard"), crypto.getRandomValues(new Uint32Array(1))[0]);
    this.path = this.board.path;
    this.solved = false;
    this.cellSize = 94;
    this.left = 365;
    this.top = 154;
    this.tiles = [];
    this.clues = forestClues(this.board);
    this.add.image(178, 420, "forestCreature").setDisplaySize(145, 180);
    this.lines = this.add.graphics().setDepth(3);
    for (let i = 0; i < 25; i++) {
      const p = this.center(i);
      const tile = this.add.rectangle(p.x, p.y, 88, 88, 0xf0e3b7).setStrokeStyle(3, 0x867a58).setDepth(2);
      tile.setInteractive({ useHandCursor: true });
      tile.on("pointerdown", (pointer, _x, _y, event) => {
        event.stopPropagation();
        if (this.blocked) return;
        this.pointerId = pointer.id;
        this.step(i);
      });
      this.tiles.push(tile);
      if (this.clues[i]) {
        this.add.circle(p.x, p.y, 22, 0xfff9e9).setStrokeStyle(2, INK).setDepth(4);
        this.add.text(p.x, p.y, String(this.clues[i]), { ...font, fontSize: "30px" }).setOrigin(.5).setDepth(
          5,
        );
      }
    }
    this.undo = this.button(470, 751, "Undo", () => {
      if (!this.solved && this.path.length > 1) {
        this.path.pop();
        this.refresh();
      }
    });
    this.restart = this.button(675, 751, "Clear trail", () => {
      if (!this.solved) {
        this.path.splice(1);
        this.refresh();
      }
    });
    this.help = this.button(1000, 751, "Show next step", () => this.hint());
    this.input.on("pointermove", (p) => {
      if (this.blocked || !p.isDown || this.pointerId !== p.id) return;
      const c = Math.floor((p.x - this.left) / this.cellSize),
        r = Math.floor((p.y - this.top) / this.cellSize);
      if (c < 0 || c > 4 || r < 0 || r > 4) return;
      // Ignore tiny brushes over the corners of a neighboring square.
      const center = this.center(r * 5 + c);
      if (Math.abs(p.x - center.x) < 40 && Math.abs(p.y - center.y) < 40) this.step(r * 5 + c);
    });
    this.input.on("pointerup", () => {
      this.pointerId = null;
    });
    drawingInterruptions(this, () => {
      this.pointerId = null;
      this.persist();
    });
    this.events.once("shutdown", () => this.persist());
    this.refresh();
  }
  center(i) {
    return {
      x: this.left + (i % 5 + .5) * this.cellSize,
      y: this.top + (Math.floor(i / 5) + .5) * this.cellSize,
    };
  }
  step(i) {
    if (this.blocked || this.solved || i === this.path.at(-1)) return;
    if (this.path.includes(i)) this.path.splice(this.path.indexOf(i) + 1);
    else if (canForestStep(this.board, this.path, i)) this.path.push(i);
    else {
      this.feedback.setText("One square at a time. Tap an earlier square to go back.");
      return;
    }
    this.refresh();
  }
  persist() {
    if (this.board) {
      this.board.path = [...this.path];
      store.set("forestBoard", structuredClone(this.board));
    }
  }
  refresh() {
    this.lines.clear();
    this.tiles.forEach((tile, i) =>
      tile.setFillStyle(this.path.includes(i) ? 0xcee4ba : 0xf0e3b7)
        .setStrokeStyle(i === this.path.at(-1) ? 5 : 3, i === this.path.at(-1) ? INK : 0x867a58)
    );
    this.path.slice(1).forEach((cell, i) =>
      line(this.lines, this.center(this.path[i]), this.center(cell), 0x286d38, 12)
    );
    this.persist();
    this.feedback.setText(
      `${this.path.length} of 25 squares · ${this.path.filter((n) => this.clues[n]).length} of 6 numbers`,
    );
    if (!this.solved && forestSolved(this.board)) {
      this.solved = true;
      store.set("forestTrailDone", true);
      this.undo.destroy();
      this.restart.destroy();
      this.help.destroy();
      this.feedback.setText("Every stone connected. Let's walk to the studio!");
      this.button(
        680,
        751,
        "Walk our trail →",
        () => this.scene.start("ForestTrail", { finished: true }),
        "#fddf55",
      );
    }
  }
  hint() {
    if (this.blocked || this.solved) return;
    const completion = forestCompletion(this.board, this.path);
    if (!completion) {
      this.feedback.setText("This trail is blocked. Tap an earlier square or Undo to try another way.");
      return;
    }
    const next = completion[this.path.length];
    this.tiles[next].setFillStyle(0xfddf55).setStrokeStyle(5, INK);
    this.feedback.setText("Try the yellow square next.");
  }
}
