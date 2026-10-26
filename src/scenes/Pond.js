import { store } from "@gandazgul/caper-engine";
import { WorldScene } from "./WorldScene.js";
import { BoatView } from "../BoatView.js";
import { exitArrow, objectTarget } from "../WorldInteraction.js";
import { trackArt } from "../WorldEditor.js";
import { DIALOGUE } from "../dialogue.js";
import { drawing, drawnCritters, hiddenStickers } from "../DrawnWorld.js";
import { CHICKEN_WALKS } from "../chicken.js";
import { swimmingCreatures } from "../WaterLife.js";
import { arriveByBoat, departByBoat, takeBoatArrival } from "../BoatJourney.js";

export class Pond extends WorldScene {
  constructor() {
    super({
      key: "Pond",
      backgroundsByChapter: { paint: "pond" },
      walkable: [
        { x: 80, y: 610 },
        { x: 420, y: 645 },
        { x: 535, y: 725 },
        { x: 100, y: 705 },
      ],
      activeCharacter: { startPosition: { x: 320, y: 675 } },
      props: [],
    });
  }
  create(data) {
    const arrivingByBoat = takeBoatArrival(data);
    super.create(data);
    this.ui.setScene(this, "The mermaid pond");
    drawing(this, "flowerBlue", 500, 718, 68);
    drawing(this, "flowers", 74, 688, 85);
    drawnCritters(this, [CHICKEN_WALKS.Pond]);
    swimmingCreatures(this);
    hiddenStickers(this);
    this.boat = new BoatView(this, 210, 437, 0.49);
    this.mermaid = trackArt(
      this,
      "little-mermaid",
      this.add.image(910, 420, "mermaid").setDisplaySize(250, 250).setDepth(8),
    );
    objectTarget(this, "mermaid-dive", this.mermaid, () => this.meetMermaid());
    if (!this.registry.get("reducedMotion")) {
      this.tweens.add({
        targets: this.mermaid,
        y: 438,
        duration: 2300,
        ease: "Sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    }
    exitArrow(this, "harbor-return", 85, 695, () => departByBoat(this, "Harbor"));
    objectTarget(this, "boat", this.boat.root, () => {
      if (store.get("waterwayDone") && store.get("pondClue")) this.goToPort();
      else this.meetMermaid();
    });
    this.ui.status(
      store.get("waterwayDone") && store.get("pondClue")
        ? "The way to the village is open. Our underwater friends are still here to visit."
        : store.get("metMermaid")
          ? "Dive with our friend to visit the world below the pond."
          : "A little mermaid is waving. Meet her before following her underwater.",
    );
    const welcome = () => {
      if (!store.get("metMermaid")) this.ui.dialogue(DIALOGUE.pondArrival, () => {}, "Say hello");
    };
    if (arrivingByBoat) arriveByBoat(this, welcome);
    else welcome();
  }
  meetMermaid() {
    if (this.blocked) return;
    if (store.get("metMermaid")) {
      this.scene.start("Underwater");
      return;
    }
    this.ui.dialogue(
      DIALOGUE.mermaid,
      () => {
        store.set("metMermaid", true);
        this.scene.start("Underwater");
      },
      "Follow her underwater",
    );
  }
  goToPort() {
    if (!store.get("pondClue")) {
      this.scene.start("Underwater");
      return;
    }
    departByBoat(this, "Port");
  }
  hint() {
    this.ui.dialogue(
      store.get("waterwayDone") && store.get("pondClue") ? DIALOGUE.portRouteHint : DIALOGUE.pondHint,
      () => {},
      "Explore",
    );
  }
}
