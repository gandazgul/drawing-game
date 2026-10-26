// DOM overlay crosses the canvas boundary to reach the actual toolbar book.
export function flySticker({ scene, image, book, document: doc = document, reduced = false }) {
  const highlight = () =>
    book.animate?.(
      [
        { backgroundColor: "#fff9e9", outline: "3px solid #fddf55" },
        { backgroundColor: "#fddf55", outline: "3px solid #fddf55" },
        { backgroundColor: "#fff9e9", outline: "3px solid transparent" },
      ],
      { duration: 420 },
    );
  if (reduced || !book.animate) {
    highlight();
    return;
  }
  const canvas = scene.game.canvas.getBoundingClientRect();
  const bounds = image.getBounds();
  const sx = canvas.width / scene.scale.width,
    sy = canvas.height / scene.scale.height;
  const width = image.displayWidth * sx,
    height = image.displayHeight * sy;
  const x = canvas.left + bounds.centerX * sx,
    y = canvas.top + bounds.centerY * sy;
  const destination = book.getBoundingClientRect();
  const dx = destination.left + destination.width / 2 - x;
  const dy = destination.top + destination.height / 2 - y;
  const flyer = doc.createElement("img");
  const source = image.texture.getSourceImage();
  flyer.src = source.toDataURL ? source.toDataURL() : source.src;
  flyer.alt = "";
  flyer.className = "sticker-flight";
  Object.assign(flyer.style, {
    left: `${x - width / 2}px`,
    top: `${y - height / 2}px`,
    width: `${width}px`,
    height: `${height}px`,
  });
  doc.body.append(flyer);
  const animation = flyer.animate(
    [
      { transform: `translate(0, 0) rotate(${image.angle}deg) scale(1)`, opacity: 1 },
      {
        transform: `translate(${dx * 0.42}px, ${dy * 0.42 - 65}px) rotate(-12deg) scale(1.15)`,
        opacity: 1,
        offset: 0.42,
      },
      { transform: `translate(${dx}px, ${dy}px) rotate(0deg) scale(.22)`, opacity: 0.3 },
    ],
    { duration: 720, easing: "cubic-bezier(.25,.1,.25,1)", fill: "forwards" },
  );
  let cancelled = false;
  const cancel = () => {
    cancelled = true;
    animation.cancel();
    flyer.remove();
  };
  scene.events.once("shutdown", cancel);
  animation.finished
    .then(() => {
      if (!cancelled) highlight();
    })
    .catch(() => {})
    .finally(() => {
      flyer.remove();
      scene.events.off("shutdown", cancel);
    });
}
