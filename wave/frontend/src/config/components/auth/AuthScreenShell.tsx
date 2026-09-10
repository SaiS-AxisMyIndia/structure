import React from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { ScreenView } from '../layouts/ScreenView';
import { ResponsiveView } from '../layouts/ResponsiveView';
import { MobileCenter } from '../layouts/Center';
import { AppColors } from '../../theme/AppColors';
import { Themer } from '../../theme/Themer';
import { AppConstants } from '../../constants/AppConstants';

export type AuthScreenShellProps = {
  // Scrollable content (header, form fields) - rendered inside
  // ScreenView's `body`.
  renderFields: () => React.ReactNode;
  // Submit button + terms agreement - rendered in ScreenView's `bottomBar`
  // slot on mobile (pinned to the true bottom of the screen) or inline at
  // the end of the dialog card on tablet/web.
  renderActions: () => React.ReactNode;
};

// Shared page shell for LoginPage's steps (mobile entry and OTP):
// mobile gets a plain full-bleed page with actions pinned to the bottom;
// tablet/web instead float everything together as one centered "dialog
// box" card over a neutral backdrop, since a full-width form reads oddly
// once there's that much side margin to fill.
export function AuthScreenShell({ renderFields, renderActions }: AuthScreenShellProps) {
  const { width } = useWindowDimensions();
  // Same threshold ResponsiveView itself switches on - hoisted here too so
  // ScreenView's backdrop can differ once tablet/web render as a dialog
  // (mobile keeps the plain full-bleed white background it always had).
  const isDialog = width >= AppConstants.breakPoints.mobile;

  // Mobile: form fields scroll in ScreenView's `body`; actions live in its
  // `bottomBar` slot instead, so they stay pinned to the screen's bottom
  // (ScreenView already paints the safe-area strip below it to match)
  // rather than trailing wherever the scroll content happens to end.
  function mobileBody() {
    return (
      <ScrollView style={styles.scrollFill} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <MobileCenter>{renderFields()}</MobileCenter>
      </ScrollView>
    );
  }

  function mobileBottomBar() {
    return (
      <View style={styles.bottomBar}>
        <MobileCenter>{renderActions()}</MobileCenter>
      </View>
    );
  }

  // Tablet/web: floats as a centered card (shadow + rounded corners, capped
  // width) - deliberately narrower than TabletCenter/WebCenter's own
  // maxWidth (built for content pages, not a login-style card), so this
  // skips those and sizes itself directly. Self-contained (no separate
  // sticky footer) since it's a bounded card, not a full page to pin
  // things to.
  function dialog() {
    return (
      <ScrollView contentContainerStyle={styles.dialogContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.dialogCard}>
          {renderFields()}
          <View style={styles.dialogActions}>{renderActions()}</View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScreenView
      backgroundColor={isDialog ? AppColors.neutral : AppColors.white}
      body={<ResponsiveView mobile={mobileBody()} tablet={dialog()} web={dialog()} />}
      bottomBar={isDialog ? undefined : mobileBottomBar()}
    />
  );
}

const styles = StyleSheet.create({
  scrollFill: {
    flex: 1,
  },
  container: {
    padding: 24,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: AppColors.white,
  },
  dialogContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 32,
    ...Themer.shadow(AppColors.neutral200),
  },
  dialogActions: {
    marginTop: 32,
  },
});
