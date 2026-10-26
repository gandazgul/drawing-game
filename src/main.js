import Phaser from "phaser";
import { characters, createAdventureGame, engineAssets, store } from "@gandazgul/caper-engine";
import { art } from "./art.js";
import { freshState, resumeScene, SAVE_KEY } from "./state.js";
import { GameUI } from "./ui.js";
import { chapterForScene, resetChapter } from "./chapters.js";
import { Harbor } from "./scenes/Harbor.js";
import { Pond } from "./scenes/Pond.js";
import { Underwater } from "./scenes/Underwater.js";
import { Repair } from "./scenes/Repair.js";
import { Waterway } from "./scenes/Waterway.js";
import { Port, Village } from "./scenes/Port.js";
import { BridgeDraw } from "./scenes/BridgeDraw.js";
import { VillageInterior } from "./scenes/VillageInterior.js";
import { BirthdayYard, House, HouseLoft, InnGarden } from "./scenes/VillagePlaces.js";
import { ForestEdge, ForestTrail, StudioApproach } from "./scenes/Forest.js";
import { ForestDraw, ForestNumbers } from "./scenes/ForestPuzzles.js";
import { StudioGallery, StudioHome, StudioWorkroom } from "./scenes/Workshop.js";
import { StudioDark } from "./scenes/WorkshopDark.js";
import { WorkshopPicture } from "./scenes/WorkshopPicture.js";
import { TreeClearing } from "./scenes/TreeClearing.js";
import { TreeAssembly, TreeDecorate, TreePipes, TreePortal, TreeRoute } from "./scenes/FinalePuzzles.js";
import { JumpRope, PictureMemory } from "./scenes/VillageActivities.js";
import { VillagePuzzle } from "./scenes/VillagePuzzles.js";
import { StairRepair } from "./scenes/StairRepair.js";
import { FrozenPond } from "./scenes/FrozenPond.js";
import { CloudGarden } from "./scenes/CloudGarden.js";
import { CloudPicnic } from "./scenes/CloudPicnic.js";
import { PenguinSlide, SnowmanBuilder } from "./scenes/SnowActivities.js";
import { registerSnowFrames } from "./SnowView.js";
import { watchGameViewport } from "./display.js";
import {
  createSisterAnimations,
  preloadSisterAnimations,
  sisterAnimationConfig,
} from "./sister-animations.js";

function register() {
  store.configure({ saveKey: SAVE_KEY, saveVersion: 1, createFreshState: freshState });
  characters.register("keila", {
    spriteKey: "keila",
    spriteScale: 0.36,
    playable: true,
    wanderer: true,
    walkSpeed: 285,
    ...sisterAnimationConfig("keila", globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches),
  });
  characters.register("olivia", {
    spriteKey: "olivia",
    spriteScale: 0.37,
    playable: true,
    wanderer: true,
    walkSpeed: 245,
    ...sisterAnimationConfig("olivia", globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches),
  });
  engineAssets.configure({
    cursors: { pickup: "grab", look: "help", exit: "pointer", "use-with": "pointer", subscene: "pointer" },
  });
}

class Boot extends Phaser.Scene {
  constructor() {
    super("Boot");
  }
  preload() {
    this.failed = false;
    for (const [key, url] of Object.entries(art)) this.load.image(key, url);
    preloadSisterAnimations(this);
    this.load.audio("bubblePop", new URL("../assets/audio/effects/bubble-pop.wav", import.meta.url).href);
    this.load.on("loaderror", (file) => {
      this.failed = true;
      document.querySelector("#loading p").textContent =
        `Couldn't load ${file.key}. Reload the page to try again.`;
    });
  }
  create() {
    if (this.failed) return;
    watchGameViewport(this.game);
    createSisterAnimations(this);
    registerSnowFrames(this.textures);
    // Split a supplied two-puppet sheet into engine-compatible texture frames;
    // the original asset remains unchanged on disk.
    const source = this.textures.get("sisters").getSourceImage();
    ["keila", "olivia"].forEach((id, i) => {
      const texture = this.textures.addImage(`character_${id}`, source);
      texture.get().setSize(source.width / 2, source.height, (i * source.width) / 2, 0);
    });
    const blank = this.add.graphics().fillStyle(0xfff9e9).fillRect(0, 0, 1200, 100);
    blank.generateTexture("bg-inventory", 1200, 100);
    blank.destroy();
    const paper = this.add.graphics().fillStyle(0xfff9e9).fillRect(0, 0, 1200, 800);
    paper.generateTexture("paper", 1200, 800);
    paper.destroy();
    const ui = new GameUI();
    this.registry.set("ui", ui);
    this.registry.set("reducedMotion", globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches);
    ui.restart = (all = false) => {
      const chapter = chapterForScene(ui.scene?.scene.key, store.get("chapter"));
      ui.clearDialogue();
      for (const scene of this.game.scene.getScenes(true)) this.game.scene.stop(scene);
      let destination;
      if (all) {
        const preferences = { voicesOn: ui.readAloud, effectsOn: ui.effectsOn };
        store.batch(() => {
          store.reset();
          for (const [key, value] of Object.entries(preferences)) store.set(key, value);
        });
        destination = "Harbor";
      } else destination = resetChapter(store, chapter);
      this.game.scene.start(destination);
    };
    this.scene.start(
      resumeScene({
        sailDone: store.get("sailDone"),
        patchDone: store.get("patchDone"),
        waterwayDone: store.get("waterwayDone"),
        pondClue: store.get("pondClue"),
        bridgeDone: store.get("bridgeDone"),
        currentScene: store.getCurrentScene(),
        metMermaid: store.get("metMermaid"),
        villageTasks: store.get("villageTasks"),
        forestDanceDone: store.get("forestDanceDone"),
        forestTrailDone: store.get("forestTrailDone"),
        studioPictureDone: store.get("studioPictureDone"),
        studioStairsDone: store.get("studioStairsDone"),
        studioGapDone: store.get("studioGapDone"),
        studioTreehouseInvited: store.get("studioTreehouseInvited"),
      }),
    );
  }
}

await document.fonts.load('24px "Schoolbell"');
createAdventureGame({
  register,
  config: {
    type: Phaser.AUTO,
    parent: "game",
    width: 1200,
    height: 800,
    backgroundColor: "#fff9e9",
    banner: false,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { activePointers: 2 },
    scene: [
      Boot,
      Harbor,
      Repair,
      Pond,
      Underwater,
      Waterway,
      Port,
      BridgeDraw,
      Village,
      VillageInterior,
      InnGarden,
      BirthdayYard,
      House,
      HouseLoft,
      ForestEdge,
      ForestDraw,
      ForestTrail,
      ForestNumbers,
      StudioApproach,
      StudioGallery,
      WorkshopPicture,
      StudioDark,
      StudioWorkroom,
      StudioHome,
      TreeClearing,
      TreePipes,
      TreeAssembly,
      TreeRoute,
      TreeDecorate,
      TreePortal,
      JumpRope,
      PictureMemory,
      VillagePuzzle,
      StairRepair,
      FrozenPond,
      CloudGarden,
      CloudPicnic,
      PenguinSlide,
      SnowmanBuilder,
    ],
  },
});
