import { store } from "@caper/engine";
import { PuzzleScene } from "./PuzzleScene.js";
import { font } from "../art.js";
import { drawPipe } from "../PipeView.js";
import { DIALOGUE } from "../dialogue.js";
import {
  createWaterwayReplay,
  restoreWaterway,
  rotatePipe,
  waterCells,
  waterConnected,
  waterwayProgress,
} from "../puzzles/waterway.js";

export class Waterway extends PuzzleScene {
  constructor() {
    super("Waterway");
  }
  create(data = {}) {
    this.setup(
      "The mermaids' waterway",
      "Bring the current back",
      "Turn the pipes. Connect every piece to the blue spring.",
      "Underwater",
    );
    this.replay = data.replay === true;
    const resumeReplay = data.resume === true;
    // Phaser retains scene data on later starts: replay is a one-shot request.
    delete data.replay;
    delete data.resume;
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    // This explicit replay entry is reserved for the future bedroom menu.
    // Story navigation never passes it and can never scramble a solved story.
    this.puzzle = this.replay
      ? resumeReplay
        ? restoreWaterway(store.get("waterwayReplay"), seed)
        : createWaterwayReplay(store.get("waterwayPuzzle"), seed, store.get("waterwayReplay")).puzzle
      : waterwayProgress({
        waterwayPuzzle: store.get("waterwayPuzzle"),
        waterwayDone: store.get("waterwayDone"),
      }, seed).puzzle;
    this.save();
    this.finish = null;
    this.returnScheduled = false;
    this.add.image(1002, 342, "bigMermaid").setDisplaySize(230, 320);
    this.add.image(1040, 570, "fish").setDisplaySize(110, 73);
    this.add.text(177, 165, "Blue\nspring", { ...font, fontSize: "28px", align: "center" }).setOrigin(.5, 0);
    this.add.text(866, 609, "To the\nvillage", { ...font, fontSize: "28px", align: "center" }).setOrigin(
      .5,
      0,
    );
    this.tiles = this.puzzle.cells.map((_mask, i) => {
      const x = 300 + (i % 5) * 100, y = 148 + Math.floor(i / 5) * 100;
      const tile = this.add.rectangle(x + 50, y + 50, 96, 96, 0xe4ede5).setStrokeStyle(2, 0x97aaa1);
      if (i !== 0) tile.setInteractive({ useHandCursor: true });
      const g = this.add.graphics().setDepth(1);
      tile.on("pointerdown", (_p, _x, _y, e) => {
        e.stopPropagation();
        if (i === 0 || this.blocked || this.puzzle.solved) return;
        this.puzzle.cells[i] = rotatePipe(this.puzzle.cells[i]);
        this.puzzle.solved = waterConnected(this.puzzle.cells);
        this.save();
        this.refresh();
      });
      return { g, x, y };
    });
    this.refresh();
    this.ui.status(
      this.puzzle.solved
        ? "This waterway is finished. Every pipe stays in place."
        : "Blue pipes reach the spring. Turn the others until all 25 connect, with no open ends.",
    );
  }
  save() {
    store.batch(() => {
      store.set(this.replay ? "waterwayReplay" : "waterwayPuzzle", structuredClone(this.puzzle));
      if (!this.replay && this.puzzle.solved) store.set("waterwayDone", true);
    });
  }
  refresh() {
    const wet = waterCells(this.puzzle.cells);
    if (this.puzzle.solved) this.ui.status("This waterway is finished. Every pipe stays in place.");
    this.tiles.forEach(({ g, x, y }, i) => {
      g.clear();
      drawPipe(g, x, y, this.puzzle.cells[i], wet.has(i), i === 0, i === 24);
    });
    this.feedback.setText(
      this.puzzle.solved ? "Here comes the current!" : `${wet.size} of 25 pipes reach the spring`,
    );
    if (this.puzzle.solved && !this.finish) {
      if (!this.replay) {
        if (!this.returnScheduled) {
          this.returnScheduled = true;
          this.time.delayedCall(
            this.registry.get("reducedMotion") ? 200 : 650,
            () => this.scene.start("Underwater"),
          );
        }
        return;
      }
      this.finish = this.button(
        720,
        751,
        this.replay ? "Replay finished →" : "See the flowing water →",
        () => this.scene.start("Underwater"),
        "#fddf55",
      );
    }
  }
  hint() {
    this.ui.dialogue(DIALOGUE.waterHint, () => {}, "Keep trying");
  }
}
