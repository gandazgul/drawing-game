import { store } from "@caper/engine";
import { WorldScene } from "./WorldScene.js";
import { drawing, drawnCritters } from "../DrawnWorld.js";
import { exitArrow, objectTarget, worldTarget } from "../WorldInteraction.js";
import { createBear } from "../ForestView.js";
import { font } from "../art.js";
import { finaleFruit, routeArt, savedDecorations, sparkleBurst, treeHouses } from "../FinaleView.js";
import { canCelebrate, canSayGoodbye, TREE_ROUTE, treeReady, treeWalkable } from "../puzzles/finale.js";
import { validStrokes } from "../state.js";
import { DIALOGUE } from "../dialogue.js";
import { fingerCircle, fingerRect } from "../touch-input.js";
import { ringPartyBell } from "../party-bell.js";

export class TreeClearing extends WorldScene {
  constructor() {
    super({
      key: "TreeClearing",
      backgroundsByChapter: { paint: "endingDry" },
      walkable: treeWalkable(false),
      characterScales: { keila: .16, olivia: .165 },
      companionSpacing: 85,
      activeCharacter: { startPosition: { x: 205, y: 710 } },
      props: [],
    });
  }
  create(data = {}) {
    if (!store.get("studioTreehouseInvited")) return this.scene.start("StudioWorkroom");
    const arrival = data.waterArrival === true;
    delete data.waterArrival;
    this.scriptedTravel = false;
    this.partyPresent = false;
    this.dancing = false;
    this.phase = "explore";
    this.layoutVariant = "shared-tree-v1";
    super.create(data);
    this.ui.setScene(this, "Our tree house");
    this.background.setTexture(store.get("endingWaterDone") && !arrival ? "endingWater" : "endingDry")
      .setDisplaySize(1200, 800);
    this.houses = treeHouses(this, store.get("endingHouseDone"));
    finaleFruit(this);
    this.route = routeArt(this, store.get("endingRouteDone"), validStrokes(store.get("endingRouteStrokes")));
    savedDecorations(this, store.get("endingDecorations"));
    const party = store.get("endingParty");
    this.bounka = drawing(this, "bounkaKind", party ? 620 : 560, 715, 105, 6);
    this.bear = createBear(this, party ? 760 : 700, 713, 145);
    this.creature = drawing(this, "forestCreature", party ? 420 : 820, 717, 85, 6);
    objectTarget(
      this,
      "bounka",
      this.bounka,
      () => this.ui.dialogue(canCelebrate(store.values) ? DIALOGUE.endingFinished : DIALOGUE.endingWelcome),
    );
    objectTarget(this, "bear", this.bear, () => this.dance());
    objectTarget(this, "forest-friend", this.creature, () => {
      sparkleBurst(this, this.creature.x, this.creature.y - 45);
      this.ui.speak("Keila", "We can make this together.");
    });
    const syncFriends = () => {
      for (
        const [id, sprite] of [["bounka", this.bounka], ["bear", this.bear], ["forest-friend", this.creature]]
      ) {
        if (this.editor.active) continue;
        const z = this.hotspots.zones.get(id), b = sprite.getBounds();
        if (!z?.input) continue;
        z.setPosition(b.x, b.y).setSize(b.width, b.height);
        z.input.hitArea.setSize(b.width, b.height);
      }
    };
    this.events.on("update", syncFriends);
    this.events.once("shutdown", () => this.events.off("update", syncFriends));
    worldTarget(this, "pool", { x: 75, y: 495, w: 390, h: 130 }, () => {
      if (!store.get("endingWaterDone")) this.scene.start("TreePipes");
      else sparkleBurst(this, 265, 555);
    });
    for (let i = 0; i < this.houses.length; i++) {
      objectTarget(this, `tree-house-${i}`, this.houses[i], () => {
        if (!store.get("endingHouseDone")) this.scene.start("TreeAssembly");
        else if (!store.get("endingRouteDone")) this.ui.dialogue(DIALOGUE.endingRoute);
        else this.visitBranches();
      });
    }
    // The actual unfinished ramp is the target; no floating navigation arrow beside it.
    worldTarget(this, "drawn-ramp", { x: 985, y: 465, w: 150, h: 210 }, () => {
      if (!store.get("endingHouseDone")) this.ui.dialogue(DIALOGUE.endingHouse);
      else if (!store.get("endingRouteDone")) this.scene.start("TreeRoute");
      else this.visitBranches();
    });
    worldTarget(this, "pumpkin-cat", { x: 780, y: 515, w: 175, h: 135 }, () => {
      sparkleBurst(this, 870, 540);
      this.ui.dialogue(DIALOGUE.endingPumpkin);
    });
    exitArrow(this, "workshop-path", 65, 754, () => this.scene.start("StudioWorkroom"));
    // Basket of original flowers is the entry to free decoration.
    this.decorBasket = drawing(this, "flowerVase", 1130, 752, 65, 8);
    objectTarget(this, "decorations", this.decorBasket, () => {
      if (canCelebrate(store.values)) this.scene.start("TreeDecorate");
      else this.hint();
    });
    this.bell = drawing(this, "partyBell", 835, 338, 90, 8).setOrigin(.5, 0);
    // New ID prevents old editor layouts restoring the former floating target.
    worldTarget(this, "hanging-party-bell", { x: 775, y: 355, w: 120, h: 130 }, () => {
      ringPartyBell(this, this.bell);
      if (canCelebrate(store.values)) this.celebrate();
      else this.hint();
    });
    this.goodbyeButton = this.add.text(
      970,
      755,
      store.get("endingPortalReady") ? "Our heart doorway" : "Say goodbye",
      {
        ...font,
        fontSize: "26px",
        color: "#fff9e9",
        backgroundColor: "#66418d",
        padding: { x: 16, y: 12 },
      },
    ).setOrigin(.5).setDepth(20).setVisible(
      canSayGoodbye(store.values),
    );
    fingerRect(this, this.goodbyeButton, 48);
    this.goodbyeButton.on("pointerdown", (_p, _x, _y, e) => {
      e.stopPropagation();
      if (!this.blocked) this.goodbye();
    });
    if (store.get("endingWaterDone")) this.swimmers(arrival);
    if (party) this.partyFriends();
    // Append new critters so older editor layouts retain their existing indices.
    drawnCritters(this, [["tealButterfly", 1040, 380, 80]]);
    this.time.delayedCall(0, () => {
      this.setWalkable(treeWalkable(store.get("endingRouteDone")));
      if (arrival) this.fillPool();
      else if (treeReady(store.values) && !store.get("endingClimbed")) this.climb();
      else if (!store.get("endingWelcomeSeen")) {
        this.ui.dialogue(DIALOGUE.endingWelcome, () => store.set("endingWelcomeSeen", true));
      }
      this.status();
    });
  }
  status() {
    this.ui.status(
      !store.get("endingWaterDone")
        ? "The pool is dry. Tap it to connect the pipes."
        : !store.get("endingHouseDone")
        ? "Tap a pale house in the branches to put its pieces together."
        : !store.get("endingRouteDone")
        ? "Tap the pale path on the right. Draw a way up and across."
        : !store.get("endingParty")
        ? "Tap the flower bouquet to decorate freely. Ring the golden bell whenever you're ready!"
        : "Our place, together. Decorate, pop bubbles, dance, or say goodbye whenever you're ready.",
    );
  }
  fillPool() {
    const layer = this.add.image(600, 400, "endingWater").setDisplaySize(1200, 800).setDepth(0).setAlpha(0);
    this.scriptedTravel = true;
    this.ui.setBusy(true);
    this.tweens.add({
      targets: layer,
      alpha: 1,
      duration: this.registry.get("reducedMotion") ? 150 : 1500,
      onComplete: () => {
        this.background.setTexture("endingWater").setDisplaySize(1200, 800);
        layer.destroy();
        this.scriptedTravel = false;
        this.ui.setBusy(false);
        sparkleBurst(this, 270, 550);
        if (treeReady(store.values) && !store.get("endingClimbed")) this.climb();
        else this.status();
      },
    });
  }
  swimmers(arrive) {
    const keys = ["fish", "axolotlBlue", "axolotlPink", "seaCreature"];
    drawnCritters(
      this,
      keys.map((k, i) => [k, 160 + i * 66, 555 + i % 2 * 23, k === "seaCreature" ? 48 : 62, "custom"]),
    );
    if (arrive && !this.registry.get("reducedMotion")) {
      for (const { sprite } of this.critterEntries.slice(-4)) {
        sprite.setAlpha(0);
        this.tweens.add({ targets: sprite, alpha: 1, duration: 600, delay: 800 });
      }
    }
  }
  visitBranches() {
    if (this.scriptedTravel) return;
    if (!treeReady(store.values)) return this.hint();
    this.climb();
  }
  climb() {
    if (this.scriptedTravel) return;
    this.phase = "climbing";
    this.scriptedTravel = true;
    this.ui.setBusy(true);
    this.activeMarker.setVisible(false);
    const reduced = this.registry.get("reducedMotion"),
      walkers = [this.walk, ...this.idleCharacters.map((c) => c.walker)];
    let remaining = walkers.length + 2;
    const arrived = () => {
      if (--remaining) return;
      store.set("endingClimbed", true);
      this.phase = "explore";
      this.scriptedTravel = false;
      this.activeMarker.setVisible(true);
      this.ui.setBusy(false);
      this.status();
      if (!store.get("endingClimbSeen")) {
        this.ui.dialogue(DIALOGUE.endingClimbed, () => store.set("endingClimbSeen", true));
      }
    };
    walkers.forEach((w, i) => {
      const end = { x: 450 + i * 90, y: 320 };
      const go = () => {
        w.unlock();
        if (reduced) {
          w.sprite.setPosition(end.x, end.y);
          arrived();
        } else w.walkTo(TREE_ROUTE[0], () => w.walkPath([...TREE_ROUTE.slice(1, -1), end], 0, arrived));
      };
      this.time.delayedCall(reduced ? 1 : i * 500, go);
    });
    for (const [i, friend] of [this.bounka, this.creature].entries()) {
      const end = { x: 710 + i * 90, y: 327 };
      if (reduced) {
        friend.setPosition(end.x, end.y);
        arrived();
        continue;
      }
      const path = [TREE_ROUTE[0], ...TREE_ROUTE.slice(1, -3), end];
      this.tweens.chain({
        targets: friend,
        tweens: path.map((p, n) => ({
          x: p.x,
          y: p.y,
          duration: n === 0 ? 2100 : 950,
          ease: "Linear",
          ...(n === 0 ? { delay: 1100 + i * 550 } : {}),
        })),
        onComplete: arrived,
      });
    }
  }
  dance() {
    if (this.dancing) return;
    this.dancing = true;
    const reduced = this.registry.get("reducedMotion");
    let i = 0;
    this.time.addEvent({
      delay: reduced ? 500 : 240,
      repeat: reduced ? 1 : 15,
      callback: () => {
        this.bear.setFrame(reduced ? 5 : [0, 1, 2, 3, 2, 4, 2, 5][i++ % 8]);
      },
    });
    this.time.delayedCall(reduced ? 1100 : 4000, () => {
      this.bear.setFrame(0);
      this.dancing = false;
    });
    sparkleBurst(this, this.bear.x, this.bear.y - 70);
  }
  partyFriends() {
    if (this.partyPresent) return;
    this.partyPresent = true;
    drawnCritters(this, [["bird", 360, 700, 72, "ground"], ["heartButterfly", 220, 290, 65], [
      "watermelon",
      1030,
      140,
      110,
    ]]);
    drawing(this, "blueCat", 480, 320, 65, 5);
    drawing(this, "mouse", 690, 327, 60, 5);
    drawing(this, "birthdayFriend", 325, 715, 85, 5);
    drawing(this, "penguin", 1020, 713, 75, 5);
    drawing(this, "scarecrow", 900, 735, 118, 5);
    drawing(this, "bigMermaid", 100, 560, 75, 5);
    drawing(this, "mermaid", 400, 570, 55, 5);
    for (let i = 0; i < 5; i++) this.bubble(i);
  }
  bubble(i) {
    const x = 125 + i * 74, y = 420 - i % 2 * 70;
    const b = fingerCircle(
      this,
      this.add.circle(x, y, 24, 0xffffff, .32).setStrokeStyle(3, 0xfff9e9).setDepth(15),
    );
    b.on("pointerdown", (_p, _x, _y, e) => {
      e.stopPropagation();
      if (this.blocked) return;
      sparkleBurst(this, b.x, b.y);
      b.destroy();
      if (this.ui.effectsOn) this.sound.play("bubblePop", { volume: .3 });
      this.time.delayedCall(1600, () => this.bubble(i));
    });
  }
  celebrate() {
    if (this.scriptedTravel) return;
    this.scriptedTravel = true;
    this.phase = "party";
    this.ui.setBusy(true);
    const reduced = this.registry.get("reducedMotion");
    const finish = () => {
      store.set("endingParty", true);
      this.partyFriends();
      this.dance();
      for (const [x, y] of [[400, 230], [700, 150], [940, 260]]) sparkleBurst(this, x, y, true);
      this.scriptedTravel = false;
      this.ui.setBusy(false);
      this.goodbyeButton.setVisible(true);
      this.status();
      if (!store.get("endingPartySeen")) {
        this.ui.dialogue(DIALOGUE.endingParty, () => store.set("endingPartySeen", true));
      }
    };
    let count = 2;
    for (const [i, w] of [this.walk, this.idleCharacters[0].walker].entries()) {
      w.unlock();
      const target = { x: 190 + i * 100, y: 710 };
      if (reduced) {
        w.sprite.setPosition(target.x, target.y);
        if (--count === 0) finish();
      } else {w.walkTo(target, () => {
          if (--count === 0) finish();
        });}
    }
  }
  goodbye() {
    if (!canSayGoodbye(store.values)) return;
    if (store.get("endingGoodbyeSeen")) return this.scene.start("TreePortal");
    // The keepsake is a miniature of this actual finished clearing, including saved decorations.
    const capture = this.add.renderTexture(600, 340, 1200, 800).setOrigin(.5).setDepth(35);
    capture.draw(this.children.list.filter((o) => o !== capture && o.visible && o.depth < 15));
    capture.setScale(.4);
    const paper = this.add.rectangle(600, 340, 500, 340, 0xfff9e9).setStrokeStyle(4, 0x66418d).setDepth(34);
    this.ui.dialogue(DIALOGUE.endingGoodbye, () => {
      store.set("endingGoodbyeSeen", true);
      capture.destroy();
      paper.destroy();
      this.scene.start("TreePortal");
    });
  }
  hint() {
    this.ui.dialogue(
      !store.get("endingWaterDone")
        ? DIALOGUE.endingPipes
        : !store.get("endingHouseDone")
        ? DIALOGUE.endingHouse
        : !store.get("endingRouteDone")
        ? DIALOGUE.endingRoute
        : DIALOGUE.endingDecorate,
    );
  }
}
