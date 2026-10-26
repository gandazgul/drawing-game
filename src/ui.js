import { store } from "@gandazgul/caper-engine";
import { art } from "./art.js";
import { VoicePlayer } from "./VoicePlayer.js";
import { voiceURL } from "./voice-assets.js";
import { Conversation } from "./Conversation.js";
import { stickerCount, STICKERS } from "./stickers.js";
import { flySticker } from "./sticker-flight.js";
import { branchDone } from "./village-progress.js";
import { installFullscreen } from "./display.js";
import { chapterForScene, CHAPTERS, enterChapter } from "./chapters.js";
import { installResetHold } from "./hold-reset.js";
import { amuletSVG as heart } from "./amulet-art.js";

const $ = (id) => document.getElementById(id);

export class GameUI {
  constructor() {
    this.scene = null;
    this.busy = true;
    this.panelOpen = false;
    this.readAloud = store.get("voicesOn") !== false;
    this.settingsOpen = false;
    this.effectsOn = store.get("effectsOn") !== false;
    this.currentLine = null;
    this.voice = new VoicePlayer({
      resolve: voiceURL,
      createAudio: () => {
        const audio = document.createElement("audio");
        audio.id = "dialogue-audio";
        audio.hidden = true;
        document.body.append(audio);
        return audio;
      },
      onUnavailable: () => {
        this.voiceNeedsGesture = true;
        this.status("Tap to enable voices. Captions will keep going.");
      },
    });
    this.conversation = new Conversation({
      voice: this.voice,
      show: (speaker, text) => {
        this.currentLine = [speaker, text];
        $("speaker").textContent = speaker;
        $("line").textContent = text;
      },
    });
    globalThis.addEventListener("pagehide", () => this.conversation.stop());
    // Browsers may block the opening narration until the first real gesture.
    const retryVoice = () => {
      if (!this.voiceNeedsGesture || !this.readAloud || !this.conversation.active) return;
      this.voiceNeedsGesture = false;
      this.conversation.setSpoken(true);
    };
    document.addEventListener("pointerup", retryVoice);
    document.addEventListener("keyup", retryVoice);
    for (const id of ["keila", "olivia"]) $(id).onclick = () => this.scene?.switchSister(id);
    $("book").onclick = () => this.showBook();
    $("amulet").onclick = () => {
      const inn = branchDone(store.get("villageTasks"), "inn");
      const house = branchDone(store.get("villageTasks"), "house");
      const gem = store.get("studioGemFound") === true;
      this.openPanel(
        "Our heart amulet",
        `${heart}<p>${Number(inn) + Number(house)} of 2 heart rings found.</p><p>${
          gem && inn && house
            ? "Every color is back! Our heart amulet is whole again."
            : inn && house
              ? "Only the little heart gem is missing. Our forest friend saw it at Bounka's workshop."
              : "We kept the outside heart. Help our village friends find the two heart rings."
        }</p>`,
      );
      const paths = document.querySelectorAll(".heart-display path");
      paths[1]?.classList.toggle("missing", !inn);
      paths[2]?.classList.toggle("missing", !house);
      paths[3]?.classList.toggle("missing", !gem);
      paths[3]?.classList.add("center-gem");
      document
        .querySelector(".heart-display")
        ?.setAttribute(
          "aria-label",
          `Purple heart frame. Pink inn ring ${inn ? "found" : "missing"}. Gold house ring ${
            house ? "found" : "missing"
          }. Teal center gem ${gem ? "found" : "missing"}.`,
        );
    };
    $("hint").onclick = () => {
      this.hintRequested = true;
      try {
        this.scene?.hint();
      } finally {
        this.hintRequested = false;
      }
    };
    $("editor").onclick = () => {
      this.toggleSettings(false);
      this.scene?.editor?.toggle();
    };
    $("save-layout").onclick = () => this.scene?.saveLayout?.();
    $("close-panel").onclick = () => this.closePanel();
    const updateEffects = () => {
      $("effects").textContent = `Sounds: ${this.effectsOn ? "on" : "off"}`;
      $("effects").setAttribute("aria-pressed", String(this.effectsOn));
    };
    updateEffects();
    $("effects").onclick = () => {
      this.effectsOn = !this.effectsOn;
      store.set("effectsOn", this.effectsOn);
      if (!this.effectsOn) this.scene?.sound.stopAll();
      updateEffects();
    };
    const updateVoices = () => {
      $("sound").textContent = this.readAloud ? "Mute voices" : "Unmute voices";
      $("sound").setAttribute("aria-pressed", String(!this.readAloud));
    };
    updateVoices();
    $("sound").onclick = () => {
      this.readAloud = !this.readAloud;
      store.set("voicesOn", this.readAloud);
      updateVoices();
      if (this.conversation.active) this.conversation.setSpoken(this.readAloud);
      else if (!this.readAloud) this.voice.stop();
    };
    installFullscreen({
      button: $("fullscreen"),
      target: document.querySelector(".game-shell"),
      notice: $("display-notice"),
    });
    $("settings").onclick = () => this.toggleSettings(!this.settingsOpen);
    this.cancelResetHold = installResetHold($("restart"), {
      shortPress: () => this.confirmReset(false),
      longPress: () => this.confirmReset(true),
    });
    $("restart-all").onclick = () => this.confirmReset(true);
    document.addEventListener(
      "pointerdown",
      (event) => {
        if (this.settingsOpen && !$("settings-wrap").contains(event.target)) {
          this.toggleSettings(false);
          // Dismissing the menu must not also click a world hotspot beneath it.
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      true,
    );
    document.addEventListener("keydown", (event) => {
      if (this.settingsOpen) {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopImmediatePropagation();
          this.toggleSettings(false);
          return;
        }
        if (event.key === "Tab") {
          const nodes = [
            $("settings"),
            ...$("settings-menu").querySelectorAll("button:not(:disabled), summary"),
          ].filter((node) => node.getClientRects().length);
          const first = nodes[0],
            last = nodes.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }
      if (this.panelOpen) {
        if (event.key === "Escape") this.closePanel();
        if (event.key === "Tab") {
          const nodes = [...$("panel").querySelectorAll("button:not(:disabled), [tabindex='0']")];
          const first = nodes[0],
            last = nodes.at(-1);
          if (event.shiftKey && (document.activeElement === first || document.activeElement === $("panel"))) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }
      }
    });
    store.onChange(() => this.refresh());
    store.onSaveStatusChange((status) => {
      this.saveWarning = ["unavailable", "invalid", "incompatible"].includes(status.state);
      if (this.saveWarning) {
        this.status(
          "Progress cannot be saved here. You can keep playing. Reload to retry, or hold Start over to reset the whole save.",
        );
      }
    });
    this.refresh();
  }

  setScene(scene, place) {
    this.clearDialogue();
    clearTimeout(this.statusTimer);
    if (!this.saveWarning) $("status").classList.add("sr-only");
    this.scene = scene;
    enterChapter(store, scene.scene.key);
    this.busy = false;
    this.toggleSettings(false, false);
    $("place").textContent = place;
    $("loading").hidden = true;
    this.refresh();
  }

  refresh() {
    const editing = this.scene?.editor?.active === true;
    $("editor").disabled = this.busy || this.panelOpen || !this.scene?.editor;
    $("editor").setAttribute("aria-pressed", String(editing));
    $("editor").textContent = editing ? "Exit editor" : "Editor";
    $("save-layout").hidden = !editing;
    const id = store.getActiveCharacter();
    for (const name of ["keila", "olivia"]) $(name).setAttribute("aria-pressed", String(name === id));
    for (const name of ["keila", "olivia", "amulet", "book", "hint"]) {
      $(name).disabled = this.busy || this.panelOpen || this.settingsOpen || editing || !this.scene;
    }
    $("restart").disabled = this.busy;
    $("restart-all").disabled = this.busy;
    $("settings").disabled =
      this.panelOpen ||
      !this.scene ||
      this.scene.scriptedTravel ||
      (this.busy && this.scene?.boatJourney?.phase !== undefined && this.scene.boatJourney.phase !== "done");
    $("sticker-dot").hidden = stickerCount(store.list("stickers")) === 0;
  }

  status(text) {
    if (!this.saveWarning || text.startsWith("Progress cannot")) $("status").textContent = text;
    if (this.hintRequested || this.saveWarning) {
      clearTimeout(this.statusTimer);
      $("status").classList.remove("sr-only");
      if (!this.saveWarning) this.statusTimer = setTimeout(() => $("status").classList.add("sr-only"), 6500);
    }
  }
  collectSticker(scene, image, name) {
    flySticker({ scene, image, book: $("book"), reduced: scene.registry.get("reducedMotion") });
    this.status(`${name} found! It's in your sticker book.`);
    this.refresh();
  }
  setBusy(busy) {
    this.busy = busy;
    this.scene?.setBlocked(busy || this.panelOpen || this.settingsOpen);
    this.refresh();
  }

  speak(speaker, text) {
    if (!this.readAloud) return;
    void this.voice.play(speaker, text);
  }

  dialogue(lines, done = () => {}) {
    this.clearDialogue();
    this.setBusy(true);
    $("dialogue").hidden = false;
    $("next").textContent = "Skip";
    $("next").classList.remove("ready");
    $("next").onclick = () => this.conversation.finish();
    this.conversation.start(lines, this.readAloud, () => {
      this.clearDialogue();
      this.setBusy(false);
      done();
    });
  }

  clearDialogue() {
    $("dialogue").hidden = true;
    $("next").onclick = null;
    this.currentLine = null;
    this.conversation.stop();
  }

  openPanel(title, html) {
    if (this.busy) return;
    if (this.settingsOpen) this.toggleSettings(false);
    this.voice.stop();
    this.previousFocus = document.activeElement;
    this.panelOpen = true;
    this.scene?.setBlocked(true);
    $("panel-title").textContent = title;
    $("panel-body").innerHTML = html;
    $("panel-shade").hidden = false;
    $("panel").focus();
    this.refresh();
  }

  panelButton(label, action, primary = true) {
    const button = document.createElement("button");
    button.className = primary ? "primary" : "secondary";
    button.textContent = label;
    button.onclick = action;
    $("panel-body").append(button);
  }

  closePanel() {
    this.panelOpen = false;
    $("panel-shade").hidden = true;
    this.scene?.setBlocked(this.busy);
    this.refresh();
    this.previousFocus?.focus?.({ preventScroll: true });
  }

  toggleSettings(open, focus = true) {
    this.cancelResetHold?.();
    this.settingsOpen = open;
    $("settings-menu").hidden = !open;
    $("settings").setAttribute("aria-expanded", String(open));
    this.scene?.setBlocked(this.busy || this.panelOpen || open);
    if (focus) (open ? $("fullscreen") : $("settings")).focus({ preventScroll: true });
    this.refresh();
  }

  confirmReset(all) {
    if (this.busy) return;
    const chapter = CHAPTERS[chapterForScene(this.scene?.scene.key, store.get("chapter"))];
    this.openPanel(
      all ? "Reset the entire adventure?" : `Start chapter ${chapter.number} over?`,
      all
        ? "<p>This erases every chapter’s drawings, puzzles and collected stickers on this browser. This cannot be undone.</p><p>Your saved editor layouts and sound preferences stay.</p>"
        : `<p>${chapter.name} will start again. Only this chapter’s drawings, puzzles and stickers will be cleared.</p><p>Other chapters and your saved editor layouts stay.</p>`,
    );
    this.panelButton("Keep playing", () => this.closePanel(), false);
    this.panelButton(all ? "Erase all progress" : "Restart this chapter", () => {
      this.closePanel();
      this.restart?.(all);
    });
    $("panel-body").querySelector("button").focus();
  }

  showBook() {
    const count = stickerCount(store.list("stickers"));
    const slots = STICKERS.map((s) => {
      const found = store.has("stickers", s.id);
      return `<figure class="sticker-entry"><div class="sticker-slot ${found ? "" : "missing"}"><img src="${
        art[found ? s.art : `${s.art}Mask`]
      }" alt="${found ? s.name : `Missing ${s.name}`}" ${
        found ? "" : 'class="sticker-silhouette"'
      }></div><figcaption>${found ? s.name : "Still hiding"}</figcaption></figure>`;
    }).join("");
    this.openPanel(
      "Our sticker book",
      `<svg width="0" height="0" aria-hidden="true"><defs><filter id="sticker-edge"><feMorphology in="SourceAlpha" operator="dilate" radius="2" result="outer"/><feComposite in="outer" in2="SourceAlpha" operator="out" result="edge"/><feFlood flood-color="#7250a0"/><feComposite in2="edge" operator="in"/></filter></defs></svg><p>${count} of ${STICKERS.length} found${
        count === STICKERS.length ? " · Our book is full!" : ""
      }</p><div class="sticker-grid">${slots}</div><p>Look around the harbor, pond, port, village and inn. Stickers are just for finding—you can keep adventuring without them.</p>`,
    );
  }
}
