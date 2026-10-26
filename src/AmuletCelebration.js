import { store } from "@gandazgul/caper-engine";
import { amuletTextures } from "./amulet-art.js";
import { amuletComplete } from "./puzzles/amulet-climax.js";
import { DIALOGUE } from "./dialogue.js";
import { font } from "./art.js";

// Finite, scene-owned effects. No flashing, no persistent particles, and no
// gameplay progress granted until the corresponding visible action finishes.
function sparkles(scene, x, y, broad = false) {
  const reduced = scene.registry.get("reducedMotion");
  const colors = [0xffdf59, 0xff91be, 0xc3a0ff, 0xffffff, 0x8ff0d0];
  const count = reduced ? 8 : broad ? 40 : 12;
  for (let i = 0; i < count; i++) {
    const angle = (i * Math.PI * 2) / count,
      radius = broad ? 130 + (i % 4) * 20 : 25;
    const star = scene.add
      .star(
        x + Math.cos(angle) * radius,
        y + Math.sin(angle) * radius,
        4,
        2,
        7 + (i % 4) * 2,
        colors[i % colors.length],
      )
      .setDepth(45);
    star.setData("amuletSparkle", true);
    scene.tweens.add({
      targets: star,
      ...(reduced
        ? {}
        : {
            x: x + Math.cos(angle) * radius * 1.7,
            y: y + Math.sin(angle) * radius * 1.5 + 35,
            angle: i % 2 ? 90 : -90,
            scale: 0.25,
          }),
      alpha: 0,
      duration: reduced ? 600 : broad ? 1800 : 750,
      ease: "Sine.easeOut",
      onComplete: () => star.destroy(),
    });
  }
}

export function playAmuletClimax(scene) {
  if (scene.climaxRunning) return;
  scene.climaxRunning = true;
  scene.scriptedTravel = true;
  scene.ui.setBusy(true);
  scene.activeMarker.setVisible(false);
  const reduced = scene.registry.get("reducedMotion");
  const textures = amuletTextures(scene);
  const walkers = [scene.walk, ...scene.idleCharacters.map((c) => c.walker)];
  const tween = (targets, props, duration, done) =>
    scene.tweens.add({
      targets,
      ...props,
      duration: reduced ? 180 : duration,
      ease: "Sine.easeInOut",
      onComplete: done,
    });
  const finish = () => {
    scene.climaxPhase = "done";
    scene.climaxRunning = false;
    scene.scriptedTravel = false;
    scene.activeMarker.setVisible(true);
    scene.ui.setBusy(false);
    scene.ui.status("Our amulet is whole! Tap Bounka to go outside and finish the tree house together.");
  };
  const invite = () => {
    scene.climaxPhase = "invitation";
    scene.ui.dialogue(DIALOGUE.studioTreehouseInvite, () => {
      store.set("studioTreehouseInvited", true);
      finish();
    });
  };
  const changeEyes = () => {
    store.set("studioKindEyes", true);
    const width = scene.bounka.displayWidth;
    scene.bounka.setTexture("bounkaKind").setScale(width / scene.bounka.width);
  };
  const assemble = () => {
    if (!amuletComplete(store.values)) {
      scene.ui.dialogue(DIALOGUE.studioGemMissingRings, () => {
        finish();
        scene.ui.status("The gem is safe. Our village friends have the other heart rings.");
      });
      return;
    }
    if (store.get("studioAmuletCelebrated")) {
      changeEyes();
      invite();
      return;
    }
    scene.climaxPhase = "assembling";
    scene.ui.setBusy(true);
    const veil = scene.add.rectangle(600, 400, 1200, 800, 0x172e39, 0.78).setDepth(30).setAlpha(0);
    const title = scene.add
      .text(600, 110, "Our heart, together again", {
        ...font,
        fontSize: "46px",
        color: "#fff9e9",
      })
      .setOrigin(0.5)
      .setDepth(44)
      .setAlpha(0);
    tween(veil, { alpha: 1 }, 350);
    tween(title, { alpha: 1 }, 500);
    const positions = [
      { x: 330, y: 330 },
      { x: 840, y: 285 },
      { x: 340, y: 520 },
      { x: 850, y: 510 },
    ];
    const pieces = textures.map((key, i) =>
      scene.add
        .image(reduced ? 600 : positions[i].x, reduced ? 350 : positions[i].y, key)
        .setDepth(40 + i)
        .setScale(reduced ? 0.94 : 0.62)
        .setAlpha(reduced ? 0 : 1),
    );
    let index = 0;
    const place = () => {
      const i = index++;
      tween(pieces[i], { x: 600, y: 350, scale: 0.94, alpha: 1 }, 650, () => {
        sparkles(scene, 600, 365);
        if (index < pieces.length) scene.time.delayedCall(reduced ? 80 : 160, place);
        else celebrate();
      });
    };
    const celebrate = () => {
      scene.climaxPhase = "celebrating";
      title.setText("We found every piece!");
      sparkles(scene, 600, 350, true);
      if (!reduced) {
        scene.tweens.add({ targets: pieces, scale: 1, duration: 450, yoyo: true, ease: "Sine.easeInOut" });
        for (const w of walkers) {
          scene.tweens.add({
            targets: w.sprite,
            y: w.sprite.y - 16,
            duration: 260,
            yoyo: true,
            ease: "Sine.easeOut",
          });
        }
      }
      scene.ui.dialogue(DIALOGUE.studioAmuletWonder, () => {
        // The complete heart stays on screen during the girls' reaction.
        scene.ui.setBusy(true);
        scene.tweens.killTweensOf(pieces);
        const cleanup = () => {
          [...pieces, title, veil].forEach((o) => o.destroy());
          store.set("studioAmuletCelebrated", true);
          changeEyes();
          sparkles(scene, scene.bounka.x, scene.bounka.y - scene.bounka.displayHeight * 0.65);
          invite();
        };
        if (reduced) tween([...pieces, title, veil], { alpha: 0 }, 180, cleanup);
        else {
          const s = scene.walk.sprite;
          tween(pieces, { x: s.x, y: s.y - s.displayHeight * 0.55, scale: 0.13 }, 750, () => {
            tween([...pieces, title, veil], { alpha: 0 }, 300, cleanup);
          });
        }
      });
    };
    scene.time.delayedCall(reduced ? 180 : 500, place);
  };
  const handOver = () => {
    scene.climaxPhase = "handoff";
    scene.ui.setBusy(true);
    const giver = scene.bounka,
      recipient = scene.walk.sprite;
    const gem = scene.add
      .image(giver.x - giver.displayWidth * 0.32, giver.y - giver.displayHeight * 0.42, textures[3])
      .setScale(0.85)
      .setDepth(20);
    const destination = { x: recipient.x + 36, y: recipient.y - recipient.displayHeight * 0.48 };
    const received = () => {
      sparkles(scene, destination.x, destination.y);
      store.set("studioGemFound", true);
      scene.time.delayedCall(reduced ? 200 : 600, () => {
        gem.destroy();
        assemble();
      });
    };
    if (reduced) {
      tween(gem, { alpha: 0 }, 180, () => {
        gem.setPosition(destination.x, destination.y);
        tween(gem, { alpha: 1 }, 180, received);
      });
    } else {
      scene.walk.applyFacing("right");
      scene.walk.playReach();
      tween(gem, destination, 1100, received);
    }
  };
  const begin = () => {
    walkers.forEach((w) => {
      w.lock();
      w.applyFacing("right");
    });
    if (!store.get("studioGemFound")) {
      scene.climaxPhase = "greeting";
      scene.ui.dialogue(DIALOGUE.studioMeet, handOver);
    } else assemble();
  };
  scene.climaxPhase = "gathering";
  let pending = walkers.length;
  walkers.forEach((w, i) => {
    const target = w.snapToWalkable({ x: 620 - i * 140, y: 690 });
    if (reduced) {
      w.teleportTo(target, "right");
      if (--pending === 0) begin();
    } else {
      w.unlock();
      w.walkTo(target, () => {
        w.lock();
        if (--pending === 0) begin();
      });
    }
  });
}
