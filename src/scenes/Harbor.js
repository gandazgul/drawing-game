import { store } from "@gandazgul/caper-engine";
import { WorldScene } from "./WorldScene.js";
import { BoatView } from "../BoatView.js";
import { drawHeart } from "../art.js";
import { nextRepair } from "../state.js";
import { DIALOGUE } from "../dialogue.js";
import { swimmingCreatures } from "../WaterLife.js";
import { arriveByBoat, departByBoat, takeBoatArrival } from "../BoatJourney.js";

export class Harbor extends WorldScene {
  constructor() {
    super({
      key: "Harbor",
      backgroundsByChapter: { paint: "harbor" },
      walkable: [
        { x: 80, y: 610 },
        { x: 800, y: 610 },
        { x: 800, y: 690 },
        { x: 80, y: 690 },
      ],
      activeCharacter: { startPosition: { x: 340, y: 655 } },
      props: [
        {
          id: "boat",
          bounds: { x: 800, y: 290, w: 380, h: 370 },
          approach: { x: 785, y: 650, facing: "right" },
          states: [{ cursor: "pointer", onClick: [{ emit: "boat" }] }],
        },
        {
          id: "sticker",
          bounds: { x: 90, y: 520, w: 90, h: 75 },
          approach: { x: 190, y: 638, facing: "up" },
          states: [
            { when: { stickers: { has: "harbor-fish" } } },
            {
              cursor: "pointer",
              onClick: [{ emit: "sticker" }],
            },
          ],
        },
        {
          id: "sea",
          bounds: { x: 300, y: 300, w: 270, h: 185 },
          approach: { x: 425, y: 625, facing: "up" },
          states: [{ cursor: "help", onClick: [{ emit: "sea" }] }],
        },
      ],
    });
  }
  create(data) {
    const arrivingByBoat = takeBoatArrival(data);
    const repaired = data?.repaired;
    // Phaser reuses scene data when a later start omits it. Consume this
    // one-shot celebration so returning from the pond cannot repeat it.
    if (data) delete data.repaired;
    super.create(data);
    this.ui.setScene(this, "The painted harbor");
    swimmingCreatures(this);
    this.boat = new BoatView(this, 970, 460, 0.69);
    this.sticker = this.add
      .image(123, 558, "fish")
      .setDisplaySize(82, 55)
      .setAngle(-22)
      .setDepth(2)
      .setVisible(!store.has("stickers", "harbor-fish"));
    this.bus.on("boat", () => this.onBoat());
    this.bus.on("sticker", () => this.collectSticker());
    this.bus.on("sea", () => this.ui.dialogue(DIALOGUE.sea, () => {}, "Explore"));
    this.ui.status("Tap to walk. Tap the boat to see what it needs.");
    if (arrivingByBoat) arriveByBoat(this);
    else if (!store.get("arrived")) this.arrival();
    else if (repaired) this.repairPayoff(repaired);
  }
  arrival() {
    this.ui.setBusy(true);
    this.activeMarker.setVisible(false);
    const reduced = this.registry.get("reducedMotion");
    const sprites = [this.walk.sprite, ...this.idleCharacters.map((c) => c.sprite)];
    for (let i = 0; i < sprites.length; i++) {
      const sprite = sprites[i],
        endY = sprite.y;
      sprite.y = -80 - i * 130;
      this.tweens.add({
        targets: sprite,
        y: endY,
        duration: reduced ? 1 : 1050,
        delay: reduced ? 0 : i * 130,
        ease: "Cubic.easeInOut",
      });
    }
    this.time.delayedCall(reduced ? 50 : 1300, () => {
      const layers = [54, 39, 25, 11].map((size, i) =>
        drawHeart(
          this.add.graphics().setDepth(25),
          0,
          0,
          size,
          [0x70438f, 0xd76b94, 0xd9ac36, 0x328b9c][i],
          i === 3,
        ).setPosition(325, 530),
      );
      layers.slice(1).forEach((part, i) =>
        this.tweens.add({
          targets: part,
          x: [940, 1040, 1300][i],
          y: [-90, 160, 50][i],
          angle: [150, -130, 190][i],
          duration: reduced ? 1 : 1400,
          ease: "Sine.easeOut",
          onComplete: () => part.destroy(),
        }),
      );
      this.time.delayedCall(reduced ? 80 : 1550, () => {
        layers[0].destroy();
        this.activeMarker.setVisible(true);
        this.ui.dialogue(DIALOGUE.arrival, () => store.set("arrived", true), "Explore the harbor");
      });
    });
  }
  onBoat() {
    if (this.blocked) return;
    const repair = nextRepair(this.values());
    if (repair) {
      const lines = repair === "sail" ? DIALOGUE.sailIntro : DIALOGUE.patchIntro;
      this.ui.dialogue(lines, () => this.scene.start("Repair", { kind: repair }), "Let's draw");
    } else {
      this.sail();
    }
  }
  repairPayoff(kind) {
    // The changed boat is the payoff; don't stop play for another conversation.
    this.ui.status(
      kind === "sail"
        ? "Our sail is ready. Tap the boat to patch its hole."
        : "Our boat is ready. Tap it to set sail!",
    );
  }
  collectSticker() {
    if (this.blocked || store.has("stickers", "harbor-fish")) return;
    store.addTo("stickers", "harbor-fish");
    this.ui.collectSticker(this, this.sticker, "Colorful fish");
    this.sticker.setVisible(false);
  }
  hint() {
    const repair = nextRepair(this.values());
    this.ui.dialogue(
      repair === "sail"
        ? DIALOGUE.harborSailHint
        : repair === "patch"
          ? DIALOGUE.harborPatchHint
          : DIALOGUE.harborReadyHint,
      () => {},
      "Try it",
    );
  }
  sail() {
    departByBoat(this, "Pond");
  }
}
