import { store } from "@caper/engine";
import { WorldScene } from "./WorldScene.js";
import { drawing, hiddenStickers } from "../DrawnWorld.js";
import { objectTarget, worldTarget } from "../WorldInteraction.js";
import { INN_ROOMS, INN_TASK_ROOMS, ladderRoute, roomFloor, roomTarget, validRoom } from "../inn-rooms.js";
import { openTask, reward, taskPrompt, tasks } from "../VillageFlow.js";
import { branchDone, nextTask } from "../village-progress.js";
import { DIALOGUE } from "../dialogue.js";
import { JIGSAW_PICTURES } from "../puzzles/village-replay.js";

export class VillageInterior extends WorldScene {
  constructor() {
    super({
      key: "VillageInterior",
      backgroundsByChapter: { paint: "villageBackdrop" },
      walkable: roomFloor(4),
      characterScales: { keila: .073, olivia: .075 },
      companionSpacing: 50,
      activeCharacter: { startPosition: { x: 675, y: 761 } },
      props: [],
    });
  }
  create(data) {
    if (!tasks().includes("garden")) {
      this.scene.start("InnGarden");
      return;
    }
    this.currentRoom = validRoom(store.get("innRoom"));
    this.layoutVariant = `room-${this.currentRoom}`;
    this.sceneConfig.walkable = roomFloor(this.currentRoom);
    this.sceneConfig.activeCharacter.startPosition = roomTarget(
      this.currentRoom,
      (INN_ROOMS[this.currentRoom].left + INN_ROOMS[this.currentRoom].right) / 2,
    );
    super.create(data);
    this.ui.setScene(this, "Inside the butterfly inn");
    drawing(this, "innPlayable", 600, 790, 1120);
    drawing(this, "flowerVase", 540, 522, 55, 3);
    INN_ROOMS.forEach((room, id) => {
      this.add.zone(
        (room.left + room.right) / 2,
        (room.top + room.floor) / 2,
        room.right - room.left,
        room.floor - room.top + 8,
      )
        .setDepth(4).setInteractive({ useHandCursor: true })
        .on("pointerdown", (pointer, _x, _y, event) => {
          event.stopPropagation();
          this.goToRoom(id, pointer.worldX);
        });
    });
    hiddenStickers(this);
    const leave = () => this.goToRoom(4, 625, () => this.scene.start("InnGarden"));
    worldTarget(this, "inn-exit-door", { x: 560, y: 663, w: 96, h: 107 }, leave);
    const host = drawing(this, "mouse", 712, 751, 52, 5);
    objectTarget(this, "innkeeper", host, () => this.explainTask(true));
    // Guests live in the bedroom; their picture belongs on the floor above it.
    if (!tasks().includes("luggage")) {
      [27, 35, 23, 43, 31].forEach((width, index) => drawing(this, "mouse", 490 + index * 40, 644, width, 5));
      worldTarget(
        this,
        "inn-guests",
        { x: 465, y: 564, w: 220, h: 84 },
        () => this.visitTask("luggage", 575),
      );
    }
    {
      this.add.rectangle(663, 468, 126, 105, 0xfff9e9).setStrokeStyle(3, 0x66418d).setDepth(5);
      const lastPicture = store.get("villageReplay_rooms")?.picture;
      const key = tasks().includes("rooms") && JIGSAW_PICTURES.includes(lastPicture)
        ? lastPicture
        : "innPlayable";
      const picture = this.add.image(663, 468, key).setDepth(6);
      picture.setScale(Math.min(119 / picture.width, 97 / picture.height));
      worldTarget(
        this,
        "inn-picture",
        { x: 600, y: 416, w: 126, h: 108 },
        () => this.visitTask("rooms", 663),
      );
    }
    if (branchDone(tasks(), "inn")) {
      drawing(this, "blueCat", 655, 645, 40, 3);
      drawing(this, "birthdayFriend", 650, 391, 40, 3);
      drawing(this, "mouse", 645, 267, 40, 3);
    }
    reward(this, "inn");
    this.ui.status("Tap inside a room. We'll take the ladder together!");
    this.explainTask();
  }
  explainTask(repeat = false) {
    const task = nextTask(tasks(), "inn");
    taskPrompt(
      this,
      task,
      task === "luggage" ? DIALOGUE.innGuestsHelp : task === "rooms" ? DIALOGUE.innPictureHelp : null,
      repeat,
    );
    if (!task && repeat) {
      this.ui.status("Tap the picture to make another jigsaw! The red door downstairs leads to the garden.");
    }
  }
  visitTask(task, x) {
    if (!(task === "rooms" && tasks().includes("rooms")) && nextTask(tasks(), "inn") !== task) {
      this.explainTask(true);
      return;
    }
    this.goToRoom(INN_TASK_ROOMS[task], x, () => openTask(this, task));
  }
  setRoom(id) {
    this.currentRoom = id;
    this.layoutKey = `VillageInterior:room-${id}`;
    this.setWalkable(roomFloor(id));
    store.set("innRoom", id);
  }
  goToRoom(id, x, onArrive) {
    if (this.blocked) return;
    id = validRoom(id);
    const destination = roomTarget(id, x);
    if (id === this.currentRoom) {
      this.walk.walkTo(destination, onArrive);
      return;
    }
    const from = this.currentRoom;
    const walkers = [this.walk, ...this.idleCharacters.map((idle) => idle.walker)];
    this.ui.setBusy(true);
    const climb = () => {
      let arrived = 0;
      walkers.forEach((walker, index) => {
        const route = ladderRoute(from, id, -index * 28);
        let previous = { x: walker.sprite.x, y: walker.sprite.y };
        this.tweens.chain({
          targets: walker.sprite,
          tweens: route.map((point) => {
            const duration = this.registry.get("reducedMotion")
              ? 120
              : Math.hypot(point.x - previous.x, point.y - previous.y) / 170 * 1000;
            previous = point;
            return { ...point, duration, ease: "Linear" };
          }),
          onComplete: () => {
            if (++arrived !== walkers.length) return;
            this.setRoom(id);
            this.ui.setBusy(false);
            this.walk.walkTo(destination, onArrive);
            this.ui.status(INN_ROOMS[id].name + ". Tap anywhere in the room to explore.");
          },
        });
      });
    };
    let ready = 0;
    walkers.forEach((walker, index) => {
      walker.unlock();
      walker.walkTo({ x: INN_ROOMS[from].ladder - index * 28, y: INN_ROOMS[from].floor }, () => {
        walker.lock();
        if (++ready === walkers.length) climb();
      });
    });
  }
  hint() {
    this.explainTask(true);
  }
}
