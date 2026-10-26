import { store } from "@caper/engine";
import { WorldScene } from "./WorldScene.js";
import { bubbleTarget } from "../UnderwaterLife.js";
import { springLife } from "../SpringLife.js";
import { springView } from "../SpringView.js";
import { SPRING_BOARD, SPRING_BUBBLES } from "../puzzles/spring.js";
import { exitArrow, objectTarget, worldTarget } from "../WorldInteraction.js";
import { trackArt } from "../WorldEditor.js";
import { BUBBLE_COUNT, waterwayProgress } from "../puzzles/waterway.js";
import { DIALOGUE } from "../dialogue.js";
import { font } from "../art.js";

export class Underwater extends WorldScene {
  constructor() {
    super({
      key: "Underwater",
      backgroundsByChapter: { paint: "underwater" },
      walkable: [{ x: 90, y: 655 }, { x: 1020, y: 660 }, { x: 1050, y: 710 }, { x: 90, y: 710 }],
      activeCharacter: { startPosition: { x: 245, y: 695 } },
      props: [],
    });
  }
  create(data) {
    this.layoutVariant = "spring-current-v1";
    super.create(data);
    this.ui.setScene(this, "Under the mermaid pond");
    const progress = waterwayProgress({
      waterwayPuzzle: store.get("waterwayPuzzle"),
      waterwayDone: store.get("waterwayDone"),
      poppedBubbles: store.get("poppedBubbles"),
    }, crypto.getRandomValues(new Uint32Array(1))[0]);
    this.popped = progress.popped;
    store.batch(() => {
      store.set("waterwayPuzzle", progress.puzzle);
      store.set("poppedBubbles", this.popped);
    });
    const restored = progress.puzzle.solved;
    const reveal = restored && !store.get("pondClue");
    this.spring = springView(this, progress.puzzle, { restored, reveal });
    this.life = springLife(this, restored && !reveal);
    this.big = this.add.image(1005, 390, "bigMermaid").setDisplaySize(270, 390).setDepth(7);
    this.little = this.add.image(1040, 640, "mermaid").setDisplaySize(120, 120).setDepth(7);
    trackArt(this, "big-mermaid", this.big);
    trackArt(this, "little-mermaid", this.little);
    objectTarget(this, "surface-friend", this.little, () => this.scene.start("Pond"));
    exitArrow(this, "surface", 110, 80, () => this.scene.start("Pond"), "up");
    this.counter = this.add.text(600, 62, "", {
      ...font,
      fontSize: "28px",
      backgroundColor: "#fff9e9",
      padding: { x: 15, y: 10 },
    }).setOrigin(.5).setDepth(20);
    for (let i = 0; i < BUBBLE_COUNT; i++) {
      if (!this.popped.includes(i)) {
        bubbleTarget(this, i, (id) => {
          this.popped.push(id);
          store.set("poppedBubbles", [...this.popped]);
          this.refresh();
        }, SPRING_BUBBLES[i]);
      }
    }
    const { x, y, size } = SPRING_BOARD;
    this.channelAction = worldTarget(this, "waterway", { x, y, w: size, h: size }, () => {
      if (!restored && this.popped.length === BUBBLE_COUNT) this.scene.start("Waterway");
    });
    this.refresh();
    if (reveal) {
      this.spring.restore(() => {
        this.life.startFlow(true);
        this.time.delayedCall(this.registry.get("reducedMotion") ? 300 : 2400, () => this.shareClue());
      });
    } else if (!store.get("metBigMermaid")) {
      this.ui.dialogue(DIALOGUE.underwaterArrival, () => {
        store.set("metBigMermaid", true);
      }, store.get("waterwayDone") ? "Explore underwater" : "Help our new friend");
    }
  }
  refresh() {
    const clear = this.popped.length === BUBBLE_COUNT;
    this.channelAction?.setVisible(clear && !store.get("waterwayDone"));
    this.counter.setVisible(!store.get("waterwayDone"));
    this.counter.setText(
      store.get("waterwayDone")
        ? "The waterway is flowing!"
        : clear
        ? "Tap the pipes to bring the current back."
        : `Uncover the spring · ${this.popped.length} of ${BUBBLE_COUNT} bubbles popped`,
    );
    this.ui.status(
      store.get("waterwayDone")
        ? "The spring is flowing. Follow the swimming friends back to the pond, then sail to the village."
        : clear
        ? "Tap the waterway to connect the pipes."
        : "Pop the drifting bubbles. Some float; some settle on the sand.",
    );
  }
  shareClue() {
    this.ui.dialogue(DIALOGUE.pondThanks, () => {
      store.batch(() => {
        store.set("pondClue", true);
        store.set("metBigMermaid", true);
      });
    }, "Back to exploring");
  }
  hint() {
    this.ui.dialogue(
      store.get("waterwayDone")
        ? DIALOGUE.surfaceHint
        : this.popped.length < BUBBLE_COUNT
        ? DIALOGUE.bubbleHint
        : DIALOGUE.waterHint,
      () => {},
      "Explore",
    );
  }
}
