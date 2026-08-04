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