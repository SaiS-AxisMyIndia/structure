/// <reference lib="dom" />
// This project's tsconfig omits the "dom" lib project-wide - window/document
// don't exist on native, and every other file in this repo benefits from
// tsc catching an accidental reference to one. This file is web-only (see
// blurActiveElement.ts's native no-op sibling), so it pulls dom types in
// for itself alone.

// react-navigation hides the outgoing screen via aria-hidden once a new one
// is pushed on top of it; if a Pressable (e.g. whatever button triggered
// this navigation) still holds DOM focus at that point, the browser warns
// ("Blocked aria-hidden on an element because its descendant retained
// focus") since a hidden subtree should never contain focus. Blurring
// whatever's currently focused right before dispatching the navigation
// sidesteps that entirely.
export function blurActiveElement(): void {
  (document.activeElement as HTMLElement | null)?.blur?.();
}
