import React from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { AppColors } from '../../theme/AppColors';
import { Themer } from '../../theme/Themer';
import { Routes } from '../../routes/registry';
import { GradientText } from './GradientText';

export type MainSBarProps = {
  orgName?: string;
  roleLabel?: string;
  offline: boolean;
  onModeChange?: (offline: boolean) => void;
  onLogoPress?: () => void;
  onFontPress?: () => void;
};

export function MainSBar({
  orgName = 'Axis My India',
  roleLabel = 'Surveyor',
  offline,
  onModeChange,
  onLogoPress,
  onFontPress,
}: MainSBarProps) {
  return (
    <>
      <StatusBar backgroundColor={AppColors.white} barStyle="dark-content" />

      <View style={styles.container}>
        <Pressable onPress={onLogoPress ?? (() => Routes.surveyor.home.navigate())} hitSlop={8}>
          <SvgIcon icon={SvgIcons.logo} size={44} />
        </Pressable>

        <View style={styles.info}>
          <Text style={styles.roleLabel} numberOfLines={1}>
            {roleLabel}
          </Text>
          <GradientText style={styles.orgName} numberOfLines={1}>
            {orgName}
          </GradientText>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={onFontPress} hitSlop={8} style={styles.action}>
            <SvgIcon icon={SvgIcons.font} size={22} />
          </Pressable>
          <Pressable onPress={() => onModeChange?.(!offline)} hitSlop={8}>
            <SvgIcon icon={offline ? SvgIcons.offline : SvgIcons.online} size={22} />
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    paddingHorizontal: 10,
    paddingVertical: 8,
    ...Themer.bottomLine(),
  },
  info: {
    flex: 1,
    marginHorizontal: 10,
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A6308C',
  },
  orgName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  action: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
