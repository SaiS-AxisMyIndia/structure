declare module '*.svg' {
  // Native (iOS/Android, via Metro + react-native-svg-transformer - see
  // metro.config.js): a .svg import is a real react-native-svg component,
  // compiled from the file at build time.
  //
  // Web (via webpack's asset/resource rule - see webpack.config.js): it's
  // actually a plain URL string at runtime, not a component. SvgIcon.tsx's
  // web branch already casts around that mismatch (`icon as unknown as
  // string`), so this type only needs to describe the native shape.
  import { FC } from 'react';
  import { SvgProps } from 'react-native-svg';

  const content: FC<SvgProps>;
  export default content;
}

// Only imported on web (see web/fonts.ts) - webpack's asset/resource rule
// resolves a .ttf import to its bundled URL string.
declare module '*.ttf' {
  const url: string;
  export default url;
}
