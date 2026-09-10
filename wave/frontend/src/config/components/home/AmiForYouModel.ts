import { ComponentType } from 'react';
import { SvgProps } from 'react-native-svg';

// Same split as HospitalInfoCardItem.illustration - a bundled SVG
// illustration (transparent, e.g. SvgIcons.illHospital1) or a plain
// transparent PNG (network/local) - see AmiForYouTile's rendering split.
export type AmiForYouThumbnail =
  | { kind: 'illustration'; illustration: ComponentType<SvgProps> }
  | { kind: 'image'; image: string };

export type AmiForYouItem = {
  id: string;
  title: string;
  description: string;
  // Pre-formatted display string (e.g. "12:12 AM") - unlike NewsBase/
  // NotificationBase's `time`, this isn't run through DateFormatter.smart()
  // since the design shows a clock time, not a relative day label.
  time: string;
  thumbnail: AmiForYouThumbnail;
  route?: string;
};
