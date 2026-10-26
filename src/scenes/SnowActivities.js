import { store } from "@caper/engine";
import Phaser from "phaser";
import { PuzzleScene } from "./PuzzleScene.js";
import { font } from "../art.js";
import { materialPart, snowPart } from "../SnowView.js";
import {
  BODY_PARTS,
  MATERIALS,
  materialsFound,
  nextMaterial,
  placeSnowPiece,
  SLIDE_TARGETS,
  SLIDE_TOLERANCE,
  slideHits,
  slidePower,
  SNOW_PARTS,
  snowmanReady,
  snowUnlocked,
  validSnowPieces,
} from "../puzzles/snow.js";
import { drawingInterruptions, worldPerPixel } from "../touch-input.js";
import { DIALOGUE } from "../dialogue.js";

function backdrop(scene) {
  scene.add.image(600, 400, "frozenPond").setDisplaySize(1200, 800).setDepth(-3);
  scene.add.rectangle(600, 68, 1200, 136, 0xfff9e9, .96).setDepth(-2);
  scene.add.rectangle(600, 725, 1200, 150, 0xfff9e9, .96).setDepth(-2);
}

function sayHelp(scene, line) {
  if (scene.ui.readAloud) scene.ui.speak(...line);
}

export class PenguinSlide extends PuzzleScene {
  constructor() {
    super("PenguinSlide");
  }
  create() {
    this.setup(
      "Sliding with the penguin",
      "A slide for our snow friend",
      "Hold to slide. Let go when the penguin reaches the green patch.",
      "FrozenPond",
    );
    backdrop(this);
    this.holding = false;
    this.sliding = false;
    this.elapsed = 0;
    this.tapMode = false;
    this.holdPointer = null;
    this.found = materialsFound(store.get("snowMaterials"));
    this.add.graphics().lineStyle(5, 0x497e91, .6).lineBetween(175, 462, 1030, 462);
    this.targetRing = this.add.ellipse(600, 462, 200, 65, 0xe3f4ac, .65).setStrokeStyle(4, 0x386a40);
    this.penguin = this.add.image(180, 455, "penguin").setOrigin(.5, 1).setDisplaySize(110, 165);
    this.material = snowPart(this, "twig", 600, 430, 80);
    this.feedback.setY(529).setBackgroundColor("#fff9e9").setPadding(12, 6);
    this.holdButton = this.add.circle(600, 642, 82, 0x66418d).setStrokeStyle(5, 0xfff9e9)
      .setDepth(25).setInteractive(new Phaser.Geom.Circle(82, 82, 82), Phaser.Geom.Circle.Contains);
    this.holdButton.input.cursor = "pointer";
    this.holdLabel = this.add.text(600, 642, "Hold to\nslide", {
      ...font,
      color: "#fff9e9",
      fontSize: "30px",
      align: "center",
    }).setOrigin(.5).setDepth(26);
    this.holdButton.on("pointerdown", (p, _x, _y, e) => {
      e.stopPropagation();
      this.holdPointer = p.id;
      this.press();
    });
    this.holdButton.on("pointerover", () => this.holdButton.setStrokeStyle(5, 0xffe552));
    this.holdButton.on("pointerout", () => this.holdButton.setStrokeStyle(5, 0xfff9e9));
    this.modeButton = this.button(1010, 751, "Use two taps", () => {
      this.cancelHold();
      this.tapMode = !this.tapMode;
      this.modeButton.setText(this.tapMode ? "Use hold" : "Use two taps");
      this.instructions.setText(
        this.tapMode
          ? "Tap to start. Tap again when the penguin reaches the green patch."
          : "Hold to slide. Let go when the penguin reaches the green patch.",
      );
      this.refreshButton();
    });
    const release = (p) => {
      if (!this.tapMode && p.id === this.holdPointer) this.release();
    };
    this.input.on("pointerup", release);
    this.input.on("pointerupoutside", release);
    const down = (e) => {
      if (!e.repeat) {
        e.preventDefault();
        this.press();
      }
    };
    const up = (e) => {
      e.preventDefault();
      if (!this.tapMode) this.release();
    };
    this.input.keyboard.on("keydown-SPACE", down);
    this.input.keyboard.on("keyup-SPACE", up);
    this.events.once("shutdown", () => {
      this.input.keyboard.off("keydown-SPACE", down);
      this.input.keyboard.off("keyup-SPACE", up);
    });
    drawingInterruptions(this, () => this.cancelHold());
    this.collectedIcons = MATERIALS.map((id, i) =>
      snowPart(this, materialPart[id], 500 + i * 100, 190, id === "rocks" ? 30 : 65)
    );
    this.round();
    sayHelp(this, DIALOGUE.snowSlideHelp[0]);
  }
  round() {
    this.currentMaterial = nextMaterial(this.found);
    this.collectedIcons.forEach((icon, i) => icon.setAlpha(this.found.includes(MATERIALS[i]) ? 1 : .25));
    this.penguin.setPosition(180, 455).setAngle(0);
    if (!this.currentMaterial) {
      store.set("snowBuilderUnlocked", true);
      this.targetRing.setVisible(false);
      this.material.setVisible(false);
      this.modeButton.setVisible(false);
      this.feedback.setText("Twigs, carrot, rocks — we have everything!");
      this.holdButton.setFillStyle(0xf9df70).setAlpha(1);
      this.holdLabel.setText("Build our\nsnow friend").setColor("#30304c");
      this.instructions.setText("The snowman builder is yours to use whenever you like.");
      return;
    }
    const target = SLIDE_TARGETS[MATERIALS.indexOf(this.currentMaterial)];
    const x = 180 + 840 * target;
    this.targetRing.setPosition(x, 462).setDisplaySize(840 * SLIDE_TOLERANCE * 2, 65);
    this.material.destroy();
    this.material = snowPart(
      this,
      materialPart[this.currentMaterial],
      x,
      430,
      this.currentMaterial === "rocks" ? 45 : 85,
    );
    this.feedback.setText(
      `Let's collect ${this.currentMaterial === "carrot" ? "the carrot" : this.currentMaterial}.`,
    );
    this.refreshButton();
  }
  refreshButton() {
    if (!this.currentMaterial) return;
    this.holdButton.setFillStyle(this.holding ? 0x49784f : 0x66418d).setAlpha(this.sliding ? .65 : 1);
    this.holdLabel.setText(
      this.sliding
        ? "Stopped!"
        : this.holding
        ? (this.tapMode ? "Tap to\nstop!" : "Let go!")
        : (this.tapMode ? "Tap to\nstart" : "Hold to\nslide"),
    );
  }
  press() {
    if (this.blocked || this.sliding) return;
    if (!this.currentMaterial) {
      this.scene.start("SnowmanBuilder");
      return;
    }
    if (this.tapMode && this.holding) {
      this.release();
      return;
    }
    if (this.holding) return;
    this.holding = true;
    this.elapsed = 0;
    this.refreshButton();
  }
  cancelHold() {
    this.holding = false;
    this.holdPointer = null;
    this.elapsed = 0;
    if (!this.sliding) this.penguin?.setPosition(180, 455).setAngle(0);
    if (this.holdButton) this.refreshButton();
  }
  setBlocked(value) {
    if (value) this.cancelHold();
    super.setBlocked(value);
    if (this.tweens) value ? this.tweens.pauseAll() : this.tweens.resumeAll();
  }
  release() {
    if (!this.holding || this.blocked || this.sliding) return;
    const power = slidePower(this.elapsed);
    this.holding = false;
    this.sliding = true;
    this.refreshButton();
    const hit = slideHits(power, this.currentMaterial);
    // Stop exactly where the penguin was when released, not a second launch.
    this.penguin.x = 180 + 840 * power;
    this.tweens.add({
      targets: this.penguin,
      angle: 0,
      duration: this.registry.get("reducedMotion") ? 0 : 180,
      ease: "Cubic.Out",
      onComplete: () => {
        if (hit) {
          this.found = materialsFound([...this.found, this.currentMaterial]);
          store.batch(() => {
            store.set("snowMaterials", this.found);
            if (this.found.length === 3) store.set("snowBuilderUnlocked", true);
          });
          this.feedback.setText("Got them! Back to our snow pile.");
          if (this.ui.effectsOn) this.sound.play("bubblePop", { volume: .3 });
        } else this.feedback.setText("Another slide! Let go in the green patch.");
        this.time.delayedCall(800, () => {
          this.sliding = false;
          this.elapsed = 0;
          this.round();
        });
      },
    });
  }
  update(_time, delta) {
    if (!this.holding || this.blocked) return;
    this.elapsed += Math.min(delta, 60);
    const power = slidePower(this.elapsed);
    this.penguin.x = 180 + 840 * power;
    this.penguin.angle = this.registry.get("reducedMotion") ? 0 : (this.elapsed % 3400 < 1700 ? 12 : -12);
  }
  hint() {
    this.ui.status(this.instructions.text);
  }
}

export class SnowmanBuilder extends PuzzleScene {
  constructor() {
    super("SnowmanBuilder");
  }
  create() {
    if (!snowUnlocked(store.get("snowMaterials"), store.get("snowBuilderUnlocked"))) {
      this.scene.start("FrozenPond");
      return;
    }
    this.setup(
      "Our snow friend",
      "Make a snow friend",
      "Drag a piece, or tap a piece then tap the snow.",
      "FrozenPond",
    );
    backdrop(this);
    this.pieces = validSnowPieces(store.get("snowPieces"));
    this.history = [];
    this.selected = null;
    this.drag = null;
    this.preview = null;
    this.rendered = [];
    this.add.rectangle(1010, 392, 330, 506, 0xfff9e9, .97);
    this.add.ellipse(490, 622, 490, 46, 0x83a9c1, .16);
    this.guides = BODY_PARTS.map((kind) => {
      const part = SNOW_PARTS[kind];
      return snowPart(this, kind, part.x, part.y).setAlpha(.17);
    });
    this.tray = Object.keys(SNOW_PARTS).map((kind, i) => {
      const x = 930 + i % 2 * 158, y = 205 + Math.floor(i / 2) * 119;
      const icon = snowPart(this, kind, x, y, kind === "rock" ? 38 : 88).setDepth(12);
      if (icon.displayHeight > 75) icon.setScale(75 / icon.height);
      this.add.text(x, y + 43, SNOW_PARTS[kind].label, { ...font, fontSize: "22px" }).setOrigin(.5).setDepth(
        12,
      );
      return { kind, x, y, icon };
    });
    this.selection = this.add.graphics().setDepth(11);
    this.done = this.button(630, 751, "Keep decorating", () => {
      if (snowmanReady(this.pieces)) {
        store.set("snowmanDone", true);
        this.scene.start("FrozenPond");
      }
    });
    this.undoButton = this.button(1030, 751, "Undo", () => {
      if (!this.history.length) return;
      this.pieces = this.history.pop();
      this.save();
    });
    this.redraw();
    this.input.on("pointerdown", (p) => this.begin(p));
    this.input.on("pointermove", (p) => this.move(p));
    this.input.on("pointerup", (p) => this.end(p));
    this.input.on("pointerupoutside", () => this.cancelDrag());
    drawingInterruptions(this, () => this.cancelDrag());
    sayHelp(this, DIALOGUE.snowBuildHelp[0]);
  }
  begin(p) {
    if (this.blocked || this.drag || p.y < 145 || p.y > 647) return;
    if (p.x >= 845) {
      const slot = this.tray.find((s) => Math.abs(p.x - s.x) < 76 && Math.abs(p.y - s.y) < 58);
      if (!slot) return;
      this.selected = slot.kind;
      this.selection.clear().lineStyle(4, 0xe6ad24).strokeRoundedRect(slot.x - 64, slot.y - 53, 128, 105, 8);
      this.drag = { id: p.id, kind: slot.kind, index: -1, x: p.x, y: p.y, moved: false, fromTray: true };
      return;
    }
    if (this.selected) {
      this.drag = { id: p.id, kind: this.selected, index: -1, x: p.x, y: p.y, moved: true };
      this.move(p);
      return;
    }
    const radius = Math.max(22, 20 * worldPerPixel(this));
    const item = [...this.rendered].reverse().find(({ sprite }) => {
      const bounds = sprite.getBounds();
      return p.x >= bounds.x - radius && p.x <= bounds.right + radius &&
        p.y >= bounds.y - radius && p.y <= bounds.bottom + radius;
    });
    if (item) {
      this.drag = {
        id: p.id,
        kind: this.pieces[item.index].kind,
        index: item.index,
        x: p.x,
        y: p.y,
        moved: false,
      };
    }
  }
  move(p) {
    const d = this.drag;
    if (!d || d.id !== p.id || this.blocked) return;
    if (Math.hypot(p.x - d.x, p.y - d.y) > 8) d.moved = true;
    if (!d.moved) return;
    this.preview ??= snowPart(this, d.kind, p.x, p.y).setAlpha(.85).setDepth(20);
    this.preview.setPosition(p.x, p.y).setFlipX(d.kind === "twig" && p.x > 490);
  }
  end(p) {
    const d = this.drag;
    if (!d || d.id !== p.id) return;
    if (d.moved && !this.blocked) {
      const before = this.pieces;
      if (p.x < 845 && p.x >= 120 && p.y >= 155 && p.y <= 645) {
        this.pieces = placeSnowPiece(this.pieces, d.kind, p.x, p.y, d.index);
      } else if (p.x >= 845 && d.index >= 0) {
        this.pieces = this.pieces.filter((_piece, i) => i !== d.index);
      }
      if (JSON.stringify(before) !== JSON.stringify(this.pieces)) {
        this.history.push(before);
        if (this.history.length > 40) this.history.shift();
        this.selected = null;
        this.selection.clear();
        this.save();
      }
    }
    this.cancelDrag();
  }
  cancelDrag() {
    this.drag = null;
    this.preview?.destroy();
    this.preview = null;
  }
  setBlocked(value) {
    if (value) this.cancelDrag();
    super.setBlocked(value);
  }
  save() {
    store.set("snowPieces", this.pieces);
    this.redraw();
  }
  redraw() {
    this.rendered.forEach(({ sprite }) => sprite.destroy());
    this.rendered = this.pieces.map((p, index) => ({
      index,
      sprite: snowPart(this, p.kind, p.x, p.y).setFlipX(p.flip).setDepth(SNOW_PARTS[p.kind].depth),
    })).sort((a, b) => a.sprite.depth - b.sprite.depth);
    this.guides.forEach((g, i) => g.setVisible(!this.pieces.some((p) => p.kind === BODY_PARTS[i])));
    const ready = snowmanReady(this.pieces);
    this.done.setText(ready ? "See our snow friend →" : "Add the three snowballs");
    this.done.setStyle({ backgroundColor: ready ? "#f9df70" : "#e4eaf0" }).setAlpha(ready ? 1 : .65);
    this.feedback.setText(
      ready
        ? "Ready whenever you are. You can keep decorating!"
        : "The pale shapes show where the snowballs go.",
    );
    this.undoButton.setAlpha(this.history.length ? 1 : .45);
  }
  leave() {
    this.cancelDrag();
    super.leave();
  }
  hint() {
    this.ui.status(
      "Stack the three snowballs. Add arms, a face, or flowers! Drag a piece back to the tray to remove it.",
    );
  }
}
