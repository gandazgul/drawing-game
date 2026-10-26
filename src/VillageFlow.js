import { store } from "@caper/engine";
import { art, drawHeart } from "./art.js";
import { drawing } from "./DrawnWorld.js";
import { branchDone, BRANCHES, doneTasks, villageDone } from "./village-progress.js";
import { DIALOGUE } from "./dialogue.js";

export const tasks = () => doneTasks(store.get("villageTasks"));
// Each stage introduces its cause and next action once; residents/hints can repeat it.
// The village prefix makes these flags part of chapter two's reset scope.
export function taskPrompt(scene, id, lines, repeat = false) {
  if (!id || !lines) return;
  const key = `villagePrompt_${id}`;
  if (repeat || !store.get(key)) {
    scene.ui.dialogue(lines, () => store.set(key, true));
  }
}
export function openTask(scene, id) {
  store.set("villageTask", id);
  scene.scene.start(id === "clue" || id === "stairs" ? "StairRepair" : "VillagePuzzle");
}
export function reward(scene, branch) {
  if (!branchDone(tasks(), branch) || store.get(`villageSeen_${branch}`)) return messenger(scene);
  store.set(`villageSeen_${branch}`, true);
  const ring = branch === "inn" || branch === "house";
  if (ring) {
    const g = scene.add.graphics().setDepth(28);
    drawHeart(g, 600, 355, branch === "inn" ? 85 : 60, branch === "inn" ? 0xe26487 : 0xe6ad24);
    scene.time.delayedCall(2200, () => g.destroy());
  }
  scene.ui.dialogue(
    [DIALOGUE.villageFinds[branch === "inn" ? 0 : branch === "house" ? 1 : 2]],
    () => messenger(scene),
  );
}
export function messenger(scene) {
  if (!villageDone(tasks()) || store.get("villageMessengerSeen")) return;
  const visitor = drawing(scene, "watermelon", 1020, 600, 150, 27);
  scene.ui.dialogue([DIALOGUE.villageFinds[3]], () => {
    store.set("villageMessengerSeen", true);
    visitor.destroy();
  });
}
export function forest(scene) {
  const missing = Object.entries(BRANCHES).filter(([id]) => !branchDone(tasks(), id));
  if (missing.length) {
    scene.ui.openPanel(
      "Before the forest…",
      `<p>Our friends still need a hand.</p><div style="display:flex;gap:24px;justify-content:center">${
        missing.map(([, b]) =>
          `<figure><img src="${
            art[b.art]
          }" alt="${b.name}" style="width:100px;height:110px;object-fit:contain"><figcaption>${b.name}</figcaption></figure>`
        ).join("")
      }</div>`,
    );
    scene.ui.panelButton("Back to our friends", () => scene.ui.closePanel());
  } else scene.scene.start("ForestEdge");
}
