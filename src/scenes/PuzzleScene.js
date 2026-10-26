import Phaser from "phaser";
import { store } from "@gandazgul/caper-engine";
import { font } from "../art.js";

// Shared lifecycle and large paper controls for discrete, non-drawing puzzles.
export class PuzzleScene extends Phaser.Scene {
  setup(place, title, instruction, returnScene) {
    this.blocked = false;
    this.returnScene = returnScene;
    this.ui = this.registry.get("ui");
    this.ui.setScene(this, place);
    store.setCurrentScene(this.scene.key);
    this.cameras.main.setBackgroundColor("#fff9e9");
    this.add.text(600, 45, title, { ...font, fontSize: "42px" }).setOrigin(0.5);
    this.instructions = this.add.text(600, 103, instruction, { ...font, fontSize: "26px" }).setOrigin(0.5);
    this.ui.status(instruction);
    this.feedback = this.add.text(600, 674, "", { ...font, fontSize: "28px" }).setOrigin(0.5);
    const names = {
      CloudGarden: "Cloud garden",
      TreeClearing: "Tree house",
      StudioGallery: "Picture room",
      StudioWorkroom: "Bounka",
      InnGarden: "Garden",
      VillageInterior: "Inn",
      BirthdayYard: "Party",
      HouseLoft: "Loft",
      FrozenPond: "Pond",
      ForestEdge: "Grove",
      ForestTrail: "Forest",
    };
    this.button(145, 751, `← ${names[returnScene] ?? returnScene}`, () => this.leave());
    this.input.keyboard.on("keydown-ESC", () => this.leave());
  }
  button(x, y, label, action, color = "#eadff4") {
    const b = this.add
      .text(x, y, label, {
        ...font,
        fontSize: "27px",
        backgroundColor: color,
        padding: { x: 20, y: 14 },
      })
      .setOrigin(0.5)
      .setDepth(25)
      .setInteractive({ useHandCursor: true });
    b.on("pointerdown", (_p, _x, _y, e) => {
      e.stopPropagation();
      if (!this.blocked) action();
    });
    return b;
  }
  setBlocked(value) {
    this.blocked = value;
    this.input.enabled = !value;
  }
  switchSister(id) {
    if (this.blocked) return;
    store.setActiveCharacter(id);
    this.ui.status(`${id === "keila" ? "Keila" : "Olivia"}'s turn. Your work stays.`);
  }
  leave() {
    if (!this.blocked) this.scene.start(this.returnScene);
  }
}
