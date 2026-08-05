import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { AppColors } from '../../theme/AppColors';
import { Themer } from '../../theme/Themer';
import { SvgIcon } from './SvgIcon';
import { SvgIcons } from './svg_icons';

// Remembers which remote URIs have already loaded successfully during this
// app session. Re-mounting the same image later (e.g. scrolling a list
// item out of view and back) shows it immediately instead of flashing the
// shimmer again - the OS already has it disk-cached, this just skips our
// own loading UI for it too.
const loadedUris = new Set<string>();

function uriOf(source: ImageSourcePropType): string | undefined {
  if (typeof source !== 'object' || source == null) return undefined;
  return Array.isArray(source) ? source[0]?.uri : source.uri;
}

type Status = 'loading' | 'loaded' | 'error';

export type ImageLoaderProps = {
  source: ImageSourcePropType;
  style?: StyleProp<ImageStyle>;
  // Sizes the whole box (image, shimmer, and error view alike) to this
  // ratio, same convention as BannerNewsTile/NewsDetailsHeader. Only takes
  // effect if `style` doesn't already give the container a fixed height.
  aspectRatio?: number;
  // Rounds the whole box (image, shimmer, and error view alike), via the
  // same Themer.iosRadius() convention used elsewhere in the app.
  borderRadius?: number;
  maxWidth?: number;
  maxHeight?: number;
  minWidth?: number;
  minHeight?: number;
};

export function ImageLoader({ source, style, aspectRatio, borderRadius, maxWidth, maxHeight, minWidth, minHeight }: ImageLoaderProps) {
  const uri = uriOf(source);
  // Local (require()'d) assets are bundled, not fetched, so they have no
  // real loading state or anything worth caching-by-uri.
  const isRemote = uri != null;

  const [shouldRender, setShouldRender] = useState(!isRemote);
  const [status, setStatus] = useState<Status>(!isRemote || loadedUris.has(uri as string) ? 'loaded' : 'loading');

  useEffect(() => {
    setStatus(!isRemote || loadedUris.has(uri as string) ? 'loaded' : 'loading');
  }, [uri, isRemote]);

  useEffect(() => {
    if (shouldRender) return;
    // Defers mounting the actual <Image> (and so its network request) by a
    // frame, so a screen that renders many image tiles at once doesn't
    // fire every request on the same tick as the initial layout/transition.
    const task = requestAnimationFrame(() => setShouldRender(true));
    return () => cancelAnimationFrame(task);
  }, [shouldRender]);

  const onLoad = () => {
    if (uri) loadedUris.add(uri);
    setStatus('loaded');
  };

  return (
    <View
      style={[
        styles.container,
        style,
        aspectRatio != null && { aspectRatio },
        maxWidth != null && { maxWidth },
        maxHeight != null && { maxHeight },
        minWidth != null && { minWidth },
        minHeight != null && { minHeight },
        borderRadius != null && Themer.iosRadius(borderRadius),
      ]}
    >
      {shouldRender && status !== 'error' ? (
        <Image
          source={source}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onLoad={onLoad}
          onError={() => setStatus('error')}
        />
      ) : null}
      {shouldRender && status === 'loading' ? <Shimmer /> : null}
      {status === 'error' ? <ErrorView /> : null}
    </View>
  );
}

function Shimmer() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
      ]}
    >
      <LinearGradient
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        colors={[AppColors.neutral, AppColors.neutral100]}
      />
    </Animated.View>
  );
}

function ErrorView() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.errorView]}>
      <SvgIcon icon={SvgIcons.close} size={20} color={AppColors.neutral300} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: AppColors.neutral,
  },
  errorView: {
    backgroundColor: AppColors.neutral,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
