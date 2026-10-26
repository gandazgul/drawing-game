import { store } from "@gandazgul/caper-engine";
import { WorldScene } from "./WorldScene.js";
import { font, line } from "../art.js";
import { DIALOGUE } from "../dialogue.js";
import { worldTarget } from "../WorldInteraction.js";
import { workshopWallArt } from "../WorkshopWalls.js";
import { validStrokes } from "../state.js";
import { drawingInterruptions, traceTouch, worldPerPixel } from "../touch-input.js";
import {
  darknessCleared,
  nearPath,
  STUDIO_GAP,
  STUDIO_STAIRS,
  studioCoverage,
  studioCrayon,
  studioStrokeColor,
  studioWalkable,
  validRub,
} from "../puzzles/workshop.js";

export class StudioDark extends WorldScene {
  constructor() {
    super({
      key: "StudioDark",
      backgroundsByChapter: { paint: "studioDark" },
      walkable: studioWalkable(false, false),
      // The cutaway is zoomed out, but both girls still fit the upstairs doorway.
      characterScales: { keila: 0.14, olivia: 0.145 },
      companionSpacing: 80,
      activeCharacter: { startPosition: { x: 210, y: 700 } },
      props: [],
    });
  }
  create(data = {}) {
    if (!store.get("studioPictureDone")) return this.scene.start("StudioGallery");
    this.stairsDone = store.get("studioStairsDone") === true;
    this.gapDone = this.stairsDone && store.get("studioGapDone") === true;
    this.layoutVariant = `stairs-${this.stairsDone}-gap-${this.gapDone}`;
    this.sceneConfig.walkable = studioWalkable(this.stairsDone, this.gapDone);
    this.sceneConfig.activeCharacter.startPosition =
      data.fromWorkroom && this.gapDone ? { x: 180, y: 310 } : { x: 210, y: 700 };
    this.stroke = null;
    this.pointerId = null;
    this.fogTexture = null;
    this.rubs = null;
    super.create(data);
    this.ui.setScene(this, "Bounka's hidden workshop");
    this.detachWalking();
    workshopWallArt(this);
    this.rubs = validRub(store.get("studioDarkErased"));
    // Existing repaired rooms remain revealed when loading older saves.
    this.darkCleared =
      store.get("studioDarkCleared") === true || this.stairsDone || darknessCleared(this.rubs);
    if (this.darkCleared) store.set("studioDarkCleared", true);
    this.rubKeys = new Set(this.rubs.map((p) => `${p.x},${p.y}`));
    this.stairStrokes = validStrokes(store.get("studioStairStrokes"));
    this.gapStrokes = validStrokes(store.get("studioGapStrokes"));
    this.ink = this.add.graphics().setDepth(4);
    this.drawPaths();
    this.makeFog();
    this.note = this.add
      .text(600, 38, "", {
        ...font,
        fontSize: "25px",
        backgroundColor: "#fff9e9",
        padding: { x: 14, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(81);
    const back = () => this.go("StudioGallery", { x: 125, y: 700 });
    const next = () => {
      if (!this.gapDone) return this.hint();
      this.go("StudioWorkroom", { x: 125, y: 310 });
    };
    worldTarget(this, "lower-door", { x: 70, y: 510, w: 130, h: 190 }, back).setDepth(52);
    worldTarget(this, "upper-door", { x: 70, y: 170, w: 115, h: 140 }, next).setDepth(52);
    this.input.on("pointerdown", (p) => this.down(p));
    this.input.on("pointermove", (p) => this.move(p));
    this.input.on("pointerup", (p) => {
      if (p.id === this.pointerId) this.finishGesture(true);
    });
    this.input.on("pointerupoutside", () => this.finishGesture(false));
    drawingInterruptions(this, () => this.finishGesture(false));
    this.events.on("update", this.refreshFog, this);
    this.events.once("shutdown", () => {
      this.events.off("update", this.refreshFog, this);
      store.set("studioDarkErased", this.rubs);
      this.textures.remove("studioFog");
      this.fogTexture = null;
    });
    this.setMode(this.darkCleared ? "walk" : "erase");
    if (!store.get("studioDarkSeen")) {
      this.ui.dialogue(DIALOGUE.studioDarkHelp, () => store.set("studioDarkSeen", true));
    }
  }
  detachWalking() {
    this.input.off("pointerdown", this.walk._onPointerDown);
  }
  switchSister(id) {
    super.switchSister(id);
    this.detachWalking();
  }
  setMode(mode) {
    this.finishGesture(false);
    this.mode = mode;
    if (mode !== "walk") {
      this.walk.stopWalking();
      for (const c of this.idleCharacters) c.walker.stopWalking();
    }
    this.note.setText(
      mode === "erase"
        ? "Rub the darkness to find our drawings and the missing path."
        : mode === "draw"
          ? "Trace the pale line. Tap away from it to walk."
          : this.gapDone
            ? "Walk across your bridge to the purple door."
            : this.stairsDone
              ? "Walk upstairs, then tap the pale gap to draw a bridge."
              : "Tap the pale steps to draw them. Tap the floor to walk.",
    );
    this.ui.status(this.note.text);
  }
  beginDraw() {
    if (!this.darkCleared) return;
    if (this.gapDone) {
      this.setMode("walk");
      return;
    }
    if (this.stairsDone && this.walk.sprite.y > 350) {
      this.setMode("walk");
      this.note.setText("First walk up the steps to the right-hand platform.");
      return;
    }
    this.setMode("draw");
  }
  down(p) {
    if (this.blocked || this.editor.active || this.pointerId != null) return;
    if (this.input.hitTestPointer(p).length) return;
    if (this.darkCleared) {
      const point = { x: p.worldX, y: p.worldY };
      const radius = Math.max(35, 24 * worldPerPixel(this));
      const path = this.stairsDone ? STUDIO_GAP : STUDIO_STAIRS;
      if (!this.gapDone && nearPath(point, path, radius)) {
        if (this.mode !== "draw") this.beginDraw();
        if (this.mode !== "draw") return;
      } else if (this.mode === "draw") this.setMode("walk");
    }
    if (this.mode === "walk") {
      this.walk.handleSceneClick(p);
      return;
    }
    this.pointerId = p.id;
    this.previous = null;
    if (this.mode === "draw") {
      this.stroke = [];
      (this.stairsDone ? this.gapStrokes : this.stairStrokes).push(this.stroke);
    }
    this.touch(p);
  }
  move(p) {
    if (p.isDown && p.id === this.pointerId && !this.blocked && !this.editor.active) this.touch(p);
  }
  touch(pointer) {
    const p = { x: pointer.worldX, y: pointer.worldY };
    if (p.x < 0 || p.x > 1200 || p.y < 75 || p.y > 720) {
      this.previous = null;
      return;
    }
    if (this.mode === "erase") {
      const a = this.previous ?? p,
        n = Math.max(1, Math.ceil(Math.hypot(p.x - a.x, p.y - a.y) / 22));
      for (let i = 0; i <= n; i++) {
        const q = {
          x: Math.round((a.x + ((p.x - a.x) * i) / n) / 10) * 10,
          y: Math.round((a.y + ((p.y - a.y) * i) / n) / 10) * 10,
        };
        const key = `${q.x},${q.y}`;
        if (!this.rubKeys.has(key) && this.rubs.length < 6000) {
          this.rubKeys.add(key);
          this.rubs.push(q);
          this.cut(this.permanent.getContext("2d"), q.x, q.y, 78);
        }
      }
      this.previous = p;
      this.fogDirty = true;
    } else if (this.mode === "draw" && this.stroke) {
      const path = this.stairsDone ? STUDIO_GAP : STUDIO_STAIRS;
      const q = traceTouch(p, path, worldPerPixel(this), pointer.wasTouch);
      if (!q) {
        this.previous = null;
        return;
      }
      // Reject far-away strokes rather than counting a shortcut through the wall.
      const near = studioCoverage(path, [[q]]).ratio;
      if (!near) {
        this.previous = null;
        return;
      }
      if (this.previous && Math.hypot(q.x - this.previous.x, q.y - this.previous.y) > 100) {
        this.previous = null;
      }
      if (!this.previous && this.stroke.length) {
        this.stroke = [];
        (this.stairsDone ? this.gapStrokes : this.stairStrokes).push(this.stroke);
      }
      this.stroke.push({ ...q, c: studioCrayon(store.getActiveCharacter()) });
      this.previous = q;
      this.drawPaths();
    }
  }
  finishGesture(check) {
    if (!this.rubs) return;
    store.set("studioDarkErased", this.rubs);
    store.set("studioStairStrokes", this.stairStrokes);
    store.set("studioGapStrokes", this.gapStrokes);
    const drawing = this.stroke != null;
    this.stroke = null;
    this.pointerId = null;
    this.previous = null;
    if (check && !this.darkCleared && darknessCleared(this.rubs)) {
      this.darkCleared = true;
      store.set("studioDarkCleared", true);
      this.fog.setVisible(false);
      this.setMode("walk");
      return;
    }
    if (!check || !drawing || this.gapDone) return;
    const path = this.stairsDone ? STUDIO_GAP : STUDIO_STAIRS,
      strokes = this.stairsDone ? this.gapStrokes : this.stairStrokes;
    if (!studioCoverage(path, strokes).complete()) return;
    const stairs = !this.stairsDone;
    if (stairs) this.stairsDone = true;
    else this.gapDone = true;
    store.set(stairs ? "studioStairsDone" : "studioGapDone", true);
    this.setWalkable(studioWalkable(this.stairsDone, this.gapDone));
    this.drawPaths();
    this.setMode("walk");
    this.ui.speak(...(stairs ? DIALOGUE.studioStairsReady : DIALOGUE.studioBridgeReady)[0]);
  }
  drawPaths() {
    this.ink.clear();
    [
      [STUDIO_STAIRS, this.stairsDone, this.stairStrokes],
      [STUDIO_GAP, this.gapDone, this.gapStrokes],
    ].forEach(([path, done, strokes]) => {
      for (let i = 1; i < path.length; i++) {
        line(this.ink, path[i - 1], path[i], done ? 0x66418d : 0xfff9e9, done ? 20 : 14);
        if (!done) line(this.ink, path[i - 1], path[i], 0x7250a0, 2);
      }
      for (const stroke of strokes) {
        stroke.forEach((p, i) => line(this.ink, stroke[i - 1] ?? p, p, studioStrokeColor(p), 10));
      }
    });
  }
  cut(ctx, x, y, radius) {
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x / 2, y / 2, radius / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  makeFog() {
    this.permanent = document.createElement("canvas");
    this.permanent.width = 600;
    this.permanent.height = 400;
    const ctx = this.permanent.getContext("2d");
    ctx.fillStyle = "#191b30";
    ctx.fillRect(0, 0, 600, 400);
    for (const p of this.rubs) this.cut(ctx, p.x, p.y, 78);
    if (this.textures.exists("studioFog")) this.textures.remove("studioFog");
    this.fogTexture = this.textures.createCanvas("studioFog", 600, 400);
    this.fog = this.add.image(600, 400, "studioFog").setDisplaySize(1200, 800).setDepth(50);
    this.fogDirty = true;
    this.lastLights = "";
  }
  refreshFog() {
    if (!this.fogTexture) return;
    this.fog.setVisible(!this.darkCleared && !this.editor.active);
    if (this.darkCleared) return;
    if (this.editor.active) {
      if (this.pointerId != null) this.finishGesture(false);
      return;
    }
    const sprites = [this.walk.sprite, ...this.idleCharacters.map((c) => c.sprite)];
    const key = sprites.map((s) => `${Math.round(s.x / 3)},${Math.round(s.y / 3)}`).join(";");
    if (!this.fogDirty && key === this.lastLights) return;
    const ctx = this.fogTexture.context;
    ctx.clearRect(0, 0, 600, 400);
    ctx.drawImage(this.permanent, 0, 0);
    for (const s of sprites) this.cut(ctx, s.x, s.y - s.displayHeight / 2, 120);
    this.fogTexture.refresh();
    this.fogDirty = false;
    this.lastLights = key;
  }
  go(destination, target) {
    this.finishGesture(false);
    this.setMode("walk");
    this.ui.setBusy(true);
    let remaining = this.idleCharacters.length + 1;
    [this.walk, ...this.idleCharacters.map((c) => c.walker)].forEach((w, i) => {
      w.unlock();
      w.walkTo({ x: target.x + i * this.sceneConfig.companionSpacing, y: target.y }, () => {
        w.lock();
        if (--remaining === 0) {
          this.ui.setBusy(false);
          this.scene.start(destination);
        }
      });
    });
  }
  setBlocked(value) {
    this.finishGesture(false);
    super.setBlocked(value);
  }
  hint() {
    this.ui.dialogue(
      this.gapDone
        ? DIALOGUE.studioBridgeReady
        : this.stairsDone
          ? DIALOGUE.studioGapHelp
          : DIALOGUE.studioDarkHelp,
    );
  }
}
