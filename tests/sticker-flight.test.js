import { assertEquals } from "@std/assert";
import { flySticker } from "../src/sticker-flight.js";

function fixture() {
  const calls = [];
  let resolve, reject;
  const finished = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  const animation = {
    finished,
    cancel: () => {
      calls.push("cancel");
      reject(new Error("cancelled"));
    },
  };
  const flyer = {
    style: {},
    remove: () => calls.push("remove"),
    animate: (frames) => {
      calls.push(frames);
      return animation;
    },
  };
  const scene = {
    game: { canvas: { getBoundingClientRect: () => ({ left: 10, top: 80, width: 600, height: 400 }) } },
    scale: { width: 1200, height: 800 },
    events: { once: (_event, cb) => scene.cancel = cb, off: () => calls.push("off") },
  };
  const image = {
    displayWidth: 80,
    displayHeight: 60,
    angle: 0,
    getBounds: () => ({ centerX: 200, centerY: 400 }),
    texture: { getSourceImage: () => ({ src: "drawing.webp" }) },
  };
  const book = {
    animate: () => calls.push("highlight"),
    getBoundingClientRect: () => ({ left: 520, top: 10, width: 80, height: 40 }),
  };
  const document = { createElement: () => flyer, body: { append: () => calls.push("append") } };
  return { scene, image, book, document, calls, flyer, resolve };
}

Deno.test("sticker flight maps canvas to toolbar and highlights on arrival", async () => {
  const f = fixture();
  flySticker(f);
  assertEquals(f.flyer.style.left, "90px");
  assertEquals(f.flyer.style.top, "265px");
  assertEquals(f.calls[1][2].transform, "translate(450px, -250px) rotate(0deg) scale(.22)");
  f.resolve();
  await new Promise((r) => setTimeout(r, 0));
  assertEquals(f.calls.includes("highlight"), true);
  assertEquals(f.calls.includes("remove"), true);
  assertEquals(f.calls.includes("off"), true);
});
Deno.test("reduced motion confirms without spatial flight", () => {
  const f = fixture();
  flySticker({ ...f, reduced: true });
  assertEquals(f.calls, ["highlight"]);
});
Deno.test("scene exit cancels a flight without delayed book feedback", async () => {
  const f = fixture();
  flySticker(f);
  f.scene.cancel();
  await new Promise((r) => setTimeout(r, 0));
  assertEquals(f.calls.includes("cancel"), true);
  assertEquals(f.calls.includes("highlight"), false);
  assertEquals(f.calls.includes("off"), true);
});
