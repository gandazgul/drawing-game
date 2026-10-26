import { assert, test } from "vite-plus/test";
import { Conversation, readingTime } from "../src/Conversation.js";

function fixture() {
  const shown = [],
    clips = [],
    timers = new Map();
  let finished = 0,
    id = 0;
  const player = new Conversation({
    voice: {
      stop() {},
      play(speaker, text, callbacks) {
        clips.push({ speaker, text, ...callbacks });
      },
    },
    show: (...line) => shown.push(line),
    schedule: (callback, delay) => {
      timers.set(++id, { callback, delay });
      return id;
    },
    cancel: (id) => timers.delete(id),
  });
  const tick = () => {
    const [id, { callback }] = timers.entries().next().value;
    timers.delete(id);
    callback();
  };
  const start = (spoken = true) =>
    player.start(
      [
        ["Keila", "One"],
        ["Olivia", "Two"],
      ],
      spoken,
      () => finished++,
    );
  return { player, shown, clips, timers, tick, start, finished: () => finished };
}

test("conversation speaks through every line and dismisses without a final click", () => {
  const f = fixture();
  f.start();
  assert.deepEqual(f.shown, [["Keila", "One"]]);
  f.clips[0].onEnded();
  f.tick();
  assert.deepEqual(f.shown.at(-1), ["Olivia", "Two"]);
  f.clips[1].onEnded();
  f.tick();
  assert.deepEqual(f.finished(), 1);
  assert.deepEqual(f.player.active, false);
  assert.deepEqual(f.timers.size, 0);
  f.player.finish();
  f.player.finish();
  assert.deepEqual(f.finished(), 1);
});
test("muted and missing voices auto-advance on readable caption timing", () => {
  const f = fixture();
  f.start(false);
  assert.deepEqual(f.clips.length, 0);
  assert([...f.timers.values()][0].delay >= 4500);
  f.tick();
  f.tick();
  assert.deepEqual(f.finished(), 1);
  const g = fixture();
  g.start();
  g.clips[0].onFailed();
  g.tick();
  assert.deepEqual(g.shown.at(-1), ["Olivia", "Two"]);
  assert(readingTime("a longer sentence with several words to read") > readingTime("Hi"));
});
test("skip and scene changes cancel timers and ignore old audio callbacks", () => {
  const f = fixture();
  f.start();
  const stale = f.clips[0].onEnded;
  f.player.finish();
  stale();
  assert.deepEqual(f.timers.size, 0);
  assert.deepEqual(f.finished(), 1);
  f.start();
  f.player.stop();
  f.clips.at(-1).onFailed();
  assert.deepEqual(f.timers.size, 0);
  assert.deepEqual(f.finished(), 1);
});
test("muting an active conversation cancels audio timing without stranding the line", () => {
  const f = fixture();
  f.start();
  const stale = f.clips[0].onEnded;
  f.player.setSpoken(false);
  stale();
  assert.deepEqual(f.timers.size, 1);
  f.tick();
  assert.deepEqual(f.shown.at(-1), ["Olivia", "Two"]);
  f.player.setSpoken(true);
  f.clips.at(-1).onEnded();
  f.tick();
  assert.deepEqual(f.finished(), 1);
});
