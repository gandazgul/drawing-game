import Phaser from "phaser";
import { store } from "@caper/engine";
import { PuzzleScene } from "./PuzzleScene.js";
import { COLORS, font } from "../art.js";
import { drawing } from "../DrawnWorld.js";
import { MEMORY_ART } from "../village-progress.js";

// One shared paper back: the artwork must never be guessable from its reverse.
function memoryPaper(scene) {
  const key = "memory-paper";
  if (scene.textures.exists(key)) return key;
  const texture = scene.textures.createCanvas(key, 184, 130);
  const ctx = texture.context;
  ctx.translate(12, 10);
  ctx.beginPath();
  ctx.moveTo(1, 2);
  ctx.lineTo(142, 0);
  ctx.lineTo(160, 17);
  ctx.lineTo(158, 104);
  ctx.lineTo(2, 106);
  ctx.closePath();
  ctx.shadowColor = "#53442a30";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = "#fffef8";
  ctx.fill();
  ctx.shadowColor = "transparent";
  // The small turned corner makes this a loose sheet, not a bordered game tile.
  ctx.beginPath();
  ctx.moveTo(142, 0);
  ctx.lineTo(141, 18);
  ctx.lineTo(160, 17);
  ctx.closePath();
  ctx.fillStyle = "#ece5d5";
  ctx.fill();
  ctx.strokeStyle = "#cec4ae";
  ctx.lineWidth = .7;
  ctx.stroke();
  texture.refresh();
  return key;
}

// The Bears picture game's two-card turn and flip-back rhythm, using only the girls' art.
export class PictureMemory extends PuzzleScene {
  constructor() {
    super("PictureMemory");
  }
  create() {
    this.setup(
      "Picture memory",
      "Our drawing pairs",
      "Turn over two pictures. Can you find their twins?",
      "House",
    );
    this.first = null;
    this.waiting = false;
    this.pairs = 0;
    this.feedback.setText("0 / 8 pairs");
    const deck = Phaser.Utils.Array.Shuffle([...MEMORY_ART, ...MEMORY_ART]);
    const paper = memoryPaper(this);
    this.cards = deck.map((key, i) => {
      const x = 327 + i % 4 * 182, y = 211 + Math.floor(i / 4) * 121;
      const card = this.add.container(x, y);
      card.setAngle([-1.3, .8, -.6, 1.1][i % 4]);
      const face = this.add.image(0, 0, paper);
      const image = this.add.image(-3, 0, key);
      image.setScale(Math.min(128 / image.width, 83 / image.height));
      const back = this.add.image(0, 0, paper);
      const mark = this.add.text(0, 0, "?", {
        ...font,
        fontSize: "32px",
        color: "#756954",
      }).setOrigin(.5);
      const matchedMark = this.add.graphics().setVisible(false);
      matchedMark.lineStyle(3, 0x45954f).strokePoints([
        { x: 58, y: 36 },
        { x: 63, y: 42 },
        { x: 73, y: 29 },
      ]);
      card.add([face, image, back, mark, matchedMark]);
      card.matchedMark = matchedMark;
      card.key = key;
      card.cover = [back, mark];
      card.matched = false;
      back.setInteractive(new Phaser.Geom.Rectangle(12, 10, 160, 106), Phaser.Geom.Rectangle.Contains);
      back.input.cursor = "pointer";
      back.on("pointerdown", () => this.choose(card));
      return card;
    });
    this.button(985, 751, "New game", () => this.scene.restart());
    if (this.ui.readAloud) {
      this.ui.voice.play("A little idea", "Turn over two pictures. Can you find their twins?");
    }
  }
  flip(card, show, done = () => {}) {
    const reveal = () => {
      card.cover.forEach((c) => c.setVisible(!show));
    };
    if (this.registry.get("reducedMotion")) {
      reveal();
      done();
      return;
    }
    this.tweens.add({
      targets: card,
      scaleX: 0,
      duration: 100,
      onComplete: () => {
        reveal();
        this.tweens.add({ targets: card, scaleX: 1, duration: 130, onComplete: done });
      },
    });
  }
  choose(card) {
    if (this.blocked || this.waiting || card.matched || card === this.first) return;
    this.waiting = true;
    this.flip(card, true, () => {
      if (!this.first) {
        this.first = card;
        this.waiting = false;
        return;
      }
      const first = this.first;
      this.first = null;
      if (first.key === card.key) {
        first.matched = card.matched = true;
        this.pairs++;
        this.feedback.setText(
          this.pairs === 8 ? "All our friends found their twins!" : `${this.pairs} / 8 pairs`,
        );
        [first, card].forEach((c) => c.matchedMark.setVisible(true));
        this.waiting = false;
      } else {this.time.delayedCall(800, () => {
          this.flip(first, false);
          this.flip(card, false, () => this.waiting = false);
        });}
    });
  }
  hint() {
    this.ui.status("Choose two cards. Matching friends stay face up. New game mixes them again.");
  }
}

// Bears' rotating rope and safe airborne window, separated from adventure progress.
export class JumpRope extends PuzzleScene {
  constructor() {
    super("JumpRope");
  }
  create() {
    this.setup(
      "Jump rope in the square",
      "Jump with our friends",
      "Tap Jump or press space as the rope comes down.",
      "Village",
    );
    this.add.image(600, 410, "villageBackdrop").setDisplaySize(1200, 800).setDepth(-3);
    this.add.rectangle(600, 70, 1200, 140, 0xfff9e9, .93).setDepth(-2);
    this.add.ellipse(600, 582, 270, 38, 0x4b7156, .17);
    this.backRope = this.add.graphics().setDepth(1);
    const active = store.getActiveCharacter();
    this.jumper = this.add.image(600, 578, `character_${active}`).setOrigin(.5, 1).setScale(.29).setDepth(3);
    this.turner = this.add.image(302, 578, `character_${active === "keila" ? "olivia" : "keila"}`).setOrigin(
      .5,
      1,
    ).setScale(.28).setDepth(3);
    drawing(this, "blueCat", 927, 578, 160, 3);
    this.frontRope = this.add.graphics().setDepth(4);
    this.jumpButton = this.button(600, 751, "Start jumping", () => this.jump(), "#d2e9c8");
    this.button(1000, 751, "Try again", () => this.reset());
    this.input.keyboard.on("keydown-SPACE", (e) => {
      e.preventDefault();
      if (!e.repeat) this.jump();
    });
    this.events.once("shutdown", () => this.input.keyboard.removeAllListeners("keydown-SPACE"));
    this.reset();
    if (this.ui.readAloud) {
      this.ui.voice.play("A little idea", "Tap Jump or press space as the rope comes down.");
    }
  }
  reset() {
    this.angle = Math.PI * 1.52;
    this.jumpTime = -1;
    this.running = false;
    this.score = 0;
    this.failed = false;
    this.jumper.y = 578;
    this.feedback.setText(`Best: ${store.get("ropeBest") || 0} jumps`);
    this.jumpButton.setText("Start jumping");
    this.renderRope();
  }
  jump() {
    if (this.blocked) return;
    if (this.failed) this.reset();
    if (!this.running) {
      this.running = true;
      this.jumpButton.setText("Jump!");
      // Starting turns the rope; the next press chooses when to jump.
      return;
    }
    if (this.jumpTime < 0) this.jumpTime = 0;
  }
  switchSister(id) {
    super.switchSister(id);
    this.jumper.setTexture(`character_${id}`);
    this.turner.setTexture(`character_${id === "keila" ? "olivia" : "keila"}`);
    this.reset();
  }
  update(_time, delta) {
    if (!this.running || this.blocked) return;
    const dt = Math.min(delta, 40);
    if (this.jumpTime >= 0) {
      this.jumpTime += dt;
      this.jumper.y = 578 - Math.sin(Math.min(1, this.jumpTime / 1000) * Math.PI) * 130;
      if (this.jumpTime >= 1000) {
        this.jumpTime = -1;
        this.jumper.y = 578;
      }
    }
    const previous = (this.angle - Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
    this.angle = (this.angle + .0028 * (1 + Math.min(this.score, 15) * .016) * dt) % (Math.PI * 2);
    const now = (this.angle - Math.PI / 2 + Math.PI * 2) % (Math.PI * 2);
    if (now < previous) {
      if (this.jumpTime >= 100 && this.jumpTime <= 800) {
        this.score++;
        store.set("ropeBest", Math.max(this.score, store.get("ropeBest") || 0));
        this.feedback.setText(`${this.score} jumps!    Best: ${store.get("ropeBest")}`);
      } else {
        this.failed = true;
        this.running = false;
        this.feedback.setText(`${this.score} jumps! Ready for another turn?`);
        this.jumpButton.setText("Jump again");
      }
    }
    this.renderRope();
  }
  renderRope() {
    this.backRope.clear();
    this.frontRope.clear();
    const g = Math.cos(this.angle) > 0 ? this.frontRope : this.backRope;
    const y = 430 + Math.sin(this.angle) * (Math.sin(this.angle) < 0 ? 260 : 165);
    const curve = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(335, 435),
      new Phaser.Math.Vector2(610, y * 2 - 435),
      new Phaser.Math.Vector2(895, 435),
    );
    g.lineStyle(7, COLORS[4]).strokePoints(curve.getPoints(60));
    g.fillStyle(0xe6ad24).fillCircle(335, 435, 10).fillCircle(895, 435, 10);
  }
  hint() {
    this.ui.status(
      "Watch the rope. Jump just before it reaches your feet. You can try as often as you like!",
    );
  }
}
