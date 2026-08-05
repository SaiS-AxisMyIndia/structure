declare module '*.svg' {
  import { ImageSourcePropType } from 'react-native';

  const source: ImageSourcePropType;
  export default source;
}

// Only imported on web (see web/fonts.ts) - webpack's asset/resource rule
// resolves a .ttf import to its bundled URL string.
declare module '*.ttf' {
  const url: string;
  export default url;
}
