// Register the existing drawings; do not redraw, stretch, or mirror their art.
// The generated sheet is not an exact grid. Find the four real silhouettes in
// each row, discarding disconnected flecks and transparent paper margins.
export function measureFrames({ data, width, height }, rows = 2, columns = 4, includePixels = false) {
  const frames = [];
  for (let row = 0; row < rows; row++) {
    const top = Math.round(row * height / rows), bottom = Math.round((row + 1) * height / rows);
    const rowHeight = bottom - top, visited = new Uint8Array(width * rowHeight);
    const parts = [];
    for (let start = 0; start < visited.length; start++) {
      if (visited[start] || data[(top * width + start) * 4 + 3] < 160) continue;
      const pixels = [start];
      visited[start] = 1;
      let x0 = width, y0 = rowHeight, x1 = 0, y1 = 0;
      for (let i = 0; i < pixels.length; i++) {
        const p = pixels[i], x = p % width, y = Math.floor(p / width);
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy, n = ny * width + nx;
            if (nx < 0 || nx >= width || ny < 0 || ny >= rowHeight || visited[n]) continue;
            if (data[(top * width + n) * 4 + 3] < 160) continue;
            visited[n] = 1;
            pixels.push(n);
          }
        }
      }
      if (pixels.length > 16) parts.push({ pixels, x0, x1, y0, y1 });
    }
    const figures = parts.sort((a, b) => b.pixels.length - a.pixels.length).slice(0, columns)
      .sort((a, b) => a.x0 - b.x0);
    if (figures.length !== columns) throw Error(`Expected ${columns} figures in row ${row + 1}`);
    for (const part of figures) {
      const h = part.y1 - part.y0 + 1;
      // Head center stays put when an arm swings out. Bounding-box centering
      // alone would shift the entire body in response to that moving arm.
      const headRows = new Map();
      for (const p of part.pixels) {
        const x = p % width, y = Math.floor(p / width);
        if (y < part.y0 + h * .12 || y > part.y0 + h * .34) continue;
        const span = headRows.get(y) ?? [width, 0];
        span[0] = Math.min(span[0], x);
        span[1] = Math.max(span[1], x);
        headRows.set(y, span);
      }
      const centers = [...headRows.values()].map(([a, b]) => (a + b) / 2).sort((a, b) => a - b);
      const center = centers[Math.floor(centers.length / 2)] ?? (part.x0 + part.x1) / 2;
      frames.push({
        x: part.x0,
        y: top + part.y0,
        width: part.x1 - part.x0 + 1,
        height: h,
        center: center - part.x0,
        ...(includePixels ? { pixels: part.pixels.map(p => p + top * width) } : {}),
      });
    }
  }
  return frames;
}

export function framePlacement(frame, centerX, groundY, characterHeight) {
  const scale = characterHeight / frame.height;
  return {
    x: centerX - frame.center * scale,
    y: groundY - characterHeight,
    width: frame.width * scale,
    height: characterHeight,
  };
}
