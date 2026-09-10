import { useEffect, useState } from 'react';
import { DeviceInfo } from './DeviceInfo';

export type DeviceTierValue = 'low' | 'mid' | 'high';

// <3GB - entry-level/Android-Go band still sold new in this app's target
// markets (see brands.ts); 3-6GB - current mainstream mid-range band;
// >=6GB - flagship Android + effectively all iOS devices capable of
// running a current iOS version. getTotalMemory() (see DeviceInfo.ts's own
// getMemoryInfo()) returns real physical RAM on both platforms, so one
// shared table works cross-platform - no separate iOS thresholds needed.
const RAM_THRESHOLDS_GB = {
  low: 3,
  mid: 6,
} as const;

function classify(totalGB: number): DeviceTierValue {
  if (totalGB < RAM_THRESHOLDS_GB.low) {return 'low';}
  if (totalGB < RAM_THRESHOLDS_GB.mid) {return 'mid';}
  return 'high';
}

// Device RAM is invariant for the life of the install, and getTotalMemory()
// is a fast native call (not disk I/O) - a module-scope promise cache is
// enough, no AStorage/AsyncStorage persistence needed (that would just add
// an invalidation story for zero real benefit).
let tierPromise: Promise<DeviceTierValue> | null = null;
// Last-resolved value, set the instant tierPromise settles - lets
// getTierSync()/isLow()/etc return synchronously once warm, instead of
// every call site re-awaiting an already-settled promise.
let resolvedTier: DeviceTierValue | null = null;

async function resolveTier(): Promise<DeviceTierValue> {
  try {
    const { totalGB } = await DeviceInfo.getMemoryInfo();
    return classify(totalGB);
  } catch {
    // A native RAM read failing shouldn't leave tierPromise permanently
    // rejected (every future getTier()/warm() call would then also
    // reject) - fall back to the same 'high' default getTierSync() uses
    // pre-resolve, same "default open" reasoning: worse to wrongly
    // degrade a capable device than to skip gating on the rare device
    // this call fails on.
    return 'high';
  }
}

export const DeviceTier = {
  // Primary async entry point - safe to call from anywhere (controllers,
  // hooks, plain functions), always returns the same resolved tier after
  // the first call.
  getTier: (): Promise<DeviceTierValue> => {
    if (!tierPromise) {
      tierPromise = resolveTier().then(tier => {
        resolvedTier = tier;
        return tier;
      });
    }
    return tierPromise;
  },

  // Call once, early, from App.tsx to kick off detection before the first
  // screen mounts, so useDeviceTier()/getTierSync() below almost never see
  // the unresolved 'high' default in practice. Fire-and-forget is safe -
  // resolveTier() above never rejects.
  warm: (): void => {
    DeviceTier.getTier();
  },

  // Synchronous read for imperative call sites (e.g. SvgIcon.tsx, a leaf
  // render function called too often to subscribe via useDeviceTier()).
  // Returns 'high' before async detection resolves - a very short-lived,
  // self-correcting window given warm() runs at app boot, and strictly
  // safer than a false "low" flash degrading UI on a high-end device on
  // first paint.
  getTierSync: (): DeviceTierValue => resolvedTier ?? 'high',

  isLow: (): boolean => DeviceTier.getTierSync() === 'low',
  isMid: (): boolean => DeviceTier.getTierSync() === 'mid',
  isHigh: (): boolean => DeviceTier.getTierSync() === 'high',
};

// The single primary API components should use for tier-gated behavior -
// deliberately not a ResponsiveView-style {low, mid, high} component: that
// pattern swaps whole subtrees per breakpoint, while every tier-gated
// feature here (autoPlay, loop, page size, ...) is "flip one prop on an
// otherwise-identical subtree", which fits a value-returning hook better.
//
// Returns DeviceTier.getTierSync() immediately (default 'high' pre-warm),
// then re-renders once with the real resolved value if detection was still
// pending on mount. In practice, given DeviceTier.warm() runs at App.tsx
// module load (before any screen mounts), every call site sees the
// resolved value on its very first render and this effect is a no-op
// confirmation, not a visible flip.
export function useDeviceTier(): DeviceTierValue {
  const [tier, setTier] = useState<DeviceTierValue>(DeviceTier.getTierSync());

  useEffect(() => {
    let cancelled = false;
    DeviceTier.getTier().then(resolved => {
      if (!cancelled) {setTier(resolved);}
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return tier;
}
