import Phaser from "phaser";
import { store } from "@caper/engine";
import { COLORS, font, INK, line } from "../art.js";
import { validStrokes } from "../state.js";
import { DIALOGUE } from "../dialogue.js";
import { BRIDGE, RAINBOW } from "../puzzles/rainbow.js";
import { drawingInterruptions, traceTouch, worldPerPixel } from "../touch-input.js";
import {
  BRUSH_RADIUS,
  distanceToSegment,
  insideEllipse,
  PATCH,
  patchCoverage,
  SAIL,
  TRACE_RADIUS,
  TRACE_WIDTH,
  traceCoverage,
} from "../puzzles/geometry.js";

export class Repair extends Phaser.Scene {
  constructor() {
    super("Repair");
  }
  init(data) {
    this.kind = ["patch", "bridge"].includes(data.kind) ? data.kind : "sail";
    this.tracing = this.kind !== "patch";
    this.outline = this.kind === "bridge" ? BRIDGE : SAIL;
    this.returnScene = this.kind === "bridge" ? "Port" : "Harbor";
  }
  create() {
    this.ui = this.registry.get("ui");
    this.done = false;
    this.tapMode = false;
    this.tapIndex = 0;
    this.currentStroke = null;
    this.pointerId = null;
    this.previous = null;
    this.blocked = false;
    this.strokes = validStrokes(store.get(`${this.kind}Strokes`));
    this.color = store.getActiveCharacter() === "keila" ? COLORS[1] : COLORS[0];
    this.coverage = (this.tracing ? traceCoverage(this.outline) : patchCoverage())
      .restore(this.strokes);
    this.ui.setScene(
      this,
      this.kind === "bridge"
        ? "Draw the rainbow bridge"
        : this.kind === "sail"
        ? "Draw a sail"
        : "Patch the boat",
    );
    store.setCurrentScene(this.returnScene);
    this.cameras.main.setBackgroundColor("#fff9e9");
    this.add.text(
      600,
      44,
      this.kind === "bridge"
        ? "A bridge into the village"
        : this.kind === "sail"
        ? "A sail for our boat"
        : "A patch to keep us dry",
      {
        ...font,
        fontSize: "42px",
      },
    ).setOrigin(.5);
    this.subtitle = this.add.text(
      600,
      97,
      this.kind === "bridge"
        ? "Draw along the arch. Keep adding marks when it's ready."
        : this.kind === "sail"
        ? "Draw along the three sides. Wobbles are welcome."
        : "Color over the hole. Keep going until your patch holds!",
      { ...font, fontSize: "26px" },
    ).setOrigin(.5);
    if (this.kind === "bridge") {
      const rainbow = this.add.graphics();
      RAINBOW.forEach((color, i) =>
        rainbow.lineStyle(17, color, .5).strokePoints(BRIDGE.map((p) => ({ x: p.x, y: p.y + 24 + i * 19 })))
      );
    } else {this.add.image(600, this.kind === "sail" ? 425 : 145, "boat").setDisplaySize(
        this.kind === "sail" ? 600 : 1160,
        this.kind === "sail" ? 600 : 1160,
      );}
    // The enlarged hull is a close-up, not another item to collect.
    if (this.kind === "patch") {
      this.add.rectangle(600, 77, 1200, 154, 0xfff9e9).setDepth(1);
      this.subtitle.setDepth(2);
      this.add.text(600, 44, "A patch to keep us dry", { ...font, fontSize: "42px" }).setOrigin(.5).setDepth(
        2,
      );
    }
    this.guides = this.add.graphics().setDepth(3);
    this.ink = this.add.graphics().setDepth(4);
    if (this.tracing) {
      this.guides.lineStyle(TRACE_RADIUS * 2, 0xdbd0e3, .62).strokePoints(this.outline);
      this.guides.lineStyle(2, INK, .45).strokePoints(this.outline);
    } else {
      this.guides.fillStyle(0x234d59).fillEllipse(PATCH.x, PATCH.y, PATCH.rx * 2, PATCH.ry * 2);
      this.guides.lineStyle(5, INK).strokeEllipse(PATCH.x, PATCH.y, PATCH.rx * 2, PATCH.ry * 2);
      const mask = this.make.graphics({ x: 0, y: 0 }, false);
      mask.fillStyle(0xffffff).fillEllipse(PATCH.x, PATCH.y, PATCH.rx * 2, PATCH.ry * 2);
      this.ink.setMask(mask.createGeometryMask());
      this.events.once("shutdown", () => mask.destroy());
    }
    this.drawSaved();
    this.add.text(80, 247, "Our crayons", { ...font, fontSize: "25px" }).setDepth(5);
    this.colorButtons = COLORS.map((color, i) => {
      const button = this.add.circle(122, 310 + 78 * i, 27, color).setStrokeStyle(
        4,
        color === this.color ? INK : 0xfff9e9,
      ).setDepth(5).setInteractive({ useHandCursor: true });
      button.on("pointerdown", (_p, _x, _y, e) => {
        e.stopPropagation();
        this.setColor(color);
      });
      return button;
    });
    this.progressLabel = this.add.text(600, 694, "", { ...font, fontSize: "28px" }).setOrigin(.5).setDepth(6);
    this.add.rectangle(600, 717, 330, 8, 0xe2d7de).setDepth(5);
    this.progressBar = this.add.rectangle(435, 717, 0, 8, 0x497b72).setOrigin(0, .5).setDepth(6);
    this.back = this.button(110, 763, `← ${this.returnScene}`, () => this.leave());
    if (this.tracing) {
      this.assist = this.button(
        600,
        763,
        this.kind === "bridge" ? "Tap dots instead" : "Tap corners instead",
        () => this.enableTapMode(),
      );
    }
    this.help = this.button(1050, 763, "A little hint", () => this.hint());
    this.corners = [];
    this.input.on("pointerdown", (pointer) => {
      if (this.tapMode || this.blocked || this.pointerId !== null) return;
      // Own the finger even if it lands just outside the guide; entering it
      // during the same gesture should begin drawing without another tap.
      this.pointerId = pointer.id;
      this.startStroke(pointer);
    });
    this.input.on("pointermove", (pointer) => {
      if (!pointer.isDown || pointer.id !== this.pointerId || this.tapMode) return;
      if (this.currentStroke) this.paint(pointer);
      else this.startStroke(pointer);
    });
    this.input.on("pointerup", (pointer) => {
      if (pointer.id !== this.pointerId) return;
      // Include the release position, which may be newer than the last move.
      if (this.currentStroke) this.paint(pointer);
      this.endStroke();
      this.updateProgress();
    });
    this.input.on("pointerupoutside", (pointer) => {
      if (pointer.id !== this.pointerId) return;
      this.endStroke();
      this.updateProgress();
    });
    this.input.on("gameout", () => {
      // Break the painted line, but retain ownership until the finger lifts.
      this.currentStroke = null;
      this.previous = null;
      this.persist();
    });
    this.input.keyboard.on("keydown", (event) => {
      if (this.blocked) return;
      if (this.tapMode && /^[1-5]$/.test(event.key)) this.tapCorner(Number(event.key) - 1);
      if (event.key === "Escape") this.leave();
    });
    this.events.once("shutdown", () => this.persist());
    drawingInterruptions(this, () => {
      this.endStroke();
      this.updateProgress();
    });
    this.ui.status("Draw with your mouse or finger. Lift it whenever you like; your work stays.");
    this.updateProgress();
  }
  button(x, y, label, action) {
    const b = this.add.text(x, y, label, {
      ...font,
      fontSize: "26px",
      backgroundColor: "#eadff4",
      padding: { x: 20, y: 13 },
    }).setOrigin(.5).setDepth(20).setInteractive({ useHandCursor: true });
    b.on("pointerdown", (_p, _x, _y, event) => {
      event.stopPropagation();
      this.endStroke();
      action();
    });
    return b;
  }
  setBlocked(value) {
    this.endStroke();
    this.blocked = value;
    this.input.enabled = !value;
  }
  switchSister(id) {
    if (this.blocked) return;
    this.endStroke();
    store.setActiveCharacter(id);
    this.setColor(id === "keila" ? COLORS[1] : COLORS[0]);
    this.ui.status(`${id === "keila" ? "Keila" : "Olivia"}'s turn. Keep drawing together!`);
  }
  setColor(color) {
    this.color = color;
    this.colorButtons.forEach((b, i) => b.setStrokeStyle(4, COLORS[i] === color ? INK : 0xfff9e9));
  }
  acceptable(point) {
    return this.tracing
      ? this.outline.slice(1).some((b, i) =>
        distanceToSegment(point, this.outline[i], b) <= TRACE_RADIUS + 10
      )
      : insideEllipse(point, { ...PATCH, rx: PATCH.rx + 12, ry: PATCH.ry + 12 });
  }
  startStroke(pointer) {
    const point = this.drawingPoint(pointer);
    if (this.blocked || !point || !this.acceptable(point)) return;
    if (this.pointerId !== null && this.pointerId !== pointer.id) return;
    this.pointerId = pointer.id;
    if (this.strokes.length >= 120) {
      this.ui.status("Lots of marks! Keep coloring the remaining spaces.");
      this.strokes = this.strokes.filter((stroke) => stroke.length > 1);
    }
    this.currentStroke = [];
    this.strokes.push(this.currentStroke);
    this.previous = null;
    this.paint(pointer);
  }
  paint(pointer) {
    if (this.blocked || !this.currentStroke) return;
    const position = this.drawingPoint(pointer);
    const point = position && { x: position.x, y: position.y, c: this.color };
    if (!point || !this.acceptable(point)) {
      this.previous = null;
      this.currentStroke = null;
      this.persist();
      return;
    }
    if (this.previous && Math.hypot(point.x - this.previous.x, point.y - this.previous.y) < 3) return;
    const previous = this.previous ?? point;
    this.currentStroke.push(point);
    line(this.ink, previous, point, this.color, this.tracing ? TRACE_WIDTH : BRUSH_RADIUS * 2);
    this.coverage.stroke(previous, point);
    this.previous = point;
    this.updateProgress();
  }
  drawingPoint(pointer) {
    return this.tracing ? traceTouch(pointer, this.outline, worldPerPixel(this), pointer.wasTouch) : pointer;
  }
  endStroke() {
    this.pointerId = null;
    this.currentStroke = null;
    this.previous = null;
    this.persist();
  }
  persist() {
    if (this.strokes) {
      store.set(
        `${this.kind}Strokes`,
        this.strokes.map((stroke) => stroke.map((p) => ({ ...p }))),
      );
    }
  }
  drawSaved() {
    this.ink.clear();
    for (const stroke of this.strokes) {
      stroke.forEach((p, i) =>
        line(
          this.ink,
          stroke[i - 1] ?? p,
          p,
          COLORS.includes(p.c) ? p.c : INK,
          this.tracing ? TRACE_WIDTH : BRUSH_RADIUS * 2,
        )
      );
    }
  }
  updateProgress() {
    if (this.done) return;
    this.progressBar.width = 330 * this.coverage.ratio;
    this.progressLabel.setText(
      this.kind === "bridge"
        ? "Join both ends of the rainbow"
        : this.kind === "sail"
        ? "Give our sail all three sides"
        : "Cover the dark spaces",
    );
    if (this.coverage.complete({ strokeActive: this.pointerId !== null })) this.complete();
  }
  enableTapMode() {
    if (this.tapMode || this.done) return;
    this.tapMode = true;
    this.assist.setVisible(false);
    this.subtitle.setText(
      this.kind === "bridge"
        ? "Tap 1, 2, 3, 4, then 5. Or use the number keys."
        : "Tap 1, then 2, then 3, then 1. Or use the number keys.",
    );
    this.tapPoints = this.kind === "bridge" ? [0, 6, 12, 18, 24].map((i) => BRIDGE[i]) : SAIL.slice(0, 3);
    this.corners = this.tapPoints.map((point, i) => {
      const button = this.button(point.x, point.y, String(i + 1), () => this.tapCorner(i));
      return button;
    });
    this.progressLabel.setText("Start at 1");
  }
  tapCorner(index) {
    if (!this.tapMode || this.done || this.blocked) return;
    const expected = this.tapIndex % this.tapPoints.length;
    if (index !== expected) {
      this.progressLabel.setText(`Try ${expected + 1} next`);
      return;
    }
    if (this.tapIndex > 0) {
      const points = this.kind === "bridge"
        ? BRIDGE.slice((this.tapIndex - 1) * 6, this.tapIndex * 6 + 1)
        : [this.tapPoints[(this.tapIndex - 1) % 3], this.tapPoints[index]];
      const stroke = points.map((p) => ({ ...p, c: this.color }));
      this.strokes.push(stroke);
      stroke.slice(1).forEach((b, i) => {
        line(this.ink, stroke[i], b, this.color, TRACE_WIDTH);
        this.coverage.stroke(stroke[i], b);
      });
    }
    this.tapIndex++;
    this.persist();
    this.updateProgress();
    if (!this.done) this.progressLabel.setText(`Now ${this.tapIndex % this.tapPoints.length + 1}`);
  }
  complete() {
    this.done = true;
    store.set(`${this.kind}Done`, true);
    this.progressBar.width = 330;
    this.progressLabel.setText(
      this.kind === "bridge"
        ? "Our bridge reaches both sides!"
        : this.kind === "sail"
        ? "Our sail is ready!"
        : "Our patch holds!",
    );
    this.subtitle.setVisible(false);
    this.assist?.destroy();
    this.help.destroy();
    this.corners.forEach((b) => b.destroy());
    this.tapMode = false;
    this.finish = this.button(
      670,
      752,
      this.kind === "bridge" ? "See our bridge →" : "See it on our boat →",
      () => this.leave(true),
    );
    this.finish.setBackgroundColor("#fddf55");
    const bounds = this.finish.getBounds();
    this.add.rectangle(bounds.centerX, bounds.centerY, bounds.width + 14, bounds.height + 14)
      .setStrokeStyle(3, 0xe6ad24).setDepth(19);
    this.ui.speak(
      ...(this.kind === "bridge"
        ? DIALOGUE.bridgeComplete
        : this.kind === "sail"
        ? DIALOGUE.sailComplete
        : DIALOGUE.patchComplete)[0],
    );
    this.ui.status("Ready! Keep drawing, or use the yellow button when you're finished.");
  }
  leave(completed = false) {
    if (this.blocked) return;
    this.persist();
    this.scene.start(this.returnScene, { repaired: completed ? this.kind : null });
  }
  hint() {
    this.ui.dialogue(
      this.kind === "bridge"
        ? DIALOGUE.bridgeDrawHint
        : this.kind === "sail"
        ? DIALOGUE.sailHint
        : DIALOGUE.patchHint,
      () => {},
      "Keep drawing",
    );
  }
}
