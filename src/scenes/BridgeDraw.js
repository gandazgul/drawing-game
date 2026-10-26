import { store } from "@gandazgul/caper-engine";
import { PuzzleScene } from "./PuzzleScene.js";
import { font, INK, line } from "../art.js";
import { drawingInterruptions, fingerCircle, traceTouch, worldPerPixel } from "../touch-input.js";
import { bridgeCloseup, drawBridgeBands } from "../BridgeView.js";
import {
  BRIDGE_PATHS,
  bridgeBandAccepts,
  bridgeBandCoverage,
  COLOR_NAMES,
  migrateBridgeBands,
  RAINBOW,
  safeBridgeBands,
} from "../puzzles/rainbow.js";
import { DIALOGUE } from "../dialogue.js";

export class BridgeDraw extends PuzzleScene {
  constructor() {
    super("BridgeDraw");
  }
  create() {
    this.setup(
      "Draw the rainbow bridge",
      "Join the rainbow",
      "Choose a color. Draw across its gap to the other side.",
      "Port",
    );
    this.bands = migrateBridgeBands(store.get("bridgeBands"), store.get("bridgeArtVersion"));
    store.set("bridgeArtVersion", 2);
    this.coverage = this.bands.map((strokes, i) => bridgeBandCoverage(i, strokes));
    this.selected = Math.max(
      0,
      this.coverage.findIndex((c) => !c.complete()),
    );
    this.current = null;
    this.pointerId = null;
    this.done = false;
    this.tapMode = false;
    this.tapIndex = 0;
    bridgeCloseup(this);
    this.guides = this.add.graphics().setDepth(2);
    this.ink = this.add.graphics().setDepth(3);
    this.chips = RAINBOW.map((color, i) => {
      const x = 300 + i * 100;
      const chip = fingerCircle(this, this.add.circle(x, 614, 31, color).setDepth(5));
      const label = this.add
        .text(x, 614, String(i + 1), {
          ...font,
          fontSize: "24px",
          backgroundColor: "#fff9e9",
        })
        .setOrigin(0.5)
        .setDepth(6);
      chip.on("pointerdown", (_p, _x, _y, event) => {
        event.stopPropagation();
        if (this.blocked) return;
        this.endStroke();
        this.selected = i;
        this.tapIndex = 0;
        this.refresh();
      });
      return { chip, label };
    });
    this.assist = this.button(1000, 751, "Tap dots instead", () => {
      this.endStroke();
      this.tapMode = !this.tapMode;
      this.tapIndex = 0;
      this.refresh();
    });
    this.dots = [];
    this.input.on("pointerdown", (p) => {
      if (!this.tapMode && !this.blocked && this.pointerId === null) {
        this.pointerId = p.id;
        this.paint(p);
      }
    });
    this.input.on("pointermove", (p) => {
      if (p.isDown && p.id === this.pointerId) this.paint(p);
    });
    this.input.on("pointerup", (p) => {
      if (p.id !== this.pointerId) return;
      this.paint(p);
      this.endStroke();
      this.refresh();
    });
    this.input.on("pointerupoutside", (p) => {
      if (p.id !== this.pointerId) return;
      this.endStroke();
      this.refresh();
    });
    this.input.on("gameout", () => {
      // Break the line, not finger ownership; resume on re-entry.
      this.current = null;
    });
    this.input.keyboard.on("keydown", (event) => {
      if (this.tapMode && /^[1-5]$/.test(event.key)) this.tapDot(Number(event.key) - 1);
    });
    this.events.once("shutdown", () => this.persist());
    drawingInterruptions(this, () => {
      this.endStroke();
      this.refresh();
    });
    this.refresh();
    this.ui.status("Connect all seven colors. Your drawing is saved.");
  }
  paint(p) {
    if (this.blocked || this.pointerId !== p.id || this.tapMode) return;
    const position = traceTouch(p, BRIDGE_PATHS[this.selected], worldPerPixel(this), p.wasTouch);
    if (!position || !bridgeBandAccepts(this.selected, position)) {
      this.current = null;
      return;
    }
    if (!this.current) {
      this.current = [];
      this.bands[this.selected].push(this.current);
    }
    const point = { x: position.x, y: position.y };
    const previous = this.current.at(-1) ?? point;
    if (this.current.length && Math.hypot(point.x - previous.x, point.y - previous.y) < 2) return;
    this.current.push(point);
    this.coverage[this.selected].stroke(previous, point);
    line(this.ink, previous, point, RAINBOW[this.selected], 14);
  }
  endStroke() {
    this.current = null;
    this.pointerId = null;
    this.persist();
  }
  persist() {
    if (this.bands) store.set("bridgeBands", safeBridgeBands(this.bands));
  }
  setBlocked(value) {
    this.endStroke();
    super.setBlocked(value);
  }
  switchSister(id) {
    this.endStroke();
    super.switchSister(id);
  }
  leave() {
    this.endStroke();
    super.leave();
  }
  tapDot(index) {
    if (this.blocked || !this.tapMode) return;
    if (index !== this.tapIndex) {
      if (this.done) return;
      this.feedback.setText(`Tap dot ${this.tapIndex + 1} next`);
      return;
    }
    if (index > 0) {
      const stroke = BRIDGE_PATHS[this.selected].slice((index - 1) * 6, index * 6 + 1).map((p) => ({ ...p }));
      this.bands[this.selected].push(stroke);
      this.coverage[this.selected].restore([stroke]);
      this.persist();
    }
    this.tapIndex = (index + 1) % 5;
    this.refresh();
  }
  refresh() {
    this.guides.clear();
    const path = BRIDGE_PATHS[this.selected];
    this.guides.lineStyle(20, 0xfff9e9, 0.7).strokePoints(path);
    this.guides.lineStyle(2, RAINBOW[this.selected], 0.8).strokePoints(path);
    [path[0], path.at(-1)].forEach((p) => {
      this.guides.fillStyle(0xfff9e9).fillCircle(p.x, p.y, 12);
      this.guides.lineStyle(3, RAINBOW[this.selected]).strokeCircle(p.x, p.y, 12);
    });
    drawBridgeBands(this.ink, this.bands);
    this.chips.forEach(({ chip, label }, i) => {
      chip.setStrokeStyle(5, i === this.selected ? INK : 0xfff9e9);
      label.setText(this.coverage[i].complete() ? "✓" : String(i + 1));
    });
    this.dots.forEach((d) => d.destroy());
    this.dots = [];
    if (this.tapMode) {
      this.dots = [0, 6, 12, 18, 24].map((n, i) => {
        const p = path[n];
        const next = i === this.tapIndex;
        const dot = this.add
          .circle(p.x, p.y, next ? 23 : 17, next ? 0xfddf55 : 0xfff9e9)
          .setStrokeStyle(3, RAINBOW[this.selected])
          .setDepth(10);
        // Neighboring dots are closer than a fingertip on phones. Only the
        // next dot owns a hit area, so enlarged targets cannot steal its tap.
        if (next) fingerCircle(this, dot, 48);
        const text = this.add
          .text(p.x, p.y, String(i + 1), { ...font, fontSize: next ? "29px" : "23px" })
          .setOrigin(0.5)
          .setDepth(11);
        dot.on("pointerdown", (_p, _x, _y, e) => {
          e.stopPropagation();
          this.tapDot(i);
        });
        return {
          destroy: () => {
            dot.destroy();
            text.destroy();
          },
        };
      });
    }
    const count = this.coverage.filter((c) => c.complete()).length;
    this.feedback.setText(`${COLOR_NAMES[this.selected]} · ${count} of 7 colors connected`);
    this.assist.setText(this.tapMode ? "Draw instead" : "Tap dots instead");
    this.instructions.setText(
      this.tapMode
        ? "Choose a color, then tap its dots from 1 to 5."
        : "Choose a color. Draw across its gap to the other side.",
    );
    if (count === 7 && !this.done) {
      this.done = true;
      store.set("bridgeDone", true);
      this.button(605, 751, "See our bridge →", () => this.leave(), "#fddf55");
      this.ui.speak(...DIALOGUE.bridgeComplete[0]);
      this.ui.status("Ready! Keep drawing, or see your bridge.");
    }
  }
  hint() {
    this.ui.openPanel(
      "Join every color",
      "<p>Pick a crayon below. Follow that stripe’s pale line across the gap. Connect all seven colors.</p><p>You can lift your crayon, or choose Tap dots instead.</p>",
    );
    this.ui.panelButton("Keep drawing", () => this.ui.closePanel());
  }
}
