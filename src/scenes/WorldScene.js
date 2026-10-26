import { AdventureScene, store } from "@gandazgul/caper-engine";
import { DIALOGUE } from "../dialogue.js";
import { installWorldEditor } from "../WorldEditor.js";
import { chapterForScene, enterChapter } from "../chapters.js";

export class WorldScene extends AdventureScene {
  constructor(config) {
    super({
      ...config,
      backgroundsByChapter: { [chapterForScene(config.key)]: config.backgroundsByChapter.paint },
      inventoryHidden: true,
      hideCharacterSwitcher: true,
    });
  }
  collectAssetKeys() {
    // Caper 0.5.1 includes animation names in its image preload list. Boot has
    // already registered these animations against the sisters' shared atlases.
    return super.collectAssetKeys().filter((key) => !this.anims.exists(key));
  }
  create(data) {
    enterChapter(store, this.scene.key);
    this.sceneConfig.propItems = [];
    this.artCounts = {};
    super.create(data);
    this.ui = this.registry.get("ui");
    this.background.setDisplaySize(1200, 800);
    const spacing = this.sceneConfig.companionSpacing ?? 120;
    this.spawnCompanion({ x: this.walk.sprite.x - spacing, y: this.walk.sprite.y });
    this.activeMarker = this.add.ellipse(0, 0, spacing / 2, spacing / 8, 0xffef9a, 0.9).setDepth(5);
    this.events.on("update", () => {
      const sprite = this.walk?.sprite;
      if (sprite) {
        this.activeMarker.setPosition(sprite.x, sprite.y - 5);
      }
    });
    this.time.addEvent({
      delay: 900,
      loop: true,
      callback: () => {
        if (this.blocked || this.editor.active || this.walk.currentTween) return;
        const active = this.walk.sprite;
        const idle = this.idleCharacters[0];
        if (!idle?.sprite || idle.walker?.currentTween) return;
        if (Math.hypot(active.x - idle.sprite.x, active.y - idle.sprite.y) >= spacing * 0.75) return;
        const xs = this.sceneConfig.walkable.map((point) => point.x);
        const min = Math.min(...xs),
          max = Math.max(...xs);
        // Following normally maintains a gap; also make room when the player
        // walks back toward her sister, so the two paper puppets stay readable.
        const x = active.x < (min + max) / 2 ? active.x + spacing + 5 : active.x - spacing - 5;
        const target = idle.walker.snapToWalkable({ x: Math.max(min, Math.min(max, x)), y: active.y });
        // Narrow paths can snap the requested gap back onto the same spot.
        // Don't restart a walk unless it actually gives both sisters room.
        if (Math.hypot(target.x - active.x, target.y - active.y) < spacing * 0.75 + 4) return;
        if (Math.hypot(target.x - idle.sprite.x, target.y - idle.sprite.y) < 4) return;
        idle.walker.walkTo(target);
      },
    });
    this.events.once("shutdown", () => {
      for (const idle of this.idleCharacters) idle.destroy();
      this.idleCharacters = [];
    });
    installWorldEditor(this);
  }
  setWalkable(walkable) {
    this.sceneConfig.walkable = walkable;
    this.walk.walkable = walkable;
    this.debug.walkable = walkable;
    for (const idle of this.idleCharacters) {
      idle.walkable = walkable;
      idle.walker.walkable = walkable;
    }
  }
  spawnCompanion(position) {
    this.spawnIdleCharacters({
      behavior: "follow",
      startPresent: true,
      startPos: position,
      // The follower's stopping distance must exceed the separation threshold.
      // At the port the old lag was 43px, but separation retriggered below 43.5px.
      follow: { lag: (this.sceneConfig.companionSpacing ?? 120) + 8, repathMs: 600 },
    });
    for (const idle of this.idleCharacters) {
      // The engine's default idle cursor points at an optional engine asset.
      // This game uses ordinary browser cursors, with its own shared greeting.
      if (idle.sprite?.input) idle.sprite.input.cursor = "pointer";
      idle.onClicked = () => {
        if (!this.blocked) {
          this.ui.dialogue(
            idle.name === "keila" ? DIALOGUE.keilaGreeting : DIALOGUE.oliviaGreeting,
            () => {},
            "Together!",
          );
        }
      };
    }
  }
  setBlocked(blocked) {
    this.blocked = blocked;
    this.input.enabled = !blocked;
    if (blocked) {
      this.walk.lock();
      for (const idle of this.idleCharacters) idle.freeze();
    } else {
      this.walk.unlock();
      for (const idle of this.idleCharacters) {
        idle.walker?.unlock();
        idle.behavior?.resume();
      }
    }
  }
  switchSister(id) {
    if (this.blocked || this.editor.active || id === store.getActiveCharacter()) return;
    const oldPos = { x: this.walk.sprite.x, y: this.walk.sprite.y };
    const nextPos = this.idleCharacters.find((c) => c.name === id)?.getPosition() ?? oldPos;
    this.walk.shutdown();
    this.walk.sprite.destroy();
    for (const idle of this.idleCharacters) idle.destroy();
    this.idleCharacters = [];
    store.setActiveCharacter(id);
    this.spawnActiveCharacter(nextPos);
    this.spawnCompanion(oldPos);
    this.ui.status(`${id === "keila" ? "Keila" : "Olivia"} is leading. Both sisters can draw.`);
  }
  values() {
    return { sailDone: store.get("sailDone"), patchDone: store.get("patchDone") };
  }
}
