import { store } from "@caper/engine";
import { WorldScene } from "./WorldScene.js";
import { BoatView } from "../BoatView.js";
import { DIALOGUE } from "../dialogue.js";
import { villageReady } from "../state.js";
import { migrateBridgeBands } from "../puzzles/rainbow.js";
import { drawBridgeBands, worldBridge } from "../BridgeView.js";
import { drawing, drawnCritters, hiddenStickers, villageArt } from "../DrawnWorld.js";
import { forest, messenger } from "../VillageFlow.js";
import { exitArrow, objectTarget, worldTarget } from "../WorldInteraction.js";
import { BRIDGE_ROUTE, portWalkable } from "../bridge-walk.js";
import { trackArt } from "../WorldEditor.js";
import { CHICKEN_WALKS } from "../chicken.js";
import { arriveByBoat, departByBoat, takeBoatArrival } from "../BoatJourney.js";
import { villageVine } from "../CloudVine.js";

export class Port extends WorldScene {
  constructor() {
    super({
      key: "Port",
      backgroundsByChapter: { paint: "portBackdrop" },
      walkable: portWalkable(false),
      characterScales: { keila: .11, olivia: .114 },
      companionSpacing: 58,
      activeCharacter: { startPosition: { x: 300, y: 622 } },
      props: [],
    });
  }
  create(data) {
    const arrivingByBoat = takeBoatArrival(data);
    const repaired = store.get("bridgeDone") === true;
    this.layoutVariant = repaired ? "repaired" : "broken";
    this.sceneConfig.walkable = portWalkable(repaired);
    const fromVillage = data?.fromVillage === true;
    if (data) delete data.fromVillage;
    this.sceneConfig.activeCharacter.startPosition = fromVillage ? { x: 1080, y: 410 } : { x: 250, y: 640 };
    super.create(data);
    this.ui.setScene(this, "The village port");
    drawing(this, "house", 1065, 351, 260, 2);
    drawing(this, "innExterior", 847, 310, 135, 2);
    this.bridgeArt = worldBridge(this, repaired);
    drawing(this, "flowers", 1127, 639, 128, 3);
    drawing(this, "plant", 86, 537, 93, 3);
    const bands = migrateBridgeBands(store.get("bridgeBands"), store.get("bridgeArtVersion"));
    store.batch(() => {
      store.set("bridgeBands", bands);
      store.set("bridgeArtVersion", 2);
    });
    drawnCritters(this, [["heartButterfly", 161, 237, 60], CHICKEN_WALKS.Port]);
    hiddenStickers(this);
    this.boat = new BoatView(this, 825, 595, .48);
    objectTarget(this, "boat", this.boat.root, () => departByBoat(this, "Pond"));
    // Small targets follow the arch instead of a giant rectangle over the sky/water.
    BRIDGE_ROUTE.forEach((p, i) =>
      worldTarget(this, `bridge-${i}`, {
        x: p.x - 35,
        y: p.y - 40,
        w: 70,
        h: 80,
      }, () => this.bridge())
    );
    if (repaired) {
      worldTarget(this, "village-shore", { x: 975, y: 405, w: 220, h: 205 }, () => {
        if (this.walk.sprite.x > 960) this.scene.start("Village");
        else this.crossBridge();
      });
    }
    if (store.get("bridgeDone")) this.drawFinishedBridge();
    this.ui.status(
      store.get("bridgeDone")
        ? "Tap the rainbow. We'll walk across it to the village."
        : "The rainbow stops in the middle. Tap the bridge to finish it.",
    );
    const welcome = () => {
      if (!store.get("portArrived")) {
        this.ui.dialogue(DIALOGUE.portArrival, () => store.set("portArrived", true), "Look at the bridge");
      }
    };
    if (arrivingByBoat) arriveByBoat(this, welcome);
    else welcome();
  }
  drawFinishedBridge() {
    drawBridgeBands(this.add.graphics().setDepth(3), store.get("bridgeBands"), true);
  }
  bridge() {
    if (this.blocked) return;
    if (
      villageReady({
        ...this.values(),
        waterwayDone: store.get("waterwayDone"),
        pondClue: store.get("pondClue"),
        bridgeDone: store.get("bridgeDone"),
      })
    ) {
      this.crossBridge();
    } else this.scene.start("BridgeDraw");
  }
  crossBridge() {
    if (this.blocked || !store.get("bridgeDone")) return;
    const returning = this.walk.sprite.x > 960;
    this.ui.setBusy(true);
    const walkers = [this.walk, ...this.idleCharacters.map((c) => c.walker)];
    let arrived = 0;
    walkers.forEach((walker, i) => {
      walker.unlock();
      walker.walkTo(returning ? { x: 250 - i * 55, y: 640 } : { x: 1080 - i * 55, y: 410 }, () => {
        walker.lock();
        if (++arrived !== walkers.length) return;
        if (!returning) this.scene.start("Village");
        else this.ui.setBusy(false);
      });
    });
  }
  hint() {
    this.ui.dialogue(
      store.get("bridgeDone") ? DIALOGUE.villageRouteHint : DIALOGUE.bridgeDrawHint,
      () => {},
      "Explore",
    );
  }
}

export class Village extends WorldScene {
  constructor() {
    super({
      key: "Village",
      backgroundsByChapter: { paint: "villageBackdrop" },
      walkable: [{ x: 167, y: 599 }, { x: 1100, y: 590 }, { x: 1100, y: 730 }, { x: 90, y: 730 }],
      activeCharacter: { startPosition: { x: 365, y: 675 } },
      props: [],
    });
  }
  create(data) {
    super.create(data);
    this.ui.setScene(this, "Inside the village");
    villageArt(this);
    villageVine(this);
    // The snowy clearing is a world destination, not another text-labelled task button.
    drawing(this, "snowPath", 481, 449, 150, 1);
    worldTarget(this, "snow-path", { x: 420, y: 226, w: 121, h: 126 }, () => this.scene.start("FrozenPond"), {
      x: 600,
      y: 610,
    });
    worldTarget(this, "inn", { x: 184, y: 34, w: 181, h: 416 }, () => this.scene.start("InnGarden"), {
      x: 240,
      y: 620,
    });
    worldTarget(
      this,
      "birthday",
      { x: 455, y: 365, w: 265, h: 205 },
      () => this.scene.start("BirthdayYard"),
      { x: 570, y: 620 },
    );
    worldTarget(this, "house", { x: 794, y: 192, w: 401, h: 372 }, () => this.scene.start("House"), {
      x: 960,
      y: 620,
    });
    exitArrow(this, "port", 110, 710, () => this.scene.start("Port", { fromVillage: true }));
    exitArrow(this, "forest", 1100, 710, () => forest(this), "right");
    const rope = this.add.graphics().setPosition(832, 706).setDepth(3);
    rope.lineStyle(6, 0x7250a0).strokeEllipse(0, 0, 150, 40);
    rope.lineStyle(10, 0xe6ad24).lineBetween(-82, -12, -61, 1).lineBetween(-82, 12, -61, 2);
    trackArt(this, "jump-rope", rope);
    worldTarget(this, "jump-rope", { x: 739, y: 671, w: 180, h: 65 }, () => this.scene.start("JumpRope"));
    this.ui.status(
      "Visit our village friends. The snowy path above the party leads to the frozen pond!",
    );
    if (!store.get("villageArrived")) {
      this.ui.dialogue(DIALOGUE.villageArrival, () => {
        store.set("villageArrived", true);
      }, "Explore the village");
    } else messenger(this);
  }
  nextChapter() {
    forest(this);
  }
  hint() {
    this.nextChapter();
  }
}
