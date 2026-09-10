import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { AppColors } from '../../theme/AppColors';
import { Routes } from '../../routes/registry';
import { Themer } from '../../theme/Themer';

export type WebViewBarProps = {
  title: string;
  onClosePress?: () => void;
  onLogoPress?: () => void;
};

export function WebViewBar({ title, onClosePress, onLogoPress }: WebViewBarProps) {
  return (
    <View style={styles.container}>
      <Pressable onPress={onClosePress ?? (() => Routes.back())} hitSlop={8}>
        <SvgIcon icon={SvgIcons.close} size={22} />
      </Pressable>

      <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail" pointerEvents="none">
        {title}
      </Text>

      <Pressable onPress={onLogoPress ?? (() => Routes.user.home.navigate())} hitSlop={8}>
        <SvgIcon icon={SvgIcons.logo} size={32} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 14,
    backgroundColor: AppColors.white,
    ...Themer.bottomLine(),
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.primary,
  },
});
