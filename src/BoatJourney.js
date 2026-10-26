// One scene-owned journey: shore walk → board → sail → dock → step ashore.
// Nothing transient is saved; reloading always returns to a playable shore.
export const BOAT_LANDINGS = {
  Port: { shore: [{ x: 610, y: 720 }, { x: 555, y: 710 }], dockShift: { x: -135, y: 0 } },
  Pond: { shore: [{ x: 230, y: 635 }, { x: 310, y: 650 }], dockShift: { x: 0, y: 0 } },
  Harbor: { shore: [{ x: 785, y: 650 }, { x: 710, y: 650 }], dockShift: { x: 0, y: 0 } },
};
const seats = [{ x: -135, y: 178 }, { x: 80, y: 178 }];
const passengerScale = .36;

export function takeBoatArrival(data) {
  const arriving = data?.boatArrival === true;
  if (data) delete data.boatArrival; // Phaser reuses scene data on later visits.
  return arriving;
}

function trip(scene) {
  const journey = { phase: "approach" };
  scene.boatJourney = journey;
  scene.ui.setBusy(true);
  scene.activeMarker.setVisible(false);
  const walkers = [scene.walk, ...scene.idleCharacters.map((c) => c.walker)];
  const original = walkers.map((w) => ({
    scaleX: w.sprite.scaleX,
    scaleY: w.sprite.scaleY,
    depth: w.sprite.depth,
  }));
  const reduced = scene.registry.get("reducedMotion");
  const boat = scene.boat, root = boat.root, landing = BOAT_LANDINGS[scene.scene.key];
  const boatScale = Math.abs(root.scaleX);
  const face = (direction) => {
    root.setScale(direction * boatScale, root.scaleY);
    for (const person of boat.passengers ?? []) person.setFlipX(direction < 0);
  };
  const parked = { x: root.x, y: root.y };
  const dock = { x: parked.x + landing.dockShift.x, y: parked.y + landing.dockShift.y };
  const tween = (targets, props, duration, done) =>
    scene.tweens.add({
      targets,
      ...props,
      duration: reduced ? 100 : duration,
      ease: "Sine.easeInOut",
      onComplete: done,
    });
  const together = (actions, done) => {
    let remaining = actions.length;
    for (const action of actions) {
      action(() => {
        if (--remaining === 0) done();
      });
    }
  };
  const pose = () =>
    walkers.forEach((w) => {
      w.lock();
      w.applyFacing("down");
    });
  const seat = (i) => ({ x: root.x + seats[i].x * root.scaleX, y: root.y + seats[i].y * root.scaleY });
  const passengers = () => {
    pose();
    boat.showPassengers(walkers.map((w) => w.sprite), seats, passengerScale);
    walkers.forEach((w) => w.sprite.setVisible(false));
  };
  const sail = (target, phase, done) => {
    journey.phase = phase;
    face(target.x < root.x ? -1 : 1);
    if (reduced) {
      tween(root, { alpha: 0 }, 100, () => {
        root.setPosition(target.x, target.y);
        tween(root, { alpha: 1 }, 100, done);
      });
    } else tween(root, target, phase === "departing" ? 1300 : 1600, done);
  };
  const finish = (done) => {
    root.setPosition(parked.x, parked.y).setAlpha(1);
    walkers.forEach((w, i) => {
      w.sprite.setScale(original[i].scaleX, original[i].scaleY).setDepth(original[i].depth).setVisible(true);
    });
    scene.activeMarker.setVisible(true);
    journey.phase = "done";
    scene.ui.setBusy(false);
    done?.();
  };
  return {
    scene,
    journey,
    walkers,
    original,
    reduced,
    boat,
    boatScale,
    face,
    root,
    landing,
    parked,
    dock,
    tween,
    together,
    pose,
    seat,
    passengers,
    sail,
    finish,
  };
}

export function departByBoat(scene, destination) {
  if (scene.blocked || scene.editor.active) return;
  const t = trip(scene);
  t.face(t.dock.x < t.root.x ? -1 : 1);
  t.journey.destination = destination;
  // Let the boat draw alongside while both sisters follow the real shore/bridge.
  t.together([
    (done) => t.tween(t.root, t.dock, 650, done),
    ...t.walkers.map((w, i) => (done) => {
      const target = w.snapToWalkable(t.landing.shore[i]);
      if (t.reduced) {
        w.teleportTo(target, "down");
        done();
      } else {
        w.unlock();
        w.walkTo(target, () => {
          w.lock();
          done();
        });
      }
    }),
  ], () => {
    t.journey.phase = "boarding";
    t.face(1);
    t.pose();
    t.walkers.forEach((w) => w.sprite.setDepth(9));
    t.together(
      t.walkers.map((w, i) => (done) => {
        t.tween(
          w.sprite,
          { ...t.seat(i), scaleX: passengerScale * t.boatScale, scaleY: passengerScale * t.root.scaleY },
          500,
          done,
        );
      }),
      () => {
        t.passengers();
        t.sail({ x: 1500, y: Math.max(340, t.dock.y - 75) }, "departing", () => {
          scene.scene.start(destination, { boatArrival: true });
        });
      },
    );
  });
}

export function arriveByBoat(scene, done) {
  // Wait for saved editor positions to restore, without showing standing sisters
  // or a parked boat for one frame before the arrival begins.
  scene.ui.setBusy(true);
  scene.activeMarker.setVisible(false);
  scene.boat.root.setVisible(false);
  [scene.walk, ...scene.idleCharacters.map((c) => c.walker)].forEach((w) => w.sprite.setVisible(false));
  scene.time.delayedCall(0, () => {
    const t = trip(scene);
    t.face(-1);
    t.root.setPosition(1500, Math.max(340, t.dock.y - 75)).setVisible(true);
    t.passengers();
    t.sail(t.dock, "arriving", () => {
      t.journey.phase = "disembarking";
      t.boat.clearPassengers();
      t.walkers.forEach((w, i) => {
        const p = t.seat(i);
        w.sprite.setPosition(p.x, p.y).setScale(passengerScale * t.boatScale).setDepth(9).setVisible(true);
      });
      t.together(
        t.walkers.map((w, i) => (next) => {
          t.tween(
            w.sprite,
            {
              ...w.snapToWalkable(t.landing.shore[i]),
              scaleX: t.original[i].scaleX,
              scaleY: t.original[i].scaleY,
            },
            550,
            next,
          );
        }),
        () => {
          t.journey.phase = "moored";
          if (t.parked.x !== t.root.x) t.face(t.parked.x < t.root.x ? -1 : 1);
          t.tween(t.root, t.parked, 500, () => t.finish(done));
        },
      );
    });
  });
}
