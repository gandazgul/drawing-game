import { store } from "@gandazgul/caper-engine";
import { WorldScene } from "./WorldScene.js";
import { drawing, drawnCritters, treeFruit } from "../DrawnWorld.js";
import { exitArrow, objectTarget, worldTarget } from "../WorldInteraction.js";
import { bearDance, createBear, forestMarks } from "../ForestView.js";
import {
  DANCE_PATH,
  danceWorld,
  forestWalkable,
  WOODLAND_PATH,
  WOODLAND_STONES,
  woodlandWalkable,
} from "../puzzles/forest.js";
import { validStrokes } from "../state.js";
import { DIALOGUE } from "../dialogue.js";
import { font, line } from "../art.js";

function config(key, background) {
  return {
    key,
    backgroundsByChapter: { paint: background },
    walkable: forestWalkable(false),
    characterScales: { keila: 0.19, olivia: 0.197 },
    companionSpacing: 95,
    activeCharacter: { startPosition: { x: 270, y: 720 } },
    props: [],
  };
}
function prompt(scene, key, lines) {
  if (!store.get(key)) scene.ui.dialogue(lines, () => store.set(key, true));
}
// World traversal uses Caper walkers and repaired walkable polygons. No teleport
// button across the repair: both sisters arrive at the far edge before changing scenes.
function onward(scene, destination, target = { x: 1080, y: 560 }, spacing = 55) {
  if (scene.blocked || scene.editor.active) return;
  scene.ui.setBusy(true);
  let arrived = 0;
  const walkers = [scene.walk, ...scene.idleCharacters.map((c) => c.walker)];
  for (const [i, walker] of walkers.entries()) {
    walker.unlock();
    walker.walkTo({ x: target.x - i * spacing, y: target.y + i * 12 }, () => {
      walker.lock();
      if (++arrived === walkers.length) {
        scene.ui.setBusy(false);
        scene.scene.start(destination);
      }
    });
  }
}
function flowers(scene) {
  drawing(scene, "flowerBlue", 1120, 740, 72, 4);
  drawing(scene, "plant", 74, 600, 62, 4);
  drawnCritters(scene, [
    ["heartButterfly", 600, 215, 62],
    ["bug", 1020, 710, 45, "ground"],
    ["tealButterfly", 805, 220, 82],
  ]);
}

// Found-object trees and the makers' house remain separate editor-movable art.
// The background plate no longer contains the generated cottage.
function woodlandArt(scene) {
  drawing(scene, "grapevineTree", 210, 475, 350, 1);
  treeFruit(scene, [
    [120, 135, 39, -12],
    [236, 211, 34, 9],
    [1070, 174, 39, -7],
    [1150, 110, 32, 12],
  ]);
  return drawing(scene, "studioExterior", 950, 360, 230, 1);
}

export class ForestEdge extends WorldScene {
  constructor() {
    super(config("ForestEdge", "forestGrove"));
  }
  create(data = {}) {
    const done = store.get("forestDanceDone") === true;
    this.layoutVariant = done ? "repaired" : "unfinished";
    this.sceneConfig.walkable = forestWalkable(done);
    super.create(data);
    this.ui.setScene(this, "The dancing grove");
    drawing(this, "grapevineTree", 210, 565, 370, 1);
    treeFruit(this, [
      [94, 170, 43, -10],
      [213, 232, 35, 12],
      [1030, 151, 41, 8],
      [1135, 230, 36, -9],
    ]);
    flowers(this);
    const guide = this.add.graphics().setDepth(1);
    guide.lineStyle(done ? 34 : 28, 0xfff9e9, 0.8).strokePoints(DANCE_PATH.map(danceWorld));
    if (!done) guide.lineStyle(3, 0x513272, 0.7).strokePoints(DANCE_PATH.map(danceWorld));
    forestMarks(this, validStrokes(store.get("forestStrokes")), true);
    this.bear = createBear(this, done ? 990 : 460, done ? 500 : 570, 255);
    objectTarget(this, "ballerina", this.bear, () => {
      if (done) this.dance();
      else this.scene.start("ForestDraw");
    });
    DANCE_PATH.map(danceWorld)
      .slice(1)
      .forEach((p, i) =>
        worldTarget(this, `dance-trail-${i}`, { x: p.x - 50, y: p.y - 24, w: 100, h: 60 }, () => {
          if (done) onward(this, "ForestTrail");
          else this.scene.start("ForestDraw");
        }),
      );
    exitArrow(this, "village", 85, 735, () => this.scene.start("Village"));
    exitArrow(
      this,
      "woodland",
      1110,
      565,
      () => {
        if (done) onward(this, "ForestTrail");
        else this.ui.dialogue(DIALOGUE.forestBearHelp);
      },
      "right",
    );
    this.ui.status(
      done
        ? "Tap the bear for another dance, or follow the trail to the right."
        : "Tap the bear or her pale trail to help her dance.",
    );
    if (data.dance || (done && !store.get("forestDanceSeen"))) this.dance();
    else if (!done) prompt(this, "forestBearMet", DIALOGUE.forestBearHelp);
  }
  dance() {
    if (this.blocked || this.editor.active) return;
    this.ui.setBusy(true);
    this.ui.speak(...DIALOGUE.forestBearThanks[0]);
    bearDance(this, this.bear, () => {
      store.set("forestDanceSeen", true);
      this.ui.setBusy(false);
      // The editor and hotspot continue to refer to the bear's final position.
      const h = this.hotspots.list().find((h) => h.id === "ballerina");
      const b = this.bear.getBounds(),
        zone = this.hotspots.zones.get("ballerina");
      Object.assign(h.bounds, { x: b.x, y: b.y, w: b.width, h: b.height });
      zone.setPosition(b.x, b.y).setSize(b.width, b.height);
      zone.input.hitArea.setSize(b.width, b.height);
    });
  }
  hint() {
    this.ui.dialogue(store.get("forestDanceDone") ? DIALOGUE.forestBearThanks : DIALOGUE.forestBearHelp);
  }
}

export class ForestTrail extends WorldScene {
  constructor() {
    super(config("ForestTrail", "forestWoodland"));
  }
  create(data = {}) {
    if (!store.get("forestDanceDone")) {
      this.scene.start("ForestEdge");
      return;
    }
    const done = store.get("forestTrailDone") === true;
    this.layoutVariant = done ? "painted-path-repaired-v2" : "painted-path-unfinished-v2";
    this.sceneConfig.walkable = woodlandWalkable(done);
    this.sceneConfig.activeCharacter.startPosition = { x: 300, y: 720 };
    super.create(data);
    for (const walker of [this.walk, ...this.idleCharacters.map((c) => c.walker)]) {
      const p = walker.snapToWalkable(walker.sprite);
      walker.sprite.setPosition(p.x, p.y);
    }
    this.ui.setScene(this, "The woodland trail");
    const cottage = woodlandArt(this);
    flowers(this);
    drawing(this, "scarecrow", 700, 700, 155, 4);
    const friend = drawing(this, "forestCreature", 390, 490, 110, 5);
    objectTarget(this, "woodland-friend", friend, () => {
      if (done) this.ui.dialogue(DIALOGUE.forestFriendThanks);
      else this.scene.start("ForestNumbers");
    });
    const g = this.add.graphics().setDepth(2);
    const stones = WOODLAND_STONES;
    const crossTrail = () => onward(this, "StudioApproach", WOODLAND_PATH.at(-1), 12);
    objectTarget(this, "studio-cottage", cottage, () => {
      if (done) crossTrail();
      else this.ui.dialogue(DIALOGUE.forestFriendHelp);
    });
    if (done) {
      const route = WOODLAND_PATH.slice(4);
      route.slice(1).forEach((p, i) => line(g, route[i], p, 0x45954f, 12));
    }
    stones.forEach((p, i) => {
      g.fillStyle(done ? 0xcee4ba : 0xfff9e9).fillRoundedRect(p.x - 28, p.y - 19, 56, 38, 12);
      g.lineStyle(3, 0x513272).strokeRoundedRect(p.x - 28, p.y - 19, 56, 38, 12);
      this.add
        .text(p.x, p.y, String(i + 1), { ...font, fontSize: "28px" })
        .setOrigin(0.5)
        .setDepth(3);
      worldTarget(this, `woodland-stone-${i}`, { x: p.x - 40, y: p.y - 35, w: 80, h: 70 }, () => {
        this.scene.start("ForestNumbers");
      });
    });
    exitArrow(this, "grove", 85, 735, () => this.scene.start("ForestEdge"));
    if (done) prompt(this, "forestFriendThanked", DIALOGUE.forestFriendThanks);
    else prompt(this, "forestFriendMet", DIALOGUE.forestFriendHelp);
  }
  hint() {
    this.ui.dialogue(store.get("forestTrailDone") ? DIALOGUE.forestFriendThanks : DIALOGUE.forestFriendHelp);
  }
}

export class StudioApproach extends WorldScene {
  constructor() {
    super(config("StudioApproach", "forestWoodland"));
  }
  create(data) {
    if (!store.get("forestTrailDone")) {
      this.scene.start("ForestTrail");
      return;
    }
    this.layoutVariant = "cottage-closeup-v4";
    this.sceneConfig.walkable = [
      { x: 90, y: 645 },
      { x: 560, y: 615 },
      { x: 880, y: 650 },
      { x: 1110, y: 700 },
      { x: 1110, y: 755 },
      { x: 90, y: 755 },
    ];
    this.sceneConfig.activeCharacter.startPosition = { x: 360, y: 710 };
    super.create(data);
    this.ui.setScene(this, "At Bounka's front door");
    // A new composition, not the woodland trail repeated: the source house is
    // almost stage-height and its door is now a child-sized, explicit target.
    this.background.setDisplaySize(1740, 1160);
    drawing(this, "grapevineTree", 185, 590, 360, 1);
    this.house = drawing(this, "studioExterior", 820, 675, 430, 1);
    drawing(this, "sunflower", 1090, 700, 85, 2);
    drawing(this, "flowerVase", 575, 685, 70, 2);
    this.arrivalRunning = false;
    exitArrow(this, "woodland", 85, 735, () => this.scene.start("ForestTrail"));
    worldTarget(
      this,
      "studio-door",
      { x: 760, y: 490, w: 135, h: 180 },
      () => this.scene.start("StudioGallery"),
      { x: 820, y: 665 },
    );
    if (!store.get("forestBounkaMet") && !store.get("studioGemFound")) {
      this.bounka = drawing(this, "bounka", 610, 650, 165, 6);
      this.ui.dialogue(DIALOGUE.forestBounkaArrival, () => this.runInside());
    } else this.explain();
  }
  runInside() {
    if (!this.scene.isActive() || this.arrivalRunning || !this.bounka?.active) return;
    this.arrivalRunning = true;
    this.ui.setBusy(true);
    const actor = this.bounka;
    const finish = () => {
      actor.setVisible(false).setAngle(0);
      this.arrivalRunning = false;
      store.set("forestBounkaMet", true);
      store.set("forestStudioReached", true);
      this.ui.setBusy(false);
      this.ui.dialogue(DIALOGUE.forestFollowBounka);
    };
    const enter = () => {
      actor.setAngle(0);
      this.tweens.add({ targets: actor, alpha: 0, duration: 180, onComplete: finish });
    };
    // One story beat: quick paper-puppet strides to the actual door, then
    // disappear inside. No loops; reduced motion keeps the destination cue.
    if (this.registry.get("reducedMotion")) {
      actor.setPosition(820, 665);
      enter();
    } else {
      this.tweens.add({
        targets: actor,
        x: 820,
        duration: 1000,
        ease: "Sine.easeInOut",
        onUpdate: (tween) => {
          const p = tween.progress;
          actor.y = 650 + p * 15 - Math.abs(Math.sin(p * Math.PI * 5)) * 10;
          actor.angle = Math.sin(p * Math.PI * 10) * 5;
        },
        onComplete: enter,
      });
    }
  }
  explain() {
    this.ui.status("Tap the orange door of the purple house to enter Bounka's workshop.");
  }
  hint() {
    this.explain();
  }
}
