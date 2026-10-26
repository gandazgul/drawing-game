import { assertEquals } from "@std/assert";
import { installFullscreen } from "../src/display.js";

function setup(available) {
  const classes = new Set(), events = {};
  const button = { setAttribute() {} }, notice = { hidden: true };
  const doc = {
    fullscreenElement: null,
    addEventListener: (name, action) => events[name] = action,
    exitFullscreen: () => {
      doc.fullscreenElement = null;
      events.fullscreenchange();
    },
  };
  const target = {
    classList: { toggle: (name, value) => value ? classes.add(name) : classes.delete(name) },
    requestFullscreen: available
      ? () => {
        doc.fullscreenElement = target;
        events.fullscreenchange();
        return Promise.resolve();
      }
      : () => Promise.reject(Error("Denied")),
  };
  installFullscreen({ button, target, notice, doc });
  return { button, target, notice, doc, classes, events };
}

Deno.test("fullscreen reflects native entry and exit instead of a silent button", async () => {
  const s = setup(true);
  await s.button.onclick();
  assertEquals(s.doc.fullscreenElement, s.target);
  assertEquals(s.button.textContent, "Exit full screen");
  assertEquals(s.classes.has("large-view"), true);
  await s.button.onclick();
  assertEquals(s.button.textContent, "Full screen");
  assertEquals(s.classes.has("large-view"), false);
});

Deno.test("denied fullscreen offers a visible large view with working exit and Escape", async () => {
  const s = setup(false);
  await s.button.onclick();
  assertEquals(s.notice.hidden, false);
  assertEquals(s.button.textContent, "Exit large view");
  await s.button.onclick();
  assertEquals(s.notice.hidden, true);
  assertEquals(s.classes.has("large-view"), false);
  await s.button.onclick();
  s.events.keydown({ key: "Escape" });
  assertEquals(s.classes.has("large-view"), false);
});
