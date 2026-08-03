import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { AppColors } from '../../theme/AppColors';
import { Routes } from '../../routes/registry';

export type TitleBarProps = {
  title: string;
  onBackPress?: () => void;
  onFontPress?: () => void;
  onLogoPress?: () => void;
};

export function TitleBar({ title, onBackPress, onFontPress, onLogoPress }: TitleBarProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title} numberOfLines={1} pointerEvents="none">
        {title}
      </Text>

      <View style={styles.row}>
        <Pressable onPress={onBackPress ?? (() => Routes.back())} hitSlop={8}>
          <SvgIcon icon={SvgIcons.back} size={22} />
        </Pressable>

        <View style={styles.actions}>
          <Pressable onPress={onFontPress} hitSlop={8}>
            <SvgIcon icon={SvgIcons.font} size={22} />
          </Pressable>
          <Pressable onPress={onLogoPress ?? (() => Routes.user.home.navigate())} hitSlop={8}>
            <SvgIcon icon={SvgIcons.logo} size={32} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: AppColors.white,
  },
  title: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
});
