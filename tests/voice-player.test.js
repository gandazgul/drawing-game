import { assert, assertEquals } from "@std/assert";
import { VoicePlayer } from "../src/VoicePlayer.js";
import { speechRequest, VOICES } from "../src/voices.js";
import { dialogueKey, dialogueVoice, spokenLines } from "../src/dialogue.js";
import { canReserve } from "../scripts/voice-dialogue.js";
import manifest from "../assets/audio/manifest.json" with { type: "json" };

function fixture(play = () => Promise.resolve()) {
  const created = [];
  let errors = 0;
  const player = new VoicePlayer({
    resolve: (speaker) => speaker === "missing" ? null : `/${speaker}.mp3`,
    createAudio: () => {
      const audio = {
        play,
        paused: false,
        removed: false,
        pause() {
          this.paused = true;
        },
        removeAttribute() {},
        load() {},
        remove() {
          this.removed = true;
        },
      };
      created.push(audio);
      return audio;
    },
    onUnavailable: () => errors++,
  });
  return { player, created, errors: () => errors };
}

Deno.test("next line and mute stop the previous recording", async () => {
  const { player, created } = fixture();
  await player.play("Keila", "one");
  await player.play("Olivia", "two");
  assert(created[0].paused && created[0].removed);
  assertEquals(player.current, created[1]);
  player.stop();
  assert(created[1].paused && created[1].removed);
  assertEquals(player.current, null);
});

Deno.test("stale play rejection after Next cannot stop the new line", async () => {
  const pending = [];
  const { player, created, errors } = fixture(() =>
    new Promise((resolve, reject) => pending.push({ resolve, reject }))
  );
  const first = player.play("Keila", "one");
  const second = player.play("Olivia", "two");
  pending[0].reject(new Error("aborted"));
  pending[1].resolve();
  assertEquals(await first, false);
  assertEquals(await second, true);
  assertEquals(errors(), 0);
  assertEquals(player.current, created[1]);
});

Deno.test("missing, blocked and broken audio stay caption-only without a synthetic fallback", async () => {
  const { player, errors } = fixture(() => Promise.reject(new Error("autoplay")));
  assertEquals(await player.play("missing", "one"), false);
  assertEquals(await player.play("Keila", "two"), false);
  assertEquals(player.current, null);
  assertEquals(errors(), 2);
  const ok = fixture();
  await ok.player.play("Olivia", "hello");
  ok.created[0].onerror();
  assertEquals(ok.errors(), 1);
  assertEquals(ok.player.current, null);
});

Deno.test("cast is distinct and all runtime dialogue has an audio manifest entry", () => {
  const names = Object.values(VOICES).map((v) => v.name);
  assertEquals(new Set(names).size, names.length);
  assertEquals(dialogueVoice("A little idea"), "Narrator");
  for (const { speaker, text } of spokenLines()) {
    assert(speechRequest(dialogueVoice(speaker), text));
    assert(manifest[dialogueKey(speaker, text)], `Missing clip: ${speaker}: ${text}`);
  }
});

Deno.test("generation reserves a worst-case call before approaching total budget", () => {
  assert(canReserve([{ usd: .02 }, { usd: .4 }]));
  assert(canReserve([{ usd: 2 }]));
  assert(canReserve([{ usd: 4.6 }]));
  assertEquals(canReserve([{ usd: 4.7 }]), false);
  assertEquals(canReserve([{ usd: 5 }]), false);
});

Deno.test("recording completion advances its conversation once; cancelled audio cannot advance it", async () => {
  const { player, created } = fixture();
  let ended = 0, failed = 0;
  const callbacks = { onEnded: () => ended++, onFailed: () => failed++ };
  await player.play("Keila", "one", callbacks);
  const stale = created[0].onended;
  await player.play("Olivia", "two", callbacks);
  stale();
  assertEquals(ended, 0);
  const current = created[1].onended;
  current();
  current();
  assertEquals(ended, 1);
  assertEquals(player.current, null);
  await player.play("missing", "three", callbacks);
  assertEquals(failed, 1);
});
