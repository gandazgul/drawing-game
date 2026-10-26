// Only a completed hold opens the full-reset warning; it never resets progress.
export function installResetHold(
  button,
  { shortPress, longPress, schedule = setTimeout, cancel = clearTimeout },
) {
  let timer,
    origin,
    held = false,
    suppressClick = false;
  const stop = () => {
    cancel(timer);
    timer = null;
    origin = null;
    button.classList.remove("holding");
  };
  const start = () => {
    if (button.disabled) return;
    stop();
    held = false;
    suppressClick = false;
    button.classList.add("holding");
    timer = schedule(() => {
      stop();
      held = true;
      suppressClick = true;
      longPress();
    }, 1200);
  };
  button.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || !e.isPrimary) return;
    start();
    origin = { x: e.clientX, y: e.clientY };
    button.setPointerCapture(e.pointerId);
  });
  button.addEventListener("pointermove", (e) => {
    if (origin && Math.hypot(e.clientX - origin.x, e.clientY - origin.y) > 12) {
      stop();
      suppressClick = true;
    }
  });
  button.addEventListener("pointerup", stop);
  button.addEventListener("pointercancel", () => {
    stop();
    suppressClick = true;
  });
  button.addEventListener("lostpointercapture", stop);
  button.addEventListener("contextmenu", (e) => e.preventDefault());
  button.addEventListener("keydown", (e) => {
    if (![" ", "Enter"].includes(e.key)) return;
    e.preventDefault();
    if (!e.repeat) start();
  });
  button.addEventListener("keyup", (e) => {
    if (![" ", "Enter"].includes(e.key)) return;
    e.preventDefault();
    const active = timer !== null && timer !== undefined;
    stop();
    if (active && !held) shortPress();
  });
  button.addEventListener("click", () => {
    if (!suppressClick && !held) shortPress();
    suppressClick = held = false;
  });
  button.addEventListener("blur", stop);
  return stop;
}
