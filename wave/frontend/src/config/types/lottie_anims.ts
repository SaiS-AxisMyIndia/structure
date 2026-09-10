// Every Lottie animation JSON lives in assets/anim/ and gets imported here
// by name, same convention svg_icons.ts uses for assets/icons/ - add a new
// file there, then one import + one entry below, and it's available to
// LottieX.tsx as `anim={Anims.whatever}` everywhere in the app, same as
// SvgIcon's own `icon={SvgIcons.whatever}`.
import pulse from '../../../assets/anim/pulse.json';
import needs from '../../../assets/anim/anim_needs.json';

export const Anims = {
  pulse,
  needs,
} as const;
