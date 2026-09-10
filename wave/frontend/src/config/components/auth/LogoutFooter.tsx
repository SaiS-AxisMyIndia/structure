import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { AppColors } from '../../theme/AppColors';
import { getAppVersion } from '../../utils/AppVersion';

export type LogoutFooterProps = {
  onLogoutPress: () => void;
};

// "Version X.X.X" + "Logout" block, meant to sit at the end of a page's
// scroll content - used by ProfilePage (user mode) and SettingsSPage
// (surveyor mode), the two places with a sign-out action today.
export function LogoutFooter({ onLogoutPress }: LogoutFooterProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.version}>Version {getAppVersion()}</Text>
      <Pressable style={styles.logoutRow} onPress={onLogoutPress} hitSlop={8}>
        <SvgIcon icon={SvgIcons.logout} size={20} />
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 24,
  },
  version: {
    fontSize: 13,
    color: AppColors.neutral300,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.secondary,
  },
});
