import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors } from '../../theme/AppColors';

export type ScreenViewProps = {
  appbar?: React.ReactNode;
  bottomBar?: React.ReactNode;
  body: React.ReactNode;
  backgroundColor?: (typeof AppColors)[keyof typeof AppColors];
};

export function ScreenView({
  appbar,
  bottomBar,
  body,
  backgroundColor = AppColors.neutral,
}: ScreenViewProps) {
  const insets = useSafeAreaInsets();
  const topColor = appbar ? AppColors.white : backgroundColor;
  const bottomColor = bottomBar ? AppColors.white : backgroundColor;

  return (
    <>
      {!appbar && <StatusBar backgroundColor={topColor} barStyle="dark-content" />}
      {/* StatusBar's backgroundColor prop is Android-only; on iOS the status bar
          is transparent, so this view is what actually paints behind it. */}
      <View style={{ height: insets.top, backgroundColor: topColor }} />
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['left', 'right']}>
        {appbar}
        {body}
        {bottomBar}
      </SafeAreaView>
      {/* Same reasoning as the top strip: the safe-area inset behind the home
          indicator / gesture bar should match bottomBar's own background. */}
      <View style={{ height: insets.bottom, backgroundColor: bottomColor }} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});