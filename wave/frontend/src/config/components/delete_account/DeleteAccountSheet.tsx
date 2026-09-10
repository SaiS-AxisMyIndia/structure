import React from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { AppConstants } from '../../constants/AppConstants';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { BorderButton } from '../buttons/BorderButton';
import { useSheetTransition } from '../layouts/useSheetTransition';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type DeleteAccountSheetProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  submitting?: boolean;
};

// Native size of ill_delete.svg is 150x151 - rendered close to that,
// scaled down slightly to leave room for the sheet's own padding.
const ILLUSTRATION_WIDTH = 140;
const ILLUSTRATION_HEIGHT = ILLUSTRATION_WIDTH * (151 / 150);

// Final confirmation before DeleteAccountController.onDeletePress actually
// calls DeleteAccountCases - "Delete Now" is what triggers it, so the page
// itself never deletes on a single tap. Same bottom-sheet shell as
// LogoutSheet.tsx/ApplyJobSheet.tsx (Modal + backdrop press-to-dismiss +
// width capped to AppConstants.maxWidth.mobile).
export function DeleteAccountSheet({ visible, onClose, onConfirm, submitting }: DeleteAccountSheetProps) {
  const { backdropOpacity, sheetTranslateY } = useSheetTransition(visible);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <AnimatedPressable style={[styles.backdrop, { opacity: backdropOpacity }]} onPress={onClose} />
      <Animated.View style={[styles.sheetPosition, { transform: [{ translateY: sheetTranslateY }] }]}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Delete Profile</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <SvgIcon icon={SvgIcons.close} size={20} color={AppColors.neutral500} />
            </Pressable>
          </View>

          <View style={styles.illustrationWrap}>
            <SvgIcon icon={SvgIcons.illDelete} width={ILLUSTRATION_WIDTH} height={ILLUSTRATION_HEIGHT} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Are you sure? This account, features and service can't be recovered after deletion.
            </Text>
            <BorderButton
              label={submitting ? 'Deleting...' : 'Delete Now'}
              onPress={onConfirm}
              disabled={submitting}
              paddingHorizontal={20}
              paddingVertical={10}
              fontSize={14}
            />
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
  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 24,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: AppColors.neutral400,
  },
});
