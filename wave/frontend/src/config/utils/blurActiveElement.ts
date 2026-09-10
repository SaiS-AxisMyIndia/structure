// Web-only concern - see blurActiveElement.web.ts (webpack's .web.ts
// extension priority resolves there for web builds - see webpack.config.js).
// No-op on native, where there's no DOM focus to begin with.
export function blurActiveElement(): void {}
