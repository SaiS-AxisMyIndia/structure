import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';

// Bundled app-store art - see assets/store/ (banner_gg.png is its sibling).
// Raster, so require() + plain <Image>, same as EmptyListView.tsx's
// illustration, rather than the svg_icons.ts pipeline (SVG-only).
const WAVE_LOGO = require('../../../../assets/store/logo_wave.png');
const LOGO_SIZE = 96; // source asset is a square 512x512 canvas

// Each entry here is its own line (not left to wrap naturally) since the
// design calls for the "gerogo"/"wave" color split to land on one line and
// "water supply chain" on the next, regardless of screen width.
const HEADLINE_LINES: { text: string; color?: string }[][] = [
  [{ text: 'Welcome to ' }, { text: 'gerogo', color: AppColors.primary }, { text: ' wave', color: AppColors.teritary }],
  [{ text: 'water supply chain' }],
];

// Logo + welcome headline shared by every step of the auth flow (LoginPage)
// - identical on both the mobile-entry and OTP steps, so it's a single
// component rather than copy-pasted per step.
export function AuthHeader() {
  return (
    <>
      <Image source={WAVE_LOGO} style={styles.logo} resizeMode="contain" />

      <View style={styles.headlineColumn}>
        {HEADLINE_LINES.map((line, lineIndex) => (
          <View key={lineIndex} style={styles.headlineLine}>
            {line.map((chunk, chunkIndex) => (
              <Text key={chunkIndex} style={[styles.headlineText, chunk.color && { color: chunk.color }]}>
                {chunk.text}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignSelf: 'center',
    marginTop: 8,
  },
  headlineColumn: {
    marginTop: 12,
    alignItems: 'center',
  },
  headlineLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  headlineText: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    textAlign: 'center',
    color: AppColors.neutral900,
  },
});
