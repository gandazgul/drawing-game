import { store } from "@caper/engine";
import { PuzzleScene } from "./PuzzleScene.js";
import { drawing } from "../DrawnWorld.js";
import { font } from "../art.js";
import { fingerRect } from "../touch-input.js";
import {
  CLOUD_LINES,
  DECORATION_ART,
  PLACEMENTS,
  readingSession,
  shuffled,
  validPicnicDecorations,
  WORD_SETS,
  wordRounds,
  wordSetIndex,
} from "../puzzles/reading.js";

// Learning targets use the documented plain utility face, never decorative letter forms.
const print = { fontFamily: "sans-serif", fontSize: "48px", color: "#292b4b" };
const spots = {
  bag: { x: 215, y: 465, w: 240, h: 240, fruit: { x: 215, y: 454 } },
  mat: { x: 600, y: 485, w: 415, h: 210, fruit: { x: 585, y: 520 } },
  log: { x: 970, y: 490, w: 270, h: 230, fruit: { x: 1070, y: 600 } },
};

export class CloudPicnic extends PuzzleScene {
  constructor() {
    super("CloudPicnic");
  }
  create(data) {
    const decorate = data?.decorate === true && store.get("villagePicnicDone") === true;
    if (data) delete data.decorate;
    this.setup("Cloud picnic", "A picnic for the clouds", "", "CloudGarden");
    this.add.image(600, 400, "cloudBackdrop").setDisplaySize(1200, 800).setDepth(-2);
    for (const child of this.children.list) {
      if (child.type === "Text") child.setBackgroundColor("#fff9e9").setPadding(12, 5);
    }
    this.feedback.setBackgroundColor("").setPadding(0);
    this.parts = [];
    this.decorObjects = [];
    this.phase = "words";
    this.turnLocked = false;
    this.setIndex = wordSetIndex(store.get("villageReadingSet"));
    this.input.dragDistanceThreshold = 8;
    this.input.on("pointerdown", (pointer) => {
      if (this.blocked || this.phase !== "decorate" || !this.selectedDecoration) return;
      if (pointer.x < 120 || pointer.x > 1100 || pointer.y < 350 || pointer.y > 650) return;
      const { p, image, zone } = this.selectedDecoration;
      p.x = pointer.x;
      p.y = pointer.y;
      image.setPosition(p.x, p.y);
      zone.setPosition(p.x, p.y - 32);
      this.saveDecorations();
    });
    this.input.keyboard.on("keydown", (event) => {
      if (this.blocked || this.turnLocked) return;
      if (["1", "2", "3"].includes(event.key)) {
        if (this.phase === "words") this.chooseWord(Number(event.key) - 1);
        else if (this.phase === "place") this.place(Object.keys(spots)[Number(event.key) - 1]);
      }
      if (event.code === "Space") {
        event.preventDefault();
        this.hint();
      }
    });
    this.events.once("shutdown", () => this.ui.voice.stop());
    if (decorate) this.decorate();
    else this.startWords();
  }
  keep(object) {
    this.parts.push(object);
    return object;
  }
  button(...args) {
    const button = super.button(...args);
    fingerRect(this, button);
    return button;
  }
  clearRound() {
    this.ui.voice.stop();
    this.tweens.killTweensOf(this.parts);
    this.parts.forEach((p) => p.destroy());
    this.parts = [];
    this.decorObjects = [];
    this.feedback.setText("");
    this.turnLocked = false;
  }
  label(x, y, text, style = {}) {
    return this.keep(
      this.add.text(x, y, text, {
        ...font,
        backgroundColor: "#fff9e9",
        padding: { x: 12, y: 7 },
        ...style,
      }).setOrigin(.5).setDepth(20),
    );
  }
  control(x, y, label, action) {
    const button = this.keep(this.button(x, y, label, () => {
      if (!this.turnLocked) action();
    }));
    fingerRect(this, button);
    return button;
  }
  startWords(reset = false) {
    this.phase = "words";
    const saved = readingSession(reset ? null : store.get("villagePicnicSession"), this.setIndex);
    this.found = saved.words;
    this.placed = saved.placed;
    this.rounds = wordRounds(this.setIndex).filter((r) => !this.found.includes(r.answer));
    this.saveWords();
    this.showWord();
  }
  saveWords() {
    store.set("villagePicnicSession", {
      set: this.setIndex,
      words: [...this.found],
      placed: [...this.placed],
    });
  }
  showWord() {
    this.clearRound();
    if (!this.rounds.length) {
      this.ui.dialogue([["Cloud friend", CLOUD_LINES.wordsDone]], () => this.startPlacements());
      return;
    }
    this.instructions.setText("Listen, then tap the matching word slip.");
    this.keep(drawing(this, "cloudFriend", 175, 445, 280, 2));
    this.keep(drawing(this, "picnicSupplies", 680, 660, 520, 1));
    this.found.forEach((_word, i) => this.keep(drawing(this, "pinkFruit", 620 + i * 40, 635, 32, 3)));
    this.label(
      730,
      205,
      `${this.found.length + 1} of 4  ·  ${
        this.setIndex === 0 ? "Homework words" : `Word set ${this.setIndex + 1}`
      }`,
      { fontSize: "26px" },
    );
    this.round = this.rounds[0];
    this.wordButtons = this.round.choices.map((word, i) => {
      const x = 455 + i * 275;
      this.keep(this.add.rectangle(x + 3, 337, 235, 125, 0x292b4b, .12).setDepth(5));
      const paper = this.keep(this.add.rectangle(x, 330, 235, 125, 0xfff9e9).setDepth(6));
      paper.setStrokeStyle(3, 0x7250a0);
      const text = this.label(x, 330, word, { ...print, fontSize: word.length > 5 ? "42px" : "48px" });
      fingerRect(this, paper);
      paper.on("pointerdown", (_p, _x, _y, e) => {
        e.stopPropagation();
        this.chooseWord(i);
      });
      return { paper, text };
    });
    this.targetHint = this.label(730, 435, "", { ...print, fontSize: "30px" }).setVisible(false);
    this.control(555, 485, "Hear word", () => this.listen());
    this.control(895, 485, "Show word", () => this.showTarget());
    this.control(525, 751, "Previous words", () => this.changeSet(-1));
    this.control(790, 751, "Next words", () => this.changeSet(1));
    this.label(1040, 750, `${this.setIndex + 1} / ${WORD_SETS.length}`, { fontSize: "25px" });
    this.listen();
  }
  changeSet(direction) {
    this.setIndex = (this.setIndex + direction + WORD_SETS.length) % WORD_SETS.length;
    store.set("villageReadingSet", this.setIndex);
    this.startWords(true);
  }
  showTarget() {
    if (this.phase !== "words" || !this.targetHint?.active) return;
    this.targetHint.setText(`Find: ${this.round.answer}`).setVisible(true);
    this.ui.status(`Word matching help: find ${this.round.answer}.`);
  }
  listen() {
    if (this.blocked || this.turnLocked) return;
    if (!this.ui.readAloud) {
      this.showTarget();
      this.feedback.setText("Voices are muted. Match the written word.");
      return;
    }
    const round = this.round;
    void this.ui.voice.play("Cloud friend", `Find the word: ${round.answer}.`, {
      onFailed: () => {
        if (this.targetHint?.active && this.phase === "words" && this.round === round) {
          this.showTarget();
          this.feedback.setText("Voice clip unavailable. Match the written word.");
        }
      },
    });
  }
  chooseWord(index) {
    if (this.blocked || this.turnLocked || this.phase !== "words") return;
    if (this.round.choices[index] !== this.round.answer) {
      this.feedback.setText("Try another slip. You can hear it again.");
      this.ui.status("Try another word slip, or choose Hear word.");
      return;
    }
    this.turnLocked = true;
    this.ui.voice.stop();
    const { paper, text } = this.wordButtons[index];
    paper.setFillStyle(0xe2efda).setStrokeStyle(4, 0x286d38);
    this.feedback.setText(`${this.round.answer} — we found it!`);
    this.found.push(this.round.answer);
    this.saveWords();
    this.rounds.shift();
    this.tweens.add({
      targets: [paper, text],
      y: 570,
      alpha: .25,
      duration: this.registry.get("reducedMotion") ? 100 : 500,
      ease: "Sine.easeInOut",
      onComplete: () => this.showWord(),
    });
  }
  startPlacements() {
    this.phase = "place";
    this.placementRounds = shuffled(PLACEMENTS).filter((p) => !this.placed.includes(p.id));
    this.showPlacement();
  }
  picnic() {
    this.keep(drawing(this, "picnicSupplies", 600, 650, 1100, 2));
  }
  showPlacement() {
    this.clearRound();
    this.phase = "place";
    if (!this.placementRounds.length) {
      store.batch(() => {
        store.set("villagePicnicDone", true);
        store.set("villagePicnicSession", null);
      });
      this.decorate();
      this.ui.dialogue([["Cloud friend", CLOUD_LINES.complete]]);
      return;
    }
    this.instructions.setText("Read where the fruit goes. Tap the fruit, then its place — or drag it.");
    this.placement = this.placementRounds[0];
    this.label(600, 205, this.placement.phrase, print);
    this.control(600, 285, "Read it to me", () => this.placementHelp());
    this.picnic();
    this.placed.forEach((id) =>
      this.keep(drawing(this, "pinkFruit", spots[id].fruit.x, spots[id].fruit.y, 54, 4))
    );
    this.spotMarks = {};
    for (const [id, spot] of Object.entries(spots)) {
      const mark = this.keep(
        this.add.rectangle(spot.x, spot.y, spot.w, spot.h, 0xfff9e9, 0)
          .setDepth(3),
      );
      this.spotMarks[id] = mark;
      fingerRect(this, mark);
      mark.on("pointerdown", (_p, _x, _y, e) => {
        e.stopPropagation();
        if (this.selected) this.place(id);
        else this.feedback.setText("Tap the fruit first, then choose its place.");
      });
    }
    this.selected = false;
    const fruit = this.keep(drawing(this, "pinkFruit", 165, 710, 64, 5));
    this.fruit = fruit;
    this.label(300, 685, "Take this fruit", { fontSize: "25px" });
    // The draggable zone is measured in world units, independent of the large scan's pixels.
    const target = this.keep(this.add.rectangle(165, 670, 105, 115, 0xfff9e9, 0).setDepth(7));
    fingerRect(this, target);
    this.input.setDraggable(target);
    target.on("pointerdown", () => {
      if (this.blocked || this.turnLocked) return;
      this.selected = true;
      target.setStrokeStyle(3, 0x66418d);
      this.feedback.setText("Now choose its place.");
    });
    target.on("drag", (_pointer, x, y) => {
      if (this.blocked || this.turnLocked) return;
      target.setPosition(x, y);
      fruit.setPosition(x, y + 40);
    });
    target.on("dragend", (pointer) => {
      if (this.blocked || this.turnLocked) return;
      const found = Object.entries(spots).find(([, s]) =>
        Math.abs(pointer.x - s.x) <= s.w / 2 && Math.abs(pointer.y - s.y) <= s.h / 2
      );
      if (found) this.place(found[0]);
      if (!this.turnLocked) {
        target.setPosition(165, 670);
        fruit.setPosition(165, 710);
      }
    });
    this.feedback.setPosition(700, 685).setText(`${this.placed.length + 1} of 3`);
  }
  placementHelp() {
    this.ui.speak("Cloud friend", this.placement.phrase);
    this.feedback.setPosition(700, 680).setWordWrapWidth(820).setText(this.placement.explanation).setFontSize(
      25,
    );
    this.ui.status(this.placement.explanation);
    this.spotMarks[this.placement.id].setStrokeStyle(4, 0x286d38);
  }
  place(id) {
    if (this.blocked || this.turnLocked || this.phase !== "place") return;
    if (id !== this.placement.id) {
      this.feedback.setText("Try another place, or choose Read it to me.");
      return;
    }
    this.turnLocked = true;
    this.ui.voice.stop();
    this.tweens.add({
      targets: this.fruit,
      ...spots[id].fruit,
      duration: this.registry.get("reducedMotion") ? 100 : 550,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.placed.push(id);
        this.saveWords();
        this.placementRounds.shift();
        this.showPlacement();
      },
    });
  }
  decorate() {
    this.clearRound();
    this.phase = "decorate";
    this.feedback.setPosition(600, 675).setFontSize(28);
    this.instructions.setText("Add a drawing. Tap it, then a place — or drag it.");
    this.picnic();
    Object.values(spots).forEach((s) => this.keep(drawing(this, "pinkFruit", s.fruit.x, s.fruit.y, 54, 3)));
    this.decorations = validPicnicDecorations(store.get("villagePicnicDecorations"));
    this.decorations.forEach((p) => this.addDecoration(p));
    this.selectedDecoration = null;
    const names = ["Fruit", "Flowers", "Blue flower", "Butterfly"];
    DECORATION_ART.forEach((art, i) => {
      this.keep(drawing(this, art, 250 + i * 235, 275, 62, 4));
      this.control(250 + i * 235, 315, `Add ${names[i].toLowerCase()}`, () => {
        if (this.decorations.length >= 24) {
          this.feedback.setText("Our cloud is full! Move a drawing, or remove one to make room.");
          return;
        }
        const p = { art, x: 480 + Math.random() * 220, y: 390 + Math.random() * 200 };
        this.decorations.push(p);
        this.addDecoration(p);
        this.saveDecorations();
      });
    });
    this.control(495, 751, "Read again", () => {
      this.feedback.setPosition(600, 674).setFontSize(28);
      this.startWords(true);
    });
    this.control(880, 751, "Remove selected drawing", () => {
      const selected = this.selectedDecoration;
      if (!selected) {
        this.feedback.setText("Tap a decoration first.");
        return;
      }
      this.decorations = this.decorations.filter((p) => p !== selected.p);
      selected.image.destroy();
      selected.zone.destroy();
      this.selectedDecoration = null;
      this.saveDecorations();
    });
  }
  addDecoration(p) {
    const image = this.keep(drawing(this, p.art, p.x, p.y, 65, 4));
    const zone = this.keep(this.add.rectangle(p.x, p.y - 32, 92, 100, 0xfff9e9, 0).setDepth(8));
    const item = { p, image, zone };
    this.decorObjects.push(item);
    fingerRect(this, zone);
    this.input.setDraggable(zone);
    zone.on("pointerdown", (_pointer, _x, _y, event) => {
      event.stopPropagation();
      if (this.blocked) return;
      this.decorObjects.forEach((o) => {
        if (o.zone.active) o.zone.setStrokeStyle();
      });
      this.selectedDecoration = item;
      zone.setStrokeStyle(3, 0x66418d);
    });
    zone.on("drag", (_pointer, x, y) => {
      if (this.blocked) return;
      p.x = Math.max(120, Math.min(1100, x));
      p.y = Math.max(350, Math.min(650, y + 32));
      image.setPosition(p.x, p.y);
      zone.setPosition(p.x, p.y - 32);
    });
    zone.on("dragend", () => this.saveDecorations());
  }
  saveDecorations() {
    store.set("villagePicnicDecorations", validPicnicDecorations(this.decorations));
    this.ui.status("Your picnic decorations are saved.");
  }
  hint() {
    if (this.phase === "words") this.listen();
    else if (this.phase === "place") this.placementHelp();
    else this.feedback.setText("Add fruit or flowers, then move them wherever you like.");
  }
}
