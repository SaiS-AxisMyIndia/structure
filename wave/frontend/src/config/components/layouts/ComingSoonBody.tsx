import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';

export type ComingSoonBodyProps = {
  label: string;
};

// Placeholder tab body for a bottom-bar destination whose real page hasn't
// been built yet (see BottomBarView.tsx's BODIES map) - keeps the tab itself
// in place instead of removing it from the bar, so the surrounding chrome
// (MainBar/BottomBar) doesn't need to change shape once the real page lands.
export function ComingSoonBody({ label }: ComingSoonBodyProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{label}</Text>
      <Text style={styles.subtitle}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.neutral500,
  },
  subtitle: {
    fontSize: 14,
    color: AppColors.neutral400,
  },
});
