import React from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { AppConstants } from '../../constants/AppConstants';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { ElevatedButton } from '../buttons/ElevatedButton';
import { BorderButton } from '../buttons/BorderButton';
import { useSheetTransition } from '../layouts/useSheetTransition';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type LogoutSheetProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

// Confirmation sheet shown before actually signing out - both sign-out
// entry points (ProfilePage's user LogoutFooter, SettingsSPage's surveyor
// LogoutFooter) share this one component rather than each rolling its own.
// Same bottom-sheet shell as ChooseModeSheet.tsx (Modal + backdrop
// press-to-dismiss + width capped to AppConstants.maxWidth.mobile).
export function LogoutSheet({ visible, onClose, onConfirm }: LogoutSheetProps) {
  const { backdropOpacity, sheetTranslateY } = useSheetTransition(visible);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <AnimatedPressable style={[styles.backdrop, { opacity: backdropOpacity }]} onPress={onClose} />
      <Animated.View style={[styles.sheetPosition, { transform: [{ translateY: sheetTranslateY }] }]}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Logout</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <SvgIcon icon={SvgIcons.close} size={20} color={AppColors.neutral500} />
            </Pressable>
          </View>

          <Text style={styles.description}>
            Your records are stored on this device and may be lost when you log out. Make sure your
            data is synced or backed up before continuing.
          </Text>

          <View style={styles.footer}>
            <BorderButton label="Cancel" onPress={onClose}  />
            <ElevatedButton label="Logout Anyway" onPress={onConfirm}  />
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  sheetPosition: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: AppConstants.maxWidth.mobile,
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.secondary100,
    padding: 20,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.neutral500,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    color: AppColors.neutral400,
    marginTop: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
});
