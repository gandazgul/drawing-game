import { store } from "@gandazgul/caper-engine";
import { WorldScene } from "./WorldScene.js";
import { drawing, drawnCritters, hiddenStickers } from "../DrawnWorld.js";
import { exitArrow, objectTarget, worldTarget } from "../WorldInteraction.js";
import { COLORS, line } from "../art.js";
import { openTask, reward, taskPrompt, tasks } from "../VillageFlow.js";
import { branchDone, nextTask } from "../village-progress.js";
import { validStrokes } from "../state.js";
import { cakeBody } from "../CakeView.js";
import { trackArt } from "../WorldEditor.js";
import { CHICKEN_WALKS } from "../chicken.js";
import { DIALOGUE } from "../dialogue.js";

function world(key, background = "villageBackdrop") {
  return {
    key,
    backgroundsByChapter: { paint: background },
    walkable: [
      { x: 90, y: 645 },
      { x: 1100, y: 645 },
      { x: 1100, y: 732 },
      { x: 90, y: 732 },
    ],
    characterScales: { keila: 0.22, olivia: 0.227 },
    companionSpacing: 94,
    activeCharacter: { startPosition: { x: 380, y: 710 } },
    props: [],
  };
}
function back(scene, label = "Village", destination = "Village") {
  exitArrow(scene, `back-${label}`, 80, 710, () => scene.scene.start(destination));
}
function strokes(scene, key, transform = (p) => p) {
  const g = scene.add.graphics().setDepth(4);
  for (const stroke of validStrokes(store.get(key))) {
    for (let i = 1; i < stroke.length; i++) {
      line(g, transform(stroke[i - 1]), transform(stroke[i]), stroke[i].color ?? COLORS[1], 5);
    }
  }
}
export class InnGarden extends WorldScene {
  constructor() {
    super(world("InnGarden"));
  }
  create(data) {
    super.create(data);
    this.ui.setScene(this, "The inn garden");
    back(this);
    const inn = drawing(this, "innExterior", 965, 613, 320);
    objectTarget(this, "inn-door", inn, () => {
      if (tasks().includes("garden")) this.scene.start("VillageInterior");
      else this.askForBeeHelp();
    });
    // Keep the speaker above the auto-dialogue sheet on landscape phones.
    const host = drawing(this, "mouse", 745, 585, 105, 5);
    objectTarget(this, "inn-host", host, () => {
      if (tasks().includes("garden")) this.ui.dialogue(DIALOGUE.innGardenThanks);
      else this.askForBeeHelp();
    });
    [
      [140, 555, "flowerBlue", 160],
      [390, 598, "birthdayFlowers", 180],
      [580, 555, "sunflower", 100],
      [90, 748, "flowers", 130],
    ].forEach(([x, y, k, w]) => drawing(this, k, x, y, w));
    drawnCritters(this, [
      ["bee", 240, 370, 92],
      ["heartButterfly", 580, 210, 88],
    ]);
    if (tasks().includes("garden")) {
      strokes(this, "village_garden", (p) => ({ x: p.x * 0.7, y: p.y * 0.57 + 250 }));
    }
    worldTarget(this, "bee-path", { x: 100, y: 300, w: 570, h: 310 }, () => {
      if (!tasks().includes("garden")) openTask(this, "garden");
      else this.ui.status("The bee can reach the flowers now. Let's look inside the inn.");
    });
    hiddenStickers(this);
    const helped = tasks().includes("garden");
    this.ui.status(
      helped
        ? "The bee can reach every flower! The butterfly inn is open."
        : "Tap the bee and draw her path to the flowers. Then we can go inside the inn.",
    );
    if (!helped && !store.get("innGardenHelpSeen")) this.askForBeeHelp();
    else if (helped && !store.get("innGardenThanksSeen")) {
      this.ui.dialogue(DIALOGUE.innGardenThanks, () => store.set("innGardenThanksSeen", true));
    }
  }
  askForBeeHelp() {
    this.ui.dialogue(DIALOGUE.innGardenHelp, () => store.set("innGardenHelpSeen", true));
  }
  hint() {
    if (!tasks().includes("garden")) this.askForBeeHelp();
    else this.ui.status("The bee can reach every flower now. Tap the butterfly inn to go inside.");
  }
}
export class BirthdayYard extends WorldScene {
  constructor() {
    super(world("BirthdayYard"));
  }
  create(data) {
    super.create(data);
    this.ui.setScene(this, "The birthday garden");
    back(this);
    drawing(this, "house", 1030, 495, 320);
    cakeBody(this, 555, 590, 220, tasks().includes("cake") ? store.get("village_cake") : []);
    const friend = drawing(this, "birthdayFriend", 815, 580, 155);
    objectTarget(this, "birthday-host", friend, () => {
      if (nextTask(tasks(), "birthday") === "music") openTask(this, "music");
      else this.explainTask(true);
    });
    drawing(this, "birthdayFlowers", 290, 580, 185);
    drawing(this, "flowerVase", 1040, 665, 135);
    drawnCritters(this, [["heartButterfly", 155, 245, 75], CHICKEN_WALKS.BirthdayYard]);
    if (tasks().includes("bunting")) {
      const colors = store.get("village_bunting") || [1, 0, 1, 2, 3, 4, 0, 0, 2];
      this.add.graphics().lineStyle(4, 0x513272).lineBetween(200, 200, 1010, 200);
      colors.forEach((color, i) =>
        this.add.triangle(225 + i * 94, 229, 0, 0, 70, 0, 35, 60, COLORS[color]).setStrokeStyle(2, 0x513272),
      );
    }
    if (branchDone(tasks(), "birthday")) {
      drawing(this, "mouse", 955, 700, 110);
      drawing(this, "blueCat", 1070, 710, 100);
      if (!this.registry.get("reducedMotion")) {
        this.tweens.add({
          targets: this.children.list.filter((o) => o.texture?.key === "birthdayFriend"),
          angle: 4,
          yoyo: true,
          repeat: -1,
          duration: 500,
        });
      }
    }
    // The party objects, not a floating task title, lead to the next bit of preparation.
    const partyTask = nextTask(tasks(), "birthday");
    if (partyTask === "bunting") {
      this.add.graphics().lineStyle(4, 0x513272).lineBetween(200, 200, 1010, 200);
      [260, 480, 700, 920].forEach((x) =>
        this.add.triangle(x, 229, 0, 0, 70, 0, 35, 60, 0xfff9e9).setStrokeStyle(3, 0x513272),
      );
    }
    const partyBounds =
      partyTask === "bunting"
        ? { x: 190, y: 170, w: 850, h: 110 }
        : partyTask === "cake"
          ? { x: 430, y: 350, w: 245, h: 260 }
          : { x: 730, y: 350, w: 175, h: 240 };
    if (partyTask) worldTarget(this, "party-task", partyBounds, () => openTask(this, partyTask));
    if (tasks().includes("bunting")) {
      worldTarget(this, "party-flags-replay", { x: 190, y: 170, w: 850, h: 110 }, () =>
        openTask(this, "bunting"),
      );
    }
    hiddenStickers(this);
    reward(this, "birthday");
    this.ui.status("A cake, some flags, a little song. Let's get this birthday started!");
    this.explainTask();
  }
  explainTask(repeat = false) {
    const task = nextTask(tasks(), "birthday");
    const lines = {
      bunting: DIALOGUE.birthdayFlagsHelp,
      cake: DIALOGUE.birthdayCakeHelp,
      music: DIALOGUE.birthdayMusicHelp,
    };
    taskPrompt(this, task, lines[task], repeat);
    if (!task && repeat) this.ui.status("The party is ready. Our other friends may still need help.");
  }
  hint() {
    this.explainTask(true);
  }
}
export class House extends WorldScene {
  constructor() {
    super(world("House", "houseRoom"));
  }
  create(data) {
    const repaired = tasks().includes("stairs");
    this.scriptedTravel = false;
    this.sceneConfig.backgroundsByChapter = {
      chapter2: repaired ? "houseRoomFinished" : "houseRoomUnfinished",
    };
    this.layoutVariant = repaired ? "stairs-finished" : "stairs-unfinished";
    super.create(data);
    this.ui.setScene(this, "Downstairs in the house");
    back(this);
    drawing(this, "flowerVase", 315, 438, 68, 3);
    const cat = drawing(this, "blueCat", 525, 585, 115, 5);
    objectTarget(this, "blue-cat", cat, () => {
      this.ui.dialogue(repaired ? DIALOGUE.houseStairsThanks : DIALOGUE.houseStairsHelp);
    });
    const cards = this.add.container(225, 398).setDepth(4);
    trackArt(this, "memory-papers", cards);
    ["fish", "blueCat"].forEach((key, i) => {
      const sheet = this.add.rectangle(i * 58, i * 8, 76, 64, 0xfff9e9).setStrokeStyle(1, 0xbaa98a);
      const art = this.add.image(i * 58, i * 8, key);
      art.setScale(Math.min(60 / art.width, 48 / art.height));
      cards.add([sheet, art]);
    });
    objectTarget(this, "memory-papers", cards, () => this.scene.start("PictureMemory"));
    const id = nextTask(tasks(), "house");
    if (id === "clue" || id === "stairs") {
      const plan = this.add.graphics().setPosition(795, 545).setDepth(3);
      trackArt(this, "stair-plan", plan);
      plan.fillStyle(0xfff9e9).fillRect(-75, -50, 150, 100);
      plan.lineStyle(4, 0x66418d).strokePoints([
        { x: -52, y: 28 },
        { x: -20, y: 28 },
        { x: -20, y: 3 },
        { x: 14, y: 3 },
        { x: 14, y: -23 },
        { x: 48, y: -23 },
      ]);
      if (id === "clue") {
        plan.lineStyle(9, 0x7250a0, 0.65);
        for (let n = 0; n < 6; n++) plan.lineBetween(-62, -35 + n * 14, 61, -24 + n * 11);
      }
      worldTarget(this, "stair-plan", { x: 715, y: 490, w: 160, h: 110 }, () => openTask(this, id));
    }
    if (tasks().includes("stairs")) {
      worldTarget(this, "stairs", { x: 610, y: 215, w: 540, h: 420 }, () => this.climbStairs());
    }
    hiddenStickers(this);
    reward(this, "house");
    this.ui.status(
      repaired
        ? "The stairs are finished! Tap them to visit the loft."
        : "Tap the scribbled stair plan to help the blue cat. Picture memory is always here too.",
    );
    if (!repaired && !store.get("houseStairsHelpSeen")) {
      this.ui.dialogue(DIALOGUE.houseStairsHelp, () => store.set("houseStairsHelpSeen", true));
    } else if (data?.stairsCompleted) {
      this.ui.dialogue(DIALOGUE.houseStairsThanks);
    }
  }
  hint() {
    this.ui.dialogue(tasks().includes("stairs") ? DIALOGUE.houseStairsThanks : DIALOGUE.houseStairsHelp);
  }
  climbStairs() {
    if (this.blocked || this.editor.active || !tasks().includes("stairs")) return;
    this.scriptedTravel = true;
    this.ui.setBusy(true);
    this.activeMarker.setVisible(false);
    const walkers = [this.walk, ...this.idleCharacters.map((c) => c.walker)];
    let remaining = walkers.length;
    const arrived = (w) => {
      w.lock();
      if (--remaining === 0) this.scene.start("HouseLoft");
    };
    if (this.registry.get("reducedMotion")) {
      this.tweens.add({
        targets: walkers.map((w) => w.sprite),
        alpha: 0,
        duration: 160,
        onComplete: () => this.scene.start("HouseLoft"),
      });
      return;
    }
    // Foot positions follow the treads of the makers' repaired staircase.
    const steps = [
      { x: 645, y: 576 },
      { x: 755, y: 516 },
      { x: 860, y: 445 },
      { x: 955, y: 371 },
      { x: 1040, y: 293 },
      { x: 1120, y: 223 },
    ];
    walkers.forEach((w, i) => {
      w.unlock();
      w.walkTo(w.snapToWalkable({ x: 600 - i * 94, y: 660 }), () => {
        // The companion follows the same treads a short distance behind.
        this.time.delayedCall(i * 350, () => {
          w.walkPath([{ x: 600, y: 640 }, ...steps], 0, () => arrived(w));
        });
      });
    });
  }
}
export class HouseLoft extends WorldScene {
  constructor() {
    super(world("HouseLoft", "houseLoft"));
  }
  create(data) {
    if (!tasks().includes("stairs")) {
      this.scene.start("House");
      return;
    }
    super.create(data);
    this.ui.setScene(this, "The house loft");
    worldTarget(
      this,
      "loft-stairs-down",
      { x: 0, y: 470, w: 175, h: 180 },
      () => {
        this.scene.start("House");
      },
      { x: 150, y: 650 },
    );
    drawing(this, "mouse", 115, 673, 75, 3);
    drawing(this, "flowerVase", 240, 535, 95, 3);
    worldTarget(this, "picture-box", { x: 775, y: 450, w: 260, h: 240 }, () => {
      openTask(this, "box");
    });
    hiddenStickers(this);
    reward(this, "house");
  }
  hint() {
    this.ui.status("Slide the pieces next to the empty space to make the blue cat picture.");
  }
}
