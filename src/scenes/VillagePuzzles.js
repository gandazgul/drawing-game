import { store } from "@caper/engine";
import { COLORS, drawHeart, font, line } from "../art.js";
import { PuzzleScene } from "./PuzzleScene.js";
import { drawing } from "../DrawnWorld.js";
import { BOX_GOAL, BOX_START, finishTask, slide, taskAvailable, TASKS } from "../village-progress.js";
import { tasks } from "../VillageFlow.js";
import { boxSession } from "../puzzles/box-replay.js";
import { Coverage, traceSamples } from "../puzzles/geometry.js";
import { validStrokes } from "../state.js";
import { cakeBody } from "../CakeView.js";
import {
  MUSIC_TARGETS,
  musicHit,
  musicHits,
  nextMusicTarget,
  paintMusicNote,
} from "../puzzles/birthday-music.js";
import {
  buntingSession,
  jigsawSession,
  LEGACY_PATTERNS,
  newPatterns,
  validAnswers,
  validPatterns,
  validPieces,
} from "../puzzles/village-replay.js";

export const GARDEN_PATH = [
  { x: 200, y: 510 },
  { x: 200, y: 290 },
  { x: 440, y: 290 },
  { x: 440, y: 490 },
  { x: 680, y: 490 },
  { x: 680, y: 250 },
  { x: 980, y: 250 },
];
export const CAKE_PATHS = [545, 600, 655].map((
  x,
) => [{ x, y: 340 }, { x, y: 230 }, { x: x + 22, y: 230 }, { x: x + 22, y: 340 }]);

export class VillagePuzzle extends PuzzleScene {
  constructor() {
    super("VillagePuzzle");
  }
  create() {
    this.id = store.get("villageTask");
    if (this.id === "clue" || this.id === "stairs") {
      this.scene.start("StairRepair");
      return;
    }
    if (!TASKS[this.id] || !taskAvailable(tasks(), this.id)) {
      this.scene.start("Village");
      return;
    }
    const task = TASKS[this.id];
    this.replay = ["rooms", "bunting", "box"].includes(this.id) && tasks().includes(this.id);
    this.replayDataField = { rooms: "placed", bunting: "answers", box: "board" }[this.id];
    this.replayKey = `villageReplay_${this.id}`;
    this.replayState = null;
    if (this.replay) {
      this.replayState = this.id === "box"
        ? boxSession(store.get(this.replayKey))
        : this.id === "rooms"
        ? jigsawSession(store.get(this.replayKey))
        : buntingSession(
          store.get(this.replayKey) ?? { patterns: store.get("village_bunting_layout"), complete: true },
        );
      store.set(this.replayKey, this.replayState);
    }
    this.setup(
      {
        VillageInterior: "Butterfly inn",
        InnGarden: "The inn garden",
        BirthdayYard: "The birthday garden",
        House: "The house",
        HouseLoft: "The house loft",
      }[task.home],
      this.replay && this.id === "rooms" ? "Another picture for the inn" : task.title,
      task.instruction,
      task.home,
    );
    this.ready = !this.replay && tasks().includes(this.id);
    this.finishButton = this.button(957, 751, "Keep going…", () => this.finish());
    this.finishButton.setAlpha(.45);
    this[task.kind]();
    if (this.ready) this.setReady();
    if (this.ui.readAloud) this.ui.voice.play("A little idea", task.instruction);
  }
  savedData(fallback) {
    if (this.replay) return this.replayState[this.replayDataField];
    return store.get(`village_${this.id}`) ?? fallback;
  }
  save(data) {
    if (this.replay) {
      this.replayState[this.replayDataField] = data;
      store.set(this.replayKey, this.replayState);
      return;
    }
    store.set(`village_${this.id}`, data);
  }
  setReady() {
    this.ready = true;
    this.finishButton.setText("See what we made →").setAlpha(1).setBackgroundColor("#d2e9c8");
    this.feedback.setText("Ready! You can finish when you like.");
  }
  finish() {
    if (!this.ready) return;
    if (this.replay) {
      this.replayState.complete = true;
      store.set(this.replayKey, this.replayState);
    } else store.set("villageTasks", finishTask(tasks(), this.id));
    this.leave();
  }
  trace() {
    const paths = this.id === "garden" ? [GARDEN_PATH] : CAKE_PATHS;
    if (this.id === "garden") {
      drawing(this, "bee", 155, 552, 95);
      [[440, 330, "flowerBlue"], [680, 530, "sunflower"], [1010, 320, "birthdayFlowers"]].forEach((
        [x, y, key],
      ) => drawing(this, key, x, y, 105));
    } else cakeBody(this, 600, 635, 280);
    const guide = this.add.graphics().setDepth(3);
    paths.forEach((path) => guide.lineStyle(24, 0x7250a0, .18).strokePoints(path));
    const samples = paths.flatMap((path) => traceSamples(path));
    this.coverage = new Coverage(samples, 16, { endRadius: 10, requiredRatio: .84 });
    this.strokes = validStrokes(this.savedData([]));
    this.ink = this.add.graphics().setDepth(4);
    this.strokes.forEach((stroke) => {
      for (let i = 1; i < stroke.length; i++) {
        line(this.ink, stroke[i - 1], stroke[i], stroke[i].color ?? COLORS[1], 8);
      }
    });
    this.coverage.restore(this.strokes);
    let stroke = null;
    const point = (p) => ({
      x: p.worldX,
      y: p.worldY,
      color: store.getActiveCharacter() === "keila" ? COLORS[1] : COLORS[0],
    });
    const valid = (p) => p.worldY > 165 && p.worldY < 640 && p.worldX > 100 && p.worldX < 1110;
    this.input.on("pointerdown", (p) => {
      if (this.blocked || !valid(p)) return;
      stroke = [point(p)];
      this.strokes.push(stroke);
    });
    this.input.on("pointermove", (p) => {
      if (!stroke || !p.isDown || this.blocked || !valid(p)) return;
      const a = stroke.at(-1), b = point(p);
      line(this.ink, a, b, store.getActiveCharacter() === "keila" ? COLORS[1] : COLORS[0], 8);
      this.coverage.stroke(a, b);
      stroke.push(b);
      this.feedback.setText(`${Math.min(100, Math.round(this.coverage.ratio / .84 * 100))}%`);
      if (this.coverage.ratio >= .84) this.setReady();
    });
    const end = () => {
      if (stroke) {
        this.save(this.strokes);
        stroke = null;
      }
    };
    this.input.on("pointerup", end);
    this.input.on("pointerupoutside", end);
    if (this.coverage.ratio >= .84) this.setReady();
  }
  sort() {
    const raw = this.savedData([]);
    this.sorted = Array.isArray(raw) ? raw.filter((v) => Number.isInteger(v) && v >= 0 && v < 5) : [];
    this.add.text(600, 185, "Smallest                                      Biggest", {
      ...font,
      fontSize: "26px",
    }).setOrigin(.5);
    [0, 1, 2, 3, 4].forEach((id) => {
      const x = 250 + id * 175;
      this.add.rectangle(x, 465, 151, 7, 0x7250a0, .6);
      const img = drawing(
        this,
        "mouse",
        this.sorted.includes(id) ? x : [775, 250, 950, 425, 600][id],
        this.sorted.includes(id) ? 455 : 620,
        65 + id * 28,
        5,
      );
      if (this.sorted.includes(id)) return;
      img.setInteractive({ useHandCursor: true });
      this.input.setDraggable(img);
      const home = { x: img.x, y: img.y };
      img.on("drag", (_p, dx, dy) => {
        img.setPosition(dx, dy);
      });
      img.on("dragend", () => {
        if (Math.abs(img.x - x) < 80 && Math.abs(img.y - 455) < 90) {
          img.setPosition(x, 455).disableInteractive();
          this.sorted.push(id);
          this.save(this.sorted);
          if (this.sorted.length === 5) this.setReady();
        } else img.setPosition(home.x, home.y);
      });
    });
    if (this.sorted.length === 5) this.setReady();
  }
  pattern() {
    const raw = this.savedData([]);
    const savedLayout = store.get("village_bunting_layout");
    this.patterns = this.replay
      ? this.replayState.patterns
      : validPatterns(savedLayout)
      ? savedLayout
      : Array.isArray(raw) && raw.some((n) => Number.isInteger(n))
      ? LEGACY_PATTERNS
      : newPatterns();
    if (!this.replay) store.set("village_bunting_layout", this.patterns);
    this.answers = validAnswers(raw);
    this.paint = 0;
    this.swatches = [];
    this.tiles = [];
    COLORS.forEach((color, i) => {
      const b = this.add.circle(270 + i * 165, 606, 31, color).setStrokeStyle(i === 0 ? 5 : 1, 0x513272)
        .setInteractive({ useHandCursor: true });
      b.on("pointerdown", () => {
        this.paint = i;
        this.swatches.forEach((s, j) => s.setStrokeStyle(i === j ? 5 : 1, 0x513272));
      });
      (this.swatches ??= []).push(b);
    });
    this.patterns.forEach((row, r) =>
      row.forEach((color, c) => {
        const x = 230 + c * 147, y = 220 + r * 125, idx = r * 3 + c - 3;
        const fill = c < 3 ? COLORS[color] : COLORS[this.answers[idx]];
        const triangle = this.add.triangle(x, y, 0, 0, 104, 0, 52, 80, fill ?? 0xfff9e9).setStrokeStyle(
          3,
          0x513272,
        );
        if (c >= 3) {
          triangle.setInteractive({ useHandCursor: true }).on("pointerdown", () => {
            this.answers[idx] = this.paint;
            triangle.setFillStyle(COLORS[this.paint]);
            this.save(this.answers);
            this.checkPattern();
          });
        }
      })
    );
    this.checkPattern();
  }
  checkPattern() {
    if (this.patterns.every((row, r) => row.slice(3).every((v, c) => v === this.answers[r * 3 + c]))) {
      this.setReady();
    } else {
      this.ready = false;
      this.finishButton.setAlpha(.45).setText("Keep going…");
      this.feedback.setText("Copy the repeating colors into the empty flags.");
    }
  }
  timing() {
    drawing(this, "birthdayFriend", 245, 590, 170);
    drawing(this, "cake", 970, 610, 170);
    this.add.rectangle(600, 400, 630, 25, 0xdbcbe8);
    const savedTarget = store.get("village_music_target");
    this.musicTarget = MUSIC_TARGETS.includes(savedTarget) ? savedTarget : nextMusicTarget();
    store.set("village_music_target", this.musicTarget);
    this.musicPatch = this.add.rectangle(this.musicTarget, 400, 145, 46, 0x80bb82).setStrokeStyle(
      3,
      0x45954f,
    );
    this.hits = musicHits(this.savedData(0));
    this.musicResolving = false;
    this.note = this.add.graphics().setPosition(315, 400).setDepth(5).setName("music-note");
    this.resetMusicNote();
    this.button(600, 540, "Play a note", () => this.hit(), "#f4d97d");
    this.input.keyboard.on("keydown-SPACE", (e) => {
      e.preventDefault();
      if (!e.repeat) this.hit();
    });
    this.feedback.setText(`${this.hits} / 5 notes`);
    if (this.hits >= 5) {
      this.note.setVisible(false);
      this.setReady();
    }
  }
  resetMusicNote() {
    this.beat = this.musicTarget > 600 ? -Math.PI / 2 : Math.PI / 2;
    this.note.setPosition(600 + Math.sin(this.beat) * 285, 400).setScale(1).setAlpha(1).setAngle(0);
    paintMusicNote(this.note, 0x513272, this.hits % 2 === 1);
  }
  hit() {
    if (this.blocked || this.musicResolving || this.ready) return;
    this.musicResolving = true;
    const hit = musicHit(this.note.x, this.musicTarget);
    const reduced = this.registry.get("reducedMotion");
    const next = () => {
      if (this.hits === 5) {
        this.musicResolving = false;
        this.note.setVisible(false);
        this.setReady();
        return;
      }
      this.musicTarget = nextMusicTarget(this.musicTarget);
      store.set("village_music_target", this.musicTarget);
      this.tweens.add({
        targets: this.musicPatch,
        x: this.musicTarget,
        duration: reduced ? 0 : 200,
        ease: "Cubic.easeOut",
        onComplete: () => {
          this.resetMusicNote();
          this.musicResolving = false;
        },
      });
    };
    if (hit) {
      this.hits = Math.min(5, this.hits + 1);
      this.save(this.hits);
      this.feedback.setText(`${this.hits} / 5 notes`);
      if (store.get("effectsOn") !== false) {
        this.sound.play("bubblePop", { volume: .24, rate: 1 + this.hits * .1 });
      }
      this.tweens.add({
        targets: this.note,
        ...(reduced ? {} : { x: this.note.x + 120, y: 210, angle: -20, scaleX: .7, scaleY: .7 }),
        alpha: 0,
        duration: reduced ? 180 : 550,
        ease: "Cubic.easeOut",
        onComplete: next,
      });
    } else {
      paintMusicNote(this.note, 0xc43d45, this.hits % 2 === 1);
      this.feedback.setText("Not quite! Try the next note in the green patch.");
      this.time.delayedCall(450, next);
    }
  }
  update(_time, delta) {
    if (this.id === "music" && this.note && !this.blocked && !this.musicResolving && !this.ready) {
      this.beat += Math.min(delta, 40) * .0018;
      this.note.x = 600 + Math.sin(this.beat) * 285;
    }
  }
  slide() {
    const raw = this.savedData(BOX_START);
    this.board = Array.isArray(raw) && raw.length === 6 && new Set(raw).size === 6 &&
        raw.every((v) => Number.isInteger(v) && v >= 0 && v < 6)
      ? raw
      : [...BOX_START];
    this.tiles = [];
    const preview = this.add.image(1010, 325, "blueCat");
    preview.setScale(Math.min(215 / preview.width, 235 / preview.height));
    this.add.text(1010, 500, "The finished picture", { ...font, fontSize: "24px" }).setOrigin(.5);
    const source = this.textures.get("blueCat").getSourceImage();
    for (let n = 1; n <= 5; n++) {
      const key = `box-tile-${n}`;
      if (!this.textures.exists(key)) {
        const t = this.textures.createCanvas(key, 180, 195), c = t.getContext();
        c.fillStyle = "#f9e9bf";
        c.fillRect(0, 0, 180, 195);
        c.drawImage(
          source,
          (n - 1) % 3 * source.width / 3,
          Math.floor((n - 1) / 3) * source.height / 2,
          source.width / 3,
          source.height / 2,
          0,
          0,
          180,
          195,
        );
        t.refresh();
      }
      const tile = this.add.image(0, 0, key).setInteractive({ useHandCursor: true });
      tile.on("pointerdown", () => {
        if (this.blocked || this.ready) return;
        this.board = slide(this.board, this.board.indexOf(n));
        this.save(this.board);
        this.layoutTiles();
      });
      this.tiles[n] = tile;
    }
    this.layoutTiles();
    this.button(595, 751, "Reset picture", () => {
      this.save([...(this.replay ? this.replayState.start : BOX_START)]);
      this.scene.restart();
    });
  }
  layoutTiles() {
    this.board.forEach((n, i) => {
      if (n) this.tiles[n].setPosition(285 + i % 3 * 186, 285 + Math.floor(i / 3) * 201);
    });
    if (this.board.every((n, i) => n === BOX_GOAL[i])) {
      this.setReady();
      drawHeart(this.add.graphics(), 657, 486, 42, 0xe6ad24);
    }
  }
  jigsaw() {
    const raw = this.savedData([]);
    this.placed = new Set(validPieces(raw));
    this.pictureKey = this.replay ? this.replayState.picture : "innPlayable";
    const source = this.textures.get(this.pictureKey).getSourceImage();
    const scaled = document.createElement("canvas");
    scaled.width = 600;
    scaled.height = 400;
    const c = scaled.getContext("2d");
    c.fillStyle = "#fff1cf";
    c.fillRect(0, 0, 600, 400);
    const scale = Math.min(600 / source.width, 400 / source.height);
    c.drawImage(
      source,
      (600 - source.width * scale) / 2,
      (400 - source.height * scale) / 2,
      source.width * scale,
      source.height * scale,
    );
    const previewKey = `inn-jigsaw-preview-${this.pictureKey}`;
    if (!this.textures.exists(previewKey)) this.textures.addCanvas(previewKey, scaled);
    this.add.image(360, 390, previewKey).setAlpha(.18);
    this.add.rectangle(360, 390, 600, 400).setStrokeStyle(3, 0x7250a0);
    for (let i = 0; i < 25; i++) {
      const col = i % 5,
        row = Math.floor(i / 5),
        key = `inn-jigsaw-${this.pictureKey}-${i}`,
        pad = 20,
        w = 120,
        h = 80;
      if (!this.textures.exists(key)) {
        const t = this.textures.createCanvas(key, w + pad * 2, h + pad * 2), ctx = t.getContext();
        ctx.beginPath();
        ctx.moveTo(pad, pad);
        edge(ctx, pad, pad, pad + w, pad, row === 0 ? 0 : -1);
        edge(ctx, pad + w, pad, pad + w, pad + h, col === 4 ? 0 : 1);
        edge(ctx, pad + w, pad + h, pad, pad + h, row === 4 ? 0 : 1);
        edge(ctx, pad, pad + h, pad, pad, col === 0 ? 0 : -1);
        ctx.closePath();
        ctx.save();
        ctx.clip();
        ctx.drawImage(scaled, -col * w + pad, -row * h + pad);
        ctx.restore();
        ctx.strokeStyle = "#7250a0";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        t.refresh();
      }
      const target = { x: 120 + col * w, y: 230 + row * h };
      // A deterministic shuffled tray remains stable when returning to this puzzle.
      const position = this.replay ? this.replayState.order.indexOf(i) : i * 7 % 25,
        home = { x: 744 + position % 5 * 90, y: 205 + Math.floor(position / 5) * 89 };
      const piece = this.add.image(
        this.placed.has(i) ? target.x : home.x,
        this.placed.has(i) ? target.y : home.y,
        key,
      ).setScale(this.placed.has(i) ? 1 : .58).setDepth(4);
      if (this.placed.has(i)) continue;
      piece.setInteractive({ useHandCursor: true });
      this.input.setDraggable(piece);
      piece.on("dragstart", () => piece.setScale(1).setDepth(10));
      piece.on("drag", (_p, x, y) => piece.setPosition(x, y));
      piece.on("dragend", () => {
        if (Math.hypot(piece.x - target.x, piece.y - target.y) < 48) {
          piece.setPosition(target.x, target.y).setDepth(5).disableInteractive();
          this.placed.add(i);
          this.save([...this.placed]);
          this.feedback.setText(`${this.placed.size} / 25 pieces`);
          if (this.placed.size === 25) this.setReady();
        } else piece.setPosition(home.x, home.y).setScale(.58).setDepth(4);
      });
    }
    this.feedback.setText(`${this.placed.size} / 25 pieces`);
    if (this.placed.size === 25) this.setReady();
  }
  hint() {
    this.ui.status(TASKS[this.id].instruction);
    if (this.ui.readAloud) this.ui.voice.play("A little idea", TASKS[this.id].instruction);
  }
}

// Same interlocking construction as Bears: outward tabs have complementary inward neighbors.
function edge(ctx, x1, y1, x2, y2, type) {
  const dx = x2 - x1,
    dy = y2 - y1,
    l = Math.hypot(dx, dy),
    ux = dx / l,
    uy = dy / l,
    nx = uy,
    ny = -ux,
    h = type * 15;
  const p = (t, a = 0) => [x1 + ux * l * t + nx * a, y1 + uy * l * t + ny * a];
  if (!type) {
    ctx.lineTo(x2, y2);
    return;
  }
  ctx.lineTo(...p(.35));
  ctx.bezierCurveTo(...p(.35, -h * .1), ...p(.35, h), ...p(.5, h));
  ctx.bezierCurveTo(...p(.65, h), ...p(.65, -h * .1), ...p(.65));
  ctx.lineTo(x2, y2);
}
