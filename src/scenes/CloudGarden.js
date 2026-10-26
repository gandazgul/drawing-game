import { store } from "@caper/engine";
import { WorldScene } from "./WorldScene.js";
import { drawing } from "../DrawnWorld.js";
import { exitArrow, objectTarget } from "../WorldInteraction.js";
import { CLOUD_LINES, validPicnicDecorations } from "../puzzles/reading.js";

export class CloudGarden extends WorldScene {
  constructor() {
    super({
      key: "CloudGarden",
      backgroundsByChapter: { paint: "cloudBackdrop" },
      walkable: [{ x: 80, y: 625 }, { x: 1120, y: 625 }, { x: 1120, y: 755 }, { x: 80, y: 755 }],
      activeCharacter: { startPosition: { x: 235, y: 715 } },
      props: [],
    });
  }
  create(data) {
    super.create(data);
    this.ui.setScene(this, "The cloud picnic");
    drawing(this, "cloudVine", 110, 920, 120, 1);
    const friend = drawing(this, "cloudFriend", 400, 610, 360, 3);
    objectTarget(this, "cloud-friend", friend, () => this.scene.start("CloudPicnic"));
    const picnic = drawing(this, "picnicSupplies", 825, 660, 630, 2);
    objectTarget(this, "cloud-picnic", picnic, () =>
      this.scene.start("CloudPicnic", {
        decorate: store.get("villagePicnicDone") === true,
      }));
    if (store.get("villagePicnicDone")) {
      [620, 820, 1030].forEach((x) => drawing(this, "pinkFruit", x, 595, 35, 4));
      for (const p of validPicnicDecorations(store.get("villagePicnicDecorations"))) {
        drawing(this, p.art, 540 + (p.x - 120) * .55, 520 + (p.y - 350) * .35, 42, 4);
      }
    }
    exitArrow(this, "cloud-village", 95, 730, () => this.scene.start("Village"), "down");
    this.ui.status("Tap our new friend to read together. Tap the picnic to play or decorate.");
    if (!store.get("villageCloudMet")) {
      this.ui.dialogue([["Cloud friend", CLOUD_LINES.welcome]], () => store.set("villageCloudMet", true));
    }
  }
  hint() {
    this.ui.dialogue([[
      "Cloud friend",
      store.get("villagePicnicDone") ? CLOUD_LINES.complete : CLOUD_LINES.welcome,
    ]]);
  }
}
