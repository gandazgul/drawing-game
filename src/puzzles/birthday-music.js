export const MUSIC_TARGETS = [390, 470, 550, 650, 730, 810];
export const MUSIC_TOLERANCE = 85;
export const musicHits = (raw) => Number.isInteger(raw) ? Math.max(0, Math.min(5, raw)) : 0;
export function nextMusicTarget(previous, random = Math.random) {
  const choices = MUSIC_TARGETS.filter((x) => Math.abs(x - previous) >= 120 || !Number.isFinite(previous));
  return choices[Math.floor(random() * choices.length)];
}
export const musicHit = (noteX, targetX) =>
  Number.isFinite(noteX) && MUSIC_TARGETS.includes(targetX) &&
  Math.abs(noteX - targetX) <= MUSIC_TOLERANCE;

// Musical notation is an icon, not a replacement illustration of the girls' art.
export function paintMusicNote(note, color, paired = false) {
  note.clear().fillStyle(color).lineStyle(6, color);
  note.fillEllipse(-7, 8, 25, 17).lineBetween(3, 7, 3, -38);
  if (paired) {
    note.fillEllipse(25, 1, 25, 17).lineBetween(35, 0, 35, -45).lineBetween(3, -38, 35, -45);
  } else {
    note.lineBetween(3, -38, 20, -26).lineBetween(20, -26, 17, -15);
  }
  return note;
}
