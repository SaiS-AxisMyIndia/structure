import React from 'react';
import { Pressable, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { AppColors } from '../../theme/AppColors';
import { Themer } from '../../theme/Themer';
import { AppConstants } from '../../constants/AppConstants';
import { Routes } from '../../routes/registry';
import { AStorage } from '../../storage/AStorage';
import { GradientText } from './GradientText';
import { BottomType, TABS } from '../bottombar/BottomBar';

export type MainBarProps = {
  value?: BottomType;
  onLogoPress?: () => void;
  onFontPress?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onNavChange?: (value: BottomType) => void;
};

export function MainBar({
  value,
  onLogoPress,
  onFontPress,
  onNotificationPress,
  onProfilePress,
  onNavChange,
}: MainBarProps) {
  const { width } = useWindowDimensions();
  const showWebNav = width >= AppConstants.breakPoints.tablet;
  const storedUser = AStorage.useStoredUser();
  const displayName = storedUser?.name ?? 'User';

  const handleNavChange = (type: BottomType) => {
    if (onNavChange) {
      onNavChange(type);
    } else {
      Routes.user[type].navigate();
    }
  };

  return (
        <>
      <StatusBar backgroundColor={AppColors.white} barStyle="dark-content" />

    <View style={styles.container}>
      <Pressable onPress={onLogoPress ?? (() => Routes.user.home.navigate())} hitSlop={8}>
        <SvgIcon icon={SvgIcons.logo} size={44} />
      </Pressable>

      <View style={styles.greeting}>
        <Text style={styles.greetingLabel} numberOfLines={1}>
          Hello
        </Text>
        <GradientText style={styles.userName} numberOfLines={1}>
          {displayName}
        </GradientText>
      </View>

      {showWebNav && (
        <View style={styles.webNav}>
          {TABS.map(tab => {
            const active = tab.type === value;
            return (
              <Pressable key={tab.type} onPress={() => handleNavChange(tab.type)} hitSlop={8}>
                <Text style={[styles.webNavLabel, active && styles.webNavLabelActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <View style={styles.actions}>
        <Pressable onPress={onFontPress} hitSlop={8} style={styles.action}>
          <SvgIcon icon={SvgIcons.font} size={24} />
        </Pressable>
        <Pressable
          onPress={onNotificationPress ?? (() => Routes.user.notification.navigate())}
          hitSlop={8}
          style={styles.action}
        >
          <SvgIcon icon={SvgIcons.notification} size={26} />
        </Pressable>
        <Pressable
          onPress={onProfilePress ?? (() => Routes.user.profile.navigate())}
          hitSlop={8}
          style={styles.action}
        >
          <SvgIcon icon={SvgIcons.profile} size={34} />
        </Pressable>
      </View>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  _container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    paddingHorizontal: 10,
    paddingVertical: 8,
    ...Themer.bottomLine(),
  },
  get container() {
    return this._container;
  },
  set container(value) {
    this._container = value;
  },
  greeting: {
    flex: 1,
    marginHorizontal: 10,
  },
  greetingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A6308C',
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 1,
  },
  webNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginRight: 20,
  },
  webNavLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.neutral400,
  },
  webNavLabelActive: {
    color: AppColors.primary,
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
