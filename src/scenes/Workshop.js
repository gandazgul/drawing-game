import { store } from "@caper/engine";
import { WorldScene } from "./WorldScene.js";
import { drawing } from "../DrawnWorld.js";
import { objectTarget, worldTarget } from "../WorldInteraction.js";
import { DIALOGUE } from "../dialogue.js";
import { line } from "../art.js";
import {
  HOME_DOOR,
  HOME_PATCH,
  studioCoverage,
  studioCrayon,
  studioStrokeColor,
} from "../puzzles/workshop.js";
import { validStrokes } from "../state.js";
import { PuzzleScene } from "./PuzzleScene.js";
import { drawingInterruptions, traceTouch, worldPerPixel } from "../touch-input.js";
import { playAmuletClimax } from "../AmuletCelebration.js";
import { climaxPending } from "../puzzles/amulet-climax.js";

function config(key, background) {
  return {
    key,
    backgroundsByChapter: { paint: background },
    walkable: [{ x: 90, y: 540 }, { x: 1110, y: 540 }, { x: 1110, y: 740 }, { x: 90, y: 740 }],
    // Child-height beside the painted doors and workbench, not miniature visitors.
    characterScales: { keila: .22, olivia: .227 },
    companionSpacing: 120,
    activeCharacter: { startPosition: { x: 260, y: 650 } },
    props: [],
  };
}
export class StudioGallery extends WorldScene {
  constructor() {
    super(config("StudioGallery", "studioGallery"));
  }
  create(data) {
    if (!store.get("forestTrailDone")) return this.scene.start("ForestTrail");
    super.create(data);
    this.ui.setScene(this, "Bounka's picture room");
    const done = store.get("studioPictureDone") === true;
    const image = this.add.image(600, 287, "house");
    const src = this.textures.get("house").getSourceImage();
    image.setScale(Math.min(520 / src.width, 275 / src.height)).setDepth(2);
    if (!done) {
      const g = this.add.graphics().setDepth(3);
      const b = image.getBounds();
      g.fillStyle(0xb397bb).fillRect(b.x, b.y, b.width, b.height);
      for (let y = b.y + 10; y < b.bottom; y += 18) {
        line(g, { x: b.x + 5, y }, { x: b.right - 5, y: y - 7 }, 0x7250a0, 5);
      }
    }
    objectTarget(this, "picture", image, () => {
      if (done) this.ui.dialogue(DIALOGUE.studioPictureThanks);
      else this.scene.start("WorkshopPicture");
    }, { x: 600, y: 560 });
    worldTarget(this, "right-door", { x: 1010, y: 230, w: 150, h: 320 }, () => {
      if (done) this.scene.start("StudioDark");
      else this.ui.dialogue(DIALOGUE.studioPictureHelp);
    }, { x: 1050, y: 550 });
    worldTarget(
      this,
      "front-door",
      { x: 20, y: 220, w: 180, h: 310 },
      () => this.scene.start("StudioApproach"),
      { x: 120, y: 550 },
    );
    this.ui.status(
      done
        ? "The picture is whole. The right-hand door is ready."
        : "Tap the covered picture to uncover and repair it.",
    );
    if (!store.get("studioGallerySeen")) {
      this.ui.dialogue(DIALOGUE.studioPictureHelp, () => store.set("studioGallerySeen", true));
    }
  }
  hint() {
    this.ui.dialogue(
      store.get("studioPictureDone") ? DIALOGUE.studioPictureThanks : DIALOGUE.studioPictureHelp,
    );
  }
}

export class StudioWorkroom extends WorldScene {
  constructor() {
    super(config("StudioWorkroom", "studioWorkroom"));
  }
  create(data) {
    if (!store.get("studioGapDone")) return this.scene.start("StudioDark");
    this.climaxRunning = false;
    this.scriptedTravel = false;
    this.climaxPhase = null;
    super.create(data);
    this.ui.setScene(this, "Making something with Bounka");
    const bounka = this.bounka = drawing(
      this,
      store.get("studioKindEyes") ? "bounkaKind" : "bounka",
      880,
      660,
      210,
      5,
    );
    drawing(this, "flowerVase", 315, 382, 60, 4);
    const done = store.get("studioHomeDone") === true;
    const house = drawing(this, "house", 500, 420, 180, 4);
    const scale = 180 / 530;
    const map = (p) => ({ x: 500 + (p.x - 600) * scale, y: 420 + (p.y - 610) * scale });
    const patch = map(HOME_PATCH);
    this.add.rectangle(patch.x, patch.y, HOME_PATCH.w * scale, HOME_PATCH.h * scale, 0xfff9e9).setDepth(5);
    const door = this.add.graphics().setDepth(6).setName("saved-mouse-door");
    if (done) door.fillStyle(0x292b4b).fillPoints(HOME_DOOR.map(map), true);
    else HOME_DOOR.slice(1).forEach((p, i) => line(door, map(HOME_DOOR[i]), map(p), 0x7250a0, 1));
    for (const stroke of validStrokes(store.get("studioHomeStrokes"))) {
      stroke.forEach((p, i) =>
        line(door, map(stroke[i - 1] ?? p), map(p), studioStrokeColor(p, 0xe26487), 12 * scale)
      );
    }
    const mouse = drawing(
      this,
      "mouse",
      done ? map({ x: 695, y: 590 }).x : 650,
      done ? map({ x: 695, y: 590 }).y : 400,
      done ? 26 : 75,
      7,
    );
    objectTarget(this, "bounka", bounka, () => this.meet());
    const project = () => {
      if (!store.get("studioGemFound")) this.meet();
      else if (done) this.ui.dialogue(DIALOGUE.studioHomeThanks);
      else this.scene.start("StudioHome");
    };
    objectTarget(this, "little-house", house, project);
    objectTarget(this, "mouse", mouse, project);
    worldTarget(
      this,
      "workroom-door",
      { x: 25, y: 170, w: 155, h: 285 },
      () => this.scene.start("StudioDark", { fromWorkroom: true }),
      { x: 145, y: 545 },
    );
    this.ui.status(
      done
        ? "A finished home, and our heart gem back. You can visit all your friends."
        : store.get("studioTreehouseInvited")
        ? "Our amulet is whole! Bounka wants to finish the tree house together. The little mouse's door is here to try, too."
        : "Tap Bounka, then help finish the little mouse's door.",
    );
    if (climaxPending(store.values)) this.time.delayedCall(0, () => this.meet());
    else if (done && !store.get("studioHomeThanked")) {
      this.ui.dialogue(DIALOGUE.studioHomeThanks, () => store.set("studioHomeThanked", true));
    }
  }
  meet() {
    if (this.climaxRunning) return;
    if (store.get("studioTreehouseInvited")) {
      return this.ui.dialogue(DIALOGUE.endingGo, () => {
        this.scriptedTravel = true;
        this.ui.setBusy(true);
        let remaining = 2;
        const arrive = () => {
          if (--remaining === 0) {
            this.ui.setBusy(false);
            this.scene.start("TreeClearing");
          }
        };
        [this.walk, this.idleCharacters[0].walker].forEach((w, i) => {
          w.unlock();
          w.walkTo({ x: 140 + i * 60, y: 550 }, arrive);
        });
      });
    }
    if (!climaxPending(store.values)) {
      return this.ui.dialogue(
        store.get("studioHomeDone") ? DIALOGUE.studioHomeThanks : DIALOGUE.studioAfterClimax,
      );
    }
    playAmuletClimax(this);
  }
  hint() {
    this.ui.dialogue(store.get("studioHomeDone") ? DIALOGUE.studioHomeThanks : DIALOGUE.studioHomeHelp);
  }
}

export class StudioHome extends PuzzleScene {
  constructor() {
    super("StudioHome");
  }
  create() {
    if (!store.get("studioGemFound")) return this.scene.start("StudioWorkroom");
    this.pointerId = null;
    this.stroke = null;
    this.strokes = null;
    this.setup(
      "A home together",
      "One little thing, finished together",
      "Draw a doorway for our little mouse.",
      "StudioWorkroom",
    );
    this.strokes = validStrokes(store.get("studioHomeStrokes"));
    drawing(this, "house", 600, 610, 530, 1);
    this.add.rectangle(HOME_PATCH.x, HOME_PATCH.y, HOME_PATCH.w, HOME_PATCH.h, 0xfff9e9).setDepth(2);
    this.mouse = drawing(this, "mouse", 930, 595, 110, 5);
    this.ink = this.add.graphics().setDepth(4);
    this.paint();
    this.input.on("pointerdown", (p) => {
      if (this.blocked || this.pointerId != null || p.worldY < 140 || p.worldY > 635) return;
      this.pointerId = p.id;
      this.stroke = [];
      this.strokes.push(this.stroke);
      this.touch(p);
    });
    this.input.on("pointermove", (p) => {
      if (p.id === this.pointerId && p.isDown) this.touch(p);
    });
    this.input.on("pointerup", (p) => {
      if (p.id === this.pointerId) this.finish(true);
    });
    this.input.on("pointerupoutside", () => this.finish(false));
    drawingInterruptions(this, () => this.finish(false));
  }
  touch(p) {
    const q = traceTouch({ x: p.worldX, y: p.worldY }, HOME_DOOR, worldPerPixel(this), p.wasTouch);
    if (q && this.stroke) {
      this.stroke.push({ ...q, c: studioCrayon(store.getActiveCharacter()) });
      this.paint();
    }
  }
  paint() {
    this.ink.clear();
    HOME_DOOR.slice(1).forEach((p, i) => line(this.ink, HOME_DOOR[i], p, 0x7250a0, 3));
    for (const s of this.strokes) {
      s.forEach((p, i) => line(this.ink, s[i - 1] ?? p, p, studioStrokeColor(p, 0xe26487), 12));
    }
  }
  finish(check) {
    if (!this.strokes) return;
    this.pointerId = null;
    this.stroke = null;
    store.set("studioHomeStrokes", this.strokes);
    if (check && studioCoverage(HOME_DOOR, this.strokes).complete()) {
      store.set("studioHomeDone", true);
      this.ink.fillStyle(0x292b4b).fillPoints(HOME_DOOR, true);
      for (const s of this.strokes) {
        s.forEach((p, i) => line(this.ink, s[i - 1] ?? p, p, studioStrokeColor(p, 0xe26487), 12));
      }
      this.mouse.setPosition(695, 590).setScale(this.mouse.scaleX * .45);
      this.ui.setBusy(true);
      this.feedback.setText("A little door, made together!");
      this.time.delayedCall(700, () => {
        this.ui.setBusy(false);
        this.scene.start("StudioWorkroom");
      });
    }
  }
  setBlocked(v) {
    this.finish(false);
    super.setBlocked(v);
  }
  hint() {
    this.ui.dialogue(DIALOGUE.studioHomeHelp);
  }
}
