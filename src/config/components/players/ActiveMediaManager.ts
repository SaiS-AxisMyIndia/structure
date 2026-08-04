export type MediaHandle = object;

let activeHandle: MediaHandle | null = null;
let activeReset: (() => void) | null = null;

export function notifyPlaybackStarted(handle: MediaHandle, reset: () => void): void {
  if (activeHandle && activeHandle !== handle) {
    activeReset?.();
  }
  activeHandle = handle;
  activeReset = reset;
}

export function notifyPlaybackStopped(handle: MediaHandle): void {
  if (activeHandle === handle) {
    activeHandle = null;
    activeReset = null;
  }
}
