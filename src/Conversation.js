// Conversations play and dismiss themselves; finishing early remains optional.
// Timers and voice events are injectable so cancellation/races can be tested.
export const readingTime = (text) => Math.max(4500, text.trim().split(/\s+/).length * 400 + 1600);

export class Conversation {
  constructor(
    { voice, show, schedule = (fn, ms) => setTimeout(fn, ms), cancel = (id) => clearTimeout(id) },
  ) {
    Object.assign(this, { voice, show, schedule, cancel });
    this.generation = 0;
  }
  start(lines, spoken, done) {
    this.stop();
    this.lines = lines;
    this.spoken = spoken;
    this.done = done;
    this.index = 0;
    this.active = true;
    if (lines.length) this.playLine();
    else this.finish();
  }
  playLine() {
    this.cancel(this.timer);
    this.voice.stop();
    const generation = ++this.generation;
    const [speaker, text] = this.lines[this.index];
    this.show(speaker, text);
    const current = () => this.active && generation === this.generation;
    const next = () => {
      if (!current()) return;
      this.cancel(this.timer);
      this.voice.stop();
      this.generation++;
      if (this.index + 1 < this.lines.length) {
        this.index++;
        this.playLine();
      } else this.finish();
    };
    const later = (delay) => {
      if (!current()) return;
      this.cancel(this.timer);
      this.timer = this.schedule(next, delay);
    };
    if (this.spoken) {
      // A broken/stalled audio element must never trap the conversation.
      later(Math.max(20000, readingTime(text) * 3));
      void this.voice.play(speaker, text, {
        onEnded: () => later(350),
        onFailed: () => later(readingTime(text)),
      });
    } else later(readingTime(text));
  }
  setSpoken(spoken) {
    this.spoken = spoken;
    if (this.active) this.playLine();
  }
  finish() {
    if (!this.active) return;
    const done = this.done;
    this.stop();
    done?.();
  }
  stop() {
    this.active = false;
    this.generation++;
    this.cancel(this.timer);
    this.voice.stop();
    this.done = null;
  }
}
