class Sound {
  constructor(source, basePathOrCallback, maybeCallback) {
    const callback = typeof basePathOrCallback === 'function' ? basePathOrCallback : maybeCallback;
    this._audio = new Audio(source);
    this._audio.addEventListener('canplaythrough', () => callback && callback(null), { once: true });
    this._audio.addEventListener(
      'error',
      () => callback && callback(this._audio.error || new Error('Failed to load audio')),
      { once: true },
    );
    this._audio.load();

    // `new Sound(...)` runs synchronously inside the Pressable's onPress
    // handler (the user gesture), but the real `play()` call only happens
    // later, asynchronously, once 'canplaythrough' fires - by then the
    // browser's gesture-activation window has long expired, so that later
    // play() is silently rejected (autoplay policy) and swallowed by its own
    // .catch(). Playing (muted) + immediately pausing here, synchronously
    // within this gesture-triggered constructor, "unlocks" this element so
    // browsers allow the later async play() to actually start audio.
    const wasMuted = this._audio.muted;
    this._audio.muted = true;
    Promise.resolve(this._audio.play())
      .catch(() => {})
      .then(() => {
        this._audio.pause();
        this._audio.currentTime = 0;
        this._audio.muted = wasMuted;
      });
  }

  play(onEnd) {
    this._audio.onended = () => onEnd && onEnd(true);
    this._audio.play().catch(() => onEnd && onEnd(false));
  }

  pause() {
    this._audio.pause();
  }

  stop() {
    this._audio.pause();
    this._audio.currentTime = 0;
  }

  release() {
    this._audio.pause();
    this._audio.src = '';
  }

  getDuration() {
    return this._audio.duration || 0;
  }

  getCurrentTime(callback) {
    callback(this._audio.currentTime);
  }

  setCurrentTime(seconds) {
    this._audio.currentTime = seconds;
  }

  isPlaying() {
    return !this._audio.paused && !this._audio.ended;
  }

  static setCategory() {
    // No-op on web; browsers manage audio sessions themselves.
  }
}

module.exports = Sound;
module.exports.default = Sound;