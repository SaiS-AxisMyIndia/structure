import React, { useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';

export type RemoteIconGradient = {
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  locations?: number[];
};

export type RemoteIconProps = {
  // A repo/API-supplied icon URL (like TopFeatureItem.iconUrl/
  // CategoryGridItem.iconUrl) - not a bundled SVG module, so SvgIcon
  // doesn't apply here.
  uri: string;
  size?: number;
  color?: string;
  // Fills the icon's silhouette with a gradient instead of a flat color -
  // takes precedence over `color` when both are passed. Same gradient
  // shape SvgIcon's own `gradient` prop / Themer.primaryGradient use.
  gradient?: RemoteIconGradient;
};

// Forces every non-transparent pixel of a remote icon image to `color`/
// `gradient`, regardless of the source's own colors - the same masking
// need SvgIcon solves for bundled SVGs (a plain `color` prop can't
// override an asset that bakes its own fill), just for a network image
// instead.
//
// Native, flat color: Image's own `tintColor` style, not MaskedView -
// MaskedView masks a one-shot snapshot of its maskElement, but a network
// Image loads asynchronously, so the snapshot can be taken (and never
// retaken) before any pixels exist, leaving the icon permanently blank
// even once the image finishes loading. `tintColor` is applied by the
// native image view itself on whatever bitmap it currently holds, so it
// recolors correctly the moment the image actually loads.
//
// Native, gradient: `tintColor` can't paint a gradient, so this does need
// MaskedView - GradientRemoteIcon below routes around the same stale-
// snapshot risk by only mounting the MaskedView once a first (invisible)
// Image proves the URI has already finished loading, so the snapshot is
// taken against a warmed/cached image instead of racing its first fetch.
function GradientRemoteIcon({ uri, size, gradient }: { uri: string; size: number; gradient: RemoteIconGradient }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <View style={{ width: size, height: size }}>
      <Image
        source={{ uri }}
        style={[StyleSheet.absoluteFill, styles.hidden]}
        resizeMode="contain"
        onLoad={() => setLoaded(true)}
      />
      {loaded && (
        <MaskedView
          style={StyleSheet.absoluteFill}
          maskElement={<Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="contain" />}
        >
          <LinearGradient
            colors={gradient.colors}
            start={gradient.start ?? { x: 0, y: 0 }}
            end={gradient.end ?? { x: 1, y: 1 }}
            locations={gradient.locations}
            style={StyleSheet.absoluteFill}
          />
        </MaskedView>
      )}
    </View>
  );
}

export function RemoteIcon({ uri, size = 24, color, gradient }: RemoteIconProps) {
  if (Platform.OS === 'web') {
    // react-native-web's Image doesn't forward `tintColor` to the DOM, so
    // the native branch's approach doesn't carry over here - CSS
    // mask-image does the equivalent job, working directly off the remote
    // URL (no fetch/inline needed, unlike SvgIcon.tsx's WebSvgIcon, which
    // only needs that for a bundled module reference that isn't a URL on
    // native). Declarative, so gradient-fill has none of the native
    // async-snapshot race - the browser just re-paints the mask once the
    // image resource loads, no manual retry needed.
    return (
      <div
        // eslint-disable-next-line react-native/no-inline-styles
        style={{
          width: size,
          height: size,
          display: 'inline-block',
          ...(gradient ? { background: `linear-gradient(135deg, ${gradient.colors.join(', ')})` } : { backgroundColor: color }),
          WebkitMaskImage: `url("${uri}")`,
          maskImage: `url("${uri}")`,
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
        }}
      />
    );
  }

  if (gradient) {
    return <GradientRemoteIcon uri={uri} size={size} gradient={gradient} />;
  }

  return <Image source={{ uri }} style={{ width: size, height: size, tintColor: color }} resizeMode="contain" />;
}

const styles = StyleSheet.create({
  hidden: {
    opacity: 0,
  },
});
