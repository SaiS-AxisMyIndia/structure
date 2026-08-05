import React from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { AppColors } from '../../theme/AppColors';
import { Themer } from '../../theme/Themer';
import { Routes } from '../../routes/registry';

export type MainBarProps = {
  userName: string;
  greeting?: string;
  onLogoPress?: () => void;
  onFontPress?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
};

export function MainBar({
  userName,
  greeting = 'Hello',
  onLogoPress,
  onFontPress,
  onNotificationPress,
  onProfilePress,
}: MainBarProps) {
  return (
        <>
      <StatusBar backgroundColor={AppColors.white} barStyle="dark-content" />

    <View style={styles.container}>
      <Pressable onPress={onLogoPress ?? (() => Routes.user.home.navigate())} hitSlop={8}>
        <SvgIcon icon={SvgIcons.logo} size={44} />
      </Pressable>

      <View style={styles.greeting}>
        <Text style={styles.greetingLabel} numberOfLines={1}>
          {greeting}
        </Text>
        <MaskedView
          maskElement={
            <Text style={styles.userName} numberOfLines={1}>
              {userName}
            </Text>
          }
        >
          <LinearGradient
            start={Themer.primaryGradient.start}
            end={Themer.primaryGradient.end}
            colors={Themer.primaryGradient.colors}
            locations={Themer.primaryGradient.locations}
          >
            <Text style={[styles.userName, styles.userNameMaskSpacer]} numberOfLines={1}>
              {userName}
            </Text>
          </LinearGradient>
        </MaskedView>
      </View>

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
  userNameMaskSpacer: {
    opacity: 0,
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
