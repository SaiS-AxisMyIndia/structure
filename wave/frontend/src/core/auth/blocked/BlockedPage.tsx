import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenView } from '../../../config/components/layouts/ScreenView';
import { ResponsiveView } from '../../../config/components/layouts/ResponsiveView';
import { MobileCenter, SizedCenterProps, TabletCenter, WebCenter } from '../../../config/components/layouts/Center';
import { SvgIcon } from '../../../config/components/images/SvgIcon';
import { SvgIcons } from '../../../config/components/images/svg_icons';
import { AppColors } from '../../../config/theme/AppColors';
import { useBlockedController } from './BlockedController';

type BlockedBodyProps = {
  controller: ReturnType<typeof useBlockedController>;
};

export function BlockedBody({ controller }: BlockedBodyProps) {
  const renderBody = (CenterView: (props: SizedCenterProps) => React.ReactElement) => (
    <CenterView style={styles.center}>
      <View style={styles.container}>
        <Text style={styles.title}>Device Blocked</Text>
        <SvgIcon icon={SvgIcons.illDeviceBlocked} width={260} height={220} />
        <Text style={styles.description}>
          <Text style={styles.highlight}>Blocked</Text> devices will be unable to access the{' '}
          <Text style={styles.highlight}>application</Text> until they are{' '}
          <Text style={styles.highlight}>unblocked.</Text>
        </Text>
        <Text style={styles.link} onPress={controller.onSupportPress}>
          Support
        </Text>
      </View>
    </CenterView>
  );

  function mobile() {
    return renderBody(MobileCenter);
  }

  function tablet() {
    return renderBody(TabletCenter);
  }

  function web() {
    return renderBody(WebCenter);
  }

  return <ResponsiveView mobile={mobile()} tablet={tablet()} web={web()} />;
}

export function BlockedPage() {
  const controller = useBlockedController();
  return <ScreenView body={<BlockedBody controller={controller} />} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: AppColors.neutral500,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: AppColors.neutral400,
  },
  highlight: {
    color: AppColors.primary,
    fontWeight: '700',
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.primary,
    textDecorationLine: 'underline',
  },
});
