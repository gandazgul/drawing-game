import { store } from "@caper/engine";
import { WorldScene } from "./WorldScene.js";
import { drawing, hiddenStickers } from "../DrawnWorld.js";
import { exitArrow, objectTarget, worldTarget } from "../WorldInteraction.js";
import { materialPart, snowCreation, snowPart } from "../SnowView.js";
import { MATERIALS, materialsFound, snowUnlocked, validSnowPieces } from "../puzzles/snow.js";
import { DIALOGUE } from "../dialogue.js";
import { trackArt } from "../WorldEditor.js";

export class FrozenPond extends WorldScene {
  constructor() {
    super({
      key: "FrozenPond",
      backgroundsByChapter: { paint: "frozenPond" },
      walkable: [{ x: 120, y: 622 }, { x: 1090, y: 622 }, { x: 1100, y: 755 }, { x: 100, y: 755 }],
      characterScales: { keila: .20, olivia: .207 },
      companionSpacing: 100,
      activeCharacter: { startPosition: { x: 325, y: 717 } },
      props: [],
    });
  }
  create(data) {
    super.create(data);
    this.ui.setScene(this, "The frozen pond");
    const found = materialsFound(store.get("snowMaterials"));
    const unlocked = snowUnlocked(found, store.get("snowBuilderUnlocked"));
    if (unlocked) store.set("snowBuilderUnlocked", true);
    this.penguin = drawing(this, "penguin", 625, 505, 125, 4);
    objectTarget(this, "penguin", this.penguin, () => {
      this.scene.start("PenguinSlide");
    }, { x: 615, y: 640 });
    const pieces = validSnowPieces(store.get("snowPieces"));
    if (pieces.length) {
      this.snowFriend = snowCreation(this, pieces, 950, 716, .53).setDepth(5);
    } else {
      this.snowFriend = snowPart(this, "base", 950, 672, 190).setDepth(3);
    }
    trackArt(this, "snow-friend", this.snowFriend);
    this.materialIcons = MATERIALS.map((id, i) => {
      const image = snowPart(this, materialPart[id], 855 + i * 92, 760, id === "rocks" ? 35 : 65)
        .setDepth(6);
      if (!found.includes(id)) image.setTint(0x667e92).setAlpha(.38);
      return image;
    });
    worldTarget(this, "snow-builder", { x: 815, y: 430, w: 275, h: 305 }, () => {
      if (unlocked) this.scene.start("SnowmanBuilder");
      else {
        this.ui.status("Twigs, a carrot, and rocks! Tap the penguin to collect them together.");
        if (!this.registry.get("reducedMotion")) {
          this.tweens.add({ targets: this.materialIcons, alpha: 1, duration: 250, yoyo: true, repeat: 1 });
        }
      }
    }, { x: 800, y: 706 });
    exitArrow(this, "village", 95, 735, () => this.scene.start("Village"));
    hiddenStickers(this);
    this.ui.status(
      unlocked
        ? "Tap the penguin to play again, or your snow friend to decorate."
        : "Tap the penguin. Let's gather twigs, a carrot, and rocks!",
    );
    if (!store.get("snowMetPenguin")) {
      store.set("snowMetPenguin", true);
      this.ui.dialogue(DIALOGUE.snowArrival);
    }
  }
  hint() {
    this.ui.dialogue(
      snowUnlocked(store.get("snowMaterials"), store.get("snowBuilderUnlocked"))
        ? DIALOGUE.snowReady
        : DIALOGUE.snowArrival,
    );
  }
}
