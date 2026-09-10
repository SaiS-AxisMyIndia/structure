export type MediaHandle = object;

// Every currently-registered player, keyed by its own stable handle. This
// used to track only a single "last active" handle/reset pair - correct in
// theory (a new player starting reset whatever was last registered), but
// it meant exactly one slipped-through registration (a race between two
// nearly-simultaneous starts, a stale closure, anything that registered
// without going through this exact slot) was enough for two players to end
// up playing at once with no way to notice. Tracking every live
// registration and resetting all of them - not just whichever one happened
// to be "last" - means a second player can never coexist with a first
// regardless of how it got registered.
const active = new Map<MediaHandle, () => void>();

export function notifyPlaybackStarted(handle: MediaHandle, reset: () => void): void {
  active.forEach((otherReset, otherHandle) => {
    if (otherHandle !== handle) {
      otherReset();
    }
  });
  active.clear();
  active.set(handle, reset);
}

export function notifyPlaybackStopped(handle: MediaHandle): void {
  active.delete(handle);
}
