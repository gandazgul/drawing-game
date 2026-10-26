// One recording at a time. Cancellation never waits for a pending play() promise.
export class VoicePlayer {
  constructor({ resolve, createAudio, onUnavailable = () => {} }) {
    this.resolve = resolve;
    this.createAudio = createAudio;
    this.onUnavailable = onUnavailable;
    this.current = null;
  }

  stop() {
    const audio = this.current;
    this.current = null;
    if (!audio) return;
    audio.onerror = null;
    audio.onended = null;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    audio.remove();
  }

  async play(speaker, text, { onEnded = () => {}, onFailed = () => {} } = {}) {
    this.stop();
    const url = this.resolve(speaker, text);
    if (!url) {
      this.onUnavailable();
      onFailed();
      return false;
    }
    const audio = this.createAudio();
    this.current = audio;
    audio.src = url;
    audio.preload = "auto";
    const failed = () => {
      if (this.current !== audio) return;
      this.stop();
      this.onUnavailable();
      onFailed();
    };
    audio.onerror = failed;
    audio.onended = () => {
      if (this.current === audio) {
        this.stop();
        onEnded();
      }
    };
    try {
      await audio.play();
      return this.current === audio;
    } catch {
      failed();
      return false;
    }
  }
}
