import React from 'react';
import { Platform, StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import { Themer } from '../../theme/Themer';

export type GradientTextProps = {
  children: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

// Fills `children` with Themer.primaryGradient instead of a solid color.
// @react-native-masked-view's own web fallback (js/MaskedView.web.js) is a
// no-op that renders `maskElement` unmasked and drops `children` entirely -
// so on web there'd be no gradient at all, just plain text. Web instead gets
// the same look via the standard CSS `background-clip: text` trick, which
// react-native-web passes straight through to the DOM style.
export function GradientText({ children, style, numberOfLines }: GradientTextProps) {
  if (Platform.OS === 'web') {
    const { start, end, colors } = Themer.primaryGradient;
    const angleDeg = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI) + 90;
    const webGradientStyle = {
      backgroundImage: `linear-gradient(${angleDeg}deg, ${colors.join(', ')})`,
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      color: 'transparent',
      // Web-only CSS passthrough properties - not part of RN's TextStyle
      // type, but react-native-web forwards unknown style keys as-is.
    } as unknown as TextStyle;

    return (
      <Text style={[style, webGradientStyle]} numberOfLines={numberOfLines}>
        {children}
      </Text>
    );
  }

  return (
    <MaskedView
      maskElement={
        <Text style={style} numberOfLines={numberOfLines}>
          {children}
        </Text>
      }
    >
      <LinearGradient
        start={Themer.primaryGradient.start}
        end={Themer.primaryGradient.end}
        colors={Themer.primaryGradient.colors}
        locations={Themer.primaryGradient.locations}
      >
        <Text style={[style, styles.maskSpacer]} numberOfLines={numberOfLines}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  maskSpacer: {
    opacity: 0,
  },
});
