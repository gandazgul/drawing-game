// Fullscreen must be requested synchronously from the user's button click.
// Keep a visible, reversible large-view fallback if the browser denies it.
export function installFullscreen({ button, target, notice, doc = document }) {
  let fallback = false, pending = false;
  const update = () => {
    const native = Boolean(doc.fullscreenElement);
    target.classList.toggle("large-view", native || fallback);
    button.textContent = native ? "Exit full screen" : fallback ? "Exit large view" : "Full screen";
    button.setAttribute("aria-pressed", String(native || fallback));
  };
  button.onclick = async () => {
    if (pending) return;
    pending = true;
    try {
      if (doc.fullscreenElement) await doc.exitFullscreen();
      else if (fallback) fallback = false;
      else {
        if (!target.requestFullscreen) throw Error("Fullscreen unavailable");
        await target.requestFullscreen({ navigationUI: "hide" });
      }
      notice.hidden = true;
    } catch {
      fallback = !doc.fullscreenElement;
      notice.textContent = fallback
        ? "Your browser blocked fullscreen. Large view is on; turn sideways for more drawing room."
        : "Use your phone’s Back gesture to leave fullscreen.";
      notice.hidden = false;
    } finally {
      pending = false;
      update();
    }
  };
  doc.addEventListener("fullscreenchange", update);
  doc.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && fallback) {
      fallback = false;
      notice.hidden = true;
      update();
    }
  });
  update();
}

export function watchGameViewport(game) {
  let pending;
  const refresh = () => {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => {
      // CSS rail/fullscreen changes also move the canvas. Update both its size
      // and input bounds, even when the browser doesn't emit window.resize.
      game.scale.getParentBounds();
      game.scale.refresh();
    });
  };
  const observer = new ResizeObserver(refresh);
  observer.observe(document.getElementById("game"));
  globalThis.visualViewport?.addEventListener("resize", refresh);
  document.addEventListener("fullscreenchange", refresh);
  game.events.once("destroy", () => {
    observer.disconnect();
    cancelAnimationFrame(pending);
    globalThis.visualViewport?.removeEventListener("resize", refresh);
    document.removeEventListener("fullscreenchange", refresh);
  });
  refresh();
}
